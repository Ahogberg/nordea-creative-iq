'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Save, User, Globe, Bell, Shield, Key, Languages } from 'lucide-react';
import { toast } from 'sonner';
import { nordicMarkets } from '@/lib/constants/markets';
import { getUserPrefs, saveUserPrefs } from '@/lib/campaigns';

function getStoredUser(): { email: string; fullName: string } {
  if (typeof window === 'undefined') return { email: '', fullName: '' };
  try {
    const user = localStorage.getItem('nordea-user');
    if (user) {
      const parsed = JSON.parse(user);
      return {
        email: parsed.email || '',
        fullName: parsed.full_name || parsed.email?.split('@')[0]?.replace('.', ' ') || '',
      };
    }
  } catch {
    // ignore
  }
  return { email: '', fullName: '' };
}

export default function SettingsPage() {
  const [fullName, setFullName] = useState(() => getStoredUser().fullName);
  const [email, setEmail] = useState(() => getStoredUser().email);
  const [department, setDepartment] = useState('Marketing');
  const [language, setLanguage] = useState('sv');
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [autoLocalizeMarkets, setAutoLocalizeMarkets] = useState<string[]>([]);

  useEffect(() => {
    setAutoLocalizeMarkets(getUserPrefs().autoLocalizeMarkets);
  }, []);

  const toggleMarket = (id: string) => {
    setAutoLocalizeMarkets((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    const user = localStorage.getItem('nordea-user');
    if (user) {
      const parsed = JSON.parse(user);
      localStorage.setItem(
        'nordea-user',
        JSON.stringify({ ...parsed, full_name: fullName, language })
      );
    }
    saveUserPrefs({ autoLocalizeMarkets });
    toast.success('Inställningar sparade');
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inställningar</h1>
        <p className="text-gray-500 mt-1">Hantera din profil och appinställningar</p>
      </div>

      {/* Profile */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-500" />
            <CardTitle className="text-base">Profil</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Namn</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>E-post</Label>
              <Input value={email} disabled className="bg-gray-50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Avdelning</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Brand">Brand</SelectItem>
                  <SelectItem value="Digital">Digital</SelectItem>
                  <SelectItem value="Communications">Communications</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Roll</Label>
              <div className="flex items-center h-10">
                <Badge className="bg-[#0000A0]">Admin</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-500" />
            <CardTitle className="text-base">Språk</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>UI-språk</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sv">Svenska</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Ändrar språket i gränssnittet. AI-genererat innehåll kan fortfarande vara på andra språk.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Auto-localization */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-gray-500" />
            <CardTitle className="text-base">Auto-lokalisering</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">
            Välj vilka nordiska marknader allt innehåll ska auto-lokaliseras till. Gäller för
            kampanjer, copy och annat material du skapar i plattformen.
          </p>
          <div className="flex flex-wrap gap-2">
            {nordicMarkets.map((market) => {
              const selected = autoLocalizeMarkets.includes(market.id);
              return (
                <button
                  key={market.id}
                  onClick={() => toggleMarket(market.id)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                    selected
                      ? 'border-[#0000A0] bg-blue-50 text-[#0000A0] font-medium'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span className="mr-2">{market.flag}</span>
                  {market.name}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400">
            Lämna tomt för att skapa innehåll utan auto-lokalisering.
          </p>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-500" />
            <CardTitle className="text-base">Notifieringar</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">E-postnotifieringar</p>
              <p className="text-xs text-gray-500">Få notifieringar om nya analyser och kampanjer</p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Autospara</p>
              <p className="text-xs text-gray-500">Spara arbete automatiskt</p>
            </div>
            <Switch checked={autoSave} onCheckedChange={setAutoSave} />
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-gray-500" />
            <CardTitle className="text-base">API-konfiguration</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              AI-funktioner körs med mockade svar. Konfigurera API-nycklar i <code className="bg-yellow-100 px-1 rounded">.env.local</code> för riktiga AI-svar.
            </p>
          </div>
          <div className="space-y-2">
            <Label>OpenAI API-nyckel</Label>
            <Input type="password" placeholder="sk-..." disabled className="bg-gray-50" />
          </div>
          <div className="space-y-2">
            <Label>Anthropic API-nyckel</Label>
            <Input type="password" placeholder="sk-ant-..." disabled className="bg-gray-50" />
          </div>
          <p className="text-xs text-gray-500">
            API-nycklar konfigureras via miljövariabler på servern, inte i gränssnittet.
          </p>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-500" />
            <CardTitle className="text-base">Säkerhet</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Nordea Enterprise SSO</p>
              <p className="text-xs text-gray-500">Inloggning via Nordeas centrala identitetstjänst</p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-200">Aktiv</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-[#0000A0] hover:bg-[#000080]">
          <Save className="w-4 h-4 mr-2" />
          Spara inställningar
        </Button>
      </div>
    </div>
  );
}
