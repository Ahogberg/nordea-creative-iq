'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Wand2,
  Plus,
  X,
  Download,
  Loader2,
  Sparkles,
  Package,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowRight,
  Rocket,
  Copy as CopyIcon,
} from 'lucide-react';
import type { Template, ProductionJob } from '@/lib/video-types';
import { VIDEO_FORMATS, extractVariantSeeds } from '@/lib/video-types';
import { Topbar } from '@/components/layout/topbar';
import { SectionTitle } from '@/components/layout/section-title';

function ProduceContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');

  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProducing, setIsProducing] = useState(false);
  const [activeJob, setActiveJob] = useState<ProductionJob | null>(null);

  const [headlines, setHeadlines] = useState<string[]>(['']);
  const [bodies, setBodies] = useState<string[]>(['']);
  const [ctas, setCtas] = useState<string[]>(['']);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['story', 'feed']);
  const [productDescription, setProductDescription] = useState('');
  const [previewVariant, setPreviewVariant] = useState({ headline: 0, body: 0, cta: 0, format: 0 });

  const fetchTemplate = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/templates/${id}`);
      if (res.ok) {
        const { template } = await res.json();
        setTemplate(template);
        const seeds = extractVariantSeeds(template.config);
        setHeadlines([seeds.headline]);
        setBodies([seeds.body]);
        setCtas([seeds.cta]);
        setSelectedFormats([template.config.format]);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (templateId) {
      const timer = setTimeout(() => fetchTemplate(templateId), 0);
      return () => clearTimeout(timer);
    }
    setIsLoading(false);
  }, [templateId, fetchTemplate]);

  const handleGenerateVariants = async () => {
    if (!template) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, productDescription, channel: 'meta' }),
      });
      if (res.ok) {
        const { variants } = await res.json();
        if (variants.headlines?.length) setHeadlines(variants.headlines);
        if (variants.bodies?.length) setBodies(variants.bodies);
        if (variants.ctas?.length) setCtas(variants.ctas);
      }
    } catch (error) {
      console.error('Error generating variants:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProduce = async () => {
    if (!template) return;
    setIsProducing(true);
    try {
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template.id,
          name: `${template.name} - ${new Date().toLocaleDateString('sv-SE')}`,
          variants: {
            headlines: headlines.filter((h) => h.trim()),
            bodies: bodies.filter((b) => b.trim()),
            ctas: ctas.filter((c) => c.trim()),
          },
          formats: selectedFormats,
        }),
      });
      if (res.ok) {
        const { job } = await res.json();
        setActiveJob(job as ProductionJob);
      } else {
        const { error } = await res.json().catch(() => ({ error: 'Okänt fel' }));
        alert(`Kunde inte starta produktion: ${error}`);
      }
    } catch (error) {
      console.error('Error starting production:', error);
      alert('Kunde inte starta produktion. Försök igen.');
    } finally {
      setIsProducing(false);
    }
  };

  useEffect(() => {
    if (!activeJob || activeJob.status === 'completed' || activeJob.status === 'failed') return;
    const jobId = activeJob.id;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/production/${jobId}`);
        if (!res.ok) return;
        const { job } = await res.json();
        if (cancelled) return;
        setActiveJob(job as ProductionJob);
      } catch {
        /* keep polling */
      }
    };
    const interval = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeJob]);

  const validHeadlines = headlines.filter((h) => h.trim()).length || 1;
  const validBodies = bodies.filter((b) => b.trim()).length || 1;
  const validCtas = ctas.filter((c) => c.trim()).length || 1;
  const totalVideos = validHeadlines * validBodies * validCtas * selectedFormats.length;

  const previewTexts = {
    headline: headlines[previewVariant.headline] || headlines[0] || '',
    body: bodies[previewVariant.body] || bodies[0] || '',
    cta: ctas[previewVariant.cta] || ctas[0] || '',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nordea-bg flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-nordea-text-tertiary animate-spin" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-nordea-bg">
        <Topbar breadcrumb={['Produce']} />
        <div className="max-w-md mx-auto text-center py-20 px-4">
          <Package className="w-12 h-12 text-nordea-text-tertiary mx-auto mb-4" />
          <h2 className="nordea-display text-xl text-nordea-deep mb-2">Ingen mall vald</h2>
          <p className="text-nordea-text-tertiary mb-6">
            Välj en mall från biblioteket för att starta produktion.
          </p>
          <Link href="/templates" className="nordea-btn nordea-btn-primary">
            Gå till mallbiblioteket
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nordea-bg">
      <Topbar
        breadcrumb={['Produce', `${template.name}`]}
        right={
          <Link href="/templates" className="nordea-btn nordea-btn-ghost">
            <X className="w-4 h-4" />
            Cancel
          </Link>
        }
      />

      <div className="grid grid-cols-[1fr_380px] min-h-[calc(100vh-3.5rem)]">
        {/* LEFT — inputs */}
        <div className="px-10 py-8 overflow-hidden">
          <div className="mb-6">
            <h1 className="nordea-display text-2xl text-nordea-deep">Production Mode</h1>
            <p className="text-sm text-nordea-text-tertiary mt-1">
              Combine variant inputs across formats. Every combination becomes one rendered video.
            </p>
          </div>

          {/* Selected template */}
          <div className="nordea-card p-3.5 mb-6 flex items-center gap-3.5">
            <div className="nordea-placeholder-stripe w-20 h-12">tpl</div>
            <div className="flex-1">
              <div className="nordea-eyebrow text-[10px] mb-1">Template</div>
              <div className="text-sm font-medium text-nordea-text">{template.name}</div>
              <div className="text-[11px] text-nordea-text-tertiary mt-0.5">
                {template.config.scenes.length} scenes · brand-approved
              </div>
            </div>
            <Link href="/templates" className="nordea-btn nordea-btn-ghost nordea-btn-sm">
              <CopyIcon className="w-3.5 h-3.5" />
              Change
            </Link>
          </div>

          {/* AI Generate */}
          <div className="nordea-card p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-nordea-teal" />
              <span className="text-xs font-semibold text-nordea-teal uppercase tracking-wider">
                AI Generate
              </span>
            </div>
            <textarea
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="Beskriv kampanjen för att generera varianter automatiskt..."
              className="w-full h-20 px-3.5 py-2.5 nordea-input resize-none text-sm"
              style={{ height: 'auto', minHeight: '80px' }}
            />
            <button
              type="button"
              onClick={handleGenerateVariants}
              disabled={isGenerating}
              className="nordea-btn nordea-btn-secondary nordea-btn-sm nordea-btn-full mt-3"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              {isGenerating ? 'Genererar...' : 'Suggest variants'}
            </button>
          </div>

          {/* Headlines */}
          <VariantSection
            title="Rubriker"
            items={headlines}
            onAdd={() => setHeadlines([...headlines, ''])}
            onRemove={(i) => setHeadlines(headlines.filter((_, idx) => idx !== i))}
            onUpdate={(i, v) => setHeadlines(headlines.map((h, idx) => (idx === i ? v : h)))}
            placeholder="Skriv rubrik..."
            selectedIndex={previewVariant.headline}
            onSelect={(i) => setPreviewVariant((p) => ({ ...p, headline: i }))}
          />

          <div className="grid grid-cols-2 gap-4 mt-5">
            <VariantSection
              title="Brödtexter"
              items={bodies}
              onAdd={() => setBodies([...bodies, ''])}
              onRemove={(i) => setBodies(bodies.filter((_, idx) => idx !== i))}
              onUpdate={(i, v) => setBodies(bodies.map((b, idx) => (idx === i ? v : b)))}
              placeholder="Skriv brödtext..."
              selectedIndex={previewVariant.body}
              onSelect={(i) => setPreviewVariant((p) => ({ ...p, body: i }))}
              multiline
            />
            <VariantSection
              title="CTAs"
              items={ctas}
              onAdd={() => setCtas([...ctas, ''])}
              onRemove={(i) => setCtas(ctas.filter((_, idx) => idx !== i))}
              onUpdate={(i, v) => setCtas(ctas.map((c, idx) => (idx === i ? v : c)))}
              placeholder="Skriv CTA..."
              selectedIndex={previewVariant.cta}
              onSelect={(i) => setPreviewVariant((p) => ({ ...p, cta: i }))}
              cta
            />
          </div>

          {/* Format selector */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-medium text-nordea-text">Format</span>
              <span className="text-[11px] text-nordea-text-tertiary">
                Select aspect ratios to render
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {VIDEO_FORMATS.map((f) => {
                const active = selectedFormats.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() =>
                      setSelectedFormats((prev) =>
                        prev.includes(f.id) ? prev.filter((x) => x !== f.id) : [...prev, f.id]
                      )
                    }
                    className={`p-3.5 rounded-lg border text-left transition-colors ${
                      active
                        ? 'bg-nordea-blue-soft border-nordea-blue-line'
                        : 'bg-white border-nordea-border hover:bg-nordea-bg-hover'
                    }`}
                  >
                    <div
                      className={`text-sm font-mono font-medium ${
                        active ? 'text-nordea-blue' : 'text-nordea-text'
                      }`}
                    >
                      {f.description}
                    </div>
                    <div className="text-[10px] text-nordea-text-tertiary mt-0.5">{f.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT — preview + summary */}
        <div className="border-l border-nordea-hairline bg-white p-7 flex flex-col gap-5 overflow-y-auto">
          {/* Preview */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="nordea-eyebrow text-[10px]">Live preview</span>
              <span className="text-[11px] text-nordea-teal">
                cycling {previewVariant.headline + 1}/{validHeadlines}
              </span>
            </div>
            <div
              className="aspect-video rounded-lg overflow-hidden relative"
              style={{ backgroundColor: template.config.backgroundColor || '#00005E' }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center gap-2">
                {previewTexts.headline && (
                  <p className="text-white font-bold text-base leading-tight">
                    {previewTexts.headline}
                  </p>
                )}
                {previewTexts.body && (
                  <p className="text-white/80 text-xs leading-tight max-w-[80%]">
                    {previewTexts.body}
                  </p>
                )}
                {previewTexts.cta && (
                  <div className="mt-2 px-3 py-1 bg-nordea-teal rounded-md">
                    <p className="text-nordea-deep text-xs font-semibold">{previewTexts.cta}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-1 mt-2">
              {headlines.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPreviewVariant((p) => ({ ...p, headline: i }))}
                  className={`flex-1 h-0.5 rounded ${
                    previewVariant.headline === i ? 'bg-nordea-teal' : 'bg-nordea-border'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="nordea-card p-4">
            <SectionTitle title="Summary" />
            <div className="font-mono text-[11px] text-nordea-text-secondary space-y-1">
              <div className="flex justify-between">
                <span>Headlines</span>
                <span className="text-nordea-text">{validHeadlines}</span>
              </div>
              <div className="flex justify-between">
                <span>Body texts</span>
                <span className="text-nordea-text">{validBodies}</span>
              </div>
              <div className="flex justify-between">
                <span>CTAs</span>
                <span className="text-nordea-text">{validCtas}</span>
              </div>
              <div className="flex justify-between">
                <span>Formats</span>
                <span className="text-nordea-text">{selectedFormats.length}</span>
              </div>
            </div>
            <div className="border-t border-nordea-hairline -mx-4 my-3" />
            <div className="flex justify-between items-center font-mono text-xs">
              <span className="text-nordea-text-secondary">
                {validHeadlines} × {validBodies} × {validCtas} × {selectedFormats.length} =
              </span>
              <span className="nordea-display text-3xl font-semibold text-nordea-teal">
                {totalVideos}
              </span>
            </div>
            <div className="text-[11px] text-nordea-text-tertiary mt-1">videos to render</div>
            <div className="flex justify-between text-[11px] mt-3 px-3 py-2 bg-nordea-bg-hover rounded">
              <span className="text-nordea-text-tertiary">Estimated render time</span>
              <span className="font-mono text-nordea-text">~{Math.ceil(totalVideos * 0.5)} min</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleProduce}
            disabled={isProducing || totalVideos === 0}
            className="nordea-btn nordea-btn-primary nordea-btn-lg nordea-btn-full"
          >
            {isProducing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4" />
            )}
            {isProducing ? 'Startar produktion...' : `Producera ${totalVideos} videor`}
          </button>
          <button
            type="button"
            className="nordea-btn nordea-btn-ghost nordea-btn-sm nordea-btn-full"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview all {totalVideos} thumbnails
          </button>
        </div>
      </div>

      {activeJob && <ProductionProgressOverlay job={activeJob} onClose={() => setActiveJob(null)} />}
    </div>
  );
}

function VariantSection({
  title,
  items,
  onAdd,
  onRemove,
  onUpdate,
  placeholder,
  selectedIndex,
  onSelect,
  multiline = false,
  cta = false,
}: {
  title: string;
  items: string[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onUpdate: (i: number, v: string) => void;
  placeholder: string;
  selectedIndex: number;
  onSelect: (i: number) => void;
  multiline?: boolean;
  cta?: boolean;
}) {
  const validCount = items.filter((i) => i.trim()).length;
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm font-medium text-nordea-text">
          {title}{' '}
          <span className="text-nordea-text-tertiary font-normal ml-1">{validCount}</span>
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex gap-2 p-2 rounded-md border transition-colors cursor-pointer ${
              selectedIndex === i
                ? 'bg-nordea-blue-soft border-nordea-blue-line'
                : 'bg-white border-nordea-border hover:border-nordea-border-emphasis'
            }`}
            onClick={() => onSelect(i)}
          >
            <div className="text-[11px] font-mono text-nordea-text-tertiary self-center w-5 flex-shrink-0">
              {String(i + 1).padStart(2, '0')}
            </div>
            {multiline ? (
              <textarea
                value={item}
                onChange={(e) => onUpdate(i, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={placeholder}
                rows={2}
                className="flex-1 bg-transparent text-sm text-nordea-text placeholder:text-nordea-text-tertiary resize-none focus:outline-none"
              />
            ) : (
              <input
                type="text"
                value={item}
                onChange={(e) => onUpdate(i, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-sm text-nordea-text placeholder:text-nordea-text-tertiary focus:outline-none"
              />
            )}
            {cta && item.trim() && (
              <ArrowRight className="w-3 h-3 text-nordea-teal self-center flex-shrink-0" />
            )}
            {items.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(i);
                }}
                className="p-1 text-nordea-text-tertiary hover:text-nordea-rose"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="w-full mt-2 px-3 py-2 border border-dashed border-nordea-border rounded-md text-xs text-nordea-text-tertiary hover:text-nordea-text hover:border-nordea-border-emphasis flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-3 h-3" />
        Add {title.toLowerCase()}
      </button>
    </div>
  );
}

function ProductionProgressOverlay({
  job,
  onClose,
}: {
  job: ProductionJob;
  onClose: () => void;
}) {
  const isDone = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const isRunning = job.status === 'pending' || job.status === 'processing';
  const progressPercent =
    job.total_videos > 0 ? Math.round((job.completed_videos / job.total_videos) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={isRunning ? undefined : onClose} />
      <div className="relative nordea-card w-full max-w-md p-6 shadow-lg">
        <button
          type="button"
          onClick={onClose}
          disabled={isRunning}
          className="absolute top-4 right-4 text-nordea-text-tertiary hover:text-nordea-text disabled:opacity-30"
        >
          <X className="w-4 h-4" />
        </button>

        {isRunning && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 text-nordea-teal animate-spin" />
              <h3 className="text-lg font-semibold text-nordea-text">
                Producerar {job.total_videos} videor
              </h3>
            </div>
            <p className="text-sm text-nordea-text-tertiary mb-4">
              {job.status === 'pending'
                ? 'Förbereder rendering...'
                : `Renderar video ${job.completed_videos + 1} av ${job.total_videos}`}
            </p>
            <div className="w-full h-2 bg-nordea-bg-hover rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-nordea-teal transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-nordea-text-tertiary">
              <span>
                {job.completed_videos} av {job.total_videos} klara
              </span>
              <span>{progressPercent}%</span>
            </div>
          </>
        )}

        {isDone && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-nordea-green" />
              <h3 className="text-lg font-semibold text-nordea-text">
                Klar! {job.completed_videos} av {job.total_videos} videor
              </h3>
            </div>
            {job.error_message && (
              <p className="text-sm text-nordea-amber mb-4">{job.error_message}</p>
            )}
            <p className="text-sm text-nordea-text-tertiary mb-6">
              Alla videor är paketerade i en ZIP-fil.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="nordea-btn nordea-btn-secondary nordea-btn-full">
                Stäng
              </button>
              {job.zip_url && (
                <a href={job.zip_url} download className="nordea-btn nordea-btn-primary nordea-btn-full">
                  <Download className="w-3.5 h-3.5" />
                  Ladda ner ZIP
                </a>
              )}
            </div>
          </>
        )}

        {isFailed && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-nordea-rose" />
              <h3 className="text-lg font-semibold text-nordea-text">
                Produktionen misslyckades
              </h3>
            </div>
            <p className="text-sm text-nordea-rose mb-6">
              {job.error_message || 'Okänt fel.'}
            </p>
            <button type="button" onClick={onClose} className="nordea-btn nordea-btn-secondary nordea-btn-full">
              Stäng
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProducePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-nordea-bg flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-nordea-text-tertiary animate-spin" />
        </div>
      }
    >
      <ProduceContent />
    </Suspense>
  );
}
