# Appwrite Database Columns Required

This document lists the columns/attributes that need to be added to your Appwrite collections.

## Posts Collection

Add these columns to your Posts collection:

### likedBy

- **Type**: Array of Strings
- **Required**: No
- **Default**: Empty array `[]`
- **Description**: Stores user IDs who have liked the post
- **Purpose**: Track which users liked a post to prevent duplicate likes and calculate like count

### viewedBy

- **Type**: Array of Strings
- **Required**: No
- **Default**: Empty array `[]`
- **Description**: Stores user IDs who have viewed the post
- **Purpose**: Track unique views per user for accurate view count statistics

### Existing Columns (should already exist)

- `likeCount` (Integer) - Total number of likes
- `viewCount` (Integer) - Total number of views
- `replyCount` (Integer) - Total number of replies
- `userId` (String) - Owner of the post
- `userName` (String) - Display name of owner
- `userProfilePicture` (String) - Avatar URL of owner
- `topic` (String) - Post title/topic
- `text` (String) - Post content
- `postType` (String) - Type: question, discussion, note, announcement
- `stage` (String) - Academic stage
- `department` (String) - Academic department
- `images` (Array of Strings) - Image URLs
- `tags` (Array of Strings) - Post tags
- `isEdited` (Boolean) - Whether post was edited
- `isResolved` (Boolean) - For questions only

## Implementation Notes

### Like Functionality

The `togglePostLike` function in `database/posts.js`:

1. Fetches the post
2. Gets the `likedBy` array
3. Checks if user ID exists in array
4. Adds/removes user ID accordingly
5. Updates `likedBy` array and `likeCount` in one operation

### View Tracking

The `incrementPostViewCount` function in `database/posts.js`:

1. If `userId` is provided: Only increments if user hasn't viewed before
2. If no `userId`: Increments view count unconditionally (for guest users)
3. Updates `viewedBy` array and `viewCount` accordingly

## Usage Example

```javascript
import { togglePostLike, incrementPostViewCount } from "./database/posts";

// Like/unlike a post
await togglePostLike(postId, userId);

// Track a view (logged in user)
await incrementPostViewCount(postId, userId);

// Track a view (guest user)
await incrementPostViewCount(postId);
```

## UI Implementation

The PostCard component now:

- Shows real-time like updates with optimistic UI
- Displays accurate like counts
- Prevents rapid clicking with `isLiking` state
- Syncs with prop changes via useEffect
- Reverts state on error

## Next Steps

1. Add the `likedBy` and `viewedBy` columns in Appwrite Console
2. Set appropriate permissions (read/write based on your auth rules)
3. Test the like functionality in the app
4. Monitor view tracking accuracy
