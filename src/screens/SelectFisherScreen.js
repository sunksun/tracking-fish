import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Button,
  Text,
  Card,
  Searchbar,
  ActivityIndicator,
  List,
  Divider,
  Icon
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseService } from '../services/FirebaseService';

export default function SelectFisherScreen({ navigation }) {
  const { user, selectFisher, selectedFisher } = useAuth();
  const [fishers, setFishers] = useState([]);
  const [filteredFishers, setFilteredFishers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFishers();
  }, []);

  useEffect(() => {
    // กรองรายชื่อชาวประมงตามคำค้นหา
    if (searchQuery.trim() === '') {
      setFilteredFishers(fishers);
    } else {
      const filtered = fishers.filter((fisher) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          fisher.name?.toLowerCase().includes(searchLower) ||
          fisher.fisherProfile?.nickname?.toLowerCase().includes(searchLower) ||
          fisher.village?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredFishers(filtered);
    }
  }, [searchQuery, fishers]);

  const loadFishers = async () => {
    try {
      setLoading(true);
      const result = await FirebaseService.getActiveFishers();

      if (result.success) {
        console.log('📋 Loaded fishers:', result.fishers);
        // Debug: แสดงข้อมูลชาวประมงคนแรก
        if (result.fishers.length > 0) {
          console.log('🔍 Sample fisher data:', result.fishers[0]);
        }
        setFishers(result.fishers);
        setFilteredFishers(result.fishers);
      } else {
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลชาวประมงได้');
      }
    } catch (error) {
      console.error('Error loading fishers:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลชาวประมงได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFisher = async (fisher) => {
    try {
      const result = await selectFisher(fisher);

      if (result.success) {
        Alert.alert(
          'เลือกชาวประมงสำเร็จ',
          `คุณกำลังบันทึกข้อมูลในนาม ${fisher.name}`,
          [
            {
              text: 'ตกลง',
              onPress: () => navigation.navigate('Home')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error selecting fisher:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเลือกชาวประมงได้');
    }
  };

  const getFisherDescription = (fisher) => {
    const parts = [];
    if (fisher.fisherProfile?.nickname) parts.push(fisher.fisherProfile.nickname);
    if (fisher.village) parts.push(fisher.village);
    return parts.join(' • ');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูลชาวประมง...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.headerTitle}>
            เลือกชาวประมงที่ต้องการบันทึกข้อมูล
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            คุณกำลังบันทึกในนาม: {user?.name || 'นักวิจัย'}
          </Text>
          {selectedFisher && (
            <View style={styles.currentSelection}>
              <Icon source="check-circle" size={20} color="#4caf50" />
              <Text variant="bodyMedium" style={styles.currentSelectionText}>
                กำลังบันทึกให้: {selectedFisher.name}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Search Bar */}
      <Searchbar
        placeholder="ค้นหาชื่อ, ชื่อเล่น, หรือหมู่บ้าน"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {/* Fisher List */}
      <ScrollView style={styles.listContainer}>
        {filteredFishers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <View style={styles.emptyState}>
                <Icon source="account-search" size={60} color="#999" />
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  {searchQuery ? 'ไม่พบข้อมูลชาวประมง' : 'ยังไม่มีข้อมูลชาวประมง'}
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtitle}>
                  {searchQuery
                    ? 'ลองค้นหาด้วยคำอื่น'
                    : 'กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มข้อมูลชาวประมง'}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            <Card.Content style={styles.listCardContent}>
              {filteredFishers.map((fisher, index) => (
                <React.Fragment key={fisher.id}>
                  <List.Item
                    title={fisher.name || 'ไม่ระบุชื่อ'}
                    description={getFisherDescription(fisher)}
                    right={(props) => (
                      <Button
                        {...props}
                        mode={
                          selectedFisher?.id === fisher.id
                            ? 'contained'
                            : 'outlined'
                        }
                        onPress={() => handleSelectFisher(fisher)}
                        compact
                        style={styles.selectButton}
                      >
                        {selectedFisher?.id === fisher.id ? 'เลือกแล้ว' : 'เลือก'}
                      </Button>
                    )}
                    style={[
                      styles.listItem,
                      selectedFisher?.id === fisher.id && styles.selectedListItem
                    ]}
                    titleStyle={styles.listItemTitle}
                    descriptionStyle={styles.listItemDescription}
                    descriptionNumberOfLines={2}
                  />
                  {index < filteredFishers.length - 1 && <Divider />}
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
    marginBottom: 8,
  },
  currentSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  currentSelectionText: {
    marginLeft: 8,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  listContainer: {
    flex: 1,
  },
  listCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  listCardContent: {
    padding: 0,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectedListItem: {
    backgroundColor: '#e8f5e9',
  },
  listItemTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  listItemDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  selectButton: {
    alignSelf: 'center',
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
