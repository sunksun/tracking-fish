import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, Alert, Modal, TouchableOpacity, Image, Dimensions } from 'react-native';
import {
  Button,
  Text,
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
import useBottomInset from '../components/useBottomInset';
import CurvedHeader from '../components/CurvedHeader';
import Panel from '../components/Panel';
import { colors, spacing, radius } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SelectFishSpeciesScreen({ navigation, route }) {
  // โหมด 'picker' = ถูกเรียกจาก flow บันทึก (เลือกแล้วส่งชนิดกลับไป AddFish)
  // ไม่มี mode = แท็บจำแนกปลา standalone (แตะเพื่อดูรายละเอียด/รูป ไม่ navigate)
  const isPicker = route?.params?.mode === 'picker';
  const bottomInset = useBottomInset(0);
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
    if (!isPicker) {
      // แท็บจำแนกปลา: ไม่มีปลายทาง AddFish — เปิดดูรูป/รายละเอียดแทน
      const imageUrl = fish.image_url || fish.imageUrl;
      if (imageUrl) {
        setSelectedImageUrl(imageUrl);
        setSelectedImageName(fish.thai_name || fish.local_name || fish.common_name_thai || 'ไม่ระบุชื่อ');
        setImageModalVisible(true);
      }
      return;
    }
    navigation.navigate('AddFish', {
      selectedFish: fish,
      selectedFishCommonName: fish.common_name_thai || fish.thai_name || fish.scientific_name,
      selectedFishLocalName: fish.local_name || fish.common_name_thai || fish.thai_name
    });
  }, [navigation, isPicker]);

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
              mode={isPicker && isSelected ? 'contained' : 'outlined'}
              onPress={() => handleSelectFish(fish)}
              compact
            >
              {isPicker ? (isSelected ? 'เลือกแล้ว' : 'เลือก') : 'ดู'}
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
  }, [selectedFish, getFishDescription, handleSelectFish, isPicker]);

  const keyExtractor = useCallback((item) => item.id, []);


  const ListEmptyComponent = useMemo(() => (
    <Panel style={styles.emptyCard}>
      <View style={styles.emptyState}>
        <Text variant="titleMedium" style={styles.emptyTitle}>
          ไม่พบชนิดปลาที่ค้นหา
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtitle}>
          ลองค้นหาด้วยคำอื่น
        </Text>
      </View>
    </Panel>
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
      <View style={styles.container}>
        <CurvedHeader title={isPicker ? 'เลือกชนิดปลา' : 'จำแนกชนิดปลา'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.riverMid} />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูลชนิดปลา...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CurvedHeader
        title={isPicker ? 'เลือกชนิดปลา' : 'จำแนกชนิดปลา'}
        subtitle="ค้นหาและเลือกชนิดปลาที่ต้องการบันทึก"
      />
      <FlatList
        data={filteredFishSpecies}
        keyExtractor={keyExtractor}
        renderItem={renderFishItem}
        contentContainerStyle={{ paddingBottom: bottomInset }}
        ListHeaderComponent={
          <View>
            {/* Header actions */}
            <Panel style={styles.headerCard}>
              <View style={styles.headerTitleRow}>
                <Text variant="bodyMedium" style={styles.headerSubtitle}>
                  {filteredFishSpecies.length > 0
                    ? (searchQuery ? `พบ ${filteredFishSpecies.length} รายการ` : `ทั้งหมด ${filteredFishSpecies.length} ชนิด`)
                    : 'เลือกชนิดปลา'}
                </Text>
                <Button
                  mode="text"
                  compact
                  textColor={colors.riverMid}
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
              <Button
                mode="contained"
                icon="camera"
                onPress={startAIFlow}
                buttonColor={colors.riverDeep}
                style={styles.aiButton}
                contentStyle={styles.aiButtonContent}
              >
                ถ่ายรูปให้ AI ช่วยแนะนำ
              </Button>
            </Panel>

            {/* Search Bar */}
            <Searchbar
              placeholder="ค้นหาชื่อปลา (ภาษาไทย, ท้องถิ่น, หรือวิทยาศาสตร์)"
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              inputStyle={styles.searchInput}
              iconColor={colors.inkSoft}
            />
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
                <ActivityIndicator size="large" color={colors.riverMid} />
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
                    const barColor = strong ? colors.riverMid : colors.gold;
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
    backgroundColor: colors.sand,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.lg,
    color: colors.inkSoft,
  },
  headerCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  refreshButton: {
    marginRight: -spacing.sm,
  },
  headerSubtitle: {
    color: colors.inkSoft,
    flex: 1,
  },
  searchBar: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    elevation: 0,
  },
  searchInput: {
    color: colors.ink,
  },
  listItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  selectedListItem: {
    backgroundColor: colors.tealWash,
  },
  listItemTitle: {
    fontWeight: '800',
    fontSize: 16,
    color: colors.ink,
  },
  listItemDescription: {
    fontSize: 13,
    marginTop: 4,
    color: colors.inkSoft,
  },
  emptyCard: {
    marginHorizontal: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    color: colors.ink,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.inkSoft,
    textAlign: 'center',
  },
  buttonContainer: {
    padding: spacing.lg,
  },
  backButton: {
    marginTop: spacing.sm,
    borderColor: colors.riverMid,
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  fishAvatar: {
    backgroundColor: colors.surface,
  },
  fishAvatarIcon: {
    backgroundColor: colors.tealWash,
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
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    flex: 1,
    fontWeight: '800',
    color: colors.riverDeep,
  },
  closeButton: {
    margin: 0,
  },
  fullImage: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.6,
    borderRadius: radius.sm,
  },
  closeModalButton: {
    marginTop: spacing.lg,
    width: '100%',
  },
  // ปุ่มเรียก AI ใน header
  aiButton: {
    marginTop: spacing.md,
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
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  aiModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiModalTitle: {
    fontWeight: '800',
    color: colors.ink,
  },
  aiPhoto: {
    width: '100%',
    height: 160,
    borderRadius: radius.card,
    marginBottom: spacing.md,
    backgroundColor: colors.sand,
  },
  aiCenter: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  aiLoadingText: {
    marginTop: spacing.md,
    color: colors.inkSoft,
  },
  aiErrorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.clay,
    marginBottom: spacing.xs,
  },
  aiErrorText: {
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  aiRetry: {
    borderColor: colors.riverMid,
  },
  aiWarnBanner: {
    backgroundColor: 'rgba(232,163,61,0.14)',
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  aiWarnText: {
    color: colors.ink,
    fontWeight: '600',
    textAlign: 'center',
  },
  aiList: {
    marginTop: spacing.xs,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  aiRowTop: {
    backgroundColor: colors.tealWash,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 0,
    marginBottom: spacing.xs,
  },
  aiRowText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  aiName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  aiNameTop: {
    fontSize: 20,
    fontWeight: '800',
  },
  aiLocal: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
  },
  aiSci: {
    fontSize: 12,
    color: colors.inkSoft,
    fontStyle: 'italic',
    marginTop: 1,
  },
  aiBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.hairline,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  aiBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  aiPct: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  aiPick: {
    alignSelf: 'center',
  },
  aiNoMatch: {
    fontSize: 12,
    color: colors.inkSoft,
    alignSelf: 'center',
    maxWidth: 80,
    textAlign: 'center',
  },
  aiManual: {
    marginTop: spacing.sm,
  },
});
