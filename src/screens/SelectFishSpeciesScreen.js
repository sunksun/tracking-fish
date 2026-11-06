import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Alert, Modal, TouchableOpacity, Image, Dimensions } from 'react-native';
import {
  Button,
  Text,
  Card,
  Searchbar,
  ActivityIndicator,
  List,
  Divider,
  Avatar,
  IconButton
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseService } from '../services/FirebaseService';
import { AIService } from '../services/AIService';
import { isAIConfigured } from '../config/ai';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SelectFishSpeciesScreen({ navigation }) {
  const [allFishSpecies, setAllFishSpecies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFish, setSelectedFish] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [selectedImageName, setSelectedImageName] = useState('');

  // --- AI ช่วยแนะนำชนิดปลา (เฟส 2) ---
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiResult, setAiResult] = useState(null); // { predictions, belowThreshold, matches: [{prediction, species}] }
  const [aiPhotoUri, setAiPhotoUri] = useState(null);

  useEffect(() => {
    loadFishSpecies();
  }, []);

  // ใช้ useMemo แทน useEffect เพื่อกรองรายการ - ไม่ต้องมี state แยก
  const filteredFishSpecies = useMemo(() => {
    if (searchQuery.trim() === '') {
      return allFishSpecies;
    }
    const searchLower = searchQuery.toLowerCase();
    return allFishSpecies.filter((fish) => {
      return (
        fish.thai_name?.toLowerCase().includes(searchLower) ||
        fish.local_name?.toLowerCase().includes(searchLower) ||
        fish.scientific_name?.toLowerCase().includes(searchLower) ||
        fish.common_name_thai?.toLowerCase().includes(searchLower)
      );
    });
  }, [searchQuery, allFishSpecies]);

  const loadFishSpecies = async () => {
    try {
      setLoading(true);

      // 1. ลองอ่านจาก AsyncStorage cache ก่อน
      const cachedData = await AsyncStorage.getItem('fish_species_cache');
      const cacheTime = await AsyncStorage.getItem('fish_species_cache_time');

      const now = Date.now();
      const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 วัน

      // 2. ถ้ามี cache และยังไม่หมดอายุ ใช้ cache
      if (cachedData && cacheTime) {
        const timeSinceCache = now - parseInt(cacheTime);

        if (timeSinceCache < CACHE_DURATION) {
          if (__DEV__) {
            const daysOld = Math.floor(timeSinceCache / (24 * 60 * 60 * 1000));
            console.log(`✅ Using cached fish species (${daysOld} days old, expires in ${7 - daysOld} days)`);
          }

          const species = JSON.parse(cachedData);
          setAllFishSpecies(species);
          setLoading(false);
          return;
        } else {
          if (__DEV__) console.log('⚠️ Cache expired, fetching from Firebase...');
        }
      } else {
        if (__DEV__) console.log('⚠️ No cache found, fetching from Firebase...');
      }

      // 3. ถ้าไม่มี cache หรือหมดอายุ → ดึงจาก Firebase
      if (__DEV__) console.log('🔄 Starting to load fish species from Firebase...');
      const result = await FirebaseService.getAllFishSpecies();

      if (result.success) {
        if (__DEV__) {
          console.log('✅ Loaded fish species from Firebase:', result.species.length);
        }

        // 4. บันทึกลง AsyncStorage cache
        try {
          await AsyncStorage.setItem('fish_species_cache', JSON.stringify(result.species));
          await AsyncStorage.setItem('fish_species_cache_time', now.toString());
          if (__DEV__) console.log('💾 Cached fish species data for 7 days');
        } catch (cacheError) {
          if (__DEV__) console.error('⚠️ Failed to cache data:', cacheError);
        }

        setAllFishSpecies(result.species);
      } else {
        console.error('❌ Failed to load:', result.error);
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลชนิดปลาได้: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error loading fish species:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลชนิดปลาได้: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFish = useCallback((fish) => {
    setSelectedFish(fish);
    navigation.navigate('AddFish', {
      selectedFish: fish,
      selectedFishCommonName: fish.common_name_thai || fish.thai_name || fish.scientific_name,
      selectedFishLocalName: fish.local_name || fish.common_name_thai || fish.thai_name
    });
  }, [navigation]);

  // รันจำแนกด้วย AI จาก uri รูป → แมปกับรายการ species ที่โหลดมา
  const runAIClassify = useCallback(async (uri) => {
    setAiPhotoUri(uri);
    setAiError('');
    setAiResult(null);
    setAiLoading(true);
    setAiModalVisible(true);
    try {
      const res = await AIService.classify(uri);
      if (!res.ok) {
        setAiError(res.error || 'จำแนกไม่สำเร็จ');
        return;
      }
      // จับคู่ทุก prediction กับ species ในรายการ (ใช้ scientific_name)
      const matches = res.predictions.map((p) => ({
        prediction: p,
        species: AIService.matchSpecies(p, allFishSpecies),
      }));
      setAiResult({ ...res, matches });
    } catch (e) {
      setAiError('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setAiLoading(false);
    }
  }, [allFishSpecies]);

  // เปิดกล้อง/คลังรูปเพื่อให้ AI ช่วยแนะนำ
  const handleAIPhoto = useCallback(async (source) => {
    try {
      let result;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('ต้องการสิทธิ์กล้อง', 'เปิดสิทธิ์กล้องในการตั้งค่าเพื่อถ่ายรูปปลา');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
          Alert.alert('ต้องการสิทธิ์คลังรูป', 'เปิดสิทธิ์คลังรูปเพื่อเลือกรูปปลา');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
      }
      if (!result.canceled && result.assets?.[0]?.uri) {
        runAIClassify(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('เปิดรูปไม่สำเร็จ', e.message);
    }
  }, [runAIClassify]);

  // เริ่มขั้นตอน AI — ถ้ายังไม่ตั้งค่า URL ก็เตือน, ถ้าพร้อมก็ให้เลือกถ่าย/จากคลัง
  const startAIFlow = useCallback(() => {
    if (!isAIConfigured()) {
      Alert.alert(
        'ยังไม่ได้ตั้งค่า AI',
        'ต้องตั้งค่า AI_API_URL ในไฟล์ .env ให้ชี้ไปที่เครื่องที่รันเซิร์ฟเวอร์วิเคราะห์ภาพก่อน'
      );
      return;
    }
    Alert.alert('ให้ AI ช่วยแนะนำชนิดปลา', 'เลือกรูปปลาที่จับได้', [
      { text: 'ถ่ายรูป', onPress: () => handleAIPhoto('camera') },
      { text: 'เลือกจากคลังรูป', onPress: () => handleAIPhoto('library') },
      { text: 'ยกเลิก', style: 'cancel' },
    ]);
  }, [handleAIPhoto]);

  // เลือกชนิดจากผล AI → ปิด modal แล้วใช้ flow เดิม
  const handleSelectFromAI = useCallback((species) => {
    setAiModalVisible(false);
    handleSelectFish(species);
  }, [handleSelectFish]);

  const getFishDescription = useCallback((fish) => {
    if (fish.local_name && fish.thai_name !== fish.local_name) {
      return `ชื่อท้องถิ่น: ${fish.local_name}`;
    }
    return '';
  }, []);

  // render แต่ละ item - ใช้ useCallback เพื่อไม่ให้สร้าง function ใหม่ทุกครั้ง
  const renderFishItem = useCallback(({ item: fish }) => {
    const isSelected = selectedFish?.id === fish.id;
    const imageUrl = fish.image_url || fish.imageUrl;

    return (
      <View>
        <List.Item
          title={fish.thai_name || fish.local_name || fish.common_name_thai || 'ไม่ระบุชื่อ'}
          description={getFishDescription(fish)}
          left={(props) => (
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => {
                if (imageUrl) {
                  setSelectedImageUrl(imageUrl);
                  setSelectedImageName(fish.thai_name || fish.local_name || fish.common_name_thai || 'ไม่ระบุชื่อ');
                  setImageModalVisible(true);
                }
              }}
              disabled={!imageUrl}
            >
              {imageUrl ? (
                <Avatar.Image
                  {...props}
                  size={50}
                  source={{ uri: imageUrl }}
                  style={styles.fishAvatar}
                />
              ) : (
                <Avatar.Icon
                  {...props}
                  size={50}
                  icon="fish"
                  style={styles.fishAvatarIcon}
                />
              )}
            </TouchableOpacity>
          )}
          right={(props) => (
            <Button
              {...props}
              mode={isSelected ? 'contained' : 'outlined'}
              onPress={() => handleSelectFish(fish)}
              compact
            >
              {isSelected ? 'เลือกแล้ว' : 'เลือก'}
            </Button>
          )}
          style={[styles.listItem, isSelected && styles.selectedListItem]}
          titleStyle={styles.listItemTitle}
          descriptionStyle={styles.listItemDescription}
          descriptionNumberOfLines={2}
        />
        <Divider />
      </View>
    );
  }, [selectedFish, getFishDescription, handleSelectFish]);

  const keyExtractor = useCallback((item) => item.id, []);


  const ListEmptyComponent = useMemo(() => (
    <Card style={styles.emptyCard}>
      <Card.Content>
        <View style={styles.emptyState}>
          <Text variant="titleMedium" style={styles.emptyTitle}>
            ไม่พบชนิดปลาที่ค้นหา
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            ลองค้นหาด้วยคำอื่น
          </Text>
        </View>
      </Card.Content>
    </Card>
  ), []);

  const ListFooterComponent = useMemo(() => (
    <View style={styles.buttonContainer}>
      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        icon="arrow-left"
      >
        กลับ
      </Button>
    </View>
  ), [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูลชนิดปลา...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredFishSpecies}
        keyExtractor={keyExtractor}
        renderItem={renderFishItem}
        ListHeaderComponent={
          <View>
            {/* Header Card */}
            <Card style={styles.headerCard}>
              <Card.Content>
                <View style={styles.headerTitleRow}>
                  <Text variant="titleMedium" style={styles.headerTitle}>
                    เลือกชนิดปลา
                  </Text>
                  <Button
                    mode="text"
                    compact
                    onPress={async () => {
                      try {
                        console.log('🗑️ Clearing fish species cache...');
                        await AsyncStorage.removeItem('fish_species_cache');
                        await AsyncStorage.removeItem('fish_species_cache_time');
                        console.log('✅ Cache cleared, loading fresh data...');
                        loadFishSpecies();
                        Alert.alert('สำเร็จ', 'กำลังโหลดข้อมูลใหม่จาก Firebase...');
                      } catch (error) {
                        console.error('❌ Error clearing cache:', error);
                        Alert.alert('ข้อผิดพลาด', 'ไม่สามารถล้างข้อมูลได้: ' + error.message);
                      }
                    }}
                    style={styles.refreshButton}
                  >
                    รีเฟรช
                  </Button>
                </View>
                <Text variant="bodyMedium" style={styles.headerSubtitle}>
                  ค้นหาและเลือกชนิดปลาที่ต้องการบันทึก
                </Text>
                <Button
                  mode="contained"
                  icon="camera"
                  onPress={startAIFlow}
                  style={styles.aiButton}
                  contentStyle={styles.aiButtonContent}
                >
                  ถ่ายรูปให้ AI ช่วยแนะนำ
                </Button>
              </Card.Content>
            </Card>

            {/* Search Bar */}
            <Searchbar
              placeholder="ค้นหาชื่อปลา (ภาษาไทย, ท้องถิ่น, หรือวิทยาศาสตร์)"
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
            />

            {/* Result count */}
            {filteredFishSpecies.length > 0 && (
              <Text variant="bodySmall" style={styles.resultCount}>
                {searchQuery ? `พบ ${filteredFishSpecies.length} รายการ` : `ทั้งหมด ${filteredFishSpecies.length} ชนิด`}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        getItemLayout={(_data, index) => ({
          length: 74,
          offset: 74 * index,
          index,
        })}
        style={styles.listContainer}
      />

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setImageModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text variant="titleMedium" style={styles.modalTitle}>
                  {selectedImageName}
                </Text>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => setImageModalVisible(false)}
                  style={styles.closeButton}
                />
              </View>

              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <Image
                  source={{ uri: selectedImageUrl }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <Button
                mode="contained"
                onPress={() => setImageModalVisible(false)}
                style={styles.closeModalButton}
              >
                ปิด
              </Button>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* AI Result Modal */}
      <Modal
        visible={aiModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAiModalVisible(false)}
      >
        <View style={styles.aiModalContainer}>
          <View style={styles.aiModalCard}>
            <View style={styles.aiModalHeader}>
              <Text variant="titleLarge" style={styles.aiModalTitle}>
                ผลการแนะนำจาก AI
              </Text>
              <IconButton icon="close" size={24} onPress={() => setAiModalVisible(false)} style={styles.closeButton} />
            </View>

            {aiPhotoUri && (
              <Image source={{ uri: aiPhotoUri }} style={styles.aiPhoto} resizeMode="cover" />
            )}

            {aiLoading && (
              <View style={styles.aiCenter}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.aiLoadingText}>กำลังวิเคราะห์รูปปลา...</Text>
              </View>
            )}

            {!aiLoading && aiError !== '' && (
              <View style={styles.aiCenter}>
                <Text style={styles.aiErrorTitle}>วิเคราะห์ไม่สำเร็จ</Text>
                <Text style={styles.aiErrorText}>{aiError}</Text>
                <Button mode="outlined" onPress={() => aiPhotoUri && runAIClassify(aiPhotoUri)} style={styles.aiRetry} icon="refresh">
                  ลองอีกครั้ง
                </Button>
              </View>
            )}

            {!aiLoading && aiError === '' && aiResult && (
              <>
                {aiResult.belowThreshold && (
                  <View style={styles.aiWarnBanner}>
                    <Text style={styles.aiWarnText}>
                      ยังไม่แน่ใจ — โปรดตรวจสอบและเลือกชนิดเอง
                    </Text>
                  </View>
                )}
                <FlatList
                  data={aiResult.matches}
                  keyExtractor={(m, i) => `${m.prediction.modelIndex}-${i}`}
                  style={styles.aiList}
                  renderItem={({ item, index }) => {
                    const p = item.prediction;
                    const matched = item.species;
                    const isTop = index === 0;
                    const strong = p.confidence >= aiResult.threshold;
                    // top-1 ที่ผ่านเกณฑ์ = พระเอก; ตัวอื่นเป็นทางเลือก
                    const barColor = strong ? '#2e7d32' : '#ef6c00';
                    return (
                      <View style={[styles.aiRow, isTop && strong && styles.aiRowTop]}>
                        <View style={styles.aiRowText}>
                          <Text style={[styles.aiName, isTop && styles.aiNameTop]}>
                            {p.commonNameThai || matched?.thai_name || p.scientificName || 'ไม่ทราบชนิด'}
                          </Text>
                          {!!p.localName && <Text style={styles.aiLocal}>ท้องถิ่น: {p.localName}</Text>}
                          {!!p.scientificName && <Text style={styles.aiSci}>{p.scientificName}</Text>}
                          <View style={styles.aiBarTrack}>
                            <View style={[styles.aiBarFill, { width: `${Math.min(100, p.confidencePercent)}%`, backgroundColor: barColor }]} />
                          </View>
                          <Text style={[styles.aiPct, { color: barColor }]}>{p.confidencePercent}%</Text>
                        </View>
                        {matched ? (
                          <Button
                            mode={isTop && strong ? 'contained' : 'outlined'}
                            compact
                            onPress={() => handleSelectFromAI(matched)}
                            style={styles.aiPick}
                          >
                            เลือก
                          </Button>
                        ) : (
                          <Text style={styles.aiNoMatch}>ไม่มีในรายการ</Text>
                        )}
                      </View>
                    );
                  }}
                />
                <Button mode="text" onPress={() => setAiModalVisible(false)} style={styles.aiManual}>
                  ไม่ใช่ทั้งหมดนี้ — เลือกเอง
                </Button>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  headerCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#2196F3',
    flex: 1,
  },
  refreshButton: {
    marginRight: -8,
  },
  headerSubtitle: {
    color: '#666',
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 2,
  },
  listContainer: {
    flex: 1,
  },
  resultCount: {
    color: '#666',
    marginHorizontal: 16,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  selectedListItem: {
    backgroundColor: '#e3f2fd',
  },
  listItemTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  listItemDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  emptyCard: {
    marginHorizontal: 16,
    elevation: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#666',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#999',
    textAlign: 'center',
  },
  buttonContainer: {
    padding: 16,
  },
  backButton: {
    marginTop: 8,
    marginBottom: 32,
    borderColor: '#2196F3',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  fishAvatar: {
    backgroundColor: '#fff',
  },
  fishAvatarIcon: {
    backgroundColor: '#e3f2fd',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH * 0.95,
    maxHeight: SCREEN_HEIGHT * 0.85,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  modalTitle: {
    flex: 1,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  closeButton: {
    margin: 0,
  },
  fullImage: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.6,
    borderRadius: 8,
  },
  closeModalButton: {
    marginTop: 16,
    width: '100%',
  },
  // ปุ่มเรียก AI ใน header
  aiButton: {
    marginTop: 12,
    backgroundColor: '#2196F3',
  },
  aiButtonContent: {
    paddingVertical: 6,
  },
  // AI result modal
  aiModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  aiModalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  aiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiModalTitle: {
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  aiPhoto: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#eee',
  },
  aiCenter: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  aiLoadingText: {
    marginTop: 12,
    color: '#666',
  },
  aiErrorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 4,
  },
  aiErrorText: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  aiRetry: {
    borderColor: '#2196F3',
  },
  aiWarnBanner: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  aiWarnText: {
    color: '#e65100',
    fontWeight: '600',
    textAlign: 'center',
  },
  aiList: {
    marginTop: 4,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  aiRowTop: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 0,
    marginBottom: 4,
  },
  aiRowText: {
    flex: 1,
    paddingRight: 12,
  },
  aiName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  aiNameTop: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  aiLocal: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  aiSci: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 1,
  },
  aiBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#eceff1',
    marginTop: 8,
    overflow: 'hidden',
  },
  aiBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  aiPct: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  aiPick: {
    alignSelf: 'center',
  },
  aiNoMatch: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'center',
    maxWidth: 80,
    textAlign: 'center',
  },
  aiManual: {
    marginTop: 8,
  },
});
