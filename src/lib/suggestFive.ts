import { Offer } from './types';
import { parseSalary } from './parseSalary';

/**
 * Suggests 5 offers following the selection strategy:
 * - Excludes discarded offers
 * - Priority: manfred → client → external
 * - External: remote first, then salary desc, then role variety
 * - No repeated company
 * - Returns array of 5 IDs
 */
export function suggestFive(offers: Offer[]): string[] {
  const eligible = offers.filter((o) => o.status !== 'discarded');

  const manfred = eligible.filter((o) => o.type === 'manfred');
  const client = eligible.filter((o) => o.type === 'client');
  const external = eligible
    .filter((o) => o.type === 'external')
    .sort((a, b) => {
      // Remote first
      if (a.modality === 'remote' && b.modality !== 'remote') return -1;
      if (a.modality !== 'remote' && b.modality === 'remote') return 1;
      // Then by salary desc
      return parseSalary(b.salary) - parseSalary(a.salary);
    });

  const pools = [manfred, client, external];
  const selected: Offer[] = [];
  const usedCompanies = new Set<string>();

  // Greedy selection: iterate pools in priority order
  for (const pool of pools) {
    for (const offer of pool) {
      if (selected.length >= 5) break;
      const company = offer.company.toLowerCase();
      if (!usedCompanies.has(company)) {
        selected.push(offer);
        usedCompanies.add(company);
      }
    }
    if (selected.length >= 5) break;
  }

  // If still not 5, allow repeated companies
  if (selected.length < 5) {
    for (const pool of pools) {
      for (const offer of pool) {
        if (selected.length >= 5) break;
        if (!selected.find((s) => s.id === offer.id)) {
          selected.push(offer);
        }
      }
      if (selected.length >= 5) break;
    }
  }

  return selected.slice(0, 5).map((o) => o.id);
}
