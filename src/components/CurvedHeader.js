import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors, spacing, radius } from '../theme';

// แถบหัวโค้งมนสีน้ำเงินเข้ม (riverDeep) — ใช้แทน native header ทุกหน้า
// รองรับ 2 โหมด:
//   1) ส่ง title/eyebrow/subtitle/right → แถบหัวแบบมาตรฐาน (หน้า detail/legacy)
//   2) ส่ง children → เนื้อหาอิสระ (เช่นหน้า Home ที่มีชื่อผู้ใช้/สถานะ)
// แสดงปุ่ม back อัตโนมัติเมื่อ navigation.canGoBack() (ปิดได้ด้วย showBack={false})
export default function CurvedHeader({
  title,
  eyebrow,
  subtitle,
  right,
  children,
  showBack,
  onBack,
  style,
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();
  const displayBack = showBack !== undefined ? showBack : canGoBack;

  const handleBack = () => {
    if (onBack) return onBack();
    if (canGoBack) navigation.goBack();
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.lg }, style]}>
      {children ? (
        children
      ) : (
        <View style={styles.row}>
          {displayBack && (
            <Pressable
              onPress={handleBack}
              hitSlop={10}
              android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}
              style={styles.backBtn}
            >
              <Icon source="chevron-left" size={28} color={colors.surface} />
            </Pressable>
          )}
          <View style={styles.titleWrap}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            {title ? (
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            ) : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.riverDeep,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xxl,
    borderBottomLeftRadius: radius.band,
    borderBottomRightRadius: radius.band,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: spacing.sm,
    marginLeft: -spacing.xs,
  },
  titleWrap: {
    flex: 1,
  },
  eyebrow: {
    color: colors.onRiver,
    fontSize: 13,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  title: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
  },
  subtitle: {
    color: 'rgba(242,237,228,0.8)',
    fontSize: 13.5,
    marginTop: 6,
    lineHeight: 19,
  },
  right: {
    marginLeft: spacing.md,
  },
});
