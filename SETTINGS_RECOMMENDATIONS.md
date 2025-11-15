# Additional Settings Recommendations

## 🎯 Priority Settings to Implement

### 1. **Privacy & Security Settings** (HIGH PRIORITY)

#### Settings to Add:

- **Block Users**: Maintain a blocked users list
- **Profile Visibility**: Control who can see your profile
- **Post Visibility**: Default visibility for new posts
- **Show Online Status**: Toggle visibility

#### Implementation Example:

```jsx
// Add to AppSettingsContext.jsx
const [privacySettings, setPrivacySettings] = useState({
  profileVisibility: "everyone", // 'everyone', 'university', 'private'
  postVisibility: "everyone",
  showOnlineStatus: true,
  blockedUsers: [],
});

const updatePrivacySetting = async (key, value) => {
  try {
    const updated = { ...privacySettings, [key]: value };
    setPrivacySettings(updated);
    await AsyncStorage.setItem("privacySettings", JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving privacy settings:", error);
  }
};

const blockUser = async (userId) => {
  try {
    const blockedUsers = [...privacySettings.blockedUsers, userId];
    await updatePrivacySetting("blockedUsers", blockedUsers);
  } catch (error) {
    console.error("Error blocking user:", error);
  }
};

const unblockUser = async (userId) => {
  try {
    const blockedUsers = privacySettings.blockedUsers.filter(
      (id) => id !== userId
    );
    await updatePrivacySetting("blockedUsers", blockedUsers);
  } catch (error) {
    console.error("Error unblocking user:", error);
  }
};
```

```jsx
// PrivacySettings.jsx
import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useAppSettings } from "../../context/AppSettingsContext";

const PrivacySettings = ({ navigation }) => {
  const { t, theme, privacySettings, updatePrivacySetting } = useAppSettings();

  const visibilityOptions = [
    { value: "everyone", label: t("privacy.everyone"), icon: "globe-outline" },
    {
      value: "university",
      label: t("privacy.universityOnly"),
      icon: "school-outline",
    },
    {
      value: "private",
      label: t("privacy.private"),
      icon: "lock-closed-outline",
    },
  ];

  return (
    <ScrollView>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t("privacy.profileVisibility")}
        </Text>
        {visibilityOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() =>
              updatePrivacySetting("profileVisibility", option.value)
            }
            style={styles.optionItem}
          >
            <Ionicons name={option.icon} size={20} />
            <Text>{option.label}</Text>
            {privacySettings.profileVisibility === option.value && (
              <Ionicons name="checkmark" color={theme.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};
```

---

### 2. **Content Preferences** (HIGH PRIORITY)

#### Settings to Add:

- **Auto-play Videos**: Toggle auto-play in feed
- **Data Saver Mode**: Reduce image quality on cellular data
- **Show Sensitive Content**: Content filtering
- **Default Post Sort**: Recent, Popular, Trending

#### Implementation:

```jsx
// Add to AppSettingsContext.jsx
const [contentSettings, setContentSettings] = useState({
  autoPlayVideos: true,
  dataSaverMode: false,
  showSensitiveContent: false,
  defaultPostSort: "recent", // 'recent', 'popular', 'trending'
  imageQuality: "high", // 'high', 'medium', 'low'
});

const updateContentSetting = async (key, value) => {
  try {
    const updated = { ...contentSettings, [key]: value };
    setContentSettings(updated);
    await AsyncStorage.setItem("contentSettings", JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving content settings:", error);
  }
};
```

---

### 3. **Accessibility Settings** (MEDIUM PRIORITY)

#### Settings to Add:

- **Reduce Motion**: Minimize animations
- **High Contrast Mode**: Enhanced contrast
- **Haptic Feedback**: Toggle vibration

#### Implementation:

```jsx
// Add to AppSettingsContext.jsx
const [accessibilitySettings, setAccessibilitySettings] = useState({
  reduceMotion: false,
  highContrastMode: false,
  hapticFeedback: true,
});

const updateAccessibilitySetting = async (key, value) => {
  try {
    const updated = { ...accessibilitySettings, [key]: value };
    setAccessibilitySettings(updated);
    await AsyncStorage.setItem(
      "accessibilitySettings",
      JSON.stringify(updated)
    );
  } catch (error) {
    console.error("Error saving accessibility settings:", error);
  }
};
```

**Usage in Components:**

