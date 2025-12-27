# Database Schema Review

This document contains the current Appwrite database schema and identifies any missing columns needed for the application.

---

## Current Database Tables

### 1. **messages** (Table ID: messages)

| Column Name    | Type     | Size  | Indexed | Required | Default |
| -------------- | -------- | ----- | ------- | -------- | ------- |
| $id            | string   | -     | ✓       | -        | -       |
| chatId         | string   | 255   | ✓       | ✓        | -       |
| senderId       | string   | 255   | -       | ✓        | -       |
| senderName     | string   | 255   | -       | ✓        | -       |
| content        | string   | 2550  | -       | -        | NULL    |
| images[]       | string   | 10000 | -       | -        | NULL    |
| type           | string   | 50    | -       | -        | NULL    |
| imageUrl       | string   | 2000  | -       | -        | NULL    |
| readBy[]       | string   | 99999 | -       | -        | NULL    |
| replyToId      | string   | 255   | -       | -        | NULL    |
| replyToContent | string   | 200   | -       | -        | NULL    |
| replyToSender  | string   | 255   | -       | -        | NULL    |
| isPinned       | boolean  | -     | ✓       | -        | false   |
| pinnedBy       | string   | 255   | -       | -        | NULL    |
| pinnedAt       | datetime | -     | -       | -        | NULL    |
| mentionsAll    | boolean  | -     | -       | -        | false   |
| mentions[]     | string   | 2000  | -       | -        | NULL    |
| $createdAt     | datetime | -     | ✓       | -        | -       |
| $updatedAt     | datetime | -     | -       | -        | -       |

---

### 2. **chats** (Table ID: chats)

| Column Name            | Type     | Size   | Indexed | Required | Default |
| ---------------------- | -------- | ------ | ------- | -------- | ------- |
| $id                    | string   | -      | ✓       | -        | -       |
| name                   | string   | 128    | -       | ✓        | -       |
| department             | string   | 128    | ✓       | -        | NULL    |
| type                   | string   | 255    | -       | ✓        | -       |
| stage                  | string   | 128    | ✓       | -        | NULL    |
| requiresRepresentative | boolean  | -      | -       | -        | false   |
| representatives[]      | string   | 1000   | -       | -        | NULL    |
| description            | string   | 1000   | -       | -        | NULL    |
| lastMessage            | string   | 1000   | -       | -        | NULL    |
| messageCount           | integer  | Min: 0 | -       | -        | -       |
| lastMessageAt          | datetime | -      | -       | -        | NULL    |
| participants[]         | string   | 999999 | -       | -        | NULL    |
| chatKey                | string   | 255    | ✓       | -        | NULL    |
| admins[]               | string   | 2000   | -       | -        | NULL    |
| settings               | string   | 2000   | -       | -        | NULL    |
| groupPhoto             | string   | 2000   | -       | -        | NULL    |
| pinnedMessages[]       | string   | 2000   | -       | -        | NULL    |
| $createdAt             | datetime | -      | ✓       | -        | -       |
| $updatedAt             | datetime | -      | -       | -        | -       |

---

### 3. **replies** (Table ID: 68ff7b8f000492463724)

| Column Name       | Type     | Size   | Indexed | Required | Default |
| ----------------- | -------- | ------ | ------- | -------- | ------- |
| $id               | string   | -      | ✓       | -        | -       |
| postId            | string   | 128    | -       | ✓        | -       |
| userId            | string   | 128    | -       | ✓        | -       |
| text              | string   | 500    | -       | ✓        | -       |
| isAccepted        | boolean  | -      | -       | -        | NULL    |
| images[]          | string   | 2000   | -       | -        | NULL    |
| imageDeleteUrls[] | string   | 2000   | -       | -        | NULL    |
| likeCount         | integer  | -      | -       | -        | 0       |
| isEdited          | boolean  | -      | -       | -        | false   |
| parentReplyId     | string   | 255    | -       | -        | NULL    |
| upCount           | integer  | Min: 0 | -       | -        | 0       |
| downCount         | integer  | Min: 0 | -       | -        | 0       |
| upvotedBy[]       | string   | 50000  | -       | -        | NULL    |
| downvotedBy[]     | string   | 50000  | -       | -        | NULL    |
| $createdAt        | datetime | -      | ✓       | -        | -       |
| $updatedAt        | datetime | -      | -       | -        | -       |

