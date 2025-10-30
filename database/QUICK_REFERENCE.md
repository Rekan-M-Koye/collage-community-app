# Quick Reference: Post Likes Setup

## Step 1: Add Columns in Appwrite

Go to your Appwrite Console > Database > Posts Collection > Attributes

### Add likedBy Column

- **Attribute ID**: `likedBy`
- **Type**: String Array
- **Required**: No
- **Array**: Yes
- **Default Value**: Leave empty (will be empty array)

### Add viewedBy Column

- **Attribute ID**: `viewedBy`
- **Type**: String Array
- **Required**: No
- **Array**: Yes
- **Default Value**: Leave empty (will be empty array)

## Step 2: Test the Implementation

1. Run your app
2. Navigate to Profile tab
3. Your posts should now show the new compact layout
4. Click the heart icon on any post
5. The like count should increment/decrement immediately
6. The heart should fill/unfill with red color

## Step 3: Verify Database Updates

In Appwrite Console:

1. Open your Posts collection
2. Find a post you liked
3. Check the `likedBy` field - it should contain your user ID
4. Check the `likeCount` field - it should match the array length

## Expected Behavior

### Like Action

- Heart icon fills and turns red
- Like count increases by 1
- Your user ID is added to `likedBy` array

### Unlike Action

- Heart icon empties and turns gray
- Like count decreases by 1
- Your user ID is removed from `likedBy` array

### Visual Changes

- Stage and Type badges are now small and inline under the user's name
- Post topic appears immediately after the header
- More compact, efficient use of space
- Easier to quickly identify post stage and type

## Troubleshooting

### Likes not working?

- Check if `likedBy` column exists in Appwrite
- Check console for errors
- Verify user is logged in (`user.$id` exists)

### Layout looks wrong?

- Clear app cache and reload
- Check if PostCard component updated correctly

### Database errors?

- Verify collection permissions
- Check if columns are created with correct types
- Ensure your database connection is working

## Files Modified

1. `database/posts.js` - Like and view functions
2. `app/components/PostCard.jsx` - UI and state management
3. `app/tabs/Profile.jsx` - Like handler integration

## Files Created

1. `database/APPWRITE_COLUMNS.md` - Column documentation
2. `IMPLEMENTATION_SUMMARY.md` - Detailed changes summary
3. `database/QUICK_REFERENCE.md` - This file
