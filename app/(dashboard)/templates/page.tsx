'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Star,
  MoreHorizontal,
  Play,
  Copy,
  Trash2,
  Loader2,
  LayoutGrid,
  List,
  Search,
  Sparkles,
} from 'lucide-react';
import type { Template } from '@/lib/video-types';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const { templates } = await res.json();
        setTemplates(templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { fetchTemplates(); }, 0);
    return () => clearTimeout(timer);
  }, [fetchTemplates]);

  const toggleFavorite = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: !current }),
      });
      setTemplates(prev => prev.map(t =>
        t.id === id ? { ...t, is_favorite: !current } : t
      ));
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna mall?')) return;

    try {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteTemplates = filteredTemplates.filter(t => t.is_favorite);
  const otherTemplates = filteredTemplates.filter(t => !t.is_favorite);

  return (
    <div className="main-content">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white">Mallbibliotek</h1>
            <p className="text-sm text-white/50 mt-1">
              {templates.length} {templates.length === 1 ? 'mall' : 'mallar'}
            </p>
          </div>
          <Link
            href="/ad-studio"
            className="px-4 py-2 bg-nordea-blue hover:bg-nordea-blue/80 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Skapa ny
          </Link>
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök mallar..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
            />
          </div>
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-8">
            {/* Favorites */}
            {favoriteTemplates.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-white/50 mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 fill-current" />
                  Favoriter
                </h2>
                <div className={viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-2'
                }>
                  {favoriteTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      viewMode={viewMode}
                      onToggleFavorite={toggleFavorite}
                      onDelete={deleteTemplate}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* All templates */}
            {otherTemplates.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-white/50 mb-4">
                  {favoriteTemplates.length > 0 ? 'Alla mallar' : 'Dina mallar'}
                </h2>
                <div className={viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-2'
                }>
                  {otherTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      viewMode={viewMode}
                      onToggleFavorite={toggleFavorite}
                      onDelete={deleteTemplate}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-8 h-8 text-white/20" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">Inga mallar ännu</h3>
      <p className="text-sm text-white/50 mb-6 max-w-sm mx-auto">
        Skapa en annons i editorn och spara den som mall för att komma igång med bulk-produktion.
      </p>
      <Link
        href="/ad-studio"
        className="inline-flex items-center gap-2 px-4 py-2 bg-nordea-blue hover:bg-nordea-blue/80 rounded-lg text-white font-medium transition-colors"
      >
        <Plus className="w-4 h-4" />
        Skapa första mallen
      </Link>
    </div>
  );
}

function TemplateCard({
  template,
  viewMode,
  onToggleFavorite,
  onDelete,
}: {
  template: Template;
  viewMode: 'grid' | 'list';
  onToggleFavorite: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const formatsLabel = template.formats.map(f => {
    if (f === 'story') return '9:16';
    if (f === 'feed') return '1:1';
    if (f === 'landscape') return '16:9';
    return f;
  }).join(', ');

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.05] transition-colors group">
        <div
          className="w-16 h-16 rounded-lg flex-shrink-0"
          style={{ backgroundColor: template.background.solidColor || '#00005E' }}
        />

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{template.name}</h3>
          <p className="text-sm text-white/40">
            {template.text_structure.length} textplattor &bull; {formatsLabel}
          </p>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/produce?template=${template.id}`}
            className="px-3 py-1.5 bg-nordea-blue/20 text-nordea-medium rounded-lg text-sm font-medium hover:bg-nordea-blue/30"
          >
            Producera
          </Link>
          <button
            onClick={() => onToggleFavorite(template.id, template.is_favorite)}
            className={`p-2 rounded-lg ${template.is_favorite ? 'text-yellow-400' : 'text-white/40 hover:text-white/60'}`}
          >
            <Star className={`w-4 h-4 ${template.is_favorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.12] transition-colors group">
      {/* Thumbnail */}
      <div
        className="aspect-video relative"
        style={{
          background: template.background.type === 'gradient'
            ? `linear-gradient(${template.background.gradientAngle}deg, ${template.background.gradientStart}, ${template.background.gradientEnd})`
            : template.background.solidColor || '#00005E'
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Play className="w-5 h-5 text-white fill-current ml-0.5" />
          </div>
        </div>

        <button
          onClick={() => onToggleFavorite(template.id, template.is_favorite)}
          className={`absolute top-3 right-3 p-1.5 rounded-lg bg-black/30 backdrop-blur-sm ${
            template.is_favorite ? 'text-yellow-400' : 'text-white/60 hover:text-white'
          }`}
        >
          <Star className={`w-4 h-4 ${template.is_favorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-medium text-white truncate">{template.name}</h3>
            <p className="text-xs text-white/40 mt-0.5">
              {template.text_structure.length} textplattor &bull; {formatsLabel}
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-white/40 hover:text-white/60 rounded"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-8 z-20 bg-[#1a1a2e] border border-white/10 rounded-lg py-1 shadow-xl min-w-[140px]">
                  <Link
                    href={`/produce?template=${template.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/5"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicera
                  </Link>
                  <button
                    onClick={() => { setShowMenu(false); onDelete(template.id); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Ta bort
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Link
            href={`/produce?template=${template.id}`}
            className="flex-1 px-3 py-2 bg-nordea-blue hover:bg-nordea-blue/80 rounded-lg text-sm font-medium text-white text-center transition-colors"
          >
            Producera
          </Link>
        </div>
      </div>
    </div>
  );
}
