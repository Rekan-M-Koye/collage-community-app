# Reply System Implementation Guide

## Overview

The reply system allows users to respond to posts with text, images, and links. This document explains the implementation and features.

## Features

### 1. Reply Display

- **ReplyCard Component**: Displays individual replies with:
  - User avatar and name
  - Reply text content
  - Timestamp with "edited" indicator
  - Images (scrollable gallery)
  - Links (clickable list)
  - "Best Answer" badge for accepted replies

### 2. Reply Actions

- **Add Reply**: Create new replies with text, images (up to 3), and links
- **Edit Reply**: Edit your own replies
- **Delete Reply**: Remove your own replies
- **Accept Reply**: Post owners can mark a reply as the best answer (for questions)

### 3. User Permissions

- **Reply Owner**: Can edit and delete their own replies
- **Post Owner**: Can mark/unmark replies as accepted answers
- **All Users**: Can view replies and add new ones

### 4. Media Support

- **Images**: Up to 3 images per reply
  - Select from gallery or take a photo
  - Preview before posting
  - Full-screen image viewer
- **Links**: Multiple links supported
  - One link per line
  - Displayed as clickable cards

## Components

### ReplyCard.jsx

Location: `app/components/ReplyCard.jsx`

Props:

- `reply` (object): The reply data
- `onEdit` (function): Handler for edit action
- `onDelete` (function): Handler for delete action
- `onAccept` (function): Handler for accept/unaccept action
- `isOwner` (boolean): Whether current user owns the reply
- `isPostOwner` (boolean): Whether current user owns the post
- `showAcceptButton` (boolean): Whether to show accept button

### PostDetails.jsx

Location: `app/screens/PostDetails.jsx`

Features:

- Display all replies for a post
- Reply input with text, images, and links
- Edit mode for existing replies
- Image picker integration
- Keyboard-aware layout

## Translation Keys

All text is translatable in 3 languages (English, Arabic, Kurdish):

```javascript
post.replies; // "Replies"
post.repliesCount; // "{count} Replies"
post.noReplies; // "No replies yet"
post.beFirstToReply; // "Be the first to reply!"
post.writeReply; // "Write your reply..."
post.addReply; // "Add Reply"
post.replyAdded; // "Reply added successfully!"
post.replyError; // "Failed to add reply"
post.replyDeleted; // "Reply deleted successfully!"
post.deleteReply; // "Delete Reply"
post.editReply; // "Edit Reply"
post.replyUpdated; // "Reply updated successfully!"
post.accepted; // "Accepted"
post.markAsAccepted; // "Mark as Accepted"
post.unmarkAsAccepted; // "Unmark as Accepted"
post.bestAnswer; // "Best Answer"
```

## Database Integration (Future)

The current implementation uses mock data. When the database is ready, integrate with:

```javascript
// From database/replies.js
import {
  createReply,
  getRepliesByPost,
  updateReply,
  deleteReply,
  markReplyAsAccepted,
  unmarkReplyAsAccepted,
} from "../database/replies";
```

### Steps to integrate:

1. Replace mock replies with `getRepliesByPost(postId)` in useEffect
2. Update `handleAddReply` to use `createReply` or `updateReply`
3. Update `handleDeleteReply` to use `deleteReply`
4. Update `handleAcceptReply` to use `markReplyAsAccepted/unmarkReplyAsAccepted`
5. Upload images using imgBB service before creating reply
6. Store imageUrls and imageDeleteUrls in database

## Styling

The reply system uses:

- Glass morphism design matching the app theme
- Responsive sizing with `wp()`, `hp()`, `fontSize()`, `moderateScale()`
- Dark mode support
- Smooth animations and transitions

## Navigation

Access reply screen via:

```javascript
navigation.navigate("PostDetails", { post: postObject });
```

## Notes

- Maximum 3 images per reply
- Images are displayed in a horizontal scroll view
- Full-screen image gallery with swipe navigation
- Links are validated and displayed as cards
- Reply text has a 2000 character limit
- Users can reply to their own posts
