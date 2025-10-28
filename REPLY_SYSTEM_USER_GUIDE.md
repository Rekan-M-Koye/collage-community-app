# Reply System - User Flow

## How to Use the Reply System

### 1. Accessing Replies

**From any post:**

- Tap on the post card itself, OR
- Tap the "Reply" button (chat bubble icon) at the bottom of the post

This will navigate to the **PostDetails** screen showing all replies.

---

## PostDetails Screen Layout

### Header

- Back button (left)
- "Replies" title (center)

### Replies Section (Glass Card)

- Header: Chat bubbles icon + "X Replies" count
- **Empty State** (when no replies):
  - Chat bubble icon
  - "No replies yet"
  - "Be the first to reply!"
- **Reply List** (when replies exist):
  - Each reply shows:
    - User avatar (circle with initial)
    - User name
    - Timestamp (e.g., "2h ago") + "Edited" if edited
    - Reply text content
    - Links (if any) as blue clickable cards
    - Images (if any) in horizontal scroll
    - "Best Answer" badge (green) if accepted by post owner

### Reply Input Section (Glass Card)

**Edit Mode Banner** (only when editing):

- Blue banner showing "Edit Reply"
- X button to cancel edit

**Text Input:**

- Large multi-line text box
- Placeholder: "Write your reply..."
- 2000 character limit

**Links Input:**

- Multi-line text box
- Placeholder: "https://example.com\nhttps://another-link.com"
- One link per line

**Image Preview:**

- Horizontal scroll of selected images
- Each image has X button to remove
- Shows up to 3 images

**Action Buttons:**

- **Image Button** (left):
  - Camera icon
  - Shows "0/3", "1/3", "2/3", or "3/3"
  - Disabled when 3 images selected
  - Tapping opens: Camera or Gallery options
- **Submit Button** (right):
  - Send icon + "Add Reply" or "Save" (when editing)
  - Blue background when text is entered
  - Gray/disabled when text is empty
  - Shows loading spinner when submitting

---

## User Actions

### Adding a Reply

1. Scroll to bottom of PostDetails screen
2. Type your reply in the text box
3. (Optional) Add links - one per line
4. (Optional) Tap image button to add photos
   - Choose Camera or Gallery
   - Select up to 3 images
   - Remove any with X button
5. Tap "Add Reply" button
6. Success message appears
7. Your reply appears in the list

### Editing Your Reply

1. Find your reply in the list
2. Tap the three dots (⋯) menu button
3. Select "Edit Reply"
4. Blue "Edit Reply" banner appears
5. Reply content fills the input fields
6. Make your changes
7. Tap "Save" button
8. Success message appears
9. Reply updates with "Edited" indicator

### Deleting Your Reply

1. Find your reply in the list
2. Tap the three dots (⋯) menu button
3. Select "Delete Reply" (red)
4. Confirmation dialog appears
5. Confirm deletion
6. Success message appears
7. Reply disappears from list

### Accepting an Answer (Post Owners Only)

**For Question-type posts:**

1. Find a helpful reply
2. Tap the three dots (⋯) menu button
3. Select "Mark as Accepted" (green)
4. Reply now shows green "Best Answer" badge
5. Green border appears around reply

**To Unmark:**

1. Tap menu on accepted reply
2. Select "Unmark as Accepted"
3. Badge and border removed

---

## Visual Features

### Reply Card States

**Normal Reply:**

```
┌─────────────────────────────────┐
│ [A] John Doe                [⋯] │
│     2h ago                       │
│                                  │
│ This is my reply text...         │
│                                  │
│ 🔗 https://example.com           │
│                                  │
│ [img] [img]                      │
└─────────────────────────────────┘
```

**Accepted Reply (Best Answer):**

```
┌═════════════════════════════════┐ ← Green border
║ [A] Jane Smith     ✓ Best Answer║ ← Green badge
║     5h ago • Edited              ║
║                                  ║
║ Great explanation with details..║
║                                  ║
║ [img]                            ║
└═════════════════════════════════┘
```

**Your Own Reply:**

```
┌─────────────────────────────────┐
│ [Y] Your Name              [⋯]  │ ← Menu available
│     Just now                     │
│                                  │
│ My reply...                      │
└─────────────────────────────────┘
Menu shows:
  ✏️ Edit Reply
  🗑️ Delete Reply
```

### Image Gallery

- Tap any image to open full-screen viewer
- Swipe left/right to navigate
- Counter shows "1 / 3"
- X button in top-right to close

### Keyboard Behavior

- Keyboard pushes content up automatically
- Input stays visible while typing
- Scrollable to see all replies while keyboard open

---

## Mock Data (Current Implementation)

The system currently shows 2 sample replies for testing:

**Reply 1:**

- User: John Doe
- Posted: 1 hour ago
- Status: Accepted (Best Answer)
- Content: "This is a sample reply with some helpful information. Database integration is coming soon!"

**Reply 2:**

- User: Jane Smith
- Posted: 2 hours ago
- Status: Edited
- Content: "Another reply here. You can add images and links once the database is ready."
- Links: https://example.com, https://github.com

You can add new replies which will appear alongside these mock replies.

---

## Supported Formats

### Text

- Plain text
- Multi-line
- Up to 2000 characters
- Line breaks preserved

### Links

- HTTP and HTTPS URLs
- One per line
- Displayed as clickable cards with link icon

### Images

- JPG, PNG formats
- Up to 3 per reply
- From camera or gallery
- Compressed for upload
- Full-screen viewer available

---

## Languages Supported

All text in the reply system supports 3 languages:

- 🇬🇧 English
- 🇸🇦 Arabic (RTL support)
- Kurdish (Sorani)

Language changes automatically based on app settings.