---

### 4. **posts** (Table ID: 68ff79140009948dbd572)

| Column Name       | Type     | Size   | Indexed | Required | Default |
| ----------------- | -------- | ------ | ------- | -------- | ------- |
| $id               | string   | -      | ✓       | -        | -       |
| userId            | string   | 500    | ✓       | ✓        | -       |
| text              | string   | 5000   | -       | ✓        | -       |
| topic             | string   | 255    | -       | ✓        | -       |
| department        | string   | 255    | ✓       | ✓        | -       |
| stage             | string   | 255    | ✓       | ✓        | -       |
| postType          | string   | 255    | ✓       | ✓        | -       |
| images[]          | string   | 2000   | -       | -        | NULL    |
| imageDeleteUrls[] | string   | 2000   | -       | -        | NULL    |
| isResolved        | boolean  | -      | -       | -        | false   |
| viewCount         | integer  | -      | -       | -        | 0       |
| likeCount         | integer  | -      | -       | -        | 0       |
| replyCount        | integer  | -      | -       | -        | 0       |
| isEdited          | boolean  | -      | -       | -        | false   |
| tags[]            | string   | 2000   | -       | -        | NULL    |
| links[]           | string   | 2000   | -       | -        | NULL    |
| likedBy[]         | string   | 999999 | -       | -        | NULL    |
| viewedBy[]        | string   | 999999 | -       | -        | NULL    |
| $createdAt        | datetime | -      | ✓       | -        | -       |
| $updatedAt        | datetime | -      | -       | -        | -       |

---

### 5. **users** (Table ID: 68fc7b42001bf7efbba3)

| Column Name        | Type     | Size        | Indexed | Required | Default |
| ------------------ | -------- | ----------- | ------- | -------- | ------- |
| $id                | string   | -           | ✓       | -        | -       |
| userID             | string   | 255         | -       | ✓        | -       |
| name               | string   | 255         | -       | ✓        | -       |
| email              | string   | 320         | -       | ✓        | -       |
| bio                | string   | 500         | -       | -        | NULL    |
| profilePicture     | string   | 255         | -       | -        | NULL    |
| isEmailVerified    | boolean  | -           | -       | ✓        | -       |
| university         | string   | 255         | -       | -        | NULL    |
| major              | string   | 255         | -       | -        | NULL    |
| year               | integer  | Min:1 Max:6 | -       | -        | 1       |
| followersCount     | integer  | Min: 0      | -       | -        | 0       |
| followingCount     | integer  | Min: 0      | -       | -        | 0       |
| postsCount         | integer  | Min: 0      | -       | -        | 0       |
| department         | string   | 255         | -       | -        | NULL    |
| lastAcademicUpdate | datetime | -           | -       | -        | NULL    |
| following[]        | string   | 999999      | -       | -        | NULL    |
| followers[]        | string   | 999999      | -       | -        | NULL    |
| blockedUsers[]     | string   | 999999      | -       | -        | NULL    |
| $createdAt         | datetime | -           | ✓       | -        | -       |
| $updatedAt         | datetime | -           | -       | -        | NULL    |

---

## Code Review - Used Columns

Based on reviewing the codebase, here are all the columns being used:

### Messages Collection (used in code):

- `chatId`, `senderId`, `senderName`, `content`, `imageUrl`, `images[]`
- `replyToId`, `replyToContent`, `replyToSender`
- `isPinned`, `pinnedBy`, `pinnedAt`
- `mentionsAll`, `$createdAt`

### Chats Collection (used in code):

- `name`, `type`, `department`, `stage`
- `participants[]`, `chatKey`, `requiresRepresentative`, `representatives[]`
- `admins[]`, `description`, `groupPhoto`, `settings`
- `lastMessage`, `lastMessageAt`, `messageCount`, `pinnedMessages[]`

### Users Collection (used in code):

- `userID`, `name`, `email`, `bio`, `profilePicture`
- `isEmailVerified`, `university`, `major`, `year`, `department`
- `followersCount`, `followingCount`, `postsCount`
- `following[]`, `followers[]`, `blockedUsers[]`

