// ============================================================================
// NORDEA BRAND GUIDELINES
// Extraherat från officiella brand guidelines 2025
// ============================================================================

// ----------------------------------------------------------------------------
// FÄRGPALETT
// ----------------------------------------------------------------------------

export const NORDEA_COLORS = {
  // Primära varumärkesfärger
  primary: {
    deepBlue: { hex: '#00005E', rgb: 'rgb(0, 0, 94)', name: 'Nordea Deep Blue' },
    blue: { hex: '#0000A0', rgb: 'rgb(0, 0, 160)', name: 'Nordea Blue' },
    vividBlue: { hex: '#0000FF', rgb: 'rgb(0, 0, 255)', name: 'Nordea Vivid Blue' },
    mediumBlue: { hex: '#3399FF', rgb: 'rgb(51, 153, 255)', name: 'Nordea Medium Blue' },
    lightBlue: { hex: '#99CCFF', rgb: 'rgb(153, 204, 255)', name: 'Nordea Light Blue' },
  },
  
  // Accentfärger
  accent: {
    red: { hex: '#FC6161', rgb: 'rgb(252, 97, 97)', name: 'Nordea Accent Red' },
    yellow: { hex: '#FFE183', rgb: 'rgb(255, 225, 131)', name: 'Nordea Accent Yellow' },
    green: { hex: '#40BFA3', rgb: 'rgb(64, 191, 163)', name: 'Nordea Accent Green' },
  },
  
  // Gråskala
  gray: {
    dark: { hex: '#474748', rgb: 'rgb(71, 71, 72)', name: 'Nordea Dark Gray' },
    medium: { hex: '#8B8A8D', rgb: 'rgb(139, 138, 141)', name: 'Nordea Gray' },
    light: { hex: '#C9C7C7', rgb: 'rgb(201, 199, 199)', name: 'Nordea Medium Gray' },
    lighter: { hex: '#E6E4E3', rgb: 'rgb(230, 228, 227)', name: 'Nordea Light Gray' },
  },
  
  // Rosa toner
  pink: {
    dark: { hex: '#F0C1AE', rgb: 'rgb(240, 193, 174)', name: 'Nordea Dark Pink' },
    medium: { hex: '#FBD9CA', rgb: 'rgb(251, 217, 202)', name: 'Nordea Pink' },
    light: { hex: '#FDECE4', rgb: 'rgb(253, 236, 228)', name: 'Nordea Light Pink' },
  },
  
  // Bakgrund
  background: {
    light: { hex: '#E5F2FF', rgb: 'rgb(229, 242, 255)', name: 'Nordea Light Background' },
  },
} as const;

// ----------------------------------------------------------------------------
// TYPOGRAFI
// ----------------------------------------------------------------------------

export const NORDEA_TYPOGRAPHY = {
  fontFamily: {
    primary: 'Nordea Sans',
    fallback: 'Arial, Helvetica, sans-serif',
    full: '"Nordea Sans", Arial, Helvetica, sans-serif',
  },
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    bold: 700,
  },
  sizes: {
    // Rubriker
    h1: { desktop: '48px', mobile: '32px' },
    h2: { desktop: '36px', mobile: '24px' },
    h3: { desktop: '24px', mobile: '20px' },
    h4: { desktop: '20px', mobile: '18px' },
    // Brödtext
    bodyLarge: '18px',
    body: '16px',
    bodySmall: '14px',
    caption: '12px',
  },
} as const;

// ----------------------------------------------------------------------------
// TONE OF VOICE - SVENSKA
// ----------------------------------------------------------------------------

