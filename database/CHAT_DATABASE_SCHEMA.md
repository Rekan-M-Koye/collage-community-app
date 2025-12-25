# Chat Database Schema for Appwrite

This document describes the required Appwrite collection schema for the chat system.

## Chats Collection

Create a collection named `chats` (or use your existing `chatsCollectionId` from `.env`)

### Attributes

| Attribute                | Type     | Required | Size   | Description                                                             |
| ------------------------ | -------- | -------- | ------ | ----------------------------------------------------------------------- |
| `name`                   | String   | Yes      | 128    | Display name for the chat                                               |
| `type`                   | String   | Yes      | 255    | Chat type: `private`, `custom_group`, `stage_group`, `department_group` |
| `department`             | String   | Yes      | 128    | Department name (for stage/department groups)                           |
| `stage`                  | String   | No       | 128    | Stage level e.g., "1", "2", "3", "4" (for stage groups)                 |
| `participants`           | String[] | No       | 999999 | Array of user IDs who are members                                       |
| `chatKey`                | String   | No       | 255    | Unique key for private chats (sorted user IDs joined with underscore)   |
| `requiresRepresentative` | Boolean  | No       | -      | If true, only representatives/admins can send messages (default: false) |
| `representatives`        | String[] | No       | 1000   | Array of user IDs who can send messages when restricted                 |
| `admins`                 | String[] | No       | 2000   | Array of user IDs who are group admins (first is creator)               |
| `description`            | String   | No       | 1000   | Optional group description                                              |
| `groupPhoto`             | String   | No       | 2000   | URL for custom group profile picture                                    |
| `settings`               | String   | No       | 5000   | JSON string with group settings (permissions, mute, pins, etc.)         |
| `lastMessage`            | String   | No       | 1000   | Preview of last message                                                 |
| `lastMessageAt`          | DateTime | No       | -      | When last message was sent (for sorting)                                |
| `messageCount`           | Integer  | No       | -      | Total messages in chat (min: 0)                                         |
| `pinnedMessages`         | String[] | No       | 2000   | Array of pinned message IDs                                             |

**Note:** `$createdAt` and `$updatedAt` are automatically created by Appwrite - do not create them manually.

### Settings JSON Structure

The `settings` field stores a JSON string with the following structure:

```json
{
  "allowMemberInvites": false,
  "onlyAdminsCanPost": false,
  "allowEveryoneMention": true,
  "onlyAdminsCanMention": false,
  "onlyAdminsCanPin": false,
  "pinnedMessages": []
}
```

### User-Specific Settings (stored in userChatSettings collection)

User-specific mute and notification settings are stored in a separate collection to allow per-user customization.

### Indexes

Create these indexes for optimal query performance:

1. **participants_index** (Array Contains)

   - Attribute: `participants`
   - Type: Key
   - Order: ASC

2. **type_index**

   - Attribute: `type`
   - Type: Key
   - Order: ASC

3. **chatKey_index** (Unique)

   - Attribute: `chatKey`
   - Type: Unique
   - Order: ASC

4. **department_stage_index**

   - Attributes: `department`, `stage`
   - Type: Key
   - Order: ASC

5. **lastMessageAt_index** (for sorting)
   - Attribute: `lastMessageAt`
   - Type: Key
   - Order: DESC

### Permissions

Set collection-level permissions:

- **Read**: `any` (or restrict to authenticated users with `users`)
- **Create**: `users`
- **Update**: `users`
- **Delete**: `users` (or restrict based on your needs)

For document-level permissions, each chat document should have:

- Read: All participants
- Update: All participants (or just the creator for groups)
- Delete: Creator only

---

## Messages Collection

Create a collection named `messages` (or use your existing `messagesCollectionId` from `.env`)

### Attributes

