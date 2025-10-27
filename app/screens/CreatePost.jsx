import React, { useState, useContext } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../hooks/useTranslation';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { UserContext } from '../context/UserContext';
import ImagePickerComponent from '../components/ImagePicker';
import SearchableDropdownNew from '../components/SearchableDropdownNew';
import {
  POST_TYPES,
  POST_TYPE_OPTIONS,
  DEPARTMENTS,
  STAGES,
  VALIDATION_RULES,
  MAX_IMAGES_PER_POST,
  POST_COLORS,
  POST_ICONS,
} from '../constants/postConstants';
import { uploadImage } from '../../services/imgbbService';
import { createPost } from '../../database/posts';

const CreatePost = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { showAlert } = useCustomAlert();
  const { user } = useContext(UserContext);

  const [postType, setPostType] = useState(POST_TYPES.DISCUSSION);
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');
  const [department, setDepartment] = useState('');
  const [stage, setStage] = useState('');
  const [images, setImages] = useState([]);
  const [tags, setTags] = useState('');
  const [links, setLinks] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!topic.trim()) {
      showAlert(t('common.error'), t('post.topicRequired'));
      return false;
    }

    if (topic.length < VALIDATION_RULES.POST.topic.min) {
      showAlert(
        t('common.error'),
        t('post.topicTooShort', { min: VALIDATION_RULES.POST.topic.min })
      );
      return false;
    }

    if (topic.length > VALIDATION_RULES.POST.topic.max) {
      showAlert(
        t('common.error'),
        t('post.topicTooLong', { max: VALIDATION_RULES.POST.topic.max })
      );
      return false;
    }

    if (!text.trim()) {
      showAlert(t('common.error'), t('post.textRequired'));
      return false;
    }

    if (text.length < VALIDATION_RULES.POST.text.min) {
      showAlert(
        t('common.error'),
        t('post.textTooShort', { min: VALIDATION_RULES.POST.text.min })
      );
      return false;
    }

    if (text.length > VALIDATION_RULES.POST.text.max) {
      showAlert(
        t('common.error'),
        t('post.textTooLong', { max: VALIDATION_RULES.POST.text.max })
      );
      return false;
    }

    if (!department) {
      showAlert(t('common.error'), t('post.departmentRequired'));
      return false;
    }

    if (!stage) {
      showAlert(t('common.error'), t('post.stageRequired'));
      return false;
    }

    return true;
  };

  const handleCreatePost = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      let uploadedImages = [];
      let imageDeleteUrls = [];

      if (images.length > 0) {
        showAlert(t('post.uploadingImages'), t('post.pleaseWait'), 'info');

        for (const image of images) {
          try {
            const result = await uploadImage(image.uri);
            uploadedImages.push(result.url);
            imageDeleteUrls.push(result.deleteUrl);
          } catch (error) {
            console.error('Error uploading image:', error);
          }
        }
      }

      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const linkArray = links
        .split('\n')
        .map(link => link.trim())
        .filter(link => link.length > 0);

      const postData = {
        userId: user.$id,
        postType,
        topic: topic.trim(),
        text: text.trim(),
        department,
        stage,
        images: uploadedImages,
        imageDeleteUrls,
        isResolved: false,
        viewCount: 0,
        likeCount: 0,
        replyCount: 0,
        isEdited: false,
      };

      const createdPost = await createPost(postData);
      console.log('Post created successfully:', createdPost);

      showAlert(
        t('common.success'),
        t('post.postCreated'),
        'success'
      );

      navigation.goBack();
    } catch (error) {
      console.error('Error creating post:', error);
      showAlert(
        t('common.error'),
        error.message || t('post.createError')
      );
    } finally {
      setLoading(false);
    }
  };

  const renderPostTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{t('post.postType')}</Text>
      <View style={styles.postTypeGrid}>
        {POST_TYPE_OPTIONS.map((option) => {
          const isSelected = postType === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.postTypeButton,
                isSelected && {
                  backgroundColor: POST_COLORS[option.value],
                  borderColor: POST_COLORS[option.value],
                },
              ]}
              onPress={() => setPostType(option.value)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={POST_ICONS[option.value]}
                size={24}
                color={isSelected ? '#fff' : '#6B7280'}
              />
              <Text
                style={[
                  styles.postTypeText,
                  isSelected && styles.postTypeTextSelected,
                ]}
              >
                {t(option.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          disabled={loading}
        >
          <Ionicons name="close" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('post.createPost')}</Text>
        <TouchableOpacity
          onPress={handleCreatePost}
          style={[styles.headerButton, loading && styles.headerButtonDisabled]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <Text style={styles.postButtonText}>{t('post.post')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderPostTypeSelector()}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {t('post.topic')} *
            </Text>
            <TextInput
              style={styles.topicInput}
              value={topic}
              onChangeText={setTopic}
              placeholder={t('post.topicPlaceholder')}
              placeholderTextColor="#9CA3AF"
              maxLength={VALIDATION_RULES.POST.topic.max}
              editable={!loading}
            />
            <Text style={styles.charCount}>
              {topic.length}/{VALIDATION_RULES.POST.topic.max}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {t('post.description')} *
            </Text>
            <TextInput
              style={styles.textInput}
              value={text}
              onChangeText={setText}
              placeholder={t('post.descriptionPlaceholder')}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              maxLength={VALIDATION_RULES.POST.text.max}
              textAlignVertical="top"
              editable={!loading}
            />
            <Text style={styles.charCount}>
              {text.length}/{VALIDATION_RULES.POST.text.max}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {t('post.department')} *
            </Text>
            <SearchableDropdownNew
              items={DEPARTMENTS}
              value={department}
              onSelect={setDepartment}
              placeholder={t('post.selectDepartment')}
              disabled={loading}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {t('post.stage')} *
            </Text>
            <SearchableDropdownNew
              items={STAGES}
              value={stage}
              onSelect={setStage}
              placeholder={t('post.selectStage')}
              disabled={loading}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {t('post.tags')} {t('common.optional')}
            </Text>
            <TextInput
              style={styles.topicInput}
              value={tags}
              onChangeText={setTags}
              placeholder={t('post.tagsPlaceholder')}
              placeholderTextColor="#9CA3AF"
              editable={!loading}
            />
            <Text style={styles.helperText}>
              {t('post.tagsHelper')}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {t('post.links')} {t('common.optional')}
            </Text>
            <TextInput
              style={[styles.textInput, { minHeight: 100 }]}
              value={links}
              onChangeText={setLinks}
              placeholder={t('post.linksPlaceholder')}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={styles.helperText}>
              {t('post.linksHelper')}
            </Text>
          </View>

          <ImagePickerComponent
            images={images}
            onImagesChange={setImages}
            maxImages={MAX_IMAGES_PER_POST}
            disabled={loading}
          />

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  postTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  postTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  postTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  postTypeTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  topicInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    minHeight: 150,
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  bottomSpace: {
    height: 40,
  },
});

export default CreatePost;
