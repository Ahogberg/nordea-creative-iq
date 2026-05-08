# CreativeIQ 2.0 – Utvecklingsplan
## Mergad roadmap: Nuvarande sprints + 6-månaders vision

---

## Strategisk positionering

CreativeIQ ska bli den enda plattformen som kombinerar:

| Funktion                       | Bannerflow | Celtra | Higgsfield | **CreativeIQ**       |
|--------------------------------|------------|--------|------------|----------------------|
| Template → format-set          | ✅         | ✅     | ❌         | ✅                   |
| AI copy + lokalisering         | Lite       | ✅     | ❌         | ✅                   |
| Generativ AI-video             | ❌         | ❌     | ✅         | ✅                   |
| Persona-jury före export       | ❌         | ❌     | ❌         | ✅ **(MOAT)**        |
| Bank-compliance + ToV          | ❌         | ❌     | ❌         | ✅ **(MOAT)**        |
| Performance feedback-loop      | ❌         | Delvis | ❌         | ✅ **(MOAT)**        |

---

## Arkitektur

```
app/(dashboard)/...              → UI-lager
       │
       ▼
lib/ai/providers/                → Provider-router (Anthropic, Fal.ai, Higgsfield MCP)
       │
       ▼
lib/qa/                          → QA-gate: persona-jury, heatmap, compliance, ToV
       │
       ▼
lib/master-creative/             → Master → format-set + lokalisering
       │
       ▼
lib/remotion/ + lib/dam/         → Video-rendering + Asset-hantering
```

---

## FAS 1: GRUND (Vecka 1-4)

### Sprint 2: Creative Production Engine — KLAR
- Remotion video editor
- Bakgrund, text, logo, timing
- Multi-format (9:16, 1:1, 16:9, 4:5)
- Live preview
- AI copy-generering

### Sprint 3: Template Library + Bulk Production — PÅGÅR

**Mål:** Spara mallar, generera varianter i volym

**Nya filer:**
```
lib/video-types.ts                    → Template + Production types
app/api/templates/route.ts            → CRUD för mallar
app/api/templates/[id]/route.ts       → Single template ops
app/api/generate-variants/route.ts    → AI-generering av textvarianter
app/api/production/route.ts           → Production jobs
app/(dashboard)/templates/page.tsx    → Mallbibliotek UI
app/(dashboard)/produce/page.tsx      → Production Mode UI
components/modals/save-template-modal.tsx
```

