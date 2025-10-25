# Quick Reference - ImgBB Profile Picture Upload

## Import & Use

```javascript
import { uploadProfilePicture } from "../services/imgbbService";

const handleUpload = async () => {
  try {
    const result = await uploadProfilePicture();
    if (result) {
      setProfilePicture(result.displayUrl);
    }
  } catch (error) {
    Alert.alert("Error", error.message);
  }
};
```

## API Key

```
2b74b47dbff705a8ee383763714dce86
```

## Image Specs

| Type    | Ratio | Size    | Quality | Format |
| ------- | ----- | ------- | ------- | ------ |
| Profile | 1:1   | 800x800 | 70%     | JPEG   |
| Post    | 16:9  | 1200px  | 75%     | JPEG   |

## Functions

```javascript
uploadProfilePicture(); // Square crop, 800x800
uploadPostImage(); // Landscape crop, 1200px width
```

## Response

```javascript
{
  url: "https://i.ibb.co/xxxxx/image.jpg",
  displayUrl: "https://i.ibb.co/xxxxx/image.jpg",
  deleteUrl: "https://ibb.co/xxxxx/deletetoken",
  thumbnailUrl: "https://i.ibb.co/xxxxx/thumb.jpg"
}
```

## Translation Keys

```javascript
t("settings.profilePictureUploaded");
t("settings.profilePictureUploadError");
t("settings.cameraPermissionRequired");
```

## Error Handling

```javascript
try {
  const result = await uploadProfilePicture();
} catch (error) {
  if (error.message === "Permission to access camera roll is required!") {
    // Handle permission error
  } else {
    // Handle upload error
  }
}
```

## File Locations

```
services/imgbbService.js          - Main service
app/screens/settings/ProfileSettings.jsx - Implementation example
services/README.md                - Full documentation
```

## Quick Test

```bash
npm start
# Navigate to: Settings → Profile Settings
# Tap plus button on profile picture
# Select image from gallery
# Wait for upload confirmation
```
