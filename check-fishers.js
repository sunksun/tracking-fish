// Script to check fishers in Firebase
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

async function checkFishers() {
  try {
    console.log('\n🔍 กำลังตรวจสอบชาวประมงใน Firebase...\n');

    // Check all users
    const allUsersSnapshot = await getDocs(collection(db, 'users'));
    console.log('📊 จำนวนผู้ใช้ทั้งหมด:', allUsersSnapshot.size);

    // Check users with role = fisher
    const q = query(collection(db, 'users'), where('role', '==', 'fisher'));
    const fishersSnapshot = await getDocs(q);
    console.log('👤 จำนวนชาวประมงทั้งหมด (role = fisher):', fishersSnapshot.size);

    // Check active fishers
    const activeQ = query(
      collection(db, 'users'),
      where('role', '==', 'fisher'),
      where('isActive', '==', true)
    );
    const activeFishersSnapshot = await getDocs(activeQ);
    console.log('✅ จำนวนชาวประมงที่ active:', activeFishersSnapshot.size);

    console.log('\n📋 รายการชาวประมงทั้งหมด (role = fisher):\n');

    let index = 1;
    fishersSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`${index}. ${data.name || 'ไม่มีชื่อ'}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   เบอร์: ${data.phone || 'ไม่มี'}`);
      console.log(`   หมู่บ้าน: ${data.village || 'ไม่มี'}`);
      console.log(`   สถานะ: ${data.isActive ? '✅ Active' : '❌ Inactive'}`);
      if (data.fisherProfile?.nickname) {
        console.log(`   ชื่อเล่น: ${data.fisherProfile.nickname}`);
      }
      console.log('');
      index++;
    });

    console.log('✅ ตรวจสอบเสร็จสิ้น\n');

    // Summary
    console.log('📊 สรุป:');
    console.log(`   - ชาวประมงทั้งหมด: ${fishersSnapshot.size} คน`);
    console.log(`   - ชาวประมง Active: ${activeFishersSnapshot.size} คน`);
    console.log(`   - ชาวประมง Inactive: ${fishersSnapshot.size - activeFishersSnapshot.size} คน\n`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }

  process.exit(0);
}

checkFishers();
