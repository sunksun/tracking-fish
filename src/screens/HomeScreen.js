import React from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Button, Card, Text, Icon } from 'react-native-paper';
import { useFishingData } from '../contexts/FishingDataContext';
import { useAuth } from '../contexts/AuthContext';

export default function HomeScreen({ navigation }) {
  const { fishingHistory } = useFishingData();
  const { user, selectedFisher, isResearcher, signOut, clearSelectedFisher } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'ออกจากระบบ',
      'คุณต้องการออกจากระบบหรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ออกจากระบบ', onPress: signOut }
      ]
    );
  };

  const handleStartRecording = () => {
    // ถ้าเป็นนักวิจัยและยังไม่ได้เลือกชาวประมง ให้ไปหน้าเลือกชาวประมงก่อน
    if (isResearcher && !selectedFisher) {
      Alert.alert(
        'กรุณาเลือกชาวประมง',
        'คุณต้องเลือกชาวประมงก่อนบันทึกข้อมูล',
        [
          { text: 'ยกเลิก', style: 'cancel' },
          { text: 'เลือกชาวประมง', onPress: () => navigation.navigate('SelectFisher') }
        ]
      );
      return;
    }
    navigation.navigate('DataEntry');
  };

  const handleChangeFisher = () => {
    navigation.navigate('SelectFisher');
  };

  const handleClearFisher = () => {
    Alert.alert(
      'ล้างการเลือกชาวประมง',
      'คุณต้องการยกเลิกการเลือกชาวประมงหรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ยืนยัน',
          onPress: async () => {
            await clearSelectedFisher();
            Alert.alert('สำเร็จ', 'ยกเลิกการเลือกชาวประมงแล้ว');
          }
        }
      ]
    );
  };


  const getRecentEntries = () => {
    return fishingHistory.slice(0, 3);
  };

  // Helper function to safely format date
  const formatDate = (dateValue) => {
    try {
      if (!dateValue) return 'ไม่ระบุวันที่';
      
      let date;
      
      // Handle Firestore Timestamp object
      if (dateValue && typeof dateValue === 'object' && dateValue.seconds && dateValue.nanoseconds) {
        // Convert Firestore timestamp to JavaScript Date
        date = new Date(dateValue.seconds * 1000 + dateValue.nanoseconds / 1000000);
      } 
      // Handle regular Date object
      else if (dateValue instanceof Date) {
        date = dateValue;
      } 
      // Handle string or number
      else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        date = new Date(dateValue);
      } 
      // Handle Firestore Timestamp with toDate() method
      else if (dateValue && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
      } 
      else {
        console.log('Unknown date format:', dateValue);
        return 'ไม่ระบุวันที่';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log('Invalid date:', dateValue);
        return 'ไม่ระบุวันที่';
      }
      
      // Format Thai date with Thai month names
      const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 
        'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
        'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      
      const day = date.getDate();
      const month = thaiMonths[date.getMonth()];
      const year = date.getFullYear() + 543; // Convert to Buddhist Era
      
      return `${day} ${month} ${year}`;
    } catch (error) {
      console.error('Error formatting date:', error, dateValue);
      return 'ไม่ระบุวันที่';
    }
  };

  // Get user display info
  const getUserDisplayName = () => {
    return user?.name || user?.phone || 'ผู้ใช้';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header with user info */}
        <Card style={[styles.card, styles.headerCard]}>
          <Card.Content>
            <View style={styles.userInfo}>
              <Text variant="headlineSmall" style={styles.welcomeText}>
                ยินดีต้อนรับ
              </Text>
              <Text variant="titleLarge" style={styles.userName}>
                {getUserDisplayName()}
              </Text>
              {user?.role && (
                <Text variant="bodyMedium" style={styles.userDetails}>
                  🏷️ {user.role === 'researcher' ? 'นักวิจัย' : 'ชาวประมง'}
                </Text>
              )}
              {user?.village && (
                <Text variant="bodyMedium" style={styles.userDetails}>
                  🏠 {user.village}, {user.district}, {user.province}
                </Text>
              )}
              {user?.occupation && (
                <Text variant="bodyMedium" style={styles.userDetails}>
                  👨‍🌾 {user.occupation} {user.experience && `(ประสบการณ์ ${user.experience})`}
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Selected Fisher Card (สำหรับนักวิจัย) */}
        {isResearcher && (
          <Card style={[styles.card, styles.fisherCard]}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                ข้อมูลชาวประมง
              </Text>
              {selectedFisher ? (
                <>
                  <View style={styles.selectedFisherInfo}>
                    <Icon source="account-check" size={40} color="#4caf50" />
                    <View style={styles.selectedFisherDetails}>
                      <Text variant="titleMedium" style={styles.selectedFisherName}>
                        {selectedFisher.name}
                      </Text>
                      {selectedFisher.phone && (
                        <Text variant="bodyMedium" style={styles.fisherDetail}>
                          📱 {selectedFisher.phone}
                        </Text>
                      )}
                      {selectedFisher.village && (
                        <Text variant="bodyMedium" style={styles.fisherDetail}>
                          🏠 {selectedFisher.village}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.fisherActions}>
                    <Button
                      mode="outlined"
                      onPress={handleChangeFisher}
                      style={styles.changeFisherButton}
                      icon="account-switch"
                      compact
                    >
                      เปลี่ยนชาวประมง
                    </Button>
                    <Button
                      mode="text"
                      onPress={handleClearFisher}
                      icon="close"
                      compact
                      textColor="#d32f2f"
                    >
                      ยกเลิก
                    </Button>
                  </View>
                </>
              ) : (
                <View style={styles.noFisherSelected}>
                  <Icon source="account-alert" size={40} color="#ff9800" />
                  <Text variant="bodyMedium" style={styles.noFisherText}>
                    คุณยังไม่ได้เลือกชาวประมง
                  </Text>
                  <Text variant="bodySmall" style={styles.noFisherSubtext}>
                    กรุณาเลือกชาวประมงก่อนบันทึกข้อมูล
                  </Text>
                  <Button
                    mode="contained"
                    onPress={handleChangeFisher}
                    style={styles.selectFisherButton}
                    icon="account-plus"
                  >
                    เลือกชาวประมง
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Quick Stats */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              สถิติรวม
            </Text>

            {/* Stats Grid - 2x2 */}
            <View style={styles.statsGrid}>
              <View style={styles.statRow}>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  จำนวนครั้งที่บันทึก
                </Text>
                <Text variant="bodyMedium" style={styles.statValue}>
                  {fishingHistory.length > 0 ? `${fishingHistory.length} ครั้ง` : '- ครั้ง'}
                </Text>
              </View>

              <View style={styles.statRow}>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  จำนวนชนิดปลา
                </Text>
                <Text variant="bodyMedium" style={styles.statValue}>
                  {fishingHistory.length > 0
                    ? `${fishingHistory.reduce((total, entry) => total + (entry.fishList?.length || 0), 0)} ชนิด`
                    : '- ชนิด'}
                </Text>
              </View>

              <View style={styles.statRow}>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  จำนวนปลาที่จับได้
                </Text>
                <Text variant="bodyMedium" style={styles.statValue}>
                  {fishingHistory.length > 0
                    ? `${fishingHistory.reduce((total, entry) => {
                        return total + (entry.fishList?.reduce((sum, fish) => sum + parseInt(fish.count || 0), 0) || 0);
                      }, 0)} ตัว`
                    : '- ตัว'}
                </Text>
              </View>

              <View style={styles.statRow}>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  น้ำหนักรวม
                </Text>
                <Text variant="bodyMedium" style={styles.statValue}>
                  {fishingHistory.length > 0
                    ? `${fishingHistory.reduce((total, entry) => total + parseFloat(entry.totalWeight || 0), 0).toFixed(2)} กก.`
                    : '- กก.'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Main Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <Card style={[styles.card, styles.actionCard]}>
            <Card.Content style={styles.actionCardContent}>
              <View style={styles.actionIcon}>
                <Icon source="plus-circle" size={48} color="#4caf50" />
              </View>
              <Text variant="titleMedium" style={styles.actionTitle}>
                เริ่มบันทึกการจับปลา
              </Text>
              <Text variant="bodySmall" style={styles.actionSubtitle}>
                บันทึกข้อมูลการจับปลาใหม่
              </Text>
              <Button
                mode="contained"
                onPress={handleStartRecording}
                style={[styles.actionButton, styles.primaryActionButton]}
                contentStyle={styles.buttonContent}
                icon="arrow-right"
              >
                เริ่มบันทึก
              </Button>
            </Card.Content>
          </Card>

          <Card style={[styles.card, styles.actionCard]}>
            <Card.Content style={styles.actionCardContent}>
              <View style={styles.actionIcon}>
                <Icon source="history" size={48} color="#ff9800" />
              </View>
              <Text variant="titleMedium" style={styles.actionTitle}>
                ดูประวัติการจับปลา
              </Text>
              <Text variant="bodySmall" style={styles.actionSubtitle}>
                ดูข้อมูลการจับปลาที่ผ่านมา
              </Text>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('History')}
                style={[styles.actionButton, styles.secondaryActionButton]}
                contentStyle={styles.buttonContent}
                icon="arrow-right"
              >
                ดูประวัติ
              </Button>
            </Card.Content>
          </Card>
        </View>

        {/* Recent Entries Summary */}
        {fishingHistory.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                บันทึกล่าสุด
              </Text>
              {getRecentEntries().map((entry, index) => (
                <View key={entry.id || index} style={styles.recentEntry}>
                  <Text variant="bodyMedium">
                    {formatDate(entry.date)}
                  </Text>
                  <Text variant="bodySmall" style={styles.recentEntryDetail}>
                    {entry.noFishing 
                      ? 'ไม่ได้จับปลา' 
                      : `จับปลาได้ ${entry.fishList?.length || 0} ชนิด (${entry.totalWeight || '0'} กก.)`
                    }
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}


        {/* Logout Button */}
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          contentStyle={styles.buttonContent}
          icon="logout"
          textColor="#d32f2f"
        >
          ออกจากระบบ
        </Button>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Login Screen Styles
  loginContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  loginContent: {
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
  phoneInput: {
    width: '100%',
    marginBottom: 24,
  },
  loginButton: {
    width: '100%',
    marginBottom: 32,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  projectTitle: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Main App Styles
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  headerCard: {
    backgroundColor: '#f8f9fa',
    elevation: 4,
  },
  userInfo: {
    alignItems: 'center',
  },
  welcomeText: {
    color: '#2196F3',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userName: {
    color: '#1976d2',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userDetails: {
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#2196F3',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#666',
    textAlign: 'center',
  },
  actionButtonsContainer: {
    marginBottom: 16,
  },
  actionCard: {
    elevation: 4,
    marginBottom: 12,
  },
  actionCardContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  actionIcon: {
    marginBottom: 12,
  },
  actionTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  actionSubtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  actionButton: {
    minWidth: 140,
  },
  primaryActionButton: {
    backgroundColor: '#4caf50',
  },
  secondaryActionButton: {
    borderColor: '#ff9800',
  },
  cardTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statsGrid: {
    paddingTop: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statValue: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  fisherInfo: {
    marginBottom: 8,
  },
  noInfoText: {
    color: '#666',
    marginBottom: 12,
  },
  editButton: {
    marginTop: 8,
  },
  addInfoButton: {
    marginTop: 8,
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    marginBottom: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  recentEntry: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recentEntryDetail: {
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    marginTop: 24,
    marginBottom: 32,
    borderColor: '#d32f2f',
  },
  // Fisher Card Styles
  fisherCard: {
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  selectedFisherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f1f8f4',
    borderRadius: 8,
  },
  selectedFisherDetails: {
    flex: 1,
    marginLeft: 12,
  },
  selectedFisherName: {
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  fisherDetail: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  fisherActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  changeFisherButton: {
    flex: 1,
    borderColor: '#2196F3',
  },
  noFisherSelected: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noFisherText: {
    marginTop: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  noFisherSubtext: {
    marginTop: 4,
    color: '#999',
    textAlign: 'center',
  },
  selectFisherButton: {
    marginTop: 16,
    backgroundColor: '#4caf50',
  },
});