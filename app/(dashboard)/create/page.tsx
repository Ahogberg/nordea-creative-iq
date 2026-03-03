'use client';

import { useState, useCallback, useRef } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { NordeaVideo } from '@/src/remotion/NordeaVideo';
import { ColorPicker } from '@/components/ui/color-picker';
import { Timeline } from '@/components/ui/timeline';
import { VideoSlider } from '@/components/ui/video-slider';
import {
  DEFAULT_VIDEO_CONFIG,
  VIDEO_FORMATS,
  generateId,
  type VideoConfig,
  type TextPlate,
  type BackgroundType,
  type AnimationType,
  type LogoPosition,
  type FontWeight,
} from '@/lib/video-types';
import { Play, Pause, RotateCcw, Plus, Trash2, Copy, Download, Wand2, Loader2, Type, Palette, Layers, Clock } from 'lucide-react';

export default function CreatePage() {
  const [config, setConfig] = useState<VideoConfig>(DEFAULT_VIDEO_CONFIG);
  const [selectedFormat, setSelectedFormat] = useState(VIDEO_FORMATS[0]);
  const [selectedPlateId, setSelectedPlateId] = useState<string | null>(config.textPlates[0]?.id || null);
  const [activeTab, setActiveTab] = useState<'background' | 'text' | 'logo' | 'timing'>('text');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [productDescription, setProductDescription] = useState('');
  const playerRef = useRef<PlayerRef>(null);

  const updateConfig = useCallback((u: Partial<VideoConfig>) => setConfig((p) => ({ ...p, ...u })), []);
  const updateBackground = useCallback((u: Partial<VideoConfig['background']>) => setConfig((p) => ({ ...p, background: { ...p.background, ...u } })), []);
  const updateLogo = useCallback((u: Partial<VideoConfig['logo']>) => setConfig((p) => ({ ...p, logo: { ...p.logo, ...u } })), []);
  const updateTextPlate = useCallback((id: string, u: Partial<TextPlate>) => setConfig((p) => ({ ...p, textPlates: p.textPlates.map((t) => (t.id === id ? { ...t, ...u } : t)) })), []);

  const addTextPlate = useCallback(() => {
    const last = config.textPlates[config.textPlates.length - 1];
    const np: TextPlate = {
      id: generateId(),
      text: 'Ny text',
      fontSize: 42,
      fontWeight: 500,
      color: '#FFFFFF',
      startFrame: last ? last.endFrame - 15 : 15,
      endFrame: last ? last.endFrame + 40 : 70,
      animation: 'fade',
      isCta: false,
      ctaBackgroundColor: '#0000A0',
      ctaBorderRadius: 8,
    };
    setConfig((p) => ({ ...p, textPlates: [...p.textPlates, np] }));
    setSelectedPlateId(np.id);
  }, [config.textPlates]);

  const removeTextPlate = useCallback((id: string) => {
    setConfig((p) => ({ ...p, textPlates: p.textPlates.filter((t) => t.id !== id) }));
    if (selectedPlateId === id) setSelectedPlateId(config.textPlates[0]?.id || null);
  }, [selectedPlateId, config.textPlates]);

  const changeFormat = (fid: string) => {
    const f = VIDEO_FORMATS.find((x) => x.id === fid);
    if (f) { setSelectedFormat(f); updateConfig({ width: f.width, height: f.height }); }
  };

  const handleGenerate = async () => {
    if (!productDescription.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'meta', objective: 'conversion', topic: productDescription, variants: 1 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.variants?.[0]) {
          const v = data.variants[0];
          setConfig((p) => ({
            ...p,
            textPlates: [
              { ...p.textPlates[0], text: v.headline },
              { ...p.textPlates[1], text: v.body },
              { ...p.textPlates[2], text: v.cta },
            ].filter(Boolean) as TextPlate[],
          }));
        }
      }
    } catch (e) { console.error(e); }
    setIsGenerating(false);
  };

  const togglePlay = () => {
    if (playerRef.current) { isPlaying ? playerRef.current.pause() : playerRef.current.play(); setIsPlaying(!isPlaying); }
  };

  const selectedPlate = config.textPlates.find((p) => p.id === selectedPlateId);
  const isVertical = selectedFormat.height > selectedFormat.width;
  const pw = isVertical ? 240 : 380;
  const ph = isVertical ? 426 : 214;

  return (
    <div className="p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Creative Editor</h1>
            <p className="text-sm text-gray-500">Skapa och redigera videoannonser</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"><Copy className="w-4 h-4" />Duplicera</button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#0000A0] text-white rounded-lg text-sm font-medium hover:bg-[#000080] transition-colors"><Download className="w-4 h-4" />Exportera</button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left: Controls */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-4">
            {/* AI */}
            <div className="bg-[#00005E] border border-[#0000A0]/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 className="w-4 h-4 text-white/40" />
                <span className="text-sm font-medium text-white">AI-generering</span>
              </div>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Beskriv vad annonsen ska handla om..."
                className="w-full h-20 px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-white/20"
              />
              <button onClick={handleGenerate} disabled={isGenerating || !productDescription.trim()} className="w-full mt-3 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-lg text-sm font-medium text-white disabled:opacity-40 flex items-center justify-center gap-2">
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {isGenerating ? 'Genererar...' : 'Generera texter'}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              {[{ id: 'background', label: 'Bakgrund', icon: Palette }, { id: 'text', label: 'Text', icon: Type }, { id: 'logo', label: 'Logo', icon: Layers }, { id: 'timing', label: 'Timing', icon: Clock }].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id as typeof activeTab)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${activeTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-[#00005E] border border-[#0000A0]/20 rounded-xl p-4 space-y-4">
              {activeTab === 'background' && (
                <>
                  <div>
                    <label className="block text-xs text-white/50 mb-2">Typ</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['solid', 'gradient', 'image', 'video'] as BackgroundType[]).map((t) => (
                        <button key={t} onClick={() => updateBackground({ type: t })} className={`px-3 py-2 rounded-lg text-xs font-medium ${config.background.type === t ? 'bg-white/10 text-white border border-white/20' : 'bg-white/[0.03] text-white/50 border border-transparent hover:bg-white/[0.06]'}`}>
                          {t === 'solid' ? 'Solid' : t === 'gradient' ? 'Gradient' : t === 'image' ? 'Bild' : 'Video'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {config.background.type === 'solid' && <ColorPicker color={config.background.solidColor} onChange={(c) => updateBackground({ solidColor: c })} label="Bakgrundsfärg" />}
                  {config.background.type === 'gradient' && (
                    <>
                      <ColorPicker color={config.background.gradientStart} onChange={(c) => updateBackground({ gradientStart: c })} label="Startfärg" />
                      <ColorPicker color={config.background.gradientEnd} onChange={(c) => updateBackground({ gradientEnd: c })} label="Slutfärg" />
                      <VideoSlider value={config.background.gradientAngle} onChange={(v) => updateBackground({ gradientAngle: v })} min={0} max={360} label="Vinkel" unit="°" />
                    </>
                  )}
                </>
              )}

              {activeTab === 'text' && (
                <>
                  <div className="space-y-2">
                    {config.textPlates.map((plate, i) => (
                      <button key={plate.id} onClick={() => setSelectedPlateId(plate.id)} className={`w-full p-3 rounded-lg text-left ${selectedPlateId === plate.id ? 'bg-white/10 border border-white/20' : 'bg-white/[0.03] border border-transparent hover:bg-white/[0.06]'}`}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-white/40">{plate.isCta ? 'CTA' : `Text ${i + 1}`}</span>
                          <div className="flex gap-1">
                            {config.textPlates.length > 1 && <button onClick={(e) => { e.stopPropagation(); removeTextPlate(plate.id); }} className="p-1 text-white/30 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>}
                          </div>
                        </div>
                        <p className="text-sm text-white truncate">{plate.text}</p>
                      </button>
                    ))}
                  </div>
                  <button onClick={addTextPlate} className="w-full px-4 py-2 border border-dashed border-white/10 rounded-lg text-sm text-white/40 hover:text-white/60 flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Lägg till text</button>
                  {selectedPlate && (
                    <div className="pt-4 border-t border-white/[0.06] space-y-4">
                      <div>
                        <label className="block text-xs text-white/50 mb-1.5">Text</label>
                        <textarea value={selectedPlate.text} onChange={(e) => updateTextPlate(selectedPlate.id, { text: e.target.value })} className="w-full h-20 px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white resize-none focus:outline-none focus:border-white/20" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-white/50 mb-1.5">Storlek</label>
                          <input type="number" value={selectedPlate.fontSize} onChange={(e) => updateTextPlate(selectedPlate.id, { fontSize: parseInt(e.target.value) || 42 })} className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white" />
                        </div>
                        <div>
                          <label className="block text-xs text-white/50 mb-1.5">Vikt</label>
                          <select value={selectedPlate.fontWeight} onChange={(e) => updateTextPlate(selectedPlate.id, { fontWeight: parseInt(e.target.value) as FontWeight })} className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white">
                            <option value={400}>Normal</option>
                            <option value={500}>Medium</option>
                            <option value={600}>Semibold</option>
                            <option value={700}>Bold</option>
                          </select>
                        </div>
                      </div>
                      <ColorPicker color={selectedPlate.color} onChange={(c) => updateTextPlate(selectedPlate.id, { color: c })} label="Textfärg" />
                      <div>
                        <label className="block text-xs text-white/50 mb-2">Animation</label>
                        <div className="grid grid-cols-5 gap-1">
                          {(['fade', 'slide-up', 'slide-down', 'scale', 'none'] as AnimationType[]).map((a) => (
                            <button key={a} onClick={() => updateTextPlate(selectedPlate.id, { animation: a })} className={`px-2 py-1.5 rounded text-[10px] font-medium ${selectedPlate.animation === a ? 'bg-white/10 text-white' : 'bg-white/[0.03] text-white/50 hover:bg-white/[0.06]'}`}>
                              {a === 'fade' ? 'Fade' : a === 'slide-up' ? '↑' : a === 'slide-down' ? '↓' : a === 'scale' ? 'Scale' : 'Ingen'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-white/70">
                          <input type="checkbox" checked={selectedPlate.isCta} onChange={(e) => updateTextPlate(selectedPlate.id, { isCta: e.target.checked })} className="rounded" />
                          CTA-knapp
                        </label>
                      </div>
                      {selectedPlate.isCta && <ColorPicker color={selectedPlate.ctaBackgroundColor} onChange={(c) => updateTextPlate(selectedPlate.id, { ctaBackgroundColor: c })} label="Knappfärg" />}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'logo' && (
                <>
                  <label className="flex items-center gap-2 text-sm text-white/70">
                    <input type="checkbox" checked={config.logo.visible} onChange={(e) => updateLogo({ visible: e.target.checked })} className="rounded" />
                    Visa logotyp
                  </label>
                  {config.logo.visible && (
                    <>
                      <div>
                        <label className="block text-xs text-white/50 mb-2">Position</label>
                        <div className="grid grid-cols-3 gap-1">
                          {(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as LogoPosition[]).map((p) => (
                            <button key={p} onClick={() => updateLogo({ position: p })} className={`px-2 py-1.5 rounded text-[10px] font-medium ${config.logo.position === p ? 'bg-white/10 text-white' : 'bg-white/[0.03] text-white/50 hover:bg-white/[0.06]'}`}>
                              {p.replace('-', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                      <VideoSlider value={config.logo.size} onChange={(v) => updateLogo({ size: v })} min={60} max={200} label="Storlek" unit="px" />
                      <VideoSlider value={Math.round(config.logo.opacity * 100)} onChange={(v) => updateLogo({ opacity: v / 100 })} min={0} max={100} label="Opacitet" unit="%" />
                    </>
                  )}
                </>
              )}

              {activeTab === 'timing' && (
                <>
                  <VideoSlider value={config.durationInFrames} onChange={(v) => updateConfig({ durationInFrames: v })} min={60} max={300} step={30} label="Duration" unit={` frames (${(config.durationInFrames / config.fps).toFixed(1)}s)`} />
                  {selectedPlate && (
                    <div className="pt-4 border-t border-white/[0.06] space-y-3">
                      <p className="text-xs text-white/50">Vald: {selectedPlate.text.slice(0, 20)}...</p>
                      <VideoSlider value={selectedPlate.startFrame} onChange={(v) => updateTextPlate(selectedPlate.id, { startFrame: v })} min={0} max={config.durationInFrames - 30} label="Start" unit=" frame" />
                      <VideoSlider value={selectedPlate.endFrame} onChange={(v) => updateTextPlate(selectedPlate.id, { endFrame: v })} min={selectedPlate.startFrame + 30} max={config.durationInFrames} label="Slut" unit=" frame" />
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/[0.06]">
                    <Timeline plates={config.textPlates} totalFrames={config.durationInFrames} fps={config.fps} onPlateClick={setSelectedPlateId} selectedPlateId={selectedPlateId} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Center: Preview */}
          <div className="col-span-12 lg:col-span-5 xl:col-span-6">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {VIDEO_FORMATS.map((f) => (
                    <button key={f.id} onClick={() => changeFormat(f.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selectedFormat.id === f.id ? 'bg-[#0000A0] text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
                      {f.description}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => playerRef.current?.seekTo(0)} className="p-2 text-gray-400 hover:text-gray-600"><RotateCcw className="w-4 h-4" /></button>
                  <button onClick={togglePlay} className="p-2 text-gray-400 hover:text-gray-600">{isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
                </div>
              </div>
              <div className="flex justify-center items-center p-8 bg-gray-50 min-h-[500px]">
                <div style={{ width: pw, height: ph }}>
                  <Player
                    ref={playerRef}
                    component={NordeaVideo}
                    inputProps={{ config }}
                    durationInFrames={config.durationInFrames}
                    fps={config.fps}
                    compositionWidth={selectedFormat.width}
                    compositionHeight={selectedFormat.height}
                    style={{ width: '100%', height: '100%', borderRadius: 8 }}
                    controls
                    loop
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Variants placeholder */}
          <div className="col-span-12 lg:col-span-3 xl:col-span-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Varianter</h3>
              <p className="text-xs text-gray-400">Generera varianter med AI eller duplicera för att skapa olika versioner.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
