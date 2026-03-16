'use client';

import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import type { VideoConfig } from '@/lib/video-types';
import { videoConfigToTemplate } from '@/lib/video-types';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: VideoConfig;
  onSaved: (templateId: string) => void;
}

export function SaveTemplateModal({ isOpen, onClose, config, onSaved }: SaveTemplateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Ange ett namn för mallen');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const templateData = videoConfigToTemplate(config, name, description);

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) throw new Error('Failed to save');

      const { template } = await response.json();
      onSaved(template.id);
      onClose();
    } catch {
      setError('Kunde inte spara mallen. Försök igen.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#0a0a1a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold text-white mb-1">Spara som mall</h2>
        <p className="text-sm text-white/50 mb-6">
          Mallen sparar design och timing. Texterna blir variabla platshållare.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Mallnamn *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="T.ex. Sparande Q1 2025"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1.5">Beskrivning (valfritt)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kort beskrivning av mallen..."
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 resize-none"
            />
          </div>

          {/* Preview what will be saved */}
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-xs text-white/40 mb-2">Sparas i mallen:</p>
            <ul className="text-xs text-white/60 space-y-1">
              <li>• Bakgrund: {config.background.type}</li>
              <li>• Logo: {config.logo.visible ? config.logo.position : 'Dold'}</li>
              <li>• Textplattor: {config.textPlates.length} st</li>
              <li>• Duration: {(config.durationInFrames / config.fps).toFixed(1)}s</li>
            </ul>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-medium transition-colors"
            >
              Avbryt
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-nordea-blue hover:bg-nordea-blue/80 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Sparar...' : 'Spara mall'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