export const NORDEA_TONE_OF_VOICE = {
  // Kärnbudskap från kundinsikt
  coreInsight: "Jag vill ha en bank som utgår ifrån mig och som verkligen bryr sig om min framtid",
  
  // De tre ledorden
  keywords: ['personliga', 'experter', 'ansvarsfulla'] as const,
  
  // Detaljerade principer per ledord
  principles: {
    personliga: {
      description: 'Hur vi gör för att uppfattas som personliga',
      doThis: [
        'Uttryck dig på ett varmt och empatiskt sätt',
        'Tänk alltid på din målgrupp: vilka de är, vad som är viktigt för dem och hur mycket tid de har',
        'Särskilj dig: hitta nya sätt att säga saker på, snarare än att använda samma fraser som alla andra banker',
        'Använd orden vi/oss/du istället för Nordea/banken/kunden',
        'Använd aktivt språk',
        'Ställ öppna frågor',
        'Ha en bra balans mellan informellt och formellt språk',
      ],
      avoidThis: [
        'Vara överdrivet formell - det skapar avstånd mellan oss och vår målgrupp',
        'Använda samma fraser som alla andra banker',
        'Skriva opersonligt i tredje person',
      ],
    },
    
    experter: {
      description: 'Hur vi gör för att uppfattas som experter',
      doThis: [
        'Var professionell, inte tramsig eller vänskaplig på ett överdrivet sätt',
        'Förmedla komplicerade budskap på ett tydligt och enkelt sätt',
        'Var inspirerande och uttryck idéer på nya och kreativa sätt',
        'Lita på din kompetens och var inte rädd för att ha en bestämd uppfattning',
        'Var tillräckligt preciserad',
        'Anpassa språket till kunskapsnivån hos din målgrupp',
        'Undvik jargong',
        'Var ödmjuk',
      ],
      avoidThis: [
        'Vara skrytsam eller högdragen',
        'Vara tramsig eller överdrivet vänskaplig',
        'Använda bankjargong som målgruppen inte förstår',
      ],
    },
    
    ansvarsfulla: {
      description: 'Hur vi gör för att uppfattas som ansvarsfulla',
      doThis: [
        'Var rättfram och göm dig inte bakom ett formellt språk',
        'Var öppen i din kommunikation',
        'Var tydlig och använd ett språk som är lätt att förstå',
        'Var äkta och inte konstlad i din framtoning',
        'Håll meningarna korta',
        'Använd vardagsspråk',
        'Strukturera innehållet, t.ex. med sambandsmarkörer',
        'Gå rakt på sak, även om du har dåliga nyheter att komma med',
      ],
      avoidThis: [
        'Vara burdus eller okänslig',
        'Gömma dig bakom formellt språk',
        'Använda långa, komplicerade meningar',
      ],
    },
  },
  
  // B2-kravet (EU:s tillgänglighetsdirektiv)
  accessibilityRequirement: {
    level: 'B2',
    description: 'Personer på språknivå B2 kan förstå huvudinnehållet i komplexa texter om både konkreta och abstrakta ämnen samt fackmässiga diskussioner inom det egna specialområdet.',
    guidelines: [
      'Undvik underförstådda betydelser',
      'Undvik krävande och långa texter',
      'Skriv så att personer utan specialkunskap kan förstå',
    ],
  },
  
  // Självtest-frågor
  selfCheckQuestions: {
    personliga: [
      'Använder jag orden vi/oss/du istället för Nordea/banken/kunden?',
      'Använder jag aktivt språk?',
      'Ställer jag öppna frågor?',
      'Har jag en bra balans mellan informellt och formellt språk?',
    ],
    experter: [
      'Är jag tillräckligt preciserad?',
      'Anpassar jag språket till kunskapsnivån hos min målgrupp?',
      'Undviker jag jargong?',
      'Är jag ödmjuk?',
    ],
    ansvarsfulla: [
      'Är mina meningar korta?',
      'Använder jag vardagsspråk?',
      'Har jag strukturerat innehållet, t.ex. med sambandsmarkörer?',
      'Går jag rakt på sak, även om jag har dåliga nyheter att komma med?',
    ],
  },
} as const;

// ----------------------------------------------------------------------------
// COMPLIANCE-REGLER FÖR FINANSIELL MARKNADSFÖRING
// ----------------------------------------------------------------------------

