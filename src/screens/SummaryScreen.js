import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import {
  Button,
  Card,
  Text,
  List,
  Divider,
  Chip
} from 'react-native-paper';
import { useFishingData } from '../contexts/FishingDataContext';
import { useAuth } from '../contexts/AuthContext';


export default function SummaryScreen({ navigation }) {
  const { currentEntry, saveEntry, resetCurrentEntry, fisherInfo } = useFishingData();
  const { user, selectedFisher, isResearcher } = useAuth();

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

  const calculateTotalHours = () => {
    if (!currentEntry.startTime || !currentEntry.endTime) return '-';
    
    // ถ้าเป็น string-based time periods
    if (typeof currentEntry.startTime === 'string' && typeof currentEntry.endTime === 'string') {
      const timeMap = {
        'เช้า': 8,      // 6-10 โมง (กลางคือ 8 โมง)
        'กลางวัน': 14,  // 10-18 โมง (กลางคือ 14 โมง) 
        'เย็น': 20      // 18-22 โมง (กลางคือ 20 โมง)
      };
      
      const startHour = timeMap[currentEntry.startTime];
      const endHour = timeMap[currentEntry.endTime];
      
      if (startHour === undefined || endHour === undefined) return '-';
      
      // คำนวณจำนวนชั่วโมง
      let hours = endHour - startHour;
      
      // ถ้าเวลาสิ้นสุดน้อยกว่าเวลาเริ่ม แสดงว่าข้ามวัน
      if (hours <= 0) {
        hours = (24 - startHour) + endHour;
      }
      
      return hours.toString();
    }
    
    // ถ้าเป็น Date objects
    const startTime = new Date(currentEntry.startTime);
    const endTime = new Date(currentEntry.endTime);
    const diffInMs = endTime - startTime;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    return diffInHours.toFixed(1);
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
              [{ text: 'ตกลง', onPress: () => navigation.navigate('History') }]
            );
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Fish Photos */}
        {!currentEntry.noFishing && currentEntry.fishList.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                รูปภาพปลาที่บันทึก
              </Text>
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
            </Card.Content>
          </Card>
        )}

        {/* Fisher Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              ข้อมูลชาวประมง
            </Text>
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
                  <Text variant="bodyMedium">{selectedFisher.village || '-'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>ผู้บันทึกข้อมูล:</Text>
                  <Text variant="bodyMedium" style={styles.researcherName}>
                    {user?.name || '-'} (นักวิจัย)
                  </Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* General Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              ข้อมูลทั่วไป
            </Text>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>วันที่:</Text>
              <Text variant="bodyMedium">{formatDate(currentEntry.date)}</Text>
            </View>

            {currentEntry.noFishing ? (
              <View style={styles.noFishingContainer}>
                <Chip icon="information" mode="outlined" style={styles.noFishingChip}>
                  ไม่ได้จับปลาในวันนี้
                </Chip>
              </View>
            ) : (
              <>
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>แหล่งน้ำ:</Text>
                  <Text variant="bodyMedium">
                    {currentEntry.waterSource || '-'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>สภาพอากาศ:</Text>
                  <Text variant="bodyMedium">{currentEntry.weather || '-'}</Text>
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
                  <Text variant="bodyMedium" style={styles.label}>เวลาลงเครื่องมือ:</Text>
                  <Text variant="bodyMedium">{formatTime(currentEntry.startTime)}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>เวลากู้เครื่องมือ:</Text>
                  <Text variant="bodyMedium">{formatTime(currentEntry.endTime)}</Text>
                </View>
                
                {currentEntry.startTime && currentEntry.endTime && (
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.label}>ระยะเวลาทั้งหมด:</Text>
                    <Text variant="bodyMedium">{calculateTotalHours()} ชั่วโมง</Text>
                  </View>
                )}
                
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>น้ำหนักปลาทั้งหมด:</Text>
                  <Text variant="bodyMedium">{currentEntry.totalWeight || '-'} กก.</Text>
                </View>
                
                {currentEntry.sampleWeight && (
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.label}>น้ำหนักตัวอย่าง:</Text>
                    <Text variant="bodyMedium">{currentEntry.sampleWeight} กก.</Text>
                  </View>
                )}
              </>
            )}
          </Card.Content>
        </Card>

        {/* Fishing Gear */}
        {!currentEntry.noFishing && currentEntry.fishingGear.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                เครื่องมือที่ใช้
              </Text>
              {currentEntry.fishingGear.map((gear, index) => (
                <View key={index} style={styles.gearItem}>
                  <Text variant="bodyMedium" style={styles.gearName}>
                    {gear.name}
                  </Text>
                  <View style={styles.gearDetails}>
                    <Text variant="bodySmall" style={styles.gearDetailText}>
                      จำนวน: {gear.quantity} {gear.name.includes('มอง') ? 'ผืน' : 'เต้า/ชิ้น'}
                    </Text>
                    {gear.size && (
                      <Text variant="bodySmall" style={styles.gearDetailText}>
                        ขนาด: {gear.size}
                      </Text>
                    )}
                    {gear.custom && (
                      <Text variant="bodySmall" style={styles.gearDetailText}>
                        รายละเอียดเพิ่มเติม: {gear.custom}
                      </Text>
                    )}
                  </View>
                  {index < currentEntry.fishingGear.length - 1 && (
                    <Divider style={styles.gearDivider} />
                  )}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Fish List */}
        {!currentEntry.noFishing && currentEntry.fishList.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                รายการปลา ({currentEntry.fishList.length} ชนิด)
              </Text>
              
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
                    left={() => <List.Icon icon="fish" />}
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
            </Card.Content>
          </Card>
        )}


        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.backButtonSeparate}
            icon="arrow-left"
          >
            ย้อนกลับ
          </Button>
          
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButtonSeparate}
            icon="content-save"
          >
            ยืนยันการบันทึก
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  label: {
    fontWeight: '500',
    flex: 1,
  },
  gearInlineItem: {
    color: '#333',
    flex: 2,
  },
  noFishingContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  noFishingChip: {
    backgroundColor: '#ffeb3b',
  },
  gearItem: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  gearName: {
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  gearDetails: {
    paddingLeft: 12,
  },
  gearDetailText: {
    color: '#666',
    marginBottom: 2,
  },
  gearDivider: {
    marginTop: 8,
    marginBottom: 4,
  },
  summaryContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  summaryText: {
    marginBottom: 4,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 8,
  },
  fishItem: {
    marginBottom: 8,
  },
  listItem: {
    paddingHorizontal: 0,
  },
  lengthInfo: {
    marginLeft: 56,
    color: '#666',
    marginTop: -8,
    marginBottom: 8,
  },
  itemDivider: {
    marginTop: 8,
  },
  fisherName: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  researcherName: {
    fontWeight: '500',
    color: '#4caf50',
  },
  buttonContainer: {
    flexDirection: 'column',
    marginTop: 16,
    marginBottom: 32,
  },
  backButtonSeparate: {
    width: '100%',
    marginBottom: 12,
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
    marginBottom: 12,
    alignItems: 'center',
  },
  fishPhoto: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 4,
  },
  photoCaption: {
    textAlign: 'center',
    color: '#666',
    fontWeight: '500',
  },
  noPhotosContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noPhotosText: {
    color: '#666',
    fontStyle: 'italic',
  },
});