# Custom Alert Component Usage Guide

## Overview

The `CustomAlert` component replaces React Native's default `Alert.alert()` with a beautifully designed, themed alert that matches the app's design system.

## Features

- Glassmorphism design matching the app theme
- Animated entrance/exit
- Support for multiple alert types (success, error, warning, info)
- Customizable buttons
- Dark mode support
- Icons for different alert types

## Basic Usage

### 1. Import the hook

```javascript
import { useCustomAlert } from "../hooks/useCustomAlert";
import CustomAlert from "../components/CustomAlert";
```

### 2. Initialize in your component

```javascript
const YourComponent = () => {
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  // Your component code...

  return (
    <View>
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={hideAlert}
      />

      {/* Your other components */}
    </View>
  );
};
```

### 3. Show alerts

```javascript
// Simple info alert
showAlert({
  type: "info",
  title: "Information",
  message: "This is an info message",
});

// Success alert
showAlert({
  type: "success",
  title: "Success!",
  message: "Operation completed successfully",
});

// Error alert
showAlert({
  type: "error",
  title: "Error",
  message: "Something went wrong",
});

// Warning alert
showAlert({
  type: "warning",
  title: "Warning",
  message: "Please be careful",
});

// Alert with custom buttons
showAlert({
  type: "warning",
  title: "Delete Item?",
  message: "This action cannot be undone",
  buttons: [
    {
      text: "Cancel",
      style: "cancel",
      onPress: () => console.log("Cancelled"),
    },
    {
      text: "Delete",
      style: "destructive",
      onPress: () => console.log("Deleted"),
    },
  ],
});
```

## Alert Types

- `success`: Green checkmark icon
- `error`: Red close circle icon
- `warning`: Orange warning icon
- `info`: Blue information icon (default)

## Button Styles

- `primary`: Blue background (default action)
- `destructive`: Red background (dangerous action)
- `cancel`: Light background (cancel action)
- `default`: Light background (secondary action)

## Migration from Alert.alert()

### Before:

```javascript
Alert.alert("Success", "Profile updated successfully");
```

### After:

```javascript
showAlert({
  type: "success",
  title: "Success",
  message: "Profile updated successfully",
});
```

### Before (with buttons):

```javascript
Alert.alert("Delete Account", "Are you sure you want to delete your account?", [
  { text: "Cancel", style: "cancel" },
  { text: "Delete", style: "destructive", onPress: handleDelete },
]);
```

### After:

```javascript
showAlert({
  type: "warning",
  title: "Delete Account",
  message: "Are you sure you want to delete your account?",
  buttons: [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: handleDelete },
  ],
});
```

## Keyboard Aware View

The app now uses `KeyboardAwareView` component for consistent keyboard handling:

```javascript
import KeyboardAwareView from "../components/KeyboardAwareView";

<KeyboardAwareView keyboardVerticalOffset={0}>
  {/* Your content */}
</KeyboardAwareView>;
```

This ensures that text inputs are not blocked by the keyboard on both iOS and Android.
