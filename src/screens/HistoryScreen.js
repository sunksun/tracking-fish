import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Button,
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
import { useAuth } from '../contexts/AuthContext';
import ScreenContainer from '../components/ScreenContainer';
import CurvedHeader from '../components/CurvedHeader';
import Panel from '../components/Panel';
import { colors, spacing, radius } from '../theme';

const WATER_SOURCE_LABELS = {
  'mekong': 'แม่น้ำโขง',
  'stream': 'ลำธาร',
  'pond': 'บึง/หนอง',
  'other': 'อื่นๆ'
};

export default function HistoryScreen({ navigation }) {
  const { fishingHistory } = useFishingData();
  const { user, selectedFisher, isResearcher } = useAuth();

  // Filter fishing history based on selected fisher or current user
  const getFilteredByUser = () => {
    // ตรวจสอบว่า user มีข้อมูลหรือไม่
    if (!user || !user.id) {
      return [];
    }

    if (isResearcher && selectedFisher) {
      // นักวิจัยเลือกชาวประมง → แสดงข้อมูลของชาวประมงคนนั้น
      return fishingHistory.filter(entry => {
        return entry.fisherInfo?.id === selectedFisher.id ||
               entry.userId === selectedFisher.id;
      });
    } else if (!isResearcher) {
      // ชาวประมงล็อกอินเอง → แสดงเฉพาะข้อมูลของตัวเอง
      return fishingHistory.filter(entry => {
        return entry.fisherInfo?.id === user.id ||
               entry.userId === user.id;
      });
    }
    // นักวิจัยยังไม่เลือกชาวประมง → ไม่แสดงข้อมูล
    return [];
  };

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

  const formatDateTimeWithCreatedAt = (entry) => {
    try {
      // ลำดับความสำคัญ: ใช้ createdAt ก่อน (เพราะมีเวลาที่แม่นยำ) ถ้าไม่มีค่อยใช้ date
      const dateValue = entry.createdAt || entry.date;
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

      // Format Thai date with time
      const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
        'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
        'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];

      const day = date.getDate();
      const month = thaiMonths[date.getMonth()];
      const year = date.getFullYear() + 543;
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      return `${day} ${month} ${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return 'ไม่ระบุวันที่';
    }
  };

  const getTotalCount = (entry) => {
    if (!entry?.fishList || !Array.isArray(entry.fishList)) return 0;
    return entry.fishList.reduce((total, fish) => total + (parseInt(fish.count, 10) || 0), 0);
  };

  const getTotalWeight = (entry) => {
    if (!entry?.fishList || !Array.isArray(entry.fishList)) return '0.00';
    return entry.fishList.reduce((total, fish) => total + (parseFloat(fish.weight) || 0), 0).toFixed(2);
  };

  const getTotalValue = (entry) => {
    if (!entry?.fishList || !Array.isArray(entry.fishList)) return '0.00';
    return entry.fishList.reduce((total, fish) => total + (parseFloat(fish.price) || 0), 0).toFixed(2);
  };

  const getFilteredAndSortedHistory = () => {
    // เริ่มจาก filter ตาม user ก่อน
    let filtered = getFilteredByUser();

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(entry => {
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

    // ใช้ข้อมูลที่ filter ตาม user แล้ว
    const userHistory = getFilteredByUser();

    userHistory.forEach(entry => {
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
      // sortKey เรียงตามเวลาได้จริง (key เป็นภาษาไทย new Date() parse ไม่ได้)
      const sortKey = date.getFullYear() * 12 + date.getMonth();

      if (!monthlyData[month]) {
        monthlyData[month] = {
          sortKey,
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
      .sort(([, a], [, b]) => b.sortKey - a.sortKey) // เดือนล่าสุดก่อน
      .slice(0, 3); // Show last 3 months
  };

  const filteredHistory = getFilteredAndSortedHistory();
  const monthlyStats = getMonthlyStats();

  // ตรวจสอบจากข้อมูลที่ filter ตาม user แล้ว
  const userHistory = getFilteredByUser();

  if (userHistory.length === 0) {
    return (
      <ScreenContainer
        header={<CurvedHeader title="ประวัติการจับปลา" />}
        scroll={false}
      >
      <View style={styles.emptyContainer}>
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          {isResearcher && !selectedFisher
            ? 'กรุณาเลือกชาวประมงก่อน'
            : 'ยังไม่มีประวัติการจับปลา'}
        </Text>
        <Text variant="bodyLarge" style={styles.emptySubtitle}>
          {isResearcher && !selectedFisher
            ? 'กลับไปหน้าหลักเพื่อเลือกชาวประมง'
            : 'เริ่มบันทึกการจับปลาเพื่อดูประวัติที่นี่'}
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('HomeTab', { screen: 'Home' })}
          style={styles.emptyButton}
          buttonColor={colors.riverDeep}
          icon="plus"
        >
          เริ่มบันทึกการจับปลา
        </Button>
      </View>
      </ScreenContainer>
    );
  }

  return (
    <>
      <ScreenContainer
        header={<CurvedHeader title="ประวัติการจับปลา" />}
        contentContainerStyle={styles.content}
      >
          {/* Search and Sort (ข้อมูล realtime จาก Firebase — ไม่ต้องรีเฟรชเอง) */}
          <View style={styles.headerContainer}>
            <Searchbar
              placeholder="ค้นหาตามวันที่หรือชื่อปลา"
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              inputStyle={styles.searchInput}
              iconColor={colors.inkSoft}
            />

            <View style={styles.actionButtons}>
              <Menu
                visible={showSortMenu}
                onDismiss={() => setShowSortMenu(false)}
                anchor={
                  <IconButton
                    icon="sort"
                    size={24}
                    iconColor={colors.riverDeep}
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
          </View>

          {/* Monthly Statistics */}
          {monthlyStats.length > 0 && (
            <Panel title="สถิติรายเดือน">
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
            </Panel>
          )}

          {/* History List */}
          <Panel title={`ประวัติการจับปลา (${filteredHistory.length} รายการ)`}>
              {filteredHistory.map((entry) => (
                <List.Item
                  key={entry.id}
                  title={formatDateTimeWithCreatedAt(entry)}
                  description={
                    entry.noFishing
                      ? 'ไม่ได้จับปลา'
                      : `${entry.fishList.length} ชนิด | ${getTotalCount(entry)} ตัว | ${getTotalWeight(entry)} กก.`
                  }
                  left={() =>
                    <List.Icon
                      icon={entry.noFishing ? 'cancel' : 'fish'}
                      color={entry.noFishing ? colors.clay : colors.riverMid}
                    />
                  }
                  right={() => <List.Icon icon="chevron-right" color={colors.inkSoft} />}
                  onPress={() => handleEntryPress(entry)}
                  titleStyle={styles.historyItemTitle}
                  descriptionStyle={styles.historyItemDescription}
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
          </Panel>

          {/* Home Button */}
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('HomeTab', { screen: 'Home' })}
            style={styles.homeButton}
            textColor={colors.riverMid}
            icon="home"
          >
            หน้าแรก
          </Button>
      </ScreenContainer>

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
                          สภาพอากาศ: {selectedEntry.weather || '-'}
                        </Text>
                      </View>

                      {selectedEntry.fishingGear && (
                        <View style={styles.dialogSection}>
                          <Text variant="titleSmall" style={styles.dialogSectionTitle}>
                            อุปกรณ์จับปลา
                          </Text>
                          {(() => {
                            // Handle both object and array format
                            const gears = Array.isArray(selectedEntry.fishingGear)
                              ? selectedEntry.fishingGear
                              : [selectedEntry.fishingGear];

                            return gears.map((gear, index) => {
                              if (!gear || !gear.name) return null;

                              // Format details
                              let detailsText = '';
                              if (gear.details) {
                                if (typeof gear.details === 'string') {
                                  detailsText = gear.details;
                                } else if (typeof gear.details === 'object') {
                                  // Convert details object to readable string
                                  const detailParts = [];
                                  if (gear.details.quantity) detailParts.push(`จำนวน: ${gear.details.quantity}`);
                                  if (gear.details.size) detailParts.push(`ขนาด: ${gear.details.size}`);
                                  if (gear.details.meshSize) detailParts.push(`ขนาดตา: ${gear.details.meshSize}`);
                                  if (gear.details.length) detailParts.push(`ความยาว: ${gear.details.length}`);
                                  if (gear.details.depth) detailParts.push(`ความลึก: ${gear.details.depth}`);
                                  if (gear.details.custom) detailParts.push(gear.details.custom);
                                  detailsText = detailParts.join(' | ');
                                }
                              }

                              return (
                                <View key={index} style={styles.gearItem}>
                                  <Text variant="bodyMedium" style={styles.gearName}>
                                    • {gear.name}
                                  </Text>
                                  {detailsText && (
                                    <Text variant="bodySmall" style={styles.gearDetails}>
                                      {detailsText}
                                    </Text>
                                  )}
                                </View>
                              );
                            });
                          })()}
                        </View>
                      )}

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
            <Button textColor={colors.riverMid} onPress={() => setShowDetailDialog(false)}>ปิด</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  searchBar: {
    flex: 1,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    elevation: 0,
  },
  searchInput: {
    color: colors.ink,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthStatsContainer: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  monthTitle: {
    fontWeight: '800',
    color: colors.riverDeep,
    marginBottom: spacing.sm,
  },
  monthStatsGrid: {
    paddingTop: spacing.xs,
  },
  monthStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
  },
  monthStatLabel: {
    color: colors.inkSoft,
  },
  monthStatValue: {
    fontWeight: '800',
    color: colors.riverDeep,
  },
  historyItem: {
    paddingHorizontal: 0,
  },
  historyItemTitle: {
    fontWeight: '800',
    color: colors.ink,
  },
  historyItemDescription: {
    color: colors.inkSoft,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  noResultsText: {
    color: colors.ink,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  noResultsSubtext: {
    color: colors.inkSoft,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyTitle: {
    marginBottom: spacing.lg,
    textAlign: 'center',
    color: colors.ink,
    fontWeight: '800',
  },
  emptySubtitle: {
    marginBottom: spacing.xxl,
    textAlign: 'center',
    color: colors.inkSoft,
  },
  emptyButton: {
    paddingHorizontal: spacing.xxl,
  },
  homeButton: {
    marginTop: spacing.xxl,
    borderColor: colors.riverMid,
  },
  dialog: {
    maxHeight: '80%',
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
  },
  dialogContent: {
    paddingVertical: spacing.sm,
  },
  dialogDate: {
    fontWeight: '800',
    marginBottom: spacing.lg,
    color: colors.riverDeep,
  },
  noFishingChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(232,163,61,0.18)',
  },
  dialogSection: {
    marginBottom: spacing.lg,
  },
  dialogSectionTitle: {
    fontWeight: '800',
    marginBottom: spacing.sm,
    color: colors.riverDeep,
  },
  fishDetailItem: {
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
  },
  fishName: {
    fontWeight: '600',
    color: colors.ink,
  },
  fishDetails: {
    color: colors.inkSoft,
    marginTop: 2,
  },
  gearItem: {
    marginBottom: spacing.sm,
  },
  gearName: {
    fontWeight: '600',
    color: colors.ink,
  },
  gearDetails: {
    color: colors.inkSoft,
    marginTop: 2,
    marginLeft: spacing.lg,
    fontStyle: 'italic',
  },
  totalSummary: {
    backgroundColor: colors.tealWash,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  totalText: {
    fontWeight: '700',
    color: colors.riverDeep,
  },
});