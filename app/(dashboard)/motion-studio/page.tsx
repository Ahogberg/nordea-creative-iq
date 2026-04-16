'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Play,
  Pause,
  Send,
  Loader2,
  Sparkles,
  Film,
  RotateCcw,
  Download,
  Settings2,
  ChevronDown,
  Wand2,
  Layers,
  Clock,
  Monitor,
  Smartphone,
  Square,
  RectangleHorizontal,
  Copy,
  Check,
  Video,
  Trash2,
  History,
  X,
  GripVertical,
  Pencil,
  Plus,
  Minus,
} from 'lucide-react';
import type { VideoConfig, Scene } from '@/lib/remotion/types';
import { DEFAULT_VIDEO_CONFIG } from '@/lib/remotion/types';
import { FORMAT_PRESETS } from '@/lib/remotion/styles';

// Dynamically import the Player to avoid SSR issues with Remotion
const MotionPlayer = dynamic(
  () => import('@/lib/remotion/PlayerWrapper').then((m) => ({ default: m.MotionPlayer })),
  {
    ssr: false,
    loading: () => (
      <div className="motion-player-skeleton">
        <div className="motion-player-skeleton-pulse" />
      </div>
    ),
  }
);

type FormatKey = keyof typeof FORMAT_PRESETS;

const FORMAT_ICONS: Record<FormatKey, React.ReactNode> = {
  story: <Smartphone className="w-4 h-4" />,
  feed: <Square className="w-4 h-4" />,
  landscape: <Monitor className="w-4 h-4" />,
  vertical: <RectangleHorizontal className="w-4 h-4 rotate-90" />,
};

const SCENE_TYPE_LABELS: Record<string, string> = {
  title: 'Titel',
  counter: 'Räknare',
  bars: 'Stapeldiagram',
  'text-reveal': 'Textavslöjande',
  'icon-grid': 'Ikonrutnät',
  cta: 'Call to Action',
  split: 'Jämförelse',
  'highlight-number': 'Siffra',
  lottie: 'Lottie-animation',
  canvas: 'Canvas (fri komposition)',
};

const PROMPT_SUGGESTIONS = [
  'Skapa en bolånevideo med husanimation, kontantinsats och ränta',
  'Gör en sparande-kampanj med animerad pengatillväxt och fondavkastning',
  'Rita en diagonal linje som avslutas med en pulserande teal-cirkel',
  'Skapa en video med roterande prickar runt texten "Alltid i rörelse"',
  'Gör en abstrakt intro med vågor och Nordea-logotypen i mitten',
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  config?: VideoConfig;
  timestamp: Date;
}

interface RenderRecord {
  id: string;
  title: string;
  format: VideoConfig['format'];
  durationSeconds: number;
  fileName: string;
  fileSize: number;
  createdAt: string;
  mp4Url: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just nu';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min sedan`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h sedan`;
  const d = Math.floor(h / 24);
  return `${d} d sedan`;
}

