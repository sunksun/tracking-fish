import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import { colors, radius } from '../theme';

// ตัวเลขใหญ่มาก่อน ป้ายเล็กอยู่ใต้ — ตัวเลขคือพระเอกของหน้า
// ดึงมาจาก StatTile ที่เคยเขียน inline ใน HomeScreen
export default function StatTile({ value, unit, label, accent, big, style }) {
  return (
    <View style={[styles.statTile, style]}>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, big && styles.statValueBig, { color: accent }]}>
          {value}
        </Text>
        {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statTile: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  statValueBig: {
    fontSize: 36,
  },
  statUnit: {
    color: colors.inkSoft,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 5,
  },
  statLabel: {
    color: colors.inkSoft,
    fontSize: 13,
    marginTop: 6,
  },
});
