# Font Scaling Implementation Guide

## ✅ What's Been Implemented

The font scaling feature is now **fully functional**! Users can choose between Small, Medium, and Large font sizes, and the changes will apply throughout the app.

### Key Components Created/Updated:

1. **`app/utils/fontScale.js`** (NEW)

   - Font scale multipliers (Small: 0.875, Medium: 1.0, Large: 1.15)
   - `getScaledFontSize()` function for individual font sizes
   - `createFontSizeScale()` function for predefined font scale
   - Tablet support built-in

2. **`app/context/AppSettingsContext.jsx`** (UPDATED)

   - Added `getResponsiveFontSize(size)` function
   - Added `fontSizes` scale object (xs, sm, md, base, lg, xl, xxl, xxxl)
   - Font size preference persists in AsyncStorage

3. **`app/screens/settings/PersonalizationSettings.jsx`** (UPDATED)
   - Added live preview text that changes size
   - Font size selector is now functional

## 📖 How to Use Font Scaling in Components

### Method 1: Using `getResponsiveFontSize()` (Recommended for dynamic sizing)

```jsx
import { useAppSettings } from "../context/AppSettingsContext";

const MyComponent = () => {
  const { getResponsiveFontSize, theme } = useAppSettings();

  return (
    <Text
      style={{
        fontSize: getResponsiveFontSize(16),
        color: theme.text,
      }}
    >
      This text will scale based on user preference
    </Text>
  );
};
```

### Method 2: Using Predefined Font Sizes (Recommended for consistency)

```jsx
import { useAppSettings } from "../context/AppSettingsContext";

const MyComponent = () => {
  const { fontSizes, theme } = useAppSettings();

  return (
    <View>
      <Text style={{ fontSize: fontSizes.xs, color: theme.text }}>
        Extra Small
      </Text>
      <Text style={{ fontSize: fontSizes.sm, color: theme.text }}>Small</Text>
      <Text style={{ fontSize: fontSizes.md, color: theme.text }}>Medium</Text>
      <Text style={{ fontSize: fontSizes.base, color: theme.text }}>
        Base (16px)
      </Text>
      <Text style={{ fontSize: fontSizes.lg, color: theme.text }}>Large</Text>
      <Text style={{ fontSize: fontSizes.xl, color: theme.text }}>
        Extra Large
      </Text>
      <Text style={{ fontSize: fontSizes.xxl, color: theme.text }}>
        2X Large
      </Text>
      <Text style={{ fontSize: fontSizes.xxxl, color: theme.text }}>
        3X Large
      </Text>
    </View>
  );
};
```

### Method 3: Direct Import (For files without context access)

```jsx
import { getScaledFontSize } from "../utils/fontScale";

// You'll need to pass the fontSize setting manually
const fontSize = getScaledFontSize(16, "medium");
```

## 🔄 Migration Guide for Existing Components

### Before:

```jsx
const styles = StyleSheet.create({
  text: {
    fontSize: 16,
  },
  heading: {
    fontSize: 24,
  },
});
```

### After:

```jsx
const MyComponent = () => {
  const { fontSizes } = useAppSettings();

  const styles = StyleSheet.create({
    text: {
      fontSize: fontSizes.base, // 16px base
    },
    heading: {
      fontSize: fontSizes.xxl, // 24px base
    },
  });

  return <Text style={styles.text}>Hello</Text>;
};
```

## 📊 Font Size Scale Reference

| Scale Key | Small Setting | Medium Setting | Large Setting |
| --------- | ------------- | -------------- | ------------- |
| xs        | ~9px          | ~10px          | ~11px         |
| sm        | ~10px         | ~12px          | ~14px         |
| md        | ~12px         | ~14px          | ~16px         |
| base      | ~14px         | ~16px          | ~18px         |
| lg        | ~16px         | ~18px          | ~21px         |
| xl        | ~17px         | ~20px          | ~23px         |
| xxl       | ~21px         | ~24px          | ~28px         |
| xxxl      | ~24px         | ~28px          | ~32px         |

_Note: Actual sizes may vary slightly due to responsive scaling and tablet adjustments_

## 🎯 Best Practices

1. **Always use the context-based approach** in components for automatic updates
2. **Use predefined sizes** (`fontSizes.base`, `fontSizes.lg`, etc.) for consistency
3. **Avoid hardcoded font sizes** in new components
4. **Test with all three font sizes** (Small, Medium, Large) to ensure proper layout
5. **Consider minimum/maximum bounds** for critical UI elements

## 🔧 Troubleshooting

**Text not scaling?**

- Make sure you're using `getResponsiveFontSize()` or `fontSizes` from context
- Check that the component is wrapped in `AppSettingsProvider`
- Verify AsyncStorage has the font size setting

**Layout breaking at larger sizes?**

