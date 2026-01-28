# สร้างบัญชีทดสอบสำหรับ Apple Review

## วิธีสร้างบัญชี Demo User ใน Firebase

### ขั้นตอนที่ 1: เข้า Firebase Console

1. ไปที่ [console.firebase.google.com](https://console.firebase.google.com)
2. เลือกโปรเจค **tracking-fish**

---

### ขั้นตอนที่ 2: เพิ่มข้อมูลใน Firestore

#### เข้า Firestore Database:
1. คลิก **Firestore Database** (เมนูด้านซ้าย)
2. คลิก collection **"users"**
3. คลิก **"Add document"**

#### เพิ่มข้อมูลผู้ใช้ทดสอบ:

**Document ID:** `demo-reviewer` (หรือใช้ Auto-ID)

**Fields:**

```
phone: "0981032797"
name: "Apple Reviewer Demo"
role: "fisher"
village: "Demo Village"
subdistrict: "Demo Subdistrict"
district: "Demo District"
province: "Demo Province"
isActive: true
status: "active"
createdAt: [ใช้ Current timestamp]
updatedAt: [ใช้ Current timestamp]
```

#### วิธีเพิ่มแต่ละ Field:

1. คลิก **"Add field"**
2. ใส่ **Field name** และ **Value** ตามตารางด้านบน
3. เลือก **Type** ที่ถูกต้อง:
   - `phone`, `name`, `role`, `village`, etc. → **string**
   - `isActive` → **boolean** (เลือก **true**)
   - `status` → **string** ("active")
   - `createdAt`, `updatedAt` → **timestamp** (คลิก "SET TO CURRENT TIMESTAMP")

4. คลิก **"Save"**

---

### ขั้นตอนที่ 3: ตรวจสอบข้อมูล

1. ตรวจสอบว่า document ถูกสร้างแล้ว
2. ตรวจสอบว่า field `phone` มีค่า `"0981032797"`
3. ตรวจสอบว่า field `isActive` เป็น `true`

---

### ขั้นตอนที่ 4: ทดสอบ Login

1. เปิดแอปบนโทรศัพท์หรือ Simulator
2. กรอกเบอร์: `0981032797`
3. ควรจะ login สำเร็จ

---

## ข้อมูลสำหรับ Apple Review

หลังจากสร้างบัญชีแล้ว ให้ตอบกลับ Apple ว่า:

```
Demo Account Credentials:

Phone Number: 0981032797
Note: This app uses phone number authentication without SMS verification in demo mode.
Simply enter the phone number above and it will log you in directly.

How to test:
1. Open the app
2. Enter phone number: 0981032797
3. The app will log you in automatically (no OTP required for this demo account)
4. You can now access all features:
   - Record fishing data
   - Add fish species
   - View history
   - Search and filter records
```

---

## ⚠️ สำคัญ:

### ถ้าแอปต้องการ OTP จริงๆ:

แอปของคุณอาจต้องมีโหมดพิเศษสำหรับ demo account:

1. **ตัวเลือกที่ 1:** ปิด OTP สำหรับเบอร์ demo
2. **ตัวเลือกที่ 2:** ใช้ OTP คงที่ เช่น `123456`
3. **ตัวเลือกที่ 3:** เพิ่ม bypass code สำหรับ reviewer

### แก้ไขโค้ด (ตัวอย่าง):

ใน `AuthContext.js`:

```javascript
const loginWithPhoneNumber = async (phoneNumber) => {
  // ... existing code ...

  // Demo account bypass for Apple Review
  if (phoneNumber === '0981032797') {
    // Skip OTP for demo account
    const demoUser = {
      id: 'demo-reviewer',
      phone: '0981032797',
      name: 'Apple Reviewer Demo',
      role: 'fisher',
      village: 'Demo Village',
      // ... other fields
    };

    setUser(demoUser);
    await AsyncStorage.setItem('currentUser', JSON.stringify(demoUser));
    return { success: true, user: demoUser };
  }

  // ... rest of the code ...
};
```

---

## JSON Format สำหรับ Import (ถ้าต้องการ):

```json
{
  "phone": "0981032797",
  "name": "Apple Reviewer Demo",
  "role": "fisher",
  "village": "Demo Village",
  "subdistrict": "Demo Subdistrict",
  "district": "Demo District",
  "province": "Demo Province",
  "isActive": true,
  "status": "active"
}
```

---

**หมายเหตุ:** อย่าลืมลบหรือปิดการใช้งานบัญชี demo หลังจากผ่าน review แล้ว เพื่อความปลอดภัย
