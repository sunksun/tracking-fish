import { MD3LightTheme } from 'react-native-paper';

import colors from './colors';
import spacing from './spacing';
import radius from './radius';
import typography from './typography';

export { colors, spacing, radius, typography };

// Paper MD3 theme ที่ปรับให้เข้ากับ River palette
// ทำให้ Button/TextInput/Chip ของ Paper ดึงสี River มาเองโดยไม่ต้องส่ง prop รายจุด
export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.riverDeep,
    secondary: colors.riverMid,
    error: colors.clay,
    background: colors.sand,
    surface: colors.surface,
    outline: colors.hairline,
  },
};

export default { colors, spacing, radius, typography, paperTheme };
