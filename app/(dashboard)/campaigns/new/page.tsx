'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Sparkles,
  Loader2,
  MessageCircle,
  Shield,
  Download,
  Film,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Rocket,
  ExternalLink,
  Globe,
} from 'lucide-react';
import {
  CAMPAIGN_STEPS,
  STEP_LABELS,
  createEmptyCampaign,
  type Campaign,
  type CampaignStep,
  type Concept,
  type PersonaReaction,
  type ComplianceFlag,
  type ChannelKey,
  type ObjectiveKey,
} from '@/types/campaign';
import { saveCampaign, getCampaign, getUserPrefs } from '@/lib/campaigns';
import { defaultPersonas } from '@/lib/constants/personas';
import { nordicMarkets } from '@/lib/constants/markets';

const CHANNELS: { key: ChannelKey; label: string }[] = [
  { key: 'meta', label: 'Meta/Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'display', label: 'Display' },
  { key: 'email', label: 'E-post' },
];

const OBJECTIVES: { key: ObjectiveKey; label: string }[] = [
  { key: 'awareness', label: 'Varumärkeskännedom' },
  { key: 'consideration', label: 'Övervägande' },
  { key: 'conversion', label: 'Konvertering' },
  { key: 'retention', label: 'Lojalitet' },
];

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingId = searchParams.get('id');

  const [campaign, setCampaign] = useState<Campaign>(() => createEmptyCampaign());
  const [loading, setLoading] = useState(false);
  const [autoLocalizeMarkets, setAutoLocalizeMarkets] = useState<string[]>([]);

  // Load existing campaign or create new
  useEffect(() => {
    if (existingId) {
      const existing = getCampaign(existingId);
      if (existing) {
        setCampaign(existing);
        return;
      }
    }
    setAutoLocalizeMarkets(getUserPrefs().autoLocalizeMarkets);
  }, [existingId]);

  // Auto-save
  const update = useCallback((patch: Partial<Campaign>) => {
    setCampaign((prev) => {
      const next = { ...prev, ...patch };
      saveCampaign(next);
      return next;
    });
  }, []);

  const goToStep = (step: CampaignStep) => update({ currentStep: step });

  const markStepComplete = (step: CampaignStep) => {
    if (!campaign.completedSteps.includes(step)) {
      update({ completedSteps: [...campaign.completedSteps, step] });
    }
  };

  const currentIndex = CAMPAIGN_STEPS.indexOf(campaign.currentStep);
  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < CAMPAIGN_STEPS.length - 1;

  const handleNext = () => {
    markStepComplete(campaign.currentStep);
    if (canGoNext) goToStep(CAMPAIGN_STEPS[currentIndex + 1]);
  };

  const handleBack = () => {
    if (canGoBack) goToStep(CAMPAIGN_STEPS[currentIndex - 1]);
  };

  // ---- Step validators ----
  const canProceed = (): boolean => {
    switch (campaign.currentStep) {
      case 'brief':
        return !!(campaign.brief.name && campaign.brief.product && campaign.brief.channels.length > 0);
      case 'concept':
        return !!campaign.selectedConceptId;
      case 'material':
        return true;
      case 'persona-test':
        return campaign.personaReactions.length > 0;
      case 'compliance':
        return !!campaign.approvedBy;
      case 'export':
        return true;
    }
  };

  // ---- Step: Generate concepts ----
  const handleGenerateConcepts = async () => {
    setLoading(true);
    try {
      const channel = campaign.brief.channels[0] || 'meta';
      const res = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          objective: campaign.brief.objective || 'awareness',
          topic: `${campaign.brief.product}. Målgrupp: ${campaign.brief.audience}. ${campaign.brief.notes}`,
        }),
      });
      const data = await res.json();
      const concepts: Concept[] = (data.variants || []).map(
        (v: Concept & { id?: string }, i: number) => ({
          ...v,
          id: v.id || `concept-${i}`,
        })
      );
      update({ concepts, selectedConceptId: null });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // ---- Step: Run persona test ----
  const handlePersonaTest = async () => {
    const selected = campaign.concepts.find((c) => c.id === campaign.selectedConceptId);
    if (!selected) return;
    setLoading(true);
    const personas =
      campaign.brief.targetPersonaIds.length > 0
        ? defaultPersonas.filter((p) =>
            campaign.brief.targetPersonaIds.includes(p.name)
          )
        : defaultPersonas;
    const channel = campaign.brief.channels[0] || 'meta';

    const results = await Promise.all(
      personas.map(async (p) => {
        try {
          const res = await fetch('/api/persona-react', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              personaName: p.name,
              personaTraits: p.traits,
              personaPainPoints: p.pain_points,
              personaSystemPrompt: p.system_prompt,
              responseStyle: p.response_style,
              copy: {
                headline: selected.headline,
                body: selected.bodyCopy,
                cta: selected.cta,
              },
              channel,
            }),
          });
          const data = await res.json();
          return {
            personaId: p.name,
            personaName: p.name,
            personaAvatar: p.avatar,
            firstImpression: data.firstImpression || '',
            wouldClick: data.wouldClick || 0,
            objections: data.objections || [],
          } as PersonaReaction;
        } catch {
          return null;
        }
      })
    );

    update({ personaReactions: results.filter((r): r is PersonaReaction => !!r) });
    setLoading(false);
  };

  // ---- Step: Compliance check ----
  const handleComplianceCheck = async () => {
    const selected = campaign.concepts.find((c) => c.id === campaign.selectedConceptId);
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch('/api/analyze-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: selected.headline,
          body: selected.bodyCopy,
          cta: selected.cta,
          channel: campaign.brief.channels[0] || 'meta',
        }),
      });
      const data = await res.json();
      const flags: ComplianceFlag[] = (data.feedback || [])
        .filter(
          (f: { status: string }) => f.status === 'fail' || f.status === 'warning'
        )
        .map((f: { status: string; category: string; message: string }) => ({
          severity: f.status === 'fail' ? 'high' : 'medium',
          field: f.category || 'general',
          issue: f.message,
          suggestion: '',
        }));
      update({
        complianceFlags: flags,
        complianceScore: data.scores?.compliance || 70,
        status: 'in_review',
      });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleApprove = () => {
    update({
      approvedBy: 'Andreas H.',
      approvedAt: new Date().toISOString(),
      status: 'approved',
    });
  };

  // ---- Step: Export ----
  const handleExport = () => {
    const selected = campaign.concepts.find((c) => c.id === campaign.selectedConceptId);
    const summary = {
      campaign: campaign.brief.name,
      product: campaign.brief.product,
      status: 'approved',
      approvedBy: campaign.approvedBy,
      approvedAt: campaign.approvedAt,
      objective: campaign.brief.objective,
      channels: campaign.brief.channels,
      budget: campaign.brief.budget,
      deadline: campaign.brief.deadline,
      concept: selected,
      personaReactions: campaign.personaReactions,
      complianceScore: campaign.complianceScore,
      complianceFlags: campaign.complianceFlags,
      autoLocalizeMarkets,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaign.brief.name.replace(/\s+/g, '-').toLowerCase() || 'kampanj'}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
    update({ status: 'exported' });
  };

  const selectedConcept = campaign.concepts.find((c) => c.id === campaign.selectedConceptId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/campaigns"
            className="text-sm text-gray-500 hover:text-[#0000A0] flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Tillbaka till kampanjer
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {campaign.brief.name || 'Ny kampanj'}
          </h1>
          <p className="text-gray-500 mt-1">
            Steg {currentIndex + 1} av {CAMPAIGN_STEPS.length} — {STEP_LABELS[campaign.currentStep]}
          </p>
        </div>
        {campaign.status !== 'draft' && (
          <Badge
            className={
              campaign.status === 'approved'
                ? 'bg-green-100 text-green-700'
                : campaign.status === 'exported'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-yellow-100 text-yellow-700'
            }
          >
            {campaign.status === 'approved'
              ? 'Godkänd'
              : campaign.status === 'exported'
              ? 'Exporterad'
              : 'Under granskning'}
          </Badge>
        )}
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between relative">
          {CAMPAIGN_STEPS.map((step, i) => {
            const completed = campaign.completedSteps.includes(step);
            const current = campaign.currentStep === step;
            const clickable = completed || current;
            return (
              <button
                key={step}
                onClick={() => clickable && goToStep(step)}
                disabled={!clickable}
                className={`flex flex-col items-center gap-1.5 z-10 bg-white px-2 ${
                  clickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    current
                      ? 'bg-[#0000A0] text-white ring-4 ring-[#0000A0]/15'
                      : completed
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {completed && !current ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span
                  className={`text-xs font-medium ${
                    current ? 'text-[#0000A0]' : completed ? 'text-gray-700' : 'text-gray-400'
                  }`}
                >
                  {STEP_LABELS[step]}
                </span>
              </button>
            );
          })}
          {/* Line behind */}
          <div className="absolute top-4 left-8 right-8 h-0.5 bg-gray-100 -z-0" />
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {campaign.currentStep === 'brief' && (
          <BriefStep
            campaign={campaign}
            onUpdate={(brief) => update({ brief: { ...campaign.brief, ...brief } })}
          />
        )}
        {campaign.currentStep === 'concept' && (
          <ConceptStep
            campaign={campaign}
            loading={loading}
            onGenerate={handleGenerateConcepts}
            onSelect={(id) => update({ selectedConceptId: id })}
          />
        )}
        {campaign.currentStep === 'material' && (
          <MaterialStep campaign={campaign} selectedConcept={selectedConcept} />
        )}
        {campaign.currentStep === 'persona-test' && (
          <PersonaTestStep
            campaign={campaign}
            loading={loading}
            onRun={handlePersonaTest}
            selectedConcept={selectedConcept}
          />
        )}
        {campaign.currentStep === 'compliance' && (
          <ComplianceStep
            campaign={campaign}
            loading={loading}
            onRun={handleComplianceCheck}
            onApprove={handleApprove}
          />
        )}
        {campaign.currentStep === 'export' && (
          <ExportStep
            campaign={campaign}
            autoLocalizeMarkets={autoLocalizeMarkets}
            onExport={handleExport}
          />
        )}
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button variant="outline" onClick={handleBack} disabled={!canGoBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Button>
        {campaign.currentStep === 'export' ? (
          <Button
            onClick={() => router.push('/campaigns')}
            className="bg-[#0000A0] hover:bg-[#000080]"
          >
            Klar
            <Check className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!canProceed() || !canGoNext}
            className="bg-[#0000A0] hover:bg-[#000080]"
          >
            Nästa
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STEP: BRIEF
// ─────────────────────────────────────────────────────────────────────────
function BriefStep({
  campaign,
  onUpdate,
}: {
  campaign: Campaign;
  onUpdate: (brief: Partial<Campaign['brief']>) => void;
}) {
  const b = campaign.brief;
  const toggleChannel = (key: ChannelKey) => {
    onUpdate({
      channels: b.channels.includes(key)
        ? b.channels.filter((c) => c !== key)
        : [...b.channels, key],
    });
  };
  const togglePersona = (name: string) => {
    onUpdate({
      targetPersonaIds: b.targetPersonaIds.includes(name)
        ? b.targetPersonaIds.filter((p) => p !== name)
        : [...b.targetPersonaIds, name],
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0000A0]" />
            Grunduppgifter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Kampanjnamn *</Label>
            <Input
              value={b.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="T.ex. Bolån Q2 2026"
            />
          </div>
          <div className="space-y-2">
            <Label>Produkt/tjänst *</Label>
            <Input
              value={b.product}
              onChange={(e) => onUpdate({ product: e.target.value })}
              placeholder="T.ex. Bolån, ISK-sparande, Pensionskonto"
            />
          </div>
          <div className="space-y-2">
            <Label>Kampanjmål</Label>
            <Select
              value={b.objective}
              onValueChange={(v) => onUpdate({ objective: v as ObjectiveKey })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj mål..." />
              </SelectTrigger>
              <SelectContent>
                {OBJECTIVES.map((o) => (
                  <SelectItem key={o.key} value={o.key}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Budget (SEK)</Label>
              <Input
                type="number"
                value={b.budget || ''}
                onChange={(e) => onUpdate({ budget: Number(e.target.value) })}
                placeholder="500000"
              />
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input
                type="date"
                value={b.deadline}
                onChange={(e) => onUpdate({ deadline: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Målgrupp & kanaler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Målgruppsbeskrivning</Label>
            <Textarea
              value={b.audience}
              onChange={(e) => onUpdate({ audience: e.target.value })}
              placeholder="Beskriv målgruppen i egna ord..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Prioriterade personas</Label>
            <div className="flex flex-wrap gap-2">
              {defaultPersonas.map((p) => (
                <button
                  key={p.name}
                  onClick={() => togglePersona(p.name)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    b.targetPersonaIds.includes(p.name)
                      ? 'bg-[#0000A0] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p.avatar} {p.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              Lämna tomt för att testa mot alla personas
            </p>
          </div>

          <div className="space-y-2">
            <Label>Kanaler *</Label>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.key}
                  onClick={() => toggleChannel(ch.key)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    b.channels.includes(ch.key)
                      ? 'bg-[#0000A0] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Övriga anteckningar</Label>
            <Textarea
              value={b.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Specifika vinklar, tongivande budskap, must-haves..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STEP: CONCEPT
// ─────────────────────────────────────────────────────────────────────────
function ConceptStep({
  campaign,
  loading,
  onGenerate,
  onSelect,
}: {
  campaign: Campaign;
  loading: boolean;
  onGenerate: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">AI-genererade koncept</h3>
            <p className="text-sm text-gray-500 mt-1">
              Baserat på din brief genererar vi 3 kampanjvinklar. Välj en att gå vidare med.
            </p>
          </div>
          <Button
            onClick={onGenerate}
            disabled={loading}
            className="bg-[#0000A0] hover:bg-[#000080]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Genererar...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {campaign.concepts.length === 0 ? 'Generera koncept' : 'Generera om'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {campaign.concepts.length === 0 && !loading && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <Sparkles className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Klicka &quot;Generera koncept&quot; för att börja</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {campaign.concepts.map((c) => {
          const selected = campaign.selectedConceptId === c.id;
          return (
            <Card
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`border-0 shadow-sm cursor-pointer transition-all ${
                selected ? 'ring-2 ring-[#0000A0]' : 'hover:shadow-md'
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-xs">
                    {c.angle}
                  </Badge>
                  {selected && <CheckCircle2 className="w-5 h-5 text-[#0000A0]" />}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 leading-tight">
                  {c.headline}
                </h4>
                <p className="text-sm text-gray-500 mb-3 line-clamp-4">{c.bodyCopy}</p>
                <div className="text-sm font-medium text-[#0000A0]">{c.cta}</div>
                {c.brandFitScore !== undefined && (
                  <div className="mt-3 pt-3 border-t text-xs text-gray-400">
                    Brand Fit: {c.brandFitScore}%
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STEP: MATERIAL
// ─────────────────────────────────────────────────────────────────────────
function MaterialStep({
  campaign,
  selectedConcept,
}: {
  campaign: Campaign;
  selectedConcept: Concept | undefined;
}) {
  const handleOpenMotionStudio = () => {
    if (selectedConcept) {
      sessionStorage.setItem(
        'copyForMotionStudio',
        JSON.stringify({
          headline: selectedConcept.headline,
          body: selectedConcept.bodyCopy,
          cta: selectedConcept.cta,
        })
      );
    }
    window.open('/motion-studio', '_blank');
  };

  const handleOpenAdStudio = () => {
    if (selectedConcept) {
      sessionStorage.setItem(
        'copyForAdStudio',
        JSON.stringify({
          headline: selectedConcept.headline,
          body: selectedConcept.bodyCopy,
          cta: selectedConcept.cta,
          channel: campaign.brief.channels[0] || 'meta',
        })
      );
    }
    window.open('/ad-studio', '_blank');
  };

  return (
    <div className="space-y-6">
      {selectedConcept && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-[#0000A0]/5 to-transparent">
          <CardContent className="p-6">
            <div className="text-xs text-gray-500 mb-1">Valt koncept</div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {selectedConcept.headline}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{selectedConcept.bodyCopy}</p>
            <div className="mt-2 text-sm font-medium text-[#0000A0]">
              {selectedConcept.cta}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
              <Film className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Motion Studio</h3>
            <p className="text-sm text-gray-500 mb-4">
              Skapa animerad video från ditt koncept med AI. Text och CTA förifyllda.
            </p>
            <Button onClick={handleOpenMotionStudio} variant="outline" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Öppna Motion Studio
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <ImageIcon className="w-5 h-5 text-[#0000A0]" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Ad Studio</h3>
            <p className="text-sm text-gray-500 mb-4">
              Ladda upp eller skapa statisk annons och få AI-analys direkt.
            </p>
            <Button onClick={handleOpenAdStudio} variant="outline" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Öppna Ad Studio
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm border-dashed">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-gray-500">
            Skapa ditt material i ett separat fönster, återvänd hit och gå vidare när du är klar.
            Materialet länkas automatiskt till kampanjen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STEP: PERSONA TEST
// ─────────────────────────────────────────────────────────────────────────
function PersonaTestStep({
  campaign,
  loading,
  onRun,
  selectedConcept,
}: {
  campaign: Campaign;
  loading: boolean;
  onRun: () => void;
  selectedConcept: Concept | undefined;
}) {
  const avgClick =
    campaign.personaReactions.length > 0
      ? Math.round(
          campaign.personaReactions.reduce((s, r) => s + r.wouldClick, 0) /
            campaign.personaReactions.length
        )
      : 0;

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Virtual Focus Group</h3>
            <p className="text-sm text-gray-500 mt-1">
              Vi testar ditt koncept mot{' '}
              {campaign.brief.targetPersonaIds.length || defaultPersonas.length} personas
              parallellt.
            </p>
          </div>
          <Button
            onClick={onRun}
            disabled={loading || !selectedConcept}
            className="bg-[#0000A0] hover:bg-[#000080]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testar...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 mr-2" />
                {campaign.personaReactions.length === 0 ? 'Kör persona-test' : 'Kör om'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {campaign.personaReactions.length > 0 && (
        <>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#0000A0]">{avgClick}%</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Genomsnittligt klick-intent
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {campaign.personaReactions.length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Personas testade</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {campaign.personaReactions.reduce(
                      (s, r) => s + r.objections.length,
                      0
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Totala invändningar</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaign.personaReactions.map((r) => (
              <Card key={r.personaId} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{r.personaAvatar}</span>
                      <span className="font-medium">{r.personaName}</span>
                    </div>
                    <Badge
                      className={
                        r.wouldClick >= 60
                          ? 'bg-green-100 text-green-700'
                          : r.wouldClick >= 40
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }
                    >
                      {r.wouldClick}% klick
                    </Badge>
                  </div>
                  <p className="text-sm italic text-gray-700 mb-3">
                    &quot;{r.firstImpression}&quot;
                  </p>
                  {r.objections.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-1">Invändningar:</p>
                      <ul className="space-y-1">
                        {r.objections.map((o, i) => (
                          <li key={i} className="text-xs text-gray-600 flex gap-1">
                            <span className="text-gray-400">•</span>
                            <span>{o}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STEP: COMPLIANCE
// ─────────────────────────────────────────────────────────────────────────
function ComplianceStep({
  campaign,
  loading,
  onRun,
  onApprove,
}: {
  campaign: Campaign;
  loading: boolean;
  onRun: () => void;
  onApprove: () => void;
}) {
  const hasChecked = campaign.complianceScore !== null;
  const hasHighFlags = campaign.complianceFlags.some((f) => f.severity === 'high');

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Compliance-kontroll</h3>
            <p className="text-sm text-gray-500 mt-1">
              Automatisk granskning mot Nordeas riktlinjer och finansiella regler.
            </p>
          </div>
          <Button
            onClick={onRun}
            disabled={loading}
            className="bg-[#0000A0] hover:bg-[#000080]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyserar...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                {hasChecked ? 'Kör om' : 'Kör analys'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {hasChecked && (
        <>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-br from-[#0000A0] to-[#000080]">
                  {campaign.complianceScore}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    Compliance-poäng: {campaign.complianceScore}/100
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {campaign.complianceFlags.length === 0
                      ? 'Inga problem hittade'
                      : `${campaign.complianceFlags.length} punkt(er) att granska`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {campaign.complianceFlags.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Flaggade punkter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {campaign.complianceFlags.map((f, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg flex items-start gap-3 ${
                      f.severity === 'high' ? 'bg-red-50' : 'bg-yellow-50'
                    }`}
                  >
                    <AlertCircle
                      className={`w-4 h-4 mt-0.5 ${
                        f.severity === 'high' ? 'text-red-500' : 'text-yellow-500'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{f.issue}</p>
                      {f.suggestion && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          Förslag: {f.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              {campaign.approvedBy ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Godkänd av {campaign.approvedBy}</p>
                    <p className="text-xs text-gray-500">
                      {campaign.approvedAt
                        ? new Date(campaign.approvedAt).toLocaleString('sv-SE')
                        : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    {hasHighFlags
                      ? 'Det finns högrisk-flaggor som bör åtgärdas innan godkännande.'
                      : 'Granska flaggorna ovan och godkänn kampanjen för att gå vidare till export.'}
                  </p>
                  <Button
                    onClick={onApprove}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={hasHighFlags}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Godkänn kampanjen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STEP: EXPORT
// ─────────────────────────────────────────────────────────────────────────
function ExportStep({
  campaign,
  autoLocalizeMarkets,
  onExport,
}: {
  campaign: Campaign;
  autoLocalizeMarkets: string[];
  onExport: () => void;
}) {
  const selected = campaign.concepts.find((c) => c.id === campaign.selectedConceptId);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-transparent">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Kampanjen är klar att exporteras</h3>
            <p className="text-sm text-gray-500">
              Alla steg är genomförda. Ladda ner paketet för att distribuera.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Sammanfattning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <SummaryRow label="Kampanj" value={campaign.brief.name} />
            <SummaryRow label="Produkt" value={campaign.brief.product} />
            <SummaryRow
              label="Kanaler"
              value={campaign.brief.channels.join(', ') || '—'}
            />
            <SummaryRow
              label="Budget"
              value={
                campaign.brief.budget
                  ? `${campaign.brief.budget.toLocaleString('sv-SE')} SEK`
                  : '—'
              }
            />
            <SummaryRow
              label="Compliance"
              value={`${campaign.complianceScore || 0}/100`}
            />
            <SummaryRow label="Godkänd av" value={campaign.approvedBy || '—'} />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#0000A0]" />
              Lokalisering
            </CardTitle>
          </CardHeader>
          <CardContent>
            {autoLocalizeMarkets.length > 0 ? (
              <>
                <p className="text-sm text-gray-500 mb-3">
                  Enligt dina inställningar lokaliseras kampanjen till:
                </p>
                <div className="flex flex-wrap gap-2">
                  {autoLocalizeMarkets.map((m) => {
                    const market = nordicMarkets.find((nm) => nm.id === m);
                    return (
                      <Badge key={m} variant="outline" className="text-sm">
                        {market?.flag} {market?.name}
                      </Badge>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                Ingen auto-lokalisering aktiverad. Ändra i{' '}
                <Link href="/settings" className="text-[#0000A0] underline">
                  Inställningar
                </Link>
                .
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {selected && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Valt koncept</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-xs text-gray-500">Rubrik</Label>
              <p className="text-sm">{selected.headline}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Brödtext</Label>
              <p className="text-sm">{selected.bodyCopy}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">CTA</Label>
              <p className="text-sm font-medium text-[#0000A0]">{selected.cta}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={onExport}
        size="lg"
        className="w-full bg-[#0000A0] hover:bg-[#000080]"
      >
        <Download className="w-5 h-5 mr-2" />
        Exportera kampanjpaket (JSON)
      </Button>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value || '—'}</span>
    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#0000A0]" />
        </div>
      }
    >
      <WizardContent />
    </Suspense>
  );
}
