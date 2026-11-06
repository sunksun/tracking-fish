import * as ImageManipulator from 'expo-image-manipulator';
import { AI_CONFIG, isAIConfigured } from '../config/ai';
import modelSpeciesMap from '../data/model-species-map.json';

/**
 * AIService — เฟส 2: เรียก fish_api (/predict) เพื่อจำแนกชนิดปลาจากรูป
 *
 * flow:  รูป (uri) → ย่อ → POST multipart → แมปผลด้วย scientific_name → คืนผลให้ UI
 * ผลที่คืน ออกแบบให้ SelectFishSpeciesScreen เอาไป pre-select ได้ทันที
 *
 * หมายเหตุ: จับคู่ด้วย scientific_name (กุญแจหลักตาม model-species-map.README.md)
 * ไม่พึ่ง model_index ล้วน เพื่อกันแมปผิดเวลาเทรนโมเดลใหม่
 */
export class AIService {
  static get threshold() {
    return modelSpeciesMap.confidence_threshold ?? 0.6;
  }

  /** ชนิดทั้งหมดที่โมเดลรู้จัก (ให้ UI โชว์รายการ/ตรวจว่ารองรับไหม) */
  static getKnownClasses() {
    return modelSpeciesMap.classes || [];
  }

  /** ย่อรูปก่อนส่ง (โมเดล resize 224 อยู่แล้ว ไม่ต้องส่งภาพใหญ่) */
  static async _compress(uri) {
    try {
      const out = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: AI_CONFIG.uploadMaxWidth } }],
        { compress: AI_CONFIG.uploadQuality, format: ImageManipulator.SaveFormat.JPEG }
      );
      return out.uri;
    } catch (e) {
      console.warn('AIService: ย่อรูปไม่สำเร็จ ใช้ไฟล์เดิม', e);
      return uri;
    }
  }

  /**
   * จำแนกปลาจากรูป
   * @param {string} imageUri - uri ของรูป (จากกล้อง/คลัง)
   * @returns {Promise<{ok:boolean, error?:string, predictions?:Array, top?:object, belowThreshold?:boolean, threshold?:number}>}
   *   แต่ละ prediction: { modelIndex, confidence, scientificName, commonNameThai, localName, catalogNumber, speciesId }
   */
  static async classify(imageUri) {
    if (!isAIConfigured()) {
      return { ok: false, error: 'ยังไม่ได้ตั้งค่า AI_API_URL (ดู .env.example)' };
    }
    if (!imageUri) {
      return { ok: false, error: 'ไม่มีรูปภาพ' };
    }

    const uri = await this._compress(imageUri);
    const form = new FormData();
    form.append('file', {
      uri,
      name: 'fish.jpg',
      type: 'image/jpeg',
    });

    const url = AI_CONFIG.apiUrl + AI_CONFIG.predictPath;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_CONFIG.timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        body: form,
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const err = await res.json();
          if (err?.detail) detail = err.detail;
        } catch (_) { /* ไม่ใช่ json */ }
        return { ok: false, error: detail };
      }

      const data = await res.json();
      const predictions = (data.predictions || []).map((p) => this._normalize(p));
      return {
        ok: true,
        predictions,
        top: predictions[0] || null,
        belowThreshold: Boolean(data.below_threshold),
        threshold: data.confidence_threshold ?? this.threshold,
        message: data.message || '',
      };
    } catch (e) {
      clearTimeout(timer);
      if (e.name === 'AbortError') {
        return { ok: false, error: 'หมดเวลาเชื่อมต่อ AI (ตรวจว่าเซิร์ฟเวอร์รันอยู่และ IP ถูก)' };
      }
      return { ok: false, error: `เชื่อมต่อ AI ไม่ได้: ${e.message}` };
    }
  }

  /** แปลงผลดิบจาก API + เสริมข้อมูลจาก model-species-map (เผื่อ API เวอร์ชันเก่าไม่ส่งครบ) */
  static _normalize(p) {
    const fromMap = (modelSpeciesMap.classes || []).find(
      (c) => c.model_index === p.model_index
    ) || {};
    return {
      modelIndex: p.model_index,
      confidence: p.confidence,
      confidencePercent: Math.round((p.confidence || 0) * 1000) / 10,
      scientificName: p.scientific_name || fromMap.scientific_name || '',
      commonNameThai: p.common_name_thai || fromMap.common_name_thai || '',
      localName: p.local_name || fromMap.local_name || '',
      catalogNumber: p.catalog_number ?? fromMap.catalog_number ?? null,
      speciesId: p.species_id || fromMap.species_id || '',
    };
  }

  // ชื่อ field ที่อาจเก็บ scientific name ใน species ของแอป (Firestore/bundled ใช้ไม่เหมือนกัน)
  static SCI_FIELDS = ['scientificName', 'scientific_name', 'scientific_binomial', 'sciName'];

  /** อ่าน scientific name จาก species object ไม่ว่าจะเก็บด้วย key ไหน */
  static _sciOf(species) {
    for (const f of this.SCI_FIELDS) {
      if (species?.[f]) return species[f];
    }
    return '';
  }

  /**
   * จับคู่ผล AI กับรายการ species ของแอป โดยใช้ scientific name
   * @param {object} prediction - ผล normalize แล้ว (มี scientificName)
   * @param {Array} speciesList - รายการ species ในแอป (เช่นจาก Firebase getAllFishSpecies)
   * @returns species ที่ตรง หรือ null
   */
  static matchSpecies(prediction, speciesList = []) {
    if (!prediction?.scientificName) return null;
    const target = this._normSci(prediction.scientificName);
    if (!target) return null;
    return speciesList.find((s) => this._normSci(this._sciOf(s)) === target) || null;
  }

  /** ปรับ scientific name ให้เทียบกันได้ (ตัด author/ปี/วงเล็บ, ช่องว่างซ้ำ, ตัวพิมพ์) */
  static _normSci(name) {
    if (!name) return '';
    const cleaned = String(name)
      .replace(/[()]/g, ' ')          // ตัดวงเล็บ เช่น "(Pangasianodon ... )" ใน Firestore
      .replace(/\s+/g, ' ')
      .trim();
    // เอาแค่ 2 คำแรก (genus species) ตัด author เช่น "Fang & Chaux, 1949"
    return cleaned.split(' ').slice(0, 2).join(' ').toLowerCase();
  }
}
