'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Marketing');
  const [language, setLanguage] = useState('sv');
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('nordea-user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setEmail(parsed.email || '');
        setFullName(parsed.full_name || parsed.email?.split('@')[0]?.replace('.', ' ') || '');
      } catch {
        // ignore
      }
    }
  }, []);

  const handleSave = () => {
    const user = localStorage.getItem('nordea-user');
    if (user) {
      const parsed = JSON.parse(user);
      localStorage.setItem('nordea-user', JSON.stringify({ ...parsed, full_name: fullName, language }));
    }
    toast.success('Installningar sparade');
  };

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="text-lg font-medium text-gray-900">Installningar</h1>

      {/* Profile */}
      <section>
        <h2 className="text-xs text-gray-400 uppercase tracking-wide mb-4">Profil</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Namn</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#0000A0]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">E-post</label>
              <input value={email} disabled className="w-full px-3 py-2 text-sm border border-gray-100 rounded-md bg-[#FAFAFA] text-gray-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Avdelning</label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Brand">Brand</SelectItem>
                  <SelectItem value="Digital">Digital</SelectItem>
                  <SelectItem value="Communications">Communications</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Roll</label>
              <p className="px-3 py-2 text-sm text-gray-600">Admin</p>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      {/* Language */}
      <section>
        <h2 className="text-xs text-gray-400 uppercase tracking-wide mb-4">Sprak</h2>
        <div>
          <label className="block text-xs text-gray-500 mb-1">UI-sprak</label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-48 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sv">Svenska</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400 mt-1.5">AI-genererat innehall kan vara pa andra sprak.</p>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      {/* Notifications */}
      <section>
        <h2 className="text-xs text-gray-400 uppercase tracking-wide mb-4">Notifieringar</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">E-postnotifieringar</p>
              <p className="text-xs text-gray-400">Nya analyser och kampanjer</p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">Autospara</p>
              <p className="text-xs text-gray-400">Spara arbete automatiskt</p>
            </div>
            <Switch checked={autoSave} onCheckedChange={setAutoSave} />
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      {/* API */}
      <section>
        <h2 className="text-xs text-gray-400 uppercase tracking-wide mb-4">API-konfiguration</h2>
        <p className="text-sm text-amber-600 mb-3">AI-funktioner kors med mockade svar. Konfigurera API-nycklar i .env.local.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">OpenAI API-nyckel</label>
            <input type="password" placeholder="sk-..." disabled className="w-full px-3 py-2 text-sm border border-gray-100 rounded-md bg-[#FAFAFA] text-gray-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Anthropic API-nyckel</label>
            <input type="password" placeholder="sk-ant-..." disabled className="w-full px-3 py-2 text-sm border border-gray-100 rounded-md bg-[#FAFAFA] text-gray-400" />
          </div>
          <p className="text-xs text-gray-400">Konfigureras via miljovariabler pa servern.</p>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      <div className="flex justify-end">
        <button onClick={handleSave} className="px-5 py-2 text-sm bg-[#0000A0] hover:bg-[#000080] text-white rounded-md transition-colors">
          Spara installningar
        </button>
      </div>
    </div>
  );
}
