# 🏦 NORDEA CREATIVEIQ - Internal Creative Intelligence Platform
## Komplett Projektspecifikation för Autonom Build

> **Instruktion till Claude Code:** Bygg denna interna marknadsföringsplattform för Nordea från grunden. Använd Next.js 14 med App Router, TypeScript, Tailwind CSS, Shadcn/ui och Supabase. Arbeta autonomt tills allt är klart och deploybart. Följ Nordeas varumärkesriktlinjer strikt.

---

## 📋 PROJEKTÖVERSIKT

### Vision
Nordea CreativeIQ är en intern AI-driven plattform för Nordeas marknadsföringsteam som hjälper till att:

1. **Generera on-brand annonscopy** - AI-genererad text som följer Nordeas Tone of Voice
2. **Testa material med virtuella kundpersonas** - Simulera hur olika kundsegment reagerar
3. **Simulera annonsresultat** - Eye-tracking simulation och prestandaprognoser
4. **Planera kampanjbudgetar** - Räckvidd, frekvens och ROI-prognoser
5. **Lokalisera för nordiska marknader** - Anpassa innehåll för SE, DK, NO, FI, EE, LT
6. **Framtida: Skapa nya annonser** - AI-genererad visuell kreativitet

### Målgrupp (interna användare)
- Marketing Managers
- Creative Producers
- Campaign Managers
- Brand Managers
- Content Creators

### Tech Stack
```
Frontend:       Next.js 14 (App Router) + TypeScript
Styling:        Tailwind CSS + Shadcn/ui
Font:           Nordea Sans (ladda lokalt från /public/fonts)
Auth:           Supabase Auth (begränsat till @nordea.com)
Database:       Supabase PostgreSQL
AI:             OpenAI GPT-4 / Claude API
File Storage:   Supabase Storage
Deployment:     Vercel (eller intern Nordea-infrastruktur)
```

---

## 🎨 NORDEA DESIGN SYSTEM

### Officiell Färgpalett
```css
/* Nordea Brand Colors */
--nordea-blue: #0000A0;           /* Primary - Deep Blue */
--nordea-blue-dark: #000080;      /* Hover states */
--nordea-blue-light: #0000C8;     /* Accents */

/* Functional Colors */
--success: #00A76F;               /* Grön - godkänt/positivt */
--warning: #F59E0B;               /* Gul/orange - varning */
--error: #DC3545;                 /* Röd - fel/kritiskt */
--info: #0EA5E9;                  /* Ljusblå - information */

/* Neutrala (Nordea Style) */
--background: #F8F9FA;            /* Ljusgrå bakgrund */
--surface: #FFFFFF;               /* Vit yta */
--text-primary: #1A1A2E;          /* Nästan svart text */
--text-secondary: #6B7280;        /* Grå sekundär text */
--border: #E5E7EB;                /* Ljusgrå border */
--border-light: #F3F4F6;          /* Ännu ljusare border */

/* Score Colors */
--score-excellent: #00A76F;       /* 80-100 */
--score-good: #10B981;            /* 60-79 */
--score-warning: #F59E0B;         /* 40-59 */
--score-poor: #DC3545;            /* 0-39 */
```

### Typografi
```css
/* Nordea Sans - måste laddas lokalt */
@font-face {
  font-family: 'Nordea Sans';
  src: url('/fonts/NordeaSans-Regular.woff2') format('woff2');
  font-weight: 400;
}
@font-face {
  font-family: 'Nordea Sans';
  src: url('/fonts/NordeaSans-Medium.woff2') format('woff2');
  font-weight: 500;
}
@font-face {
  font-family: 'Nordea Sans';
  src: url('/fonts/NordeaSans-Bold.woff2') format('woff2');
  font-weight: 700;
}

/* Fallback om Nordea Sans inte finns */
font-family: 'Nordea Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Design Principer
- **Clean & Professional** - Ljusa ytor, mycket whitespace
- **Nordic Minimalism** - Inget onödigt, tydlig hierarki
- **Trust & Stability** - Konservativ, pålitlig känsla
- **Accessibility** - WCAG AA-kompatibel, bra kontraster

### Komponenter (Shadcn/ui + Nordea styling)
- Rundade hörn: `rounded-xl` (12px) för kort, `rounded-lg` (8px) för knappar
- Skuggor: Subtila, endast på hover (`shadow-sm` → `shadow-md`)
- Knappar: Solid Nordea Blue, vit text, ingen gradient
- Input-fält: Vit bakgrund, grå border, blå focus ring

---

## 🗂️ FILSTRUKTUR

```
/app
  /layout.tsx                     # Root layout med fonts och providers
  /page.tsx                       # Redirect till /login eller /dashboard
  /(auth)
    /login/page.tsx               # Nordea-branded login
    /callback/route.ts            # Supabase auth callback
  /(dashboard)
    /layout.tsx                   # Dashboard layout med sidebar
    /page.tsx                     # Dashboard overview
    /ad-studio/page.tsx           # Annonsanalys & testing
    /copy-studio/page.tsx         # AI copy-generering
    /campaign-planner/page.tsx    # Budget & prognos
    /localization/page.tsx        # Nordisk lokalisering
    /personas/page.tsx            # Persona-bibliotek
    /asset-library/page.tsx       # Sparade assets (framtida)
    /settings/page.tsx            # Inställningar
  /api
    /analyze/route.ts             # AI-analys av annonser
    /generate-copy/route.ts       # AI copy-generering
    /localize/route.ts            # AI lokalisering
    /persona-chat/route.ts        # Persona-simulering
    /eye-tracking/route.ts        # Simulerad eye-tracking

