import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { 
  Button, 
  Text, 
  TextInput, 
  Icon,
  ActivityIndicator,
  Card
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

export default function FirebaseLoginScreen() {
  const { sendPhoneVerification, verifyPhoneNumber, loading } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [countdown, setCountdown] = useState(0);

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

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      Alert.alert('เบอร์โทรศัพท์ไม่ถูกต้อง', 'กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก');
      return;
    }

    const result = await sendPhoneVerification(phoneNumber);
    
    if (result.success) {
      setStep('otp');
      startCountdown();
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert('รหัส OTP ไม่ถูกต้อง', 'กรุณากรอกรหัส OTP ให้ครบ 6 หลัก');
      return;
    }

    const result = await verifyPhoneNumber(otpCode);
    
    if (result.success) {
      // User will be automatically navigated by auth state change
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    const result = await sendPhoneVerification(phoneNumber);
    if (result.success) {
      startCountdown();
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtpCode('');
    setCountdown(0);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>กำลังดำเนินการ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Fish Icon */}
        <View style={styles.iconContainer}>
          <Icon source="fish" size={80} color="#2196F3" />
        </View>

        {/* App Title */}
        <Text variant="headlineMedium" style={styles.appTitle}>
          ระบบติดตามการจับสัตว์น้ำ
        </Text>

        {step === 'phone' ? (
          // Phone Number Input Step
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.stepTitle}>
                กรอกหมายเลขโทรศัพท์
              </Text>
              
              <TextInput
                label="เบอร์โทรศัพท์"
                value={getFormattedPhone()}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                mode="outlined"
                style={styles.input}
                placeholder="081-234-5678"
                maxLength={12} // For formatted display
                left={<TextInput.Icon icon="phone" />}
              />

              <Text variant="bodySmall" style={styles.helperText}>
                กรุณากรอกเบอร์โทรศัพท์ 10 หลัก เราจะส่งรหัส OTP ไปยังเบอร์นี้
              </Text>

              <Button
                mode="contained"
                onPress={handleSendOTP}
                style={styles.button}
                disabled={phoneNumber.length !== 10}
                icon="send"
              >
                ส่งรหัส OTP
              </Button>
            </Card.Content>
          </Card>
        ) : (
          // OTP Verification Step
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.stepTitle}>
                กรอกรหัส OTP
              </Text>
              
              <Text variant="bodyMedium" style={styles.phoneDisplay}>
                ส่งไปยัง: {getFormattedPhone()}
              </Text>

              <TextInput
                label="รหัส OTP"
                value={otpCode}
                onChangeText={(text) => setOtpCode(text.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                mode="outlined"
                style={styles.input}
                placeholder="123456"
                maxLength={6}
                left={<TextInput.Icon icon="key" />}
              />

              <Text variant="bodySmall" style={styles.helperText}>
                กรุณากรอกรหัส OTP 6 หลักที่ส่งไปยังเบอร์โทรศัพท์ของคุณ
              </Text>

              <Button
                mode="contained"
                onPress={handleVerifyOTP}
                style={styles.button}
                disabled={otpCode.length !== 6}
                icon="check"
              >
                ยืนยันรหัส OTP
              </Button>

              <View style={styles.resendContainer}>
                {countdown > 0 ? (
                  <Text variant="bodySmall" style={styles.countdownText}>
                    ส่งรหัสใหม่ได้ในอีก {countdown} วินาที
                  </Text>
                ) : (
                  <Button
                    mode="outlined"
                    onPress={handleResendOTP}
                    style={styles.resendButton}
                    icon="refresh"
                  >
                    ส่งรหัสใหม่
                  </Button>
                )}
              </View>

              <Button
                mode="text"
                onPress={handleBackToPhone}
                style={styles.backButton}
                icon="arrow-left"
              >
                เปลี่ยนเบอร์โทรศัพท์
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Project Title */}
        <Text variant="bodyMedium" style={styles.projectTitle}>
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
    justifyContent: 'center',
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#e3f2fd',
    borderRadius: 50,
  },
  appTitle: {
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  card: {
    width: '100%',
    marginBottom: 24,
    elevation: 4,
  },
  stepTitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
  },
  helperText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
    lineHeight: 18,
  },
  phoneDisplay: {
    textAlign: 'center',
    color: '#2196F3',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  button: {
    marginBottom: 16,
    paddingVertical: 4,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  resendButton: {
    marginBottom: 8,
  },
  countdownText: {
    color: '#666',
    marginBottom: 8,
  },
  backButton: {
    marginTop: 8,
  },
  projectTitle: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
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