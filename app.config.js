import 'dotenv/config';

export default {
  expo: {
    name: "tracking-fish",
    slug: "tracking-fish",
    version: "1.0.8",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#2F5BA8"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.trackingfish.app",
      buildNumber: "8",
      config: {
        usesNonExemptEncryption: false
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "แอปต้องการเข้าถึงตำแหน่งเพื่อแสดงแผนที่และบันทึกพิกัดการจับปลา เพื่อใช้ในการวิจัยและอนุรักษ์ทรัพยากรประมงแม่น้ำโขง",
        NSCameraUsageDescription: "แอปต้องการเข้าถึงกล้องเพื่อถ่ายรูปปลาที่จับได้ รูปภาพจะถูกบันทึกพร้อมกับข้อมูลการจับปลา เช่น ชนิดปลา น้ำหนัก และความยาว เพื่อใช้ในการบันทึกและวิเคราะห์ข้อมูลทางวิทยาศาสตร์",
        NSPhotoLibraryUsageDescription: "แอปต้องการเข้าถึงคลังรูปภาพเพื่อให้คุณสามารถเลือกรูปปลาที่จับได้จากคลังรูปภาพของคุณ รูปภาพจะถูกแนบกับบันทึกการจับปลาเพื่อการอ้างอิงและวิเคราะห์ข้อมูล",
        NSPhotoLibraryAddUsageDescription: "แอปต้องการบันทึกรูปภาพปลาลงในคลังรูปภาพของคุณ เพื่อให้คุณสามารถเก็บรูปภาพไว้ใช้ภายหลังได้"
      }
    },
    android: {
      package: "com.trackingfish.app",
      versionCode: 22,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#2F5BA8"
      },
      edgeToEdgeEnabled: true,
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "READ_MEDIA_IMAGES"
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
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static"
          }
        }
      ]
    ],
    updates: {
      enabled: false
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