/components
  /ui                             # Shadcn komponenter (Nordea-styled)
  /brand
    /NordeaLogo.tsx               # SVG logo komponent
    /NordeaIcon.tsx               # Favicon/app icon
  /layout
    /Sidebar.tsx
    /Header.tsx
    /UserMenu.tsx
    /MobileNav.tsx
  /dashboard
    /StatsCard.tsx
    /QuickActionCard.tsx
    /RecentActivity.tsx
    /BrandHealthScore.tsx
  /ad-studio
    /CreativeUploader.tsx
    /ScoreRing.tsx
    /ScoreCard.tsx
    /HeatmapOverlay.tsx
    /HeatmapToggle.tsx
    /ComplianceChecklist.tsx
    /AISuggestions.tsx
    /VirtualFocusGroup.tsx
    /PersonaSelector.tsx
    /PersonaChat.tsx
  /copy-studio
    /ChannelSelector.tsx
    /ObjectiveSelector.tsx
    /TopicInput.tsx
    /GeneratedCopy.tsx
    /CopyActions.tsx
    /ToneOfVoiceAnalysis.tsx
  /campaign-planner
    /BudgetInput.tsx
    /DurationInput.tsx
    /ChannelMixer.tsx
    /ChannelSlider.tsx
    /AudienceBuilder.tsx
    /GeographySelector.tsx
    /AgeRangeInput.tsx
    /InterestTags.tsx
    /ForecastPanel.tsx
    /MetricCard.tsx
    /ChannelBreakdown.tsx
    /ReachCoverageCard.tsx
    /FrequencyWarning.tsx
    /ExportButtons.tsx
  /localization
    /SourceMarketSelector.tsx
    /TargetMarketSelector.tsx
    /ContentInput.tsx
    /MarketIntelCard.tsx
    /LocalizedOutput.tsx
    /QualityScoreBar.tsx
    /AdaptationsList.tsx
    /AlternativeHeadlines.tsx
  /personas
    /PersonaCard.tsx
    /PersonaGrid.tsx
    /CreatePersonaDialog.tsx
    /PersonaForm.tsx
    /TraitInput.tsx

/lib
  /supabase
    /client.ts
    /server.ts
    /middleware.ts
  /ai
    /openai.ts
    /claude.ts
    /prompts/
      /brand-analysis.ts
      /copy-generation.ts
      /persona-simulation.ts
      /localization.ts
      /eye-tracking.ts
  /utils
    /formatters.ts
    /calculations.ts
    /validators.ts
  /constants
    /channels.ts
    /markets.ts
    /personas.ts
    /tone-of-voice.ts

/public
  /fonts
    /NordeaSans-Regular.woff2
    /NordeaSans-Medium.woff2
    /NordeaSans-Bold.woff2
  /images
    /nordea-logo.svg
    /nordea-logo-white.svg
    /nordea-icon.svg

/types
  /database.ts
  /api.ts
  /personas.ts
  /campaigns.ts
```

---

## 🗄️ DATABAS SCHEMA (Supabase)

```sql
-- ============================================================
-- PROFILES (utökar Supabase Auth)
-- ============================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  department TEXT,                    -- 'Marketing', 'Brand', 'Digital', etc.
  role TEXT DEFAULT 'user',           -- 'user', 'admin', 'viewer'
  language TEXT DEFAULT 'sv',         -- UI-språk
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PERSONAS (virtuella kundprofiler för testing)
-- ============================================================
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Grundinfo
  name TEXT NOT NULL,                 -- "Ung Förstagångsköpare"
  description TEXT,                   -- Kort beskrivning
  avatar TEXT,                        -- Emoji eller bild-URL
  
  -- Demografi
  age_min INTEGER,
  age_max INTEGER,
  life_stage TEXT,                    -- 'student', 'young_professional', 'family', 'retired'
  income_level TEXT,                  -- 'low', 'medium', 'high', 'very_high'
  location TEXT,                      -- 'urban', 'suburban', 'rural'
  
  -- Psykografi
  traits TEXT[],                      -- ['Försiktig', 'Digital', 'Priskänslig']
  goals TEXT[],                       -- ['Köpa första bostad', 'Bygga buffert']
  pain_points TEXT[],                 -- ['Svårt förstå', 'Höga kostnader']
  interests TEXT[],                   -- ['Sparande', 'Bostad', 'Hållbarhet']
  
  -- Nordea-specifikt
  products_interested TEXT[],         -- ['Bolån', 'Sparkonto', 'Fonder']
  digital_maturity TEXT,              -- 'low', 'medium', 'high'
  channel_preference TEXT[],          -- ['app', 'web', 'branch', 'phone']
  
  -- AI-konfiguration
  system_prompt TEXT,                 -- Anpassad prompt för AI-simulering
  response_style TEXT,                -- 'skeptical', 'curious', 'enthusiastic', 'neutral'
  
  -- Metadata
  is_default BOOLEAN DEFAULT FALSE,   -- Nordeas standard-personas
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AD ANALYSES (analyserade annonser)
-- ============================================================
CREATE TABLE ad_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Asset
  title TEXT NOT NULL,
  image_url TEXT,                     -- Supabase Storage URL
  video_url TEXT,
  ad_copy TEXT,
  channel TEXT,                       -- 'linkedin', 'meta', 'display', etc.
  
  -- Scores
  brand_fit_score INTEGER,            -- 0-100
  performance_score INTEGER,          -- 0-100
  compliance_score INTEGER,           -- 0-100
  overall_score INTEGER,              -- Viktat genomsnitt
  
  -- AI-resultat
  heatmap_data JSONB,                 -- [{x, y, intensity, label}]
  compliance_items JSONB,             -- [{status, category, message}]
  ai_suggestions JSONB,               -- [{type, priority, message}]
  
  -- Persona-tester
  persona_feedback JSONB,             -- [{personaId, feedback, sentiment}]
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GENERATED COPIES (AI-genererad copy)
-- ============================================================
CREATE TABLE generated_copies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Input
  channel TEXT NOT NULL,
  objective TEXT NOT NULL,
  topic TEXT,
  target_market TEXT DEFAULT 'se',
  
  -- Output
  headline TEXT,
  subheadline TEXT,
  body_copy TEXT,
  cta TEXT,
  hashtags TEXT,
  
  -- Scores
  brand_fit_score INTEGER,
  tone_scores JSONB,                  -- {humanWarm, clearSimple, confident, forwardLooking}
  
  -- Status
  is_saved BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CAMPAIGN PLANS (kampanjplaner med prognoser)
