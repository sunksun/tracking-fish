# model-species-map.json — แมปผลโมเดล AI → ชนิดปลาในแอป

ไฟล์นี้เชื่อม **ผลลัพธ์ของโมเดลจำแนกปลา** (ดัชนี 0–8) เข้ากับ **ชนิดปลาในแอป** (Firestore collection `fish_species`)

## ที่มา
- โมเดล: `fish_model.keras` (MobileNetV2, เทรนจาก 9 ชนิดที่มีข้อมูล ≥3 ตัว) ในโปรเจกต์ `fish_image`
- สร้างจาก `fish_image/label_map.json` + แคตาล็อกคู่มือคีย์ปลาน้ำโขง (catalog_number)
- ต้นฉบับอยู่ที่ `fish_image/exports/model-species-map.json`

## โครงสร้าง
```jsonc
{
  "num_classes": 9,
  "preprocessing": { "input_size": [224,224], "preprocess": "mobilenet_v2.preprocess_input" },
  "confidence_threshold": 0.60,   // ต่ำกว่านี้ = "ไม่แน่ใจ ให้ผู้ใช้เลือกเอง"
  "classes": [
    {
      "model_index": 0,              // index ที่โมเดลคืนมา (argmax)
      "scientific_name": "...",      // ★ กุญแจหลักในการจับคู่กับ Firestore
      "common_name_thai": "...",
      "local_name": "...",
      "catalog_number": 13
    }
  ]
}
```

## วิธีใช้ (แนวทางในเฟส 2)
1. โมเดลคืนค่า `model_index` + ความมั่นใจ
2. หา entry ใน `classes` ที่ `model_index` ตรงกัน
3. จับคู่ `scientific_name` กับ species ใน Firestore `fish_species` → ได้ `doc.id`
4. pre-select ชนิดนั้นในหน้า `SelectFishSpecies` (ผู้ใช้ยืนยัน/แก้ได้)
5. ถ้าความมั่นใจ < `confidence_threshold` → ไม่ pre-select, แจ้ง "ไม่แน่ใจ กรุณาเลือกเอง"

## ทำไมใช้ `scientific_name` เป็นกุญแจ
- ไม่ซ้ำและคงที่ (ชื่อไทย/ท้องถิ่นมีหลายสะกด/หลายชื่อ)
- ใช้ได้ทั้งกับ `fish-data.json` (bundled 101 ชนิด) และ Firestore (~312 ชนิด)
- หมายเหตุ: 9 ชนิดของโมเดลอยู่ใน bundled 4 ชนิด อีก 5 ชนิดอยู่ใน Firestore เท่านั้น
  จึงควร resolve ตอน runtime จาก Firestore (fallback ไป bundled ได้)

## ข้อจำกัดปัจจุบัน
- โมเดลรู้จักแค่ **9 จาก ~312 ชนิด** → ตั้ง threshold + วาง AI เป็น "ผู้ช่วยแนะนำ" เท่านั้น
- เมื่อเทรนโมเดลใหม่ (ชนิดเพิ่ม/แม่นขึ้น) ให้ regenerate ไฟล์นี้จาก `fish_image` แล้ว copy มาทับ
