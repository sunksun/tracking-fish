import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import {
  Button,
  Card,
  Text,
  TextInput,
  List,
  IconButton,
  Divider
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useFishingData } from '../contexts/FishingDataContext';

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
  };

  const handleSelectFishSpecies = () => {
    navigation.navigate('SelectFishSpecies');
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
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
      >
        <View style={styles.content}>
          {/* Add Fish Form */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                เพิ่มรายการปลา
              </Text>

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
                      textColor="#f44336"
                    >
                      ลบรูป
                    </Button>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.photoPlaceholder} onPress={showImagePicker}>
                  <IconButton icon="camera-plus" size={48} iconColor="#2196F3" />
                  <Text variant="bodyMedium" style={styles.photoPlaceholderText}>
                    แตะเพื่อถ่ายรูปปลา
                  </Text>
                </TouchableOpacity>
              )}

              <Button
                mode="contained"
                onPress={handleAddFish}
                style={styles.addButton}
                icon="plus"
              >
                เพิ่มปลาชนิดนี้
              </Button>
            </Card.Content>
          </Card>

          {/* Fish List */}
          {currentEntry.fishList.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  รายการปลาที่บันทึกแล้ว ({currentEntry.fishList.length} ชนิด)
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
                      right={() => (
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => handleRemoveFish(index)}
                          iconColor="#f44336"
                        />
                      )}
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

          {/* Empty State */}
          {currentEntry.fishList.length === 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.emptyState}>
                  <Text variant="bodyLarge" style={styles.emptyStateText}>
                    ยังไม่มีรายการปลา
                  </Text>
                  <Text variant="bodyMedium" style={styles.emptyStateSubtext}>
                    กรอกข้อมูลปลาด้านบนแล้วกด "เพิ่มปลาชนิดนี้"
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Continue Button */}
          <Button
            mode="contained"
            icon="arrow-right"
            onPress={handleContinue}
            style={styles.continueButton}
            contentStyle={styles.continueButtonContent}
          >
            ไปหน้าสรุป
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  selectedFishInfo: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedFishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedFishTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  selectedFishLabel: {
    color: '#666',
    marginBottom: 4,
  },
  selectedFishName: {
    fontWeight: 'bold',
    color: '#1976d2',
  },
  localNameLabel: {
    color: '#666',
    marginTop: 8,
    marginBottom: 2,
    fontSize: 12,
  },
  localNameText: {
    color: '#333',
    fontStyle: 'italic',
  },
  changeButton: {
    borderColor: '#2196F3',
  },
  noFishSelected: {
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  noFishText: {
    color: '#e65100',
    textAlign: 'center',
    marginBottom: 12,
  },
  selectFishButton: {
    backgroundColor: '#2196F3',
  },
  input: {
    marginBottom: 12,
  },
  requiredNote: {
    color: '#f44336',
    marginBottom: 8,
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
    marginBottom: 8,
    marginTop: 4,
    fontWeight: '500',
  },
  addButton: {
    marginTop: 8,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    color: '#999',
    textAlign: 'center',
  },
  continueButton: {
    marginTop: 24,
    marginBottom: 32,
    backgroundColor: '#2196F3',
  },
  continueButtonContent: {
    paddingVertical: 8,
  },
  photoTitle: {
    marginBottom: 8,
    marginTop: 4,
    fontWeight: '500',
  },
  photoContainer: {
    marginBottom: 16,
  },
  fishPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
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
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  photoPlaceholderText: {
    color: '#666',
    marginTop: 8,
  },
});