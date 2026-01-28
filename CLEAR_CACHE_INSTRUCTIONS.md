# วิธีล้าง Cache เพื่อดูรูปภาพปลาใหม่

## ปัญหา
แอปยังไม่แสดงรูปภาพปลาที่อัพเดทใหม่ เพราะข้อมูลถูกเก็บไว้ใน **AsyncStorage cache** (cache อายุ 7 วัน)

## ✅ วิธีแก้ไข

### วิธีที่ 1: ใช้ปุ่มรีเฟรชในแอป (แนะนำ)

1. **เปิดแอปบนมือถือ**
2. **ไปที่หน้า "เลือกชนิดปลา"**
3. **กดปุ่ม "รีเฟรช"** ที่ด้านขวาบนของหน้า
4. **รอสักครู่** แอปจะโหลดข้อมูลใหม่จาก Firebase
5. **ค้นหาปลา** เช่น "บึกลูกผสม", "กุ้งจ่ม", "ตะเพียนปากหนวด"
6. **ดูรูปภาพ** จะเห็นรูปภาพแสดงแทนไอคอนปลา

---

### วิธีที่ 2: ล้าง Cache ด้วย React Native Debugger (สำหรับ Development)

**บน iOS Simulator:**
```bash
# ใน Terminal
xcrun simctl get_app_container booted [APP_BUNDLE_ID] data
# แล้วลบโฟลเดอร์ cache
```

**บน Android Emulator:**
```bash
# ใน Terminal
adb shell
run-as [APP_PACKAGE_NAME]
cd files
rm -rf RCTAsyncLocalStorage_V1
```

---

### วิธีที่ 3: ถอนการติดตั้งแอปและติดตั้งใหม่

**iOS:**
1. ลบแอปออกจาก Simulator/Device
2. รันใหม่: `npm run ios`

**Android:**
1. ลบแอปออกจาก Emulator/Device
2. รันใหม่: `npm run android`

---

### วิธีที่ 4: เพิ่มโค้ดล้าง Cache (Development Only)

เพิ่มปุ่มลับในหน้า Home:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// ใน HomeScreen.js
const clearAllCache = async () => {
  await AsyncStorage.removeItem('fish_species_cache');
  await AsyncStorage.removeItem('fish_species_cache_time');
  await AsyncStorage.removeItem('fisher_list_cache');
  await AsyncStorage.removeItem('fisher_list_cache_time');
  await AsyncStorage.removeItem('fishing_spots_cache');
  await AsyncStorage.removeItem('fishing_spots_cache_time');
  Alert.alert('สำเร็จ', 'ล้าง cache ทั้งหมดแล้ว');
};
```

---

## 🔍 ตรวจสอบว่ารูปภาพโหลดแล้ว

เปิด React Native Debugger และดู Console:

```
✅ Loaded fish species from Firebase: 312
📋 รายการปลาที่มีรูป:
  - บึกลูกผสม: https://firebasestorage.googleapis.com/...
  - กุ้งจ่ม: https://firebasestorage.googleapis.com/...
  - ตะเพียนปากหนวด: https://firebasestorage.googleapis.com/...
```

---

## 📱 ทดสอบ URL รูปภาพ

คัดลอก URL นี้ไปเปิดใน Browser เพื่อดูว่ารูปภาพโหลดได้:

1. บึกลูกผสม:
https://firebasestorage.googleapis.com/v0/b/tracking-fish-app.firebasestorage.app/o/fish_species%2F(pangasianodon_hypophthalmus_x_p._gigas)%2F1769602397769_0.jpg?alt=media&token=f7eb5b19-99e2-41a9-9bfa-fbb67e5cfd87

2. กุ้งจ่ม:
https://firebasestorage.googleapis.com/v0/b/tracking-fish-app.firebasestorage.app/o/fish_species%2FNCXspsaeoqiFlwSSjo60%2F1769586493968_0.jpg?alt=media&token=bb890c93-20f8-43a7-bd2f-5491366a3147

3. ตะเพียนปากหนวด:
https://firebasestorage.googleapis.com/v0/b/tracking-fish-app.firebasestorage.app/o/fish_species%2Fhypsibarbus_vernayi_(norman%2C_1925)%2F1769602543940_0.jpg?alt=media&token=125a6b20-8c75-42a2-a25a-2db554c47dc5

---

## ❓ ถ้ายังไม่แสดงรูป

1. **ตรวจสอบ Console:** ดูว่ามี error อะไร
2. **ตรวจสอบ Network:** ดูว่าแอปเรียก Firebase API หรือไม่
3. **ลองบน Device จริง:** อาจเป็นปัญหาของ Simulator/Emulator
4. **ตรวจสอบ Storage Rules:** ดูว่า Firebase Storage rules อนุญาตให้อ่านได้

---

## 💡 Tips

- Cache อายุ **7 วัน** จะหมดอายุเอง
- ใช้ปุ่ม **"รีเฟรช"** เมื่อต้องการดูข้อมูลล่าสุด
- Development: สามารถลดเวลา cache ใน code ได้
