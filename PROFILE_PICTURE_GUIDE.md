# Profile Picture Upload - Visual Guide

## UI Layout

```
┌─────────────────────────────────────┐
│  ← Profile Settings            ✏️   │  Header with back button and edit icon
├─────────────────────────────────────┤
│                                     │
│           ┌───────────┐             │
│           │           │             │
│           │    👤     │  ⊕          │  Profile picture with plus button
│           │           │             │
│           └───────────┘             │
│                                     │
├─────────────────────────────────────┤
│  Glass Card Container               │
│  ┌─────────────────────────────┐   │
│  │ Full Name                   │   │
│  │ [John Doe              ]    │   │
│  │                             │   │
│  │ College Email               │   │
│  │ [john@university.edu]       │   │
│  │                             │   │
│  │ Bio                         │   │
│  │ [Tell us about yourself...] │   │
│  │                             │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Profile Picture States

### 1. No Profile Picture (Placeholder)

```
┌─────────────┐
│             │
│             │
│      👤     │  Person icon in theme color
│             │
│             │
└─────────────┘
      ⊕        Plus icon button (bottom-right)
```

### 2. With Profile Picture

```
┌─────────────┐
│             │
│   [IMAGE]   │  User's uploaded photo
│             │
└─────────────┘
      ⊕        Plus icon button to change
```

### 3. Uploading State

```
┌─────────────┐
│             │
│   [IMAGE]   │
│             │
└─────────────┘
      ⏳       Loading spinner in button
```

## User Flow

```
1. User opens Profile Settings
   │
   ├─ Has profile picture?
   │  ├─ Yes: Show image
   │  └─ No: Show placeholder with person icon
   │
2. User taps plus button
   │
3. System checks permissions
   │
   ├─ Has permission?
   │  ├─ Yes: Open image picker
   │  └─ No: Request permission
   │
4. User selects image from gallery
   │
5. Image picker shows with:
   │  - Square crop (1:1 ratio)
   │  - Zoom/pan controls
   │
6. User confirms selection
   │
7. System processes image:
   │  - Resize to 800x800px
   │  - Compress to 70% quality
   │  - Convert to base64
   │
8. Upload to ImgBB
   │
   ├─ Success?
   │  ├─ Yes: Update UI and save URL
   │  └─ No: Show error message
   │
9. Done!
```

## Button Positioning

```css
Upload Button Position:
- Position: absolute
- Bottom: 0 (at bottom edge of profile picture)
- Right: 0 (at right edge of profile picture)
- Size: 36x36px
- Border Radius: 18px (circular)
- Border: 3px white border
- Background: Theme primary color
- Icon: Plus icon, 20px, white
- Shadow: Medium elevation
```

## Responsive Design

```
Profile Picture Size:
- Width: 120px
- Height: 120px
- Border Radius: 60px (circular)
- Border: 3px with opacity 0.3

Upload Button:
- Width: 36px
- Height: 36px
- Border Radius: 18px
- Position: absolute, bottom-right corner
```

## Color Scheme

```javascript
// Light Mode
Profile Picture Border: rgba(255, 255, 255, 0.3)
Placeholder Background: theme.primary + '20' (20% opacity)
Placeholder Icon: theme.primary
Upload Button Background: theme.primary
Upload Button Icon: #FFFFFF

// Dark Mode
Profile Picture Border: rgba(255, 255, 255, 0.3)
Placeholder Background: theme.primary + '20'
Placeholder Icon: theme.primary
Upload Button Background: theme.primary
Upload Button Icon: #FFFFFF
```

## Accessibility

- Touchable area: Full 36x36px button area
- Active opacity: 0.7 for visual feedback
- Loading state: Activity indicator replaces icon
- Error messages: Alert dialogs with clear text
- RTL support: Works with Arabic and Kurdish layouts

## Image Specifications

```
Input Requirements:
- Formats: JPG, PNG, GIF, WebP
- Max file size: 32 MB (before compression)
- Source: Device photo library

Processing:
- Crop: 1:1 square aspect ratio
- Resize: 800x800 pixels
- Compression: 70% JPEG quality
- Format: JPEG output

Output:
- Format: JPEG
- Dimensions: 800x800px
- Quality: 70%
- Encoding: Base64 for upload
- Storage: ImgBB CDN
```

## Translation Keys

```javascript
// English
settings.profilePictureUploaded: "Profile picture uploaded successfully!"
settings.profilePictureUploadError: "Failed to upload profile picture. Please try again."
settings.cameraPermissionRequired: "Camera roll permission is required to upload images."

// Arabic
settings.profilePictureUploaded: "تم رفع الصورة الشخصية بنجاح!"
settings.profilePictureUploadError: "فشل رفع الصورة الشخصية. حاول مرة أخرى."
settings.cameraPermissionRequired: "إذن الوصول إلى معرض الصور مطلوب لرفع الصور."

// Kurdish
settings.profilePictureUploaded: "وێنەی پرۆفایل بە سەرکەوتوویی بارکرا!"
settings.profilePictureUploadError: "بارکردنی وێنەی پرۆفایل سەرکەوتوو نەبوو. دووبارە هەوڵ بدەرەوە."
settings.cameraPermissionRequired: "مۆڵەتی دەستگەیشتن بە ئەلبومی وێنە پێویستە بۆ بارکردنی وێنەکان."
```
