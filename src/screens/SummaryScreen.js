import { View, StyleSheet, Image, Alert } from 'react-native';
import {
  Button,
  Text,
  List,
  Divider,
  Chip
} from 'react-native-paper';
import { useFishingData } from '../contexts/FishingDataContext';
import { useAuth } from '../contexts/AuthContext';
import ScreenContainer from '../components/ScreenContainer';
import CurvedHeader from '../components/CurvedHeader';
import Panel from '../components/Panel';
import { colors, spacing, radius } from '../theme';


export default function SummaryScreen({ navigation }) {
  const { currentEntry, saveEntry, resetCurrentEntry, fisherInfo } = useFishingData();
  const { user, selectedFisher, isResearcher } = useAuth();

  // Debug: แสดงข้อมูลที่จะบันทึก
  if (__DEV__) {
    console.log('📋 SummaryScreen - Current Entry:', {
      waterSource: currentEntry.waterSource,
      weather: currentEntry.weather,
      fishingGear: currentEntry.fishingGear,
      startTime: currentEntry.startTime,
      endTime: currentEntry.endTime,
      totalWeight: currentEntry.totalWeight,
      noFishing: currentEntry.noFishing,
      isResearcher,
      selectedFisher: selectedFisher?.name
    });
  }

  const formatTime = (time) => {
    if (!time) return '-';
    
    // ถ้าเป็น string (เช้า, กลางวัน, เย็น) ให้แสดงตามนั้น
    if (typeof time === 'string') {
      return time;
    }
    
    // ถ้าเป็น Date object ให้แสดงเวลา
    return new Date(time).toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTotalCount = () => {
    return currentEntry.fishList.reduce((total, fish) => total + parseInt(fish.count || 0), 0);
  };

  const getTotalWeight = () => {
    return currentEntry.fishList.reduce((total, fish) => total + parseFloat(fish.weight || 0), 0).toFixed(2);
  };

  const getTotalValue = () => {
    return currentEntry.fishList.reduce((total, fish) => total + parseFloat(fish.price || 0), 0).toFixed(2);
  };

  const getGearDisplayText = (gear) => {
    if (!gear || !gear.name) return '-';

    const details = gear.details || {};

    // แสดงรายละเอียดตามประเภทเครื่องมือ
    if (gear.name === 'อื่นๆ') {
      return `${details.custom || 'อื่นๆ'} ${details.quantity ? `จำนวน ${details.quantity}` : ''}`;
    } else if (gear.name === 'มอง' || gear.name === 'แห') {
      // มอง/แห: ขนาดตา, ความยาว, ความลึก, จำนวน
      const parts = [gear.name];
      if (details.meshSize) parts.push(`ขนาดตา ${details.meshSize} ซม.`);
      if (details.length) parts.push(`ยาว ${details.length} ม.`);
      if (details.depth) parts.push(`ลึก ${details.depth} ม.`);
      if (details.quantity) parts.push(`จำนวน ${details.quantity} ผืน`);
      return parts.join(' ');
    } else if (gear.name === 'เบ็ดน้ำเต้า') {
      // เบ็ดน้ำเต้า: เบอร์, จำนวน (เต้า)
      const parts = [gear.name];
      if (details.size) parts.push(`เบอร์ ${details.size}`);
      if (details.quantity) parts.push(`จำนวน ${details.quantity} เต้า`);
      return parts.join(' ');
    } else {
      // เครื่องมืออื่นๆ: แสดงชื่อและจำนวน
      return `${gear.name} ${details.quantity ? `จำนวน ${details.quantity}` : ''}`;
    }
  };

  const handleSave = () => {

    Alert.alert(
      'ยืนยันการบันทึก',
      'คุณต้องการบันทึกข้อมูลการจับปลานี้หรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { 
          text: 'บันทึก', 
          onPress: () => {
            saveEntry();
            Alert.alert(
              'สำเร็จ',
              'บันทึกข้อมูลเรียบร้อยแล้ว',
              [{ text: 'ตกลง', onPress: () => navigation.navigate('HomeTab', { screen: 'Home' }) }]
            );
          }
        }
      ]
    );
  };

  return (
    <ScreenContainer
      header={<CurvedHeader eyebrow="ขั้นที่ 3 จาก 3" title="สรุปและยืนยันข้อมูล" />}
      contentContainerStyle={styles.content}
    >
      {/* Fish Photos */}
      {!currentEntry.noFishing && currentEntry.fishList.length > 0 && (
        <Panel title="รูปภาพปลาที่บันทึก">
          {currentEntry.fishList.some(fish => fish.photo) ? (
            <View style={styles.photosContainer}>
              {currentEntry.fishList.map((fish) =>
                fish.photo ? (
                  <View key={fish.id} style={styles.photoItem}>
                    <Image source={{ uri: fish.photo }} style={styles.fishPhoto} />
                    <Text variant="bodySmall" style={styles.photoCaption}>
                      {fish.name}
                    </Text>
                  </View>
                ) : null
              )}
            </View>
          ) : (
            <View style={styles.noPhotosContainer}>
              <Text variant="bodyMedium" style={styles.noPhotosText}>
                ไม่มีรูปภาพปลาที่บันทึก
              </Text>
            </View>
          )}
        </Panel>
      )}

      {/* Fisher Information */}
      <Panel title="ข้อมูลชาวประมง">
        <View style={styles.infoRow}>
          <Text variant="bodyMedium" style={styles.label}>ชื่อชาวประมง:</Text>
          <Text variant="bodyMedium" style={styles.fisherName}>
            {isResearcher && selectedFisher ? selectedFisher.name : user?.name || '-'}
          </Text>
        </View>
        {isResearcher && selectedFisher && (
          <>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>หมู่บ้าน:</Text>
              <Text variant="bodyMedium" style={styles.value}>{selectedFisher.village || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>ผู้บันทึกข้อมูล:</Text>
              <Text variant="bodyMedium" style={styles.researcherName}>
                (นักวิจัย)
              </Text>
            </View>
          </>
        )}
      </Panel>

      {/* General Information */}
      <Panel title="ข้อมูลทั่วไป">
        <View style={styles.infoRow}>
          <Text variant="bodyMedium" style={styles.label}>วันที่:</Text>
          <Text variant="bodyMedium" style={styles.value}>{formatDate(currentEntry.date)}</Text>
        </View>

        {currentEntry.noFishing ? (
          <View style={styles.noFishingContainer}>
            <Chip icon="information" mode="flat" style={styles.noFishingChip} textStyle={styles.noFishingText}>
              ไม่ได้จับปลาในวันนี้
            </Chip>
          </View>
        ) : (
          <>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>แหล่งน้ำ:</Text>
              <Text variant="bodyMedium" style={styles.value}>
                {currentEntry.waterSource || '-'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>สภาพอากาศ:</Text>
              <Text variant="bodyMedium" style={styles.value}>{currentEntry.weather || '-'}</Text>
            </View>

            {currentEntry.fishingGear && (
              <View style={styles.infoRow}>
                <Text variant="bodyMedium" style={styles.label}>เครื่องมือจับปลา:</Text>
                <Text variant="bodyMedium" style={styles.gearInlineItem}>
                  {getGearDisplayText(currentEntry.fishingGear)}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>ช่วงเวลาที่ออกจับ:</Text>
              <Text variant="bodyMedium" style={styles.value}>{formatTime(currentEntry.startTime)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>น้ำหนักปลาทั้งหมด:</Text>
              <Text variant="bodyMedium" style={styles.value}>{currentEntry.totalWeight || '-'} กก.</Text>
            </View>
          </>
        )}
      </Panel>

      {/* Fish List */}
      {!currentEntry.noFishing && currentEntry.fishList.length > 0 && (
        <Panel title={`รายการปลา (${currentEntry.fishList.length} ชนิด)`}>
          {/* Summary */}
          <View style={styles.summaryContainer}>
            <Text variant="bodyMedium" style={styles.summaryText}>
              จำนวนรวม: {getTotalCount()} ตัว
            </Text>
            <Text variant="bodyMedium" style={styles.summaryText}>
              น้ำหนักรวม: {getTotalWeight()} กก.
            </Text>
            <Text variant="bodyMedium" style={styles.summaryText}>
              มูลค่ารวม: {getTotalValue()} บาท
            </Text>
          </View>

          <Divider style={styles.divider} />

          {currentEntry.fishList.map((fish, index) => (
            <View key={fish.id} style={styles.fishItem}>
              <List.Item
                title={fish.name}
                description={`${fish.count} ตัว | ${fish.weight} กก. | ${fish.price} บาท`}
                left={() => <List.Icon icon="fish" color={colors.riverMid} />}
                titleStyle={styles.listItemTitle}
                descriptionStyle={styles.listItemDescription}
                style={styles.listItem}
              />

              {(fish.minLength !== '0' || fish.maxLength !== '0') && (
                <Text variant="bodySmall" style={styles.lengthInfo}>
                  ความยาว: {fish.minLength} - {fish.maxLength} ซม.
                </Text>
              )}

              {index < currentEntry.fishList.length - 1 && (
                <Divider style={styles.itemDivider} />
              )}
            </View>
          ))}
        </Panel>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.backButtonSeparate}
          textColor={colors.riverMid}
          icon="arrow-left"
        >
          ย้อนกลับ
        </Button>

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButtonSeparate}
          buttonColor={colors.riverDeep}
          icon="content-save"
        >
          ยืนยันการบันทึก
        </Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
    color: colors.inkSoft,
    flex: 1,
  },
  value: {
    color: colors.ink,
  },
  gearInlineItem: {
    color: colors.ink,
    flex: 2,
    textAlign: 'right',
  },
  noFishingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  noFishingChip: {
    backgroundColor: 'rgba(232,163,61,0.18)',
  },
  noFishingText: {
    color: colors.riverDeep,
  },
  summaryContainer: {
    backgroundColor: colors.tealWash,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  summaryText: {
    marginBottom: 4,
    fontWeight: '700',
    color: colors.riverDeep,
  },
  divider: {
    marginVertical: spacing.sm,
    backgroundColor: colors.hairline,
  },
  fishItem: {
    marginBottom: spacing.sm,
  },
  listItem: {
    paddingHorizontal: 0,
  },
  listItemTitle: {
    fontWeight: '800',
    color: colors.ink,
  },
  listItemDescription: {
    color: colors.inkSoft,
  },
  lengthInfo: {
    marginLeft: 56,
    color: colors.inkSoft,
    marginTop: -8,
    marginBottom: spacing.sm,
  },
  itemDivider: {
    marginTop: spacing.sm,
    backgroundColor: colors.hairline,
  },
  fisherName: {
    fontWeight: '800',
    color: colors.riverDeep,
  },
  researcherName: {
    fontWeight: '600',
    color: colors.riverMid,
  },
  buttonContainer: {
    flexDirection: 'column',
    marginTop: spacing.lg,
  },
  backButtonSeparate: {
    width: '100%',
    marginBottom: spacing.md,
    borderColor: colors.riverMid,
  },
  saveButtonSeparate: {
    width: '100%',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoItem: {
    width: '48%',
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  fishPhoto: {
    width: '100%',
    height: 120,
    borderRadius: radius.sm,
    marginBottom: 4,
  },
  photoCaption: {
    textAlign: 'center',
    color: colors.inkSoft,
    fontWeight: '600',
  },
  noPhotosContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  noPhotosText: {
    color: colors.inkSoft,
    fontStyle: 'italic',
  },
});