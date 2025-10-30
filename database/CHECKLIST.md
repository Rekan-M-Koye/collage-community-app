# Appwrite Setup Checklist

## Database Columns to Add

### Posts Collection

- [ ] Add `likedBy` column
  - Type: String Array
  - Required: No
- [ ] Add `viewedBy` column
  - Type: String Array
  - Required: No

## Permissions to Set

- [ ] Verify Posts collection has proper read permissions
- [ ] Verify Posts collection has proper write permissions for authenticated users
- [ ] Test that users can update their own likes

## Testing Checklist

- [ ] Like a post
- [ ] Unlike a post
- [ ] Check Appwrite database to verify `likedBy` array
- [ ] Check like count updates correctly
- [ ] Test with multiple users
- [ ] Verify optimistic UI updates work
- [ ] Test error handling (disconnect network and try to like)
- [ ] Verify layout changes (compact stage/type badges)

## Optional Enhancements (Future)

- [ ] Add like animation when clicking heart
- [ ] Show list of users who liked a post
- [ ] Add notification when someone likes your post
- [ ] Implement view tracking on post details page
- [ ] Add "Most Liked" posts filter
- [ ] Cache liked posts locally for offline support
