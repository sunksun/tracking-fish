import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  Button,
  Text,
  Searchbar,
  ActivityIndicator,
  List,
  Divider,
  Icon
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseService } from '../services/FirebaseService';
import ScreenContainer from '../components/ScreenContainer';
import CurvedHeader from '../components/CurvedHeader';
import Panel from '../components/Panel';
import { colors, spacing, radius } from '../theme';

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

      // 1. ลองอ่านจาก AsyncStorage cache ก่อน
      const cachedData = await AsyncStorage.getItem('fisher_list_cache');
      const cacheTime = await AsyncStorage.getItem('fisher_list_cache_time');

      const now = Date.now();
      const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 วัน

      // 2. ถ้ามี cache และยังไม่หมดอายุ ใช้ cache
      if (cachedData && cacheTime) {
        const timeSinceCache = now - parseInt(cacheTime);

        if (timeSinceCache < CACHE_DURATION) {
          if (__DEV__) {
            const daysOld = Math.floor(timeSinceCache / (24 * 60 * 60 * 1000));
            console.log(`✅ Using cached fisher list (${daysOld} days old, expires in ${7 - daysOld} days)`);
          }

          const fishersData = JSON.parse(cachedData);
          setFishers(fishersData);
          setFilteredFishers(fishersData);
          setLoading(false);
          return;
        } else {
          if (__DEV__) console.log('⚠️ Cache expired, fetching from Firebase...');
        }
      } else {
        if (__DEV__) console.log('⚠️ No cache found, fetching from Firebase...');
      }

      // 3. ถ้าไม่มี cache หรือหมดอายุ → ดึงจาก Firebase
      if (__DEV__) console.log('🔄 Starting to load fishers from Firebase...');
      const result = await FirebaseService.getActiveFishers();

      if (__DEV__) console.log('📊 Result:', result);

      if (result.success) {
        console.log('✅ Loaded fishers from Firebase:', result.fishers.length);
        console.log('📋 Fisher names:', result.fishers.map(f => f.name).join(', '));

        if (__DEV__) {
          if (result.fishers.length > 0) {
            console.log('🔍 Sample fisher data:', result.fishers[0]);
          }
        }

        // 4. บันทึกลง AsyncStorage cache
        try {
          await AsyncStorage.setItem('fisher_list_cache', JSON.stringify(result.fishers));
          await AsyncStorage.setItem('fisher_list_cache_time', now.toString());
          console.log('💾 Cached fisher list data for 7 days');
        } catch (cacheError) {
          // ถ้า cache ไม่ได้ก็ไม่เป็นไร ยังใช้งานได้ปกติ
          console.error('⚠️ Failed to cache data:', cacheError);
        }

        setFishers(result.fishers);
        setFilteredFishers(result.fishers);
      } else {
        console.error('❌ Failed to load:', result.error);
        Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลชาวประมงได้: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error loading fishers:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลชาวประมงได้: ' + error.message);
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

  const header = (
    <CurvedHeader
      eyebrow="นักวิจัย"
      title="เลือกชาวประมง"
      subtitle={`บันทึกในนาม: ${user?.name || 'นักวิจัย'}`}
    />
  );

  if (loading) {
    return (
      <ScreenContainer header={header} scroll={false}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.riverMid} />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูลชาวประมง...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer header={header} contentContainerStyle={styles.content}>
      {/* สรุปจำนวน + รีเฟรช */}
      <View style={styles.summaryRow}>
        <Text style={styles.fisherCount}>
          พบ {fishers.length} คน
          {searchQuery ? ` (กรอง ${filteredFishers.length} คน)` : ''}
        </Text>
        <Button
          mode="text"
          compact
          textColor={colors.riverMid}
          onPress={async () => {
            await AsyncStorage.removeItem('fisher_list_cache');
            await AsyncStorage.removeItem('fisher_list_cache_time');
            loadFishers();
          }}
        >
          รีเฟรช
        </Button>
      </View>

      {selectedFisher && (
        <View style={styles.currentSelection}>
          <Icon source="check-circle" size={20} color={colors.riverMid} />
          <Text style={styles.currentSelectionText}>
            กำลังบันทึกให้: {selectedFisher.name}
          </Text>
        </View>
      )}

      {/* Search Bar */}
      <Searchbar
        placeholder="ค้นหาชื่อ, ชื่อเล่น, หรือหมู่บ้าน"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
        iconColor={colors.inkSoft}
      />

      {/* Fisher List */}
      {filteredFishers.length === 0 ? (
        <Panel>
          <View style={styles.emptyState}>
            <Icon source="account-search" size={56} color={colors.inkSoft} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'ไม่พบข้อมูลชาวประมง' : 'ยังไม่มีข้อมูลชาวประมง'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'ลองค้นหาด้วยคำอื่น'
                : 'กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มข้อมูลชาวประมง'}
            </Text>
          </View>
        </Panel>
      ) : (
        <Panel style={styles.listPanel}>
          {filteredFishers.map((fisher, index) => (
            <React.Fragment key={fisher.id}>
              <List.Item
                title={fisher.name || 'ไม่ระบุชื่อ'}
                description={getFisherDescription(fisher)}
                right={(props) => (
                  <Button
                    {...props}
                    mode={selectedFisher?.id === fisher.id ? 'contained' : 'outlined'}
                    onPress={() => handleSelectFisher(fisher)}
                    buttonColor={selectedFisher?.id === fisher.id ? colors.riverDeep : undefined}
                    textColor={selectedFisher?.id === fisher.id ? colors.surface : colors.riverMid}
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
              {index < filteredFishers.length - 1 && <Divider style={styles.divider} />}
            </React.Fragment>
          ))}
        </Panel>
      )}

      {/* Back Button */}
      <Button
        mode="outlined"
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        textColor={colors.riverMid}
        icon="arrow-left"
      >
        กลับ
      </Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fisherCount: {
    color: colors.inkSoft,
    fontSize: 14,
  },
  currentSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.tealWash,
    borderRadius: radius.md,
  },
  currentSelectionText: {
    marginLeft: spacing.sm,
    color: colors.riverDeep,
    fontWeight: '700',
  },
  searchBar: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    elevation: 0,
  },
  searchInput: {
    color: colors.ink,
  },
  listPanel: {
    padding: 0,
    overflow: 'hidden',
  },
  listItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
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
  divider: {
    backgroundColor: colors.hairline,
  },
  selectButton: {
    alignSelf: 'center',
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
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.inkSoft,
    textAlign: 'center',
  },
  backButton: {
    marginTop: spacing.sm,
    borderColor: colors.riverMid,
  },
});
