import type { ExpoConfig, ConfigContext } from 'expo/config';

const SUPABASE_URL = 'https://ryytjqkqgmnosfifqumg.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eXRqcWtxZ21ub3NmaWZxdW1nIiwicm9sIjoiYW5vbiIsImlhdCI6MTc4NTIzMTIzMywiZXhwIjoyMTAwODA3MjMzfQ.89KmrT28giZmNFhaG_GjQjkMp9wI9HKuurX26SmTfaw';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'نور السودان',
  slug: 'nour-sudan',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'noursudan',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'cover',
    backgroundColor: '#0a0a0a',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'sd.nour.app',
    config: {
      googleMapsApiKey: '',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0a0a0a',
    },
    package: 'sd.nour.app',
    googleServicesFile: './google-services.json',
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
    ],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
      },
    },
    jsEngine: 'jsc',
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },
  platforms: ['android', 'ios'],
  plugins: [
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'يستخدم التطبيق الموقع لعرض الخدمات القريبة منك.',
        locationWhenInUsePermission:
          'يستخدم التطبيق الموقع لعرض الخدمات القريبة منك.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'يحتاج التطبيق للوصول إلى الصور لإضافة صور للإعلانات.',
      },
    ],
  ],
  extra: {
    eas: {
    },
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
  },
});
