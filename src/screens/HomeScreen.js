import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, Icon } from 'react-native-paper';
import { useMemo } from 'react';
import { useFishingData } from '../contexts/FishingDataContext';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';
import ScreenContainer from '../components/ScreenContainer';
import CurvedHeader from '../components/CurvedHeader';
import StatTile from '../components/StatTile';
import PrimaryButton from '../components/PrimaryButton';

export default function HomeScreen({ navigation }) {
  const { fishingHistory } = useFishingData();
  const { user, selectedFisher, isResearcher, signOut, clearSelectedFisher } = useAuth();

  // Filter fishing history based on selected fisher or current user
  // ใช้ useMemo เพื่อลด re-render และ log ที่ซ้ำ
  const filteredHistory = useMemo(() => {
    // ตรวจสอบว่า user มีข้อมูลหรือไม่
    if (!user || !user.id) {
      // แสดง warning แค่ครั้งเดียว
      return [];
    }

    if (isResearcher && selectedFisher) {
      // นักวิจัยเลือกชาวประมง → แสดงข้อมูลของชาวประมงคนนั้น
      return fishingHistory.filter(entry => {
        // ตรวจสอบทั้ง fisherInfo.id และ userId เพื่อรองรับข้อมูลเก่า
        return entry.fisherInfo?.id === selectedFisher.id ||
               entry.userId === selectedFisher.id;
      });
    } else if (!isResearcher) {
      // ชาวประมงล็อกอินเอง → แสดงเฉพาะข้อมูลของตัวเอง
      return fishingHistory.filter(entry => {
        return entry.fisherInfo?.id === user.id ||
               entry.userId === user.id;
      });
    }
    // นักวิจัยยังไม่เลือกชาวประมง → ไม่แสดงข้อมูล
    return [];
  }, [fishingHistory, user, selectedFisher, isResearcher]);

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
    navigation.navigate('RecordTab', { screen: 'DataEntry' });
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
    // Sort by date (newest first) then take first 3
    return [...filteredHistory]
      .sort((a, b) => {
        const dateA = getDateValue(a.date);
        const dateB = getDateValue(b.date);
        return dateB - dateA; // Descending order (newest first)
      })
      .slice(0, 3);
  };

  // Helper function to convert various date formats to timestamp
  const getDateValue = (dateValue) => {
    try {
      if (!dateValue) return 0;

      // Handle Firestore Timestamp object
      if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
        return dateValue.seconds * 1000;
      }
      // Handle Date object
      if (dateValue instanceof Date) {
        return dateValue.getTime();
      }
      // Handle string or number
      if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        return new Date(dateValue).getTime();
      }
      // Handle Firestore Timestamp with toDate() method
      if (dateValue && typeof dateValue.toDate === 'function') {
        return dateValue.toDate().getTime();
      }

      return 0;
    } catch (error) {
      console.error('Error getting date value:', error);
      return 0;
    }
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
        if (__DEV__) console.log('Unknown date format:', dateValue);
        return 'ไม่ระบุวันที่';
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        if (__DEV__) console.log('Invalid date:', dateValue);
        return 'ไม่ระบุวันที่';
      }

      // Format Thai date with Thai month names
      const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
        'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
        'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
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

  // Aggregate stats from Firebase-backed history (realtime via onSnapshot)
  const stats = useMemo(() => {
    const times = filteredHistory.length;
    const species = filteredHistory.reduce(
      (total, entry) => total + (entry.fishList?.length || 0), 0);
    const fishCount = filteredHistory.reduce((total, entry) =>
      total + (entry.fishList?.reduce(
        (sum, fish) => sum + (parseInt(fish.count, 10) || 0), 0) || 0), 0);
    const weight = filteredHistory.reduce(
      (total, entry) => total + (parseFloat(entry.totalWeight) || 0), 0);
    return { times, species, fishCount, weight };
  }, [filteredHistory]);

  const hasData = filteredHistory.length > 0;

  const roleLabel = user?.role === 'researcher' ? 'นักวิจัย' : 'ชาวประมง';
  const place = user?.village
    ? [user.village, user.district, user.province].filter(Boolean).join(' · ')
    : null;

  const header = (
    <CurvedHeader showBack={false}>
      {/* ── Header band: deep river water, curved like a riverbank ── */}
      <Text style={styles.greeting}>ยินดีต้อนรับ</Text>
      <Text style={styles.userName}>{getUserDisplayName()}</Text>
      <View style={styles.rolePill}>
        <View style={styles.roleDot} />
        <Text style={styles.roleText}>{roleLabel}</Text>
      </View>
      {place && <Text style={styles.placeText}>{place}</Text>}
      {user?.occupation ? (
        <Text style={styles.placeText}>
          {user.occupation}
          {user.experience ? `  ·  ประสบการณ์ ${user.experience}` : ''}
        </Text>
      ) : null}
    </CurvedHeader>
  );

  return (
    <ScreenContainer header={header}>
      <View style={styles.body}>
        {/* ── Researcher: which fisher's data am I viewing ── */}
        {isResearcher && (
          <View style={styles.fisherPanel}>
            {selectedFisher ? (
              <>
                <View style={styles.fisherRow}>
                  <View style={styles.fisherAvatar}>
                    <Icon source="account" size={26} color={colors.riverDeep} />
                  </View>
                  <View style={styles.fisherText}>
                    <Text style={styles.fisherEyebrow}>กำลังดูข้อมูลของ</Text>
                    <Text style={styles.fisherName}>{selectedFisher.name}</Text>
                    {(selectedFisher.phone || selectedFisher.village) && (
                      <Text style={styles.fisherMeta}>
                        {[selectedFisher.phone, selectedFisher.village]
                          .filter(Boolean).join('  ·  ')}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.fisherActions}>
                  <Button
                    mode="text"
                    onPress={handleChangeFisher}
                    icon="account-switch"
                    compact
                    textColor={colors.riverMid}
                  >
                    เปลี่ยนคน
                  </Button>
                  <Button
                    mode="text"
                    onPress={handleClearFisher}
                    icon="close"
                    compact
                    textColor={colors.clay}
                  >
                    ล้าง
                  </Button>
                </View>
              </>
            ) : (
              <View style={styles.noFisher}>
                <Icon source="account-alert-outline" size={30} color={colors.gold} />
                <View style={styles.noFisherText}>
                  <Text style={styles.noFisherTitle}>ยังไม่ได้เลือกชาวประมง</Text>
                  <Text style={styles.noFisherSub}>เลือกก่อนเริ่มบันทึกข้อมูล</Text>
                </View>
                <Button
                  mode="contained"
                  onPress={handleChangeFisher}
                  buttonColor={colors.riverDeep}
                  compact
                >
                  เลือก
                </Button>
              </View>
            )}
          </View>
        )}

        {/* ── Stats: the numbers are the hero ── */}
        <Text style={styles.sectionTitle}>ภาพรวมการบันทึก</Text>
        <View style={styles.statGrid}>
          <StatTile value={hasData ? stats.times : '—'} unit="ครั้ง"
            label="บันทึกแล้ว" accent={colors.riverDeep} big />
          <StatTile value={hasData ? stats.species : '—'} unit="ชนิด"
            label="ชนิดปลา" accent={colors.riverMid} big />
          <StatTile value={hasData ? stats.fishCount : '—'} unit="ตัว"
            label="จำนวนปลา" accent={colors.riverMid} />
          <StatTile value={hasData ? stats.weight.toFixed(1) : '—'} unit="กก."
            label="น้ำหนักรวม" accent={colors.gold} />
        </View>

        {/* ── Primary action ── */}
        <PrimaryButton
          icon="plus"
          title="เริ่มบันทึกการจับปลา"
          subtitle="จดข้อมูลการจับปลาของวันนี้"
          onPress={handleStartRecording}
          style={styles.primaryActionSpacing}
        />

        {/* ── Recent entries as a timeline ── */}
        {hasData && (
          <>
            <Text style={styles.sectionTitle}>บันทึกล่าสุด</Text>
            <View style={styles.timeline}>
              {getRecentEntries().map((entry, index, arr) => (
                <View key={entry.id || index} style={styles.timelineRow}>
                  <View style={styles.timelineMarker}>
                    <View style={styles.timelineDot} />
                    {index < arr.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineDate}>{formatDate(entry.date)}</Text>
                    <Text style={styles.timelineDetail}>
                      {entry.noFishing
                        ? 'ไม่ได้ออกจับปลา'
                        : `จับได้ ${entry.fishList?.length || 0} ชนิด  ·  ${entry.totalWeight || '0'} กก.`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {!hasData && (
          <Text style={styles.emptyNote}>
            ยังไม่มีบันทึก เริ่มจดการจับปลาครั้งแรกได้เลย
          </Text>
        )}

        {/* ── Sign out ── */}
        <Button
          mode="outlined"
          onPress={handleLogout}
          icon="logout"
          textColor={colors.clay}
          style={styles.logout}
          contentStyle={styles.logoutContent}
        >
          ออกจากระบบ
        </Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  greeting: {
    color: 'rgba(242,237,228,0.75)',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  userName: {
    color: colors.surface,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
    lineHeight: 34,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(232,163,61,0.18)',
  },
  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.gold,
    marginRight: 7,
  },
  roleText: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  placeText: {
    color: 'rgba(242,237,228,0.8)',
    fontSize: 13.5,
    marginTop: 8,
    lineHeight: 19,
  },

  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  sectionTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 14,
    marginTop: 4,
  },

  // Researcher panel
  fisherPanel: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 16,
    marginBottom: 22,
  },
  fisherRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fisherAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(27,122,140,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  fisherText: {
    flex: 1,
  },
  fisherEyebrow: {
    color: colors.inkSoft,
    fontSize: 12,
  },
  fisherName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 1,
  },
  fisherMeta: {
    color: colors.inkSoft,
    fontSize: 13,
    marginTop: 2,
  },
  fisherActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: 6,
  },
  noFisher: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noFisherText: {
    flex: 1,
    marginLeft: 12,
  },
  noFisherTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  noFisherSub: {
    color: colors.inkSoft,
    fontSize: 13,
    marginTop: 2,
  },

  // Stat tiles — number-forward
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 26,
  },

  // Primary action
  primaryActionSpacing: {
    marginBottom: 28,
  },

  // Timeline
  timeline: {
    marginBottom: 12,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineMarker: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.sand,
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.hairline,
    marginTop: 2,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 18,
  },
  timelineDate: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  timelineDetail: {
    color: colors.inkSoft,
    fontSize: 13.5,
    marginTop: 3,
  },

  emptyNote: {
    color: colors.inkSoft,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },

  logout: {
    marginTop: 8,
    marginBottom: 16,
    borderColor: colors.clay,
    borderWidth: 1.5,
    borderRadius: 12,
  },
  logoutContent: {
    paddingVertical: 6,
  },
});
