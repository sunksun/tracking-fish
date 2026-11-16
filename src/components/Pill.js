import { StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';

import { colors, radius } from '../theme';

// Pill เลือกได้ (แทน Paper Chip) — พื้น teal wash เมื่อถูกเลือก อ่านง่ายกลางแดด
// ดึงมาจาก Pill ที่เคยเขียน inline ใน DataEntryScreen
export default function Pill({ label, selected, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, selected && styles.pillSelected, style]}
      android_ripple={{ color: 'rgba(27,122,140,0.12)' }}
    >
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  pillSelected: {
    backgroundColor: colors.tealWash,
    borderColor: colors.riverMid,
  },
  pillText: {
    color: colors.inkSoft,
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: colors.riverDeep,
    fontWeight: '800',
  },
});
