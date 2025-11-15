# ⚡ Quick Reference: Font Scaling

## Usage in Components

```jsx
import { useAppSettings } from "../context/AppSettingsContext";

const MyComponent = () => {
  const { fontSizes, getResponsiveFontSize, theme } = useAppSettings();

  return (
    <View>
      {/* Method 1: Predefined sizes (RECOMMENDED) */}
      <Text style={{ fontSize: fontSizes.base, color: theme.text }}>
        Hello World
      </Text>

      {/* Method 2: Dynamic sizing */}
      <Text style={{ fontSize: getResponsiveFontSize(16), color: theme.text }}>
        Hello World
      </Text>
    </View>
  );
};
```

## Font Size Scale

| Key      | Base     | Small     | Medium    | Large     |
| -------- | -------- | --------- | --------- | --------- |
| xs       | 10px     | ~9px      | ~10px     | ~11px     |
| sm       | 12px     | ~10px     | ~12px     | ~14px     |
| md       | 14px     | ~12px     | ~14px     | ~16px     |
| **base** | **16px** | **~14px** | **~16px** | **~18px** |
| lg       | 18px     | ~16px     | ~18px     | ~21px     |
| xl       | 20px     | ~17px     | ~20px     | ~23px     |
| xxl      | 24px     | ~21px     | ~24px     | ~28px     |
| xxxl     | 28px     | ~24px     | ~28px     | ~32px     |

## Best Practices

✅ DO:

- Use `fontSizes.base` for body text
- Use `fontSizes.sm` for secondary text
- Use `fontSizes.lg` or `fontSizes.xl` for headings
- Test with all three font size settings

❌ DON'T:

- Hardcode font sizes: `fontSize: 16`
- Use StyleSheet outside components (can't access context)
- Forget to test layout at larger sizes

## Context Properties

```javascript
const {
  // Font Scaling
  fontSize, // 'small', 'medium', or 'large'
  changeFontSize, // (size: string) => void
  getResponsiveFontSize, // (baseSize: number) => number
  fontSizes, // { xs, sm, md, base, lg, xl, xxl, xxxl }

  // Theme
  theme, // Current theme object
  isDarkMode, // boolean

  // Other
  t, // Translation function
} = useAppSettings();
```

## Common Patterns

### Post Card

```jsx
<View style={styles.card}>
  <Text style={{ fontSize: fontSizes.base, fontWeight: "600" }}>User Name</Text>
  <Text style={{ fontSize: fontSizes.sm, color: theme.textSecondary }}>
    2 hours ago
  </Text>
  <Text style={{ fontSize: fontSizes.md }}>Post content goes here...</Text>
</View>
```

### Button

```jsx
<TouchableOpacity style={styles.button}>
  <Text style={{ fontSize: fontSizes.base, fontWeight: "600", color: "#FFF" }}>
    Submit
  </Text>
</TouchableOpacity>
```

### Settings Item

```jsx
<View style={styles.setting}>
  <Text style={{ fontSize: fontSizes.base }}>Setting Name</Text>
  <Text style={{ fontSize: fontSizes.sm, color: theme.textSecondary }}>
    Description text
  </Text>
</View>
```

---

📖 **Full Documentation**: See FONT_SCALING_GUIDE.md  
🎨 **Settings Ideas**: See SETTINGS_RECOMMENDATIONS.md  
📋 **Complete Summary**: See SUMMARY.md