-- ============================================================
CREATE TABLE campaign_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Grundinfo
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',        -- 'draft', 'active', 'completed', 'archived'
  
  -- Budget & Tid
  budget DECIMAL NOT NULL,
  currency TEXT DEFAULT 'SEK',
  start_date DATE,
  end_date DATE,
  duration_days INTEGER,
  
  -- Kanalmix
  channel_mix JSONB NOT NULL,         -- [{channelId, allocation, customCpm}]
  
  -- Målgrupp
  audience JSONB NOT NULL,            -- {size, geography, ageMin, ageMax, interests}
  
  -- Prognos (beräknas)
  forecast JSONB,                     -- {reach, impressions, clicks, frequency, cpm, cpc, etc.}
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOCALIZATIONS (lokaliserade versioner)
-- ============================================================
CREATE TABLE localizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Källa
  source_market TEXT NOT NULL,
  source_content JSONB NOT NULL,      -- {headline, body, cta}
  
  -- Mål
  target_markets TEXT[] NOT NULL,
  
  -- Resultat
  localized_content JSONB,            -- {[market]: {headline, body, cta, scores, adaptations}}
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PERSONA CONVERSATIONS (chathistorik med personas)
-- ============================================================
CREATE TABLE persona_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  ad_analysis_id UUID REFERENCES ad_analyses(id) ON DELETE SET NULL,
  
  messages JSONB NOT NULL,            -- [{role, content, timestamp}]
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE localizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_conversations ENABLE ROW LEVEL SECURITY;

-- Users see own data + default personas
CREATE POLICY "Users see own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users see own + default personas" ON personas 
  FOR SELECT USING (auth.uid() = user_id OR is_default = true);
