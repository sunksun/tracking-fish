// Script to check fish species structure in Firebase
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
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

async function checkFishSpecies() {
  try {
    console.log('\n🔍 กำลังตรวจสอบชนิดปลาใน Firebase...\n');

    const querySnapshot = await getDocs(collection(db, 'fish_species'));

    console.log('📊 จำนวนชนิดปลาทั้งหมด:', querySnapshot.size);
    console.log('\n📋 ตัวอย่างข้อมูล 5 รายการแรก:\n');

    let index = 1;
    querySnapshot.forEach((doc) => {
      if (index <= 5) {
        const data = doc.data();
        console.log(`${index}. ${data.thai_name || data.local_name || 'ไม่มีชื่อ'}`);
        console.log(`   ID: ${doc.id}`);
        console.log('   ข้อมูลที่มี:');
        console.log(`   - thai_name: ${data.thai_name || 'ไม่มี'}`);
        console.log(`   - local_name: ${data.local_name || 'ไม่มี'}`);
        console.log(`   - scientific_name: ${data.scientific_name || 'ไม่มี'}`);
        console.log(`   - common_name_thai: ${data.common_name_thai || 'ไม่มี'}`);
        console.log(`   - image_url: ${data.image_url || 'ไม่มี'}`);
        console.log(`   - imageUrl: ${data.imageUrl || 'ไม่มี'}`);
        console.log(`   - photo_url: ${data.photo_url || 'ไม่มี'}`);
        console.log(`   - All fields:`, Object.keys(data).join(', '));
        console.log('');
      }
      index++;
    });

    // Check how many have images
    let hasImageUrl = 0;
    let hasImageUrlField = 0;
    let hasPhotoUrl = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.image_url) hasImageUrl++;
      if (data.imageUrl) hasImageUrlField++;
      if (data.photo_url) hasPhotoUrl++;
    });

    console.log('📊 สรุปข้อมูลรูปภาพ:');
    console.log(`   - มี image_url: ${hasImageUrl} รายการ`);
    console.log(`   - มี imageUrl: ${hasImageUrlField} รายการ`);
    console.log(`   - มี photo_url: ${hasPhotoUrl} รายการ`);
    console.log(`   - ไม่มีรูปภาพเลย: ${querySnapshot.size - Math.max(hasImageUrl, hasImageUrlField, hasPhotoUrl)} รายการ\n`);

    console.log('✅ ตรวจสอบเสร็จสิ้น\n');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }

  process.exit(0);
}

checkFishSpecies();
