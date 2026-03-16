'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Wand2,
  Plus,
  X,
  Download,
  Loader2,
  Sparkles,
  Package,
} from 'lucide-react';
import type { Template } from '@/lib/video-types';
import { VIDEO_FORMATS, templateToVideoConfig, calculateTotalVideos } from '@/lib/video-types';

function ProduceContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');

  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProducing, setIsProducing] = useState(false);

  // Variants state
  const [headlines, setHeadlines] = useState<string[]>(['']);
  const [bodies, setBodies] = useState<string[]>(['']);
  const [ctas, setCtas] = useState<string[]>(['']);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['story', 'feed']);

  // AI generation
  const [productDescription, setProductDescription] = useState('');

  // Preview state
  const [previewVariant, setPreviewVariant] = useState({ headline: 0, body: 0, cta: 0, format: 0 });

  const fetchTemplate = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/templates/${id}`);
      if (res.ok) {
        const { template } = await res.json();
        setTemplate(template);

        const defaultHeadline = template.default_texts.find((t: { placeholder: string; text: string }) => t.placeholder === 'headline')?.text || '';
        const defaultBody = template.default_texts.find((t: { placeholder: string; text: string }) => t.placeholder === 'body')?.text || '';
        const defaultCta = template.default_texts.find((t: { placeholder: string; text: string }) => t.placeholder === 'cta')?.text || '';

        setHeadlines([defaultHeadline]);
        setBodies([defaultBody]);
        setCtas([defaultCta]);
        setSelectedFormats(template.formats || ['story', 'feed']);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (templateId) {
      const timer = setTimeout(() => { fetchTemplate(templateId); }, 0);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [templateId, fetchTemplate]);

  const handleGenerateVariants = async () => {
    if (!template) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          productDescription,
          channel: 'meta',
        }),
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
            headlines: headlines.filter(h => h.trim()),
            bodies: bodies.filter(b => b.trim()),
            ctas: ctas.filter(c => c.trim()),
          },
          formats: selectedFormats,
        }),
      });

      if (res.ok) {
        const { totalVideos } = await res.json();
        alert(`Produktion startad! ${totalVideos} videor kommer genereras.`);
      }
    } catch (error) {
      console.error('Error starting production:', error);
    } finally {
      setIsProducing(false);
    }
  };

  // Add/remove variant helpers
  const addHeadline = () => setHeadlines([...headlines, '']);
  const addBody = () => setBodies([...bodies, '']);
  const addCta = () => setCtas([...ctas, '']);

  const removeHeadline = (i: number) => setHeadlines(headlines.filter((_, idx) => idx !== i));
  const removeBody = (i: number) => setBodies(bodies.filter((_, idx) => idx !== i));
  const removeCta = (i: number) => setCtas(ctas.filter((_, idx) => idx !== i));

  const updateHeadline = (i: number, v: string) => setHeadlines(headlines.map((h, idx) => idx === i ? v : h));
  const updateBody = (i: number, v: string) => setBodies(bodies.map((b, idx) => idx === i ? v : b));
  const updateCta = (i: number, v: string) => setCtas(ctas.map((c, idx) => idx === i ? v : c));

  const toggleFormat = (formatId: string) => {
    setSelectedFormats(prev =>
      prev.includes(formatId)
        ? prev.filter(f => f !== formatId)
        : [...prev, formatId]
    );
  };

  // Calculate totals
  const validHeadlines = headlines.filter(h => h.trim()).length || 1;
  const validBodies = bodies.filter(b => b.trim()).length || 1;
  const validCtas = ctas.filter(c => c.trim()).length || 1;
  const totalCombinations = validHeadlines * validBodies * validCtas;
  const totalVideos = totalCombinations * selectedFormats.length;

  // Get preview config for CSS-based preview
  const getPreviewTexts = () => {
    const h = headlines[previewVariant.headline] || headlines[0] || '';
    const b = bodies[previewVariant.body] || bodies[0] || '';
    const c = ctas[previewVariant.cta] || ctas[0] || '';
    return { headline: h, body: b, cta: c };
  };

  const previewTexts = getPreviewTexts();
  const previewFormatId = selectedFormats[previewVariant.format] || selectedFormats[0] || 'story';
  const previewFormat = VIDEO_FORMATS.find(f => f.id === previewFormatId) || VIDEO_FORMATS[0];

  if (isLoading) {
    return (
      <div className="main-content flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="main-content">
        <div className="max-w-md mx-auto text-center py-20">
          <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Ingen mall vald</h2>
          <p className="text-white/50 mb-6">Välj en mall från biblioteket för att starta produktion.</p>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 px-4 py-2 bg-nordea-blue rounded-lg text-white"
          >
            Gå till mallbiblioteket
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/templates" className="p-2 text-white/40 hover:text-white rounded-lg hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-white">Producera varianter</h1>
            <p className="text-sm text-white/50">Mall: {template.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left: Variant inputs */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            {/* AI Generation */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-nordea-medium" />
                <h3 className="font-medium text-white">AI-generering</h3>
              </div>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Beskriv kampanjen för att generera varianter automatiskt..."
                className="w-full h-24 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-white/20"
              />
              <button
                onClick={handleGenerateVariants}
                disabled={isGenerating}
                className="w-full mt-3 px-4 py-2.5 bg-nordea-blue/20 hover:bg-nordea-blue/30 border border-nordea-blue/30 rounded-lg text-sm font-medium text-nordea-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {isGenerating ? 'Genererar...' : 'Generera varianter'}
              </button>
            </div>

            {/* Headlines */}
            <VariantSection
              title="Rubriker"
              items={headlines}
              onAdd={addHeadline}
              onRemove={removeHeadline}
              onUpdate={updateHeadline}
              placeholder="Skriv rubrik..."
              selectedIndex={previewVariant.headline}
              onSelect={(i) => setPreviewVariant(p => ({ ...p, headline: i }))}
            />

            {/* Bodies */}
            <VariantSection
              title="Brödtexter"
              items={bodies}
              onAdd={addBody}
              onRemove={removeBody}
              onUpdate={updateBody}
              placeholder="Skriv brödtext..."
              selectedIndex={previewVariant.body}
              onSelect={(i) => setPreviewVariant(p => ({ ...p, body: i }))}
              multiline
            />

            {/* CTAs */}
            <VariantSection
              title="Call-to-actions"
              items={ctas}
              onAdd={addCta}
              onRemove={removeCta}
              onUpdate={updateCta}
              placeholder="Skriv CTA..."
              selectedIndex={previewVariant.cta}
              onSelect={(i) => setPreviewVariant(p => ({ ...p, cta: i }))}
            />

            {/* Formats */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
              <h3 className="font-medium text-white mb-4">Format</h3>
              <div className="grid grid-cols-2 gap-2">
                {VIDEO_FORMATS.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => toggleFormat(format.id)}
                    className={`px-4 py-3 rounded-lg text-left transition-colors ${
                      selectedFormats.includes(format.id)
                        ? 'bg-nordea-blue/20 border border-nordea-blue/40 text-white'
                        : 'bg-white/[0.03] border border-white/[0.08] text-white/50 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="block text-sm font-medium">{format.label}</span>
                    <span className="block text-xs opacity-60">{format.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Preview + Summary */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            {/* Preview */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="font-medium text-white">Förhandsvisning</h3>
                <div className="flex gap-1">
                  {selectedFormats.map((fid, i) => (
                    <button
                      key={fid}
                      onClick={() => setPreviewVariant(p => ({ ...p, format: i }))}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        previewVariant.format === i
                          ? 'bg-white/10 text-white'
                          : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      {VIDEO_FORMATS.find(f => f.id === fid)?.description}
                    </button>
                  ))}
                </div>
              </div>

              {/* CSS-based preview (no Remotion dependency) */}
              <div className="flex justify-center items-center p-8 bg-black/20 min-h-[400px]">
                <div
                  className="relative rounded-lg overflow-hidden shadow-2xl"
                  style={{
                    width: previewFormat.height > previewFormat.width ? 200 : 340,
                    height: previewFormat.height > previewFormat.width ? 355 : 191,
                    background: template.background.type === 'gradient'
                      ? `linear-gradient(${template.background.gradientAngle}deg, ${template.background.gradientStart}, ${template.background.gradientEnd})`
                      : template.background.solidColor || '#00005E',
                  }}
                >
                  {/* Logo placeholder */}
                  {template.logo.visible && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2">
                      <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center text-white text-xs font-bold">N</div>
                    </div>
                  )}

                  {/* Text preview */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center gap-2">
                    {previewTexts.headline && (
                      <p className="text-white font-bold text-sm leading-tight">{previewTexts.headline}</p>
                    )}
                    {previewTexts.body && (
                      <p className="text-white/80 text-xs leading-tight">{previewTexts.body}</p>
                    )}
                    {previewTexts.cta && (
                      <div className="mt-2 px-3 py-1 bg-white/20 rounded-full">
                        <p className="text-white text-xs font-medium">{previewTexts.cta}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Variant selector */}
              <div className="p-4 border-t border-white/[0.06] flex items-center gap-4 text-xs flex-wrap">
                <span className="text-white/40">Visar:</span>
                <select
                  value={previewVariant.headline}
                  onChange={(e) => setPreviewVariant(p => ({ ...p, headline: parseInt(e.target.value) }))}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white"
                >
                  {headlines.map((_, i) => (
                    <option key={i} value={i}>Rubrik {i + 1}</option>
                  ))}
                </select>
                <select
                  value={previewVariant.body}
                  onChange={(e) => setPreviewVariant(p => ({ ...p, body: parseInt(e.target.value) }))}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white"
                >
                  {bodies.map((_, i) => (
                    <option key={i} value={i}>Brödtext {i + 1}</option>
                  ))}
                </select>
                <select
                  value={previewVariant.cta}
                  onChange={(e) => setPreviewVariant(p => ({ ...p, cta: parseInt(e.target.value) }))}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white"
                >
                  {ctas.map((_, i) => (
                    <option key={i} value={i}>CTA {i + 1}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Production Summary */}
            <div className="bg-gradient-to-br from-nordea-blue/20 to-nordea-deep/40 border border-nordea-blue/20 rounded-xl p-6">
              <h3 className="font-medium text-white mb-4">Produktionssammanfattning</h3>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="text-3xl font-bold text-white">{validHeadlines}</div>
                  <div className="text-xs text-white/50">Rubriker</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="text-3xl font-bold text-white">{validBodies}</div>
                  <div className="text-xs text-white/50">Brödtexter</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="text-3xl font-bold text-white">{validCtas}</div>
                  <div className="text-xs text-white/50">CTAs</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg mb-6">
                <div>
                  <div className="text-sm text-white/70">
                    {validHeadlines} &times; {validBodies} &times; {validCtas} &times; {selectedFormats.length} format
                  </div>
                  <div className="text-2xl font-bold text-white">= {totalVideos} videor</div>
                </div>
                <Package className="w-10 h-10 text-nordea-medium/50" />
              </div>

              <button
                onClick={handleProduce}
                disabled={isProducing || totalVideos === 0}
                className="w-full px-6 py-4 bg-nordea-blue hover:bg-nordea-blue/80 rounded-xl text-white font-semibold transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isProducing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                {isProducing ? 'Startar produktion...' : `Producera ${totalVideos} videor`}
              </button>

              <p className="text-xs text-white/40 text-center mt-3">
                Videorna genereras och packas i en ZIP-fil för nedladdning
              </p>
            </div>
          </div>
        </div>
      </div>
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
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-white">{title}</h3>
        <span className="text-xs text-white/40">{items.filter(i => i.trim()).length} st</span>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex gap-2 p-2 rounded-lg border transition-colors cursor-pointer ${
              selectedIndex === i
                ? 'bg-nordea-blue/10 border-nordea-blue/30'
                : 'bg-white/[0.02] border-transparent hover:border-white/10'
            }`}
            onClick={() => onSelect(i)}
          >
            <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs text-white/50 flex-shrink-0">
              {i + 1}
            </div>
            {multiline ? (
              <textarea
                value={item}
                onChange={(e) => onUpdate(i, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={placeholder}
                rows={2}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 resize-none focus:outline-none"
              />
            ) : (
              <input
                type="text"
                value={item}
                onChange={(e) => onUpdate(i, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
              />
            )}
            {items.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                className="p-1 text-white/30 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onAdd}
        className="w-full mt-3 px-3 py-2 border border-dashed border-white/10 rounded-lg text-sm text-white/40 hover:text-white/60 hover:border-white/20 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Lägg till
      </button>
    </div>
  );
}

export default function ProducePage() {
  return (
    <Suspense fallback={
      <div className="main-content flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
      </div>
    }>
      <ProduceContent />
    </Suspense>
  );
}
