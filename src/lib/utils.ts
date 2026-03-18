import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSalary(salary: string | null | undefined): string {
  if (!salary) return '—';

  const s = salary.trim();

  // Hourly rate: already contains /h
  if (/\/h/i.test(s)) {
    const match = s.match(/(\d+(?:[.,]\d+)?)/);
    if (match) return `€${match[1]}/h`;
    return s;
  }

  const upper = s.toUpperCase();

  // Range: e.g. "60-80K", "60K-80K", "60.000-80.000"
  const rangeMatch = upper.match(/(\d[\d.,]*)\s*K?\s*[-–]\s*(\d[\d.,]*)\s*K?/);
  if (rangeMatch) {
    const a = normalizeK(rangeMatch[1], upper);
    const b = normalizeK(rangeMatch[2], upper);
    return `€${a}-${b}K`;
  }

  // Single value
  const singleMatch = upper.match(/(\d[\d.,]*)\s*K?/);
  if (singleMatch) {
    const val = normalizeK(singleMatch[1], upper);
    return `Up to €${val}K`;
  }

  return s;
}

function normalizeK(raw: string, context: string): string {
  const cleaned = raw.replace(/[.,]/g, '');
  const num = parseInt(cleaned, 10);
  if (isNaN(num)) return raw;
  // If number looks like 80000, convert to 80
  const k = num >= 1000 ? Math.round(num / 1000) : num;
  return String(k);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