export const NORDEA_COMPLIANCE = {
  general: [
    'All marknadsföring ska vara tydlig, rättvisande och inte vilseledande',
    'Väsentlig information får inte utelämnas eller döljas',
    'Risker ska presenteras lika tydligt som möjligheter',
  ],
  
  loans: {
    required: [
      'Effektiv ränta MÅSTE alltid anges',
      'Representativt exempel med totalbelopp',
      'Kreditvarning: "Tänk på att du måste kunna betala tillbaka lånet"',
    ],
    example: 'Effektiv ränta 4,95%. Exempel: Lån på 100 000 kr, ränta 4,5%, löptid 5 år. Totalt att betala: 112 000 kr.',
  },
  
  investments: {
    required: [
      '"Historisk avkastning är ingen garanti för framtida avkastning"',
      '"Värdet på din investering kan både öka och minska"',
      'Risknivå ska anges tydligt',
    ],
  },
  
  insurance: {
    required: [
      'Väsentliga begränsningar och undantag ska framgå',
      'Försäkringsgivare ska anges',
    ],
  },
  
  disclaimerExamples: {
    funds: 'Historisk avkastning är ingen garanti för framtida avkastning. Värdet på fondandelar kan både öka och minska och det är inte säkert att du får tillbaka hela det insatta kapitalet.',
    loans: 'Nordea Bank Abp, filial i Sverige. Kreditgivare. Tänk på att du alltid måste kunna betala tillbaka ett lån.',
    savings: 'Insättningsgarantin omfattar max 1 050 000 kr per person och bank.',
  },
} as const;

// ----------------------------------------------------------------------------
// SYSTEM PROMPT FÖR CLAUDE
// Denna används i alla API-anrop
// ----------------------------------------------------------------------------

