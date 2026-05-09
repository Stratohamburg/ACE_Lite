import fs from 'fs'

const lines = fs.readFileSync('configs/maids.csv', 'utf-8').trim().split('\n')

const header = lines[0].trim() + ',bonus_1,bonus_2,bonus_3'
const bonusPool = [
  'max_hp', 'atk_base', 'def_base', 'crit_rate', 'crit_dmg', 'dodge_rate',
  'revive', 'battle_frenzy', 'boss_killer', 'backpack_size', 'backpack_double',
  'death_delivery', 'gold_rush'
]

function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

const outLines = [header]

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim()
  if (!line) continue

  const shuffledPool = shuffle([...bonusPool])
  const b1 = shuffledPool[0]
  const b2 = shuffledPool[1]
  const b3 = shuffledPool[2]

  outLines.push(`${line},${b1},${b2},${b3}`)
}

fs.writeFileSync('configs/maids.csv', outLines.join('\n') + '\n', 'utf-8')
console.log('Appended bonuses to configs/maids.csv')
