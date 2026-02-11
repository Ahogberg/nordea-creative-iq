export interface ChannelConfig {
  id: string;
  name: string;
  icon: string;
  maxLength?: { headline: number; body: number };
  defaultCpm: number;
  defaultCtr: number;
  reachRate: number;
  minBudget: number;
  description: string;
}

export const copyChannels = [
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', maxLength: { headline: 150, body: 600 } },
  { id: 'meta', label: 'Meta/Instagram', icon: '📱', maxLength: { headline: 40, body: 125 } },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', maxLength: { headline: 30, body: 100 } },
  { id: 'display', label: 'Display', icon: '🖥️', maxLength: { headline: 30, body: 90 } },
  { id: 'email', label: 'E-post', icon: '📧', maxLength: { headline: 60, body: 500 } },
] as const;

export const campaignObjectives = [
  { id: 'awareness', label: 'Varumärkeskännedom' },
  { id: 'consideration', label: 'Övervägande' },
  { id: 'conversion', label: 'Konvertering' },
  { id: 'retention', label: 'Lojalitet' },
] as const;

export const nordeaChannels: ChannelConfig[] = [
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    defaultCpm: 180,
    defaultCtr: 0.8,
    reachRate: 0.65,
    minBudget: 10000,
    description: 'B2B och yrkesverksamma',
  },
  {
    id: 'meta',
    name: 'Meta/Instagram',
    icon: '📱',
    defaultCpm: 95,
    defaultCtr: 1.2,
    reachRate: 0.72,
    minBudget: 5000,
    description: 'Bred räckvidd, alla åldrar',
  },
  {
    id: 'display',
    name: 'Display/Programmatic',
    icon: '🖥️',
    defaultCpm: 45,
    defaultCtr: 0.15,
    reachRate: 0.85,
    minBudget: 20000,
    description: 'Banners på nyhets- och finanssajter',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '▶️',
    defaultCpm: 120,
    defaultCtr: 0.5,
    reachRate: 0.58,
    minBudget: 15000,
    description: 'Video, hög uppmärksamhet',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    defaultCpm: 85,
    defaultCtr: 1.5,
    reachRate: 0.68,
    minBudget: 10000,
    description: 'Yngre målgrupper, viral potential',
  },
];
