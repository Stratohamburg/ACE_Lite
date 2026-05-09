import fs from 'fs'

const rawSrc = fs.readFileSync('src/data/mock.ts', 'utf-8')
const prefixRegex = /^import(?:\s|.)*?export\s+const\s+mockMaids[^=]*=\s*/
const prefixMatch = rawSrc.match(prefixRegex)

const prefix = prefixMatch[0]
const dataStr = rawSrc.slice(prefix.length).replace(/;?\s*$/, '')
let maids = eval('(' + dataStr + ')')

maids.forEach(maid => {
  delete maid.bonuses
})

const finalOutput = `import type { Maid } from '../types'\n\nexport const mockMaids: Maid[] = ${JSON.stringify(maids, null, 2)}\n`
fs.writeFileSync('src/data/mock.ts', finalOutput, 'utf-8')
console.log('Removed hardcoded bonuses from mock.ts')
