import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert, Modal, Pressable } from 'react-native';
import {
  Button,
  Text,
  TextInput,
  Icon,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import MapView, { Marker } from 'react-native-maps';
import MapPlaceholder from '../components/MapPlaceholder';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFishingData } from '../contexts/FishingDataContext';
import { FirebaseService } from '../services/FirebaseService';
import { colors, spacing } from '../theme';
import ScreenContainer from '../components/ScreenContainer';
import CurvedHeader from '../components/CurvedHeader';
import Section from '../components/Panel';
import Pill from '../components/Pill';
import PrimaryButton from '../components/PrimaryButton';

const WATER_SOURCES = [
  'คก',
  'วัง',
  'หาด',
  'บุ่ง',
  'โซ่',
  'แก่ง',
  'ริมฝั่งโขง',
  'น้ำสาขา/ห้วยสาขา',
  'ดอนทราย'
];

const WEATHER_OPTIONS = [
  'แดดร้อน',
  'ฝนฟ้าคะนอง',
  'มีเมฆ',
  'ลมแรง',
  'อากาศเย็น'
];

const FISHING_GEAR = [
  'มอง',
  'แห',
  'เบ็ดราว',
  'ลอบ',
  'จั่น',
  'ตุ้ม',
  'กะโหล่',
  'ซ่อน',
  'ต่อง',
  'โต่ง',
  'เบ็ดน้ำเต้า',
  'เอ๊าะ',
  'สวิง',
  'สะดุ้ง',
  'อื่นๆ'
];

const TIME_PERIODS = [
  'กลางวัน',
  'กลางคืน'
];