export const NORDEA_SYSTEM_PROMPT = `
Du är en AI-assistent för Nordeas marknadsavdelning i Sverige. Du hjälper till med att skapa och analysera marknadsföringsmaterial.

═══════════════════════════════════════════════════════════════════════════════
NORDEAS TONE OF VOICE (OFFICIELLA RIKTLINJER 2025)
═══════════════════════════════════════════════════════════════════════════════

Nordeas kundinsikt: "${NORDEA_TONE_OF_VOICE.coreInsight}"

Vi har tre ledord som beskriver hur Nordea ska uppfattas:

1. PERSONLIGA
${NORDEA_TONE_OF_VOICE.principles.personliga.doThis.map(d => `   ✓ ${d}`).join('\n')}
   
   Undvik:
${NORDEA_TONE_OF_VOICE.principles.personliga.avoidThis.map(d => `   ✗ ${d}`).join('\n')}

2. EXPERTER
${NORDEA_TONE_OF_VOICE.principles.experter.doThis.map(d => `   ✓ ${d}`).join('\n')}
   
   Undvik:
${NORDEA_TONE_OF_VOICE.principles.experter.avoidThis.map(d => `   ✗ ${d}`).join('\n')}

3. ANSVARSFULLA
${NORDEA_TONE_OF_VOICE.principles.ansvarsfulla.doThis.map(d => `   ✓ ${d}`).join('\n')}
   
   Undvik:
${NORDEA_TONE_OF_VOICE.principles.ansvarsfulla.avoidThis.map(d => `   ✗ ${d}`).join('\n')}

B2-KRAVET (EU:s tillgänglighetsdirektiv):
Texten ska vara begriplig för personer på språknivå B2. Det innebär:
- Undvik underförstådda betydelser
- Undvik krävande och långa texter
- Skriv så att personer utan specialkunskap kan förstå

═══════════════════════════════════════════════════════════════════════════════
NORDEAS VISUELLA IDENTITET
═══════════════════════════════════════════════════════════════════════════════

PRIMÄRA FÄRGER:
- Nordea Deep Blue: #00005E (mörkaste, för kontrast)
- Nordea Blue: #0000A0 (huvudfärg, logotyp)
- Nordea Vivid Blue: #0000FF (digital accent)
- Nordea Medium Blue: #3399FF
- Nordea Light Blue: #99CCFF

ACCENTFÄRGER (sparsam användning):
- Accent Red: #FC6161 (varningar, viktigt)
- Accent Yellow: #FFE183 (highlights)
- Accent Green: #40BFA3 (positiva meddelanden)

GRÅSKALA:
- Dark Gray: #474748 (brödtext)
- Gray: #8B8A8D
- Medium Gray: #C9C7C7
- Light Gray: #E6E4E3

BAKGRUND:
- Light Background: #E5F2FF (ljus blå bakgrund)

TYPOGRAFI:
- Font: Nordea Sans (fallback: Arial, Helvetica)
- Rubriker: Nordea Sans Bold/Medium
- Brödtext: Nordea Sans Regular

═══════════════════════════════════════════════════════════════════════════════
COMPLIANCE-REGLER FÖR FINANSIELL MARKNADSFÖRING
═══════════════════════════════════════════════════════════════════════════════

GENERELLT:
- All marknadsföring ska vara tydlig, rättvisande och inte vilseledande
- Väsentlig information får inte utelämnas eller döljas
- Risker ska presenteras lika tydligt som möjligheter

LÅN (Bolån, Privatlån, Billån):
- Effektiv ränta MÅSTE alltid anges
- Representativt exempel med totalbelopp krävs
- Kreditvarning: "Tänk på att du måste kunna betala tillbaka lånet"

SPARANDE & FONDER:
- "Historisk avkastning är ingen garanti för framtida avkastning"
- "Värdet på din investering kan både öka och minska"
- Risknivå ska anges tydligt

FÖRSÄKRING:
- Väsentliga begränsningar och undantag ska framgå
- Försäkringsgivare ska anges

EXEMPEL PÅ DISCLAIMERS:
Fonder: "Historisk avkastning är ingen garanti för framtida avkastning. Värdet på fondandelar kan både öka och minska och det är inte säkert att du får tillbaka hela det insatta kapitalet."

Lån: "Nordea Bank Abp, filial i Sverige. Kreditgivare. Tänk på att du alltid måste kunna betala tillbaka ett lån."

═══════════════════════════════════════════════════════════════════════════════
STRIKTA AD-COPY-REGLER
═══════════════════════════════════════════════════════════════════════════════

FÖRBJUDNA ORD/FRASER I ANNONSTEXT:
- ALDRIG "kort" → Skriv "kreditkort" (Nordea skriver alltid ut "kreditkort" i annonstext — aldrig förkortningen "kort".)
- ALDRIG "fixar" → Skriv "ersätter / ingår" (Nordea lovar ersättning, inte en operativ lösning. Skriv aldrig att Nordea "fixar" något.)
- ALDRIG "Ansök nu" → Skriv "Se dina förmåner / Kolla dina kortförmåner" (Mjuk CTA föredras — Nordeas tonalitet är lugn och rådgivande, inte pushig.)

CTA-TONALITET:
- Mjuka CTA:er: Se dina förmåner, Kolla dina kortförmåner, Läs mer
- Frågeformat: "Försenat flyg?" → "Ersättningen ingår."
- Med måtta — inte för pushiga säljbudskap. Nordeas tonalitet är lugn och rådgivande.

═══════════════════════════════════════════════════════════════════════════════
DISPLAY-ANNONSFORMAT (safe zones & layout)
═══════════════════════════════════════════════════════════════════════════════

MREC (300×250): Padding 18px 20px 16px. Logo-rad 40px. Ikon 38px (container 42px).
  Headline: NordeaSansLarge-Black 20px. Subtext: NordeaSansSmall-Light 11px (margin-top 7px).
  CTA-knapp: #40BFA3, pill radius 20px, uppercase, 8px, padding 6px 14px.

BILLBOARD (980×240): Padding 0 40px. Logo NordeaSansSmall-Bold 32px vänster.
  Textblock flex:1 centrerat. Kortbild/placeholder höger.
  CTA: 11px, padding 11px 26px.

HALF PAGE (300×600): Padding 24px. CTA: 10px, padding 9px 20px.

IKONER: outline-stil, stroke rgba(255,255,255,0.4), fill rgba(255,255,255,0.12), strokeWidth 1.4.
  Aktiva element: stroke white, strokeWidth 2.

DISPLAY-FÄRGER:
  Blå bakgrund → vit text. Sekundär text: rgba(255,255,255,0.65). Placeholder: rgba(255,255,255,0.50).
  Peach bakgrund (#FBD9CA) → Nordea Blue (#0000A0) text.

═══════════════════════════════════════════════════════════════════════════════
SJÄLVTEST VID ANALYS
═══════════════════════════════════════════════════════════════════════════════

När du analyserar copy, ställ dessa frågor:

PERSONLIGA:
${NORDEA_TONE_OF_VOICE.selfCheckQuestions.personliga.map(q => `- ${q}`).join('\n')}

EXPERTER:
${NORDEA_TONE_OF_VOICE.selfCheckQuestions.experter.map(q => `- ${q}`).join('\n')}

ANSVARSFULLA:
${NORDEA_TONE_OF_VOICE.selfCheckQuestions.ansvarsfulla.map(q => `- ${q}`).join('\n')}
`;

