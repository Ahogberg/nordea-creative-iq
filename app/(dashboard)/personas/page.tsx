'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, X, Loader2, Search, MessageCircle, Target, AlertCircle, Sparkles, ChevronRight, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { defaultPersonas } from '@/lib/constants/personas';
import { PERSONA_LIBRARY, type PersonaProfile } from '@/lib/persona-library';
import { PersonaImage } from '@/components/ui/persona-image';
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
      <Label className="text-sm text-white/70">{label}</Label>
      <div className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder={placeholder} className="flex-1" />
        <Button type="button" variant="outline" onClick={addTag} size="sm" className="border-white/10 text-white/70 hover:bg-white/5">Lägg till</Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 text-white/70 text-xs rounded">
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
  const [showLibrary, setShowLibrary] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'persona'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  const supabase = createClient();

  const fetchPersonas = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setPersonas(defaultPersonas.map((p, i) => ({ ...p, id: `default-${i}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })));
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from('personas').select('*').or(`user_id.eq.${user.id},is_default.eq.true`).order('is_default', { ascending: false }).order('created_at', { ascending: true });
    if (error || !data || data.length === 0) {
      setPersonas(defaultPersonas.map((p, i) => ({ ...p, id: `default-${i}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })));
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
    setSelectedLibraryPersona(persona); setChatOpen(true);
    setChatMessages([{ role: 'persona', content: `Hej! Jag är ${persona.name}. ${persona.quote} Vad vill du veta?` }]);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !selectedLibraryPersona) return;
    setChatMessages(prev => [...prev, { role: 'user', content: chatInput }]); setChatInput('');
    const p = selectedLibraryPersona;
    setTimeout(() => {
      const responses = [
        `Som ${p.shortName.toLowerCase()} tycker jag det beror på presentationen. ${p.painPoints[0]} är något jag tänker på.`,
        `Bra fråga! Det handlar om ${p.goals[0].toLowerCase()} för mig. Om annonsen adresserar det fångar ni min uppmärksamhet.`,
        `Jag är lite ${p.responseStyle === 'skeptical' ? 'skeptisk' : p.responseStyle === 'curious' ? 'nyfiken' : 'neutral'}. Men visa att ni förstår att ${p.painPoints[1]?.toLowerCase() || p.painPoints[0].toLowerCase()}, då lyssnar jag.`,
      ];
      setChatMessages(prev => [...prev, { role: 'persona', content: responses[Math.floor(Math.random() * responses.length)] }]);
    }, 1000);
  };

  const filteredLibraryPersonas = PERSONA_LIBRARY.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.shortName.toLowerCase().includes(searchQuery.toLowerCase()) || p.traits.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div className="max-w-7xl mx-auto flex justify-center py-20"><div className="spinner" /></div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Personas</h1>
          <p className="text-white/60">{PERSONA_LIBRARY.length} fördefinierade + {personas.length} anpassade kundprofiler</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Skapa persona</button>
      </div>

      <div className="tabs-list mb-6">
        <button onClick={() => setShowLibrary(true)} className={`tab-trigger ${showLibrary ? 'active' : ''}`}>Persona Library</button>
        <button onClick={() => setShowLibrary(false)} className={`tab-trigger ${!showLibrary ? 'active' : ''}`}>Mina personas ({personas.length})</button>
      </div>

      {showLibrary && (
        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input type="text" placeholder="Sök persona, karaktärsdrag..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="glass-input pl-10" />
        </div>
      )}

      {showLibrary ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLibraryPersonas.map((persona) => (
              <div key={persona.id} onClick={() => { setSelectedLibraryPersona(persona); setChatOpen(false); }} className={`persona-card ${selectedLibraryPersona?.id === persona.id ? 'selected' : ''}`}>
                <div className="flex items-start gap-4">
                  <PersonaImage name={persona.name} color={persona.color} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white">{persona.name}</h3>
                    <p className="text-sm text-white/50">{persona.shortName} · {persona.age.min}-{persona.age.max} år</p>
                    <p className="text-sm text-white/40 mt-2 line-clamp-2">{persona.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {persona.traits.slice(0, 3).map((trait, i) => (<span key={i} className="persona-trait">{trait}</span>))}
                  {persona.traits.length > 3 && <span className="persona-trait">+{persona.traits.length - 3}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            {selectedLibraryPersona ? (
              <div className="glass-card sticky top-8">
                {!chatOpen ? (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <PersonaImage name={selectedLibraryPersona.name} color={selectedLibraryPersona.color} size="xl" />
                      <div><h3 className="text-lg font-semibold text-white">{selectedLibraryPersona.name}</h3><p className="text-white/50">{selectedLibraryPersona.shortName}</p><p className="text-sm text-white/40">{selectedLibraryPersona.age.min}-{selectedLibraryPersona.age.max} år</p></div>
                    </div>
                    <blockquote className="text-white/70 italic border-l-2 border-nordea-medium pl-4 mb-6">&quot;{selectedLibraryPersona.quote}&quot;</blockquote>
                    <div className="space-y-4 mb-6">
                      <div><div className="flex items-center gap-2 text-sm font-medium text-white mb-2"><Target className="w-4 h-4 text-nordea-medium" /> Mål</div>{selectedLibraryPersona.goals.map((g, i) => <p key={i} className="text-sm text-white/60 mb-1">• {g}</p>)}</div>
                      <div><div className="flex items-center gap-2 text-sm font-medium text-white mb-2"><AlertCircle className="w-4 h-4 text-nordea-accent-yellow" /> Smärtpunkter</div>{selectedLibraryPersona.painPoints.map((p, i) => <p key={i} className="text-sm text-white/60 mb-1">• {p}</p>)}</div>
                      <div><div className="flex items-center gap-2 text-sm font-medium text-white mb-2"><Sparkles className="w-4 h-4 text-nordea-accent-green" /> Produktintresse</div><div className="flex flex-wrap gap-1.5">{selectedLibraryPersona.productsInterested.map((pr, i) => <span key={i} className="persona-trait">{pr}</span>)}</div></div>
                    </div>
                    <button onClick={() => handleStartChat(selectedLibraryPersona)} className="btn-primary w-full"><MessageCircle className="w-4 h-4" /> Chatta med {selectedLibraryPersona.name.split(' ')[0]}</button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3"><PersonaImage name={selectedLibraryPersona.name} color={selectedLibraryPersona.color} size="md" /><div><p className="font-medium text-white">{selectedLibraryPersona.name}</p><p className="text-xs text-white/50">Online</p></div></div>
                      <button onClick={() => setChatOpen(false)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="h-80 overflow-y-auto custom-scrollbar space-y-3 mb-4 flex flex-col">{chatMessages.map((msg, i) => <div key={i} className={`chat-message ${msg.role}`}>{msg.content}</div>)}</div>
                    <div className="flex gap-2"><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Skriv ett meddelande..." className="chat-input" /><button onClick={handleSendMessage} className="chat-send-btn"><ChevronRight className="w-5 h-5" /></button></div>
                  </>
                )}
              </div>
            ) : (
              <div className="glass-card text-center py-12"><Users className="w-12 h-12 mx-auto text-white/20 mb-4" /><p className="text-white/50">Välj en persona för detaljer</p></div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {personas.map((persona) => (
            <div key={persona.id} className="glass-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3"><PersonaImage name={persona.name} size="md" /><div><h3 className="font-medium text-white text-sm">{persona.name}</h3><p className="text-xs text-white/50">{persona.age_min}-{persona.age_max} år</p></div></div>
                {persona.is_default && <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/60">Standard</span>}
              </div>
              {persona.description && <p className="text-sm text-white/60 mb-3 line-clamp-2">{persona.description}</p>}
              <div className="flex flex-wrap gap-1 mb-4">{persona.traits?.slice(0, 2).map((t) => <span key={t} className="persona-trait">{t}</span>)}{persona.traits?.length > 2 && <span className="text-xs text-white/40">+{persona.traits.length - 2}</span>}</div>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1 text-sm py-2" onClick={() => openEdit(persona)}><Pencil className="w-3 h-3" /> Redigera</button>
                {!persona.is_default && <button className="btn-secondary text-sm py-2 text-nordea-accent-red" onClick={() => handleDelete(persona.id)}><Trash2 className="w-3 h-3" /></button>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Redigera persona' : 'Skapa ny persona'}</DialogTitle></DialogHeader>
          {editingPersona && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Namn</Label><Input value={editingPersona.name} onChange={(e) => setEditingPersona({ ...editingPersona, name: e.target.value })} placeholder="T.ex. Spararen" /></div>
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
              <div className="space-y-2"><Label>System Prompt</Label><Textarea value={editingPersona.system_prompt} onChange={(e) => setEditingPersona({ ...editingPersona, system_prompt: e.target.value })} placeholder="Beskriv hur persona ska bete sig..." rows={3} /></div>
              <div className="flex gap-3 pt-4">
                <button className="btn-secondary flex-1" onClick={() => setDialogOpen(false)}>Avbryt</button>
                <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editingId ? 'Spara' : 'Skapa'}</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
