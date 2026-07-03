// app.config.js
// ─────────────────────────────────────────────────────────────────────────────
// BEFORE SUBMITTING TO STORES:
//   1. Add ./assets/icon.png          1024×1024 PNG, no alpha (iOS + Android)
//   2. Add ./assets/adaptive-icon.png 1024×1024 PNG (Android adaptive foreground)
//   3. Add ./assets/splash.png        1284×2778 PNG (iPhone 14 Pro Max canvas)
//   4. Replace PRIVACY_POLICY_URL below with your real hosted privacy policy
//   5. Replace SUPPORT_URL below with your support contact page
//   6. Set APPLE_TEAM_ID to your Apple Developer Team ID
//   7. Set EAS_PROJECT_ID (run `eas init` once, then export the printed UUID).
//      Without it, `eas build`/`eas update` cannot link the project and OTA is off.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');

const PRIVACY_POLICY_URL = 'https://yakine.tn/privacy';
const SUPPORT_URL = 'https://yakine.tn/support';
const BUNDLE_ID = 'tn.yakine.audiolearner';

// EAS project ID is a UUID tied to your Expo account — never a slug.
// Run `eas init` (or `eas project:info`) to get it, then set EAS_PROJECT_ID.
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID || '';

// google-services.json is ONLY required once you add Firebase Cloud Messaging
// (remote push). The app currently uses notifee for local notifications only,
// so the build must not hard-depend on a file that isn't there yet.
const GOOGLE_SERVICES_FILE = fs.existsSync('./google-services.json')
  ? './google-services.json'
  : undefined;

module.exports = {
  expo: {
    name: 'Yakine',
    slug: 'yakine-audio-learner',
    scheme: 'yakineaudiolearner',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,

    // ── Icons & Splash ──────────────────────────────────────────────────────
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#6C63FF',
    },

    // ── Fonts & Assets ──────────────────────────────────────────────────────
    assetBundlePatterns: ['assets/**/*', 'src/assets/**/*'],

    // ── OTA Updates ─────────────────────────────────────────────────────────
    // URL is derived from the EAS project UUID; omitted until EAS_PROJECT_ID is
    // set so a wrong (slug-based) URL can't silently break OTA delivery.
    updates: {
      fallbackToCacheTimeout: 0,
      ...(EAS_PROJECT_ID && { url: `https://u.expo.dev/${EAS_PROJECT_ID}` }),
    },
    runtimeVersion: {
      policy: 'appVersion',
    },

    // ── iOS ─────────────────────────────────────────────────────────────────
    ios: {
      bundleIdentifier: BUNDLE_ID,
      buildNumber: '1',
      supportsTablet: false,
      requireFullScreen: true,

      // Background audio — users must be able to continue listening when the
      // app is not in the foreground (commuting, studying with screen off).
      infoPlist: {
        UIBackgroundModes: ['audio'],
        // Declare that the app only uses encryption exempt from US export regs
        // (MMKV local AES-256 storage — no custom crypto, no data-in-transit encryption)
        ITSAppUsesNonExemptEncryption: false,
        NSMicrophoneUsageDescription:
          'Yakine uses the microphone to let teachers record audio lessons directly in the app.',
        // Required by Apple for apps that include audio content
        NSAppleMusicUsageDescription:
          'Yakine plays educational audio lessons. No Apple Music access is requested.',
      },

      privacyManifests: {
        NSPrivacyAccessedAPITypes: [
          {
            // MMKV uses UserDefaults as a fallback path
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
            NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
          },
          {
            // react-native-fs uses file timestamp APIs
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
            NSPrivacyAccessedAPITypeReasons: ['C617.1'],
          },
        ],
        NSPrivacyCollectedDataTypes: [],
        NSPrivacyTracking: false,
      },
    },

    // ── Android ─────────────────────────────────────────────────────────────
    android: {
      package: BUNDLE_ID,
      versionCode: 1,

      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#6C63FF',
      },

      // Target API 35 — required for new apps submitted to Play Store after 2025
      targetSdkVersion: 35,
      compileSdkVersion: 35,
      minSdkVersion: 24,

      permissions: [
        // Network
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
        // Background audio (expo-audio + react-native-track-player)
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
        'android.permission.WAKE_LOCK',
        // Offline download storage
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        // Push notifications (Android 13+)
        'android.permission.POST_NOTIFICATIONS',
        // Notifications scheduling (notifee)
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.SCHEDULE_EXACT_ALARM',
        // Microphone for teacher in-app recording (Sprint 5.4)
        'android.permission.RECORD_AUDIO',
      ],

      blockedPermissions: [
        // Remove permissions we definitely do not use
        'android.permission.READ_CONTACTS',
        'android.permission.WRITE_CONTACTS',
        'android.permission.READ_CALL_LOG',
        'android.permission.CAMERA',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
      ],

      // Only set when the file exists (see GOOGLE_SERVICES_FILE above).
      ...(GOOGLE_SERVICES_FILE && { googleServicesFile: GOOGLE_SERVICES_FILE }),

      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'yakine.tn',
              pathPrefix: '/lesson',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },

    // ── Web (if ever enabled) ────────────────────────────────────────────────
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },

    // ── Plugins ─────────────────────────────────────────────────────────────
    plugins: [
      [
        'expo-font',
        {
          fonts: [
            './src/assets/fonts/Lexend-Bold.ttf',
            './src/assets/fonts/Lexend-ExtraBold.ttf',
            './src/assets/fonts/Roboto-Regular.ttf',
            './src/assets/fonts/Roboto-Medium.ttf',
            './src/assets/fonts/Roboto-Bold.ttf',
          ],
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/splash.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#6C63FF',
        },
      ],
      [
        'expo-audio',
        {
          microphonePermission:
            'Allow Yakine to access the microphone to record audio lessons.',
        },
      ],
      // NOTE: @react-native-community/netinfo and @notifee/react-native are
      // autolinked native modules, NOT config plugins — listing them here makes
      // `expo start` throw a PluginError. They work without an entry.
      // (Notifee's iOS static-framework requirement, if needed for a native
      //  build, belongs in `expo-build-properties`, not a notifee plugin entry.)
    ],

    // ── Extra (runtime env forwarding) ──────────────────────────────────────
    extra: {
      privacyPolicyUrl: PRIVACY_POLICY_URL,
      supportUrl: SUPPORT_URL,
      // projectId must be the EAS UUID. Omitted (not faked) until EAS_PROJECT_ID
      // is set, so `eas` can prompt/link correctly instead of failing on a slug.
      ...(EAS_PROJECT_ID && { eas: { projectId: EAS_PROJECT_ID } }),
    },
  },
};
