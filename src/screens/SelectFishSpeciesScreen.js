import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity, Image, Dimensions } from 'react-native';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseService } from '../services/FirebaseService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SelectFishSpeciesScreen({ navigation }) {
  const [allFishSpecies, setAllFishSpecies] = useState([]);
  const [filteredFishSpecies, setFilteredFishSpecies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFish, setSelectedFish] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [selectedImageName, setSelectedImageName] = useState('');

  useEffect(() => {
    loadFishSpecies();
  }, []);

  useEffect(() => {
    // กรองรายการปลาตามคำค้นหา
    if (searchQuery.trim() === '') {
      setFilteredFishSpecies(allFishSpecies);
    } else {
      const filtered = allFishSpecies.filter((fish) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          fish.thai_name?.toLowerCase().includes(searchLower) ||
          fish.local_name?.toLowerCase().includes(searchLower) ||
          fish.scientific_name?.toLowerCase().includes(searchLower) ||
          fish.common_name_thai?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredFishSpecies(filtered);
    }
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
          setFilteredFishSpecies(species);
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

      if (__DEV__) console.log('📊 Result:', result);

      if (result.success) {
        if (__DEV__) {
          console.log('✅ Loaded fish species from Firebase:', result.species.length);

          // Log fish species with images
          const withImages = result.species.filter(f => f.image_url || f.imageUrl);
          console.log('📸 Fish with images:', withImages.length);

          if (withImages.length > 0) {
            console.log('📋 รายการปลาที่มีรูป:');
            withImages.forEach(f => {
              const name = f.thai_name || f.local_name || f.scientific_name;
              console.log(`  - ${name}: ${f.image_url || f.imageUrl}`);
            });
          }

          if (result.species.length > 0) {
            console.log('🐟 Sample fish:', result.species[0]);
          }
        }

        // 4. บันทึกลง AsyncStorage cache
        try {
          await AsyncStorage.setItem('fish_species_cache', JSON.stringify(result.species));
          await AsyncStorage.setItem('fish_species_cache_time', now.toString());
          if (__DEV__) console.log('💾 Cached fish species data for 7 days');
        } catch (cacheError) {
          // ถ้า cache ไม่ได้ก็ไม่เป็นไร ยังใช้งานได้ปกติ
          if (__DEV__) console.error('⚠️ Failed to cache data:', cacheError);
        }

        setAllFishSpecies(result.species);
        setFilteredFishSpecies(result.species);
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

  const handleSelectFish = (fish) => {
    const fishName = fish.thai_name || fish.local_name || fish.common_name_thai || fish.scientific_name;
    setSelectedFish(fish);

    // ส่งชื่อปลากลับไปหน้า AddFish ผ่าน navigation params
    navigation.navigate('AddFish', { selectedFishName: fishName });
  };

  const getFishDescription = (fish) => {
    const parts = [];
    // แสดงชื่อท้องถิ่นถ้ามีและไม่ซ้ำกับชื่อไทย
    if (fish.local_name && fish.thai_name !== fish.local_name) {
      parts.push(`ชื่อท้องถิ่น: ${fish.local_name}`);
    }
    return parts.join(' • ');
  };

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
                  // ล้าง cache และโหลดใหม่
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
        </Card.Content>
      </Card>

      {/* Search Bar */}
      <Searchbar
        placeholder="ค้นหาชื่อปลา (ภาษาไทย, ท้องถิ่น, หรือวิทยาศาสตร์)"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {/* Fish Species List */}
      <ScrollView style={styles.listContainer}>
        {filteredFishSpecies.length === 0 ? (
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
        ) : (
          <Card style={styles.listCard}>
            <Card.Content style={styles.listCardContent}>
              <Text variant="bodySmall" style={styles.resultCount}>
                {searchQuery ? `พบ ${filteredFishSpecies.length} รายการ` : `ทั้งหมด ${filteredFishSpecies.length} ชนิด`}
              </Text>
              {filteredFishSpecies.map((fish, index) => (
                <React.Fragment key={fish.id}>
                  <List.Item
                    title={fish.thai_name || fish.local_name || fish.common_name_thai || 'ไม่ระบุชื่อ'}
                    description={getFishDescription(fish)}
                    left={(props) => (
                      <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={() => {
                          if (fish.image_url || fish.imageUrl) {
                            setSelectedImageUrl(fish.image_url || fish.imageUrl);
                            setSelectedImageName(fish.thai_name || fish.local_name || fish.common_name_thai || 'ไม่ระบุชื่อ');
                            setImageModalVisible(true);
                          }
                        }}
                        disabled={!fish.image_url && !fish.imageUrl}
                      >
                        {fish.image_url || fish.imageUrl ? (
                          <Avatar.Image
                            {...props}
                            size={50}
                            source={{ uri: fish.image_url || fish.imageUrl }}
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
                        mode={selectedFish?.id === fish.id ? 'contained' : 'outlined'}
                        onPress={() => handleSelectFish(fish)}
                        compact
                      >
                        {selectedFish?.id === fish.id ? 'เลือกแล้ว' : 'เลือก'}
                      </Button>
                    )}
                    style={[
                      styles.listItem,
                      selectedFish?.id === fish.id && styles.selectedListItem
                    ]}
                    titleStyle={styles.listItemTitle}
                    descriptionStyle={styles.listItemDescription}
                    descriptionNumberOfLines={2}
                  />
                  {index < filteredFishSpecies.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Back Button */}
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
      </ScrollView>

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
    marginBottom: 16,
    elevation: 2,
  },
  listContainer: {
    flex: 1,
  },
  resultCount: {
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  listCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  listCardContent: {
    padding: 8,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
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
});
