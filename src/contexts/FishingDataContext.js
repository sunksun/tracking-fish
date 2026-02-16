import { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseService } from '../services/FirebaseService';
import { useAuth } from './AuthContext';

const FishingDataContext = createContext();

const initialState = {
  currentEntry: {
    date: new Date(),
    noFishing: false,
    waterSource: '',
    waterLevel: '',
    weather: '',
    fishingGear: null,
    startTime: '',
    endTime: '',
    totalWeight: '',
    fishList: [],
    location: null,
    usage: {
      sold: '',
      consumed: '',
      processed: ''
    }
  },
  fishingHistory: [],
  fisherInfo: {
    name: '',
    village: ''
  },
  syncStatus: 'idle', // 'idle', 'syncing', 'success', 'error'
  loading: false,
  lastSyncTime: null
};

const actionTypes = {
  UPDATE_CURRENT_ENTRY: 'UPDATE_CURRENT_ENTRY',
  ADD_FISH: 'ADD_FISH',
  REMOVE_FISH: 'REMOVE_FISH',
  SAVE_ENTRY: 'SAVE_ENTRY',
  LOAD_HISTORY: 'LOAD_HISTORY',
  UPDATE_FISHER_INFO: 'UPDATE_FISHER_INFO',
  RESET_CURRENT_ENTRY: 'RESET_CURRENT_ENTRY',
  SET_SYNC_STATUS: 'SET_SYNC_STATUS',
  SET_LOADING: 'SET_LOADING'
};

