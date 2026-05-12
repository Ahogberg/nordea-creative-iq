'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Star,
  Trash2,
  Loader2,
  LayoutGrid as GridIcon,
  List as ListIcon,
  Search,
  Sparkles,
  ArrowRight,
  Filter,
  Layers,
} from 'lucide-react';
import type { Template } from '@/lib/video-types';
import { Topbar } from '@/components/layout/topbar';
import { SectionTitle } from '@/components/layout/section-title';
import { NordeaBadge } from '@/components/ui/nordea-badge';
import { FormatChip } from '@/components/ui/format-chip';

interface MasterSummary {
  id: string;
  name: string;
  source_format: string;
  updated_at: string;
}

// Category filter chips — static for now. TODO Sprint 8: derive from a
// `category` column on templates table.
const CATEGORIES = ['Alla', 'Varumärke', 'Bolån', 'Sparande', 'Kort', 'App', 'HR'];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [masters, setMasters] = useState<MasterSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState('Alla');

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

  const fetchMasters = useCallback(async () => {
    try {
      const res = await fetch('/api/master');
      if (res.ok) {
        const { masters } = await res.json();
        setMasters(masters || []);
      }
    } catch (error) {
      console.error('Error fetching masters:', error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTemplates();
      fetchMasters();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchTemplates, fetchMasters]);

  const toggleFavorite = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: !current }),
      });
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_favorite: !current } : t))
      );
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna mall?')) return;
    try {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favorites = filtered.filter((t) => t.is_favorite);
  const others = filtered.filter((t) => !t.is_favorite);

  return (
    <div className="min-h-screen bg-nordea-bg">
      <Topbar
        breadcrumb={['Mallar']}
        right={
          <Link href="/create/video" className="nordea-btn nordea-btn-primary">
            <Plus className="w-4 h-4" />
            Ny mall
          </Link>
        }
      />

      <div className="px-8 py-7 max-w-[1400px] mx-auto">
        {/* Hero */}
        <div className="mb-6">
          <h1 className="nordea-display text-3xl text-nordea-deep">Mallbibliotek</h1>
          <div className="text-sm text-nordea-text-tertiary mt-1">
            {templates.length} varumärkesgodkända layouter
            {favorites.length > 0 && ` · ${favorites.length} favoriter`}
          </div>
        </div>

        {/* Filter row */}
        <div className="flex gap-2.5 mb-6 items-center flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-nordea-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök mallar…"
              className="nordea-input pl-9 w-full"
            />
          </div>

          <div className="flex gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`h-9 px-3.5 inline-flex items-center text-xs font-medium rounded-md transition-colors ${
                  activeCategory === cat
                    ? 'bg-nordea-bg-hover border border-nordea-border text-nordea-text'
                    : 'text-nordea-text-secondary border border-transparent hover:bg-nordea-bg-hover'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <div className="flex bg-nordea-bg-hover rounded-md p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 h-7 inline-flex items-center text-xs font-medium rounded ${
                viewMode === 'grid' ? 'bg-white text-nordea-text shadow-sm' : 'text-nordea-text-tertiary'
              }`}
            >
              <GridIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 h-7 inline-flex items-center text-xs font-medium rounded ${
                viewMode === 'list' ? 'bg-white text-nordea-text shadow-sm' : 'text-nordea-text-tertiary'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <button className="w-9 h-9 inline-flex items-center justify-center bg-white border border-nordea-border rounded-md text-nordea-text-tertiary hover:text-nordea-text">
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-nordea-text-tertiary animate-spin" />
          </div>
        ) : templates.length === 0 && masters.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-8">
            {masters.length > 0 && (
              <section>
                <SectionTitle
                  title="Master creatives"
                  hint={`${masters.length} sparade · genererar alla format`}
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  {masters.map((master) => (
                    <Link
                      key={master.id}
                      href={`/create/master?id=${master.id}`}
                      className="nordea-card overflow-hidden flex flex-col text-left"
                    >
                      <div className="relative aspect-[16/10] bg-nordea-deep flex items-center justify-center">
                        <Layers className="w-6 h-6 text-white/50" />
                        <div className="absolute top-2 left-2">
                          <NordeaBadge tone="cobalt">Master</NordeaBadge>
                        </div>
                      </div>
                      <div className="p-3.5 flex flex-col flex-1">
                        <div className="text-sm font-medium text-nordea-text mb-2 line-clamp-1">
                          {master.name}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-nordea-text-tertiary mt-auto">
                          <span>4 format</span>
                          <span>
                            {new Date(master.updated_at).toLocaleDateString('sv-SE')}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {favorites.length > 0 && (
              <section>
                <SectionTitle title="Favoriter" hint="Fästade av ditt team" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  {favorites.map((t) => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      isFavorite
                      onToggleFavorite={toggleFavorite}
                      onDelete={deleteTemplate}
                    />
                  ))}
                </div>
              </section>
            )}

            {others.length > 0 && (
              <section>
                <SectionTitle title="Alla mallar" hint={`${others.length} visas`} />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  {others.map((t) => (
                    <TemplateCard
                      key={t.id}
                      template={t}
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
      <div className="w-16 h-16 bg-nordea-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-8 h-8 text-nordea-teal" />
      </div>
      <h3 className="text-lg font-semibold text-nordea-text mb-2">Inga mallar ännu</h3>
      <p className="text-sm text-nordea-text-tertiary mb-6 max-w-sm mx-auto">
        Skapa en video i Skapa-läget och spara den som mall för att komma igång med massproduktion.
      </p>
      <Link href="/create/video" className="nordea-btn nordea-btn-primary nordea-btn-lg inline-flex">
        <Plus className="w-4 h-4" />
        Skapa video
      </Link>
    </div>
  );
}

function TemplateCard({
  template,
  isFavorite,
  onToggleFavorite,
  onDelete,
}: {
  template: Template;
  isFavorite?: boolean;
  onToggleFavorite: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const formatLabel = (() => {
    const f = template.config.format;
    if (f === 'story') return '9:16';
    if (f === 'feed') return '1:1';
    if (f === 'landscape') return '16:9';
    if (f === 'vertical') return '4:5';
    return f;
  })();
  const sceneCount = template.config.scenes.length;

  return (
    <div className="nordea-card overflow-hidden flex flex-col">
      <div className="relative">
        <div
          className="aspect-[16/10]"
          style={{ backgroundColor: template.config.backgroundColor || '#00005E' }}
        />
        {isFavorite && (
          <div className="absolute top-2 left-2">
            <NordeaBadge tone="solid">
              <Star className="w-2.5 h-2.5 fill-current" />
              Favorit
            </NordeaBadge>
          </div>
        )}
        <button
          type="button"
          onClick={() => onToggleFavorite(template.id, template.is_favorite)}
          className={`absolute top-2 right-2 p-1.5 rounded-md ${
            template.is_favorite
              ? 'bg-white/90 text-nordea-amber'
              : 'bg-white/70 text-nordea-text-tertiary hover:text-nordea-text'
          } backdrop-blur-sm transition-colors`}
        >
          <Star className={`w-3.5 h-3.5 ${template.is_favorite ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="p-3.5 flex flex-col flex-1">
        <div className="text-sm font-medium text-nordea-text mb-2 line-clamp-1">
          {template.name}
        </div>
        <div className="flex gap-1 mb-2.5">
          <FormatChip ratio={formatLabel} />
          <span className="text-[10px] text-nordea-text-tertiary self-center">
            {sceneCount} scener
          </span>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-[11px] text-nordea-text-tertiary">
            {template.use_count} användningar
          </span>
          <div className="flex items-center gap-1">
            <Link
              href={`/produce?template=${template.id}`}
              className="text-xs font-medium text-nordea-blue inline-flex items-center gap-1 hover:underline"
            >
              Producera
              <ArrowRight className="w-3 h-3" />
            </Link>
            <button
              type="button"
              onClick={() => onDelete(template.id)}
              className="p-1 text-nordea-text-tertiary hover:text-nordea-rose"
              title="Ta bort"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
