# Firestore Database Setup Guide

## โครงสร้างฐานข้อมูล

### 1. Collection: `users`
เก็บข้อมูลผู้ใช้งานที่ลงทะเบียนในระบบ

```javascript
// Document structure
{
  id: "auto-generated-id",
  phoneNumber: "0812345678",      // เบอร์โทรศัพท์ (unique)
  name: "สมชาย ใจดี",             // ชื่อ-นามสกุล
  village: "บ้านเชียงคาน",        // หมู่บ้าน
  district: "เชียงคาน",           // อำเภอ
  province: "เลย",                // จังหวัด
  role: "fisher",                 // บทบาท: fisher, admin, researcher
  status: "active",               // สถานะ: active, inactive
  createdAt: Timestamp,           // วันที่สร้าง
  updatedAt: Timestamp,           // วันที่อัพเดตล่าสุด
  lastLoginAt: Timestamp          // เข้าสู่ระบบครั้งล่าสุด
}
```

### 2. Collection: `fishing_records`
เก็บข้อมูลการจับปลาที่บันทึกจากแอป

```javascript
// Document structure
{
  id: "auto-generated-id",
  userId: "user-document-id",     // อ้างอิงถึง users collection
  userPhone: "0812345678",        // เบอร์โทรผู้บันทึก (สำหรับ query)
  date: Timestamp,                // วันที่จับปลา
  noFishing: false,               // ไม่ได้จับปลา
  
  // ข้อมูลการจับปลา (ถ้า noFishing = false)
  waterSource: "mekong",          // แหล่งน้ำ
  waterLevel: "rising",           // ระดับน้ำ
  weather: ["แดดร้อน", "มีเมฆ"],  // สภาพอากาศ
  startTime: Timestamp,           // เวลาลงเครื่องมือ
  endTime: Timestamp,             // เวลากู้เครื่องมือ
  totalWeight: 5.5,               // น้ำหนักรวม (กก.)
  
  // เครื่องมือที่ใช้
  fishingGear: [
    {
      name: "มอง 4 ซม.",
      quantity: 2,
      unit: "ผืน"
    }
  ],
  
  // รายการปลา
  fishList: [
    {
      id: "fish-1",
      name: "ปลาโคก",
      count: 10,
      weight: 2.5,
      minLength: 15,
      maxLength: 25,
      price: 100
    }
  ],
  
  // การใช้ประโยชน์
  usage: {
    sold: 2.0,                    // ขาย (กก.)
    consumed: 2.5,                // บริโภค (กก.)
    processed: 1.0                // แปรรูป (กก.)
  },
  
  createdAt: Timestamp,           // วันที่บันทึก
  updatedAt: Timestamp            // วันที่แก้ไขล่าสุด
}
```

## การตั้งค่า Firebase Project

### 1. สร้าง Firestore Database
1. ไปที่ Firebase Console
2. เลือก "Firestore Database"
3. คลิก "Create database"
4. เลือก "Start in test mode" (สำหรับ development)
5. เลือก location ที่ใกล้ที่สุด (asia-southeast1)

### 2. Security Rules (สำหรับ Development)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // อนุญาตให้อ่าน-เขียนได้ทั้งหมดสำหรับ development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 3. Security Rules (สำหรับ Production)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if false; // Only admin can create/update users
    }
    
    // Fishing records collection
    match /fishing_records/{recordId} {
      allow read: if true;
      allow create: if true;
      allow update: if resource.data.userId == request.auth.uid;
      allow delete: if false; // No deletion allowed
    }
  }
}
```

## การเพิ่มข้อมูลผู้ใช้ (จาก Web App)

### 1. ใช้ Firebase Console
1. ไปที่ Firestore Database
2. คลิก "Start collection"
3. Collection ID: `users`
4. Add document with data:

```json
{
  "phoneNumber": "0812345678",
  "name": "สมชาย ใจดี",
  "village": "บ้านเชียงคาน",
  "district": "เชียงคาน", 
  "province": "เลย",
  "role": "fisher",
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 2. ใช้ Admin Web App (แนะนำ)

สร้าง Web App สำหรับ Admin ในการจัดการผู้ใช้:

```javascript
// Admin Web App - Add User Function
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase-config';

const addUser = async (userData) => {
  try {
    const docRef = await addDoc(collection(db, 'users'), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active',
      role: 'fisher'
    });
    
    console.log('User added with ID: ', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding user: ', error);
    return { success: false, error: error.message };
  }
};

// การใช้งาน
addUser({
  phoneNumber: '0812345678',
  name: 'สมชาย ใจดี',
  village: 'บ้านเชียงคาน',
  district: 'เชียงคาน',
  province: 'เลย'
});
```

### 3. Bulk Import จาก CSV

```javascript
// Import users from CSV file
import { collection, writeBatch, doc } from 'firebase/firestore';

const importUsersFromCSV = async (csvData) => {
  const batch = writeBatch(db);
  const usersRef = collection(db, 'users');
  
  csvData.forEach((user) => {
    const userDoc = doc(usersRef);
    batch.set(userDoc, {
      ...user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active',
      role: 'fisher'
    });
  });
  
  await batch.commit();
  console.log('Bulk import completed');
};
```

## การทดสอบระบบ

### 1. Test Users
เพิ่มผู้ใช้ทดสอบ:

```json
[
  {
    "phoneNumber": "0812345678",
    "name": "สมชาย ทดสอบ",
    "village": "บ้านทดสอบ",
    "district": "เชียงคาน",
    "province": "เลย"
  },
  {
    "phoneNumber": "0887654321", 
    "name": "สมหญิง ทดสอบ",
    "village": "บ้านปากชม",
    "district": "ปากชม",
    "province": "เลย"
  }
]
```

### 2. การทดสอบ Mobile App
1. ใส่เบอร์โทรศัพท์ที่มีในฐานข้อมูล
2. ตรวจสอบการเข้าสู่ระบบ
3. ทดสอบบันทึกข้อมูลการจับปลา
4. ตรวจสอบข้อมูลใน Firestore Console

## Index สำหรับ Performance

สร้าง Composite Index สำหรับ query ที่ใช้บ่อย:

```javascript
// Indexes ที่ควรสร้าง
1. Collection: fishing_records
   Fields: userId (Ascending), date (Descending)
   
2. Collection: fishing_records  
   Fields: userPhone (Ascending), date (Descending)
   
3. Collection: users
   Fields: phoneNumber (Ascending), status (Ascending)
```

## การ Backup และ Security

### 1. Export Data
```bash
# Export ข้อมูลทั้งหมด
gcloud firestore export gs://your-bucket-name/backup-folder

# Export collection specific
gcloud firestore export gs://your-bucket-name/backup-folder --collection-ids=users,fishing_records
```

### 2. Monitor Usage
- ดู usage ใน Firebase Console
- ตั้ง billing alerts
- Monitor read/write operations

### 3. Data Validation
- ใช้ Firebase Functions สำหรับ data validation
- ตั้งค่า triggers สำหรับ audit logs
- Sanitize input data