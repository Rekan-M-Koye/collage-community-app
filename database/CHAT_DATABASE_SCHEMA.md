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
| `settings`               | String   | No       | 2000   | JSON string with group settings (permissions, mute, etc.)               |
| `lastMessage`            | String   | No       | 1000   | Preview of last message                                                 |
| `lastMessageAt`          | DateTime | No       | -      | When last message was sent (for sorting)                                |
| `messageCount`           | Integer  | No       | -      | Total messages in chat (min: 0)                                         |

**Note:** `$createdAt` and `$updatedAt` are automatically created by Appwrite - do not create them manually.

### Settings JSON Structure

The `settings` field stores a JSON string with the following structure:

```json
{
  "allowMemberInvites": false, // Allow non-admins to invite members
  "onlyAdminsCanPost": false, // Restrict posting to admins only
  "muteNotifications": false, // User-specific mute setting
  "pinnedMessages": [] // Array of pinned message IDs
}
```

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

| Attribute    | Type     | Required | Size | Description                                 |
| ------------ | -------- | -------- | ---- | ------------------------------------------- |
| `chatId`     | String   | Yes      | 255  | Reference to the chat document              |
| `senderId`   | String   | Yes      | 255  | User ID of message sender                   |
| `senderName` | String   | Yes      | 255  | Display name of sender                      |
| `content`    | String   | Yes      | 5000 | Message content                             |
| `createdAt`  | DateTime | Yes      | -    | When message was sent                       |
| `type`       | String   | No       | 50   | Message type: `text`, `image`, `system`     |
| `imageUrl`   | String   | No       | 2000 | URL if message contains image               |
| `readBy`     | String[] | No       | -    | Array of user IDs who have read the message |

### Indexes

1. **chatId_index**

   - Attribute: `chatId`
   - Type: Key
   - Order: ASC

2. **chatId_createdAt_index** (Compound)
   - Attributes: `chatId`, `createdAt`
   - Type: Key
   - Order: ASC, DESC

### Permissions

Similar to chats collection - base on chat participants.

---

## Chat Types Explained

### `private`

- Two-person direct messages
- Uses `chatKey` for deduplication (format: `userId1_userId2` sorted alphabetically)
- `participants` contains exactly 2 user IDs

### `custom_group`

- User-created group chats
- Created through "Create Group" screen
- Can have any number of participants
- Creator manages the group

### `stage_group`

- Auto-created when user accesses chats
- Groups students of same department + stage
- Format: `name` = "Stage {stageNumber}"
- Has `department` and `stage` fields set

### `department_group`

- Auto-created when user accesses chats
- Groups all students of same department
- Format: `name` = "{Department Name}"
- Only has `department` field set (no stage)

---

## Setup Checklist

1. [ ] Create `chats` collection with all attributes above
2. [ ] Create `messages` collection with all attributes above
3. [ ] Add all indexes listed
4. [ ] Set collection permissions
5. [ ] Update `.env` with collection IDs:
   ```
   APPWRITE_CHATS_COLLECTION_ID=your_chats_collection_id
   APPWRITE_MESSAGES_COLLECTION_ID=your_messages_collection_id
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
  "description": "Group for our final project",
  "createdAt": "2024-01-10T14:00:00.000Z",
  "lastMessageAt": "2024-01-15T16:00:00.000Z",
  "lastMessage": "Meeting tomorrow at 3",
  "messageCount": 234
}
```
