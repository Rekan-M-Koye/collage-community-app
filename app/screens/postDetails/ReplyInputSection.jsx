import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { postDetailsStyles as styles } from './styles';

const ReplyInputSection = ({
  editingReply,
  replyText,
  setReplyText,
  replyImages,
  replyLinks,
  linkInput,
  showLinksSection,
  isSubmitting,
  theme,
  isDarkMode,
  t,
  onResetForm,
  onRemoveImage,
  onRemoveLink,
  onLinkInputChange,
  onAddLink,
  onPickImages,
  onToggleLinksSection,
  onSubmit,
}) => {
  return (
    <View style={[styles.inputSection, { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF', borderTopColor: theme.border }]}>
      {editingReply && (
        <View style={styles.editingBanner}>
          <Text style={styles.editingBannerText}>{t('post.editingReply')}</Text>
          <TouchableOpacity onPress={onResetForm}>
            <Ionicons name="close-circle" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}

      <TextInput
        style={[styles.replyTextInput, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6', color: theme.text }]}
        placeholder={t('post.writeReply')}
        placeholderTextColor={theme.textSecondary}
        value={replyText}
        onChangeText={setReplyText}
        multiline
        maxLength={2000}
      />

      {replyImages.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewScroll}>
          {replyImages.map((uri, index) => (
            <View key={index} style={styles.imagePreviewItem}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => onRemoveImage(index)}>
                <Ionicons name="close-circle" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {showLinksSection && (
        <View style={styles.linksSection}>
          {replyLinks.map((link, index) => (
            <View key={index} style={[styles.linkChip, { backgroundColor: isDarkMode ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)' }]}>
              <Ionicons name="link-outline" size={14} color="#3B82F6" />
              <Text style={styles.linkChipText} numberOfLines={1}>{link}</Text>
              <TouchableOpacity onPress={() => onRemoveLink(index)}>
                <Ionicons name="close" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.linkInputRow}>
            <TextInput
              style={[styles.linkInput, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6', color: theme.text }]}
              placeholder={t('post.linksPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              value={linkInput}
              onChangeText={onLinkInputChange}
              onSubmitEditing={onAddLink}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TouchableOpacity 
              style={[styles.addLinkBtn, { opacity: linkInput.trim() ? 1 : 0.5 }]} 
              onPress={onAddLink}
              disabled={!linkInput.trim()}
            >
              <Ionicons name="add-circle" size={28} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.inputActions}>
        <View style={styles.inputActionsLeft}>
          <TouchableOpacity 
            style={styles.actionIconBtn} 
            onPress={onPickImages}
            disabled={replyImages.length >= 3}
          >
            <Ionicons 
              name="image-outline" 
              size={24} 
              color={replyImages.length >= 3 ? theme.textSecondary : '#3B82F6'} 
            />
            {replyImages.length > 0 && (
              <View style={styles.imageBadge}>
                <Text style={styles.imageBadgeText}>{replyImages.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionIconBtn} 
            onPress={onToggleLinksSection}
          >
            <Ionicons 
              name={showLinksSection ? 'link' : 'link-outline'} 
              size={24} 
              color={showLinksSection ? '#3B82F6' : theme.textSecondary} 
            />
            {replyLinks.length > 0 && (
              <View style={styles.imageBadge}>
                <Text style={styles.imageBadgeText}>{replyLinks.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.sendButton, { opacity: replyText.trim() ? 1 : 0.5 }]}
          onPress={onSubmit}
          disabled={!replyText.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.sendButtonText}>
                {editingReply ? t('common.save') : t('post.send')}
              </Text>
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ReplyInputSection;
