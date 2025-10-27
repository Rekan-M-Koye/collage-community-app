import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const COMPRESSION_QUALITY = {
  HIGH: 0.9,
  MEDIUM: 0.7,
  LOW: 0.5,
};

const MAX_DIMENSION = 1920;
const THUMBNAIL_DIMENSION = 400;

export const compressImage = async (uri, options = {}) => {
  try {
    const {
      quality = COMPRESSION_QUALITY.MEDIUM,
      maxDimension = MAX_DIMENSION,
      resize = true,
    } = options;

    const actions = [];

    if (resize) {
      actions.push({
        resize: {
          width: maxDimension,
        },
      });
    }

    const result = await manipulateAsync(
      uri,
      actions,
      {
        compress: quality,
        format: SaveFormat.JPEG,
      }
    );

    return result;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};

export const compressMultipleImages = async (uris, options = {}) => {
  try {
    const compressedImages = await Promise.all(
      uris.map(uri => compressImage(uri, options))
    );
    return compressedImages;
  } catch (error) {
    console.error('Error compressing multiple images:', error);
    throw error;
  }
};

export const createThumbnail = async (uri) => {
  try {
    const result = await manipulateAsync(
      uri,
      [
        {
          resize: {
            width: THUMBNAIL_DIMENSION,
            height: THUMBNAIL_DIMENSION,
          },
        },
      ],
      {
        compress: COMPRESSION_QUALITY.LOW,
        format: SaveFormat.JPEG,
      }
    );

    return result;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    throw error;
  }
};

export const getImageInfo = (uri) => {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => {
        resolve({ width, height });
      },
      (error) => {
        reject(error);
      }
    );
  });
};

export const calculateOptimalQuality = async (uri) => {
  try {
    const { width, height } = await getImageInfo(uri);
    const pixels = width * height;

    if (pixels > 4000000) {
      return COMPRESSION_QUALITY.LOW;
    } else if (pixels > 2000000) {
      return COMPRESSION_QUALITY.MEDIUM;
    } else {
      return COMPRESSION_QUALITY.HIGH;
    }
  } catch (error) {
    console.error('Error calculating quality:', error);
    return COMPRESSION_QUALITY.MEDIUM;
  }
};

export const smartCompress = async (uri) => {
  try {
    const quality = await calculateOptimalQuality(uri);
    const { width, height } = await getImageInfo(uri);
    
    const maxDimension = Math.max(width, height);
    const shouldResize = maxDimension > MAX_DIMENSION;

    return await compressImage(uri, {
      quality,
      maxDimension: shouldResize ? MAX_DIMENSION : maxDimension,
      resize: shouldResize,
    });
  } catch (error) {
    console.error('Error in smart compress:', error);
    throw error;
  }
};

export const pickAndCompressImages = async (options = {}) => {
  try {
    const {
      allowsMultipleSelection = true,
      maxImages = 10,
      quality = 'medium',
    } = options;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      throw new Error('Permission to access gallery was denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection,
      quality: 1,
      selectionLimit: maxImages,
    });

    if (result.canceled) {
      return null;
    }

    const selectedImages = result.assets || [result];
    
    if (selectedImages.length > maxImages) {
      throw new Error(`Maximum ${maxImages} images allowed`);
    }

    const compressionQuality = COMPRESSION_QUALITY[quality.toUpperCase()] || COMPRESSION_QUALITY.MEDIUM;

    const compressedImages = await Promise.all(
      selectedImages.map(asset => smartCompress(asset.uri))
    );

    return compressedImages.map((compressed, index) => ({
      uri: compressed.uri,
      width: compressed.width,
      height: compressed.height,
      originalUri: selectedImages[index].uri,
    }));
  } catch (error) {
    console.error('Error picking and compressing images:', error);
    throw error;
  }
};

export const takePictureAndCompress = async (options = {}) => {
  try {
    const { quality = 'medium' } = options;

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      throw new Error('Permission to access camera was denied');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });

    if (result.canceled) {
      return null;
    }

    const compressionQuality = COMPRESSION_QUALITY[quality.toUpperCase()] || COMPRESSION_QUALITY.MEDIUM;

    const compressed = await smartCompress(result.assets[0].uri);

    return {
      uri: compressed.uri,
      width: compressed.width,
      height: compressed.height,
      originalUri: result.assets[0].uri,
    };
  } catch (error) {
    console.error('Error taking and compressing picture:', error);
    throw error;
  }
};