CREATE POLICY "Users manage own personas" ON personas 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own analyses" ON ad_analyses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own copies" ON generated_copies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own campaigns" ON campaign_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own localizations" ON localizations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own conversations" ON persona_conversations FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- SEED DATA: Default Personas för Nordea Privatkunder
-- ============================================================
INSERT INTO personas (
  name, description, avatar, 
  age_min, age_max, life_stage, income_level, location,
  traits, goals, pain_points, interests,
  products_interested, digital_maturity, channel_preference,
  system_prompt, response_style, is_default
) VALUES 
(
  'Ung Förstagångsköpare',
  'Millennial eller Gen Z som drömmer om sin första bostad. Digital, researchar mycket online, osäker på processen.',
  '🏠',
  25, 35, 'young_professional', 'medium', 'urban',
  ARRAY['Digital native', 'Researchar mycket', 'Priskänslig', 'Vill ha transparens', 'Osäker på processen'],
  ARRAY['Köpa första bostaden', 'Förstå bolåneprocessen', 'Hitta bästa räntan', 'Bygga upp eget kapital'],
  ARRAY['Svårt att förstå alla steg', 'Rädd att göra fel', 'Kontantinsatsen är hög', 'Osäker på hur mycket jag har råd med'],
  ARRAY['Bostad', 'Privatekonomi', 'Sparande', 'Hållbarhet'],
  ARRAY['Bolån', 'Sparkonto', 'ISK'],
  'high',
  ARRAY['app', 'web'],
  'Du är en 28-årig person som funderar på att köpa din första bostad. Du är digital och gör mycket research online innan du fattar beslut. Du är lite skeptisk till banker och vill ha tydlig, ärlig information utan säljtryck. Du ställer kritiska frågor om kostnader och villkor. Du uppskattar när saker förklaras enkelt utan bankjargong.',
  'curious',
  true
),
(
  'Spararen',
  'Intresserad av att få pengarna att växa. Jämför alternativ, läser på om fonder och sparformer.',
  '💰',
  30, 50, 'family', 'medium', 'suburban',
  ARRAY['Jämför alternativ', 'Långsiktig', 'Riskavert', 'Vill förstå avgifter', 'Läser på'],
  ARRAY['Bygga buffert', 'Spara till pension', 'Få bra avkastning', 'Förstå skillnaden mellan sparformer'],
  ARRAY['Svårt att välja bland alla alternativ', 'Orolig för dolda avgifter', 'Osäker på risk', 'Vet inte hur mycket jag borde spara'],
  ARRAY['Sparande', 'Fonder', 'Pension', 'Privatekonomi'],
  ARRAY['Sparkonto', 'Fonder', 'ISK', 'Pensionssparande'],
  'medium',
  ARRAY['web', 'app'],
  'Du är en 42-åring som vill få bättre koll på ditt sparande. Du har pengar på ett vanligt sparkonto men undrar om du borde göra något smartare. Du är inte superintresserad av aktier och vill inte ta för stora risker, men du vill att pengarna ska växa mer än de gör idag. Du ställer frågor om avgifter, risk och vad som faktiskt är bäst för dig.',
  'neutral',
  true
),
(
  'Familjeföräldern',
  'Småbarnsförälder med fullt upp. Vill ha ordning på ekonomin, spara till barnen, och ha trygghet.',
  '👨‍👩‍👧‍👦',
  32, 45, 'family', 'medium', 'suburban',
  ARRAY['Tidspressad', 'Prioriterar familjen', 'Vill ha trygghet', 'Praktisk', 'Letar efter enkelhet'],
  ARRAY['Spara till barnens framtid', 'Ha ekonomisk buffert', 'Försäkra familjen', 'Betala av bolånet'],
  ARRAY['Har inte tid att sätta mig in i allt', 'Orolig att missa något viktigt', 'Svårt att prioritera bland alla utgifter', 'Vill inte göra fel val för barnens skull'],
  ARRAY['Familj', 'Barnsparande', 'Försäkring', 'Bostad'],
  ARRAY['Barnsparande', 'Bolån', 'Försäkringar', 'Sparkonto'],
  'medium',
  ARRAY['app', 'web'],
  'Du är en 38-årig förälder till två barn (5 och 8 år). Du har fullt upp med jobb och familj och har inte mycket tid att lägga på ekonomi, men du vill göra rätt för barnens skull. Du vill ha enkla lösningar som inte kräver att du följer med hela tiden. Du uppskattar när banken gör det lätt för dig och inte kräver att du är expert.',
  'neutral',
  true
),
(
  'Pensionsspararen',
  'Närmar sig pension och börjar fundera på vad som händer sen. Vill ha trygghet och koll.',
  '🌅',
  55, 67, 'pre_retirement', 'high', 'suburban',
  ARRAY['Trygghetsfokuserad', 'Långsiktig', 'Värdesätter personlig kontakt', 'Vill ha kontroll', 'Skeptisk till digitala lösningar'],
  ARRAY['Förstå min pension', 'Veta att pengarna räcker', 'Planera för ett bra liv efter jobbet', 'Inte ta onödiga risker'],
  ARRAY['Osäker på om jag sparat tillräckligt', 'Pensionssystemet är förvirrande', 'Vill inte förlora det jag byggt upp', 'Saknar personlig rådgivning'],
  ARRAY['Pension', 'Trygghet', 'Ekonomisk planering', 'Hälsa'],
  ARRAY['Pensionssparande', 'Fonder', 'Rådgivning', 'Försäkringar'],
  'low',
  ARRAY['phone', 'branch', 'web'],
  'Du är 60 år och har jobbat hela livet. Nu börjar du fundera på pensionen - räcker pengarna? Hur fungerar det egentligen? Du har sparat en del men är osäker på om det är rätt placerat. Du föredrar att prata med en riktig person snarare än att klicka runt i en app. Du vill ha tydliga besked, inte massa alternativ att välja mellan.',
  'skeptical',
  true
);
```

---

## 🔧 MODULER - DETALJERAD SPEC

### 1. LOGIN (`/login`)

**Design:**
- Delad layout: Vänster sida = Nordea branding, Höger sida = Login-formulär
- Nordea-blå bakgrund på vänster sida med vit text
- Nordea-logotyp prominent
- Statistik-siffror som social proof

**Funktionalitet:**
- E-post + lösenord (Supabase Auth)
- Endast @nordea.com-adresser tillåtna
- "Logga in" knapp i Nordea Blue
- Felhantering med tydliga meddelanden
- "Protected by Nordea Enterprise Security" badge

**Kod:**
```typescript
// Validera Nordea-domän
const validateNordeaEmail = (email: string) => {
  return email.toLowerCase().endsWith('@nordea.com');
};
```

---

### 2. DASHBOARD (`/dashboard`)

**Stats Cards (4 st):**
```typescript
const stats = [
  { 
    label: 'Annonser analyserade', 
    value: analysisCount, 
    change: '+12%', 
    trend: 'up' 
  },
  { 
    label: 'Genomsn. Brand Fit', 
    value: avgBrandFit.toFixed(1), 
    change: '+3.1', 
    trend: 'up' 
  },
  { 
    label: 'Compliance-kvot', 
    value: `${complianceRate}%`, 
    change: '+0.5%', 
    trend: 'up' 
  },
  { 
    label: 'Tid sparad', 
    value: '142h', 
    change: 'denna månad', 
    trend: 'neutral' 
  },
];
```

**Quick Actions (4 st):**
```typescript
const quickActions = [
  { 
    id: 'ad-studio', 
    title: 'Analysera annons', 
    description: 'Ladda upp och utvärdera annonsprestation',
    icon: 'Palette', // Lucide icon
    color: 'bg-blue-50 text-blue-600',
    href: '/ad-studio'
  },
  { 
    id: 'copy-studio', 
    title: 'Generera copy', 
    description: 'Skapa kanaloptimerad text med AI',
    icon: 'PenTool',
    color: 'bg-purple-50 text-purple-600',
    href: '/copy-studio'
  },
  { 
    id: 'campaign-planner', 
    title: 'Planera kampanj', 
    description: 'Budgetera och prognostisera resultat',
    icon: 'BarChart3',
    color: 'bg-green-50 text-green-600',
    href: '/campaign-planner'
  },
  { 
    id: 'localization', 
    title: 'Lokalisera', 
    description: 'Anpassa för nordiska marknader',
    icon: 'Globe',
    color: 'bg-orange-50 text-orange-600',
    href: '/localization'
  },
];
```

**Recent Analyses List:**
- Senaste 5 analyserade annonser
- Visa: Titel, thumbnail, score, tid sedan

**Brand DNA Health:**
- 3 ScoreRings: Visual Identity, Tone of Voice, Compliance
- Insight-ruta med AI-genererad insikt

---

### 3. AD STUDIO (`/ad-studio`)

**Layout:** Två kolumner - Input (vänster), Results (höger)

**Vänster kolumn:**

1. **Creative Asset Uploader**
   - Drag & drop zone med Nordea-styling
   - Accepterar: PNG, JPG, WebP, GIF, MP4
   - Max: 50MB
   - Förhandsvisning med remove-knapp
   - Supabase Storage för uppladdning

2. **Ad Copy Input**
   - Textarea för rubrik + brödtext
   - Placeholder: "Klistra in din rubrik och brödtext här..."

3. **Run Analysis Button**
   - Nordea Blue, full bredd
   - Loading state med spinner
   - "✨ Kör AI-analys"

**Höger kolumn (efter analys):**

1. **Performance Scores**
   - 3 stora ScoreRings i rad
   - Brand Fit, Performance, Compliance
   - Färgkodade (grön/gul/röd)
   - Toggle för Heatmap

2. **Attention Heatmap Overlay**
   - Röda/gula cirklar med opacity gradient
   - Positioner baserat på AI-analys
   - Toggle på/av

3. **Compliance Checklist**
   - Items med status-ikoner:
     - ✅ Pass (grön)
     - ⚠️ Warning (gul)  
     - ❌ Fail (röd)
   - Kategorier: Logo, Disclaimer, Terminology, Contrast

4. **AI Optimization Suggestions**
   - 3-5 förslag med 💡 ikon
   - Kategoriserade tips

5. **Virtual Focus Group**
   - Persona-tabs för att välja testperson
   - Chat-interface
   - AI svarar som vald persona
   - Baserat på persona's system_prompt

**API: /api/analyze**
```typescript
// Request
interface AnalyzeRequest {
  imageUrl: string;
  adCopy?: string;
  channel?: string;
}