// ----------------------------------------------------------------------------
// CHANNEL SPECS
// ----------------------------------------------------------------------------

export const CHANNEL_SPECS = {
  meta: {
    name: 'Meta/Instagram',
    headline: { min: 25, max: 40, ideal: 30 },
    body: { min: 60, max: 125, ideal: 90 },
    cta: ['Läs mer', 'Kom igång', 'Ansök nu', 'Boka möte', 'Se mer', 'Testa gratis'],
    tips: [
      'Första meningen är kritisk - fånga uppmärksamheten direkt',
      'Använd emojis sparsamt och professionellt',
      'Ställ en fråga för att öka engagemang',
    ],
  },
  tiktok: {
    name: 'TikTok',
    headline: { min: 15, max: 30, ideal: 20 },
    body: { min: 40, max: 100, ideal: 60 },
    cta: ['Svep upp', 'Läs mer', 'Kolla in'],
    tips: [
      'Var direkt och snabb - ingen lång intro',
      'Använd talspråk, inte skriftspråk',
      'Hook inom första 2 sekunderna',
    ],
  },
  display: {
    name: 'Display/Banners',
    headline: { min: 15, max: 30, ideal: 20 },
    body: { min: 20, max: 50, ideal: 35 },
    cta: ['Läs mer', 'Kom igång', 'Se erbjudande'],
    tips: [
      'Extremt kort och kärnfullt',
      'Ett budskap per banner',
      'CTA ska synas tydligt',
    ],
  },
  linkedin: {
    name: 'LinkedIn',
    headline: { min: 30, max: 50, ideal: 40 },
    body: { min: 100, max: 200, ideal: 150 },
    cta: ['Läs mer', 'Kontakta oss', 'Se hur'],
    tips: [
      'Mer professionell ton',
      'Kan vara längre och mer detaljerad',
      'Fokus på värde och insikter',
    ],
  },
  email: {
    name: 'E-post',
    headline: { min: 30, max: 60, ideal: 45 },
    body: { min: 100, max: 300, ideal: 200 },
    cta: ['Läs mer', 'Kom igång', 'Boka tid', 'Se erbjudande'],
    tips: [
      'Ämnesrad är kritisk - max 50 tecken',
      'Personlig ton',
      'Tydlig CTA ovanför "the fold"',
    ],
  },
} as const;

// ----------------------------------------------------------------------------
// CAMPAIGN OBJECTIVES
// ----------------------------------------------------------------------------

