import { Offer } from './types';
import { parseSalary } from './parseSalary';
import { formatSalary } from './utils';

const JOBS_URL = 'https://www.getmanfred.com/ofertas-de-trabajo';
const HIRE_URL = 'https://mnfrd.co/empresas';
const POST_OFFER_URL = 'https://mnfrd.co/3EKhw56';

function getPrefix(offer: Offer): string {
  if (offer.type === 'manfred') return 'Ⓜ️';
  if (offer.type === 'client') return '👀';
  if (parseSalary(offer.salary) >= 80000) return '🌶️';
  return '';
}

function formatModality(modality: string): string {
  const map: Record<string, string> = {
    remote: 'Remote',
    hybrid: 'Hybrid',
    onsite: 'On-site',
  };
  return map[modality] ?? modality;
}

function formatOfferBlock(offer: Offer): string {
  const prefix = getPrefix(offer);
  const prefixStr = prefix ? `${prefix} ` : '';
  const salary = formatSalary(offer.salary);
  const url = offer.shortUrl ?? offer.url;
  const modality = formatModality(offer.modality);

  return `${prefixStr}${offer.title} @ ${offer.company}\n${modality} — ${salary}\n${url}`;
}

export function generateMessage(offers: Offer[], greeting = '', ending = ''): string {
  const blocks = offers.map(formatOfferBlock).join('\n\n');

  const greetingLine = greeting ? `${greeting}\n\n` : '';
  const endingLine = ending ? `${ending}\n\n` : '';

  return `${greetingLine}${blocks}

${endingLine}Ⓜ️ = offers managed by Manfred

Looking to expand your team? Discover the best talent in our 100.000 techies community. ${HIRE_URL}

Manfred Daily is made with ❤️ by Manfred Team. If you want to post an offer, here you have all the information: ${POST_OFFER_URL}`;
}
