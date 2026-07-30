# نور السودان — Native Android App (Expo React Native)

This directory contains the native Android version of the Nour Sudan services directory app, built with Expo and React Native.

## Prerequisites

1. **Node.js** 18+ and npm
2. **Expo CLI**: `npm install -g eas-cli`
3. **Expo account**: Create one at https://expo.dev
4. **Google Maps API Key** (for maps on Android): Get one from Google Cloud Console — enable Maps SDK for Android

## Setup

```bash
cd mobile
npm install --legacy-peer-deps
```

## Running in Development

```bash
npx expo start
```

This opens the Expo dev server. Scan the QR code with Expo Go (Android) or press `a` to launch on an Android emulator.

## Building an APK with EAS

### 1. Log in to Expo

```bash
eas login
```

### 2. Configure Google Maps (required for react-native-maps on Android)

Edit `app.config.ts` and set the Google Maps API key in the `android.config.googleMaps.apiKey` field, or set the `GOOGLE_MAPS_API_KEY` environment variable before building.

### 3. Build the APK

```bash
# Development build (includes dev tools)
eas build --profile development --platform android

# Preview build (internal testing APK)
eas build --profile preview --platform android

# Production build
eas build --profile production --platform android
```

All profiles are configured to output `.apk` files (not `.aab`).

### 4. Download and Install

After the build completes, EAS provides a download URL. Download the `.apk` file and install it on your Android device (enable "Install from unknown sources" in Android settings).

## Project Structure

```
mobile/
├── app.config.ts          # Expo configuration (app name, icons, permissions, env vars)
├── eas.json               # EAS Build profiles (development, preview, production)
├── babel.config.js        # Babel config with module resolver for @/ alias
├── metro.config.js        # Metro bundler config
├── tsconfig.json          # TypeScript config
├── index.ts               # Entry point
├── assets/                # App icons and splash screen
└── src/
    ├── App.tsx            # Root app with navigation + floating Ask Nour button
    ├── lib/
    │   ├── supabase.ts    # Supabase types, constants, fallback data
    │   ├── client.ts      # Supabase client (with AsyncStorage session)
    │   ├── theme.ts       # Color palette, spacing, typography
    │   └── navigation.ts  # Navigation type definitions
    ├── context/
    │   ├── AuthContext.tsx     # Auth state (session, profile, signOut)
    │   └── AskNourContext.tsx  # Ask Nour modal state
    ├── components/
    │   ├── Icon.tsx           # Icon mapping (lucide names → MaterialCommunityIcons)
    │   ├── Button.tsx         # Reusable button (gold/outline/ghost/danger)
    │   ├── Input.tsx          # Reusable text input
    │   ├── MapPicker.tsx      # Interactive map (react-native-maps) with GPS
    │   ├── MapPreview.tsx     # Read-only map with "Open in Google Maps"
    │   ├── ImageUploader.tsx  # Multi-image upload (expo-image-picker → Supabase Storage)
    │   ├── ImageGallery.tsx   # Image gallery with lightbox
    │   └── AskNourModal.tsx   # AI chat modal
    └── screens/
        ├── HomeScreen.tsx           # Categories grid + Ask Nour widget
        ├── AuthScreen.tsx           # Sign in / Sign up
        ├── CategoryScreen.tsx       # Listings by category + add/edit form
        ├── ListingDetailScreen.tsx # Listing detail with gallery + map
        ├── DashboardScreen.tsx     # User's listings + profile editor
        ├── ProfileScreen.tsx        # Profile view
        └── SettingsHelpScreens.tsx  # Settings + Help
```

## Features

- **Interactive Maps**: Tap to set location, GPS auto-detection, "Open in Google Maps"
- **Multi-Image Upload**: Pick from gallery, upload to Supabase Storage, thumbnail previews
- **AI Assistant**: "Ask Nour" chat with streaming responses and category deep-links
- **Auth**: Email/phone sign up with account types (individual, business, professional)
- **Listings CRUD**: Create, edit, delete, toggle active/inactive across all categories
- **Luxury Theme**: Black background with gold accents throughout
- **RTL Arabic**: Full right-to-left layout support

## Supabase Configuration

The app connects to the same Supabase project as the web version. The URL and anon key are embedded in `src/lib/supabase.ts` and also configured as EAS build environment variables in `eas.json`.
