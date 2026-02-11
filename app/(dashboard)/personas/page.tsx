'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { defaultPersonas } from '@/lib/constants/personas';
import { Persona } from '@/types/database';
import { cn } from '@/lib/utils';

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
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#0000A0]"
        />
        <button
          type="button"
          onClick={addTag}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-500 hover:border-gray-300"
        >
          Lagg till
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-600 bg-[#FAFAFA] rounded">
              {tag}
              <button onClick={() => onChange(tags.filter((t) => t !== tag))} className="text-gray-400 hover:text-gray-600">&times;</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState<(Omit<Persona, 'id' | 'created_at' | 'updated_at'> & { id: string })[]>(
    defaultPersonas.map((p, i) => ({ ...p, id: `default-${i}` }))
  );
  const [editingPersona, setEditingPersona] = useState<PersonaForm | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSave = () => {
    if (!editingPersona || !editingPersona.name) return;
    if (editingId) {
      setPersonas((prev) => prev.map((p) => p.id === editingId ? { ...p, ...editingPersona } : p));
    } else {
      setPersonas((prev) => [...prev, { ...editingPersona, id: `custom-${Date.now()}`, user_id: 'mock-user', is_default: false, is_active: true }]);
    }
    setDialogOpen(false);
    setEditingPersona(null);
    setEditingId(null);
  };

  const handleDelete = (id: string) => setPersonas((prev) => prev.filter((p) => p.id !== id));

  const openEdit = (persona: typeof personas[0]) => {
    setEditingPersona({
      name: persona.name, description: persona.description || '', avatar: persona.avatar,
      age_min: persona.age_min || 25, age_max: persona.age_max || 45,
      life_stage: persona.life_stage || '', income_level: persona.income_level || 'medium',
      location: persona.location || 'urban', traits: persona.traits || [], goals: persona.goals || [],
      pain_points: persona.pain_points || [], interests: persona.interests || [],
      products_interested: persona.products_interested || [], digital_maturity: persona.digital_maturity,
      channel_preference: persona.channel_preference || [], system_prompt: persona.system_prompt || '',
      response_style: persona.response_style,
    });
    setEditingId(persona.id);
    setDialogOpen(true);
  };

  const openCreate = () => { setEditingPersona({ ...emptyForm }); setEditingId(null); setDialogOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium text-gray-900">Personas</h1>
        <button onClick={openCreate} className="px-4 py-2 text-sm bg-[#0000A0] hover:bg-[#000080] text-white rounded-md transition-colors">
          Skapa persona
        </button>
      </div>

      {/* List layout */}
      <div className="space-y-0">
        {personas.map((persona) => (
          <div key={persona.id} className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
            <div className="w-9 h-9 rounded-full bg-[#FAFAFA] border border-gray-200 flex items-center justify-center text-xs font-medium text-gray-500 flex-shrink-0">
              {getInitials(persona.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{persona.name}</span>
                {persona.is_default && <span className="text-xs text-gray-400">Standard</span>}
              </div>
              <p className="text-xs text-gray-500 truncate">{persona.description}</p>
            </div>
            <div className="hidden md:flex items-center gap-1">
              {persona.traits.slice(0, 2).map((trait) => (
                <span key={trait} className="text-xs text-gray-400">{trait}</span>
              ))}
            </div>
            <div className="text-xs text-gray-400 hidden sm:block">
              {persona.age_min}–{persona.age_max} ar
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(persona)} className="text-xs text-gray-400 hover:text-gray-600">
                Redigera
              </button>
              {!persona.is_default && (
                <button onClick={() => handleDelete(persona.id)} className="text-xs text-gray-400 hover:text-red-500">
                  Ta bort
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">
              {editingId ? 'Redigera persona' : 'Skapa ny persona'}
            </DialogTitle>
          </DialogHeader>

          {editingPersona && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Namn</label>
                  <input value={editingPersona.name} onChange={(e) => setEditingPersona({ ...editingPersona, name: e.target.value })} placeholder="T.ex. Ung Forstagangskopare" className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#0000A0]" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Alder min</label>
                    <input type="number" value={editingPersona.age_min} onChange={(e) => setEditingPersona({ ...editingPersona, age_min: parseInt(e.target.value) || 0 })} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#0000A0]" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Alder max</label>
                    <input type="number" value={editingPersona.age_max} onChange={(e) => setEditingPersona({ ...editingPersona, age_max: parseInt(e.target.value) || 0 })} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#0000A0]" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Beskrivning</label>
                <textarea value={editingPersona.description} onChange={(e) => setEditingPersona({ ...editingPersona, description: e.target.value })} placeholder="Kort beskrivning..." rows={2} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#0000A0] resize-none" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Livsfas</label>
                  <Select value={editingPersona.life_stage} onValueChange={(v) => setEditingPersona({ ...editingPersona, life_stage: v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="young_professional">Ung yrkesverksam</SelectItem>
                      <SelectItem value="family">Familj</SelectItem>
                      <SelectItem value="pre_retirement">Fore pension</SelectItem>
                      <SelectItem value="retired">Pensionar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Inkomst</label>
                  <Select value={editingPersona.income_level} onValueChange={(v) => setEditingPersona({ ...editingPersona, income_level: v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Lag</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">Hog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Responsstil</label>
                  <Select value={editingPersona.response_style} onValueChange={(v) => setEditingPersona({ ...editingPersona, response_style: v as PersonaForm['response_style'] })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="curious">Nyfiken</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="skeptical">Skeptisk</SelectItem>
                      <SelectItem value="enthusiastic">Entusiastisk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TagInput label="Karaktarsdrag" tags={editingPersona.traits} onChange={(traits) => setEditingPersona({ ...editingPersona, traits })} placeholder="T.ex. Digital native" />
              <TagInput label="Mal" tags={editingPersona.goals} onChange={(goals) => setEditingPersona({ ...editingPersona, goals })} placeholder="T.ex. Kopa forsta bostad" />
              <TagInput label="Smartpunkter" tags={editingPersona.pain_points} onChange={(pain_points) => setEditingPersona({ ...editingPersona, pain_points })} placeholder="T.ex. Svart att forsta" />

              <div>
                <label className="block text-xs text-gray-500 mb-1">System Prompt</label>
                <textarea value={editingPersona.system_prompt} onChange={(e) => setEditingPersona({ ...editingPersona, system_prompt: e.target.value })} placeholder="Beskriv hur denna persona ska bete sig..." rows={3} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#0000A0] resize-none" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setDialogOpen(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-md text-gray-600 hover:border-gray-300">
                  Avbryt
                </button>
                <button onClick={handleSave} className="px-4 py-2 text-sm bg-[#0000A0] hover:bg-[#000080] text-white rounded-md">
                  {editingId ? 'Spara' : 'Skapa'}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