// Response  
interface AnalyzeResponse {
  brandFit: number;
  performance: number;
  compliance: number;
  heatmapData: Array<{
    x: number;      // 0-100 (procent från vänster)
    y: number;      // 0-100 (procent från toppen)
    intensity: number; // 0-1
    label?: string; // "CTA", "Headline", etc.
  }>;
  complianceItems: Array<{
    status: 'pass' | 'warning' | 'fail';
    category: 'logo' | 'disclaimer' | 'terminology' | 'contrast' | 'legal';
    message: string;
  }>;
  suggestions: Array<{
    type: 'visual' | 'copy' | 'compliance' | 'performance';
    priority: 'high' | 'medium' | 'low';
    message: string;
  }>;
}
```

**API: /api/persona-chat**
```typescript
// Request
interface PersonaChatRequest {
  personaId: string;
  adAnalysisId?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  newMessage: string;
}

// Response
interface PersonaChatResponse {
  reply: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'skeptical';
}
```

---

### 4. COPY STUDIO (`/copy-studio`)

**Layout:** Två kolumner

**Vänster kolumn:**

1. **Channel Selector**
   ```typescript
   const channels = [
     { id: 'linkedin', label: 'LinkedIn', icon: '💼', maxLength: { headline: 150, body: 600 } },
     { id: 'meta', label: 'Meta/Instagram', icon: '📱', maxLength: { headline: 40, body: 125 } },
     { id: 'tiktok', label: 'TikTok', icon: '🎵', maxLength: { headline: 30, body: 100 } },
     { id: 'display', label: 'Display', icon: '🖥️', maxLength: { headline: 30, body: 90 } },
     { id: 'email', label: 'E-post', icon: '📧', maxLength: { headline: 60, body: 500 } },
   ];
   ```

2. **Campaign Objective**
   ```typescript
   const objectives = [
     { id: 'awareness', label: 'Varumärkeskännedom' },
     { id: 'consideration', label: 'Övervägande' },
     { id: 'conversion', label: 'Konvertering' },
     { id: 'retention', label: 'Lojalitet' },
   ];
   ```

3. **Topic & Context**
   - Textarea med briefing
   - Exempel: "Marknadsför vår nya bolånekalkylator för förstagångsköpare som vill förstå vad de har råd med..."

4. **Generate Button**
   - "✨ Generera copy"

**Höger kolumn (efter generering):**

1. **Generated Copy**
   - Brand Fit + Tone score badges
   - Fält: Headline, Subheadline, Body, CTA, Hashtags
   - Varje fält kopierbart

2. **Tone of Voice Analysis**
   - 4 progress bars:
     - Mänsklig & varm
     - Tydlig & enkel
     - Självsäker men ödmjuk
     - Framåtblickande

3. **Actions**
   - Kopiera allt
   - Generera om
   - Spara till bibliotek

**API: /api/generate-copy**
```typescript
interface GenerateCopyRequest {
  channel: string;
  objective: string;
  topic: string;
  targetMarket?: string;
}

interface GenerateCopyResponse {
  headline: string;
  subheadline: string;
  bodyCopy: string;
  cta: string;
  hashtags?: string;
  brandFitScore: number;
  toneScores: {
    humanWarm: number;
    clearSimple: number;
    confidentHumble: number;
    forwardLooking: number;
  };
}
```

---

### 5. CAMPAIGN PLANNER (`/campaign-planner`)

**Tabs:**
1. Budget Calculator
2. Reach & Frequency
3. Target Audience

**Channel Data:**
```typescript
const nordeaChannels = [
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: '💼',
    defaultCpm: 180,    // SEK
    defaultCtr: 0.8,    // %
    reachRate: 0.65,    // % av impressions som blir unik räckvidd
    minBudget: 10000,
    description: 'B2B och yrkesverksamma'
  },
  { 
    id: 'meta', 
    name: 'Meta/Instagram', 
    icon: '📱',
    defaultCpm: 95,
    defaultCtr: 1.2,
    reachRate: 0.72,
    minBudget: 5000,
    description: 'Bred räckvidd, alla åldrar'
  },
  { 
    id: 'display', 
    name: 'Display/Programmatic', 
    icon: '🖥️',
    defaultCpm: 45,
    defaultCtr: 0.15,
    reachRate: 0.85,
    minBudget: 20000,
    description: 'Banners på nyhets- och finanssajter'
  },
  { 
    id: 'youtube', 
    name: 'YouTube', 
    icon: '▶️',
    defaultCpm: 120,
    defaultCtr: 0.5,
    reachRate: 0.58,
    minBudget: 15000,
    description: 'Video, hög uppmärksamhet'
  },
  { 
    id: 'tiktok', 
    name: 'TikTok', 
    icon: '🎵',
    defaultCpm: 85,
    defaultCtr: 1.5,
    reachRate: 0.68,
    minBudget: 10000,
    description: 'Yngre målgrupper, viral potential'
  },
];
```

**Beräkningslogik:**
```typescript
interface CampaignInput {
  budget: number;
  durationDays: number;
  channels: Array<{
    channelId: string;
    allocation: number; // 0-100
    customCpm?: number;
  }>;
  audience: {
    size: number;
    geography: string;
    ageMin: number;
    ageMax: number;
  };
}

