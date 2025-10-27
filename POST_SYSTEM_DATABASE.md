# Post System Database Structure

## Overview

This document outlines the database structure needed for the post system in Appwrite.

## Collections

### 1. Posts Collection (`posts`)

#### Attributes

| Attribute Name    | Type    | Size  | Required | Default | Array | Description                                            |
| ----------------- | ------- | ----- | -------- | ------- | ----- | ------------------------------------------------------ |
| `userId`          | String  | 255   | Yes      | -       | No    | Reference to user who created the post                 |
| `text`            | String  | 10000 | Yes      | -       | No    | Post content/description                               |
| `topic`           | String  | 500   | Yes      | -       | No    | Post title/topic                                       |
| `department`      | String  | 100   | Yes      | -       | No    | Department (e.g., "computer_science", "medicine")      |
| `stage`           | String  | 50    | Yes      | -       | No    | Academic stage (e.g., "stage_1", "stage_2")            |
| `postType`        | String  | 50    | Yes      | -       | No    | Type: "question", "discussion", "note", "announcement" |
| `images`          | String  | 500   | No       | -       | Yes   | Array of imgBB image URLs                              |
| `imageDeleteUrls` | String  | 500   | No       | -       | Yes   | Array of imgBB delete URLs for cleanup                 |
| `isResolved`      | Boolean | -     | No       | false   | No    | For questions - marks if answered                      |
| `viewCount`       | Integer | -     | No       | 0       | No    | Number of views                                        |
| `likeCount`       | Integer | -     | No       | 0       | No    | Number of likes                                        |
| `replyCount`      | Integer | -     | No       | 0       | No    | Number of replies                                      |
| `isEdited`        | Boolean | -     | No       | false   | No    | Tracks if post was edited                              |
| `tags`            | String  | 100   | No       | -       | Yes   | Optional tags for categorization                       |

#### Indexes

Create these indexes for better query performance:

1. **userId_index**:

   - Type: Key
   - Attribute: `userId`
   - Order: ASC

2. **department_stage_index**:

   - Type: Key
   - Attributes: `department`, `stage`
   - Order: ASC, ASC

3. **postType_index**:

   - Type: Key
   - Attribute: `postType`
   - Order: ASC

4. **createdAt_index**:

   - Type: Key
   - Attribute: `$createdAt`
   - Order: DESC

5. **text_search**:
   - Type: Fulltext
   - Attribute: `text`

#### Permissions

- **Create**: `role:member` (any authenticated user)
- **Read**: `role:member` (any authenticated user)
- **Update**: `user:{userId}` (only post owner - set document-level permission)
- **Delete**: `user:{userId}` (only post owner - set document-level permission)

---

### 2. Replies Collection (`replies`)

#### Attributes

| Attribute Name    | Type    | Size | Required | Default | Array | Description                           |
| ----------------- | ------- | ---- | -------- | ------- | ----- | ------------------------------------- |
| `postId`          | String  | 255  | Yes      | -       | No    | Reference to parent post              |
| `userId`          | String  | 255  | Yes      | -       | No    | User who created the reply            |
| `text`            | String  | 5000 | Yes      | -       | No    | Reply content                         |
| `images`          | String  | 500  | No       | -       | Yes   | Array of imgBB image URLs (1-5 max)   |
| `imageDeleteUrls` | String  | 500  | No       | -       | Yes   | Array of imgBB delete URLs            |
| `isAccepted`      | Boolean | -    | No       | false   | No    | For answers to questions              |
| `likeCount`       | Integer | -    | No       | 0       | No    | Number of likes                       |
| `isEdited`        | Boolean | -    | No       | false   | No    | Tracks if edited                      |
| `parentReplyId`   | String  | 255  | No       | -       | No    | For nested replies (optional feature) |

#### Indexes

1. **postId_index**:

   - Type: Key
   - Attribute: `postId`
   - Order: ASC

2. **userId_index**:

   - Type: Key
   - Attribute: `userId`
   - Order: ASC

3. **createdAt_index**:
   - Type: Key
   - Attribute: `$createdAt`
   - Order: ASC

#### Permissions

- **Create**: `role:member` (any authenticated user)
- **Read**: `role:member` (any authenticated user)
- **Update**: `user:{userId}` (only reply owner - set document-level permission)
- **Delete**: `user:{userId}` OR post owner (needs custom logic)

---

## Additional Features to Consider

### Likes System (Optional - Separate Collection)

If you want to track individual likes:

#### `post_likes` Collection

- `postId` (String, required)
- `userId` (String, required)
- Create unique index on `postId` + `userId` combination

#### `reply_likes` Collection

- `replyId` (String, required)
- `userId` (String, required)
- Create unique index on `replyId` + `userId` combination

---

## Implementation Notes

### Image Handling

- Images are uploaded to imgBB (not Appwrite Storage)
- Each image has a URL and a delete URL
- Delete URLs are stored to clean up images when posts/replies are deleted
- Images are compressed before upload using `imageCompression.js`
- Max 10 images per post, 5 per reply

### Cascade Deletion

When a post is deleted:

1. Delete all replies associated with the post
2. Delete all images from imgBB using the stored delete URLs
3. Delete all likes (if using separate likes collection)

This is handled in `database/replies.js` with the `deleteRepliesByPost` function.

### Search Functionality

Posts support full-text search on the `text` field. Make sure to create a fulltext index in Appwrite.

---

## Setup Instructions

1. **Create the Collections**:

   - In Appwrite Console, go to your database
   - Create two new collections: `posts` and `replies`
   - Note down the collection IDs

2. **Add Attributes**:

   - For each collection, add the attributes listed above
   - Set the correct type, size, and required status for each

3. **Create Indexes**:

   - Add all indexes as specified above
   - This will improve query performance significantly

4. **Set Permissions**:

   - Configure collection-level permissions as specified
   - For document-level permissions (owner only), these will be set when creating documents

5. **Update Configuration**:
   - In `database/posts.js`, replace `'POSTS_COLLECTION_ID'` with your actual posts collection ID
   - In `database/replies.js`, replace `'REPLIES_COLLECTION_ID'` with your actual replies collection ID
   - Update `database/config.js` if needed

---

## Files Created

1. **`app/utils/imageCompression.js`**: Smart image compression utilities
2. **`app/constants/postConstants.js`**: Post types, departments, stages, and validation rules
3. **`app/components/ImagePicker.jsx`**: Component for selecting and previewing multiple images
4. **`app/screens/CreatePost.jsx`**: Screen for creating posts with full form
5. **`database/posts.js`**: Database functions for posts (updated with new features)
6. **`database/replies.js`**: Database functions for replies
7. **Translation updates**: Added post-related translations to `en.js`, `ar.js`, and `ku.js`

---

## Post Types

- **Question**: For asking questions, can be marked as resolved
- **Discussion**: For general discussions and topics
- **Note/Reference**: For sharing notes, study materials, past papers
- **Announcement**: For important announcements

Each post type has its own icon and color defined in `postConstants.js`.
