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
            <h1 className="text-2xl font-semibold text-gray-900">Mallbibliotek</h1>
            <p className="text-sm text-gray-500 mt-1">
              {templates.length} {templates.length === 1 ? 'mall' : 'mallar'}
            </p>
          </div>
          <Link
            href="/motion-studio"
            className="px-4 py-2 bg-nordea-blue hover:bg-nordea-blue/80 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Skapa ny i Motion Studio
          </Link>
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök mallar..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300"
            />
          </div>
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-8">
            {/* Favorites */}
            {favoriteTemplates.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
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
                <h2 className="text-sm font-medium text-gray-500 mb-4">
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
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Inga mallar ännu</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
        Skapa en annons i editorn och spara den som mall för att komma igång med bulk-produktion.
      </p>
      <Link
        href="/motion-studio"
        className="inline-flex items-center gap-2 px-4 py-2 bg-nordea-blue hover:bg-nordea-blue/80 rounded-lg text-white font-medium transition-colors"
      >
        <Plus className="w-4 h-4" />
        Skapa i Motion Studio
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

  const formatLabel = (() => {
    const f = template.config.format;
    if (f === 'story') return '9:16';
    if (f === 'feed') return '1:1';
    if (f === 'landscape') return '16:9';
    if (f === 'vertical') return '4:5';
    return f;
  })();
  const sceneCount = template.config.scenes.length;

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group">
        <div
          className="w-16 h-16 rounded-lg flex-shrink-0"
          style={{ backgroundColor: template.config.backgroundColor || '#00005E' }}
        />

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
          <p className="text-sm text-gray-500">
            {sceneCount} scener &bull; {formatLabel}
          </p>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/produce?template=${template.id}`}
            className="px-3 py-1.5 bg-nordea-blue/10 text-nordea-blue rounded-lg text-sm font-medium hover:bg-nordea-blue/20"
          >
            Producera
          </Link>
          <button
            onClick={() => onToggleFavorite(template.id, template.is_favorite)}
            className={`p-2 rounded-lg ${template.is_favorite ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Star className={`w-4 h-4 ${template.is_favorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors group">
      {/* Thumbnail */}
      <div
        className="aspect-video relative"
        style={{ backgroundColor: template.config.backgroundColor || '#00005E' }}
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
            <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {sceneCount} scener &bull; {formatLabel}
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg py-1 shadow-xl min-w-[140px]">
                  <Link
                    href={`/produce?template=${template.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicera
                  </Link>
                  <button
                    onClick={() => { setShowMenu(false); onDelete(template.id); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-gray-50"
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
