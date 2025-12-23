import 'dotenv/config';

export default {
  expo: {
    name: "tracking-fish",
    slug: "tracking-fish",
    version: "1.0.2",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#2F5BA8"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.trackingfish.app",
      buildNumber: "1",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "แอปต้องการเข้าถึงตำแหน่งเพื่อแสดงแผนที่และบันทึกพิกัดการจับปลา"
      }
    },
    android: {
      package: "com.trackingfish.app",
      versionCode: 4,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#2F5BA8"
      },
      edgeToEdgeEnabled: true,
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY_HERE"
        }
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "react-native-maps",
        {
          googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY_HERE"
        }
      ]
    ],
    updates: {
      url: "https://u.expo.dev/0e948af1-af3e-4ff3-ab61-37614abd6402"
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    extra: {
      eas: {
        projectId: "0e948af1-af3e-4ff3-ab61-37614abd6402"
      },
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID
    }
  }
};