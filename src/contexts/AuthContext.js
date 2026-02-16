import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseService } from '../services/FirebaseService';

const AuthContext = createContext();


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [selectedFisher, setSelectedFisher] = useState(null); // สำหรับนักวิจัยเลือกชาวประมง
  const [loading, setLoading] = useState(true);

  // Load user from AsyncStorage on app start
  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('currentUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // โหลดข้อมูลชาวประมงที่เลือก (ถ้ามี)
      const storedFisher = await AsyncStorage.getItem('selectedFisher');
      if (storedFisher) {
        setSelectedFisher(JSON.parse(storedFisher));
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Login with phone number (Firebase integration)
  const loginWithPhoneNumber = async (phoneNumber) => {
    try {
      setLoading(true);
      
      // Format phone number (remove any formatting, ensure starts with 0)
      let formattedPhone = phoneNumber.replace(/[-\s]/g, '');
      if (!formattedPhone.startsWith('0')) {
        formattedPhone = '0' + formattedPhone;
      }

      // Try to get user from Firebase first
      const firebaseResult = await FirebaseService.getUser(formattedPhone);
      
      let userData;
      
      if (firebaseResult.success) {
        // User exists in Firebase
        userData = firebaseResult.user;

        // Update last login time in Firebase (non-blocking)
        try {
          await FirebaseService.updateUser(userData.id, {
            lastLoginAt: new Date().toISOString()
          });
          if (__DEV__) console.log('✅ Updated lastLoginAt in Firebase');
        } catch (error) {
          // ไม่ต้อง block การ login ถ้า update ล้มเหลว
          if (__DEV__) console.warn('⚠️ Could not update lastLoginAt:', error.message);
        }

        userData.lastLoginAt = new Date().toISOString();
      } else {
        // User not found in Firebase
        setLoading(false);
        Alert.alert(
          'ไม่พบข้อมูลผู้ใช้',
          'เบอร์โทรศัพท์นี้ไม่ได้ลงทะเบียนในระบบ กรุณาติดต่อผู้ดูแลระบบ'
        );
        return { success: false, error: 'User not found' };
      }

      // Check if user is active
      if (userData.status === 'inactive') {
        setLoading(false);
        Alert.alert(
          'บัญชีถูกปิดการใช้งาน',
          'บัญชีของคุณถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ'
        );
        return { success: false, error: 'Account inactive' };
      }

      // Save user data locally
      setUser(userData);
      await AsyncStorage.setItem('currentUser', JSON.stringify(userData));

      setLoading(false);
      Alert.alert('เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับ ${userData.name}`);
      
      return { success: true, user: userData };
    } catch (error) {
      setLoading(false);
      console.error('Error logging in:', error);
      
      Alert.alert('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      return { success: false, error: 'Login failed' };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setUser(null);
      setSelectedFisher(null);
      await AsyncStorage.removeItem('currentUser');
      await AsyncStorage.removeItem('selectedFisher');
      Alert.alert('ออกจากระบบสำเร็จ', 'ขอบคุณที่ใช้บริการ');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถออกจากระบบได้');
    }
  };

  // เลือกชาวประมง (สำหรับนักวิจัย)
  const selectFisher = async (fisher) => {
    try {
      setSelectedFisher(fisher);
      if (fisher) {
        await AsyncStorage.setItem('selectedFisher', JSON.stringify(fisher));
      } else {
        await AsyncStorage.removeItem('selectedFisher');
      }
      return { success: true };
    } catch (error) {
      console.error('Error selecting fisher:', error);
      return { success: false, error: error.message };
    }
  };

  // ล้างการเลือกชาวประมง
  const clearSelectedFisher = async () => {
    try {
      setSelectedFisher(null);
      await AsyncStorage.removeItem('selectedFisher');
      return { success: true };
    } catch (error) {
      console.error('Error clearing selected fisher:', error);
      return { success: false, error: error.message };
    }
  };

  // Get user profile from Firebase
  const refreshUserProfile = async () => {
    if (!user?.phoneNumber) return;
    
    try {
      const result = await FirebaseService.getUser(user.phoneNumber);
      
      if (result.success) {
        const updatedUser = result.user;
        setUser(updatedUser);
        await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
        return { success: true };
      } else {
        console.log('User not found in Firebase, keeping local data');
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };
    
    try {
      const result = await FirebaseService.updateUser(user.id, updates);
      
      if (result.success) {
        // Update local user data
        const updatedUser = {
          ...user,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        setUser(updatedUser);
        await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    selectedFisher,
    loading,
    loginWithPhoneNumber,
    signOut,
    selectFisher,
    clearSelectedFisher,
    refreshUserProfile,
    updateUserProfile,
    isAuthenticated: !!user,
    isResearcher: user?.role === 'researcher',
    isFisher: user?.role === 'fisher'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}