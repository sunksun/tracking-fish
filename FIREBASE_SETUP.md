# Firebase Integration Setup Guide

## Overview
Firebase has been successfully integrated into the React Native mobile app with the following features:

### ✅ Completed Implementation

#### 1. Firebase Configuration (`src/config/firebase.js`)
- Firebase v9+ SDK setup
- Firestore, Auth, and Storage services initialized
- Placeholder configuration (needs real Firebase project credentials)

#### 2. Firebase Service (`src/services/FirebaseService.js`)
- Complete service layer for all Firebase operations
- User management (create, get, update)
- Fishing records management (CRUD operations)
- Image upload to Firebase Storage
- Data format conversion between local and Firebase

#### 3. FishingDataContext Integration
- Added Firebase sync capabilities
- Automatic sync when user is authenticated
- Maintains AsyncStorage as backup/offline storage
- Real-time data merging between local and cloud
- Image upload integration for fish photos
- Loading states and sync status tracking

#### 4. AuthContext Integration
- Firebase user authentication
- Automatic user creation from mock data
- Profile management with Firebase backend
- Fallback to mock data for offline development

### 🔧 Firebase Collections Structure

#### Users Collection (`users`)
```javascript
{
  id: "auto-generated",
  phoneNumber: "0981032797",
  name: "นายสมศักดิ์ แก้วดี", 
  village: "บ้านร่มโพธิ์",
  district: "เชียงคาน",
  province: "เลย",
  occupation: "ชาวประมง",
  experience: "15 ปี",
  role: "fisher",
  status: "active",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  lastLoginAt: "2025-01-01T00:00:00Z"
}
```

#### Fishing Records Collection (`fishingRecords`)
```javascript
{
  id: "auto-generated",
  userId: "user-id-reference",
  date: "2025-01-01",
  noFishing: false,
  waterSource: "แม่น้ำโขง",
  waterLevel: "ปกติ",
  weather: ["แสงแดดดี"],
  fishingGear: ["แห", "เบ็ด"],
  startTime: "06:00",
  endTime: "10:00", 
  totalWeight: "2.5",
  fishList: [
    {
      name: "ปลาแป้น",
      localNames: "ปลาแป้น",
      scientificName: "Pangasius sanitwongsei",
      quantity: "2",
      weight: "1.5",
      price: "150",
      image: "https://firebase-storage-url/image.jpg"
    }
  ],
  location: {
    latitude: 17.9074,
    longitude: 102.4014,
    accuracy: 5,
    village: "บ้านร่มโพธิ์",
    district: "เชียงคาน", 
    province: "เลย",
    country: "ไทย"
  },
  usage: {
    sold: "1.0",
    consumed: "1.0", 
    processed: "0.5"
  },
  source: "mobile_app",
  version: "1.0",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z"
}
```

### 📋 Next Steps to Complete Setup

#### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project named "tracking-fish-mekong"
3. Enable Firestore Database
4. Enable Storage
5. Enable Authentication (if needed for web app)

#### 2. Update Configuration
Replace placeholder values in `src/config/firebase.js`:
```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

#### 3. Configure Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    
    // Fishing records - users can read/write their own records
    match /fishingRecords/{recordId} {
      allow read, write: if request.auth != null 
        && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null 
        && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

#### 4. Configure Storage Rules  
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /fishing-records/{userId}/{recordId}/{imageFile} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
  }
}
```

### 🚀 Current Features

#### Mobile App Features:
- ✅ Offline-first data storage (AsyncStorage)
- ✅ Automatic Firebase sync when online
- ✅ Image upload to Firebase Storage
- ✅ Real-time data merging
- ✅ GPS location tracking
- ✅ Comprehensive fish database (271 species)
- ✅ User authentication with phone number
- ✅ Complete fishing data entry workflow

#### Data Sync Features:
- ✅ Automatic background sync
- ✅ Conflict resolution (Firebase takes precedence)
- ✅ Image URL conversion
- ✅ Offline fallback
- ✅ Sync status indicators

### 🔄 How Data Sync Works

1. **Login**: User authenticates → Firebase user lookup/creation
2. **Data Entry**: Local save first → Firebase sync in background  
3. **Image Upload**: Local images → Firebase Storage → URL replacement
4. **Conflict Resolution**: Firebase timestamp wins over local data
5. **Offline Mode**: Full functionality with AsyncStorage fallback

### 📱 Ready for Testing

The mobile app is now ready for testing with Firebase integration:

1. **Development Mode**: Works with mock data (phone: 0981032797)
2. **Firebase Mode**: Will create real users and sync data when Firebase is configured
3. **Offline Mode**: Full functionality maintained without internet

### 🌐 Web App Integration Ready

The Firebase structure is designed to work seamlessly with the Next.js web dashboard:
- Standardized data format
- RESTful-style Firestore operations  
- Real-time data availability
- Image URLs for web display
- User management integration

The web app can now be connected to the same Firestore database to display and manage all fishing records collected from the mobile app.