### Posts Collection (used in code):

- `userId`, `text`, `topic`, `department`, `stage`, `postType`
- `images[]`, `imageDeleteUrls[]`
- `isResolved`, `viewCount`, `likeCount`, `replyCount`, `isEdited`
- `tags[]`, `links[]`, `likedBy[]`, `viewedBy[]`

### Replies Collection (used in code):

- `postId`, `userId`, `text`, `isAccepted`
- `images[]`, `imageDeleteUrls[]`
- `likeCount`, `isEdited`, `parentReplyId`
- `upCount`, `downCount`, `upvotedBy[]`, `downvotedBy[]`

### userChatSettings Collection (used in code):

- `userId`, `chatId`, `isMuted`, `muteExpiresAt`, `muteType`
- `bookmarkedMsgs[]`, `notifyOnMention`, `notifyOnAll`

---

## Previously Missing Tables - NOW CREATED ✓

### **userChatSettings** (Table ID: 69500c9c000bd955c984) ✅ CREATED

The `userChatSettings` collection has been created for per-user chat notification settings.

**Columns:**

| Column Name      | Type     | Size | Required | Default | Description                          |
| ---------------- | -------- | ---- | -------- | ------- | ------------------------------------ |
| userId           | string   | 255  | ✓        | -       | Reference to the user                |
| chatId           | string   | 255  | ✓        | -       | Reference to the chat                |
| isMuted          | boolean  | -    | -        | false   | Whether notifications are muted      |
| muteExpiresAt    | datetime | -    | -        | NULL    | When the mute expires                |
| muteType         | string   | 50   | -        | 'none'  | Type: 'all', 'mentions_only', 'none' |
| bookmarkedMsgs[] | string   | 5000 | -        | NULL    | Array of bookmarked message IDs      |
| notifyOnMention  | boolean  | -    | -        | true    | Notify only when mentioned           |
| notifyOnAll      | boolean  | -    | -        | true    | Notify for all messages              |

**Recommended indexes:**

- `userId_chatId_index` (Unique Compound) - Attributes: `userId`, `chatId`
- `userId_index` - Attribute: `userId`

---

## Missing Columns

### In **messages** table:

| Column Name | Type   | Size | Required | Description                     | Status                                             |
| ----------- | ------ | ---- | -------- | ------------------------------- | -------------------------------------------------- |
| senderPhoto | string | 2000 | No       | URL of sender's profile picture | ⚠️ MISSING - Used in code but may not be in schema |

> **Note:** The code uses `senderPhoto` in MessageBubble but it's not shown in the database schema. However, this may be fetched from the users collection instead.

### In **chats** table:

All columns appear to be present. ✓

### In **users** table:

All columns appear to be present. ✓

### In **posts** table:

All columns appear to be present. ✓

### In **replies** table:

All columns appear to be present. ✓

---

## Summary of Required Actions

### 1. CREATE NEW TABLE: `userChatSettings`

```
Table Name: userChatSettings
Required Columns:
- userId (string, size: 255, required: true)
- chatId (string, size: 255, required: true)
- isMuted (boolean, default: false)
- muteExpiresAt (datetime, nullable)
- muteType (string, size: 50, default: 'none')
- bookmarkedMsgs (string[], size: 5000, nullable)
- notifyOnMention (boolean, default: true)
- notifyOnAll (boolean, default: true)

Indexes:
- Create unique compound index on: userId + chatId
- Create key index on: userId
```

### 2. OPTIONAL: Add `senderPhoto` to messages table

```
Column: senderPhoto
Type: string
Size: 2000
Required: false
Default: NULL
Description: Caches sender's profile picture URL for faster display
```

This is optional since the app can fetch from users collection, but caching improves performance.

---

## Database Collection IDs Reference

| Table    | Collection ID         |
| -------- | --------------------- |
| messages | messages              |
| chats    | chats                 |
| replies  | 68ff7b8f000492463724  |
| posts    | 68ff79140009948dbd572 |
| users    | 68fc7b42001bf7efbba3  |

---

_Last updated: December 27, 2025_
