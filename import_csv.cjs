const fs = require('fs');
const content = fs.readFileSync('D:\\Projects\\ACE_Design\\神枢协议_女鬼系统阶层设计.csv', 'utf-8');
const lines = content.split('\n').filter(line => line.trim().length > 0);
const maids = [];
const colorPalettes = [
  { accent: 'linear-gradient(180deg, #f6b86b 0%, #c95e3d 100%)', soft: 'rgba(249, 181, 97, 0.22)' },
  { accent: 'linear-gradient(180deg, #6cc8ba 0%, #1c7c74 100%)', soft: 'rgba(80, 210, 190, 0.18)' },
  { accent: 'linear-gradient(180deg, #6ca7ff 0%, #3047a8 100%)', soft: 'rgba(89, 124, 255, 0.18)' },
  { accent: 'linear-gradient(180deg, #d29cff 0%, #6c34b3 100%)', soft: 'rgba(188, 120, 255, 0.14)' },
  { accent: 'linear-gradient(180deg, #b6c160 0%, #586d21 100%)', soft: 'rgba(196, 224, 112, 0.14)' },
  { accent: 'linear-gradient(180deg, #ff8c94 0%, #c8325a 100%)', soft: 'rgba(255, 140, 148, 0.18)' }
];

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

// 0: 阶层排名
// 1: 职业/类别
// 2: 攻击技能类型
// 3: 攻击技能效果描述
// 4: 被动技能描述
// 5: 特性描述
// 6: 小怪描述
// 7: 致命弱点
// 8: 魅力/吸引点

for (let i = 1; i < lines.length; i++) {
  const data = parseCSVLine(lines[i].trim());
  if (data.length < 9) continue;
  
  let rarityGroup = data[0].includes('顶层') ? 'SSR' : (data[0].includes('中坚') ? 'SR' : 'R');
  let role = data[1];
  let name = role; 
  let attackType = data[2];
  let attackDesc = data[3].replace(/"/g, '');
  let passive = data[4].replace(/"/g, '');
  let trait = data[5].replace(/"/g, '');
  let mobs = data[6].replace(/"/g, '');
  let weakness = data[7].replace(/"/g, '');
  let charm = data[8].replace(/"/g, '');

  let palette = colorPalettes[i % colorPalettes.length];

  let unlocked = i <= 5;

  let maid = {
    id: 'maid_' + String(i).padStart(3, '0'),
    name: name,
    rarity: rarityGroup,
    role: role,
    unlocked: unlocked,
    unlockHint: unlocked ? '已解锁' : '通关主线章节解锁',
    level: unlocked ? Math.floor(Math.random() * 20) + 1 : 1,
    affection: unlocked ? Math.floor(Math.random() * 300) : 0,
    isInTeam: i <= 3,
    isShowcase: i === 1,
    accent: palette.accent,
    accentSoft: palette.soft,
    portraitLabel: role.substring(0, 2).toUpperCase() || 'UK',
    profile: {
      birthday: '未知',
      height: 160 + Math.floor(Math.random() * 15),
      weight: 45 + Math.floor(Math.random() * 10),
      bloodType: ['A', 'B', 'AB', 'O'][Math.floor(Math.random() * 4)],
      hobby: charm.split('、')[0] || '未知',
      dislike: weakness.split('、')[0] || '未知'
    },
    bonuses: [
      { name: '被动特长', description: passive, baseValue: Math.floor(Math.random() * 5) + 2, growthValue: 0.5, unit: '%' },
      { name: '特性', description: trait, baseValue: Math.floor(Math.random() * 5) + 2, growthValue: 0.5, unit: '%' }
    ],
    skills: [
      { name: attackType, description: attackDesc }
    ],
    storyChapters: [
      { id: 'story_1', title: '初遇', unlockLevel: 1, unlockAffection: 0, content: '作为[' + role + ']的她出现在你面前...' },
      { id: 'story_2', title: '特质观察', unlockLevel: 10, unlockAffection: 50, content: '弱点：' + weakness + '。' },
      { id: 'story_3', title: '魅力剖析', unlockLevel: 20, unlockAffection: 150, content: '吸引点：' + charm + '。伴随出现的仆从：' + mobs + '。'}
    ]
  };
  maids.push(maid);
}

const mockTsContent = `import type { Maid } from '../types'\n\nexport const mockMaids: Maid[] = ${JSON.stringify(maids, null, 2)};\n`;

fs.writeFileSync('d:\\Projects\\ACE_MaidTest\\src\\data\\mock.ts', mockTsContent, 'utf-8');
console.log('Successfully updated mock.ts with', maids.length, 'maids.');