function calculateCampaignForecast(input: CampaignInput): CampaignForecast {
  const channelResults = input.channels.map(c => {
    const channelConfig = nordeaChannels.find(nc => nc.id === c.channelId)!;
    const cpm = c.customCpm || channelConfig.defaultCpm;
    const channelBudget = input.budget * (c.allocation / 100);
    const impressions = Math.round((channelBudget / cpm) * 1000);
    const maxReach = input.audience.size * channelConfig.reachRate;
    const reach = Math.round(Math.min(maxReach, impressions * 0.6));
    const clicks = Math.round(impressions * (channelConfig.defaultCtr / 100));
    const frequency = reach > 0 ? parseFloat((impressions / reach).toFixed(1)) : 0;
    
    return {
      channelId: c.channelId,
      channelName: channelConfig.name,
      icon: channelConfig.icon,
      budget: channelBudget,
      impressions,
      reach,
      clicks,
      frequency,
      cpm,
      ctr: channelConfig.defaultCtr,
    };
  });

  // Account for audience overlap (75% of combined reach)
  const rawTotalReach = channelResults.reduce((sum, c) => sum + c.reach, 0);
  const uniqueReach = Math.round(rawTotalReach * 0.75);
  const totalImpressions = channelResults.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = channelResults.reduce((sum, c) => sum + c.clicks, 0);

  return {
    uniqueReach,
    totalImpressions,
    totalClicks,
    avgFrequency: uniqueReach > 0 ? parseFloat((totalImpressions / uniqueReach).toFixed(1)) : 0,
    estimatedCtr: totalImpressions > 0 ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0,
    avgCpm: totalImpressions > 0 ? Math.round((input.budget / totalImpressions) * 1000) : 0,
    avgCpc: totalClicks > 0 ? Math.round(input.budget / totalClicks) : 0,
    costPerReach: uniqueReach > 0 ? parseFloat((input.budget / uniqueReach).toFixed(2)) : 0,
    reachPercentage: parseFloat(((uniqueReach / input.audience.size) * 100).toFixed(1)),
    channelBreakdown: channelResults,
    warnings: getWarnings(channelResults, uniqueReach, input.audience.size),
  };
}

function getWarnings(channels: ChannelResult[], reach: number, audienceSize: number): string[] {
  const warnings: string[] = [];
  
  channels.forEach(c => {
    if (c.frequency > 8) {
      warnings.push(`⚠️ ${c.channelName}: Hög frekvens (${c.frequency}x) kan orsaka annonsutmattning`);
    }
  });
  
  if (reach / audienceSize < 0.1) {
    warnings.push('💡 Låg räckvidd - överväg att öka budgeten eller bredda målgruppen');
  }
  
  return warnings;
}
```

**Export:**
- PDF med jsPDF
- PowerPoint med pptxgenjs
- Spara till databas

---

### 6. LOCALIZATION (`/localization`)

**Nordiska Marknader:**
```typescript
const nordicMarkets = [
  {
    id: 'se',
    name: 'Sverige',
    flag: '🇸🇪',
    language: 'Svenska',
    currency: 'SEK',
    regulator: 'Finansinspektionen',
    culturalNotes: [
      'Lagom-principen – undvik överdrifter och skryt',
      'Jämlikhet och inkludering är viktigt',
      'Miljö och hållbarhet resonerar starkt',
      'Direkt men artig kommunikation',
      'Förtroende byggs långsamt men är starkt',
    ],
    legalRequirements: [
      'Marknadsföringslagen (2008:486)',
      'Konsumentkreditlagen för låneprodukter',
      'Riskdisclaimer krävs för investeringsprodukter',
      'Tydliga villkor och effektiv ränta',
    ],
    toneAdjustments: 'Balanserad, faktabaserad, undvik superlativ',
  },
  {
    id: 'dk',
    name: 'Danmark',
    flag: '🇩🇰',
    language: 'Dansk',
    currency: 'DKK',
    regulator: 'Finanstilsynet',
    culturalNotes: [
      'Hygge-konceptet – trygghet och välbefinnande',
      'Humor och ironi uppskattas mer än i Sverige',
      'Mer informell ton fungerar bra',
      'Skeptisk mot överdrivna löften',
      'Värdesätter ärlighet och rakt på sak',
    ],
    legalRequirements: [
      'Markedsføringsloven',
      'Kreditaftaleloven för lån',
      'ÅOP (årlig omkostning i procent) måste anges',
    ],
    toneAdjustments: 'Mer avslappnad, får vara lite rolig, direkt',
  },
  {
    id: 'no',
    name: 'Norge',
    flag: '🇳🇴',
    language: 'Norsk',
    currency: 'NOK',
    regulator: 'Finanstilsynet',
    culturalNotes: [
      'Friluftsliv och natur resonerar starkt',
      'Självständighet och frihet viktigt',
      'Oljefonden = högt sparfokus i kulturen',
      'Skeptiska mot "säljsnack" och push',
      'Föredrar att göra egen research',
    ],
    legalRequirements: [
      'Markedsføringsloven',
      'Finansavtaleloven',
      'Strikt krav på tydliga villkor',
    ],
    toneAdjustments: 'Rak, ärlig, naturlig, undvik säljspråk',
  },
  {
    id: 'fi',
    name: 'Finland',
    flag: '🇫🇮',
    language: 'Finska',
    currency: 'EUR',
    regulator: 'Finanssivalvonta',
    culturalNotes: [
      'Sisu-mentalitet – uthållighet och beslutsamhet',
      'Rakt på sak, minimal small talk',
      'Hög digital mognad och tekniktillit',
      'Förtroende byggs genom fakta, inte känslor',
      'Tysta pauser är OK, inget att fylla',
    ],
    legalRequirements: [
      'Kuluttajansuojalaki (konsumentskydd)',
      'Luottolaitoslaki (kreditinstitut)',
      'Tvåspråkighet (finska/svenska) kan krävas',
    ],
    toneAdjustments: 'Saklig, faktabaserad, kortfattad, rak',
  },
  {
    id: 'ee',
    name: 'Estland',
    flag: '🇪🇪',
    language: 'Estniska',
    currency: 'EUR',
    regulator: 'Finantsinspektsioon',
    culturalNotes: [
      'Digitalt föregångsland – e-Estonia',
      'Effektivitet och innovation värdesätts',
      'Nordisk-baltisk identitet',
      'Direkt kommunikation',
      'Unga och techkunniga',
    ],
    legalRequirements: [
      'Tarbijakaitseseadus',
      'Krediidiandjate seadus',
      'EU-direktiv implementerade',
    ],
    toneAdjustments: 'Modern, digital-first, effektiv',
  },
  {
    id: 'lt',
    name: 'Litauen',
    flag: '🇱🇹',
    language: 'Litauiska',
    currency: 'EUR',
    regulator: 'Lietuvos bankas',
    culturalNotes: [
      'Familjeorienterad kultur',
      'Växande medelklass',
      'Bankförtroende ökar',
      'Digital adoption växer snabbt',
    ],
    legalRequirements: [
      'Vartotojų teisių apsaugos įstatymas',
      'EU-direktiv implementerade',
    ],
    toneAdjustments: 'Familjär, pålitlig, tillgänglig',
  },
];
```

**API: /api/localize**
```typescript
interface LocalizeRequest {
  sourceMarket: string;
  sourceContent: {
    headline: string;
    body: string;
    cta: string;
  };
  targetMarkets: string[];
}

