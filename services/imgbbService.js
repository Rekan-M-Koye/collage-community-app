import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const IMGBB_API_KEY = '2b74b47dbff705a8ee383763714dce86';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

export const pickImage = async () => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (permissionResult.granted === false) {
    throw new Error('Permission to access camera roll is required!');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    return result.assets[0];
  }

  return null;
};

export const compressImage = async (imageUri) => {
  try {
    const compressedImage = await manipulateAsync(
      imageUri,
      [
        { resize: { width: 800, height: 800 } }
      ],
      {
        compress: 0.7,
        format: SaveFormat.JPEG,
        base64: true,
      }
    );
    
    return compressedImage;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};

export const uploadToImgbb = async (base64Image) => {
  try {
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Image);

    const response = await fetch(`${IMGBB_UPLOAD_URL}?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      return {
        url: result.data.url,
        displayUrl: result.data.display_url,
        deleteUrl: result.data.delete_url,
        thumbnailUrl: result.data.thumb.url,
      };
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    console.error('Error uploading to imgbb:', error);
    throw error;
  }
};

export const uploadProfilePicture = async () => {
  try {
    const pickedImage = await pickImage();
    
    if (!pickedImage) {
      return null;
    }

    const compressedImage = await compressImage(pickedImage.uri);
    
    if (!compressedImage.base64) {
      throw new Error('Failed to get base64 data');
    }

    const uploadResult = await uploadToImgbb(compressedImage.base64);
    
    return uploadResult;
  } catch (error) {
    console.error('Error in uploadProfilePicture:', error);
    throw error;
  }
};

export const uploadPostImage = async () => {
  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      throw new Error('Permission to access camera roll is required!');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      
      const compressedImage = await manipulateAsync(
        imageUri,
        [
          { resize: { width: 1200 } }
        ],
        {
          compress: 0.75,
          format: SaveFormat.JPEG,
          base64: true,
        }
      );

      if (!compressedImage.base64) {
        throw new Error('Failed to get base64 data');
      }

      const uploadResult = await uploadToImgbb(compressedImage.base64);
      
      return uploadResult;
    }

    return null;
  } catch (error) {
    console.error('Error in uploadPostImage:', error);
    throw error;
  }
};

export const uploadImage = async (imageUri) => {
  try {
    const compressedImage = await manipulateAsync(
      imageUri,
      [
        { resize: { width: 1200 } }
      ],
      {
        compress: 0.75,
        format: SaveFormat.JPEG,
        base64: true,
      }
    );

    if (!compressedImage.base64) {
      throw new Error('Failed to get base64 data');
    }

    const uploadResult = await uploadToImgbb(compressedImage.base64);
    
    return {
      success: true,
      url: uploadResult.url,
      deleteUrl: uploadResult.deleteUrl,
      displayUrl: uploadResult.displayUrl,
      thumbnailUrl: uploadResult.thumbnailUrl,
    };
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const deleteImageFromImgbb = async (deleteUrl) => {
  try {
    if (!deleteUrl) {
      console.log('No delete URL provided');
      return { success: false, error: 'No delete URL provided' };
    }

    const response = await fetch(deleteUrl, {
      method: 'GET',
    });

    if (response.ok) {
      console.log('Image deleted from imgbb successfully');
      return { success: true };
    } else {
      console.log('Failed to delete image from imgbb');
      return { success: false, error: 'Delete request failed' };
    }
  } catch (error) {
    console.error('Error deleting image from imgbb:', error);
    return { success: false, error: error.message };
  }
};

export const deleteMultipleImages = async (deleteUrls) => {
  try {
    if (!deleteUrls || deleteUrls.length === 0) {
      return { success: true, message: 'No images to delete' };
    }

    const deletePromises = deleteUrls.map(url => deleteImageFromImgbb(url));
    const results = await Promise.allSettled(deletePromises);
    
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    console.log(`Deleted ${successCount}/${deleteUrls.length} images from imgbb`);
    
    return { 
      success: true, 
      deletedCount: successCount,
      totalCount: deleteUrls.length 
    };
  } catch (error) {
    console.error('Error deleting multiple images:', error);
    return { success: false, error: error.message };
  }
};
