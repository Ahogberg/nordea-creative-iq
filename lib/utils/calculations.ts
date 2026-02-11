import { nordeaChannels } from '@/lib/constants/channels';
import { ChannelMixItem, AudienceConfig, CampaignForecast, ChannelResult } from '@/types/database';

export interface CampaignInput {
  budget: number;
  durationDays: number;
  channels: ChannelMixItem[];
  audience: AudienceConfig;
}

export function calculateCampaignForecast(input: CampaignInput): CampaignForecast {
  const channelResults: ChannelResult[] = input.channels
    .filter(c => c.allocation > 0)
    .map(c => {
      const channelConfig = nordeaChannels.find(nc => nc.id === c.channelId);
      if (!channelConfig) return null;

      const cpm = c.customCpm || channelConfig.defaultCpm;
      const channelBudget = input.budget * (c.allocation / 100);
      const impressions = Math.round((channelBudget / cpm) * 1000);
      const maxReach = input.audience.size * channelConfig.reachRate;
      const reach = Math.round(Math.min(maxReach, impressions * 0.6));
      const clicks = Math.round(impressions * (channelConfig.defaultCtr / 100));
      const frequency = reach > 0 ? parseFloat((impressions / reach).toFixed(1)) : 0;

      return {
        channelId: c.channelId,
        channelName: channelConfig.name,
        icon: channelConfig.icon,
        budget: channelBudget,
        impressions,
        reach,
        clicks,
        frequency,
        cpm,
        ctr: channelConfig.defaultCtr,
      };
    })
    .filter((r): r is ChannelResult => r !== null);

  const rawTotalReach = channelResults.reduce((sum, c) => sum + c.reach, 0);
  const uniqueReach = Math.round(rawTotalReach * 0.75);
  const totalImpressions = channelResults.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = channelResults.reduce((sum, c) => sum + c.clicks, 0);

  return {
    uniqueReach,
    totalImpressions,
    totalClicks,
    avgFrequency: uniqueReach > 0 ? parseFloat((totalImpressions / uniqueReach).toFixed(1)) : 0,
    estimatedCtr: totalImpressions > 0 ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0,
    avgCpm: totalImpressions > 0 ? Math.round((input.budget / totalImpressions) * 1000) : 0,
    avgCpc: totalClicks > 0 ? Math.round(input.budget / totalClicks) : 0,
    costPerReach: uniqueReach > 0 ? parseFloat((input.budget / uniqueReach).toFixed(2)) : 0,
    reachPercentage: parseFloat(((uniqueReach / input.audience.size) * 100).toFixed(1)),
    channelBreakdown: channelResults,
    warnings: getWarnings(channelResults, uniqueReach, input.audience.size),
  };
}

function getWarnings(channels: ChannelResult[], reach: number, audienceSize: number): string[] {
  const warnings: string[] = [];

  channels.forEach(c => {
    if (c.frequency > 8) {
      warnings.push(`${c.channelName}: Hög frekvens (${c.frequency}x) kan orsaka annonsutmattning`);
    }
  });

  if (reach / audienceSize < 0.1) {
    warnings.push('Låg räckvidd – överväg att öka budgeten eller bredda målgruppen');
  }

  return warnings;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString('sv-SE');
}

export function formatCurrency(amount: number, currency = 'SEK'): string {
  return `${amount.toLocaleString('sv-SE')} ${currency}`;
}
