import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { 
  Button, 
  Card, 
  Text, 
  List,
  Searchbar,
  Chip,
  Menu,
  IconButton,
  Portal,
  Dialog
} from 'react-native-paper';
import { useFishingData } from '../contexts/FishingDataContext';

const WATER_SOURCE_LABELS = {
  'mekong': 'แม่น้ำโขง',
  'stream': 'ลำธาร',
  'pond': 'บึง/หนอง',
  'other': 'อื่นๆ'
};

export default function HistoryScreen({ navigation }) {
  const { fishingHistory } = useFishingData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [sortBy, setSortBy] = useState('date'); // date, fishCount, weight
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Disable back button functionality
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Return true to prevent default back action
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  const formatDate = (dateValue) => {
    try {
      if (!dateValue) return 'ไม่ระบุวันที่';
      
      let date;
      
      // Handle Firestore Timestamp object
      if (dateValue && typeof dateValue === 'object' && dateValue.seconds && dateValue.nanoseconds) {
        date = new Date(dateValue.seconds * 1000 + dateValue.nanoseconds / 1000000);
      } 
      else if (dateValue instanceof Date) {
        date = dateValue;
      } 
      else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        date = new Date(dateValue);
      } 
      else if (dateValue && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
      } 
      else {
        return 'ไม่ระบุวันที่';
      }
      
      if (isNaN(date.getTime())) {
        return 'ไม่ระบุวันที่';
      }
      
      // Format Thai date with Thai month names (full names)
      const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 
        'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
        'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      
      const day = date.getDate();
      const month = thaiMonths[date.getMonth()];
      const year = date.getFullYear() + 543;
      
      return `${day} ${month} ${year}`;
    } catch (error) {
      console.error('Error formatting date in History:', error, dateValue);
      return 'ไม่ระบุวันที่';
    }
  };

  const formatTime = (timeValue) => {
    try {
      if (!timeValue) return '-';
      
      let date;
      
      // Handle Firestore Timestamp object
      if (timeValue && typeof timeValue === 'object' && timeValue.seconds && timeValue.nanoseconds) {
        date = new Date(timeValue.seconds * 1000 + timeValue.nanoseconds / 1000000);
      } 
      // Handle regular Date object
      else if (timeValue instanceof Date) {
        date = timeValue;
      } 
      // Handle string or number
      else if (typeof timeValue === 'string' || typeof timeValue === 'number') {
        date = new Date(timeValue);
      } 
      // Handle Firestore Timestamp with toDate() method
      else if (timeValue && typeof timeValue.toDate === 'function') {
        date = timeValue.toDate();
      } 
      else {
        console.log('Unknown time format:', timeValue);
        return '-';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log('Invalid time:', timeValue);
        return '-';
      }
      
      return date.toLocaleTimeString('th-TH', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch (error) {
      console.error('Error formatting time:', error, timeValue);
      return '-';
    }
  };

  const getTotalCount = (entry) => {
    return entry.fishList.reduce((total, fish) => total + parseInt(fish.count || 0), 0);
  };

  const getTotalWeight = (entry) => {
    return entry.fishList.reduce((total, fish) => total + parseFloat(fish.weight || 0), 0).toFixed(2);
  };

  const getTotalValue = (entry) => {
    return entry.fishList.reduce((total, fish) => total + parseFloat(fish.price || 0), 0).toFixed(2);
  };

  const getFilteredAndSortedHistory = () => {
    let filtered = fishingHistory;

    // Filter by search query
    if (searchQuery) {
      filtered = fishingHistory.filter(entry => {
        const searchLower = searchQuery.toLowerCase();
        const dateMatch = formatDate(entry.date).toLowerCase().includes(searchLower);
        const fishMatch = entry.fishList.some(fish => 
          fish.name.toLowerCase().includes(searchLower)
        );
        return dateMatch || fishMatch;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'fishCount':
          return getTotalCount(b) - getTotalCount(a);
        case 'weight':
          return parseFloat(getTotalWeight(b)) - parseFloat(getTotalWeight(a));
        case 'date':
        default:
          // Safe date comparison for Firestore Timestamp
          const dateA = a.date && typeof a.date === 'object' && a.date.seconds 
            ? new Date(a.date.seconds * 1000) 
            : new Date(a.date);
          const dateB = b.date && typeof b.date === 'object' && b.date.seconds 
            ? new Date(b.date.seconds * 1000) 
            : new Date(b.date);
          return dateB - dateA;
      }
    });

    return filtered;
  };

  const handleEntryPress = (entry) => {
    setSelectedEntry(entry);
    setShowDetailDialog(true);
  };

  const handleSortSelect = useCallback((sortType) => {
    setSortBy(sortType);
    setShowSortMenu(false);
  }, []);

  const toggleSortMenu = useCallback(() => {
    setShowSortMenu(prev => !prev);
  }, []);

  const getMonthlyStats = () => {
    const monthlyData = {};
    
    fishingHistory.forEach(entry => {
      // Safe date conversion for Firestore Timestamp
      let date;
      try {
        if (entry.date && typeof entry.date === 'object' && entry.date.seconds && entry.date.nanoseconds) {
          date = new Date(entry.date.seconds * 1000 + entry.date.nanoseconds / 1000000);
        } else if (entry.date instanceof Date) {
          date = entry.date;
        } else {
          date = new Date(entry.date);
        }
      } catch (error) {
        console.error('Error parsing date for monthly stats:', error);
        return; // Skip this entry
      }
      
      if (isNaN(date.getTime())) {
        return; // Skip invalid dates
      }
      
      const thaiFullMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 
        'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
        'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      
      const monthName = thaiFullMonths[date.getMonth()];
      const year = date.getFullYear() + 543;
      const month = `${monthName} ${year}`;
      
      if (!monthlyData[month]) {
        monthlyData[month] = {
          entries: 0,
          species: 0,
          totalFish: 0,
          totalWeight: 0,
          totalValue: 0,
          noFishingDays: 0
        };
      }

      monthlyData[month].entries++;

      if (entry.noFishing) {
        monthlyData[month].noFishingDays++;
      } else {
        monthlyData[month].species += (entry.fishList?.length || 0);
        monthlyData[month].totalFish += getTotalCount(entry);
        monthlyData[month].totalWeight += parseFloat(getTotalWeight(entry));
        monthlyData[month].totalValue += parseFloat(getTotalValue(entry));
      }
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .slice(0, 3); // Show last 3 months
  };

  const filteredHistory = getFilteredAndSortedHistory();
  const monthlyStats = getMonthlyStats();

  if (fishingHistory.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          ยังไม่มีประวัติการจับปลา
        </Text>
        <Text variant="bodyLarge" style={styles.emptySubtitle}>
          เริ่มบันทึกการจับปลาเพื่อดูประวัติที่นี่
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Home')}
          style={styles.emptyButton}
          icon="plus"
        >
          เริ่มบันทึกการจับปลา
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          {/* Search and Sort */}
          <View style={styles.headerContainer}>
            <Searchbar
              placeholder="ค้นหาตามวันที่หรือชื่อปลา"
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
            />
            
            <Menu
              visible={showSortMenu}
              onDismiss={() => setShowSortMenu(false)}
              anchor={
                <IconButton
                  icon="sort"
                  size={24}
                  onPress={toggleSortMenu}
                />
              }
            >
              <Menu.Item
                onPress={() => handleSortSelect('date')}
                title="เรียงตามวันที่"
                leadingIcon={sortBy === 'date' ? 'check' : ''}
              />
              <Menu.Item
                onPress={() => handleSortSelect('fishCount')}
                title="เรียงตามจำนวนปลา"
                leadingIcon={sortBy === 'fishCount' ? 'check' : ''}
              />
              <Menu.Item
                onPress={() => handleSortSelect('weight')}
                title="เรียงตามน้ำหนัก"
                leadingIcon={sortBy === 'weight' ? 'check' : ''}
              />
            </Menu>
          </View>

          {/* Monthly Statistics */}
          {monthlyStats.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  สถิติรายเดือน
                </Text>
                {monthlyStats.map(([month, stats]) => (
                  <View key={month} style={styles.monthStatsContainer}>
                    <Text variant="titleSmall" style={styles.monthTitle}>
                      {month}
                    </Text>
                    <View style={styles.monthStatsGrid}>
                      <View style={styles.monthStatRow}>
                        <Text variant="bodyMedium" style={styles.monthStatLabel}>
                          จำนวนครั้งที่บันทึก
                        </Text>
                        <Text variant="bodyMedium" style={styles.monthStatValue}>
                          {stats.entries} ครั้ง
                        </Text>
                      </View>
                      <View style={styles.monthStatRow}>
                        <Text variant="bodyMedium" style={styles.monthStatLabel}>
                          จำนวนชนิดปลา
                        </Text>
                        <Text variant="bodyMedium" style={styles.monthStatValue}>
                          {stats.species} ชนิด
                        </Text>
                      </View>
                      <View style={styles.monthStatRow}>
                        <Text variant="bodyMedium" style={styles.monthStatLabel}>
                          จำนวนปลาที่จับได้
                        </Text>
                        <Text variant="bodyMedium" style={styles.monthStatValue}>
                          {stats.totalFish} ตัว
                        </Text>
                      </View>
                      <View style={styles.monthStatRow}>
                        <Text variant="bodyMedium" style={styles.monthStatLabel}>
                          น้ำหนักรวม
                        </Text>
                        <Text variant="bodyMedium" style={styles.monthStatValue}>
                          {stats.totalWeight.toFixed(2)} กก.
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* History List */}
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                ประวัติการจับปลา ({filteredHistory.length} รายการ)
              </Text>
              
              {filteredHistory.map((entry) => (
                <List.Item
                  key={entry.id}
                  title={formatDate(entry.date)}
                  description={
                    entry.noFishing 
                      ? 'ไม่ได้จับปลา'
                      : `${entry.fishList.length} ชนิด | ${getTotalCount(entry)} ตัว | ${getTotalWeight(entry)} กก.`
                  }
                  left={() => 
                    <List.Icon 
                      icon={entry.noFishing ? 'cancel' : 'fish'} 
                      color={entry.noFishing ? '#f44336' : '#4caf50'}
                    />
                  }
                  right={() => <List.Icon icon="chevron-right" />}
                  onPress={() => handleEntryPress(entry)}
                  style={styles.historyItem}
                />
              ))}

              {filteredHistory.length === 0 && searchQuery && (
                <View style={styles.noResults}>
                  <Text variant="bodyLarge" style={styles.noResultsText}>
                    ไม่พบผลการค้นหา
                  </Text>
                  <Text variant="bodyMedium" style={styles.noResultsSubtext}>
                    ลองเปลี่ยนคำค้นหาหรือล้างการค้นหา
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      {/* Home Button */}
      <View style={styles.homeButtonContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Home')}
          style={styles.homeButton}
          icon="home"
        >
          หน้าแรก
        </Button>
      </View>

      {/* Detail Dialog */}
      <Portal>
        <Dialog 
          visible={showDetailDialog} 
          onDismiss={() => setShowDetailDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title>รายละเอียดการจับปลา</Dialog.Title>
          <Dialog.Content>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedEntry && (
                <View style={styles.dialogContent}>
                  <Text variant="bodyLarge" style={styles.dialogDate}>
                    {formatDate(selectedEntry.date)}
                  </Text>

                  {selectedEntry.noFishing ? (
                    <Chip icon="information" mode="outlined" style={styles.noFishingChip}>
                      ไม่ได้จับปลาในวันนี้
                    </Chip>
                  ) : (
                    <>
                      <View style={styles.dialogSection}>
                        <Text variant="titleSmall" style={styles.dialogSectionTitle}>
                          ข้อมูลทั่วไป
                        </Text>
                        <Text variant="bodyMedium">
                          แหล่งน้ำ: {selectedEntry.waterSource || '-'}
                        </Text>
                        <Text variant="bodyMedium">
                          ระดับน้ำ: {selectedEntry.waterLevel || '-'}
                        </Text>
                        <Text variant="bodyMedium">
                          สภาพอากาศ: {selectedEntry.weather || '-'}
                        </Text>
                        <Text variant="bodyMedium">
                          เวลา: {formatTime(selectedEntry.startTime)} - {formatTime(selectedEntry.endTime)}
                        </Text>
                      </View>

                      {selectedEntry.fishList.length > 0 && (
                        <View style={styles.dialogSection}>
                          <Text variant="titleSmall" style={styles.dialogSectionTitle}>
                            รายการปลา ({selectedEntry.fishList.length} ชนิด)
                          </Text>
                          {selectedEntry.fishList.map((fish) => (
                            <View key={fish.id} style={styles.fishDetailItem}>
                              <Text variant="bodyMedium" style={styles.fishName}>
                                {fish.name}
                              </Text>
                              <Text variant="bodySmall" style={styles.fishDetails}>
                                {fish.count} ตัว | {fish.weight} กก. | {fish.price} บาท
                              </Text>
                            </View>
                          ))}
                          
                          <View style={styles.totalSummary}>
                            <Text variant="bodyMedium" style={styles.totalText}>
                              รวม: {getTotalCount(selectedEntry)} ตัว | {getTotalWeight(selectedEntry)} กก. | {getTotalValue(selectedEntry)} บาท
                            </Text>
                          </View>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDetailDialog(false)}>ปิด</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
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
  monthStatsContainer: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  monthTitle: {
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  monthStatsGrid: {
    paddingTop: 4,
  },
  monthStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  monthStatLabel: {
    color: '#666',
  },
  monthStatValue: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  monthStats: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    color: '#666',
  },
  historyItem: {
    paddingHorizontal: 0,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noResultsText: {
    color: '#666',
    marginBottom: 8,
  },
  noResultsSubtext: {
    color: '#999',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#666',
  },
  emptySubtitle: {
    marginBottom: 24,
    textAlign: 'center',
    color: '#999',
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
  homeButtonContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  homeButton: {
    borderColor: '#2196F3',
  },
  dialog: {
    maxHeight: '80%',
    marginHorizontal: 20,
  },
  dialogContent: {
    paddingVertical: 8,
  },
  dialogDate: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2196F3',
  },
  noFishingChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffeb3b',
  },
  dialogSection: {
    marginBottom: 16,
  },
  dialogSectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2196F3',
  },
  fishDetailItem: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  fishName: {
    fontWeight: '500',
  },
  fishDetails: {
    color: '#666',
    marginTop: 2,
  },
  totalSummary: {
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  totalText: {
    fontWeight: '500',
  },
});