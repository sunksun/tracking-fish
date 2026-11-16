import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Icon } from 'react-native-paper';

import { colors, radius } from '../theme';

// ปุ่มหลักสไตล์ River (พื้น riverDeep) — รองรับ 2 แบบ:
//   variant="rich"   (default) — กล่องไอคอน + หัวข้อ + คำอธิบาย + chevron (แบบหน้า Home)
//   variant="simple"           — ปุ่มกึ่งกลาง หัวข้อ + ไอคอนท้าย (แบบปุ่มต่อไปใน DataEntry)
// ดึงมาจาก primaryAction (Home) และ continueButton (DataEntry)
export default function PrimaryButton({
  title,
  subtitle,
  icon,
  onPress,
  variant = 'rich',
  style,
}) {
  if (variant === 'simple') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.simple, pressed && styles.pressed, style]}
        android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
      >
        <Text style={styles.simpleText}>{title}</Text>
        {icon ? <Icon source={icon} size={22} color={colors.surface} /> : null}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.rich, pressed && styles.pressed, style]}
      android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
    >
      {icon ? (
        <View style={styles.richIcon}>
          <Icon source={icon} size={26} color={colors.surface} />
        </View>
      ) : null}
      <View style={styles.richTextWrap}>
        <Text style={styles.richTitle}>{title}</Text>
        {subtitle ? <Text style={styles.richSub}>{subtitle}</Text> : null}
      </View>
      <Icon source="chevron-right" size={26} color="rgba(251,249,245,0.7)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    backgroundColor: colors.riverDeepPressed,
  },

  // variant="rich"
  rich: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.riverDeep,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  richIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(232,163,61,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  richTextWrap: {
    flex: 1,
  },
  richTitle: {
    color: colors.surface,
    fontSize: 17,
    fontWeight: '800',
  },
  richSub: {
    color: 'rgba(242,237,228,0.72)',
    fontSize: 13,
    marginTop: 2,
  },

  // variant="simple"
  simple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.riverDeep,
    borderRadius: radius.card,
    paddingVertical: 17,
  },
  simpleText: {
    color: colors.surface,
    fontSize: 17,
    fontWeight: '800',
  },
});
