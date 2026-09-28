'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Rocket, Plus, Clock, CheckCircle2, ArrowRight, Film, Clapperboard } from 'lucide-react';
import { Topbar } from '@/components/layout/topbar';
import { PageHeading } from '@/components/layout/page-heading';
import { NordeaBadge } from '@/components/ui/nordea-badge';
import { EmptyState, ErrorState, CardGridSkeleton } from '@/components/ui/states';
import { CreativeThumbnail } from '@/components/preview/creative-thumbnail';
import { campaignStatus, formatRelative } from '@/lib/campaign-status';
import type { Campaign } from '@/lib/brief/types';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/campaigns')
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body.error ?? 'Kampanjerna kunde inte hämtas.');
        return body;
      })
      .then((data) => {
        if (!cancelled) setCampaigns(data.campaigns ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Okänt fel');
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const retry = useCallback(() => {
    setError(null);
    setCampaigns(null);
    setReload((n) => n + 1);
  }, []);

  return (
    <div className="min-h-screen bg-nordea-bg">
      <Topbar
        breadcrumb={['Kampanjer']}
        right={
          <Link href="/create/brief" className="nordea-btn nordea-btn-primary">
            <Plus className="w-4 h-4" />
            Ny brief
          </Link>
        }
      />

      <div className="px-8 py-8 max-w-[1400px] mx-auto">
        <PageHeading
          eyebrow="Arbetsyta"
          title="Kampanjer"
          description="Varje kampanj skapas från en godkänd brief och samlar video, displayformat och QA på ett ställe."
        />

        {error ? (
          <div className="nordea-card">
            <ErrorState title="Kampanjerna kunde inte hämtas" description={error} onRetry={retry} />
          </div>
        ) : campaigns === null ? (
          <CardGridSkeleton count={6} />
        ) : campaigns.length === 0 ? (
          <div className="nordea-card">
            <EmptyState
              icon={Rocket}
              title="Inga kampanjer ännu"
              description="Börja med en brief. När strategin är godkänd skapar CreativeIQ kampanjen med video och displayformat."
              action={
                <Link href="/create/brief" className="nordea-btn nordea-btn-primary">
                  <Plus className="w-4 h-4" />
                  Skapa en brief
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignCard({ campaign: c }: { campaign: Campaign }) {
  const status = campaignStatus(c.status);
  const templateCount = c.template_ids?.length ?? 0;
  const done = c.status === 'approved' || c.status === 'live';

  return (
    <Link href={`/campaigns/${c.id}`} className="nordea-card overflow-hidden group hover:border-nordea-border-emphasis transition-colors flex">
      <div className="w-[88px] shrink-0 bg-nordea-blue-soft flex items-center justify-center border-r border-nordea-hairline">
        {c.video_config?.scenes?.length ? (
          <CreativeThumbnail config={c.video_config} playOnHover={false} rounded="rounded-none" className="w-full" />
        ) : (
          <Clapperboard className="w-5 h-5 text-nordea-blue" />
        )}
      </div>
      <div className="p-4 flex-1 min-w-0 flex flex-col">
        <div className="font-semibold text-sm text-nordea-text truncate">{c.name || 'Namnlös kampanj'}</div>
        <div className="flex items-center gap-2 mt-2">
          <NordeaBadge tone={status.tone} dot>
            {status.label}
          </NordeaBadge>
          {c.display_set && <NordeaBadge tone="neutral">Display</NordeaBadge>}
          {templateCount > 0 && (
            <NordeaBadge tone="neutral">
              <Film className="w-3 h-3" />
              {templateCount} {templateCount === 1 ? 'video' : 'videor'}
            </NordeaBadge>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-nordea-text-tertiary mt-auto pt-4">
          <span className="flex items-center gap-1">
            {done ? <CheckCircle2 className="w-3.5 h-3.5 text-nordea-green" /> : <Clock className="w-3.5 h-3.5" />}
            {formatRelative(c.updated_at)}
          </span>
          <span className="flex items-center gap-1 text-nordea-blue font-medium">
            Öppna
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}
