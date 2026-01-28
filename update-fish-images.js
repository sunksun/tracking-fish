// Script to update fish species with image URLs from Firebase Storage
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');
const { getStorage, ref, listAll, getDownloadURL } = require('firebase/storage');
require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

async function updateFishImages() {
  try {
    console.log('\n🔍 กำลังโหลดรูปภาพจาก Firebase Storage...\n');

    // 1. ดึงรายการโฟลเดอร์ย่อยจาก fish_species/
    const fishImagesRef = ref(storage, 'fish_species');
    const result = await listAll(fishImagesRef);

    console.log(`📁 พบโฟลเดอร์: ${result.prefixes.length} โฟลเดอร์\n`);

    if (result.prefixes.length === 0 && result.items.length === 0) {
      console.log('⚠️  ไม่พบรูปภาพในโฟลเดอร์ fish_species/');
      console.log('\n📝 กรุณาตรวจสอบว่าอัพโหลดรูปภาพไว้ที่โฟลเดอร์ fish_species/ แล้ว\n');
      return;
    }

    // 2. สร้าง map ของ document ID -> URL
    console.log('🔄 กำลังโหลด URL รูปภาพจากแต่ละโฟลเดอร์...\n');
    const imageMap = {};
    let totalImages = 0;

    // ตรวจสอบรูปใน root ของ fish_species/ ก่อน
    for (const item of result.items) {
      try {
        const url = await getDownloadURL(item);
        const filename = item.name
          .replace(/\.[^/.]+$/, '')
          .toLowerCase()
          .trim();

        imageMap[filename] = url;
        console.log(`  ✅ ${item.name} -> ${filename}`);
        totalImages++;
      } catch (error) {
        console.log(`  ❌ ไม่สามารถโหลด URL: ${item.name}`);
      }
    }

    // ตรวจสอบรูปในแต่ละโฟลเดอร์ย่อย
    for (const folderRef of result.prefixes) {
      const folderId = folderRef.name.toLowerCase().trim();
      const folderList = await listAll(folderRef);

      if (folderList.items.length > 0) {
        // ใช้รูปแรกในโฟลเดอร์
        const firstImage = folderList.items[0];
        try {
          const url = await getDownloadURL(firstImage);
          imageMap[folderId] = url;
          console.log(`  ✅ ${folderRef.name}/${firstImage.name} -> ${folderId}`);
          totalImages++;
        } catch (error) {
          console.log(`  ❌ ไม่สามารถโหลด URL: ${folderRef.name}/${firstImage.name}`);
        }
      }
    }

    console.log(`\n✅ โหลด URL รูปภาพเสร็จแล้ว: ${totalImages} รูป\n`);

    // 3. ดึงข้อมูลปลาทั้งหมดจาก Firestore
    console.log('📚 กำลังโหลดข้อมูลปลาจาก Firestore...\n');
    const querySnapshot = await getDocs(collection(db, 'fish_species'));
    console.log(`📊 ปลาทั้งหมด: ${querySnapshot.size} ชนิด\n`);

    // 4. อัพเดทข้อมูล
    console.log('🔄 กำลังอัพเดท image_url...\n');
    let updated = 0;
    let skipped = 0;
    const matchLog = [];

    for (const fishDoc of querySnapshot.docs) {
      const data = fishDoc.data();
      const docId = fishDoc.id.toLowerCase().trim();

      let imageUrl = null;
      let matchMethod = '';

      // วิธีที่ 1: ตรงกับ document ID
      if (imageMap[docId]) {
        imageUrl = imageMap[docId];
        matchMethod = 'document ID';
      }
      // วิธีที่ 2: ตรงกับ scientific_name
      else if (data.scientific_name) {
        const scientificName = data.scientific_name
          .toLowerCase()
          .replace(/[()]/g, '')
          .replace(/\s+/g, '_')
          .replace(/\./g, '')
          .trim();

        if (imageMap[scientificName]) {
          imageUrl = imageMap[scientificName];
          matchMethod = 'scientific_name';
        }
      }
      // วิธีที่ 3: ตรงกับ thai_name
      else if (data.thai_name) {
        const thaiName = data.thai_name.toLowerCase().trim();
        if (imageMap[thaiName]) {
          imageUrl = imageMap[thaiName];
          matchMethod = 'thai_name';
        }
      }
      // วิธีที่ 4: ตรงกับ local_name
      else if (data.local_name) {
        const localName = data.local_name.toLowerCase().trim();
        if (imageMap[localName]) {
          imageUrl = imageMap[localName];
          matchMethod = 'local_name';
        }
      }

      if (imageUrl) {
        await updateDoc(doc(db, 'fish_species', fishDoc.id), {
          image_url: imageUrl,
          updatedAt: new Date()
        });

        const displayName = data.thai_name || data.local_name || data.scientific_name || docId;
        console.log(`  ✅ ${displayName} (${matchMethod})`);
        matchLog.push({ name: displayName, method: matchMethod });
        updated++;
      } else {
        skipped++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 สรุปผลการอัพเดท:');
    console.log('='.repeat(60));
    console.log(`✅ อัพเดทสำเร็จ: ${updated} ชนิด`);
    console.log(`⏭️  ข้ามไป (ไม่พบรูป): ${skipped} ชนิด`);
    console.log(`📈 เปอร์เซ็นต์ความสำเร็จ: ${((updated / querySnapshot.size) * 100).toFixed(1)}%`);
    console.log('='.repeat(60) + '\n');

    if (updated > 0) {
      console.log('✨ อัพเดทเสร็จสิ้น! รูปภาพจะแสดงในแอปทันที\n');
    }

    if (skipped > 0) {
      console.log('💡 เคล็ดลับ: ชื่อไฟล์ควรตรงกับหนึ่งในค่าต่อไปนี้:');
      console.log('   - Document ID');
      console.log('   - scientific_name (lowercase, ไม่มีวงเล็บ, ใช้ _ แทนช่องว่าง)');
      console.log('   - thai_name (lowercase)');
      console.log('   - local_name (lowercase)\n');
    }

  } catch (error) {
    console.error('\n❌ เกิดข้อผิดพลาด:', error.message);
    console.error(error);
  }

  process.exit(0);
}

// เรียกใช้งาน
console.log('\n' + '='.repeat(60));
console.log('🐟 Fish Species Image Updater');
console.log('='.repeat(60));
updateFishImages();
