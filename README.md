# Collage Community

A React Native mobile application designed to help college students communicate, collaborate, and share resources.

## Features

- Q&A style discussions
- Group chats
- Resource sharing (notes and past papers)
- Multi-language support (English, Arabic, Kurdish)
- Modern glass-morphism UI design

## Tech Stack

- React Native with Expo
- React Navigation
- Expo Blur & Linear Gradient
- i18n-js for internationalization
- Appwrite (planned for backend)

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

3. Run on your device:
   - Scan the QR code with Expo Go app (Android/iOS)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator (macOS only)

## Project Structure

```
app/
  auth/          - Authentication screens
  components/    - Reusable components
  context/       - React context providers
  hooks/         - Custom hooks
  screens/       - Main app screens
  tabs/          - Bottom tab screens
  theme/         - Design tokens and theme
  utils/         - Utility functions
database/        - Database integration (pending)
locales/         - Translation files
```

## Development Notes

- This is a JavaScript project (no TypeScript)
- Database integration pending (considering Firebase or Appwrite)
- All text must be internationalized (no hardcoded strings)

## Version Info

- expo: ~54.0.20
- react: 19.1.0
- react-native: 0.81.5
