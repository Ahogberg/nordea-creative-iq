'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Pencil, Trash2, X, Loader2, Search, MessageCircle, Target, AlertCircle,
  Sparkles, Users, Send, Smartphone, Phone, Building2, Globe, Quote, UserRound,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PERSONA_LIBRARY, type PersonaProfile } from '@/lib/persona-library';
import { PersonaImage } from '@/components/ui/persona-image';
import { Topbar } from '@/components/layout/topbar';
import { PageHeading } from '@/components/layout/page-heading';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { NordeaBadge } from '@/components/ui/nordea-badge';
import type { Persona, PersonaInsert } from '@/types/database';

type PersonaForm = {
  name: string;
  description: string;
  avatar: string;
  age_min: number;
  age_max: number;
  life_stage: string;
  income_level: string;
  location: string;
  traits: string[];
  goals: string[];
  pain_points: string[];
  interests: string[];
  products_interested: string[];
  digital_maturity: 'low' | 'medium' | 'high';
  channel_preference: string[];
  system_prompt: string;
  response_style: 'skeptical' | 'curious' | 'enthusiastic' | 'neutral';
};

const emptyForm: PersonaForm = {
  name: '', description: '', avatar: '', age_min: 25, age_max: 45,
  life_stage: 'young_professional', income_level: 'medium', location: 'urban',
  traits: [], goals: [], pain_points: [], interests: [], products_interested: [],
  digital_maturity: 'medium', channel_preference: ['app', 'web'],
  system_prompt: '', response_style: 'neutral',
};