interface LocalizeResponse {
  localizations: {
    [market: string]: {
      headline: string;
      body: string;
      cta: string;
      scores: {
        linguistic: number;  // Språklig precision
        cultural: number;    // Kulturell passform
        legal: number;       // Juridisk efterlevnad
      };
      adaptations: Array<{
        type: 'cultural' | 'linguistic' | 'legal' | 'tone';
        original: string;
        adapted: string;
        reason: string;
      }>;
      alternativeHeadlines: Array<{
        text: string;
        confidence: number;
      }>;
    };
  };
}
```

---

### 7. PERSONAS (`/personas`)

**UI:**
- Grid med PersonaCards
- "+ Skapa persona" knapp öppnar dialog
- Klick på kort öppnar edit-dialog
- Default personas markerade med badge

**PersonaCard:**
- Avatar (stor emoji eller bild)
- Namn
- Beskrivning (1 rad)
- Traits som tags
- Edit/Delete knappar (ej för default)

**Create/Edit Dialog:**
- Formulär med alla fält från databasschemat
- Trait-input med chips
- System prompt textarea med hjälptext
- Preview av hur prompten ser ut

---

## 🤖 AI PROMPTS

### Nordea Tone of Voice (används i alla prompts)
```typescript
const nordeaToneOfVoice = `
NORDEA TONE OF VOICE:

1. MÄNSKLIG & VARM
- Vi pratar med människor, inte till dem
- Personlig utan att vara påträngande
- Visar att vi förstår kundens situation

2. TYDLIG & ENKEL
- Undvik bankjargong och komplexa termer
- Var konkret och specifik
- En tanke per mening

3. SJÄLVSÄKER MEN ÖDMJUK
- Vi är experter men inte överdrivet skrytsamma
- Säger "vi kan hjälpa dig" inte "vi är bäst"
- Erkänner att ekonomi kan vara svårt

4. FRAMÅTBLICKANDE
- Fokuserar på möjligheter, inte problem
- Hjälper kunder framåt
- Optimistisk men realistisk

UNDVIK:
- Superlativ ("bäst", "mest", "störst")
- Bankjargong utan förklaring
- Passiv form ("det kan göras" → "vi gör")
- Negativa formuleringar
- Klyschor och tomma löften
`;
```

### Brand Analysis Prompt
```typescript
const brandAnalysisPrompt = `
Du är en expert på marknadsföring och varumärkesanalys för Nordea, en av Nordens största banker.

${nordeaToneOfVoice}

ANALYSERA följande annons och ge poäng (0-100) för:

1. BRAND FIT (0-100)
- Följer annonsen Nordeas Tone of Voice?
- Matchar den visuella identiteten?
- Bygger den förtroende?

2. PERFORMANCE (0-100)
- Är budskapet tydligt?
- Är CTA:n effektiv?
- Drar visuella element uppmärksamhet rätt?

3. COMPLIANCE (0-100)
- Följer svensk/nordisk marknadsföringslagstiftning?
- Finns nödvändiga disclaimers?
- Är villkor tydliga?

KONTROLLERA SPECIFIKT:
- Nordea-logotypens placering
- Riskdisclaimer för investeringsprodukter
- Förbjudna termer ("garanterad avkastning", etc.)
- Färgkontrast för tillgänglighet

GE ÄVEN:
- 3-5 konkreta förbättringsförslag
- Simulerade attention points (x,y koordinater 0-100)

Svara i JSON-format enligt detta schema:
{
  "brandFit": number,
  "performance": number,
  "compliance": number,
  "heatmapData": [{"x": number, "y": number, "intensity": number, "label": string}],
  "complianceItems": [{"status": "pass"|"warning"|"fail", "category": string, "message": string}],
  "suggestions": [{"type": string, "priority": string, "message": string}]
}
`;
```

### Persona Simulation Prompt
```typescript
const personaSimulationPrompt = (persona: Persona) => `
Du är ${persona.name}, ${persona.description}.

DEMOGRAFI:
- Ålder: ${persona.age_min}-${persona.age_max} år
- Livssituation: ${persona.life_stage}
- Digital mognad: ${persona.digital_maturity}

KARAKTÄRSDRAG:
${persona.traits.map(t => `- ${t}`).join('\n')}

DINA MÅL:
${persona.goals.map(g => `- ${g}`).join('\n')}

DINA SMÄRTPUNKTER:
${persona.pain_points.map(p => `- ${p}`).join('\n')}

INTRESSEN:
${persona.interests.join(', ')}

PRODUKTER DU ÄR INTRESSERAD AV:
${persona.products_interested.join(', ')}

KOMMUNIKATIONSSTIL:
- Response style: ${persona.response_style}
- Du föredrar kontakt via: ${persona.channel_preference.join(', ')}

${persona.system_prompt || ''}

INSTRUKTIONER:
- Håll dig i karaktär genom hela konversationen
- Svara på svenska
- Ge ärlig, konstruktiv feedback ur ditt perspektiv
- Ställ följdfrågor som din karaktär naturligt skulle ställa
- Var skeptisk om det passar din karaktär
- Visa dina smärtpunkter och behov
`;
```

### Copy Generation Prompt
```typescript
const copyGenerationPrompt = (channel: string, objective: string, topic: string) => `
Du är en senior copywriter på Nordeas interna marknadsteam.

${nordeaToneOfVoice}

UPPDRAG:
Skriv marknadsföringscopy för ${channel} med mål: ${objective}

ÄMNE/BRIEF:
${topic}

KANALSPECIFIKA KRAV FÖR ${channel.toUpperCase()}:
${getChannelRequirements(channel)}

GENERERA:
1. Headline (rubrik)
2. Subheadline (underrubrik) 
3. Body copy (brödtext)
4. CTA (call-to-action)
5. Hashtags (om relevant för kanalen)

ANALYSERA också hur väl texten följer Nordeas Tone of Voice (0-100 per dimension).

Svara i JSON-format:
{
  "headline": string,
  "subheadline": string,
  "bodyCopy": string,
  "cta": string,
  "hashtags": string | null,
  "brandFitScore": number,
  "toneScores": {
    "humanWarm": number,
    "clearSimple": number,
    "confidentHumble": number,
    "forwardLooking": number
  }
}
`;
```

### Localization Prompt
```typescript
const localizationPrompt = (sourceMarket: string, targetMarket: string, content: any) => `
Du är expert på nordisk marknadsföring och lokalisering för Nordea.

UPPGIFT:
Lokalisera följande marknadsföringsinnehåll från ${sourceMarket} till ${targetMarket}.

KÄLLINNEHÅLL:
Rubrik: ${content.headline}
Brödtext: ${content.body}
CTA: ${content.cta}

MÅLMARKNADSINFO:
${JSON.stringify(nordicMarkets.find(m => m.id === targetMarket), null, 2)}

INSTRUKTIONER:
1. Översätt och anpassa kulturellt - inte bara ordagrant
2. Behåll Nordeas Tone of Voice
3. Anpassa till lokala marknadsföringsregler
4. Justera ton enligt marknadens preferenser
5. Använd lokala uttryck och referenspunkter där lämpligt

DOKUMENTERA:
- Alla anpassningar du gör och varför
- Quality scores för språk, kultur och juridik
- 2-3 alternativa rubriker

Svara i JSON-format:
{
  "headline": string,
  "body": string,
  "cta": string,
  "scores": {
    "linguistic": number,
    "cultural": number,
    "legal": number
  },
  "adaptations": [
    {
      "type": "cultural" | "linguistic" | "legal" | "tone",
      "original": string,
      "adapted": string,
      "reason": string
    }
  ],
  "alternativeHeadlines": [
    {"text": string, "confidence": number}
  ]
}
`;
```

---

## 🚀 DEPLOYMENT

### Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# Alternativt Claude
ANTHROPIC_API_KEY=sk-ant-xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Nordea CreativeIQ"
```

