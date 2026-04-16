'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Rocket,
  Plus,
  Clock,
  CheckCircle2,
  FileText,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { listCampaigns, deleteCampaign } from '@/lib/campaigns';
import type { Campaign, CampaignStatus } from '@/types/campaign';
import { CAMPAIGN_STEPS, STEP_LABELS } from '@/types/campaign';

const STATUS_CONFIG: Record<CampaignStatus, { label: string; className: string }> = {
  draft: { label: 'Utkast', className: 'bg-gray-100 text-gray-700' },
  in_review: { label: 'Under granskning', className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Godkänd', className: 'bg-green-100 text-green-700' },
  exported: { label: 'Exporterad', className: 'bg-blue-100 text-blue-700' },
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCampaigns(listCampaigns());
    setMounted(true);
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Ta bort kampanjen?')) {
      deleteCampaign(id);
      setCampaigns(listCampaigns());
    }
  };

  const progressPercent = (campaign: Campaign) => {
    return Math.round((campaign.completedSteps.length / CAMPAIGN_STEPS.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kampanjer</h1>
          <p className="text-gray-500 mt-1">
            Från brief till färdig kampanj — hela resan i ett flöde
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button className="bg-[#0000A0] hover:bg-[#000080]">
            <Plus className="w-4 h-4 mr-2" />
            Ny kampanj
          </Button>
        </Link>
      </div>

      {mounted && campaigns.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[#0000A0]/10 flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-8 h-8 text-[#0000A0]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Inga kampanjer ännu
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Starta en ny kampanj och få hjälp hela vägen från brief till
              persona-testad, godkänd och exportklar kampanj.
            </p>
            <Link href="/campaigns/new">
              <Button className="bg-[#0000A0] hover:bg-[#000080]">
                <Plus className="w-4 h-4 mr-2" />
                Skapa din första kampanj
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => {
            const statusCfg = STATUS_CONFIG[c.status];
            const progress = progressPercent(c);
            return (
              <Link key={c.id} href={`/campaigns/new?id=${c.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {c.brief.name || 'Namnlös kampanj'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {c.brief.product || 'Ingen produkt angiven'}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(c.id, e)}
                        className="text-gray-300 hover:text-red-500 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <Badge className={statusCfg.className}>{statusCfg.label}</Badge>
                      {c.brief.channels.slice(0, 2).map((ch) => (
                        <Badge key={ch} variant="outline" className="text-xs capitalize">
                          {ch}
                        </Badge>
                      ))}
                      {c.brief.channels.length > 2 && (
                        <span className="text-xs text-gray-400">
                          +{c.brief.channels.length - 2}
                        </span>
                      )}
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                        <span>Framsteg</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0000A0] rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        {c.status === 'approved' || c.status === 'exported' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {STEP_LABELS[c.currentStep]}
                      </span>
                      <span>{formatRelative(c.updatedAt)}</span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center text-sm text-[#0000A0] font-medium">
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      {c.completedSteps.length === CAMPAIGN_STEPS.length
                        ? 'Visa kampanj'
                        : 'Fortsätt'}
                      <ArrowRight className="w-3.5 h-3.5 ml-auto" />
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
