# นโยบายความเป็นส่วนตัว

## แอปพลิเคชันบันทึกการจับปลาแม่น้ำโขง

**วันที่มีผลบังคับใช้:** 24 ธันวาคม 2025

---

## 1. ข้อมูลที่เราเก็บรวบรวม

แอปพลิเคชันบันทึกการจับปลาแม่น้ำโขง ("แอป") เก็บรวบรวมข้อมูลดังต่อไปนี้:

### 1.1 ข้อมูลที่ผู้ใช้ให้มา

- **ข้อมูลชาวประมง:** ชื่อ-นามสกุล, หมู่บ้าน, ตำบล, อำเภอ, จังหวัด
- **ข้อมูลการทำประมง:** วันที่-เวลา, แหล่งน้ำ, สภาพอากาศ, เครื่องมือจับปลา
- **ข้อมูลปลา:** ชื่อชนิดปลา, จำนวน, น้ำหนัก, ความยาว, ราคา, การนำไปใช้ประโยชน์
- **รูปภาพ:** รูปถ่ายปลาที่จับได้ (ถ้ามี)

### 1.2 ข้อมูลตำแหน่งที่ตั้ง (Location Data)

- **พิกัด GPS:** เพื่อบันทึกตำแหน่งจุดจับปลา
- **วัตถุประสงค์:** แสดงแผนที่และบันทึกพิกัดการจับปลาสำหรับการวิจัยและวิเคราะห์ทางวิทยาศาสตร์
- **การอนุญาต:** แอปจะขอสิทธิ์เข้าถึงตำแหน่งเมื่อใช้งานเท่านั้น (When In Use)

---

## 2. วิธีการใช้ข้อมูล

เราใช้ข้อมูลที่เก็บรวบรวมเพื่อวัตถุประสงค์ดังต่อไปนี้:

- **บันทึกและจัดเก็บ** ข้อมูลการจับปลาของชาวประมง
- **วิเคราะห์และวิจัย** ข้อมูลเพื่อศึกษาระบบนิเวศแม่น้ำโขง
- **สร้างรายงาน** และสถิติการจับปลาเพื่อการอนุรักษ์และจัดการทรัพยากรประมง
- **ปรับปรุงแอปพลิเคชัน** เพื่อให้มีประสิทธิภาพมากขึ้น

---

## 3. การจัดเก็บข้อมูล

### 3.1 การจัดเก็บในเครื่อง (Local Storage)

- ข้อมูลจะถูกเก็บในอุปกรณ์ของคุณผ่านระบบ AsyncStorage
- คุณสามารถใช้งานแอปได้แม้ไม่มีอินเทอร์เน็ต

### 3.2 การจัดเก็บบนคลาวด์ (Cloud Storage)

- ข้อมูลจะถูกส่งและเก็บบน Firebase (บริการของ Google)
- ข้อมูลได้รับการเข้ารหัส (encrypted) เพื่อความปลอดภัย
- เซิร์ฟเวอร์ตั้งอยู่ในภูมิภาคเอเชียตะวันออกเฉียงใต้

---

## 4. การแบ่งปันข้อมูล

### เราไม่แบ่งปันข้อมูลส่วนบุคคลของคุณให้กับบุคคลที่สาม ยกเว้น:

- **นักวิจัย:** ข้อมูลจะถูกนำไปใช้ในการวิจัยทางวิทยาศาสตร์ โดยลบข้อมูลส่วนบุคคลระบุตัวตนออก (anonymized)
- **กฎหมาย:** เมื่อมีความจำเป็นตามกฎหมายหรือคำสั่งศาล
- **ผู้ให้บริการ:** Firebase/Google Cloud เพื่อจัดเก็บข้อมูล (ผูกพันตามข้อตกลงความเป็นส่วนตัว)

---

## 5. ความปลอดภัยของข้อมูล

เรามีมาตรการรักษาความปลอดภัยดังนี้:

