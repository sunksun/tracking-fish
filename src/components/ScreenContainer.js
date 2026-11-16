import { useContext } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';

import { colors, spacing } from '../theme';

// อ่านความสูง tab bar แบบปลอดภัย — คืน 0 เมื่ออยู่นอก tab navigator
// (เช่นหน้า Login หรือหน้าลึกที่ซ่อน tab bar) แทนที่จะ throw แบบ useBottomTabBarHeight()
function useTabBarHeightSafe() {
  return useContext(BottomTabBarHeightContext) ?? 0;
}

// Wrapper มาตรฐานของทุกหน้า — จัดการ safe-area ให้ครบ:
//   - top: ปล่อยให้ header (CurvedHeader) จัดการผ่าน insets.top ของตัวเอง
//           ถ้าไม่มี header จะใส่ paddingTop = insets.top ให้เอง
//   - bottom: paddingBottom = max(insets.bottom, tabBarHeight) + spacing
//              → พ้นทั้งแถบนำทางระบบ และ tab bar (ซึ่งอาจถูกซ่อน = 0)
export default function ScreenContainer({
  children,
  header,
  scroll = true,
  contentContainerStyle,
  style,
  bottomSpacing = spacing.xxl,
  ...rest
}) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeightSafe();

  const bottomPad = Math.max(insets.bottom, tabBarHeight) + bottomSpacing;
  const topPad = header ? 0 : insets.top;

  if (scroll) {
    return (
      <View style={[styles.root, style]}>
        {header}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            { paddingTop: topPad, paddingBottom: bottomPad },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          {...rest}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, style]}>
      {header}
      <View
        style={[styles.flex, { paddingTop: topPad, paddingBottom: bottomPad }, contentContainerStyle]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  flex: {
    flex: 1,
  },
});
