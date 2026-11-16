import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import { colors, spacing, radius } from '../theme';

// แผงเนื้อหาเงียบ ขอบ hairline มีหัวข้อ + จุดบังคับกรอก (optional)
// ดึงมาจาก Section ที่เคยเขียน inline ใน DataEntryScreen
export default function Panel({ title, required, children, action, style }) {
  return (
    <View style={[styles.panel, style]}>
      {(title || action) && (
        <View style={styles.panelHead}>
          <View style={styles.panelTitleWrap}>
            {title ? <Text style={styles.panelTitle}>{title}</Text> : null}
            {required && <View style={styles.reqDot} />}
          </View>
          {action}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  panelTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  reqDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.gold,
    marginLeft: 7,
  },
});
