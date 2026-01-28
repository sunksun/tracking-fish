// Script to list all folders and files in Firebase Storage
const { initializeApp } = require('firebase/app');
const { getStorage, ref, listAll } = require('firebase/storage');
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
const storage = getStorage(app);

async function listStorageFolders() {
  try {
    console.log('\n🔍 กำลังสำรวจ Firebase Storage...\n');
    console.log(`Storage Bucket: ${firebaseConfig.storageBucket}\n`);

    // ตรวจสอบ root
    const rootRef = ref(storage);
    const rootList = await listAll(rootRef);

    console.log('📁 โฟลเดอร์ทั้งหมด:');
    console.log('='.repeat(60));

    if (rootList.prefixes.length === 0) {
      console.log('  (ไม่มีโฟลเดอร์)\n');
    } else {
      for (const folder of rootList.prefixes) {
        const folderList = await listAll(folder);
        console.log(`\n📂 ${folder.name}/`);
        console.log(`   ไฟล์: ${folderList.items.length} ไฟล์`);

        if (folderList.items.length > 0) {
          console.log('   รายการ:');
          for (let i = 0; i < Math.min(5, folderList.items.length); i++) {
            console.log(`     - ${folderList.items[i].name}`);
          }
          if (folderList.items.length > 5) {
            console.log(`     ... และอีก ${folderList.items.length - 5} ไฟล์`);
          }
        }

        // ตรวจสอบ subfolder
        if (folderList.prefixes.length > 0) {
          console.log('   โฟลเดอร์ย่อย:');
          for (const subfolder of folderList.prefixes) {
            console.log(`     📁 ${subfolder.name}/`);
          }
        }
      }
    }

    console.log('\n' + '='.repeat(60));

    // ตรวจสอบไฟล์ใน root
    if (rootList.items.length > 0) {
      console.log(`\n📄 ไฟล์ใน root: ${rootList.items.length} ไฟล์`);
      for (const item of rootList.items) {
        console.log(`  - ${item.name}`);
      }
    }

    console.log('\n✅ สำรวจเสร็จสิ้น\n');

  } catch (error) {
    console.error('\n❌ เกิดข้อผิดพลาด:', error.message);
    console.error(error);
  }

  process.exit(0);
}

listStorageFolders();