```jsx
// Animated component respecting reduce motion
const AnimatedComponent = () => {
  const { accessibilitySettings } = useAppSettings();

  return (
    <Animated.View
      style={{
        transform: accessibilitySettings.reduceMotion
          ? []
          : [{ scale: animatedValue }],
      }}
    />
  );
};

// Haptic feedback
import * as Haptics from "expo-haptics";

const handlePress = () => {
  if (accessibilitySettings.hapticFeedback) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  // ... rest of logic
};
```

---

### 4. **Cache Management** (HIGH PRIORITY)

#### Settings to Add:

- **Clear Cache**: Remove cached images/data
- **View Cache Size**: Show current cache usage
- **Auto-Clear Cache**: Automatically clear old cache

#### Implementation:

```jsx
import * as FileSystem from "expo-file-system";

const getCacheSize = async () => {
  try {
    const cacheDir = FileSystem.cacheDirectory;
    const info = await FileSystem.getInfoAsync(cacheDir);
    // Calculate size in MB
    return (info.size / (1024 * 1024)).toFixed(2);
  } catch (error) {
    console.error("Error getting cache size:", error);
    return "0";
  }
};

const clearCache = async () => {
  try {
    const cacheDir = FileSystem.cacheDirectory;
    await FileSystem.deleteAsync(cacheDir, { idempotent: true });
    Alert.alert(t("settings.success"), t("settings.cacheCleared"));
  } catch (error) {
    console.error("Error clearing cache:", error);
    Alert.alert(t("common.error"), t("settings.cacheClearError"));
  }
};
```

---

### 5. **Communication Settings** (MEDIUM PRIORITY)

#### Settings to Add:

- **Chat Availability**: Control who can message you
- **Read Receipts**: Show when you've read messages
- **Typing Indicators**: Show when you're typing

```jsx
const [chatSettings, setChatSettings] = useState({
  chatAvailability: "everyone", // 'everyone', 'connections', 'nobody'
  readReceipts: true,
  typingIndicators: true,
});
```

---

### 6. **Study & Academic Settings** (LOW PRIORITY - Specific to College App)

#### Settings to Add:

- **Study Reminders**: Notification reminders
- **Exam Mode**: Reduce notifications during study
- **Department Filters**: Customize feed

```jsx
const [studySettings, setStudySettings] = useState({
  studyReminders: true,
  examMode: false,
  examModeSchedule: null,
  departmentFilters: [],
});
```

---

## 📊 Settings Organization Structure

```
Settings
├── Profile Settings
│   ├── Edit Profile
│   ├── Change Password
│   └── Academic Information
│
├── Personalization ✅ (Already exists)
│   ├── Appearance (Theme)
│   ├── Language
│   └── Font Size ✅ (Now functional!)
│
├── Privacy & Security (NEW - HIGH PRIORITY)
│   ├── Profile Visibility
│   ├── Post Visibility
│   ├── Online Status
│   └── Blocked Users
│
├── Content Preferences (NEW - HIGH PRIORITY)
│   ├── Auto-play Videos
│   ├── Data Saver Mode
│   ├── Image Quality
│   └── Default Sort
│
├── Notifications
│   ├── Push Notifications
│   ├── Email Notifications
│   └── Notification Types (Posts, Comments, Messages)
│
├── Accessibility (NEW - MEDIUM PRIORITY)
│   ├── Reduce Motion
│   ├── High Contrast
│   └── Haptic Feedback
│
├── Chat Settings (NEW - MEDIUM PRIORITY)
│   ├── Who Can Message You
│   ├── Read Receipts
│   └── Typing Indicators
│
├── Storage & Cache (NEW - HIGH PRIORITY)
│   ├── Cache Size
│   ├── Clear Cache
│   └── Auto-Clear Settings
│
├── Study Settings (NEW - LOW PRIORITY)
│   ├── Study Reminders
│   ├── Exam Mode
│   └── Department Filters
│
└── Account
    ├── Reset Settings
    ├── Export Data
    ├── Delete Account
    └── Logout
```

---

## 🎨 Translation Keys Needed

Add these to your translation files (en.js, ar.js, ku.js):

