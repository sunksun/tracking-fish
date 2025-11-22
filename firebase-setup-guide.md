# Firebase Phone Authentication Setup Guide

## ขั้นตอนการตั้งค่า Firebase

### 1. สร้าง Firebase Project
1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. คลิก "Create a project" 
3. ตั้งชื่อโปรเจกต์: "tracking-fish-app"
4. เปิดใช้งาน Google Analytics (ถ้าต้องการ)

### 2. เพิ่ม iOS App
1. คลิก iOS icon ในโปรเจกต์
2. กรอก Bundle ID: `com.trackingfish.app` (หรือตามที่ตั้งใน app.json)
3. ดาวน์โหลด `GoogleService-Info.plist`
4. วางไฟล์ใน `ios/` folder

### 3. เพิ่ม Android App  
1. คลิก Android icon ในโปรเจกต์
2. กรอก Package name: `com.trackingfish.app`
3. ดาวน์โหลด `google-services.json`
4. วางไฟล์ใน `android/app/` folder

### 4. เปิดใช้งาน Phone Authentication
1. ไปที่ Authentication > Sign-in method
2. เปิดใช้งาน "Phone" provider
3. เพิ่มเบอร์โทรศัพท์ทดสอบ (ถ้าต้องการ)

### 5. อัพเดตไฟล์ Configuration

แก้ไขไฟล์ `src/config/firebase.js`:

\`\`\`javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_FROM_FIREBASE_CONSOLE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com", 
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
\`\`\`

### 6. Native Dependencies (สำหรับ Bare React Native)

ถ้าใช้ Bare React Native ต้องติดตั้ง:

\`\`\`bash
# iOS
cd ios && pod install

# Android - เพิ่มใน android/build.gradle
classpath 'com.google.gms:google-services:4.3.15'

# เพิ่มใน android/app/build.gradle
apply plugin: 'com.google.gms.google-services'
\`\`\`

### 7. Expo Configuration

ถ้าใช้ Expo Managed Workflow แก้ไข `app.json`:

\`\`\`json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app"
    ],
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
\`\`\`

## การทดสอบ

### Test Phone Numbers (สำหรับ Development)
1. ไปที่ Firebase Console > Authentication > Sign-in method
2. เลื่อนลงไปยัง "Phone numbers for testing"
3. เพิ่มเบอร์ทดสอบ เช่น:
   - Phone: +66812345678
   - Verification code: 123456

### Production Considerations
1. **Rate Limiting**: Firebase มีข้อจำกัดการส่ง SMS ต่อวัน
2. **Cost**: การส่ง SMS มีค่าใช้จ่าย
3. **Security**: ตั้งค่า reCAPTCHA สำหรับ web
4. **Analytics**: ติดตาม usage ใน Firebase Analytics

## คำสั่งสำคัญ

\`\`\`bash
# รันแอป Expo
npm start

# Build สำหรับ production
expo build:ios
expo build:android

# หรือใช้ EAS Build
eas build --platform ios
eas build --platform android
\`\`\`

## Troubleshooting

### ปัญหาที่พบบ่อย
1. **"Network Error"**: ตรวจสอบ API key และ internet connection
2. **"Invalid phone number"**: ตรวจสอบรูปแบบเบอร์โทรศัพท์ (+66...)
3. **"Too many requests"**: ใช้เบอร์ทดสอบหรือรอ cooldown period
4. **iOS build failed**: ตรวจสอบ Bundle ID และ GoogleService-Info.plist

### การ Debug
\`\`\`javascript
// เปิด debug mode
import { auth } from '@react-native-firebase/auth';

// ดู auth state
auth().onAuthStateChanged(user => {
  console.log('Auth state changed:', user);
});
\`\`\`

## Security Best Practices

1. **Never commit** Firebase config files ที่มี sensitive data
2. ใช้ **Environment Variables** สำหรับ production
3. ตั้งค่า **Firebase Security Rules** 
4. เปิดใช้งาน **App Check** สำหรับ production
5. Monitor **Authentication logs** ใน Firebase Console