| Attribute        | Type     | Required | Size | Description                                 |
| ---------------- | -------- | -------- | ---- | ------------------------------------------- |
| `chatId`         | String   | Yes      | 255  | Reference to the chat document              |
| `senderId`       | String   | Yes      | 255  | User ID of message sender                   |
| `senderName`     | String   | Yes      | 255  | Display name of sender                      |
| `senderPhoto`    | String   | No       | 2000 | URL of sender's profile picture             |
| `content`        | String   | Yes      | 5000 | Message content                             |
| `createdAt`      | DateTime | Yes      | -    | When message was sent                       |
| `type`           | String   | No       | 50   | Message type: `text`, `image`, `system`     |
| `imageUrl`       | String   | No       | 2000 | URL if message contains image               |
| `images`         | String[] | No       | 2000 | Array of image URLs                         |
| `readBy`         | String[] | No       | -    | Array of user IDs who have read the message |
| `replyToId`      | String   | No       | 255  | ID of message being replied to              |
| `replyToContent` | String   | No       | 200  | Preview of replied message content          |
| `replyToSender`  | String   | No       | 255  | Name of sender of replied message           |
| `isPinned`       | Boolean  | No       | -    | Whether the message is pinned               |
| `pinnedBy`       | String   | No       | 255  | User ID who pinned the message              |
| `pinnedAt`       | DateTime | No       | -    | When the message was pinned                 |
| `mentionsAll`    | Boolean  | No       | -    | Whether message mentions @everyone          |
| `mentions`       | String[] | No       | 2000 | Array of user IDs mentioned in the message  |

### Indexes

1. **chatId_index**

   - Attribute: `chatId`
   - Type: Key
   - Order: ASC

2. **chatId_createdAt_index** (Compound)

   - Attributes: `chatId`, `createdAt`
   - Type: Key
   - Order: ASC, DESC

3. **chatId_isPinned_index** (for pinned messages)

   - Attributes: `chatId`, `isPinned`
   - Type: Key
   - Order: ASC

### Permissions

Similar to chats collection - base on chat participants.

---

## User Chat Settings Collection (NEW)

Create a collection named `userChatSettings` for storing per-user notification preferences.

### Attributes

| Attribute         | Type     | Required | Size | Description                                   |
| ----------------- | -------- | -------- | ---- | --------------------------------------------- |
| `userId`          | String   | Yes      | 255  | Reference to the user                         |
| `chatId`          | String   | Yes      | 255  | Reference to the chat                         |
| `isMuted`         | Boolean  | No       | -    | Whether notifications are muted for this chat |
| `muteExpiresAt`   | DateTime | No       | -    | When the mute expires (null for permanent)    |
| `muteType`        | String   | No       | 50   | Type: `all`, `mentions_only`, `none`          |
| `bookmarkedMsgs`  | String[] | No       | 5000 | Array of bookmarked/saved message IDs         |
| `notifyOnMention` | Boolean  | No       | -    | Notify only when mentioned (default: true)    |
| `notifyOnAll`     | Boolean  | No       | -    | Notify for all messages (default: true)       |

### Indexes

1. **userId_chatId_index** (Unique Compound)

   - Attributes: `userId`, `chatId`
   - Type: Unique
   - Order: ASC

2. **userId_index**
   - Attribute: `userId`
   - Type: Key
   - Order: ASC

### Permissions

- **Read**: Owner only
- **Create**: `users`
- **Update**: Owner only
- **Delete**: Owner only

---

## Chat Types Explained

### `private`

- Two-person direct messages
- Uses `chatKey` for deduplication (format: `userId1_userId2` sorted alphabetically)
- `participants` contains exactly 2 user IDs
- Both users can pin/bookmark messages

### `custom_group`

- User-created group chats
- Created through "Create Group" screen
- Can have any number of participants
- Creator manages the group
- Pin permissions configurable in settings

### `stage_group`

- Auto-created when user accesses chats
- Groups students of same department + stage
- Format: `name` = "Stage {stageNumber}"
- Has `department` and `stage` fields set
- @everyone mention available

### `department_group`

- Auto-created when user accesses chats
- Groups all students of same department
- Format: `name` = "{Department Name}"
- Only has `department` field set (no stage)
- @everyone mention available

---

## Features Implementation Guide

### 1. Muting Chats

Mute options stored in `userChatSettings`:

