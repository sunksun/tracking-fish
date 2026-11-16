import { useContext } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';

import { spacing } from '../theme';

// ระยะ padding ล่างที่พ้นทั้งแถบนำทางระบบ และ tab bar (ซึ่งอาจถูกซ่อน = 0)
// ใช้กับ contentContainerStyle ของ ScrollView/FlatList ในหน้าที่ยังไม่ย้ายไป ScreenContainer
export default function useBottomInset(extra = spacing.xxl) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  return Math.max(insets.bottom, tabBarHeight) + extra;
}