function fishingDataReducer(state, action) {
  switch (action.type) {
    case actionTypes.UPDATE_CURRENT_ENTRY:
      return {
        ...state,
        currentEntry: {
          ...state.currentEntry,
          ...action.payload
        }
      };

    case actionTypes.ADD_FISH:
      return {
        ...state,
        currentEntry: {
          ...state.currentEntry,
          fishList: [...state.currentEntry.fishList, action.payload]
        }
      };

    case actionTypes.REMOVE_FISH:
      return {
        ...state,
        currentEntry: {
          ...state.currentEntry,
          fishList: state.currentEntry.fishList.filter((_, index) => index !== action.payload)
        }
      };

    case actionTypes.SAVE_ENTRY:
      const newEntry = {
        ...state.currentEntry,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      return {
        ...state,
        fishingHistory: [newEntry, ...state.fishingHistory],
        currentEntry: { ...initialState.currentEntry, date: new Date() }
      };

    case actionTypes.LOAD_HISTORY:
      return {
        ...state,
        fishingHistory: action.payload
      };

    case actionTypes.UPDATE_FISHER_INFO:
      return {
        ...state,
        fisherInfo: {
          ...state.fisherInfo,
          ...action.payload
        }
      };

    case actionTypes.RESET_CURRENT_ENTRY:
      return {
        ...state,
        currentEntry: { ...initialState.currentEntry, date: new Date() }
      };

    case actionTypes.SET_SYNC_STATUS:
      return {
        ...state,
        syncStatus: action.payload.status,
        lastSyncTime: action.payload.status === 'success' ? new Date().toISOString() : state.lastSyncTime
      };

    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    default:
      return state;
  }
}

export function FishingDataProvider({ children }) {
  const [state, dispatch] = useReducer(fishingDataReducer, initialState);
  const { user, isAuthenticated, selectedFisher, isResearcher } = useAuth();

  // Load data from AsyncStorage on app start
  useEffect(() => {
    loadStoredData();
  }, []);

  // Save data to AsyncStorage whenever state changes
  useEffect(() => {
    saveDataToStorage();
  }, [state.fishingHistory, state.fisherInfo]);

  // Sync with Firebase when user is authenticated or selectedFisher changes
  useEffect(() => {
    if (isAuthenticated && user) {
      syncWithFirebase();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, selectedFisher?.id]);

  const loadStoredData = async () => {
    try {
      const storedHistory = await AsyncStorage.getItem('fishingHistory');
      const storedFisherInfo = await AsyncStorage.getItem('fisherInfo');

      if (storedHistory) {
        dispatch({ type: actionTypes.LOAD_HISTORY, payload: JSON.parse(storedHistory) });
      }

      if (storedFisherInfo) {
        dispatch({ type: actionTypes.UPDATE_FISHER_INFO, payload: JSON.parse(storedFisherInfo) });
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  };

  const saveDataToStorage = async () => {
    try {
      await AsyncStorage.setItem('fishingHistory', JSON.stringify(state.fishingHistory));
      await AsyncStorage.setItem('fisherInfo', JSON.stringify(state.fisherInfo));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Firebase sync functions
  const syncWithFirebase = async () => {
    if (!user?.id) return;

    try {
      dispatch({ type: actionTypes.SET_SYNC_STATUS, payload: { status: 'syncing' } });

      // กำหนด userId ที่จะโหลดข้อมูล
      // - ถ้าเป็นนักวิจัยและเลือกชาวประมงแล้ว ให้โหลดข้อมูลของชาวประมง
      // - ถ้าเป็นชาวประมงเข้าใช้เอง ให้โหลดข้อมูลของตัวเอง
      const targetUserId = isResearcher && selectedFisher ? selectedFisher.id : user.id;

      console.log('🔄 Syncing with Firebase for user:', targetUserId, isResearcher ? '(researcher mode)' : '(fisher mode)');

      // Load fishing records from Firebase
      const result = await FirebaseService.getFishingRecords(targetUserId);

      if (result.success) {
        console.log(`✅ Loaded ${result.records.length} records from Firebase`);

        // Convert Firebase records to local format
        const formattedRecords = result.records.map(record =>
          FirebaseService.formatRecordFromFirebase(record)
        );

        // Use Firebase data directly (don't merge with old local data)
        // This ensures each user sees only their own data
        dispatch({ type: actionTypes.LOAD_HISTORY, payload: formattedRecords });
        dispatch({ type: actionTypes.SET_SYNC_STATUS, payload: { status: 'success' } });

        console.log(`📊 Loaded ${formattedRecords.length} records for ${isResearcher && selectedFisher ? 'selected fisher' : 'current user'}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error syncing with Firebase:', error);
      dispatch({ type: actionTypes.SET_SYNC_STATUS, payload: { status: 'error' } });
    }
  };

  const saveEntryToFirebase = async (entry) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      // กำหนด userId สำหรับบันทึก
      // - ถ้าเป็นนักวิจัยและมีการเลือกชาวประมง ให้ใช้ ID ของชาวประมง
      // - ถ้าเป็นชาวประมงเข้าใช้เอง ให้ใช้ ID ของตัวเอง
      const fisherId = isResearcher && selectedFisher ? selectedFisher.id : user.id;

      // Format entry for Firebase
      const firebaseEntry = FirebaseService.formatRecordForFirebase(entry, fisherId);

      // Handle image uploads if there are any
      console.log('🔍 Checking for images to upload...', {
        fishListLength: firebaseEntry.fishList?.length || 0,
        fishList: firebaseEntry.fishList
      });

      if (firebaseEntry.fishList && firebaseEntry.fishList.length > 0) {
        console.log('📷 Found fish list, checking images...');

        for (let i = 0; i < firebaseEntry.fishList.length; i++) {
          const fish = firebaseEntry.fishList[i];
          console.log(`🐟 Fish ${i}:`, { name: fish.name, hasImage: !!fish.photo, imageUri: fish.photo });

          if (fish.photo && fish.photo.startsWith('file://')) {
            console.log(`⬆️ Uploading image for fish ${i}...`);

            // Upload image to Firebase Storage
            // ✅ ใช้ fisherId แทน user.id เพื่อให้ path ตรงกับข้อมูลที่บันทึก
            const imagePath = FirebaseService.generateImagePath(fisherId, entry.id, i);
            const uploadResult = await FirebaseService.uploadImage(fish.photo, imagePath);

            if (uploadResult.success) {
              console.log(`✅ Image uploaded successfully for fish ${i}:`, uploadResult.url);

              // ✅ ตรวจสอบว่า URL ที่ได้เป็น Firebase Storage URL จริง
              if (!uploadResult.url || !uploadResult.url.startsWith('https://')) {
                console.error(`❌ Invalid Firebase Storage URL for fish ${i}:`, uploadResult.url);
                throw new Error(`ไม่สามารถอัปโหลดรูปภาพ ${fish.name} ได้: URL ไม่ถูกต้อง`);
              }

              firebaseEntry.fishList[i].photo = uploadResult.url;
            } else {
              console.error(`❌ Error uploading image for fish ${i}:`, uploadResult.error);
              // ❌ ไม่บันทึก local path - ต้อง throw error แทน
              throw new Error(`ไม่สามารถอัปโหลดรูปภาพ ${fish.name} ได้: ${uploadResult.error}`);
            }
          } else if (fish.photo && !fish.photo.startsWith('https://')) {
            // ⚠️ ถ้ามีรูปแต่ไม่ใช่ file:// หรือ https:// = path ผิด
            console.error(`❌ Invalid image path for fish ${i}:`, fish.photo);
            throw new Error(`รูปภาพ ${fish.name} มี path ไม่ถูกต้อง: ${fish.photo}`);
          } else {
            console.log(`ℹ️ Fish ${i} has no local image to upload or already uploaded`);
          }
        }
      } else {
        console.log('ℹ️ No fish list found or empty');
      }

      // Save to Firebase
      const result = await FirebaseService.createFishingRecord(firebaseEntry);
      return result;
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      return { success: false, error: error.message };
    }
  };

  const updateCurrentEntry = (data) => {
    dispatch({ type: actionTypes.UPDATE_CURRENT_ENTRY, payload: data });
  };

  const addFish = (fishData) => {
    dispatch({ type: actionTypes.ADD_FISH, payload: fishData });
  };

  const removeFish = (index) => {
    dispatch({ type: actionTypes.REMOVE_FISH, payload: index });
  };

  const saveEntry = async () => {
    // Save locally first
    const newEntry = {
      ...state.currentEntry,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      // เพิ่มข้อมูลผู้จับปลาและผู้บันทึก
      fisherInfo: isResearcher && selectedFisher ? {
        id: selectedFisher.id,
        name: selectedFisher.name,
        phone: selectedFisher.phone,
        village: selectedFisher.village,
        district: selectedFisher.district,
        province: selectedFisher.province
      } : {
        id: user.id,
        name: user.name,
        phone: user.phone,
        village: user.village,
        district: user.district,
        province: user.province
      },
      // ถ้าเป็นนักวิจัยบันทึกให้ ให้เพิ่มข้อมูลผู้บันทึก
      recordedBy: isResearcher && selectedFisher ? {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role
      } : null
    };

    console.log('💾 Saving entry with fisher info:', {
      isResearcher,
      hasSelectedFisher: !!selectedFisher,
      fisherInfo: newEntry.fisherInfo,
      recordedBy: newEntry.recordedBy
    });

    dispatch({ type: actionTypes.SAVE_ENTRY });
    
    // Try to save to Firebase if authenticated
    if (isAuthenticated && user?.id) {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        
        const firebaseResult = await saveEntryToFirebase(newEntry);
        
        if (firebaseResult.success) {
          console.log('Entry saved to Firebase successfully');
          dispatch({ type: actionTypes.SET_SYNC_STATUS, payload: { status: 'success' } });
        } else {
          console.error('Failed to save to Firebase:', firebaseResult.error);
          // Entry is already saved locally, so this is not critical
        }
      } catch (error) {
        console.error('Error saving to Firebase:', error);
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    }
    
    return newEntry;
  };

  const updateFisherInfo = (info) => {
    dispatch({ type: actionTypes.UPDATE_FISHER_INFO, payload: info });
  };

  const resetCurrentEntry = () => {
    dispatch({ type: actionTypes.RESET_CURRENT_ENTRY });
  };

  const forceSyncWithFirebase = () => {
    if (isAuthenticated && user?.id) {
      syncWithFirebase();
    }
  };

  const value = {
    ...state,
    updateCurrentEntry,
    addFish,
    removeFish,
    saveEntry,
    updateFisherInfo,
    resetCurrentEntry,
    syncWithFirebase: forceSyncWithFirebase,
    isOnline: isAuthenticated && user?.id
  };

  return (
    <FishingDataContext.Provider value={value}>
      {children}
    </FishingDataContext.Provider>
  );
}

export function useFishingData() {
  const context = useContext(FishingDataContext);
  if (!context) {
    throw new Error('useFishingData must be used within a FishingDataProvider');
  }
  return context;
}