```javascript
// Privacy Settings
privacy: {
  title: 'Privacy & Security',
  profileVisibility: 'Profile Visibility',
  everyone: 'Everyone',
  universityOnly: 'University Only',
  private: 'Private',
  postVisibility: 'Default Post Visibility',
  onlineStatus: 'Show Online Status',
  blockedUsers: 'Blocked Users',
  blockUser: 'Block User',
  unblockUser: 'Unblock',
},

// Content Settings
content: {
  title: 'Content Preferences',
  autoPlayVideos: 'Auto-play Videos',
  dataSaverMode: 'Data Saver Mode',
  imageQuality: 'Image Quality',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  showSensitiveContent: 'Show Sensitive Content',
  defaultSort: 'Default Post Sort',
  recent: 'Most Recent',
  popular: 'Most Popular',
  trending: 'Trending',
},

// Accessibility
accessibility: {
  title: 'Accessibility',
  reduceMotion: 'Reduce Motion',
  reduceMotionDesc: 'Minimize animations and effects',
  highContrast: 'High Contrast Mode',
  highContrastDesc: 'Enhance text readability',
  hapticFeedback: 'Haptic Feedback',
  hapticFeedbackDesc: 'Vibration feedback for interactions',
},

// Cache
cache: {
  title: 'Storage & Cache',
  cacheSize: 'Cache Size',
  clearCache: 'Clear Cache',
  cacheCleared: 'Cache cleared successfully',
  cacheClearError: 'Failed to clear cache',
  autoClear: 'Auto-clear Cache',
},

// Chat Settings
chat: {
  title: 'Chat Settings',
  availability: 'Who Can Message You',
  readReceipts: 'Read Receipts',
  typingIndicators: 'Typing Indicators',
  connections: 'Connections Only',
  nobody: 'Nobody',
},
```

---

## ✅ Implementation Checklist

### Completed:

- [x] Font Size Scaling (Fully Functional)
- [x] Theme Switching (Dark/Light/System)
- [x] Language Selection
- [x] Notification Toggle

### High Priority (Implement Next):

- [ ] Privacy & Security Settings
  - [ ] Profile Visibility
  - [ ] Post Visibility
  - [ ] Block Users
- [ ] Content Preferences
  - [ ] Auto-play Videos
  - [ ] Data Saver Mode
- [ ] Cache Management
  - [ ] View Cache Size
  - [ ] Clear Cache Button

### Medium Priority:

- [ ] Accessibility Settings
  - [ ] Reduce Motion
  - [ ] High Contrast Mode
  - [ ] Haptic Feedback
- [ ] Chat Settings
  - [ ] Message Privacy
  - [ ] Read Receipts
  - [ ] Typing Indicators

### Low Priority:

- [ ] Study & Academic Settings
- [ ] Advanced Settings (Developer Mode, Beta Features)
- [ ] Export User Data (GDPR Compliance)

---

## 🚀 Quick Start: Adding Your First New Setting

Let's add "Auto-play Videos" as an example:

### Step 1: Update AppSettingsContext.jsx

```jsx
const [autoPlayVideos, setAutoPlayVideos] = useState(true);

// In loadSettings:
const savedAutoPlay = await AsyncStorage.getItem('autoPlayVideos');
if (savedAutoPlay !== null) {
  setAutoPlayVideos(savedAutoPlay === 'true');
}

const toggleAutoPlayVideos = async () => {
  try {
    const newValue = !autoPlayVideos;
    setAutoPlayVideos(newValue);
    await AsyncStorage.setItem('autoPlayVideos', newValue.toString());
  } catch (error) {
    console.error('Error saving auto-play setting:', error);
  }
};

// Add to context value:
autoPlayVideos,
toggleAutoPlayVideos,
```

### Step 2: Create ContentSettings.jsx

```jsx
import React from "react";
import { View, Text, Switch } from "react-native";
import { useAppSettings } from "../../context/AppSettingsContext";

const ContentSettings = ({ navigation }) => {
  const { t, theme, autoPlayVideos, toggleAutoPlayVideos } = useAppSettings();

  return (
    <View style={{ padding: 16 }}>
      <View style={styles.settingRow}>
        <Text style={{ color: theme.text }}>{t("content.autoPlayVideos")}</Text>
        <Switch value={autoPlayVideos} onValueChange={toggleAutoPlayVideos} />
      </View>
    </View>
  );
};
```

### Step 3: Add to Settings Navigation

```jsx
// In Settings.jsx
<SettingCard
  icon="play-circle-outline"
  title={t("content.title")}
  onPress={() => navigation.navigate("ContentSettings")}
/>
```

### Step 4: Use in Components

```jsx
// In a video component
const VideoPlayer = ({ videoUrl }) => {
  const { autoPlayVideos } = useAppSettings();

  return (
    <Video
      source={{ uri: videoUrl }}
      shouldPlay={autoPlayVideos}
      // ... other props
    />
  );
};
```

Done! 🎉
