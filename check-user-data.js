// Script to check user data in Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqDCZidQSSGzhZu0hS1bZtxD4pJLYvIgY",
  authDomain: "tracking-fish-app.firebaseapp.com",
  projectId: "tracking-fish-app",
  storageBucket: "tracking-fish-app.firebasestorage.app",
  messagingSenderId: "587580376587",
  appId: "1:587580376587:web:a35c9caf6acab6a110290e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAllUsers() {
  try {
    console.log('\n🔍 Checking all users in Firestore...\n');

    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));

    console.log(`📊 Found ${usersSnapshot.size} users\n`);

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      console.log(`👤 User ID: ${doc.id}`);
      console.log(`   Name: ${userData.name}`);
      console.log(`   Phone: ${userData.phone}`);
      console.log(`   Village: ${userData.village || 'N/A'}`);

      // Count fishing records for this user
      const recordsQuery = query(
        collection(db, 'fishingRecords'),
        where('userId', '==', doc.id)
      );
      const recordsSnapshot = await getDocs(recordsQuery);
      console.log(`   Fishing Records: ${recordsSnapshot.size}\n`);
    }

    // Check for specific user "ทองดี นามเหล่า"
    console.log('\n🔎 Searching for "ทองดี นามเหล่า"...\n');

    const thongdeeQuery = query(
      collection(db, 'users'),
      where('name', '==', 'ทองดี นามเหล่า')
    );
    const thongdeeSnapshot = await getDocs(thongdeeQuery);

    if (!thongdeeSnapshot.empty) {
      const thongdeeDoc = thongdeeSnapshot.docs[0];
      const thongdeeData = thongdeeDoc.data();

      console.log(`✅ Found user "ทองดี นามเหล่า"`);
      console.log(`   User ID: ${thongdeeDoc.id}`);
      console.log(`   Phone: ${thongdeeData.phone}`);

      // Check fishing records
      const thongdeeRecordsQuery = query(
        collection(db, 'fishingRecords'),
        where('userId', '==', thongdeeDoc.id)
      );
      const thongdeeRecordsSnapshot = await getDocs(thongdeeRecordsQuery);
      console.log(`   Fishing Records: ${thongdeeRecordsSnapshot.size}`);

      if (thongdeeRecordsSnapshot.size === 0) {
        console.log(`   ✅ Correct: No fishing records (should show "-" in app)`);
      } else {
        console.log(`   ⚠️ Warning: Has ${thongdeeRecordsSnapshot.size} records but shouldn't`);
      }
    } else {
      console.log(`❌ User "ทองดี นามเหล่า" not found in Firestore`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAllUsers()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