**Database (Supabase):**
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  background JSONB,
  logo JSONB,
  text_structure JSONB,
  default_texts JSONB,
  formats TEXT[],
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE production_jobs (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES templates(id),
  variants JSONB,
  formats TEXT[],
  status TEXT DEFAULT 'pending',
  total_videos INTEGER,
  completed_videos INTEGER,
  zip_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Verifiering:**
- [ ] Spara mall från editor
- [ ] AI genererar 5 varianter baserat på mallens text
- [ ] "3 rubriker × 2 brödtexter × 2 CTAs × 2 format = 24 videor"
- [ ] Export som ZIP

---

### Sprint 4: Motion Polish

**Mål:** After Effects-kvalitet på animationer

**Nya filer:**
```
lib/remotion/animations/spring.ts     → Spring physics configs
lib/remotion/animations/easing.ts     → Custom easing curves
lib/remotion/animations/presets.ts    → Nordea motion language
lib/remotion/scenes/StaggeredText.tsx → Ord-för-ord animation
lib/remotion/scenes/CountingNumber.tsx → Animerade siffror
lib/remotion/scenes/LogoReveal.tsx    → Branded logo-intro
```

**Motion language:**
```typescript
export const NORDEA_MOTION = {
  logoReveal: {
    type: 'spring',
    config: { damping: 15, stiffness: 150 },
    scale: [0.95, 1],
    opacity: [0, 1],
  },
  headline: {
    type: 'staggered',
    perWord: true,
    delay: 3, // frames mellan ord
    easing: 'easeOutCubic',
  },
  cta: {
    type: 'spring',
    config: { damping: 10, stiffness: 200 },
    scale: [0.8, 1],
  },
  countingNumber: {
    duration: 45, // frames
    easing: 'easeOutExpo',
  },
};
```

**Verifiering:**
- [ ] Logo fade+scale med spring
- [ ] Headlines animeras ord för ord
- [ ] Siffror räknar upp (för sparkalkylator-template)
- [ ] CTA bouncar in

---

## FAS 2: QA-GATE / MOAT (Vecka 5-8)

### Sprint 5: Persona-driven QA Gate

**Mål:** Inget material lämnar plattformen utan QA. Score <70 blockerar export.

**Nya filer:**
```
lib/qa/gate.ts                        → Orkestrerare för alla checks
lib/qa/persona-jury.ts                → 4 personas reagerar parallellt
lib/qa/tov-scorer.ts                  → Nordea ToV (personlig, expert, ansvarsfull)
lib/qa/compliance.ts                  → FI-disclaimers, WCAG-kontrast
lib/qa/heatmap.ts                     → Eye-tracking på video-frames
lib/qa/thresholds.ts                  → Konfigurerbara trösklar
app/api/qa-run/route.ts               → POST → kör gate → returnerar rapport
components/qa/QAReport.tsx            → UI för QA-resultat
```

**QA-checks (parallella):**
```typescript
interface QAReport {
  total_score: number;        // 0-100, <70 = blockerad

  persona_jury: {
    scores: PersonaScore[];   // 4 personas
    aggregate: number;
  };

  tov: {
    personlig: number;        // 0-10
    expert: number;
    ansvarsfull: number;
    suggestions: string[];
  };

  compliance: {
    passed: boolean;
    issues: ComplianceIssue[];  // Saknad disclaimer, etc
  };

  heatmap: {
    attention_score: number;
    focus_areas: FocusArea[];
  };

  status: 'pass' | 'warn' | 'fail';
  blocking_issues: string[];
}
```

**Database:**
```sql
CREATE TABLE qa_runs (
  id UUID PRIMARY KEY,
  creative_id UUID,
  creative_kind TEXT,  -- 'video' | 'banner' | 'copy'
  persona_score NUMERIC,
  tov_score NUMERIC,
  compliance_score NUMERIC,
  heatmap_score NUMERIC,
  total_score NUMERIC,
  issues JSONB,
  suggestions JSONB,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**UI-integration:**
- Motion Studio: efter render → auto-QA → visa rapport → export disabled om fail
- Templates: QA-badge på varje variant
- Produce: bulk-QA på alla kombinationer

**Verifiering:**
- [ ] Skapa video utan disclaimer → QA fail → export blockerad
- [ ] Fixa → re-render → QA pass → export aktiverad
- [ ] QA körs på <30s för 15-sek video
- [ ] Alla 4 personas ger feedback

---

## FAS 3: GENERATIV AI-VIDEO (Vecka 9-12)

### Sprint 6: Fal.ai Integration

**Mål:** Riktig AI-genererad video (Kling, Veo, Sora) — inte bara Remotion

**Nya filer:**
```
lib/ai/providers/fal.ts               → Fal.ai wrapper
lib/ai/providers/provider-router.ts   → Väljer provider per request
lib/remotion/scenes/GeneratedClip.tsx → Spelar upp AI-video i Remotion
app/api/generate-clip/route.ts        → POST → Fal.ai → MP4 URL
app/api/generate-image/route.ts       → POST → Flux/Ideogram → bild
```

**Provider-router:**
```typescript
// lib/ai/providers/provider-router.ts
export async function generateVideo(prompt: string, opts: GenerateOpts) {
  const provider = selectProvider(opts);

  switch (provider) {
    case 'fal':
      return fal.generateVideo(prompt, opts);
    case 'higgsfield':
      return higgsfield.generateVideo(prompt, opts);
    case 'remotion':
      return remotion.render(prompt, opts);
  }
}

function selectProvider(opts: GenerateOpts): Provider {
  if (opts.style === 'realistic') return 'fal';      // Kling
  if (opts.style === 'abstract') return 'fal';       // Veo
  if (opts.needsCharacter) return 'higgsfield';      // Soul
  return 'remotion';                                  // Programmatisk
}
```

**Modeller via Fal.ai:**
```typescript
export const FAL_MODELS = {
  video: {
    'kling-3.0': { cost: 0.065, duration: '5-10s', style: 'realistic' },
    'kling-2.5-turbo': { cost: 0.032, duration: '5s', style: 'realistic' },
    'veo-3.1-fast': { cost: 0.08, duration: '8s', style: 'cinematic' },
    'sora-2-pro': { cost: 0.10, duration: '10s', style: 'abstract' },
    'seedance-1.5': { cost: 0.05, duration: '5s', style: 'motion' },
  },
  image: {
    'flux-1.1-pro': { cost: 0.04 },
    'ideogram-3': { cost: 0.05 },
    'recraft-v3': { cost: 0.04 },
  },
};
```

**Database:**
```sql
CREATE TABLE generated_assets (
  id UUID PRIMARY KEY,
  kind TEXT,              -- 'clip' | 'image'
  prompt TEXT,
  model TEXT,
  provider TEXT,
  fal_job_id TEXT,
  url TEXT,
  thumbnail TEXT,
  duration_s NUMERIC,
  aspect TEXT,
  cost_usd NUMERIC,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Cost tracking UI:**
```
┌─────────────────────────────────────────┐
│  Denna video kostade $0.52              │
│  ├── Kling 2.5 Turbo × 8s = $0.26       │
│  ├── Flux 1.1 Pro × 2 bilder = $0.08    │
│  └── Claude copy × 3 calls = $0.18      │
└─────────────────────────────────────────┘
```

**Verifiering:**
- [ ] Prompt "15-sek reel om bolån" → riktig AI-video från Kling
- [ ] Fallback till Remotion om Fal.ai timeout
- [ ] Cost visas per generation
- [ ] Caching på hash(prompt+model)

---

## FAS 4: ADVANCED (Vecka 13-20)

### Sprint 7: Higgsfield MCP + Soul-karaktärer

**Mål:** Konsekventa karaktärer (Erik, Maria, Lars, Sofia) över flera videos

**Nya filer:**
```
lib/ai/providers/higgsfield-mcp.ts    → MCP-client
lib/ai/personas/soul-characters.ts    → Nordea Soul-karaktärer
scripts/train-soul-characters.ts      → Träna karaktärer
app/api/mcp-proxy/route.ts            → Server-side MCP proxy
```

**Soul-karaktärer:**
```typescript
export const NORDEA_SOULS = {
  erik: {
    id: 'soul_erik_xxx',
    persona: 'Ung förstagångsköpare',
    age: 28,
    traits: ['optimistisk', 'digital', 'lite nervös'],
  },
  maria: {
    id: 'soul_maria_xxx',
    persona: 'Familjeföräldern',
    age: 38,
    traits: ['trygghetssökande', 'praktisk', 'tidspressad'],
  },
  // ... lars, sofia
};
```

---

### Sprint 8: DAM + Asset Library

**Mål:** Sökbar asset-databas med AI-taggning

**Nya filer:**
```
lib/dam/schema.ts                     → Asset-typer
lib/dam/embeddings.ts                 → Vector-embeddings för sök
lib/dam/search.ts                     → Semantisk sökning
lib/dam/auto-tagger.ts                → Claude vision-taggning
lib/dam/stock-providers.ts            → Pexels, Unsplash
lib/dam/music.ts                      → Mubert (royalty-free musik)
app/(dashboard)/dam/page.tsx          → DAM UI
components/dam/AssetPicker.tsx        → Återanvändbar picker
```

**Database:**
```sql
-- Kräver: CREATE EXTENSION vector;
CREATE TABLE assets (
  id UUID PRIMARY KEY,
  kind TEXT,              -- 'image' | 'video' | 'audio' | 'font' | 'logo'
  title TEXT,
  url TEXT,
  thumbnail TEXT,
  tags TEXT[],
  embedding vector(1536), -- För semantisk sök
  source TEXT,            -- 'uploaded' | 'generated' | 'stock' | 'brand'
  license_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON assets USING hnsw (embedding vector_cosine_ops);
```

---

### Sprint 9: Master Creative → Format-set

**Mål:** En master → 36 lokaliserade varianter automatiskt

**Nya filer:**
```
lib/master-creative/schema.ts         → Zod-schema för master
lib/master-creative/resize-engine.ts  → AI-driven re-flow
lib/master-creative/format-presets.ts → Alla standardformat
lib/master-creative/localizer.ts      → SE/DK/NO/FI/EE/LT
lib/queue/jobs.ts                     → Bakgrundsjobb (Inngest)
app/(dashboard)/format-studio/page.tsx → Format Studio UI
app/api/format-set-generate/route.ts
app/api/format-set-export/route.ts    → ZIP eller Meta Ads push
```

**Format-presets:**
```typescript
export const FORMAT_PRESETS = {
  banners: [
    { id: 'mrec', width: 300, height: 250, label: 'Medium Rectangle' },
    { id: 'leaderboard', width: 728, height: 90 },
    { id: 'skyscraper', width: 160, height: 600 },
    { id: 'billboard', width: 970, height: 250 },
    { id: 'mobile', width: 320, height: 100 },
  ],
  video: [
    { id: 'story', width: 1080, height: 1920, aspect: '9:16' },
    { id: 'feed', width: 1080, height: 1080, aspect: '1:1' },
    { id: 'landscape', width: 1920, height: 1080, aspect: '16:9' },
    { id: 'portrait', width: 1080, height: 1350, aspect: '4:5' },
  ],
  markets: ['SE', 'DK', 'NO', 'FI', 'EE', 'LT'],
};

// 5 banners × 4 video × 6 markets = 54 varianter per master
```

---

### Sprint 10: Performance Feedback Loop

**Mål:** Faktisk CTR/VTR kalibrerar persona-modellen

**Nya filer:**
```
lib/performance/ingest.ts             → Meta/LinkedIn/Google API adapters
lib/performance/calibrator.ts         → Nattlig kalibrering
lib/dco/rotator.ts                    → Auto-rotation förslag
app/(dashboard)/performance/page.tsx  → Performance dashboard
```

**Database:**
```sql
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY,
  creative_id UUID,
  platform TEXT,
  impressions INTEGER,
  clicks INTEGER,
  conversions INTEGER,
  vtr NUMERIC,
  ctr NUMERIC,
  period_start DATE,
  period_end DATE
);

CREATE TABLE persona_calibration (
  id UUID PRIMARY KEY,
  persona_id TEXT,
  prediction_field TEXT,
  predicted_value NUMERIC,
  actual_value NUMERIC,
  delta NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## FAS 5: ENTERPRISE (Vecka 21-24)

### Sprint 11: Enterprise Prep

**Mål:** Redo för Nordea IT att ta över

**Nya filer:**
```
lib/config/enterprise.ts              → Provider-abstraktioner
lib/governance/audit.ts               → Audit-loggning
lib/governance/rbac.ts                → Role-based access
middleware.ts                         → RBAC-checks
app/(dashboard)/admin/page.tsx        → Admin UI
docs/DEPLOYMENT.md
docs/ARCHITECTURE.md
docs/MIGRATION.md                     → Supabase → Azure guide
docs/SECURITY.md
```

**Abstraktionslager:**
```typescript
// lib/config/enterprise.ts
export const config = {
  auth: {
    provider: env.AUTH_PROVIDER || 'supabase',  // 'azure-ad' | 'supabase'
  },
  ai: {
    provider: env.AI_PROVIDER || 'anthropic',   // 'azure-openai' | 'anthropic'
  },
  storage: {
    provider: env.STORAGE_PROVIDER || 'supabase', // 'azure-blob' | 'supabase'
  },
  rendering: {
    provider: env.RENDER_PROVIDER || 'lambda',  // 'azure-functions' | 'lambda'
  },
};
```

**RBAC-roller:**
```typescript
export const ROLES = {
  creator: ['generate', 'preview', 'save_draft'],
  reviewer: ['generate', 'preview', 'save_draft', 'approve_qa_fail'],
  approver: ['generate', 'preview', 'save_draft', 'approve_qa_fail', 'export'],
  admin: ['*'],
};
```

**Database:**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  user_id TEXT,
  event TEXT,
  entity_type TEXT,
  entity_id UUID,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Övergripande: Krav som gäller hela tiden

### Cost tracking
```typescript
// Alla AI-anrop loggas
CREATE TABLE ai_calls (
  id UUID PRIMARY KEY,
  provider TEXT,
  model TEXT,
  latency_ms INTEGER,
  cost_usd NUMERIC,
  status TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Caching
```typescript
// Undvik dubbla kostnader
const cacheKey = hash(prompt + model + JSON.stringify(params));
const cached = await cache.get(cacheKey);
if (cached) return cached;
```

### Rate limiting
```typescript
// Per-user limits
const limit = await rateLimit.check(userId, 'generate-video');
if (!limit.allowed) throw new RateLimitError();
```

### Type safety
- Zod på alla API-boundaries
- Inga `any` utan motivering
- Strict TypeScript

---

## Tidslinje

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  VECKA    1   2   3   4   5   6   7   8   9  10  11  12         │
│           ┌───────────────┬───────────────┬───────────────┐     │
│           │    FAS 1      │    FAS 2      │    FAS 3      │     │
│           │   GRUND       │   QA-GATE     │   GEN AI      │     │
│           │               │               │               │     │
│  Sprint   │ 3    │ 4      │ 5             │ 6             │     │
│           │Templ │Motion  │ QA-gate       │ Fal.ai        │     │
│           │+Bulk │Polish  │ Persona-jury  │ Kling/Veo     │     │
│                                                                 │
│  VECKA   13  14  15  16  17  18  19  20  21  22  23  24         │
│           ┌───────────────────────────────┬───────────────┐     │
│           │         FAS 4                 │    FAS 5      │     │
│           │        ADVANCED               │  ENTERPRISE   │     │
│           │                               │               │     │
│  Sprint   │ 7      │ 8    │ 9    │ 10     │ 11            │     │
│           │Higgs-  │ DAM  │Format│Perf    │ Enterprise    │     │
│           │field   │      │-set  │Loop    │ Prep          │     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Demo-milstolpar

| Vecka | Demo för stakeholders                                              |
|-------|--------------------------------------------------------------------|
| 4     | "50 videovarianter genererade på 2 minuter från en mall"           |
| 8     | "Ingen video lämnar plattformen utan persona-godkännande"          |
| 12    | "Riktig AI-genererad video, inte bara animerad text"               |
| 16    | "Samma karaktär i 10 olika videos — konsekvent storytelling"       |
| 20    | "En master → 54 lokaliserade varianter, alla QA-godkända"          |
| 24    | "Redo för Nordea IT att deploya på egen infrastruktur"             |

---

## Nästa steg

1. **Nu:** Slutför Sprint 3 (behöver Supabase-projekt)
2. **Denna vecka:** Kör Sprint 3 Del 2 i Claude Code
3. **Nästa vecka:** Sprint 4 (Motion Polish)
4. **Om 2 veckor:** Sprint 5 (QA-gate) — detta är er moat

---

## Tech stack (slutgiltig)

```
Frontend:        Next.js 14, TypeScript, Tailwind CSS
Database:        Supabase (PostgreSQL + pgvector + Auth + Storage)
Video:           Remotion (programmatisk) + Fal.ai (generativ)
AI:              Anthropic Claude (copy, QA, routing)
Characters:      Higgsfield MCP + Soul
Queue:           Inngest eller Trigger.dev
Hosting:         Vercel — senare Nordea Azure
```
