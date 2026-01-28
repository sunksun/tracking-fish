// Script to verify fish images in Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
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

async function verifyFishImages() {
  try {
    console.log('\n🔍 กำลังตรวจสอบข้อมูลรูปภาพใน Firestore...\n');

    // ดึงปลาที่มี image_url
    const querySnapshot = await getDocs(collection(db, 'fish_species'));

    let withImage = [];
    let withoutImage = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.image_url) {
        withImage.push({
          id: doc.id,
          name: data.thai_name || data.local_name || 'ไม่มีชื่อ',
          image_url: data.image_url
        });
      } else {
        withoutImage++;
      }
    });

    console.log('📊 สรุป:');
    console.log(`   ✅ มีรูปภาพ: ${withImage.length} ชนิด`);
    console.log(`   ❌ ไม่มีรูปภาพ: ${withoutImage} ชนิด`);
    console.log(`   📈 รวมทั้งหมด: ${querySnapshot.size} ชนิด\n`);

    if (withImage.length > 0) {
      console.log('📋 รายการปลาที่มีรูปภาพ:\n');
      withImage.forEach((fish, index) => {
        console.log(`${index + 1}. ${fish.name}`);
        console.log(`   ID: ${fish.id}`);
        console.log(`   URL: ${fish.image_url.substring(0, 100)}...`);
        console.log('');
      });

      // ทดสอบ URL
      console.log('🧪 ทดสอบ URL รูปภาพ (เปิดใน browser เพื่อดู):');
      withImage.forEach((fish, index) => {
        console.log(`${index + 1}. ${fish.name}: ${fish.image_url}`);
      });
    }

    console.log('\n✅ ตรวจสอบเสร็จสิ้น\n');

  } catch (error) {
    console.error('\n❌ เกิดข้อผิดพลาด:', error.message);
  }

  process.exit(0);
}

verifyFishImages();
