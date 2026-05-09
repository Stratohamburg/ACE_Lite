export function parseCSV<T = any>(csvText: string): T[] {
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const result: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const obj: any = {};

    headers.forEach((header, index) => {
      const val = values[index];
      if (val !== undefined && val !== '') {
        // 尝试自动转换为数字，转换失败则保留字符串
        const numPattern = /^-?\d+(\.\d+)?$/;
        if (numPattern.test(val)) {
          obj[header] = Number(val);
        } else {
          obj[header] = val;
        }
      }
    });
    result.push(obj as T);
  }

  return result;
}
