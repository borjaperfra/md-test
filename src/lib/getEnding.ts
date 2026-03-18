import { readFileSync } from 'fs';
import { join } from 'path';

/** Parse a single CSV line respecting double-quoted fields. */
function parseCSVLine(line: string): string[] {
  const cols: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cols.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cols.push(current);
  return cols;
}

const MONTHS = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export interface DayEnding {
  main: string;
  special: string;
}

export function getTodayEnding(date = new Date()): DayEnding {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const targetMonth = MONTHS[month];

  let csvContent: string;
  try {
    csvContent = readFileSync(join(process.cwd(), 'references', 'endings-md.csv'), 'utf-8');
  } catch {
    return { main: '', special: '' };
  }

  const lines = csvContent.split('\n').slice(1); // skip header
  let currentMonth = '';

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = parseCSVLine(line);
    if (cols.length < 3) continue;

    if (cols[0].trim()) currentMonth = cols[0].trim();
    if (currentMonth !== targetMonth) continue;

    const dayNum = parseInt(cols[1], 10);
    if (dayNum !== day) continue;

    return {
      main: cols[2]?.trim() ?? '',
      special: cols[3]?.trim() ?? '',
    };
  }

  return { main: '', special: '' };
}
