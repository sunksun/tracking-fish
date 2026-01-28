// Script to check fishing spots in Firebase
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

async function checkFishingSpots() {
  try {
    console.log('\n🔍 กำลังตรวจสอบจุดจับปลาใน Firebase...\n');

    const querySnapshot = await getDocs(collection(db, 'fishingSpots'));

    console.log('📊 จำนวนจุดจับปลาทั้งหมดใน Firebase:', querySnapshot.size);
    console.log('\n📋 รายการจุดจับปลา:\n');

    let index = 1;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`${index}. ${data.spotName || 'ไม่มีชื่อ'}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   พิกัด: ${data.latitude}, ${data.longitude}`);
      if (data.description) {
        console.log(`   คำอธิบาย: ${data.description}`);
      }
      console.log('');
      index++;
    });

    console.log('✅ ตรวจสอบเสร็จสิ้น\n');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }

  process.exit(0);
}

checkFishingSpots();
