import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import {
  Button,
  Text,
  TextInput,
  List,
  IconButton,
  Divider
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useFishingData } from '../contexts/FishingDataContext';
import ScreenContainer from '../components/ScreenContainer';
import CurvedHeader from '../components/CurvedHeader';
import Panel from '../components/Panel';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing, radius } from '../theme';

export default function AddFishScreen({ navigation, route }) {
  const { currentEntry, addFish, removeFish } = useFishingData();

  const [fishForm, setFishForm] = useState({
    name: '',
    commonName: '',
    localName: '',
    count: '',
    weight: '',
    minLength: '',
    maxLength: '',
    price: '',
    photo: null
  });

  const [unknownFish, setUnknownFish] = useState(false);

  // รับข้อมูลปลาที่เลือกจากหน้า SelectFishSpecies
  useEffect(() => {
    if (route.params?.selectedFish) {
      const fish = route.params.selectedFish;
      setFishForm(prev => ({
        ...prev,
        name: fish.common_name_thai || fish.thai_name || fish.scientific_name,
        commonName: fish.common_name_thai || fish.thai_name || fish.scientific_name,
        localName: fish.local_name || fish.common_name_thai || fish.thai_name
      }));
      // ล้าง params หลังจากใช้แล้ว
      navigation.setParams({ selectedFish: undefined });
    }
  }, [route.params?.selectedFish, navigation]);

  const resetForm = () => {
    setFishForm({
      name: '',
      commonName: '',
      localName: '',
      count: '',
      weight: '',
      minLength: '',
      maxLength: '',
      price: '',
      photo: null
    });
    setUnknownFish(false);
  };

  const handleUnknownFishChange = (value) => {
    setUnknownFish(value === 'unknown');
    if (value === 'unknown') {
      setFishForm(prev => ({
        ...prev,
        name: 'ไม่ทราบชื่อปลา',
        commonName: 'ไม่ทราบชื่อปลา',
        localName: 'ไม่ทราบชื่อปลา'
      }));
    } else {
      setFishForm(prev => ({
        ...prev,
        name: '',
        commonName: '',
        localName: ''
      }));
    }
  };

  const handleSelectFishSpecies = () => {
    navigation.navigate('SelectFishSpecies', { mode: 'picker' });
  };

  const validateForm = () => {
    if (!fishForm.name.trim()) {
      Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกชื่อปลา');
      return false;
    }
    
    if (!fishForm.count.trim() && !fishForm.weight.trim()) {
      Alert.alert('กรุณากรอกข้อมูล', 'กรุณากรอกจำนวนหรือน้ำหนัก');
      return false;
    }

    return true;
  };

  const handleAddFish = () => {
    if (!validateForm()) return;

    const fishData = {
      id: Date.now().toString(),
      ...fishForm,
      count: fishForm.count || '0',
      weight: fishForm.weight || '0',
      minLength: fishForm.minLength || '0',
      maxLength: fishForm.maxLength || '0',
      price: fishForm.price || '0'
    };

    addFish(fishData);
    resetForm();
    Alert.alert('สำเร็จ', 'เพิ่มรายการปลาเรียบร้อยแล้ว');
  };

  const handleRemoveFish = (index) => {
    Alert.alert(
      'ยืนยันการลบ',
      'คุณต้องการลบรายการปลานี้หรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ลบ', style: 'destructive', onPress: () => removeFish(index) }
      ]
    );
  };

  const compressImage = async (imageUri) => {
    try {
      console.log('🔧 Starting image compression...');
      console.log('📏 Original URI:', imageUri);

      // Resize and compress image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 1024 } } // Resize to max width 1024px, height auto
        ],
        {
          compress: 0.6, // 60% quality
          format: ImageManipulator.SaveFormat.JPEG
        }
      );

      console.log('✅ Image compressed successfully');
      console.log('📐 New URI:', manipulatedImage.uri);
      console.log('📏 New dimensions:', manipulatedImage.width, 'x', manipulatedImage.height);

      return manipulatedImage.uri;
    } catch (error) {
      console.error('❌ Error compressing image:', error);
      // Return original URI if compression fails
      return imageUri;
    }
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('ขออนุญาต', 'จำเป็นต้องอนุญาตการเข้าถึงกล้องเพื่อถ่ายรูป');
      return false;
    }
    return true;
  };

  const takePicture = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      console.log('Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('Original photo URI:', result.assets[0].uri);

        // Compress the image before setting
        const compressedUri = await compressImage(result.assets[0].uri);
        console.log('Setting compressed photo URI:', compressedUri);

        setFishForm({ ...fishForm, photo: compressedUri });
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('เกิดข้อผิดพลาด', `ไม่สามารถถ่ายรูปได้: ${error.message}`);
    }
  };

  const pickImage = async () => {
    try {
      console.log('Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('Library result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('Original photo URI:', result.assets[0].uri);

        // Compress the image before setting
        const compressedUri = await compressImage(result.assets[0].uri);
        console.log('Setting compressed photo URI:', compressedUri);

        setFishForm({ ...fishForm, photo: compressedUri });
      }
    } catch (error) {
      console.error('Library error:', error);
      Alert.alert('เกิดข้อผิดพลาด', `ไม่สามารถเลือกรูปได้: ${error.message}`);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'เลือกรูปภาพ',
      'ต้องการถ่ายรูปใหม่หรือเลือกจากแกลเลอรี่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ถ่ายรูป', onPress: takePicture },
        { text: 'เลือกจากแกลเลอรี่', onPress: pickImage }
      ]
    );
  };

  const removePhoto = () => {
    setFishForm({ ...fishForm, photo: null });
  };

  const getTotalCount = () => {
    if (!currentEntry?.fishList || !Array.isArray(currentEntry.fishList)) return 0;
    return currentEntry.fishList.reduce((total, fish) => total + (parseInt(fish.count, 10) || 0), 0);
  };

  const getTotalWeight = () => {
    if (!currentEntry?.fishList || !Array.isArray(currentEntry.fishList)) return '0.00';
    return currentEntry.fishList.reduce((total, fish) => total + (parseFloat(fish.weight) || 0), 0).toFixed(2);
  };

  const getTotalValue = () => {
    if (!currentEntry?.fishList || !Array.isArray(currentEntry.fishList)) return '0.00';
    return currentEntry.fishList.reduce((total, fish) => total + (parseFloat(fish.price) || 0), 0).toFixed(2);
  };

  const handleContinue = () => {
    if (currentEntry.fishList.length === 0) {
      Alert.alert(
        'ยืนยัน',
        'คุณยังไม่ได้เพิ่มรายการปลา ต้องการดำเนินการต่อหรือไม่?',
        [
          { text: 'ยกเลิก', style: 'cancel' },
          { text: 'ดำเนินการต่อ', onPress: () => navigation.navigate('Summary') }
        ]
      );
    } else {
      navigation.navigate('Summary');
    }
  };

  return (
    <ScreenContainer
      header={<CurvedHeader eyebrow="ขั้นที่ 2 จาก 3" title="เพิ่มรายการปลา" />}
      contentContainerStyle={styles.content}
    >
      {/* Add Fish Form */}
      <Panel title="เพิ่มรายการปลา">
        {/* Select Fish Species Button */}
              {fishForm.commonName ? (
                <View style={styles.selectedFishInfo}>
                  <View style={styles.selectedFishRow}>
                    <View style={styles.selectedFishTextContainer}>
                      <Text variant="titleMedium" style={styles.selectedFishName}>
                        {fishForm.commonName}
                      </Text>
                      {fishForm.localName && fishForm.localName !== fishForm.commonName && (
                        <>
                          <Text variant="bodySmall" style={styles.localNameLabel}>
                            ชื่อท้องถิ่น:
                          </Text>
                          <Text variant="bodyMedium" style={styles.localNameText}>
                            {fishForm.localName}
                          </Text>
                        </>
                      )}
                    </View>
                    <Button
                      mode="outlined"
                      onPress={handleSelectFishSpecies}
                      compact
                      icon="pencil"
                      style={styles.changeButton}
                    >
                      เปลี่ยน
                    </Button>
                  </View>
                </View>
              ) : (
                <View style={styles.noFishSelected}>
                  <Text variant="bodyMedium" style={styles.noFishText}>
                    กรุณาเลือกชนิดปลา
                  </Text>
                  <Button
                    mode="contained"
                    onPress={handleSelectFishSpecies}
                    style={styles.selectFishButton}
                    icon="fish"
                  >
                    เลือกชนิดปลา
                  </Button>
                </View>
              )}

              {/* ปุ่ม: ไม่ทราบชื่อปลา */}
              <View style={styles.unknownFishContainer}>
                <Button
                  mode={unknownFish ? "contained" : "outlined"}
                  onPress={() => handleUnknownFishChange(unknownFish ? 'known' : 'unknown')}
                  style={[
                    styles.unknownFishButton,
                    unknownFish && styles.unknownFishButtonActive
                  ]}
                  icon={unknownFish ? "check-circle" : "help-circle"}
                  labelStyle={styles.unknownFishButtonLabel}
                >
                  ไม่ทราบชื่อปลา
                </Button>
              </View>

              <Text variant="bodySmall" style={styles.requiredNote}>
                * กรุณากรอกจำนวนหรือน้ำหนักอย่างน้อย 1 ช่อง
              </Text>
              <View style={styles.row}>
                <TextInput
                  label={<Text>จำนวน (ตัว) <Text style={{ color: 'red' }}>*</Text></Text>}
                  value={fishForm.count}
                  onChangeText={(value) => setFishForm({ ...fishForm, count: value })}
                  keyboardType="numeric"
                  mode="outlined"
                  style={[styles.input, styles.halfWidth]}
                />
                <TextInput
                  label={<Text>น้ำหนัก (กก.) <Text style={{ color: 'red' }}>*</Text></Text>}
                  value={fishForm.weight}
                  onChangeText={(value) => setFishForm({ ...fishForm, weight: value })}
                  keyboardType="numeric"
                  mode="outlined"
                  style={[styles.input, styles.halfWidth]}
                />
              </View>

              <Text variant="bodyMedium" style={styles.lengthTitle}>
                ความยาว (ซม.)
              </Text>
              <View style={styles.row}>
                <TextInput
                  label="น้อยสุด"
                  value={fishForm.minLength}
                  onChangeText={(value) => setFishForm({ ...fishForm, minLength: value })}
                  keyboardType="numeric"
                  mode="outlined"
                  style={[styles.input, styles.halfWidth]}
                />
                <TextInput
                  label="มากสุด"
                  value={fishForm.maxLength}
                  onChangeText={(value) => setFishForm({ ...fishForm, maxLength: value })}
                  keyboardType="numeric"
                  mode="outlined"
                  style={[styles.input, styles.halfWidth]}
                />
              </View>

              <TextInput
                label="ราคาขาย (บาท)"
                value={fishForm.price}
                onChangeText={(value) => setFishForm({ ...fishForm, price: value })}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />

              {/* Photo Section */}
              <Text variant="bodyMedium" style={styles.photoTitle}>
                รูปภาพปลา
              </Text>
              
              {fishForm.photo ? (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: fishForm.photo }} style={styles.fishPhoto} />
                  <View style={styles.photoActions}>
                    <Button
                      mode="outlined"
                      onPress={showImagePicker}
                      style={styles.photoButton}
                      icon="camera"
                    >
                      เปลี่ยนรูป
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={removePhoto}
                      style={styles.photoButton}
                      icon="delete"
                      textColor={colors.clay}
                    >
                      ลบรูป
                    </Button>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.photoPlaceholder} onPress={showImagePicker}>
                  <IconButton icon="camera-plus" size={48} iconColor={colors.riverMid} />
                  <Text variant="bodyMedium" style={styles.photoPlaceholderText}>
                    แตะเพื่อถ่ายรูปปลา
                  </Text>
                </TouchableOpacity>
              )}

        <Button
          mode="contained"
          onPress={handleAddFish}
          style={styles.addButton}
          buttonColor={colors.riverMid}
          icon="plus"
        >
          เพิ่มปลาชนิดนี้
        </Button>
      </Panel>

      {/* Fish List */}
      {currentEntry.fishList.length > 0 && (
        <Panel title={`รายการปลาที่บันทึกแล้ว (${currentEntry.fishList.length} ชนิด)`}>
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
                right={() => (
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => handleRemoveFish(index)}
                    iconColor={colors.clay}
                  />
                )}
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

      {/* Empty State */}
      {currentEntry.fishList.length === 0 && (
        <Panel>
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={styles.emptyStateText}>
              ยังไม่มีรายการปลา
            </Text>
            <Text variant="bodyMedium" style={styles.emptyStateSubtext}>
              กรอกข้อมูลปลาด้านบนแล้วกด "เพิ่มปลาชนิดนี้"
            </Text>
          </View>
        </Panel>
      )}

      {/* Continue Button */}
      <PrimaryButton
        variant="simple"
        title="ไปหน้าสรุป"
        icon="arrow-right"
        onPress={handleContinue}
        style={styles.continueSpacing}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  selectedFishInfo: {
    backgroundColor: colors.tealWash,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  selectedFishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedFishTextContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  selectedFishName: {
    fontWeight: '800',
    color: colors.riverDeep,
  },
  localNameLabel: {
    color: colors.inkSoft,
    marginTop: spacing.sm,
    marginBottom: 2,
    fontSize: 12,
  },
  localNameText: {
    color: colors.ink,
    fontStyle: 'italic',
  },
  changeButton: {
    borderColor: colors.riverMid,
  },
  noFishSelected: {
    backgroundColor: 'rgba(232,163,61,0.14)',
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  noFishText: {
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  selectFishButton: {
    backgroundColor: colors.riverDeep,
  },
  unknownFishContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  unknownFishButton: {
    borderColor: colors.gold,
    minWidth: 200,
  },
  unknownFishButtonActive: {
    backgroundColor: colors.gold,
  },
  unknownFishButtonLabel: {
    fontSize: 16,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  requiredNote: {
    color: colors.clay,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  lengthTitle: {
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    fontWeight: '600',
    color: colors.ink,
  },
  addButton: {
    marginTop: spacing.sm,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateText: {
    color: colors.ink,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    color: colors.inkSoft,
    textAlign: 'center',
  },
  continueSpacing: {
    marginTop: spacing.xxl,
  },
  photoTitle: {
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    fontWeight: '600',
    color: colors.ink,
  },
  photoContainer: {
    marginBottom: spacing.lg,
  },
  fishPhoto: {
    width: '100%',
    height: 200,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  photoButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  photoPlaceholder: {
    height: 120,
    borderWidth: 2,
    borderColor: colors.hairline,
    borderStyle: 'dashed',
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colors.sand,
  },
  photoPlaceholderText: {
    color: colors.inkSoft,
    marginTop: spacing.sm,
  },
});