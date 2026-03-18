/**
 * Extracts a numeric annual salary value from a salary string.
 * Handles "60K", "80.000€", "60-80K" (takes the max), "€20/h" (returns 0 — hourly not comparable).
 */
export function parseSalary(salary: string | null | undefined): number {
  if (!salary) return 0;

  // Hourly rates are not comparable to annual — skip
  if (/\/h/i.test(salary)) return 0;

  const s = salary.toUpperCase();

  // Handle ranges like "60-80K" or "60K-80K"
  const rangeMatch = s.match(/(\d[\d.,]*)\s*K?\s*[-–]\s*(\d[\d.,]*)\s*K?/);
  if (rangeMatch) {
    const a = parseNumber(rangeMatch[1], s.includes('K'));
    const b = parseNumber(rangeMatch[2], s.includes('K'));
    return Math.max(a, b);
  }

  // Single value
  const singleMatch = s.match(/(\d[\d.,]*)\s*K?/);
  if (singleMatch) {
    return parseNumber(singleMatch[1], s.includes('K'));
  }

  return 0;
}

function parseNumber(raw: string, hasK: boolean): number {
  // Remove dots used as thousands separators and commas
  const cleaned = raw.replace(/[.,]/g, '');
  const num = parseInt(cleaned, 10);
  if (isNaN(num)) return 0;
  // If the number looks like "80000" it's already in euros
  // If the number looks like "80" and there's a K, multiply
  return hasK && num < 1000 ? num * 1000 : num;
}
