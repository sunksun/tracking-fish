// Script to check Firestore data for specific user
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

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

async function checkUserFishingRecords(userId) {
  try {
    console.log(`\n🔍 Checking fishing records for user: ${userId}\n`);

    // Query fishing records for specific user
    const q = query(
      collection(db, 'fishingRecords'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('❌ No records found for this user');
      return;
    }

    console.log(`📊 Found ${querySnapshot.size} fishing records\n`);

    let totalFish = 0;
    let totalWeight = 0;
    let totalSpecies = 0;
    let recordCount = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      recordCount++;

      console.log(`\n📝 Record ${recordCount} (ID: ${doc.id})`);
      console.log(`   Date: ${data.date}`);
      console.log(`   Location: ${data.waterSource || 'N/A'}`);
      console.log(`   No Fishing: ${data.noFishing || false}`);

      if (data.fishList && Array.isArray(data.fishList)) {
        const speciesCount = data.fishList.length;
        totalSpecies += speciesCount;

        console.log(`   🐟 Fish species: ${speciesCount}`);

        data.fishList.forEach((fish, index) => {
          const count = parseInt(fish.count) || 0;
          const weight = parseFloat(fish.weight) || 0;

          totalFish += count;
          totalWeight += weight;

          console.log(`      ${index + 1}. ${fish.name}: ${count} ตัว, ${weight} กก.`);
        });
      } else {
        console.log(`   🐟 No fish list`);
      }

      console.log(`   Total Weight: ${data.totalWeight || 0} กก.`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY STATISTICS');
    console.log('='.repeat(50));
    console.log(`Total Records: ${recordCount} วัน`);
    console.log(`Total Species: ${totalSpecies} ชนิด`);
    console.log(`Total Fish Count: ${totalFish} ตัว`);
    console.log(`Total Weight: ${totalWeight.toFixed(2)} กก.`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error checking records:', error);
  }
}

// Run the check
const userId = 'lBLGqM9oaBFP2QP72HMB';
checkUserFishingRecords(userId)
  .then(() => {
    console.log('✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
