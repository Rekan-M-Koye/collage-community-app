import { StyleSheet } from 'react-native';

export const postDetailsStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  repliesSection: {
    borderRadius: 16,
    padding: 16,
  },
  repliesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  repliesSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  repliesList: {
    gap: 12,
  },
  inputSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  editingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  editingBannerText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '600',
  },
  replyTextInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 48,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  imagePreviewScroll: {
    marginTop: 10,
  },
  imagePreviewItem: {
    marginRight: 10,
    position: 'relative',
  },
  imagePreview: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
  },
  linksSection: {
    marginTop: 10,
    gap: 8,
  },
  linkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  linkChipText: {
    flex: 1,
    fontSize: 13,
    color: '#3B82F6',
  },
  linkInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkInput: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addLinkBtn: {
    padding: 4,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  inputActionsLeft: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIconBtn: {
    position: 'relative',
    padding: 8,
  },
  imageBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
