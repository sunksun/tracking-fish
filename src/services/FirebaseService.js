import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';

export class FirebaseService {
  // Collection names
  static COLLECTIONS = {
    FISHING_RECORDS: 'fishingRecords',
    USERS: 'users',
    FISHERS: 'fishers',  // ชาวประมง
    FISHING_SPOTS: 'fishingSpots'
  };

  // ===============================
  // User Management
  // ===============================
  
  static async createUser(userData) {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTIONS.USERS), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  }

  static async getUser(phoneNumber) {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.USERS), 
        where("phone", "==", phoneNumber)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { 
          success: true, 
          user: { id: doc.id, ...doc.data() } 
        };
      }
      
      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Error getting user:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateUser(userId, userData) {
    try {
      const userRef = doc(db, this.COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  }

  // ===============================
  // Fishing Records Management
  // ===============================
  
  static async createFishingRecord(recordData) {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTIONS.FISHING_RECORDS), {
        ...recordData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating fishing record:', error);
      return { success: false, error: error.message };
    }
  }

  static async getFishingRecords(userId = null, limit = null) {
    try {
      let q = collection(db, this.COLLECTIONS.FISHING_RECORDS);
      
      // Apply filters
      if (userId) {
        q = query(q, where("userId", "==", userId));
      }
      
      const querySnapshot = await getDocs(q);
      const records = [];
      
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by date on client side (most recent first)
      records.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      });
      
      // Apply limit after sorting
      const result = limit ? records.slice(0, limit) : records;
      
      return { success: true, records: result };
    } catch (error) {
      console.error('Error getting fishing records:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateFishingRecord(recordId, recordData) {
    try {
      const recordRef = doc(db, this.COLLECTIONS.FISHING_RECORDS, recordId);
      await updateDoc(recordRef, {
        ...recordData,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating fishing record:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteFishingRecord(recordId) {
    try {
      await deleteDoc(doc(db, this.COLLECTIONS.FISHING_RECORDS, recordId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting fishing record:', error);
      return { success: false, error: error.message };
    }
  }

  // ===============================
  // Fishing Spots Management
  // ===============================
  
  static async getFishingSpots() {
    try {
      const querySnapshot = await getDocs(collection(db, this.COLLECTIONS.FISHING_SPOTS));
      const spots = [];
      
      querySnapshot.forEach((doc) => {
        spots.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by spot name
      spots.sort((a, b) => (a.spotName || '').localeCompare(b.spotName || ''));
      
      return { success: true, spots: spots };
    } catch (error) {
      console.error('Error getting fishing spots:', error);
      return { success: false, error: error.message };
    }
  }

  static async createFishingSpot(spotData) {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTIONS.FISHING_SPOTS), {
        ...spotData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating fishing spot:', error);
      return { success: false, error: error.message };
    }
  }


  // ===============================
  // File Upload (Images)
  // ===============================
  
  static async uploadImage(imageUri, path) {
    try {
      console.log('🔄 Starting image upload:', { imageUri, path });
      
      // Convert image URI to blob
      console.log('📥 Fetching image...');
      const response = await fetch(imageUri);
      const blob = await response.blob();
      console.log('✅ Image fetched, size:', blob.size, 'bytes');
      
      // Create storage reference
      const imageRef = ref(storage, path);
      console.log('📁 Storage reference created:', path);
      
      // Upload file
      console.log('⬆️ Uploading to Firebase Storage...');
      const snapshot = await uploadBytes(imageRef, blob);
      console.log('✅ Upload successful!');
      
      // Get download URL
      console.log('🔗 Getting download URL...');
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('✅ Download URL received:', downloadURL);
      
      return { success: true, url: downloadURL };
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      console.error('❌ Error details:', error.code, error.message);
      return { success: false, error: error.message };
    }
  }

  // Test Firebase Storage connection
  static async testStorageConnection() {
    try {
      console.log('🧪 Testing Firebase Storage connection...');
      
      // Create a simple test reference
      const testRef = ref(storage, 'test/connection-test.txt');
      console.log('📁 Test reference created');
      
      // Try to create a simple text blob
      const testBlob = new Blob(['Hello Firebase Storage!'], { type: 'text/plain' });
      console.log('📝 Test blob created');
      
      // Attempt upload
      const snapshot = await uploadBytes(testRef, testBlob);
      console.log('✅ Test upload successful!');
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('✅ Test download URL:', downloadURL);
      
      return { success: true, url: downloadURL };
    } catch (error) {
      console.error('❌ Storage connection test failed:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      return { success: false, error: error.message, code: error.code };
    }
  }

  // ===============================
  // Helper Functions
  // ===============================
  
  static generateImagePath(userId, recordId, fishIndex) {
    const timestamp = Date.now();
    return `fishing-records/${userId}/${recordId}/fish_${fishIndex}_${timestamp}.jpg`;
  }

  // Convert local storage format to Firebase format
  static formatRecordForFirebase(localRecord, userId) {
    const record = {
      ...localRecord,
      userId: userId,
      // Convert date string to proper format
      date: localRecord.date,
      // Ensure arrays are properly formatted
      fishList: localRecord.fishList || [],
      gearUsed: localRecord.gearUsed || [],
      // Add metadata
      source: 'mobile_app',
      version: '1.0'
    };

    // Remove any undefined or null values
    Object.keys(record).forEach(key => {
      if (record[key] === undefined || record[key] === null) {
        delete record[key];
      }
    });

    return record;
  }

  // Convert Firebase format to local storage format
  static formatRecordFromFirebase(firebaseRecord) {
    const record = { ...firebaseRecord };

    // Convert Firestore timestamps if they exist
    if (record.createdAt && record.createdAt.toDate) {
      record.createdAt = record.createdAt.toDate().toISOString();
    }
    if (record.updatedAt && record.updatedAt.toDate) {
      record.updatedAt = record.updatedAt.toDate().toISOString();
    }

    return record;
  }

  // ===============================
  // Fisher Management (ชาวประมง)
  // ดึงข้อมูลจาก collection 'users' ที่มี role = 'fisher'
  // ===============================

  // ดึงข้อมูลชาวประมงทั้งหมด (จาก users collection)
  static async getAllFishers() {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.USERS),
        where("role", "==", "fisher")
      );
      const querySnapshot = await getDocs(q);
      const fishers = [];

      querySnapshot.forEach((doc) => {
        fishers.push({ id: doc.id, ...doc.data() });
      });

      // เรียงตามชื่อ
      fishers.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'th'));

      return { success: true, fishers };
    } catch (error) {
      console.error('Error getting fishers:', error);
      return { success: false, error: error.message };
    }
  }

  // ดึงข้อมูลชาวประมงที่ active (จาก users collection)
  static async getActiveFishers() {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.USERS),
        where("role", "==", "fisher"),
        where("isActive", "==", true)
      );
      const querySnapshot = await getDocs(q);
      const fishers = [];

      querySnapshot.forEach((doc) => {
        fishers.push({ id: doc.id, ...doc.data() });
      });

      // เรียงตามชื่อ
      fishers.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'th'));

      return { success: true, fishers };
    } catch (error) {
      console.error('Error getting active fishers:', error);
      return { success: false, error: error.message };
    }
  }

  // ค้นหาชาวประมงจากเบอร์โทร (จาก users collection)
  static async getFisherByPhone(phoneNumber) {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.USERS),
        where("role", "==", "fisher"),
        where("phone", "==", phoneNumber)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          success: true,
          fisher: { id: doc.id, ...doc.data() }
        };
      }

      return { success: false, error: 'Fisher not found' };
    } catch (error) {
      console.error('Error getting fisher by phone:', error);
      return { success: false, error: error.message };
    }
  }

  // ดึงข้อมูลชาวประมงตาม ID (จาก users collection)
  static async getFisherById(fisherId) {
    try {
      const fisherRef = doc(db, this.COLLECTIONS.USERS, fisherId);
      const fisherDoc = await getDoc(fisherRef);

      if (fisherDoc.exists() && fisherDoc.data().role === 'fisher') {
        return {
          success: true,
          fisher: { id: fisherDoc.id, ...fisherDoc.data() }
        };
      }

      return { success: false, error: 'Fisher not found' };
    } catch (error) {
      console.error('Error getting fisher by ID:', error);
      return { success: false, error: error.message };
    }
  }

  // ===============================
  // Fish Species Management
  // ดึงข้อมูลชนิดปลาจาก collection 'fish_species'
  // ===============================

  // ดึงข้อมูลชนิดปลาทั้งหมด
  static async getAllFishSpecies() {
    try {
      const querySnapshot = await getDocs(collection(db, 'fish_species'));
      const species = [];

      querySnapshot.forEach((doc) => {
        species.push({ id: doc.id, ...doc.data() });
      });

      // เรียงตามชื่อไทย
      species.sort((a, b) => (a.thaiName || '').localeCompare(b.thaiName || '', 'th'));

      return { success: true, species };
    } catch (error) {
      console.error('Error getting fish species:', error);
      return { success: false, error: error.message };
    }
  }

  // ค้นหาชนิดปลา (ค้นหาจากชื่อไทย, ชื่อท้องถิ่น, ชื่อวิทยาศาสตร์)
  static async searchFishSpecies(searchTerm) {
    try {
      const allSpecies = await this.getAllFishSpecies();

      if (!allSpecies.success) {
        return allSpecies;
      }

      const searchLower = searchTerm.toLowerCase();
      const filtered = allSpecies.species.filter((fish) => {
        return (
          fish.thaiName?.toLowerCase().includes(searchLower) ||
          fish.localName?.toLowerCase().includes(searchLower) ||
          fish.scientificName?.toLowerCase().includes(searchLower)
        );
      });

      return { success: true, species: filtered };
    } catch (error) {
      console.error('Error searching fish species:', error);
      return { success: false, error: error.message };
    }
  }
}