import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ZoomableImage = ({ uri, onLongPress }) => {
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

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onEnd((e, success) => {
      if (success && onLongPress) {
        runOnJS(onLongPress)();
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    rotationGesture,
    Gesture.Race(doubleTapGesture, longPressGesture, panGesture)
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
          style={[styles.image, animatedStyle]}
          resizeMode="contain"
        />
      </GestureDetector>
    </View>
  );
};

const PostCardImageGallery = ({ images, initialIndex, onClose, t }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isDownloading, setIsDownloading] = useState(false);
  const scrollViewRef = useRef(null);

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
      let imageUrl = images[currentIndex];
      
      if (!imageUrl) {
        Alert.alert(
          t('common.error'),
          t('post.downloadFailed') || 'Failed to download image'
        );
        return;
      }

      // Request permissions - on Android 10+ this is handled differently
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('common.error'),
          t('post.galleryPermissionRequired') || 'Gallery permission is required to save images'
        );
        return;
      }

      // For imgbb URLs, ensure we're using the direct image URL
      // imgbb URLs sometimes need to be converted to direct image URLs
      if (imageUrl.includes('i.ibb.co') || imageUrl.includes('ibb.co')) {
        // Already a direct image URL or needs conversion
        // If it's ibb.co/xxxxx (short URL), we need to use the direct image URL
        if (!imageUrl.includes('i.ibb.co')) {
          // Try to get the image ID and construct direct URL
          // This is a fallback - ideally images are already stored with direct URLs
        }
      }

      // Extract extension from URL, handling query parameters
      const urlWithoutQuery = imageUrl.split('?')[0];
      const urlParts = urlWithoutQuery.split('.');
      const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1].toLowerCase() : 'jpg';
      const validExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension) ? extension : 'jpg';
      const filename = `college_image_${Date.now()}.${validExtension}`;
      const fileUri = FileSystem.documentDirectory + filename;

      // Download the image with headers that might be needed for imgbb
      const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri, {
        headers: {
          'Accept': 'image/*',
          'User-Agent': 'Mozilla/5.0 (compatible; CollegeCommunity/1.0)',
        },
      });
      
      if (downloadResult && downloadResult.status === 200 && downloadResult.uri) {
        try {
          // Create asset in media library
          const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
          
          if (asset) {
            Alert.alert(
              t('common.success'),
              t('post.imageSaved') || 'Image saved to gallery'
            );
          } else {
            throw new Error('Failed to create asset');
          }
        } finally {
          // Clean up the downloaded file after a short delay to ensure it's been saved
          setTimeout(async () => {
            try {
              await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
            } catch (deleteError) {
              // Ignore deletion errors
            }
          }, 1000);
        }
      } else {
        throw new Error('Download failed with status: ' + (downloadResult?.status || 'unknown'));
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('post.downloadFailed') || 'Failed to download image'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareImage = async () => {
    try {
      await Share.share({
        url: images[currentIndex],
        message: images[currentIndex],
      });
    } catch (error) {
      // Share cancelled or failed
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={onClose}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.counter}>
          {currentIndex + 1} / {images.length}
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleShareImage}
          >
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
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
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        contentOffset={{ x: initialIndex * SCREEN_WIDTH, y: 0 }}
        scrollEventThrottle={16}
      >
        {images.map((img, index) => (
          <ZoomableImage key={index} uri={img} onLongPress={handleDownload} />
        ))}
      </ScrollView>

      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>
          {t('post.pinchToZoomRotate') || 'Pinch to zoom • Rotate with two fingers'}
        </Text>
      </View>
    </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
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
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
});

export default PostCardImageGallery;