export const CAMPAIGN_OBJECTIVES = {
  awareness: {
    name: 'Kännedom',
    description: 'Bygg varumärkeskännedom',
    toneAdjustment: 'Fokusera på Nordeas värderingar och vad vi står för. Mindre produktfokus, mer emotionellt.',
  },
  consideration: {
    name: 'Övervägande',
    description: 'Få målgruppen att överväga Nordea',
    toneAdjustment: 'Balans mellan emotionellt och rationellt. Lyft unika fördelar utan att vara säljig.',
  },
  conversion: {
    name: 'Konvertering',
    description: 'Driva konkreta handlingar',
    toneAdjustment: 'Tydlig CTA, konkreta erbjudanden. Fortfarande on-brand men mer handlingsorienterad.',
  },
  retention: {
    name: 'Lojalitet',
    description: 'Behåll och utveckla befintliga kunder',
    toneAdjustment: 'Varm och personlig ton. Visa uppskattning, erbjud mervärde.',
  },
} as const;

// ----------------------------------------------------------------------------
// DISPLAY-ANNONSFORMAT & SAFE ZONES
// Källa: officiella Nordea display-specs (billboard / half page / MREC)
// ----------------------------------------------------------------------------

export const NORDEA_AD_FORMATS = {
  billboard: {
    name: 'Billboard',
    width: 980,
    height: 240,
    usage: 'Bred banner, topp på sida',
    padding: { top: 0, right: 40, bottom: 0, left: 40 },
    logo: {
      font: 'Nordea Sans Small',
      weight: 'bold',
      size: 32,
      align: 'left',
    },
    layout: 'logo | textblock (flex:1, centrerad) | produktbild (höger)',
  },
  halfPage: {
    name: 'Half Page',
    width: 300,
    height: 600,
    usage: 'Vertikal, sidopanel',
    padding: { top: 24, right: 24, bottom: 24, left: 24 },
  },
  mediumRectangle: {
    name: 'Medium Rectangle (MREC)',
    width: 300,
    height: 250,
    usage: 'Standardrektangel — vanligaste displayformatet',
    padding: { top: 18, right: 20, bottom: 16, left: 20 },
    logoRow: { height: 40, font: 'Nordea Sans Small', weight: 'bold' },
    iconContainer: { height: 42, iconSize: 38, align: 'center' },
    headline: { font: 'Nordea Sans Large', weight: 'black', size: 20 },
    subtext: { font: 'Nordea Sans Small', weight: 'light', size: 11, marginTop: 7 },
    textBlockPadding: { y: 10, x: 0 },
  },
} as const;

// ----------------------------------------------------------------------------
// CTA-KNAPPAR (pill)
// ----------------------------------------------------------------------------

export const NORDEA_CTA = {
  background: NORDEA_COLORS.accent.green.hex, // #40BFA3
  color: '#FFFFFF',
  borderRadius: 20, // pill-form
  fontFamily: 'Nordea Sans Small',
  fontWeight: 500, // Medium
  textTransform: 'uppercase' as const,
  letterSpacing: '0.07em',
  // Skalning per format
  sizes: {
    mrec:     { fontSize: 8,  paddingY: 6,  paddingX: 14 }, // 300x250
    halfPage: { fontSize: 10, paddingY: 9,  paddingX: 20 }, // 300x600
    billboard:{ fontSize: 11, paddingY: 11, paddingX: 26 }, // 980x240
  },
} as const;

// ----------------------------------------------------------------------------
// IKONSTIL för display-annonser
// ----------------------------------------------------------------------------

export const NORDEA_ICON_STYLE = {
  stroke: 'rgba(255,255,255,0.4)',
  fill: 'rgba(255,255,255,0.12)',
  strokeWidth: 1.4,
  // För aktiva element / checkmarks:
  activeStroke: '#FFFFFF',
  activeStrokeWidth: 2,
  shape: 'outline', // inte solid
} as const;

// ----------------------------------------------------------------------------
// TYPOGRAFI — detaljerad per snitt (display-annonser)
// ----------------------------------------------------------------------------