### Font Setup
Användaren kommer tillhandahålla Nordea Sans-fonter. Lägg dem i:
```
/public/fonts/
  NordeaSans-Regular.woff2
  NordeaSans-Medium.woff2
  NordeaSans-Bold.woff2
```

Om fontfilerna inte finns, fallback till Inter.

### Logotyp
Användaren kommer tillhandahålla Nordea-logotyp. Lägg den i:
```
/public/images/
  nordea-logo.svg
  nordea-logo-white.svg
```

Om logofilen inte finns, använd text "Nordea" med N-ikon som placeholder.

---

## ✅ DEFINITION OF DONE

Projektet är klart när:

- [ ] Login fungerar med @nordea.com-validering
- [ ] Dashboard visar statistik från databas
- [ ] Ad Studio: Kan ladda upp bild och få AI-analys med scores, heatmap, compliance, suggestions
- [ ] Ad Studio: Virtual Focus Group chat fungerar med alla 4 default personas
- [ ] Copy Studio: Kan generera copy för alla 5 kanaler med Tone of Voice-analys
- [ ] Campaign Planner: Budget-kalkylator med alla beräkningar och visualiseringar
- [ ] Campaign Planner: Export till PDF fungerar
- [ ] Localization: Kan lokalisera till alla 6 nordiska/baltiska marknader
- [ ] Personas: CRUD fungerar, default personas finns
- [ ] Settings: Kan byta UI-språk (sv/en)
- [ ] Responsiv design (fungerar på tablet)
- [ ] Nordea-branding genomgående (färger, typografi)
- [ ] Inga TypeScript-fel
- [ ] Inga console errors
- [ ] Deployad och fungerar

---

## 🏃 KÖRORDNING FÖR AUTONOM BUILD

1. **Projektsetup** (15 min)
   - `npx create-next-app@latest nordea-creative-iq --typescript --tailwind --app`
   - Installera: `@supabase/supabase-js`, `openai`, `lucide-react`, `jspdf`
   - Konfigurera Shadcn/ui
   - Sätt upp font loading (med fallback)

2. **Supabase** (20 min)
   - Skapa projekt
   - Kör SQL-schema
   - Konfigurera Auth med email
   - Sätt upp Storage bucket

3. **Auth & Layout** (30 min)
   - Login-sida med Nordea-branding
   - Dashboard layout med sidebar
   - User menu med logout
   - Protected routes

4. **Dashboard** (20 min)
   - Stats cards
   - Quick actions
   - Recent activity

5. **Personas** (30 min)
   - Seed default personas
   - List view
   - Create/Edit dialogs
   - CRUD API

6. **Copy Studio** (45 min)
   - Channel/objective selectors
   - AI generation API
   - Output display
   - Tone analysis

7. **Ad Studio** (60 min)
   - File upload
   - AI analysis API
   - Score rings
   - Heatmap overlay
   - Compliance list
   - Suggestions
   - Focus group chat

8. **Campaign Planner** (60 min)
   - Budget inputs
   - Channel mixer
   - Audience builder
   - Calculation logic
   - Forecast display
   - Export

9. **Localization** (45 min)
   - Market selector
   - Content input
   - AI localization API
   - Results display
   - Quality scores

10. **Polish** (30 min)
    - Loading states
    - Error handling
    - Toasts
    - Responsiv fixes

11. **Deploy** (15 min)
    - Push till GitHub
    - Deploy till Vercel
    - Testa i produktion

---

**BÖRJA BYGGA NU! 🚀**
