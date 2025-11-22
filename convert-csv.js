const fs = require('fs');
const path = require('path');

// อ่านไฟล์ CSV
const csvPath = './src/utils/fish271.csv';
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// แปลง CSV เป็น array
const lines = csvContent.trim().split('\n');
const fishData = [];

lines.forEach((line, index) => {
  // แยกข้อมูลตาม comma แต่ต้องจัดการกับ quoted fields
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  fields.push(currentField.trim()); // เพิ่ม field สุดท้าย
  
  // สร้าง object ปลา
  if (fields.length >= 12) {
    const fish = {
      id: parseInt(fields[0]) || index + 1,
      name: fields[1] || '',
      localNames: fields[2] || '',
      scientificName: fields[3] || '',
      minSize: fields[4] || '',
      maxSize: fields[5] || '',
      weight: fields[6] || '',
      food: fields[7] || '',
      habitat: fields[8] || '',
      season: fields[9] || '',
      fishingGear: fields[10] || '',
      marketPrice: fields[11] || ''
    };
    
    fishData.push(fish);
  }
});

// สร้างเนื้อหาไฟล์ JavaScript
const jsContent = `// ข้อมูลปลาแม่น้ำโขง ${fishData.length} ชนิด
// แปลงจากไฟล์ fish271.csv

export const FISH_DATA = ${JSON.stringify(fishData, null, 2)};

// ฟังก์ชันค้นหาปลาตามชื่อ
export const searchFish = (query) => {
  if (!query || query.length < 2) return [];
  
  const searchTerm = query.toLowerCase().trim();
  
  return FISH_DATA.filter(fish => 
    fish.name.toLowerCase().includes(searchTerm) ||
    fish.localNames.toLowerCase().includes(searchTerm) ||
    fish.scientificName.toLowerCase().includes(searchTerm)
  ).slice(0, 15); // จำกัดผลลัพธ์ไม่เกิน 15 รายการ
};

// ฟังก์ชันหาข้อมูลปลาจาก ID
export const getFishById = (id) => {
  return FISH_DATA.find(fish => fish.id === id);
};

// ฟังก์ชันหาข้อมูลปลาจากชื่อ (exact match)
export const getFishByName = (name) => {
  return FISH_DATA.find(fish => 
    fish.name.toLowerCase() === name.toLowerCase() ||
    fish.localNames.toLowerCase().includes(name.toLowerCase())
  );
};

// ฟังก์ชันแสดงรายชื่อปลาทั้งหมด (สำหรับ dropdown)
export const getAllFishNames = () => {
  return FISH_DATA.map(fish => fish.name).sort();
};

// ฟังก์ชันค้นหาตามแหล่งที่อยู่
export const searchByHabitat = (habitat) => {
  return FISH_DATA.filter(fish => 
    fish.habitat.toLowerCase().includes(habitat.toLowerCase())
  );
};

// ฟังก์ชันค้นหาตามฤดูกาล
export const searchBySeason = (season) => {
  return FISH_DATA.filter(fish => 
    fish.season.toLowerCase().includes(season.toLowerCase())
  );
};

// ฟังก์ชันค้นหาตามเครื่องมือจับ
export const searchByFishingGear = (gear) => {
  return FISH_DATA.filter(fish => 
    fish.fishingGear.toLowerCase().includes(gear.toLowerCase())
  );
};`;

// เขียนไฟล์ JavaScript
const jsPath = './src/data/fish-data.js';
fs.writeFileSync(jsPath, jsContent);

console.log(`✅ แปลงสำเร็จ!`);
console.log(`📊 จำนวนข้อมูลปลา: ${fishData.length} ชนิด`);
console.log(`📁 ไฟล์ที่สร้าง: ${jsPath}`);
console.log(`\n🔍 ตัวอย่างข้อมูล 3 รายการแรก:`);
fishData.slice(0, 3).forEach(fish => {
  console.log(`- ${fish.name} (${fish.scientificName})`);
  console.log(`  ชื่อท้องถิ่น: ${fish.localNames}`);
  console.log(`  ขนาด: ${fish.minSize} - ${fish.maxSize}`);
  console.log(`  ราคา: ${fish.marketPrice}`);
  console.log('');
});