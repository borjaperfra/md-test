import { PrismaClient, OfferType, Modality, OfferStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const offers: Array<{
  title: string;
  company: string;
  type: OfferType;
  modality: Modality;
  salary: string;
  url: string;
  status: OfferStatus;
}> = [
  {
    title: 'Senior Frontend Engineer',
    company: 'Acme Corp',
    type: 'manfred',
    modality: 'remote',
    salary: '70K',
    url: 'https://www.getmanfred.com/ofertas/1',
    status: 'pending',
  },
  {
    title: 'Staff Backend Engineer',
    company: 'TechStartup SL',
    type: 'manfred',
    modality: 'hybrid',
    salary: '90K',
    url: 'https://www.getmanfred.com/ofertas/2',
    status: 'pending',
  },
  {
    title: 'Principal Engineer',
    company: 'BigTech Spain',
    type: 'manfred',
    modality: 'remote',
    salary: '120K',
    url: 'https://www.getmanfred.com/ofertas/3',
    status: 'pending',
  },
  {
    title: 'DevOps Engineer',
    company: 'CloudCo',
    type: 'client',
    modality: 'remote',
    salary: '65.000€',
    url: 'https://example.com/job/4',
    status: 'pending',
  },
  {
    title: 'Product Manager Tech',
    company: 'Innovate SL',
    type: 'client',
    modality: 'hybrid',
    salary: '75K',
    url: 'https://example.com/job/5',
    status: 'pending',
  },
  {
    title: 'Full Stack Developer',
    company: 'Remote First Inc',
    type: 'external',
    modality: 'remote',
    salary: '60-80K',
    url: 'https://example.com/job/6',
    status: 'pending',
  },
  {
    title: 'Data Engineer',
    company: 'DataDriven SL',
    type: 'external',
    modality: 'remote',
    salary: '80.000€',
    url: 'https://example.com/job/7',
    status: 'pending',
  },
  {
    title: 'Engineering Manager',
    company: 'ScaleUp SA',
    type: 'external',
    modality: 'remote',
    salary: '110K',
    url: 'https://example.com/job/8',
    status: 'pending',
  },
  {
    title: 'iOS Developer',
    company: 'Mobile First',
    type: 'external',
    modality: 'remote',
    salary: '70K',
    url: 'https://example.com/job/9',
    status: 'pending',
  },
  {
    title: 'Security Engineer',
    company: 'CyberSec SL',
    type: 'external',
    modality: 'hybrid',
    salary: '85K',
    url: 'https://example.com/job/10',
    status: 'pending',
  },
  {
    title: 'ML Engineer',
    company: 'AI Labs',
    type: 'external',
    modality: 'remote',
    salary: '100K',
    url: 'https://example.com/job/11',
    status: 'pending',
  },
  {
    title: 'Platform Engineer',
    company: 'Infratech',
    type: 'client',
    modality: 'onsite',
    salary: '72K',
    url: 'https://example.com/job/12',
    status: 'pending',
  },
  {
    title: 'Android Developer',
    company: 'AppFactory',
    type: 'external',
    modality: 'remote',
    salary: '65K',
    url: 'https://example.com/job/13',
    status: 'pending',
  },
  {
    title: 'Solutions Architect',
    company: 'Enterprise Co',
    type: 'external',
    modality: 'hybrid',
    salary: '105K',
    url: 'https://example.com/job/14',
    status: 'pending',
  },
  {
    title: 'QA Engineer',
    company: 'Quality SL',
    type: 'manfred',
    modality: 'remote',
    salary: '55K',
    url: 'https://www.getmanfred.com/ofertas/15',
    status: 'pending',
  },
];

async function main() {
  console.log('Seeding database...');
  for (const offer of offers) {
    await prisma.offer.create({ data: offer });
  }
  console.log(`Created ${offers.length} offers.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