export default function DataEntryScreen({ navigation }) {
  const { currentEntry, updateCurrentEntry } = useFishingData();
  // insets ใช้กับ map modal (full-screen Modal อยู่นอก tree ของ ScreenContainer)
  const insets = useSafeAreaInsets();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGearModal, setShowGearModal] = useState(false);
  const [selectedGear, setSelectedGear] = useState('');
  const [fishingSpots, setFishingSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [customLocation, setCustomLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);
  const [tempMarkerCoords, setTempMarkerCoords] = useState(null);
  
  const [localData, setLocalData] = useState({
    date: currentEntry.date || new Date(),
    waterSource: currentEntry.waterSource || '',
    weather: currentEntry.weather || '',
    fishingGear: currentEntry.fishingGear || null,
    startTime: currentEntry.startTime || '',
    endTime: currentEntry.endTime || ''
  });

  const [gearDetails, setGearDetails] = useState({
    quantity: '',
    size: '',
    custom: '',
    meshSize: '',
    length: '',
    depth: ''
  });

  // Load fishing spots from Firebase
  useEffect(() => {
    loadFishingSpots();
  }, []);

  const loadFishingSpots = async () => {
    try {
      setLoadingSpots(true);

      // 1. ลองอ่านจาก AsyncStorage cache ก่อน
      const cachedData = await AsyncStorage.getItem('fishing_spots_cache');
      const cacheTime = await AsyncStorage.getItem('fishing_spots_cache_time');

      const now = Date.now();
      const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 วัน

      // 2. ถ้ามี cache และยังไม่หมดอายุ ใช้ cache
      if (cachedData && cacheTime) {
        const timeSinceCache = now - parseInt(cacheTime);

        if (timeSinceCache < CACHE_DURATION) {
          if (__DEV__) {
            const daysOld = Math.floor(timeSinceCache / (24 * 60 * 60 * 1000));
            console.log(`✅ Using cached fishing spots (${daysOld} days old, expires in ${30 - daysOld} days)`);
          }

          const spots = JSON.parse(cachedData);
          setFishingSpots(spots);
          setLoadingSpots(false);
          return;
        } else {
          if (__DEV__) console.log('⚠️ Cache expired, fetching from Firebase...');
        }
      } else {
        if (__DEV__) console.log('⚠️ No cache found, fetching from Firebase...');
      }

      // 3. ถ้าไม่มี cache หรือหมดอายุ → ดึงจาก Firebase
      if (__DEV__) console.log('🔄 Starting to load fishing spots from Firebase...');
      const result = await FirebaseService.getFishingSpots();

      if (__DEV__) console.log('📊 Result:', result);

      if (result.success) {
        console.log('✅ Loaded fishing spots from Firebase:', result.spots.length);
        console.log('📋 Spots:', result.spots.map(s => s.spotName).join(', '));

        if (__DEV__) {
          if (result.spots.length > 0) {
            console.log('📍 Sample spot:', result.spots[0]);
          }
        }

        // 4. บันทึกลง AsyncStorage cache
        try {
          await AsyncStorage.setItem('fishing_spots_cache', JSON.stringify(result.spots));
          await AsyncStorage.setItem('fishing_spots_cache_time', now.toString());
          console.log('💾 Cached fishing spots data for 30 days');
        } catch (cacheError) {
          // ถ้า cache ไม่ได้ก็ไม่เป็นไร ยังใช้งานได้ปกติ
          console.error('⚠️ Failed to cache data:', cacheError);
        }

        setFishingSpots(result.spots);
      } else {
        console.error('❌ Failed to load:', result.error);
        Alert.alert('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลจุดจับปลาได้: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error loading fishing spots:', error);
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการโหลดข้อมูลจุดจับปลา: ' + error.message);
    } finally {
      setLoadingSpots(false);
    }
  };

  const handleSpotSelect = (spot) => {
    setSelectedSpot(spot);
    setCustomLocation(null); // รีเซ็ตพิกัดที่ปรับแล้ว
    setMapRegion({
      latitude: spot.latitude,
      longitude: spot.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
    // Update the location in context
    updateCurrentEntry({
      location: {
        spotName: spot.spotName,
        latitude: spot.latitude,
        longitude: spot.longitude,
        accuracy: 'spot_default'
      }
    });
  };


  const handleMapMarkerDrag = (e) => {
    setTempMarkerCoords(e.nativeEvent.coordinate);
  };

  const handleConfirmLocation = () => {
    if (!tempMarkerCoords || !selectedSpot) return;
    
    const newCustomLocation = {
      spotName: selectedSpot.spotName,
      originalLat: selectedSpot.latitude,
      originalLng: selectedSpot.longitude,
      actualLat: tempMarkerCoords.latitude,
      actualLng: tempMarkerCoords.longitude,
    };
    
    setCustomLocation(newCustomLocation);
    setShowMap(false);
    
    // อัปเดตข้อมูลใน context
    updateCurrentEntry({
      location: {
        spotName: selectedSpot.spotName,
        latitude: tempMarkerCoords.latitude,
        longitude: tempMarkerCoords.longitude,
        originalLatitude: selectedSpot.latitude,
        originalLongitude: selectedSpot.longitude,
        accuracy: 'user_adjusted'
      }
    });
  };

  const handleCancelMap = () => {
    setShowMap(false);
    setTempMarkerCoords(null);
  };


  const handleWeatherSelect = (weather) => {
    setLocalData({ ...localData, weather: weather });
  };

  const handleWaterSourceSelect = (source) => {
    setLocalData({ ...localData, waterSource: source });
  };

  const handleFishingGearSelect = (gear) => {
    setSelectedGear(gear);
    setGearDetails({ quantity: '', size: '', custom: '', meshSize: '', length: '', depth: '' });
    setShowGearModal(true);
  };

  // เลือกช่วงเวลาที่ออกจับปลา (กลางวัน/กลางคืน) เก็บใน startTime
  const handlePeriodSelect = (time) => {
    setLocalData({ ...localData, startTime: time });
  };

  const handleGearModalSave = () => {
    const gearData = {
      name: selectedGear,
      details: gearDetails
    };
    setLocalData({ ...localData, fishingGear: gearData });
    setShowGearModal(false);
  };

  const getGearDisplayText = () => {
    if (!localData.fishingGear) return '';

    const gear = localData.fishingGear;
    const details = gear.details || {};

    // แสดงรายละเอียดตามประเภทเครื่องมือ
    if (gear.name === 'อื่นๆ') {
      return `${details.custom || ''} ${details.quantity ? `จำนวน ${details.quantity}` : ''}`;
    } else if (gear.name === 'มอง' || gear.name === 'แห') {
      // มอง/แห: ขนาดตา, ความยาว, ความลึก, จำนวน
      const parts = [];
      if (details.meshSize) parts.push(`ขนาดตา ${details.meshSize} ซม.`);
      if (details.length) parts.push(`ยาว ${details.length} ม.`);
      if (details.depth) parts.push(`ลึก ${details.depth} ม.`);
      if (details.quantity) parts.push(`จำนวน ${details.quantity} ผืน`);
      return parts.join(' ');
    } else if (gear.name === 'เบ็ดน้ำเต้า') {
      // เบ็ดน้ำเต้า: เบอร์, จำนวน (เต้า)
      const parts = [];
      if (details.size) parts.push(`เบอร์ ${details.size}`);
      if (details.quantity) parts.push(`จำนวน ${details.quantity} เต้า`);
      return parts.join(' ');
    } else {
      // เครื่องมืออื่นๆ: แสดงเฉพาะจำนวน
      return details.quantity ? `จำนวน ${details.quantity}` : '';
    }
  };

  const handleDateChange = (event, selectedDate) => {
    console.log('handleDateChange called:', event, selectedDate);
    setShowDatePicker(false);
    if (selectedDate) {
      // แก้ปัญหา timezone: ใช้ setHours เพื่อกำหนดเวลาเป็นเที่ยงวันเพื่อหลีกเลี่ยงปัญหา timezone offset
      const normalizedDate = new Date(selectedDate);
      normalizedDate.setHours(12, 0, 0, 0);
      setLocalData({ ...localData, date: normalizedDate });
    }
  };

  // ฟังก์ชันสุ่มพิกัดในรัศมี 100-500 เมตร
  const randomizeLocation = (latitude, longitude) => {
    // สุ่มระยะทางระหว่าง 100-500 เมตร
    const minDistance = 100;
    const maxDistance = 500;
    const distance = minDistance + Math.random() * (maxDistance - minDistance);

    // สุ่มทิศทาง (0-360 องศา)
    const bearing = Math.random() * 360;

    // แปลงเป็น radian
    const bearingRad = (bearing * Math.PI) / 180;

    // รัศมีโลก (เมตร)
    const earthRadius = 6371000;

    // คำนวณพิกัดใหม่
    const latRad = (latitude * Math.PI) / 180;
    const lonRad = (longitude * Math.PI) / 180;

    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(distance / earthRadius) +
      Math.cos(latRad) * Math.sin(distance / earthRadius) * Math.cos(bearingRad)
    );

    const newLonRad = lonRad + Math.atan2(
      Math.sin(bearingRad) * Math.sin(distance / earthRadius) * Math.cos(latRad),
      Math.cos(distance / earthRadius) - Math.sin(latRad) * Math.sin(newLatRad)
    );

    // แปลงกลับเป็นองศา
    const newLat = (newLatRad * 180) / Math.PI;
    const newLon = (newLonRad * 180) / Math.PI;

    return { latitude: newLat, longitude: newLon };
  };

  const validateAndContinue = () => {
    if (!localData.waterSource) {
      Alert.alert('กรุณากรอกข้อมูลให้ครบถ้วน', 'กรุณาเลือกแหล่งน้ำ');
      return;
    }

    if (!localData.fishingGear || !localData.fishingGear.details?.quantity) {
      Alert.alert('กรุณาเลือกเครื่องมือ', 'กรุณาเลือกเครื่องมือที่ใช้ในการจับปลาและกรอกรายละเอียด');
      return;
    }

    // ตรวจสอบว่าได้เลือกจุดจับปลาแล้วหรือไม่
    if (!selectedSpot) {
      Alert.alert('กรุณาเลือกจุดจับปลา', 'กรุณาเลือกจุดจับปลาที่ต้องการบันทึก');
      return;
    }

    // สุ่มพิกัดในรัศมี 100-500 เมตร
    const originalLat = customLocation?.actualLat || selectedSpot.latitude;
    const originalLng = customLocation?.actualLng || selectedSpot.longitude;
    const randomizedCoords = randomizeLocation(originalLat, originalLng);

    // เพิ่ม location data พร้อมพิกัดที่สุ่มแล้ว
    const locationData = {
      spotName: customLocation?.spotName || selectedSpot.spotName,
      latitude: randomizedCoords.latitude,
      longitude: randomizedCoords.longitude,
      originalLatitude: originalLat,
      originalLongitude: originalLng,
      accuracy: 'randomized_100_500m'
    };

    const dataToUpdate = {
      ...localData,
      location: locationData
    };

    updateCurrentEntry(dataToUpdate);
    navigation.navigate('AddFish');
  };

  const formatTime = (time) => {
    if (!time) return 'เลือกเวลา';
    return time.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDateThai = (date) => {
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    
    const day = date.getDate();
    const month = thaiMonths[date.getMonth()];
    const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
    
    return `${day} ${month} ${year}`;
  };

  return (
    <ScreenContainer
      header={
        <CurvedHeader
          showBack={false}
          eyebrow="ขั้นที่ 1 จาก 3"
          title="บันทึกการจับปลา"
          subtitle="กรอกข้อมูลการออกจับของวันนี้"
        />
      }
    >
      <View style={styles.content}>
        {/* Date Selection */}
        <Section title="วันที่บันทึก">
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={styles.dateField}
            android_ripple={{ color: 'rgba(27,122,140,0.1)' }}
          >
            <Icon source="calendar" size={20} color={colors.riverMid} />
            <Text style={styles.dateFieldText}>{formatDateThai(localData.date)}</Text>
            <Icon source="chevron-down" size={20} color={colors.inkSoft} />
          </Pressable>
        </Section>

        {/* Water Source */}
        <Section title="แหล่งน้ำ" required>
          <Text style={styles.hint}>เลือก 1 แหล่ง</Text>
          <View style={styles.pillWrap}>
            {WATER_SOURCES.map(source => (
              <Pill
                key={source}
                label={source}
                selected={localData.waterSource === source}
                onPress={() => handleWaterSourceSelect(source)}
              />
            ))}
          </View>
        </Section>

        {/* Weather */}
        <Section title="สภาพอากาศ">
          <Text style={styles.hint}>เลือก 1 สภาพ</Text>
          <View style={styles.pillWrap}>
            {WEATHER_OPTIONS.map(weather => (
              <Pill
                key={weather}
                label={weather}
                selected={localData.weather === weather}
                onPress={() => handleWeatherSelect(weather)}
              />
            ))}
          </View>
        </Section>

        {/* Fishing Gear */}
        <Section title="เครื่องมือที่ใช้" required>
          <Text style={styles.hint}>เลือก 1 เครื่องมือ แล้วกรอกรายละเอียด</Text>
          <View style={styles.pillWrap}>
            {FISHING_GEAR.map(gear => (
              <Pill
                key={gear}
                label={gear}
                selected={localData.fishingGear?.name === gear}
                onPress={() => handleFishingGearSelect(gear)}
              />
            ))}
          </View>
          {localData.fishingGear && (
            <View style={styles.gearSummary}>
              <Icon source="information-outline" size={16} color={colors.riverMid} />
              <Text style={styles.gearSummaryText}>{getGearDisplayText()}</Text>
            </View>
          )}
        </Section>

        {/* Fishing Period */}
        <Section title="ช่วงเวลาที่ออกจับ">
          <Text style={styles.hint}>เลือก 1 ช่วง</Text>
          <View style={styles.timeRow}>
            {TIME_PERIODS.map(time => (
              <Pill
                key={time}
                label={time}
                selected={localData.startTime === time}
                onPress={() => handlePeriodSelect(time)}
                style={styles.timePill}
              />
            ))}
          </View>
        </Section>

        {/* Location Section */}
        <Section
          title="ตำแหน่งการจับปลา"
          required
          action={
            <Pressable
              onPress={async () => {
                try {
                  console.log('🗑️ Clearing fishing spots cache...');
                  await AsyncStorage.removeItem('fishing_spots_cache');
                  await AsyncStorage.removeItem('fishing_spots_cache_time');
                  console.log('✅ Cache cleared, loading fresh data...');
                  loadFishingSpots();
                  Alert.alert('สำเร็จ', 'กำลังโหลดจุดจับปลาใหม่จาก Firebase...');
                } catch (error) {
                  console.error('❌ Error clearing cache:', error);
                  Alert.alert('ข้อผิดพลาด', 'ไม่สามารถล้างข้อมูลได้: ' + error.message);
                }
              }}
              hitSlop={8}
            >
              <Text style={styles.refreshLink}>รีเฟรช</Text>
            </Pressable>
          }
        >
          <Text style={styles.hint}>พบ {fishingSpots.length} จุด · เลือก 1 จุด</Text>

          {loadingSpots ? (
            <Text style={styles.loadingText}>กำลังโหลดจุดจับปลา…</Text>
          ) : (
            <>
              <View style={styles.pillWrap}>
                {fishingSpots.map((spot) => (
                  <Pill
                    key={spot.id}
                    label={spot.spotName}
                    selected={selectedSpot?.id === spot.id}
                    onPress={() => handleSpotSelect(spot)}
                  />
                ))}
              </View>

              {selectedSpot && (
                <View style={styles.coordBox}>
                  <Text style={styles.coordLabel}>พิกัด</Text>
                  <Text style={styles.coordValue}>
                    {customLocation
                      ? `${customLocation.actualLat.toFixed(6)}, ${customLocation.actualLng.toFixed(6)}`
                      : `${selectedSpot.latitude?.toFixed(6)}, ${selectedSpot.longitude?.toFixed(6)}`}
                  </Text>
                </View>
              )}
            </>
          )}
        </Section>

        {/* Continue Button */}
        <PrimaryButton
          variant="simple"
          title="เพิ่มรายการปลา"
          icon="arrow-right"
          onPress={validateAndContinue}
          style={styles.continueSpacing}
        />

        {/* Date/Time Pickers */}
        {showDatePicker && (
          <Modal
            visible={showDatePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text variant="titleMedium" style={styles.modalTitle}>
                  เลือกวันที่
                </Text>
                <DateTimePicker
                  value={localData.date}
                  mode="date"
                  display={Platform.select({
                    ios: 'spinner',
                    android: 'spinner',
                    default: 'default'
                  })}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  style={styles.dateTimePicker}
                  locale="th-TH"
                  textColor={Platform.OS === 'ios' ? '#000' : undefined}
                  accentColor={colors.riverMid}
                />
                <View style={styles.modalButtons}>
                  <Button 
                    mode="outlined" 
                    onPress={() => setShowDatePicker(false)}
                    style={styles.modalButton}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => setShowDatePicker(false)}
                    style={styles.modalButton}
                    buttonColor={colors.riverDeep}
                  >
                    ตกลง
                  </Button>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Fishing Gear Details Modal */}
        {showGearModal && (
          <Modal
            visible={showGearModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowGearModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text variant="titleMedium" style={styles.modalTitle}>
                  รายละเอียดเครื่องมือ
                </Text>
                <Text variant="bodyMedium" style={styles.selectedGearText}>
                  {selectedGear}
                </Text>

                <ScrollView
                  style={styles.modalScrollView}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
                >
                {/* Input fields based on gear type */}
                {selectedGear === 'มอง' || selectedGear === 'แห' ? (
                  <>
                    <TextInput
                      label="ขนาดตา (ซม.)"
                      value={gearDetails.meshSize}
                      onChangeText={(value) => setGearDetails({...gearDetails, meshSize: value})}
                      mode="outlined"
                      style={styles.modalInput}
                      placeholder="เช่น 4, 12, 14"
                    />
                    <TextInput
                      label="ความยาว (ม.)"
                      value={gearDetails.length}
                      onChangeText={(value) => setGearDetails({...gearDetails, length: value})}
                      mode="outlined"
                      style={styles.modalInput}
                      placeholder="เช่น 280, 300, 600"
                    />
                    <TextInput
                      label="ความลึก (ม.)"
                      value={gearDetails.depth}
                      onChangeText={(value) => setGearDetails({...gearDetails, depth: value})}
                      mode="outlined"
                      style={styles.modalInput}
                      placeholder="เช่น 1.74, 0.94"
                    />
                    <TextInput
                      label="จำนวน (ผืน)"
                      value={gearDetails.quantity}
                      onChangeText={(value) => setGearDetails({...gearDetails, quantity: value})}
                      mode="outlined"
                      style={styles.modalInput}
                    />
                  </>
                ) : selectedGear === 'เบ็ดน้ำเต้า' ? (
                  <>
                    <TextInput
                      label="เบอร์"
                      value={gearDetails.size}
                      onChangeText={(value) => setGearDetails({...gearDetails, size: value})}
                      mode="outlined"
                      style={styles.modalInput}
                      placeholder="เช่น 1, 2, 3"
                    />
                    <TextInput
                      label="จำนวน (เต้า)"
                      value={gearDetails.quantity}
                      onChangeText={(value) => setGearDetails({...gearDetails, quantity: value})}
                      mode="outlined"
                      style={styles.modalInput}
                    />
                  </>
                ) : selectedGear === 'อื่นๆ' ? (
                  <>
                    <TextInput
                      label="ระบุเครื่องมือ"
                      value={gearDetails.custom}
                      onChangeText={(value) => setGearDetails({...gearDetails, custom: value})}
                      mode="outlined"
                      style={styles.modalInput}
                      placeholder="ระบุชื่อเครื่องมือ"
                    />
                    <TextInput
                      label="จำนวน"
                      value={gearDetails.quantity}
                      onChangeText={(value) => setGearDetails({...gearDetails, quantity: value})}
                      mode="outlined"
                      style={styles.modalInput}
                    />
                  </>
                ) : (
                  <TextInput
                    label="จำนวน"
                    value={gearDetails.quantity}
                    onChangeText={(value) => setGearDetails({...gearDetails, quantity: value})}
                    mode="outlined"
                    style={styles.modalInput}
                  />
                )}
                </ScrollView>

                <View style={styles.modalButtons}>
                  <Button 
                    mode="outlined" 
                    onPress={() => setShowGearModal(false)}
                    style={styles.modalButton}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleGearModalSave}
                    style={styles.modalButton}
                    buttonColor={colors.riverDeep}
                    disabled={
                      !gearDetails.quantity ||
                      (selectedGear === 'เบ็ดน้ำเต้า' && !gearDetails.size) ||
                      (selectedGear === 'อื่นๆ' && !gearDetails.custom)
                    }
                  >
                    บันทึก
                  </Button>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Map Modal */}
        {showMap && (
          <Modal
            visible={showMap}
            animationType="slide"
            onRequestClose={handleCancelMap}
          >
            <View style={styles.mapContainer}>
              <View style={[styles.mapHeader, { paddingTop: insets.top + spacing.sm }]}>
                <Text variant="titleLarge" style={styles.mapTitle}>
                  ปรับตำแหน่งการจับปลา
                </Text>
                <Text variant="bodyMedium" style={styles.mapSubtitle}>
                  ลากปิ่นเพื่อระบุตำแหน่งที่แท้จริง
                </Text>
              </View>
              
              <MapPlaceholder
                style={styles.map}
                markerCoordinate={tempMarkerCoords || {
                  latitude: selectedSpot?.latitude || 0,
                  longitude: selectedSpot?.longitude || 0
                }}
                onMarkerDrag={handleMapMarkerDrag}
                markerTitle={selectedSpot?.spotName}
              />
              
              <View style={[styles.mapFooter, { paddingBottom: insets.bottom + spacing.lg }]}>
                <View style={styles.coordinateDisplay}>
                  <Text variant="bodyMedium" style={styles.coordinateLabel}>
                    พิกัดปัจจุบัน:
                  </Text>
                  <Text variant="bodySmall" style={styles.coordinateValue}>
                    {tempMarkerCoords ? 
                      `${tempMarkerCoords.latitude.toFixed(6)}, ${tempMarkerCoords.longitude.toFixed(6)}` :
                      'กำลังโหลด...'
                    }
                  </Text>
                </View>
                
                <View style={styles.mapButtons}>
                  <Button
                    mode="outlined"
                    onPress={handleCancelMap}
                    style={styles.mapCancelButton}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleConfirmLocation}
                    style={styles.mapConfirmButton}
                    buttonColor={colors.riverDeep}
                  >
                    ยืนยันตำแหน่ง
                  </Button>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },

  // Header band
  header: {
    backgroundColor: colors.riverDeep,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  stepLabel: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  headerTitle: {
    color: colors.surface,
    fontSize: 25,
    fontWeight: '800',
    marginTop: 4,
  },
  headerSub: {
    color: 'rgba(242,237,228,0.75)',
    fontSize: 14,
    marginTop: 4,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Section panel (quiet hairline, no shadow)
  hint: {
    color: colors.inkSoft,
    fontSize: 13,
    marginBottom: 10,
  },

  // Date field
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  dateFieldText: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },

  // Pills
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timePill: {
    flex: 1,
    alignItems: 'center',
  },

  // Gear summary
  gearSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  gearSummaryText: {
    flex: 1,
    color: colors.riverDeep,
    fontSize: 13.5,
    fontWeight: '600',
  },


  // Location
  refreshLink: {
    color: colors.riverMid,
    fontSize: 14,
    fontWeight: '700',
  },
  loadingText: {
    color: colors.inkSoft,
    textAlign: 'center',
    paddingVertical: 16,
  },
  coordBox: {
    marginTop: 14,
    backgroundColor: colors.sand,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  coordLabel: {
    color: colors.inkSoft,
    fontSize: 12,
    marginBottom: 2,
  },
  coordValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // Continue button
  continueSpacing: {
    marginTop: 8,
    marginBottom: 24,
  },

  // ── Modals (date/time, gear) ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18,48,56,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    padding: 22,
    borderRadius: 20,
    width: '86%',
    alignItems: 'center',
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 14,
    color: colors.ink,
    fontWeight: '800',
    fontSize: 18,
  },
  selectedGearText: {
    marginBottom: 16,
    color: colors.riverMid,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalInput: {
    marginBottom: 12,
    width: '100%',
    backgroundColor: '#fff',
  },
  modalScrollView: {
    width: '100%',
    maxHeight: 400,
  },
  modalScrollContent: {
    paddingBottom: 10,
  },
  dateTimePicker: {
    width: '100%',
    marginVertical: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    minWidth: 80,
  },

  // ── Map Modal ──
  mapContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  mapHeader: {
    padding: 16,
    backgroundColor: colors.riverDeep,
  },
  mapTitle: {
    color: colors.surface,
    fontWeight: '800',
    marginBottom: 4,
  },
  mapSubtitle: {
    color: 'rgba(242,237,228,0.8)',
    fontSize: 14,
  },
  map: {
    flex: 1,
  },
  mapFooter: {
    padding: 16,
    backgroundColor: colors.sand,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  coordinateDisplay: {
    marginBottom: 16,
  },
  coordinateLabel: {
    fontWeight: '600',
    marginBottom: 4,
    color: colors.ink,
  },
  coordinateValue: {
    fontVariant: ['tabular-nums'],
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    color: colors.ink,
  },
  mapButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mapCancelButton: {
    flex: 1,
  },
  mapConfirmButton: {
    flex: 1,
  },
});