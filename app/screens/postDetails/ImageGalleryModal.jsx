import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ZoomableImage = ({ uri }) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const savedRotation = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 0.5), 5);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (savedScale.value < 1) {
        scale.value = withSpring(1, { damping: 15 });
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const rotationGesture = Gesture.Rotation()
    .onUpdate((e) => {
      rotation.value = savedRotation.value + e.rotation;
    })
    .onEnd(() => {
      savedRotation.value = rotation.value;
      // Snap to nearest 90 degrees when close
      const degrees = (rotation.value * 180) / Math.PI;
      const snappedDegrees = Math.round(degrees / 90) * 90;
      const snappedRadians = (snappedDegrees * Math.PI) / 180;
      rotation.value = withSpring(snappedRadians, { damping: 15 });
      savedRotation.value = snappedRadians;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (savedScale.value > 1) {
        const maxX = (SCREEN_WIDTH * (savedScale.value - 1)) / 2;
        const maxY = (SCREEN_HEIGHT * 0.4 * (savedScale.value - 1)) / 2;
        translateX.value = Math.max(-maxX, Math.min(maxX, savedTranslateX.value + e.translationX));
        translateY.value = Math.max(-maxY, Math.min(maxY, savedTranslateY.value + e.translationY));
      }
    })
    .onEnd((e) => {
      if (savedScale.value > 1) {
        const maxX = (SCREEN_WIDTH * (savedScale.value - 1)) / 2;
        const maxY = (SCREEN_HEIGHT * 0.4 * (savedScale.value - 1)) / 2;
        savedTranslateX.value = Math.max(-maxX, Math.min(maxX, savedTranslateX.value + e.translationX));
        savedTranslateY.value = Math.max(-maxY, Math.min(maxY, savedTranslateY.value + e.translationY));
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (savedScale.value > 1 || savedRotation.value !== 0) {
        scale.value = withSpring(1, { damping: 15 });
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        rotation.value = withSpring(0, { damping: 15 });
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        savedRotation.value = 0;
      } else {
        scale.value = withSpring(2.5, { damping: 15 });
        savedScale.value = 2.5;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    rotationGesture,
    Gesture.Race(doubleTapGesture, panGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}rad` },
    ],
  }));

  return (
    <View style={styles.imageWrapper}>
      <GestureDetector gesture={composedGesture}>
        <Animated.Image
          source={{ uri }}
          style={[styles.galleryImage, animatedStyle]}
          resizeMode="contain"
        />
      </GestureDetector>
    </View>
  );
};

const ImageGalleryModal = ({ visible, images, initialIndex, onClose, t }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < images.length) {
      setCurrentIndex(newIndex);
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      const imageUrl = images[currentIndex];
      if (!imageUrl) throw new Error('No image URL');

      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('common.error'),
          t('post.galleryPermissionRequired') || 'Gallery permission is required to save images'
        );
        return;
      }

      const urlParts = imageUrl.split('.');
      const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1].split('?')[0] : 'jpg';
      const validExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension.toLowerCase()) ? extension : 'jpg';
      const filename = `reply_image_${Date.now()}.${validExtension}`;
      const fileUri = FileSystem.documentDirectory + filename;

      // Download with headers for imgbb compatibility
      const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri, {
        headers: {
          'Accept': 'image/*',
          'User-Agent': 'Mozilla/5.0 (compatible; CollegeCommunity/1.0)',
        },
      });
      
      if (downloadResult && downloadResult.status === 200 && downloadResult.uri) {
        // Save to gallery
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        
        if (asset) {
          Alert.alert(
            t('common.success'),
            t('post.imageSaved') || 'Image saved to gallery'
          );
        }
        
        // Clean up cache
        setTimeout(async () => {
          try {
            await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
          } catch (deleteError) {
            // Ignore deletion errors
          }
        }, 1000);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('post.downloadFailed'));
    } finally {
      setIsDownloading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.counter}>
            {currentIndex + 1} / {images.length}
          </Text>
          
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="download-outline" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          contentOffset={{ x: initialIndex * SCREEN_WIDTH, y: 0 }}
        >
          {images.map((img, index) => (
            <ZoomableImage key={index} uri={img} />
          ))}
        </ScrollView>

        <Text style={styles.hint}>{t('post.pinchToZoomRotate') || 'Pinch to zoom • Rotate with two fingers • Double tap to reset'}</Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageTouchable: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  hint: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
});

export default ImageGalleryModal;