- ใช้ Firebase Authentication สำหรับการยืนยันตัวตน
- ข้อมูลถูกเข้ารหัสขณะส่ง (HTTPS/TLS)
- จำกัดการเข้าถึงข้อมูลเฉพาะผู้มีสิทธิ์เท่านั้น
- สำรองข้อมูลเป็นประจำเพื่อป้องกันการสูญหาย

---

## 6. สิทธิ์ของผู้ใช้

คุณมีสิทธิ์ดังต่อไปนี้:

- **เข้าถึง:** ขอดูข้อมูลส่วนบุคคลของคุณ
- **แก้ไข:** แก้ไขข้อมูลที่ไม่ถูกต้อง
- **ลบ:** ขอลบข้อมูลของคุณออกจากระบบ
- **ถอนความยินยอม:** เลิกใช้แอปและขอลบบัญชี
- **ส่งออกข้อมูล:** ขอรับสำเนาข้อมูลของคุณ

---

## 7. การใช้งานโดยเด็ก

แอปนี้ไม่ได้ออกแบบสำหรับผู้ใช้อายุต่ำกว่า 13 ปี หากเราทราบว่ามีการเก็บข้อมูลจากเด็กโดยไม่ได้รับอนุญาต เราจะลบข้อมูลนั้นทันที

---

## 8. การเปลี่ยนแปลงนโยบาย

เราอาจปรับปรุงนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว การเปลี่ยนแปลงที่สำคัญจะแจ้งให้ผู้ใช้ทราบผ่านแอปพลิเคชัน

---

## 9. การติดต่อเรา

หากคุณมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ กรุณาติดต่อ:

- **อีเมล:** sunksun.lap@lru.ac.th
- **เบอร์โทร:** 098-103-2797
- **ที่อยู่:** มหาวิทยาลัยราชภัฏเลย

---

## 10. การยินยอม

การใช้แอปพลิเคชันนี้ถือว่าคุณได้อ่านและยอมรับนโยบายความเป็นส่วนตัวนี้

---

**ปรับปรุงล่าสุด:** 24 ธันวาคม 2025

---

## Privacy Policy (English Version)

**Effective Date:** December 24, 2025

### 1. Information We Collect

The Mekong River Fishing Tracking Application ("App") collects the following information:

**User-Provided Data:**

- Fisher information (name, village, district, province)
- Fishing session data (date, time, water source, weather, fishing gear)
- Fish data (species, quantity, weight, length, price, utilization)
- Photos of caught fish (optional)

**Location Data:**

- GPS coordinates to record fishing locations
- Purpose: Display maps and record fishing coordinates for scientific research
- Permission: Location access requested only when app is in use

### 2. How We Use Information

We use collected data to:

- Record and store fishing data
- Analyze and research Mekong River ecosystem
- Generate reports and statistics for fishery conservation
- Improve application performance

### 3. Data Storage

- **Local:** Stored on device using AsyncStorage (offline capability)
- **Cloud:** Encrypted storage on Firebase (Google Cloud, Southeast Asia region)

### 4. Data Sharing

We do not share personal data with third parties except:

- Researchers (anonymized data only)
- Legal requirements
- Service providers (Firebase/Google Cloud) under privacy agreements

### 5. Data Security

- Firebase Authentication
- HTTPS/TLS encryption
- Access control
- Regular backups

### 6. User Rights

You have the right to:

- Access your personal data
- Correct inaccurate data
- Request data deletion
- Withdraw consent
- Export your data

### 7. Children's Privacy

This app is not designed for users under 13 years old.

### 8. Contact Us

For questions about this privacy policy:

- **Email:** sunksun.lap@lru.ac.th
- **Phone:** 098-103-2797
- **Address:** Loei Rajabhat University

### 9. Consent

By using this app, you agree to this privacy policy.

---

**Last Updated:** December 24, 2025
