'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { defaultPersonas } from '@/lib/constants/personas';
import { Persona } from '@/types/database';

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
  avatar: '👤',
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
      <Label>{label}</Label>
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
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <X
              className="w-3 h-3 cursor-pointer"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
            />
          </Badge>
        ))}
      </div>
    </div>
  );
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
      setPersonas((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? { ...p, ...editingPersona }
            : p
        )
      );
    } else {
      setPersonas((prev) => [
        ...prev,
        {
          ...editingPersona,
          id: `custom-${Date.now()}`,
          user_id: 'mock-user',
          is_default: false,
          is_active: true,
        },
      ]);
    }
    setDialogOpen(false);
    setEditingPersona(null);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setPersonas((prev) => prev.filter((p) => p.id !== id));
  };

  const openEdit = (persona: typeof personas[0]) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personas</h1>
          <p className="text-gray-500 mt-1">Hantera virtuella kundprofiler för testning</p>
        </div>
        <Button onClick={openCreate} className="bg-[#0000A0] hover:bg-[#000080]">
          <Plus className="w-4 h-4 mr-2" />
          Skapa persona
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {personas.map((persona) => (
          <Card key={persona.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl">{persona.avatar}</span>
                {persona.is_default && (
                  <Badge variant="secondary" className="text-xs">Standard</Badge>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{persona.name}</h3>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{persona.description}</p>

              <div className="space-y-2 mb-4">
                <div className="text-xs text-gray-400">
                  {persona.age_min}-{persona.age_max} år | {persona.digital_maturity} digital mognad
                </div>
                <div className="flex flex-wrap gap-1">
                  {persona.traits.slice(0, 3).map((trait) => (
                    <Badge key={trait} variant="outline" className="text-xs">
                      {trait}
                    </Badge>
                  ))}
                  {persona.traits.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{persona.traits.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEdit(persona)}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Redigera
                </Button>
                {!persona.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(persona.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Redigera persona' : 'Skapa ny persona'}
            </DialogTitle>
          </DialogHeader>

          {editingPersona && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Namn</Label>
                  <Input
                    value={editingPersona.name}
                    onChange={(e) =>
                      setEditingPersona({ ...editingPersona, name: e.target.value })
                    }
                    placeholder="T.ex. Ung Förstagångsköpare"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Avatar (emoji)</Label>
                  <Input
                    value={editingPersona.avatar}
                    onChange={(e) =>
                      setEditingPersona({ ...editingPersona, avatar: e.target.value })
                    }
                    placeholder="🏠"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Beskrivning</Label>
                <Textarea
                  value={editingPersona.description}
                  onChange={(e) =>
                    setEditingPersona({ ...editingPersona, description: e.target.value })
                  }
                  placeholder="Kort beskrivning av personan..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ålder (min)</Label>
                  <Input
                    type="number"
                    value={editingPersona.age_min}
                    onChange={(e) =>
                      setEditingPersona({ ...editingPersona, age_min: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ålder (max)</Label>
                  <Input
                    type="number"
                    value={editingPersona.age_max}
                    onChange={(e) =>
                      setEditingPersona({ ...editingPersona, age_max: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Livsfas</Label>
                  <Select
                    value={editingPersona.life_stage}
                    onValueChange={(v) =>
                      setEditingPersona({ ...editingPersona, life_stage: v })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="young_professional">Ung yrkesverksam</SelectItem>
                      <SelectItem value="family">Familj</SelectItem>
                      <SelectItem value="pre_retirement">Före pension</SelectItem>
                      <SelectItem value="retired">Pensionär</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Inkomstnivå</Label>
                  <Select
                    value={editingPersona.income_level}
                    onValueChange={(v) =>
                      setEditingPersona({ ...editingPersona, income_level: v })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Låg</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">Hög</SelectItem>
                      <SelectItem value="very_high">Mycket hög</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Digital mognad</Label>
                  <Select
                    value={editingPersona.digital_maturity}
                    onValueChange={(v) =>
                      setEditingPersona({
                        ...editingPersona,
                        digital_maturity: v as 'low' | 'medium' | 'high',
                      })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Låg</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">Hög</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TagInput
                label="Karaktärsdrag"
                tags={editingPersona.traits}
                onChange={(traits) => setEditingPersona({ ...editingPersona, traits })}
                placeholder="T.ex. Digital native"
              />

              <TagInput
                label="Mål"
                tags={editingPersona.goals}
                onChange={(goals) => setEditingPersona({ ...editingPersona, goals })}
                placeholder="T.ex. Köpa första bostad"
              />

              <TagInput
                label="Smärtpunkter"
                tags={editingPersona.pain_points}
                onChange={(pain_points) => setEditingPersona({ ...editingPersona, pain_points })}
                placeholder="T.ex. Svårt att förstå"
              />

              <TagInput
                label="Produktintresse"
                tags={editingPersona.products_interested}
                onChange={(products_interested) =>
                  setEditingPersona({ ...editingPersona, products_interested })
                }
                placeholder="T.ex. Bolån"
              />

              <div className="space-y-2">
                <Label>Responsstil</Label>
                <Select
                  value={editingPersona.response_style}
                  onValueChange={(v) =>
                    setEditingPersona({
                      ...editingPersona,
                      response_style: v as PersonaForm['response_style'],
                    })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="curious">Nyfiken</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="skeptical">Skeptisk</SelectItem>
                    <SelectItem value="enthusiastic">Entusiastisk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>System Prompt (AI-instruktioner)</Label>
                <Textarea
                  value={editingPersona.system_prompt}
                  onChange={(e) =>
                    setEditingPersona({ ...editingPersona, system_prompt: e.target.value })
                  }
                  placeholder="Beskriv hur denna persona ska bete sig i konversationer..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-[#0000A0] hover:bg-[#000080]"
                >
                  {editingId ? 'Spara ändringar' : 'Skapa persona'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