- **Mute Forever**: Set `isMuted: true`, `muteExpiresAt: null`
- **Mute for Duration**: Set `isMuted: true`, `muteExpiresAt: <timestamp>`
- **Mute Type**:
  - `all`: Mute all notifications
  - `mentions_only`: Only get notified when mentioned
  - `none`: No muting (default)

### 2. @everyone Mentions

- Use `@everyone` or `@all` in message content
- Set `mentionsAll: true` on the message document
- Check `settings.allowEveryoneMention` in chat to verify if allowed
- Check `settings.onlyAdminsCanMention` to see if only admins can use it

### 3. Pinned Messages

- Store pinned message IDs in `chat.pinnedMessages` array
- Set `isPinned: true`, `pinnedBy`, `pinnedAt` on message document
- Check `settings.onlyAdminsCanPin` for permission
- In private chats, both users can pin

### 4. Bookmarked Messages

- Store in `userChatSettings.bookmarkedMsgs` array
- User-specific, not visible to others
- Available in both private and group chats

---

## Setup Checklist

1. [ ] Create `chats` collection with all attributes above
2. [ ] Create `messages` collection with all attributes above
3. [ ] Create `userChatSettings` collection with all attributes above
4. [ ] Add all indexes listed
5. [ ] Set collection permissions
6. [ ] Update `.env` with collection IDs:
   ```
   APPWRITE_CHATS_COLLECTION_ID=your_chats_collection_id
   APPWRITE_MESSAGES_COLLECTION_ID=your_messages_collection_id
   APPWRITE_USER_CHAT_SETTINGS_COLLECTION_ID=your_user_chat_settings_collection_id
   ```

---

## Example Chat Documents

### Stage Group

```json
{
  "name": "Stage 2",
  "type": "stage_group",
  "department": "Computer Science",
  "stage": "2",
  "participants": ["user1", "user2", "user3"],
  "requiresRepresentative": true,
  "representatives": ["rep_user_id"],
  "settings": "{\"allowEveryoneMention\":true,\"onlyAdminsCanMention\":false,\"onlyAdminsCanPin\":true}",
  "pinnedMessages": ["msg_123", "msg_456"],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "lastMessageAt": "2024-01-15T12:30:00.000Z",
  "lastMessage": "Class at 2pm today",
  "messageCount": 45
}
```

### Private Chat

```json
{
  "name": "Chat",
  "type": "private",
  "participants": ["user_abc", "user_xyz"],
  "chatKey": "user_abc_user_xyz",
  "pinnedMessages": ["msg_789"],
  "createdAt": "2024-01-15T09:00:00.000Z",
  "lastMessageAt": "2024-01-15T11:00:00.000Z",
  "lastMessage": "Hey!",
  "messageCount": 12
}
```

### Custom Group

```json
{
  "name": "Project Team A",
  "type": "custom_group",
  "participants": ["user1", "user2", "user3", "user4"],
  "admins": ["user1"],
  "description": "Group for our final project",
  "settings": "{\"allowMemberInvites\":false,\"onlyAdminsCanPost\":false,\"allowEveryoneMention\":true,\"onlyAdminsCanMention\":false,\"onlyAdminsCanPin\":false}",
  "pinnedMessages": [],
  "createdAt": "2024-01-10T14:00:00.000Z",
  "lastMessageAt": "2024-01-15T16:00:00.000Z",
  "lastMessage": "Meeting tomorrow at 3",
  "messageCount": 234
}
```

### User Chat Settings Example

```json
{
  "userId": "user123",
  "chatId": "chat456",
  "isMuted": true,
  "muteExpiresAt": "2024-01-20T10:00:00.000Z",
  "muteType": "mentions_only",
  "bookmarkedMsgs": ["msg_111", "msg_222"],
  "notifyOnMention": true,
  "notifyOnAll": false
}
```

### Pinned Message Example

```json
{
  "chatId": "chat456",
  "senderId": "user123",
  "senderName": "John Doe",
  "senderPhoto": "https://example.com/photo.jpg",
  "content": "Important: Exam on Friday!",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "type": "text",
  "isPinned": true,
  "pinnedBy": "admin_user",
  "pinnedAt": "2024-01-15T11:00:00.000Z",
  "mentionsAll": true
}
```
