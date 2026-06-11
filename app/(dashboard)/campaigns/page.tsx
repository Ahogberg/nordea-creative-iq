'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, Plus, Clock, CheckCircle2, Loader2, ArrowRight, Film } from 'lucide-react';
import type { Campaign } from '@/lib/brief/types';

const STATUS_CONFIG: Record<Campaign['status'], { label: string; className: string }> = {
  draft: { label: 'Utkast', className: 'bg-gray-100 text-gray-700' },
  in_review: { label: 'Under granskning', className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Godkänd', className: 'bg-green-100 text-green-700' },
  live: { label: 'Live', className: 'bg-blue-100 text-blue-700' },
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just nu';
  if (m < 60) return `${m} min sedan`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h sedan`;
  const d = Math.floor(h / 24);
  return `${d} d sedan`;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/campaigns')
      .then((r) => {
        if (!r.ok) throw new Error('Kunde inte hämta kampanjer');
        return r.json();
      })
      .then((data) => setCampaigns(data.campaigns ?? []))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Okänt fel')
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kampanjer</h1>
          <p className="text-gray-500 mt-1">
            Kampanjer skapade från godkända briefs
          </p>
        </div>
        <Link href="/create/brief">
          <Button className="bg-[#0000A0] hover:bg-[#000080]">
            <Plus className="w-4 h-4 mr-2" />
            Ny brief
          </Button>
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && campaigns.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#0000A0]/10 flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-8 h-8 text-[#0000A0]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Inga kampanjer ännu
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Kampanjer skapas när du genererar en kampanj från en godkänd brief.
            </p>
            <Link href="/create/brief">
              <Button className="bg-[#0000A0] hover:bg-[#000080]">
                <Plus className="w-4 h-4 mr-2" />
                Skapa en brief
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!loading && campaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => {
            const statusCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.draft;
            const templateCount = c.template_ids?.length ?? 0;
            const href = c.brief_id
              ? `/create/brief/${c.brief_id}/campaign`
              : `/studio`;
            return (
              <Link key={c.id} href={href}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 truncate flex-1 min-w-0">
                        {c.name || 'Namnlös kampanj'}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <Badge className={statusCfg.className}>{statusCfg.label}</Badge>
                      {templateCount > 0 && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Film className="w-3 h-3" />
                          {templateCount} video{templateCount > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100">
                      <span className="flex items-center gap-1">
                        {c.status === 'approved' || c.status === 'live' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {formatRelative(c.updated_at)}
                      </span>
                      <span className="flex items-center gap-1 text-[#0000A0] font-medium">
                        Öppna
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
