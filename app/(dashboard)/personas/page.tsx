'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { defaultPersonas } from '@/lib/constants/personas';
import { SectionHeader, PersonaAvatar, StatusBadge } from '@/components/ui/nordea';
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
  name: '',
  description: '',
  avatar: '',
  age_min: 25,
  age_max: 45,
  life_stage: 'young_professional',
  income_level: 'medium',
  location: 'urban',
  traits: [],
  goals: [],
  pain_points: [],
  interests: [],
  products_interested: [],
  digital_maturity: 'medium',
  channel_preference: ['app', 'web'],
  system_prompt: '',
  response_style: 'neutral',
};

function TagInput({
  label,
  tags,
  onChange,
  placeholder,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');

  const addTag = () => {
    if (input.trim() && !tags.includes(input.trim())) {
      onChange([...tags, input.trim()]);
      setInput('');
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm text-gray-700">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={addTag} size="sm">
          Lägg till
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
            {tag}
            <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => onChange(tags.filter((t) => t !== tag))} />
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

  const supabase = createClient();

  const fetchPersonas = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setPersonas(
        defaultPersonas.map((p, i) => ({
          ...p,
          id: `default-${i}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      );
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .or(`user_id.eq.${user.id},is_default.eq.true`)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      setPersonas(
        defaultPersonas.map((p, i) => ({
          ...p,
          id: `default-${i}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      );
    } else {
      setPersonas(data as Persona[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  const handleSave = async () => {
    if (!editingPersona || !editingPersona.name) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (editingId && !editingId.startsWith('default-')) {
      const { error } = await supabase
        .from('personas')
        .update({
          name: editingPersona.name,
          description: editingPersona.description || null,
          avatar: editingPersona.avatar || '',
          age_min: editingPersona.age_min,
          age_max: editingPersona.age_max,
          life_stage: editingPersona.life_stage,
          income_level: editingPersona.income_level,
          location: editingPersona.location,
          traits: editingPersona.traits,
          goals: editingPersona.goals,
          pain_points: editingPersona.pain_points,
          interests: editingPersona.interests,
          products_interested: editingPersona.products_interested,
          digital_maturity: editingPersona.digital_maturity,
          channel_preference: editingPersona.channel_preference,
          system_prompt: editingPersona.system_prompt || null,
          response_style: editingPersona.response_style,
        })
        .eq('id', editingId);

      if (error) {
        console.error('Error updating persona:', error);
        setPersonas((prev) =>
          prev.map((p) => (p.id === editingId ? { ...p, ...editingPersona } : p))
        );
      } else {
        await fetchPersonas();
      }
    } else {
      const insert: PersonaInsert = {
        user_id: user?.id || null,
        name: editingPersona.name,
        description: editingPersona.description || null,
        avatar: editingPersona.avatar || '',
        age_min: editingPersona.age_min,
        age_max: editingPersona.age_max,
        life_stage: editingPersona.life_stage,
        income_level: editingPersona.income_level,
        location: editingPersona.location,
        traits: editingPersona.traits,
        goals: editingPersona.goals,
        pain_points: editingPersona.pain_points,
        interests: editingPersona.interests,
        products_interested: editingPersona.products_interested,
        digital_maturity: editingPersona.digital_maturity,
        channel_preference: editingPersona.channel_preference,
        system_prompt: editingPersona.system_prompt || null,
        response_style: editingPersona.response_style,
        is_default: false,
        is_active: true,
      };

      const { error } = await supabase.from('personas').insert(insert);

      if (error) {
        console.error('Error creating persona:', error);
        setPersonas((prev) => [
          ...prev,
          {
            ...insert,
            id: `local-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      } else {
        await fetchPersonas();
      }
    }

    setSaving(false);
    setDialogOpen(false);
    setEditingPersona(null);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ta bort denna persona?')) return;

    if (id.startsWith('default-') || id.startsWith('local-')) {
      setPersonas((prev) => prev.filter((p) => p.id !== id));
      return;
    }

    const { error } = await supabase.from('personas').delete().eq('id', id);
    if (error) {
      console.error('Error deleting persona:', error);
      setPersonas((prev) => prev.filter((p) => p.id !== id));
    } else {
      await fetchPersonas();
    }
  };

  const openEdit = (persona: Persona) => {
    setEditingPersona({
      name: persona.name,
      description: persona.description || '',
      avatar: persona.avatar,
      age_min: persona.age_min || 25,
      age_max: persona.age_max || 45,
      life_stage: persona.life_stage || '',
      income_level: persona.income_level || 'medium',
      location: persona.location || 'urban',
      traits: persona.traits || [],
      goals: persona.goals || [],
      pain_points: persona.pain_points || [],
      interests: persona.interests || [],
      products_interested: persona.products_interested || [],
      digital_maturity: persona.digital_maturity,
      channel_preference: persona.channel_preference || [],
      system_prompt: persona.system_prompt || '',
      response_style: persona.response_style,
    });
    setEditingId(persona.id);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingPersona({ ...emptyForm });
    setEditingId(null);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <SectionHeader
        title="Personas"
        description="Hantera virtuella kundprofiler"
        action={
          <Button onClick={openCreate} className="bg-[#0000A0] hover:bg-[#00005E]">
            <Plus className="w-4 h-4 mr-2" />Skapa persona
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {personas.map((persona) => (
          <div key={persona.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <PersonaAvatar name={persona.name} />
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">{persona.name}</h3>
                  <p className="text-xs text-gray-500">{persona.age_min}-{persona.age_max} år</p>
                </div>
              </div>
              {persona.is_default && <StatusBadge status="neutral">Standard</StatusBadge>}
            </div>

            {persona.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{persona.description}</p>
            )}

            <div className="flex flex-wrap gap-1 mb-4">
              {persona.traits?.slice(0, 2).map((t) => (
                <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{t}</span>
              ))}
              {persona.traits?.length > 2 && (
                <span className="text-xs text-gray-400">+{persona.traits.length - 2}</span>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(persona)}>
                <Pencil className="w-3 h-3 mr-1" />Redigera
              </Button>
              {!persona.is_default && (
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(persona.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Redigera persona' : 'Skapa ny persona'}</DialogTitle>
          </DialogHeader>

          {editingPersona && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700">Namn</Label>
                  <Input
                    value={editingPersona.name}
                    onChange={(e) => setEditingPersona({ ...editingPersona, name: e.target.value })}
                    placeholder="T.ex. Spararen"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700">Avatar (emoji)</Label>
                  <Input
                    value={editingPersona.avatar}
                    onChange={(e) => setEditingPersona({ ...editingPersona, avatar: e.target.value })}
                    placeholder=""
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Beskrivning</Label>
                <Textarea
                  value={editingPersona.description}
                  onChange={(e) => setEditingPersona({ ...editingPersona, description: e.target.value })}
                  placeholder="Kort beskrivning..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700">Ålder (min)</Label>
                  <Input type="number" value={editingPersona.age_min} onChange={(e) => setEditingPersona({ ...editingPersona, age_min: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700">Ålder (max)</Label>
                  <Input type="number" value={editingPersona.age_max} onChange={(e) => setEditingPersona({ ...editingPersona, age_max: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700">Digital mognad</Label>
                  <Select value={editingPersona.digital_maturity} onValueChange={(v) => setEditingPersona({ ...editingPersona, digital_maturity: v as 'low' | 'medium' | 'high' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Låg</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">Hög</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700">Responsstil</Label>
                  <Select value={editingPersona.response_style} onValueChange={(v) => setEditingPersona({ ...editingPersona, response_style: v as PersonaForm['response_style'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="skeptical">Skeptisk</SelectItem>
                      <SelectItem value="curious">Nyfiken</SelectItem>
                      <SelectItem value="enthusiastic">Entusiastisk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TagInput label="Karaktärsdrag" tags={editingPersona.traits} onChange={(traits) => setEditingPersona({ ...editingPersona, traits })} placeholder="T.ex. Riskavert" />
              <TagInput label="Mål" tags={editingPersona.goals} onChange={(goals) => setEditingPersona({ ...editingPersona, goals })} placeholder="T.ex. Spara till kontantinsats" />
              <TagInput label="Smärtpunkter" tags={editingPersona.pain_points} onChange={(pain_points) => setEditingPersona({ ...editingPersona, pain_points })} placeholder="T.ex. Svårt att jämföra" />
              <TagInput label="Produktintresse" tags={editingPersona.products_interested} onChange={(products_interested) => setEditingPersona({ ...editingPersona, products_interested })} placeholder="T.ex. Fonder" />

              <div className="space-y-2">
                <Label className="text-sm text-gray-700">System Prompt (AI-instruktioner)</Label>
                <Textarea
                  value={editingPersona.system_prompt}
                  onChange={(e) => setEditingPersona({ ...editingPersona, system_prompt: e.target.value })}
                  placeholder="Beskriv hur denna persona ska bete sig..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Avbryt</Button>
                <Button className="flex-1 bg-[#0000A0] hover:bg-[#00005E]" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingId ? 'Spara' : 'Skapa'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