function TagInput({ label, tags, onChange, placeholder }: { label: string; tags: string[]; onChange: (tags: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');
  const addTag = () => { if (input.trim() && !tags.includes(input.trim())) { onChange([...tags, input.trim()]); setInput(''); } };
  return (
    <div className="space-y-2">
      <Label className="text-sm text-gray-700">{label}</Label>
      <div className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder={placeholder} className="flex-1" />
        <Button type="button" variant="outline" onClick={addTag} size="sm" className="border-gray-200 text-gray-700 hover:bg-gray-50">Lägg till</Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
            {tag}
            <X className="w-3 h-3 cursor-pointer hover:text-nordea-accent-red" onClick={() => onChange(tags.filter((t) => t !== tag))} />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPersona, setEditingPersona] = useState<PersonaForm | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLibraryPersona, setSelectedLibraryPersona] = useState<PersonaProfile | null>(null);
  const [tab, setTab] = useState<'library' | 'custom'>('library');
  const [chatSending, setChatSending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'persona'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  const supabase = createClient();

  const fetchPersonas = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setPersonas([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from('personas').select('*').or(`user_id.eq.${user.id},is_default.eq.true`).order('is_default', { ascending: false }).order('created_at', { ascending: true });
    if (error || !data || data.length === 0) {
      setPersonas([]);
    } else {
      setPersonas(data as Persona[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // Use microtask to avoid synchronous setState during effect
    const timer = setTimeout(() => { fetchPersonas(); }, 0);
    return () => clearTimeout(timer);
  }, [fetchPersonas]);

  const handleSave = async () => {
    if (!editingPersona || !editingPersona.name) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (editingId && !editingId.startsWith('default-')) {
      const { error } = await supabase.from('personas').update({ name: editingPersona.name, description: editingPersona.description || null, avatar: editingPersona.avatar || '', age_min: editingPersona.age_min, age_max: editingPersona.age_max, life_stage: editingPersona.life_stage, income_level: editingPersona.income_level, location: editingPersona.location, traits: editingPersona.traits, goals: editingPersona.goals, pain_points: editingPersona.pain_points, interests: editingPersona.interests, products_interested: editingPersona.products_interested, digital_maturity: editingPersona.digital_maturity, channel_preference: editingPersona.channel_preference, system_prompt: editingPersona.system_prompt || null, response_style: editingPersona.response_style }).eq('id', editingId);
      if (error) { setPersonas((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...editingPersona } : p))); } else { await fetchPersonas(); }
    } else {
      const insert: PersonaInsert = { user_id: user?.id || null, name: editingPersona.name, description: editingPersona.description || null, avatar: editingPersona.avatar || '', age_min: editingPersona.age_min, age_max: editingPersona.age_max, life_stage: editingPersona.life_stage, income_level: editingPersona.income_level, location: editingPersona.location, traits: editingPersona.traits, goals: editingPersona.goals, pain_points: editingPersona.pain_points, interests: editingPersona.interests, products_interested: editingPersona.products_interested, digital_maturity: editingPersona.digital_maturity, channel_preference: editingPersona.channel_preference, system_prompt: editingPersona.system_prompt || null, response_style: editingPersona.response_style, is_default: false, is_active: true };
      const { error } = await supabase.from('personas').insert(insert);
      if (error) { setPersonas((prev) => [...prev, { ...insert, id: `local-${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]); } else { await fetchPersonas(); }
    }
    setSaving(false); setDialogOpen(false); setEditingPersona(null); setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ta bort denna persona?')) return;
    if (id.startsWith('default-') || id.startsWith('local-')) { setPersonas((prev) => prev.filter((p) => p.id !== id)); return; }
    const { error } = await supabase.from('personas').delete().eq('id', id);
    if (error) { setPersonas((prev) => prev.filter((p) => p.id !== id)); } else { await fetchPersonas(); }
  };

  const openEdit = (persona: Persona) => {
    setEditingPersona({ name: persona.name, description: persona.description || '', avatar: persona.avatar, age_min: persona.age_min || 25, age_max: persona.age_max || 45, life_stage: persona.life_stage || '', income_level: persona.income_level || 'medium', location: persona.location || 'urban', traits: persona.traits || [], goals: persona.goals || [], pain_points: persona.pain_points || [], interests: persona.interests || [], products_interested: persona.products_interested || [], digital_maturity: persona.digital_maturity, channel_preference: persona.channel_preference || [], system_prompt: persona.system_prompt || '', response_style: persona.response_style });
    setEditingId(persona.id); setDialogOpen(true);
  };

  const openCreate = () => { setEditingPersona({ ...emptyForm }); setEditingId(null); setDialogOpen(true); };

  const handleStartChat = (persona: PersonaProfile) => {
    setSelectedLibraryPersona(persona);
    setChatOpen(true);
    setChatMessages([{ role: 'persona', content: `Hej! Jag är ${persona.name.split(' ')[0]}. ${persona.quote} Vad vill du veta?` }]);
  };

  const selectPersona = (persona: PersonaProfile) => {
    if (selectedLibraryPersona?.id !== persona.id) {
      setChatOpen(false);
      setChatMessages([]);
    }
    setSelectedLibraryPersona(persona);
  };

  useEffect(() => {
    // Scrolla bara meddelandelistan — inte hela sidan.
    const el = chatScrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [chatMessages, chatSending]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedLibraryPersona || chatSending) return;
    const message = chatInput;
    const history = chatMessages;
    setChatMessages(prev => [...prev, { role: 'user', content: message }]);
    setChatInput('');
    setChatSending(true);
    try {
      const res = await fetch('/api/persona-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId: selectedLibraryPersona.id,
          personaName: selectedLibraryPersona.shortName,
          messages: history.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
          newMessage: message,
        }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'persona', content: data.reply || 'Kunde inte svara.' }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'persona', content: 'Något gick fel — försök igen.' }]);
    } finally {
      setChatSending(false);
    }
  };

  // Standardpersonas visas i biblioteket; här listas bara egna.
  const customPersonas = personas.filter((p) => !p.is_default);

  const q = searchQuery.toLowerCase();
  const filteredLibraryPersonas = PERSONA_LIBRARY.filter(p =>
    p.name.toLowerCase().includes(q) || p.shortName.toLowerCase().includes(q) || p.traits.some(t => t.toLowerCase().includes(q))
  );

  const selected = selectedLibraryPersona;

  return (
    <div className="min-h-screen bg-nordea-bg">
      <Topbar
        breadcrumb={['Målgrupper', 'Personas']}
        right={
          <button type="button" onClick={openCreate} className="nordea-btn nordea-btn-cobalt">
            <Plus className="w-4 h-4" /> Skapa persona
          </button>
        }
      />

      <div className="px-8 py-7 max-w-[1400px] mx-auto">
        <PageHeading
          eyebrow="Virtual Focus Group · Sverige"
          title="Personas"
          description="Simulerade kunder som reagerar på annonser i Ad Studio, QA-juryn och chatten. Samma personas överallt."
          right={
            <SegmentedTabs
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'library', label: 'Bibliotek', icon: Users, count: PERSONA_LIBRARY.length },
                { id: 'custom', label: 'Mina personas', icon: UserRound, count: customPersonas.length },
              ]}
            />
          }
        />

        {tab === 'library' ? (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5 items-start">
            <div>
              <div className="relative max-w-sm mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-nordea-text-tertiary" />
                <input
                  type="text"
                  placeholder="Sök persona eller karaktärsdrag…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="nordea-input pl-9 w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLibraryPersonas.map((persona) => {
                  const isSelected = selected?.id === persona.id;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => selectPersona(persona)}
                      className={`nordea-card text-left p-5 group transition-all ${
                        isSelected ? 'ring-2 ring-nordea-blue border-transparent' : 'hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <PersonaImage name={persona.name} color={persona.color} size="lg" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-nordea-text truncate">{persona.name}</h3>
                          <p className="text-xs text-nordea-text-tertiary mt-0.5">
                            {persona.shortName} · {persona.age.min}–{persona.age.max} år
                          </p>
                          <p className="text-[13px] text-nordea-text-secondary mt-2.5 line-clamp-2 leading-relaxed">
                            {persona.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 mt-4 pt-3.5 border-t border-nordea-hairline">
                        <div className="flex gap-1.5">
                          {persona.productsInterested.slice(0, 2).map((pr) => (
                            <NordeaBadge key={pr} tone="neutral" className="whitespace-nowrap">{pr}</NordeaBadge>
                          ))}
                          {persona.productsInterested.length > 2 && (
                            <NordeaBadge tone="neutral">+{persona.productsInterested.length - 2}</NordeaBadge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-auto">
                          <ResponseStyleBadge style={persona.responseStyle} />
                          <DigitalMaturity level={persona.digitalMaturity} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="xl:sticky xl:top-6">
              {selected ? (
                <div className="nordea-card overflow-hidden">
                  <div className={`relative bg-gradient-to-br ${selected.color} px-5 pt-5 pb-5 text-white`}>
                    <div aria-hidden className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, white 0, transparent 45%)' }} />
                    <div className="relative flex items-center gap-4">
                      <div className="rounded-2xl ring-2 ring-white/40">
                        <PersonaImage name={selected.name} color="from-white/20 to-white/5" size="xl" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-[0.08em] text-white/70">{selected.shortName}</div>
                        <h3 className="nordea-display text-2xl truncate">{selected.name}</h3>
                        <div className="text-sm text-white/80">{selected.representativeAge} år · {selected.age.min}–{selected.age.max} år i segmentet</div>
                      </div>
                      {chatOpen && (
                        <button
                          type="button"
                          onClick={() => setChatOpen(false)}
                          aria-label="Stäng chatten"
                          className="ml-auto w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {!chatOpen ? (
                    <div className="p-5">
                      <div className="relative rounded-xl bg-nordea-bg px-4 py-3.5 mb-5">
                        <Quote className="absolute -top-2 left-3 w-4 h-4 text-nordea-blue fill-nordea-blue/10" />
                        <p className="text-[13px] text-nordea-text italic leading-relaxed">{selected.quote}</p>
                      </div>
                      <DetailList icon={Target} title="Mål" items={selected.goals} tone="text-nordea-blue" />
                      <DetailList icon={AlertCircle} title="Smärtpunkter" items={selected.painPoints} tone="text-nordea-rose" />
                      <div className="mb-5">
                        <div className="flex items-center gap-2 nordea-eyebrow mb-2">
                          <Sparkles className="w-3.5 h-3.5 text-nordea-teal" /> Karaktär
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selected.traits.map((t) => <NordeaBadge key={t} tone="cobalt">{t}</NordeaBadge>)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-nordea-text-tertiary mb-5">
                        <span>Når bäst via</span>
                        <ChannelIcons channels={selected.channelPreference} />
                      </div>
                      <button type="button" onClick={() => handleStartChat(selected)} className="nordea-btn nordea-btn-cobalt nordea-btn-lg nordea-btn-full">
                        <MessageCircle className="w-4 h-4" /> Chatta med {selected.name.split(' ')[0]}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col h-[440px]">
                      <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
                        {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}>
                            <div
                              className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                                msg.role === 'user'
                                  ? 'bg-nordea-blue text-white rounded-2xl rounded-br-md'
                                  : 'bg-nordea-bg text-nordea-text rounded-2xl rounded-bl-md border border-nordea-hairline'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        {chatSending && (
                          <div className="flex justify-start">
                            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-nordea-bg border border-nordea-hairline flex gap-1">
                              {[0, 150, 300].map((d) => (
                                <span key={d} className="w-1.5 h-1.5 rounded-full bg-nordea-text-tertiary animate-bounce" style={{ animationDelay: `${d}ms` }} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-3 border-t border-nordea-hairline flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder={`Fråga ${selected.name.split(' ')[0]} något…`}
                          className="nordea-input flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleSendMessage}
                          disabled={!chatInput.trim() || chatSending}
                          aria-label="Skicka"
                          className="nordea-btn nordea-btn-cobalt w-9 px-0 disabled:opacity-40"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="nordea-card p-10 text-center">
                  <div className="flex justify-center -space-x-3 mb-4">
                    {PERSONA_LIBRARY.slice(0, 4).map((p) => (
                      <div key={p.id} className="rounded-xl ring-2 ring-white">
                        <PersonaImage name={p.name} color={p.color} size="md" />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-nordea-text">Välj en persona</p>
                  <p className="text-xs text-nordea-text-tertiary mt-1">Se profilen och chatta direkt</p>
                </div>
              )}
            </div>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-nordea-blue" /></div>
        ) : customPersonas.length === 0 ? (
          <div className="nordea-card py-16 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-nordea-blue-soft text-nordea-blue flex items-center justify-center mb-4">
              <UserRound className="w-6 h-6" />
            </div>
            <p className="font-semibold text-nordea-text">Inga egna personas ännu</p>
            <p className="text-sm text-nordea-text-tertiary mt-1 mb-5">Skapa en persona för en målgrupp som biblioteket inte täcker.</p>
            <button type="button" onClick={openCreate} className="nordea-btn nordea-btn-cobalt">
              <Plus className="w-4 h-4" /> Skapa persona
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {customPersonas.map((persona) => (
              <div key={persona.id} className="nordea-card p-5 flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <PersonaImage name={persona.name} color="from-nordea-blue to-nordea-deep" size="md" />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-nordea-text text-sm truncate">{persona.name}</h3>
                    <p className="text-xs text-nordea-text-tertiary">{persona.age_min}–{persona.age_max} år</p>
                  </div>
                </div>
                {persona.description && <p className="text-[13px] text-nordea-text-secondary mb-3 line-clamp-2">{persona.description}</p>}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {persona.traits?.slice(0, 3).map((t) => <NordeaBadge key={t} tone="neutral">{t}</NordeaBadge>)}
                </div>
                <div className="flex gap-2 mt-auto">
                  <button type="button" className="nordea-btn nordea-btn-secondary nordea-btn-sm flex-1" onClick={() => openEdit(persona)}>
                    <Pencil className="w-3 h-3" /> Redigera
                  </button>
                  <button type="button" aria-label="Ta bort" className="nordea-btn nordea-btn-destructive nordea-btn-sm" onClick={() => handleDelete(persona.id)}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Redigera persona' : 'Skapa ny persona'}</DialogTitle></DialogHeader>
          {editingPersona && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Namn</Label><Input value={editingPersona.name} onChange={(e) => setEditingPersona({ ...editingPersona, name: e.target.value })} placeholder="T.ex. Nyinflyttad i Sverige" /></div>
                <div className="space-y-2"><Label>Avatar (emoji)</Label><Input value={editingPersona.avatar} onChange={(e) => setEditingPersona({ ...editingPersona, avatar: e.target.value })} placeholder="" /></div>
              </div>
              <div className="space-y-2"><Label>Beskrivning</Label><Textarea value={editingPersona.description} onChange={(e) => setEditingPersona({ ...editingPersona, description: e.target.value })} placeholder="Kort beskrivning..." rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Ålder (min)</Label><Input type="number" value={editingPersona.age_min} onChange={(e) => setEditingPersona({ ...editingPersona, age_min: parseInt(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label>Ålder (max)</Label><Input type="number" value={editingPersona.age_max} onChange={(e) => setEditingPersona({ ...editingPersona, age_max: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Digital mognad</Label><Select value={editingPersona.digital_maturity} onValueChange={(v) => setEditingPersona({ ...editingPersona, digital_maturity: v as 'low' | 'medium' | 'high' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Låg</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">Hög</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Responsstil</Label><Select value={editingPersona.response_style} onValueChange={(v) => setEditingPersona({ ...editingPersona, response_style: v as PersonaForm['response_style'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="neutral">Neutral</SelectItem><SelectItem value="skeptical">Skeptisk</SelectItem><SelectItem value="curious">Nyfiken</SelectItem><SelectItem value="enthusiastic">Entusiastisk</SelectItem></SelectContent></Select></div>
              </div>
              <TagInput label="Karaktärsdrag" tags={editingPersona.traits} onChange={(traits) => setEditingPersona({ ...editingPersona, traits })} placeholder="T.ex. Riskavert" />
              <TagInput label="Mål" tags={editingPersona.goals} onChange={(goals) => setEditingPersona({ ...editingPersona, goals })} placeholder="T.ex. Spara till kontantinsats" />
              <TagInput label="Smärtpunkter" tags={editingPersona.pain_points} onChange={(pain_points) => setEditingPersona({ ...editingPersona, pain_points })} placeholder="T.ex. Svårt att jämföra" />
              <TagInput label="Produktintresse" tags={editingPersona.products_interested} onChange={(products_interested) => setEditingPersona({ ...editingPersona, products_interested })} placeholder="T.ex. Fonder" />
              <div className="space-y-2"><Label>Instruktion till AI:n</Label><Textarea value={editingPersona.system_prompt} onChange={(e) => setEditingPersona({ ...editingPersona, system_prompt: e.target.value })} placeholder="Beskriv hur personan ska bete sig…" rows={3} /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" className="nordea-btn nordea-btn-secondary flex-1" onClick={() => setDialogOpen(false)}>Avbryt</button>
                <button type="button" className="nordea-btn nordea-btn-cobalt flex-1" onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editingId ? 'Spara' : 'Skapa'}</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const RESPONSE_STYLE: Record<PersonaProfile['responseStyle'], { label: string; tone: 'amber' | 'teal' | 'green' | 'neutral' }> = {
  skeptical: { label: 'Skeptisk', tone: 'amber' },
  curious: { label: 'Nyfiken', tone: 'teal' },
  enthusiastic: { label: 'Positiv', tone: 'green' },
  neutral: { label: 'Saklig', tone: 'neutral' },
};

function ResponseStyleBadge({ style }: { style: PersonaProfile['responseStyle'] }) {
  const s = RESPONSE_STYLE[style];
  return <NordeaBadge tone={s.tone} dot className="shrink-0">{s.label}</NordeaBadge>;
}

function DigitalMaturity({ level }: { level: PersonaProfile['digitalMaturity'] }) {
  const filled = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  return (
    <div className="flex items-center gap-1.5 shrink-0" title={`Digital mognad: ${level === 'high' ? 'hög' : level === 'medium' ? 'medel' : 'låg'}`}>
      <Smartphone className="w-3 h-3 text-nordea-text-tertiary" />
      {[1, 2, 3].map((i) => (
        <span key={i} className={`w-1.5 h-3 rounded-sm ${i <= filled ? 'bg-nordea-blue' : 'bg-nordea-blue-soft'}`} />
      ))}
    </div>
  );
}

const CHANNEL_ICONS: Record<string, { icon: typeof Globe; label: string }> = {
  app: { icon: Smartphone, label: 'App' },
  web: { icon: Globe, label: 'Webb' },
  phone: { icon: Phone, label: 'Telefon' },
  branch: { icon: Building2, label: 'Kontor' },
  social: { icon: Users, label: 'Sociala medier' },
};

function ChannelIcons({ channels }: { channels: string[] }) {
  return (
    <div className="flex gap-1.5">
      {channels.map((c) => {
        const entry = CHANNEL_ICONS[c];
        if (!entry) return null;
        const Icon = entry.icon;
        return (
          <span key={c} title={entry.label} className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-nordea-bg text-nordea-text-secondary">
            <Icon className="w-3 h-3" /> {entry.label}
          </span>
        );
      })}
    </div>
  );
}

function DetailList({ icon: Icon, title, items, tone }: { icon: typeof Target; title: string; items: string[]; tone: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 nordea-eyebrow mb-2">
        <Icon className={`w-3.5 h-3.5 ${tone}`} /> {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-[13px] text-nordea-text-secondary leading-snug">
            <span className="mt-[7px] w-1 h-1 rounded-full bg-nordea-text-faint shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
