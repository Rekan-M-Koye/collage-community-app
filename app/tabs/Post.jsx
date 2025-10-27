import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppSettings } from '../context/AppSettingsContext';
import { useUser } from '../context/UserContext';
import { uploadImage } from '../../services/imgbbService';
import { createPost } from '../../database/posts';
import { compressImage } from '../utils/imageCompression';
import {
  POST_TYPES,
  DEPARTMENTS,
  STAGES,
  MAX_IMAGES_PER_POST,
} from '../constants/postConstants';

const Post = () => {
  const appSettings = useAppSettings();
  
  if (!appSettings) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  
  const { theme, isDarkMode, t } = appSettings;
  const { user } = useUser();

  const [postType, setPostType] = useState(POST_TYPES.DISCUSSION);
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');
  const [department, setDepartment] = useState(user?.department || '');
  const [stage, setStage] = useState(user?.stage || '');
  const [tags, setTags] = useState('');
  const [links, setLinks] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [showTags, setShowTags] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  
  const POST_TYPE_OPTIONS = [
    { value: POST_TYPES.QUESTION, label: t('post.types.question'), icon: 'help-circle-outline', color: '#3B82F6' },
    { value: POST_TYPES.DISCUSSION, label: t('post.types.discussion'), icon: 'chatbubbles-outline', color: '#8B5CF6' },
    { value: POST_TYPES.NOTE, label: t('post.types.note'), icon: 'document-text-outline', color: '#10B981' },
    { value: POST_TYPES.ANNOUNCEMENT, label: t('post.types.announcement'), icon: 'megaphone-outline', color: '#F59E0B' },
  ];

  useEffect(() => {
    if (user?.stage && !stage) {
      setStage(user.stage);
    }
  }, [user]);

  const handlePickImages = async () => {
    try {
      if (images.length >= MAX_IMAGES_PER_POST) {
        Alert.alert(t('post.imageLimit'), t('post.maxImagesReached', { max: MAX_IMAGES_PER_POST }));
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), 'Permission to access gallery is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: MAX_IMAGES_PER_POST - images.length,
      });

      if (!result.canceled && result.assets) {
        const compressedImages = await Promise.all(
          result.assets.map(async (asset) => {
            try {
              const compressed = await compressImage(asset.uri, { quality: 0.7 });
              return compressed?.uri || asset.uri;
            } catch (error) {
              console.error('Error compressing image:', error);
              return asset.uri;
            }
          })
        );
        setImages([...images, ...compressedImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert(t('common.error'), 'Failed to pick images');
    }
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!topic.trim()) {
      Alert.alert(t('common.error'), t('post.topicRequired'));
      return false;
    }
    if (!text.trim()) {
      Alert.alert(t('common.error'), t('post.textRequired'));
      return false;
    }
    if (!stage) {
      Alert.alert(t('common.error'), t('post.stageRequired'));
      return false;
    }
    return true;
  };

  const handleCreatePost = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let imageUrls = [];
      let imageDeleteUrls = [];

      if (images.length > 0) {
        const uploadPromises = images.map(uri => uploadImage(uri));
        const results = await Promise.all(uploadPromises);
        
        results.forEach(result => {
          if (result.success) {
            imageUrls.push(result.url);
            imageDeleteUrls.push(result.deleteUrl);
          }
        });
      }

      const tagsArray = tags.trim() ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      const linksArray = links.trim() ? links.split('\n').map(link => link.trim()).filter(Boolean) : [];
      
      const postDepartment = isPublic ? 'public' : (user?.department || '');

      await createPost({
        userId: user.$id,
        text,
        topic,
        department: postDepartment,
        stage,
        postType,
        images: imageUrls,
        imageDeleteUrls,
        tags: tagsArray,
        links: linksArray,
      });

      Alert.alert(t('common.success'), t('post.postCreated'));
      
      setTopic('');
      setText('');
      setTags('');
      setLinks('');
      setImages([]);
      setPostType(POST_TYPES.DISCUSSION);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert(t('common.error'), t('post.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('post.createPost')}</Text>
        <TouchableOpacity
          onPress={handleCreatePost}
          style={[styles.postButton, { backgroundColor: theme.primary }]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>{t('post.post')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.text }]}>{t('post.postType')}</Text>
            <View style={styles.postTypeGrid}>
              {POST_TYPE_OPTIONS.map((type) => {
                const isSelected = postType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.postTypeButton,
                      { borderColor: theme.border, backgroundColor: theme.card },
                      isSelected && { backgroundColor: type.color, borderColor: type.color },
                    ]}
                    onPress={() => setPostType(type.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={type.icon}
                      size={22}
                      color={isSelected ? '#fff' : theme.textSecondary}
                    />
                    <Text style={[
                      styles.postTypeText,
                      { color: theme.textSecondary },
                      isSelected && styles.postTypeTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.text }]}>
              {t('post.topic')} <Text style={{ color: theme.danger }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
                color: theme.text 
              }]}
              value={topic}
              onChangeText={setTopic}
              placeholder={t('post.topicPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              maxLength={200}
              editable={!loading}
            />
            <Text style={[styles.charCount, { color: theme.textSecondary }]}>
              {topic.length}/200
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.text }]}>
              {t('post.description')} <Text style={{ color: theme.danger }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
                color: theme.text
              }]}
              value={text}
              onChangeText={setText}
              placeholder={t('post.descriptionPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              editable={!loading}
            />
            <Text style={[styles.charCount, { color: theme.textSecondary }]}>
              {text.length}/5000
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.optionsRow}>
              <View style={styles.stageDropdownContainer}>
                <Text style={[styles.optionLabel, { color: theme.textSecondary }]}>
                  {t('post.stage')}
                </Text>
                <View style={[styles.stageDropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {STAGES.map((stg) => (
                      <TouchableOpacity
                        key={stg.value}
                        style={[
                          styles.stageOption,
                          stage === stg.value && { backgroundColor: theme.primary }
                        ]}
                        onPress={() => setStage(stg.value)}
                      >
                        <Text style={[
                          styles.stageOptionText,
                          { color: theme.textSecondary },
                          stage === stg.value && { color: '#fff', fontWeight: '600' }
                        ]}>
                          {t(stg.labelKey)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.publicToggleContainer}>
                <Text style={[styles.optionLabel, { color: theme.textSecondary }]}>
                  {t('post.public')}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    isPublic && { backgroundColor: theme.primary, borderColor: theme.primary }
                  ]}
                  onPress={() => setIsPublic(!isPublic)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isPublic ? 'globe' : 'people'}
                    size={20}
                    color={isPublic ? '#fff' : theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => setShowTags(!showTags)}
                activeOpacity={0.7}
              >
                <Ionicons name="pricetag-outline" size={18} color={showTags ? theme.primary : theme.textSecondary} />
                <Text style={[styles.actionButtonText, { color: showTags ? theme.primary : theme.textSecondary }]}>
                  {t('post.tags')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => setShowLinks(!showLinks)}
                activeOpacity={0.7}
              >
                <Ionicons name="link-outline" size={18} color={showLinks ? theme.primary : theme.textSecondary} />
                <Text style={[styles.actionButtonText, { color: showLinks ? theme.primary : theme.textSecondary }]}>
                  {t('post.links')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={handlePickImages}
                disabled={loading || images.length >= MAX_IMAGES_PER_POST}
                activeOpacity={0.7}
              >
                <Ionicons name="images-outline" size={18} color={theme.textSecondary} />
                <Text style={[styles.actionButtonText, { color: theme.textSecondary }]}>
                  {t('post.images')} {images.length > 0 && `(${images.length})`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showTags && (
            <View style={styles.section}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                  color: theme.text
                }]}
                value={tags}
                onChangeText={setTags}
                placeholder={t('post.tagsPlaceholder')}
                placeholderTextColor={theme.textSecondary}
                editable={!loading}
              />
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                {t('post.tagsHelper')}
              </Text>
            </View>
          )}

          {showLinks && (
            <View style={styles.section}>
              <TextInput
                style={[styles.input, styles.textArea, {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.border,
                  color: theme.text,
                  minHeight: 100
                }]}
                value={links}
                onChangeText={setLinks}
                placeholder={t('post.linksPlaceholder')}
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
                autoCapitalize="none"
              />
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                {t('post.linksHelper')}
              </Text>
            </View>
          )}

          {images.length > 0 && (
            <View style={styles.section}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                {images.map((uri, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.imageWrapper}
                    onPress={() => setSelectedImageIndex(index)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={[styles.removeImageButton, { backgroundColor: theme.danger }]}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <Ionicons name="close" size={18} color="#fff" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={selectedImageIndex !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImageIndex(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setSelectedImageIndex(null)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={[styles.closeModalButton, { backgroundColor: theme.danger }]}
                onPress={() => setSelectedImageIndex(null)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              {selectedImageIndex !== null && (
                <Image 
                  source={{ uri: images[selectedImageIndex] }} 
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  postButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
    marginLeft: 12,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  optional: {
    fontSize: 14,
    fontWeight: '400',
  },
  postTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  postTypeButton: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  postTypeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  postTypeTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
  helperText: {
    fontSize: 13,
    marginTop: 6,
  },
  chipContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  imagesContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  imagePreview: {
    width: 140,
    height: 140,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  stageDropdownContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  stageDropdown: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stageOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 2,
    borderRadius: 8,
  },
  stageOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  publicToggleContainer: {
    alignItems: 'flex-end',
  },
  toggleButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '80%',
  },
  closeModalButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomSpace: {
    height: 40,
  },
});

export default Post;
