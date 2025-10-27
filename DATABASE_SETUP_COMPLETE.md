# Database Setup Instructions

## ✅ What's Already Done

1. **.env file updated** with collection IDs
2. **All hardcoded IDs removed** from code
3. **Using environment variables** properly

---

## 🔧 Database Attributes You Need to Add

### Posts Collection (`68ff7914000948dbd572`)

You already have these attributes based on the screenshot. Just verify you have ALL of them:

✅ **Already Created:**

- `$id` (string, automatic)
- `userId` (string, required, size: 500, indexed)
- `text` (string, required, size: 5000)
- `topic` (string, required, size: 255)
- `department` (string, required, size: 255, indexed)
- `stage` (string, required, size: 255, indexed)
- `postType` (string, required, size: 255, indexed)
- `images[]` (string array, size: 2000, default: NULL)
- `imageDeleteUrls[]` (string array, size: 2000, default: NULL)
- `isResolved` (boolean, default: false)
- `viewCount` (integer, default: 0)
- `likeCount` (integer, default: 0)
- `replyCount` (integer, default: 0)
- `isEdited` (boolean, default: false)

❌ **MISSING - Need to Add:**
None! Your posts collection looks complete.

---

### Replies Collection (`68ff7b8f000492463724`)

✅ **Already Created:**

- `$id` (string, automatic)
- `postId` (string, required, size: 128, indexed)
- `userId` (string, required, size: 128, indexed)
- `text` (string, required, size: 500)
- `isAccepted` (boolean, default: NULL)
- `createdAt` (datetime, required)
- `images[]` (string array, size: 2000, default: NULL)
- `imageDeleteUrls[]` (string array, size: 2000, default: NULL)
- `likeCount` (integer, default: 0)
- `isEdited` (boolean, default: false)
- `parentReplyId` (string, size: 255, default: NULL)
- `$createdAt` (datetime, indexed)
- `$updatedAt` (datetime)

✅ **All attributes are present!**

---

## 🔍 Important Indexes to Verify

### Posts Collection Indexes:

1. ✅ `userId` - Key index (ASC)
2. ✅ `department` - Key index (ASC)
3. ✅ `stage` - Key index (ASC)
4. ✅ `postType` - Key index (ASC)
5. 📝 **Optional but recommended:** Create a fulltext index on `text` field for search functionality

### Replies Collection Indexes:

1. ✅ `postId` - Key index (ASC)
2. ✅ `userId` - Key index (ASC)
3. ✅ `$createdAt` - Key index (ASC for ordering)

---

## 🔐 Permissions Setup

### Posts Collection Permissions:

```
Create: role:member (any authenticated user)
Read: role:member (any authenticated user)
Update: Document level - set when creating (owner only)
Delete: Document level - set when creating (owner only)
```

### Replies Collection Permissions:

```
Create: role:member (any authenticated user)
Read: role:member (any authenticated user)
Update: Document level - set when creating (owner only)
Delete: Document level - set when creating (owner only)
```

---

## ✅ Everything is Ready!

Your database structure is **complete** and **correct**! The app should work now.

### What Changed:

1. ✅ Removed all hardcoded collection IDs
2. ✅ Added collection IDs to `.env` file
3. ✅ Updated `config.js` to export collection IDs
4. ✅ Updated all database functions to use `config.postsCollectionId` and `config.repliesCollectionId`

### To Test:

1. Restart the Expo dev server: `npm start` or press `r` in the terminal
2. Go to the Post tab
3. Try creating a post with all fields
4. It should save to your Appwrite database!

---

## 🚀 Next Steps (Optional Enhancements):

1. **Add fulltext search index** on posts.text for better search
2. **Create a users collection** to store user profiles (if not already done)
3. **Add a likes collection** to track who liked what (optional)
4. **Set up webhooks** for notifications when posts get replies

Your database is production-ready! 🎉
