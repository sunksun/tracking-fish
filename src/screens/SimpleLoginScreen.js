import React, { useState } from 'react';
import { View, StyleSheet, Alert, Keyboard, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import {
  Button,
  Text,
  TextInput,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';

// สายน้ำโขงยามเช้า — ใช้ token กลางจาก src/theme (sunrise = gold)
const COLORS = {
  riverDeep: colors.riverDeep,
  riverMid: colors.riverMid,
  riverLight: colors.riverLight,
  sunrise: colors.gold,
  sunriseDark: colors.gold,
  sand: colors.sand,
  ink: colors.ink,
  inkSoft: colors.inkSoft,
};

export default function SimpleLoginScreen() {
  const { loginWithPhoneNumber, loading } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');

  const handlePhoneChange = (text) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 10) {
      setPhoneNumber(digits);
    }
  };

  const getFormattedPhone = () => {
    if (phoneNumber.length >= 3) {
      return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    return phoneNumber;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!phoneNumber || phoneNumber.length !== 10) {
      Alert.alert('เบอร์โทรศัพท์ไม่ถูกต้อง', 'กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
      return;
    }
    await loginWithPhoneNumber(phoneNumber);
  };

  const handlePhoneSubmit = () => {
    Keyboard.dismiss();
    if (phoneNumber.length === 10) {
      handleLogin();
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: COLORS.riverDeep }]}>
        <ActivityIndicator size="large" color={COLORS.sunrise} />
        <Text style={styles.loadingText}>กำลังตรวจสอบข้อมูล...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ชั้นไล่เฉดน้ำ (แทน gradient ด้วย view ซ้อน) — pointerEvents none ให้แตะทะลุไปโดนฟอร์มได้ */}
      <View pointerEvents="none" style={[styles.waterLayer, { backgroundColor: COLORS.riverDeep, top: 0, height: '55%' }]} />
      <View pointerEvents="none" style={[styles.waterLayer, { backgroundColor: COLORS.riverMid, top: '30%', height: '35%', opacity: 0.9 }]} />
      <View pointerEvents="none" style={[styles.waterLayer, { backgroundColor: COLORS.riverLight, top: '48%', height: '20%', opacity: 0.5 }]} />
      {/* ผิวน้ำโค้ง คั่นหัวกับฟอร์ม */}
      <View pointerEvents="none" style={styles.surfaceCurve} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* หัว — โลโก้ + ชื่อระบบ (พระเอกของหน้า) */}
            <View style={styles.hero}>
              <View style={styles.logoRing}>
                <Image
                  source={require('../../assets/icon-logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.appTitle}>ระบบจำแนกและติดตาม{'\n'}ปลาแม่น้ำโขง</Text>
              <Text style={styles.appTagline}>ถ่ายรูปปลา · รู้ชนิด · บันทึกการจับ</Text>
            </View>

            {/* ฟอร์ม — ลอยบนแผ่น sand */}
            <View style={styles.panel}>
              <Text style={styles.panelHeading}>เข้าใช้งาน</Text>
              <Text style={styles.panelSub}>กรอกเบอร์โทรศัพท์ของคุณเพื่อเริ่มใช้งาน</Text>

              <TextInput
                label="เบอร์โทรศัพท์"
                value={getFormattedPhone()}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                mode="outlined"
                style={styles.input}
                maxLength={12}
                left={<TextInput.Icon icon="phone" />}
                returnKeyType="done"
                onSubmitEditing={handlePhoneSubmit}
                blurOnSubmit
                outlineColor="#D8D3C4"
                activeOutlineColor={COLORS.riverMid}
              />

              <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.loginButton}
                contentStyle={styles.loginButtonContent}
                labelStyle={styles.loginButtonLabel}
                disabled={phoneNumber.length !== 10 || loading}
                buttonColor={COLORS.sunrise}
                loading={loading}
              >
                เข้าใช้งาน
              </Button>
            </View>

            {/* ที่มาโครงการ */}
            <Text style={styles.projectTitle}>
              ภายใต้โครงการวิจัยการจัดการความหลากหลายทางชีวภาพ{'\n'}
              ของพันธุ์ปลาในแม่น้ำโขง อ.เชียงคาน – อ.ปากชม
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.sand,
  },
  flex: { flex: 1 },
  waterLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  // ผิวน้ำโค้งมนคั่นระหว่างหัวสีน้ำกับพื้น sand
  surfaceCurve: {
    position: 'absolute',
    top: '50%',
    left: -40,
    right: -40,
    height: 220,
    backgroundColor: COLORS.sand,
    borderTopLeftRadius: 280,
    borderTopRightRadius: 280,
  },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 28,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: COLORS.sand,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    marginBottom: 18,
  },
  logoImage: {
    width: '82%',
    height: '82%',
  },
  appTitle: {
    textAlign: 'center',
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  appTagline: {
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(242,239,230,0.85)',
    marginTop: 20,
  },
  // แผ่นฟอร์มลอยบนผิวน้ำ
  panel: {
    backgroundColor: COLORS.sand,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 26,
    marginTop: 8,
    // เงานุ่มให้รู้สึกลอย
    elevation: 8,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  panelHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.ink,
    textAlign: 'center',
  },
  panelSub: {
    fontSize: 14,
    color: COLORS.inkSoft,
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  loginButton: {
    borderRadius: 14,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  loginButtonLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
  },
  projectTitle: {
    textAlign: 'center',
    color: COLORS.inkSoft,
    lineHeight: 18,
    fontSize: 12,
    marginTop: 'auto',
    paddingTop: 28,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.sand,
  },
});
