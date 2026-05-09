const fs = require('fs');

const sourceCsv = 'D:\\Projects\\ACE_Design\\神枢协议_女鬼系统阶层设计.csv';
const content = fs.readFileSync(sourceCsv, 'utf-8');
const lines = content.split('\n').filter(line => line.trim().length > 0);

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

let maidsCsvRows = ['id,name,rarity,element,base_hp,base_atk,base_def,description'];
let gachaPoolRows = ['pool_id,maid_id,weight,is_up_rate'];

const elements = ['光', '暗', '火', '水', '风'];

let startId = 1001;

for (let i = 1; i < lines.length; i++) {
  const data = parseCSVLine(lines[i].trim());
  if (data.length < 9) continue;
  
  let tier = data[0];
  let rarityGroup = 'R';
  let weight = 100;
  
  if (tier.includes('顶层')) {
    rarityGroup = 'SSR';
    weight = 10;
  } else if (tier.includes('中坚') || tier.includes('中下')) {
    rarityGroup = 'SR';
    weight = 50;
  } else {
    rarityGroup = 'R';
    weight = 100;
  }

  let role = data[1];
  let name = role; 
  let attackType = data[2];
  let attackDesc = data[3].replace(/"/g, '');
  let passive = data[4].replace(/"/g, '');
  let trait = data[5].replace(/"/g, '');
  let charm = data[8].replace(/"/g, '');

  let element = elements[i % elements.length];
  let hp = 800 + Math.floor(Math.random() * 700);
  let atk = 100 + Math.floor(Math.random() * 200);
  let def = 50 + Math.floor(Math.random() * 50);

  let desc = `作为${name}，${trait}。吸引点：${charm}。战斗方式：${attackType}(${attackDesc})，被动：${passive}`;
  // escape quotes
  desc = `"${desc.replace(/"/g, '""')}"`;

  let maidId = startId++;

  maidsCsvRows.push(`${maidId},${name},${rarityGroup},${element},${hp},${atk},${def},${desc}`);
  
  // pool_id 1 is the main pool
  // is_up_rate 1 for the first SSR
  let isUpRate = (i === 1) ? 1 : 0;
  gachaPoolRows.push(`1,${maidId},${weight},${isUpRate}`);
}

fs.writeFileSync('d:\\Projects\\ACE_MaidTest\\configs\\maids.csv', maidsCsvRows.join('\n'), 'utf-8');
fs.writeFileSync('d:\\Projects\\ACE_MaidTest\\configs\\gacha_pool.csv', gachaPoolRows.join('\n'), 'utf-8');

console.log('Config files written successfully');
