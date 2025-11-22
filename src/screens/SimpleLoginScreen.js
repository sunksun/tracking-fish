import React, { useState } from 'react';
import { View, StyleSheet, Alert, Keyboard, Image } from 'react-native';
import {
  Button,
  Text,
  TextInput,
  ActivityIndicator,
  Card
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

export default function SimpleLoginScreen() {
  const { loginWithPhoneNumber, loading } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');

  // Format phone number as user types
  const handlePhoneChange = (text) => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (digits.length <= 10) {
      setPhoneNumber(digits);
    }
  };

  // Format display of phone number
  const getFormattedPhone = () => {
    if (phoneNumber.length >= 3) {
      return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    return phoneNumber;
  };

  const handleLogin = async () => {
    // ปิดแป้นพิมพ์ก่อน
    Keyboard.dismiss();
    
    if (!phoneNumber || phoneNumber.length !== 10) {
      Alert.alert('เบอร์โทรศัพท์ไม่ถูกต้อง', 'กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
      return;
    }

    const result = await loginWithPhoneNumber(phoneNumber);
    
    if (result.success) {
      // User will be automatically navigated by auth state change
    }
  };

  const handlePhoneSubmit = () => {
    // เมื่อกด Done/Return บนแป้นพิมพ์
    Keyboard.dismiss();
    if (phoneNumber.length === 10) {
      handleLogin();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>กำลังตรวจสอบข้อมูล...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Logo Icon */}
        <View style={styles.iconContainer}>
          <Image
            source={require('../../assets/icon-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* App Title */}
        <Text variant="titleLarge" style={styles.appTitle}>
          ระบบติดตามการจับสัตว์น้ำ
        </Text>
      </View>

      <View style={styles.content}>
        {/* Login Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.loginTitle}>
              เข้าสู่ระบบ
            </Text>
            
            <Text variant="bodyMedium" style={styles.subtitle}>
              กรอกหมายเลขโทรศัพท์เพื่อเข้าสู่ระบบ
            </Text>
            
            <TextInput
              label="เบอร์โทรศัพท์"
              value={getFormattedPhone()}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              mode="outlined"
              style={styles.input}
              placeholder=""
              maxLength={12} // For formatted display
              left={<TextInput.Icon icon="phone" />}
              returnKeyType="done"
              onSubmitEditing={handlePhoneSubmit}
              blurOnSubmit={true}
            />


            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.loginButton}
              disabled={phoneNumber.length !== 10 || loading}
              icon="login"
              loading={loading}
            >
              เข้าสู่ระบบ
            </Button>
          </Card.Content>
        </Card>

      </View>

      {/* Project Title Footer */}
      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.projectTitle}>
          ภายใต้โครงการวิจัย{'\n'}
          การจัดการความหลากหลายทางชีวภาพของพันธุ์ปลาในแม่นํ้าโขง{'\n'}
          อ.เชียงคาน - อ.ปากชม
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    marginBottom: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#2196F3',
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 80, // ขยับ card ขึ้นด้านบน
    paddingBottom: 100, // เผื่อพื้นที่สำหรับ footer
  },
  card: {
    width: '100%',
    marginBottom: 16,
    elevation: 4,
  },
  loginTitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
    lineHeight: 18,
  },
  input: {
    marginBottom: 12,
  },
  loginButton: {
    paddingVertical: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'rgba(245, 245, 245, 0.95)',
  },
  projectTitle: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 16,
    fontStyle: 'italic',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
});