const fs = require('fs');

const names = {
  '私人银行家': '维多利亚',
  '科技巨头CSO': '艾达',
  '基金会理事': '奥菲利亚',
  '大法官': '尤斯蒂蒂亚',
  '政客': '辛西娅',
  '制药研发负责人': '罗莎琳德',
  '金牌刑辩律师': '艾丽西娅',
  '心脏外科医生': '弗洛伦斯',
  '艺术策展人': '珂莱尔',
  '地产咨询顾问': '缇娜',
  '大厂产品经理': '林恩',
  '独立调查记者': '普莉希拉',
  '高级公关经理': '维罗妮卡',
  '大学副教授': '米内瓦',
  '时尚杂志主编': '米兰达',
  '画家': '弗里达',
  '牙医': '玛格丽特',
  '急诊科护士': '安娜',
  '小学教师': '玛蒂尔达',
  '网球教练': '塞雷娜',
  '健身教练': '瓦莱丽',
  '家庭主妇': '玛莎',
  '空姐': '艾米莉亚',
  '厨师': '朱莉娅',
  '餐厅服务员': '丽莎',
  '电诈客服': '莉莉',
  '美妆主播': '克洛伊',
  '网瘾治疗师': '雷切尔',
  '街道网格员': '艾玛',
  '训狗师': '赫卡忒',
  '鸟咖主理人': '罗宾',
  '黑客': '翠妮蒂',
  '外卖员': '杰西卡',
  '月嫂': '玛丽',
  '狗仔队': '卡门',
  '流浪乐手': '潘多拉',
  '私人侦探': '艾琳',
  '拾荒者': '艾米'
};

// 1. Update CSV
const csvPath = 'd:/Projects/ACE_MaidTest/configs/maids.csv';
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n');

const newCsvLines = lines.map((line, index) => {
  if (line.trim() === '') return line;
  
  if (index === 0) {
    if (!line.includes('profession')) {
      const parts = line.split(',');
      parts.splice(2, 0, 'profession');
      return parts.join(',');
    }
    return line;
  }
  
  // Custom parsing for commas in description
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  // Only insert if it hasn't been done yet (checking length)
  if (result.length >= 8 && lines[0].includes('name') && !lines[0].includes('profession')) {
    let profession = result[1];
    let realName = names[profession] || '未知';
    result[1] = realName;
    result.splice(2, 0, profession);
  }
  
  return result.map(col => {
    // If it contains commas or quotes, ensure it is properly quoted
    if (col.includes(',') && !col.startsWith('"')) {
      return `"${col}"`;
    }
    return col;
  }).join(',');
});

if (!lines[0].includes('profession')) {
    fs.writeFileSync(csvPath, newCsvLines.join('\n'), 'utf8');
    console.log('Updated configs/maids.csv');
} else {
    console.log('configs/maids.csv already contains profession column.');
}

// 2. Update mock.ts
const mockPath = 'd:/Projects/ACE_MaidTest/src/data/mock.ts';
let mockContent = fs.readFileSync(mockPath, 'utf8');

for (const [prof, name] of Object.entries(names)) {
  mockContent = mockContent.replace(new RegExp(`"name": "${prof}"`, 'g'), `"name": "${name}"`);
}
fs.writeFileSync(mockPath, mockContent, 'utf8');
console.log('Updated src/data/mock.ts');
