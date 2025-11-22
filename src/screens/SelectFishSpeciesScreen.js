import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Button,
  Text,
  Card,
  Searchbar,
  ActivityIndicator,
  List,
  Divider
} from 'react-native-paper';
import { FirebaseService } from '../services/FirebaseService';

export default function SelectFishSpeciesScreen({ navigation }) {
  const [allFishSpecies, setAllFishSpecies] = useState([]);
  const [filteredFishSpecies, setFilteredFishSpecies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFish, setSelectedFish] = useState(null);

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
      console.log('🔄 Starting to load fish species...');
      const result = await FirebaseService.getAllFishSpecies();

      console.log('📊 Result:', result);

      if (result.success) {
        console.log('✅ Loaded fish species:', result.species.length);
        if (result.species.length > 0) {
          console.log('🐟 Sample fish:', result.species[0]);
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
          <Text variant="titleMedium" style={styles.headerTitle}>
            เลือกชนิดปลา
          </Text>
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
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.footerButton}
          icon="arrow-left"
        >
          กลับ
        </Button>
      </View>
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
  headerTitle: {
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
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
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  footerButton: {
    borderColor: '#2196F3',
  },
});
