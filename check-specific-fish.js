// Script to check specific fish species that should have images
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');
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

async function checkSpecificFish() {
  try {
    console.log('\n🔍 กำลังตรวจสอบปลา 3 ชนิดที่อัพโหลดรูป...\n');

    // รายชื่อปลาที่ควรมีรูป
    const fishToCheck = [
      'บึกลูกผสม',
      'กุ้งจ่ม',
      'ตะเพียนปากหนวด'
    ];

    // ดึงข้อมูลทั้งหมด
    const querySnapshot = await getDocs(collection(db, 'fish_species'));

    console.log('📊 จำนวนชนิดปลาทั้งหมด:', querySnapshot.size);
    console.log('\n' + '='.repeat(80) + '\n');

    let foundCount = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const thaiName = data.thai_name || data.local_name || '';

      // ตรวจสอบว่าเป็นปลาที่เราต้องการหรือไม่
      if (fishToCheck.some(name => thaiName.includes(name) || name.includes(thaiName))) {
        foundCount++;
        console.log(`🐟 ${foundCount}. ${thaiName}`);
        console.log('   Document ID:', doc.id);
        console.log('   Scientific Name:', data.scientific_name || 'ไม่มี');
        console.log('   Local Name:', data.local_name || 'ไม่มี');
        console.log('\n   📸 รูปภาพ:');
        console.log('   - image_url:', data.image_url || '❌ ไม่มี');
        console.log('   - imageUrl:', data.imageUrl || '❌ ไม่มี');
        console.log('   - photo_url:', data.photo_url || '❌ ไม่มี');

        if (data.image_url) {
          console.log('\n   🔗 URL เต็ม:');
          console.log('   ', data.image_url);
        }

        console.log('\n   📋 ฟิลด์ทั้งหมดในเอกสาร:');
        console.log('   ', Object.keys(data).join(', '));
        console.log('\n' + '-'.repeat(80) + '\n');
      }
    });

    if (foundCount === 0) {
      console.log('⚠️  ไม่พบปลาที่ต้องการ');
      console.log('\n💡 ลองค้นหาด้วยคำที่ใกล้เคียง...\n');

      // แสดงปลาที่มีคำว่า "บึก", "กุ้ง", "ตะเพียน"
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const thaiName = (data.thai_name || data.local_name || '').toLowerCase();

        if (thaiName.includes('บึก') || thaiName.includes('กุ้ง') || thaiName.includes('ตะเพียน')) {
          console.log(`  - ${data.thai_name || data.local_name} (${doc.id})`);
          if (data.image_url) console.log(`    ✅ มีรูป`);
        }
      });
    } else {
      console.log(`✅ พบปลาที่มีรูปภาพ: ${foundCount} ชนิด\n`);
    }

    // แสดงสถิติรูปภาพ
    let totalWithImages = 0;
    querySnapshot.forEach((doc) => {
      if (doc.data().image_url || doc.data().imageUrl) {
        totalWithImages++;
      }
    });

    console.log('='.repeat(80));
    console.log('📊 สรุป:');
    console.log(`   - ปลาที่มีรูปทั้งหมด: ${totalWithImages} ชนิด`);
    console.log(`   - ปลาที่ไม่มีรูป: ${querySnapshot.size - totalWithImages} ชนิด`);
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ เกิดข้อผิดพลาด:', error.message);
    console.error(error);
  }

  process.exit(0);
}

checkSpecificFish();