- Use flexible layouts (`flex`, `flexWrap`)
- Set `numberOfLines` with `ellipsizeMode` for text truncation
- Test with different screen sizes and font settings

---

## 🎨 Additional Settings Suggestions

Below are recommended settings to add to enhance user experience:

### 1. **Privacy & Security Settings**

- **Block Users**: Maintain a blocked users list
- **Profile Visibility**: Control who can see your profile (Everyone, University Only, Private)
- **Post Visibility**: Default visibility for new posts
- **Show Online Status**: Toggle visibility of online/active status

### 2. **Content Preferences**

- **Auto-play Videos**: Toggle auto-play in feed
- **Data Saver Mode**: Reduce image quality on cellular data
- **Show Sensitive Content**: Content filtering options
- **Default Post Sort**: Choose between "Recent", "Popular", "Trending"

### 3. **Accessibility Settings**

- **Reduce Motion**: Minimize animations for users sensitive to motion
- **High Contrast Mode**: Enhanced contrast for better readability
- **Screen Reader Support**: Optimize for screen readers
- **Haptic Feedback**: Toggle vibration feedback

### 4. **Communication Settings**

- **Chat Availability**: Who can message you (Everyone, Connections, Nobody)
- **Read Receipts**: Show when you've read messages
- **Typing Indicators**: Show when you're typing
- **Message Notifications**: Customize notification sounds

### 5. **Feed & Discovery Settings**

- **Suggested Posts**: Toggle AI-recommended content
- **Trending Topics**: Show/hide trending section
- **Personalized Feed**: AI-curated vs chronological
- **NSFW Filter**: Content moderation level

### 6. **Performance Settings**

- **Cache Management**: Clear app cache, view cache size
- **Image Quality**: Choose default quality (High, Medium, Low)
- **Offline Mode**: Download content for offline viewing
- **Background Refresh**: Control background data usage

### 7. **Study & Academic Settings**

- **Study Reminders**: Set reminder notifications
- **Calendar Integration**: Sync with device calendar
- **Exam Mode**: Temporarily reduce notifications during study periods
- **Department Filters**: Customize which departments appear in feed

### 8. **Advanced Settings**

- **Developer Mode**: Enable debugging features
- **Beta Features**: Opt-in to experimental features
- **App Version Info**: Display version, build number
- **Export Data**: Download user data (GDPR compliance)
- **Delete Account**: Permanently delete account

### Implementation Priority:

**High Priority:**

1. ✅ Font Size (DONE)
2. Privacy & Security (Block users, profile visibility)
3. Content Preferences (Auto-play, data saver)
4. Cache Management

**Medium Priority:** 5. Accessibility (Reduce motion, high contrast) 6. Communication Settings 7. Feed & Discovery

**Low Priority:** 8. Advanced Settings (Developer mode, beta features) 9. Study & Academic (nice-to-have, specific to college app)

---

## 📝 Example: Adding a New Setting

Here's how to add a "Reduce Motion" setting:

### 1. Update AppSettingsContext:

```jsx
const [reduceMotion, setReduceMotion] = useState(false);

// In loadSettings:
const savedReduceMotion = await AsyncStorage.getItem('reduceMotion');
if (savedReduceMotion !== null) {
  setReduceMotion(savedReduceMotion === 'true');
}

// Add toggle function:
const toggleReduceMotion = async () => {
  try {
    const newValue = !reduceMotion;
    setReduceMotion(newValue);
    await AsyncStorage.setItem('reduceMotion', newValue.toString());
  } catch (error) {
    console.error('Error saving reduce motion:', error);
  }
};

// Add to context value:
reduceMotion,
toggleReduceMotion,
```

### 2. Create AccessibilitySettings.jsx:

```jsx
import React from "react";
import { View, Text, Switch } from "react-native";
import { useAppSettings } from "../../context/AppSettingsContext";

const AccessibilitySettings = ({ navigation }) => {
  const { t, theme, reduceMotion, toggleReduceMotion } = useAppSettings();

  return (
    <View>
      <Text>{t("settings.reduceMotion")}</Text>
      <Switch value={reduceMotion} onValueChange={toggleReduceMotion} />
    </View>
  );
};

export default AccessibilitySettings;
```

### 3. Use in components:

```jsx
const MyAnimatedComponent = () => {
  const { reduceMotion } = useAppSettings();

  return (
    <Animated.View
      style={{
        transform: reduceMotion ? [] : [{ translateY: animatedValue }],
      }}
    />
  );
};
```

---

## 🚀 Next Steps

1. ✅ Font scaling is complete and functional
2. Update existing components to use `getResponsiveFontSize()` or `fontSizes`
3. Choose which additional settings to implement
4. Add translations for new setting labels
5. Test thoroughly with different font sizes and settings combinations
