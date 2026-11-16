import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { paperTheme, colors } from './src/theme';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { FishingDataProvider } from './src/contexts/FishingDataContext';
import SimpleLoginScreen from './src/screens/SimpleLoginScreen';
import SelectFisherScreen from './src/screens/SelectFisherScreen';
import SelectFishSpeciesScreen from './src/screens/SelectFishSpeciesScreen';
import HomeScreen from './src/screens/HomeScreen';
import DataEntryScreen from './src/screens/DataEntryScreen';
import AddFishScreen from './src/screens/AddFishScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ทุกหน้าใช้ CurvedHeader ของตัวเอง → ปิด native header ทั้งหมด
const stackScreenOptions = {
  headerShown: false,
};

// ----- Stack ของแต่ละแท็บ -----

// แท็บหน้าหลัก: หน้าหลัก + เลือกชาวประมง (flow เลือกชาวประมงเป็นเรื่องของหน้าหลัก)
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SelectFisher"
        component={SelectFisherScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// แท็บจำแนกปลา: ดูชนิดปลา/จำแนกด้วย AI (standalone — ไม่ผูกกับ flow บันทึก)
function ClassifyStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="SelectFishSpecies"
        component={SelectFishSpeciesScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// แท็บบันทึกการจับ: flow กรอกข้อมูล → เพิ่มปลา (เลือกชนิด) → สรุป
// PickFishSpecies = SelectFishSpecies ในโหมดเลือกชนิด (คนละ instance กับแท็บจำแนก)
function RecordStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="DataEntry"
        component={DataEntryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddFish"
        component={AddFishScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SelectFishSpecies"
        component={SelectFishSpeciesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Summary"
        component={SummaryScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// แท็บประวัติ
function HistoryStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// ซ่อน tab bar เมื่ออยู่ลึกใน flow บันทึก (กรอก/เพิ่มปลา/สรุป) ให้พื้นที่เต็มจอ
function hideTabBarOnDeepScreens(route) {
  // route root ของ RecordTab คือ DataEntry — โชว์ tab bar ได้
  // ลึกกว่านั้น (AddFish/SelectFishSpecies/Summary) ซ่อน
  const name = route.state?.routes?.[route.state.index]?.name;
  if (name && name !== 'DataEntry') {
    return { display: 'none' };
  }
  return undefined;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.riverMid,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.hairline,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: 'หน้าหลัก',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="RecordTab"
        component={RecordStack}
        options={({ route }) => ({
          tabBarLabel: 'บันทึกการจับ',
          tabBarStyle: hideTabBarOnDeepScreens(route),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="plus-circle" color={color} size={size} />
          ),
        })}
      />
      <Tab.Screen
        name="ClassifyTab"
        component={ClassifyStack}
        options={{
          tabBarLabel: 'จำแนกปลา',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="camera" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryStack}
        options={{
          tabBarLabel: 'ประวัติ',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <Stack.Navigator>
          <Stack.Screen
            name="Login"
            component={SimpleLoginScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      ) : (
        <MainTabs />
      )}
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <AuthProvider>
          <FishingDataProvider>
            <AppNavigator />
          </FishingDataProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