export default function MotionStudioPage() {
  const [config, setConfig] = useState<VideoConfig>(DEFAULT_VIDEO_CONFIG);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showSceneList, setShowSceneList] = useState(true);
  const [copiedJson, setCopiedJson] = useState(false);
  const [activeFormat, setActiveFormat] = useState<FormatKey>('story');
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [showRendersPanel, setShowRendersPanel] = useState(false);
  const [renders, setRenders] = useState<RenderRecord[]>([]);
  const [latestRender, setLatestRender] = useState<RenderRecord | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGenerate = useCallback(async (prompt?: string) => {
    const text = prompt || input.trim();
    if (!text || isGenerating) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);

    try {
      // Build history from previous messages for conversational context
      const history = [...messages, userMessage]
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/motion-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          currentConfig: messages.length > 0 ? config : undefined,
          history: history.slice(0, -1), // Exclude last user msg (sent separately as prompt)
        }),
      });

      if (!res.ok) throw new Error('Generation failed');

      const data = await res.json();
      const newConfig = data.config as VideoConfig | null;
      const responseMessage = data.message || 'Video uppdaterad.';

      if (newConfig) {
        setConfig(newConfig);
        setActiveFormat(newConfig.format);
        setIsPlaying(true);
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseMessage,
        config: newConfig || undefined,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Något gick fel. Försök igen.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  }, [input, isGenerating, config, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleFormatChange = (format: FormatKey) => {
    setActiveFormat(format);
    setConfig((prev) => ({ ...prev, format }));
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleReset = () => {
    setConfig(DEFAULT_VIDEO_CONFIG);
    setMessages([]);
    setActiveFormat('story');
  };

  const loadRenders = useCallback(async () => {
    try {
      const res = await fetch('/api/motion-renders');
      if (!res.ok) return;
      const data = await res.json();
      setRenders(data.records || []);
    } catch {
      // Silent — the list just won't populate
    }
  }, []);

  useEffect(() => {
    if (showRendersPanel) loadRenders();
  }, [showRendersPanel, loadRenders]);

  const handleRender = useCallback(async () => {
    if (isRendering) return;
    setIsRendering(true);
    setRenderError(null);
    try {
      const res = await fetch('/api/motion-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Renderingen misslyckades');
      }
      setLatestRender(data.record);
      setShowRendersPanel(true);
      loadRenders();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Renderingsfel';
      setRenderError(message);
    } finally {
      setIsRendering(false);
    }
  }, [config, isRendering, loadRenders]);

  const handleDeleteRender = useCallback(async (id: string) => {
    try {
      await fetch(`/api/motion-renders?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      setRenders((prev) => prev.filter((r) => r.id !== id));
      if (latestRender?.id === id) setLatestRender(null);
    } catch {
      // Silent
    }
  }, [latestRender]);

  const [editingScene, setEditingScene] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const updateScene = useCallback((index: number, updates: Partial<Scene>) => {
    setConfig((prev) => {
      const scenes = [...prev.scenes];
      scenes[index] = { ...scenes[index], ...updates } as Scene;
      const totalDurationSeconds = scenes.reduce((s, sc) => s + sc.durationSeconds, 0);
      return { ...prev, scenes, totalDurationSeconds };
    });
  }, []);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    setConfig((prev) => {
      const scenes = [...prev.scenes];
      const [moved] = scenes.splice(dragIndex, 1);
      scenes.splice(targetIndex, 0, moved);
      return { ...prev, scenes };
    });
    if (editingScene === dragIndex) setEditingScene(targetIndex);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const deleteScene = (index: number) => {
    setConfig((prev) => {
      const scenes = prev.scenes.filter((_, i) => i !== index);
      const totalDurationSeconds = scenes.reduce((s, sc) => s + sc.durationSeconds, 0);
      return { ...prev, scenes, totalDurationSeconds };
    });
    if (editingScene === index) setEditingScene(null);
    else if (editingScene !== null && editingScene > index) setEditingScene(editingScene - 1);
  };

  const totalDuration = config.scenes.reduce((s, sc) => s + sc.durationSeconds, 0);

  return (
    <div className="motion-studio">
      {/* ═══ LEFT PANEL: Chat + Prompt ═══ */}
      <div className="motion-panel-left">
        {/* Header */}
        <div className="motion-panel-header">
          <div className="motion-panel-header-icon">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h1 className="motion-panel-title">Motion Studio</h1>
            <p className="motion-panel-subtitle">Skapa animerade videos med AI</p>
          </div>
        </div>

        {/* Chat area */}
        <div className="motion-chat-area">
          {messages.length === 0 ? (
            <div className="motion-empty-state">
              <div className="motion-empty-icon">
                <Wand2 className="w-8 h-8" />
              </div>
              <h3 className="motion-empty-title">Beskriv din video</h3>
              <p className="motion-empty-desc">
                Skriv vad du vill skapa — en kampanjvideo, produktpresentation,
                eller social media-content. AI:n skapar en animerad video åt dig.
              </p>

              {/* Suggestions */}
              <div className="motion-suggestions">
                {PROMPT_SUGGESTIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleGenerate(suggestion)}
                    className="motion-suggestion-chip"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="motion-messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`motion-message ${msg.role === 'user' ? 'motion-message-user' : 'motion-message-assistant'}`}
                >
                  <div className="motion-message-bubble">
                    {msg.content}
                  </div>
                  {msg.config && (
                    <div className="motion-message-scenes">
                      {msg.config.scenes.map((scene, i) => (
                        <span key={i} className="motion-scene-tag">
                          {SCENE_TYPE_LABELS[scene.type] || scene.type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isGenerating && (
                <div className="motion-message motion-message-assistant">
                  <div className="motion-message-bubble motion-generating">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Skapar video...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="motion-input-area">
          <div className="motion-input-wrapper">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Beskriv videon du vill skapa..."
              className="motion-input"
              rows={1}
              disabled={isGenerating}
            />
            <div className="motion-input-actions">
              {messages.length > 0 && (
                <button
                  onClick={handleReset}
                  className="motion-input-btn motion-input-btn-secondary"
                  title="Börja om"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleGenerate()}
                disabled={!input.trim() || isGenerating}
                className="motion-input-btn motion-input-btn-primary"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <p className="motion-input-hint">
            Enter för att skicka · Shift+Enter för ny rad
          </p>
        </div>
      </div>

      {/* ═══ RIGHT PANEL: Preview + Scene list ═══ */}
      <div className="motion-panel-right">
        {/* Format selector + controls */}
        <div className="motion-preview-toolbar">
          <div className="motion-format-tabs">
            {(Object.keys(FORMAT_PRESETS) as FormatKey[]).map((key) => (
              <button
                key={key}
                onClick={() => handleFormatChange(key)}
                className={`motion-format-tab ${activeFormat === key ? 'active' : ''}`}
                title={FORMAT_PRESETS[key].label}
              >
                {FORMAT_ICONS[key]}
                <span className="motion-format-label">{FORMAT_PRESETS[key].label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          <div className="motion-toolbar-actions">
            <button
              onClick={handleCopyJson}
              className="motion-toolbar-btn"
              title="Kopiera JSON"
            >
              {copiedJson ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowSceneList(!showSceneList)}
              className={`motion-toolbar-btn ${showSceneList ? 'active' : ''}`}
              title="Visa scener"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Player */}
        <div className="motion-preview-container">
          <div className={`motion-player-frame motion-player-${activeFormat}`}>
            <MotionPlayer config={config} playing={isPlaying} loop />
          </div>
        </div>

        {/* Scene editor */}
        {showSceneList && (
          <div className="motion-scene-list">
            <div className="motion-scene-list-header">
              <span className="motion-scene-list-title">
                <Layers className="w-4 h-4" />
                Scener ({config.scenes.length})
              </span>
              <span className="motion-scene-list-duration">
                <Clock className="w-3.5 h-3.5" />
                {totalDuration.toFixed(1)}s
              </span>
            </div>

            {/* Timeline */}
            <div className="motion-scene-timeline">
              {config.scenes.map((scene, i) => {
                const widthPercent = (scene.durationSeconds / totalDuration) * 100;
                return (
                  <div
                    key={i}
                    className={`motion-scene-block ${editingScene === i ? 'editing' : ''}`}
                    style={{ width: `${widthPercent}%` }}
                    title={`${SCENE_TYPE_LABELS[scene.type]} — ${scene.durationSeconds}s`}
                    onClick={() => setEditingScene(editingScene === i ? null : i)}
                  >
                    <div className="motion-scene-block-inner">
                      <span className="motion-scene-block-label">
                        {SCENE_TYPE_LABELS[scene.type] || scene.type}
                      </span>
                      <span className="motion-scene-block-time">
                        {scene.durationSeconds}s
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Draggable scene rows */}
            <div className="motion-scene-details">
              {config.scenes.map((scene, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                  className={`motion-scene-detail-row ${editingScene === i ? 'active' : ''} ${dragOverIndex === i ? 'drag-over' : ''} ${dragIndex === i ? 'dragging' : ''}`}
                  onClick={() => setEditingScene(editingScene === i ? null : i)}
                >
                  <div className="motion-scene-drag-handle" title="Dra för att ändra ordning">
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                  <div className="motion-scene-detail-index">{i + 1}</div>
                  <div className="motion-scene-detail-info">
                    <span className="motion-scene-detail-type">
                      {SCENE_TYPE_LABELS[scene.type]}
                    </span>
                    <span className="motion-scene-detail-preview">
                      {getScenePreview(scene)}
                    </span>
                  </div>
                  <div className="motion-scene-duration-ctrl" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="motion-scene-dur-btn"
                      onClick={() => updateScene(i, { durationSeconds: Math.max(0.5, scene.durationSeconds - 0.5) })}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="motion-scene-dur-val">{scene.durationSeconds}s</span>
                    <button
                      className="motion-scene-dur-btn"
                      onClick={() => updateScene(i, { durationSeconds: scene.durationSeconds + 0.5 })}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    className="motion-scene-delete-btn"
                    onClick={(e) => { e.stopPropagation(); deleteScene(i); }}
                    title="Ta bort scen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Inline scene editor */}
            {editingScene !== null && config.scenes[editingScene] && (
              <SceneEditor
                scene={config.scenes[editingScene]}
                onChange={(updates) => updateScene(editingScene, updates)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SceneEditor({ scene, onChange }: { scene: Scene; onChange: (updates: Partial<Scene>) => void }) {
  const fieldClass = "w-full px-3 py-2 rounded-lg text-sm text-white font-medium";

  const renderField = (label: string, value: string, key: string) => (
    <div>
      <label className="motion-editor-label">{label}</label>
      <input
        className={fieldClass}
        value={value}
        onChange={(e) => onChange({ [key]: e.target.value } as Partial<Scene>)}
      />
    </div>
  );

  return (
    <div className="motion-scene-editor">
      <div className="motion-editor-header">
        <Pencil className="w-3.5 h-3.5" />
        <span>Redigera scen</span>
      </div>
      <div className="motion-editor-fields">
        {scene.type === 'title' && (
          <>
            {renderField('Rubrik', scene.headline, 'headline')}
            {renderField('Undertext', scene.subtitle || '', 'subtitle')}
          </>
        )}
        {scene.type === 'counter' && (
          <>
            {renderField('Etikett', scene.label, 'label')}
            <div className="motion-editor-row">
              <div>
                <label className="motion-editor-label">Från</label>
                <input className={fieldClass} type="number" value={scene.fromValue} onChange={(e) => onChange({ fromValue: Number(e.target.value) } as Partial<Scene>)} />
              </div>
              <div>
                <label className="motion-editor-label">Till</label>
                <input className={fieldClass} type="number" value={scene.toValue} onChange={(e) => onChange({ toValue: Number(e.target.value) } as Partial<Scene>)} />
              </div>
            </div>
            {renderField('Suffix', scene.suffix || '', 'suffix')}
          </>
        )}
        {scene.type === 'text-reveal' && (
          <div>
            <label className="motion-editor-label">Textrader (en per rad)</label>
            <textarea
              className={`${fieldClass} min-h-[80px] resize-y`}
              value={scene.lines.join('\n')}
              onChange={(e) => onChange({ lines: e.target.value.split('\n') } as Partial<Scene>)}
            />
          </div>
        )}
        {scene.type === 'cta' && (
          <>
            {renderField('Rubrik', scene.headline, 'headline')}
            {renderField('Knapptext', scene.buttonText, 'buttonText')}
            {renderField('Undertext', scene.subtitle || '', 'subtitle')}
          </>
        )}
        {scene.type === 'split' && (
          <>
            {renderField('Vänster etikett', scene.leftLabel, 'leftLabel')}
            {renderField('Höger etikett', scene.rightLabel, 'rightLabel')}
            <div className="motion-editor-row">
              <div>
                <label className="motion-editor-label">Vänster värde</label>
                <input className={fieldClass} value={scene.leftValue} onChange={(e) => onChange({ leftValue: e.target.value } as Partial<Scene>)} />
              </div>
              <div>
                <label className="motion-editor-label">Höger värde</label>
                <input className={fieldClass} value={scene.rightValue} onChange={(e) => onChange({ rightValue: e.target.value } as Partial<Scene>)} />
              </div>
            </div>
          </>
        )}
        {scene.type === 'highlight-number' && (
          <>
            {renderField('Siffra', scene.number, 'number')}
            {renderField('Etikett', scene.label, 'label')}
            {renderField('Beskrivning', scene.description || '', 'description')}
          </>
        )}
        {scene.type === 'icon-grid' && (
          <>
            {renderField('Titel', scene.title, 'title')}
          </>
        )}
        {scene.type === 'bars' && (
          <div>
            <label className="motion-editor-label">Staplar</label>
            {scene.bars.map((bar, bi) => (
              <div key={bi} className="motion-editor-row" style={{ marginBottom: '0.375rem' }}>
                <input className={fieldClass} value={bar.label} onChange={(e) => {
                  const bars = [...scene.bars];
                  bars[bi] = { ...bars[bi], label: e.target.value };
                  onChange({ bars } as Partial<Scene>);
                }} placeholder="Etikett" />
                <input className={fieldClass} type="number" value={bar.value} onChange={(e) => {
                  const bars = [...scene.bars];
                  bars[bi] = { ...bars[bi], value: Number(e.target.value) };
                  onChange({ bars } as Partial<Scene>);
                }} placeholder="Värde" style={{ maxWidth: '80px' }} />
              </div>
            ))}
          </div>
        )}
        {scene.type === 'lottie' && (
          <>
            {renderField('Rubrik', scene.headline || '', 'headline')}
            {renderField('Bildtext', scene.caption || '', 'caption')}
          </>
        )}
        {scene.type === 'canvas' && (
          <div>
            <label className="motion-editor-label">Beskrivning</label>
            <p className="text-xs text-white/40 mt-1">Canvas-scener redigeras via prompt</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getScenePreview(scene: Scene): string {
  switch (scene.type) {
    case 'title':
      return scene.headline.replace(/\n/g, ' ');
    case 'counter':
      return `${scene.label}: ${scene.toValue.toLocaleString('sv-SE')}${scene.suffix || ''}`;
    case 'bars':
      return scene.bars.map((b) => b.label).join(', ');
    case 'text-reveal':
      return scene.lines.join(' ');
    case 'icon-grid':
      return scene.title;
    case 'cta':
      return scene.headline;
    case 'split':
      return `${scene.leftLabel} vs ${scene.rightLabel}`;
    case 'highlight-number':
      return `${scene.number} — ${scene.label}`;
    case 'lottie':
      return scene.headline || scene.animationId || 'Animation';
    case 'canvas':
      return scene.description || (scene.compileError ? `⚠️ ${scene.compileError}` : 'Fri komposition');
    default:
      return '';
  }
}