export const NORDEA_FONT_FAMILIES = {
  large: {
    cssFamily: "'Nordea Sans Large', 'Nordea Sans', sans-serif",
    usage: 'Headlines och stora rubriker',
    weights: {
      black:   { css: 900, usage: 'Primära headlines i display-annonser' },
      bold:    { css: 700, usage: 'Sekundära rubriker' },
      medium:  { css: 500, usage: 'Mellanrubriker' },
      regular: { css: 400, usage: 'Löptext i stora format' },
      light:   { css: 300, usage: 'Ingress i stora format' },
    },
  },
  small: {
    cssFamily: "'Nordea Sans Small', 'Nordea Sans', sans-serif",
    usage: 'Brödtext, UI-element, knappar, logotyp',
    weights: {
      bold:    { css: 700, usage: 'Logotyp "Nordea", navigationstext' },
      medium:  { css: 500, usage: 'CTA-knappar, etiketter' },
      regular: { css: 400, usage: 'Brödtext, subtext' },
      light:   { css: 300, usage: 'Diskret text, fotnoter' },
    },
  },
} as const;

// ----------------------------------------------------------------------------
// AD-COPY TONALITET (strikt — gäller all display & video ad-text)
// ----------------------------------------------------------------------------

export const NORDEA_AD_COPY_RULES = {
  forbidden: [
    {
      term: 'kort',
      replaceWith: 'kreditkort',
      reason: 'Nordea skriver alltid ut "kreditkort" i annonstext — aldrig förkortningen "kort".',
    },
    {
      term: 'fixar',
      replaceWith: 'ersätter / ingår',
      reason: 'Nordea lovar ersättning, inte en operativ lösning. Skriv aldrig att Nordea "fixar" något.',
    },
    {
      term: 'Ansök nu',
      replaceWith: 'Se dina förmåner / Kolla dina kortförmåner',
      reason: 'Mjuk CTA föredras — Nordeas tonalitet är lugn och rådgivande, inte pushig.',
    },
  ],
  preferred: {
    questionFormat: {
      description: 'Frågeformat funkar bra för problemrubriker',
      example: '"Försenat flyg?" → "Ersättningen ingår."',
    },
    softCTAs: ['Se dina förmåner', 'Kolla dina kortförmåner', 'Läs mer'],
  },
  principle: 'Med måtta — inte för pushiga säljbudskap. Nordeas tonalitet är lugn och rådgivande.',
} as const;

// ----------------------------------------------------------------------------
// FÄRG-ALIAS för display-kontext
// (pink.medium används i guidelines, men heter "Peach" i ad-specen)
// ----------------------------------------------------------------------------

export const NORDEA_DISPLAY_PALETTE = {
  primaryBg: NORDEA_COLORS.primary.blue.hex,          // #0000A0
  secondaryBg: NORDEA_COLORS.pink.medium.hex,         // #FBD9CA (aka "Nordea Peach")
  ctaGreen: NORDEA_COLORS.accent.green.hex,           // #40BFA3
  textOnBlue: '#FFFFFF',
  textOnBlueSecondary: 'rgba(255,255,255,0.65)',
  textOnBluePlaceholder: 'rgba(255,255,255,0.50)',
  textOnPeach: NORDEA_COLORS.primary.blue.hex,        // alltid blå text på peach
} as const;

// ----------------------------------------------------------------------------
// EXPORT FÖR ANVÄNDNING I API:er
// ----------------------------------------------------------------------------

export const getBrandContext = () => NORDEA_SYSTEM_PROMPT;

export const getComplianceRules = (productType: 'loans' | 'investments' | 'insurance' | 'general') => {
  return NORDEA_COMPLIANCE[productType] || NORDEA_COMPLIANCE.general;
};

export const getToneOfVoiceChecklist = (keyword: 'personliga' | 'experter' | 'ansvarsfulla') => {
  return NORDEA_TONE_OF_VOICE.principles[keyword];
};
