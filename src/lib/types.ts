export type OfferType = 'manfred' | 'client' | 'external';
export type OfferStatus = 'pending' | 'selected' | 'discarded';
export type Modality = 'remote' | 'hybrid' | 'onsite';

export interface Offer {
  id: string;
  title: string;
  company: string;
  type: OfferType;
  modality: Modality;
  salary: string | null;
  url: string;
  shortUrl: string | null;
  status: OfferStatus;
  order: number | null;
  notes: string | null;
  isFreelance: boolean;
  location: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  dailyPostId: string | null;
}

export interface OfferPatch {
  title?: string;
  company?: string;
  type?: OfferType;
  modality?: Modality;
  salary?: string | null;
  url?: string;
  shortUrl?: string | null;
  status?: OfferStatus;
  order?: number | null;
  notes?: string | null;
  isFreelance?: boolean;
  location?: string | null;
}
