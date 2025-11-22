import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

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

function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <Stack.Screen 
            name="Login" 
            component={SimpleLoginScreen} 
            options={{ 
              title: 'เข้าสู่ระบบ',
              headerShown: false 
            }}
          />
        ) : (
          // Main App Stack
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'ติดตามการจับปลาแม่น้ำโขง' }}
            />
            <Stack.Screen
              name="SelectFisher"
              component={SelectFisherScreen}
              options={{ title: 'เลือกชาวประมง' }}
            />
            <Stack.Screen
              name="SelectFishSpecies"
              component={SelectFishSpeciesScreen}
              options={{ title: 'เลือกชนิดปลา' }}
            />
            <Stack.Screen
              name="DataEntry"
              component={DataEntryScreen}
              options={{ title: 'บันทึกข้อมูลการจับปลา' }}
            />
            <Stack.Screen
              name="AddFish"
              component={AddFishScreen}
              options={{ title: 'เพิ่มรายการปลา' }}
            />
            <Stack.Screen
              name="Summary"
              component={SummaryScreen}
              options={{ title: 'สรุปและยืนยันข้อมูล' }}
            />
            <Stack.Screen
              name="History"
              component={HistoryScreen}
              options={{ title: 'ประวัติการจับปลา' }}
            />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <FishingDataProvider>
            <AppNavigator />
          </FishingDataProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
