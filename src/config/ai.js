import Constants from 'expo-constants';

/**
 * ค่าตั้งต้นของ AI Fish Classifier (เฟส 2)
 * อ่าน AI_API_URL จาก .env → app.config.js (extra.aiApiUrl) → ที่นี่
 *
 * บนมือถือจริงต้องเป็น LAN IP ของเครื่องที่รัน fish_api.py (ไม่ใช่ localhost)
 *   ตัวอย่าง .env:  AI_API_URL=http://192.168.1.50:8000
 */
const AI_API_URL = Constants.expoConfig?.extra?.aiApiUrl || '';

// ตรงกับ confidence_threshold ใน species_catalog.json ฝั่ง fish_image
// (ต่ำกว่านี้ = ความมั่นใจไม่พอ ควรให้ผู้ใช้ยืนยัน/เลือกเอง)
export const AI_CONFIG = {
  apiUrl: AI_API_URL.replace(/\/+$/, ''), // ตัด trailing slash
  predictPath: '/predict',
  timeoutMs: 20000, // โมเดลบนเครื่อง dev อาจช้ารอบแรก
  // ย่อรูปก่อนส่งเพื่อลด payload/เวลาอัปโหลด (โมเดล resize เป็น 224 อยู่แล้ว)
  uploadMaxWidth: 1024,
  uploadQuality: 0.8,
};

export const isAIConfigured = () => Boolean(AI_CONFIG.apiUrl);
