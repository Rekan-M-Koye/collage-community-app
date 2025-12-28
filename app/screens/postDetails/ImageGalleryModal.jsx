import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ZoomableImage = ({ uri }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const savedScale = useRef(1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = savedScale.current * event.scale;
      scale.setValue(Math.min(Math.max(newScale, 1), 4));
    })
    .onEnd((event) => {
      const finalScale = savedScale.current * event.scale;
      const clampedScale = Math.min(Math.max(finalScale, 1), 4);
      
      if (clampedScale <= 1.1) {
        savedScale.current = 1;
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: false,
          friction: 5,
        }).start();
      } else {
        savedScale.current = clampedScale;
      }
    });

  return (
    <GestureDetector gesture={pinchGesture}>
      <Animated.View style={styles.imageWrapper}>
        <Animated.Image
          source={{ uri }}
          style={[
            styles.galleryImage,
            { transform: [{ scale }] }
          ]}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
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

      const urlParts = imageUrl.split('.');
      const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1].split('?')[0] : 'jpg';
      const validExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension.toLowerCase()) ? extension : 'jpg';
      const filename = `reply_image_${Date.now()}.${validExtension}`;
      const fileUri = FileSystem.cacheDirectory + filename;

      const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
      
      if (downloadResult && downloadResult.status === 200 && downloadResult.uri) {
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (isAvailable) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'image/' + validExtension,
            dialogTitle: t('post.saveImage'),
          });
        } else {
          Alert.alert(t('common.error'), t('post.sharingNotAvailable'));
        }
        
        await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
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

        <Text style={styles.hint}>{t('post.pinchToZoom')}</Text>
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
