// ============================================================================
// PRODUCT DETECTION & PERSONA RELEVANCE
// Detekterar produktkategori från annonstext och matchar relevanta personas
// ============================================================================

export type ProductCategory =
  | 'mortgage'
  | 'savings'
  | 'loans'
  | 'pension'
  | 'insurance'
  | 'cards'
  | 'business'
  | 'general';

export interface ProductMatch {
  category: ProductCategory;
  confidence: number; // 0-100
  matchedKeywords: string[];
}

// ---------------------------------------------------------------------------
// Keyword mappings (Swedish)
// ---------------------------------------------------------------------------

const PRODUCT_KEYWORDS: Record<ProductCategory, string[]> = {
  mortgage: [
    'bolån', 'bostad', 'bostadslån', 'boende', 'hus', 'lägenhet',
    'kontantinsats', 'amortering', 'ränta', 'bostadsrätt', 'villa',
    'första bostad', 'flytta', 'köpa bostad', 'bostadsmarknad',
    'bolåneränta', 'bostadspris', 'handpenning', 'bottenlån',
    'topplån', 'räntebindning',
  ],
  savings: [
    'spara', 'sparande', 'sparkonto', 'fond', 'fonder', 'ISK',
    'investering', 'avkastning', 'ränta på sparande', 'månadsspar',
    'buffert', 'kapital', 'indexfond', 'aktie', 'aktier',
    'placering', 'barnspar', 'barnspara', 'sparmål',
  ],
  loans: [
    'privatlån', 'billån', 'lån', 'kredit', 'kreditkort',
    'billån', 'låna', 'konsumtionslån', 'samla lån',
    'räntefritt', 'effektiv ränta', 'blancolån',
  ],
  pension: [
    'pension', 'pensionsspar', 'pensionsspara', 'tjänstepension',
    'privat pension', 'pensionsålder', 'gå i pension', 'IPS',
    'pensionsförsäkring', 'ålderspension', 'pensionsplan',
    'pensionsprognos',
  ],
  insurance: [
    'försäkring', 'hemförsäkring', 'bilförsäkring', 'livförsäkring',
    'sjukförsäkring', 'olycksfallsförsäkring', 'reseförsäkring',
    'barnförsäkring', 'trygghet', 'skydd', 'trygghetspaket',
  ],
  cards: [
    'kort', 'kreditkort', 'bankkort', 'betalkort', 'mastercard',
    'visa', 'kontaktlös', 'swish', 'apple pay', 'google pay',
    'kortbetalning',
  ],
  business: [
    'företag', 'företagslån', 'företagskonto', 'faktura',
    'företagsförsäkring', 'affär', 'egenföretagare', 'startup',
    'verksamhet',
  ],
  general: [],
};

// ---------------------------------------------------------------------------
// Persona ↔ Product relevance
// ---------------------------------------------------------------------------

export const PERSONA_PRODUCT_RELEVANCE: Record<string, ProductCategory[]> = {
  'Ung Förstagångsköpare': ['mortgage', 'savings', 'loans'],
  'Spararen': ['savings', 'pension', 'insurance'],
  'Familjeföräldern': ['mortgage', 'savings', 'insurance', 'loans'],
  'Pensionsspararen': ['pension', 'savings', 'insurance'],
};

// ---------------------------------------------------------------------------
// Swedish display labels for product categories
// ---------------------------------------------------------------------------

export const PRODUCT_LABELS: Record<ProductCategory, string> = {
  mortgage: 'Bolån & Bostad',
  savings: 'Sparande & Fonder',
  loans: 'Lån & Kredit',
  pension: 'Pension',
  insurance: 'Försäkring',
  cards: 'Kort & Betalningar',
  business: 'Företag',
  general: 'Generellt',
};

// ---------------------------------------------------------------------------
// Detection function
// ---------------------------------------------------------------------------

export function detectProductFromText(
  headline: string,
  body: string,
  cta: string
): ProductMatch {
  const text = `${headline} ${body} ${cta}`.toLowerCase();
  const scores: Record<ProductCategory, { count: number; keywords: string[] }> = {
    mortgage: { count: 0, keywords: [] },
    savings: { count: 0, keywords: [] },
    loans: { count: 0, keywords: [] },
    pension: { count: 0, keywords: [] },
    insurance: { count: 0, keywords: [] },
    cards: { count: 0, keywords: [] },
    business: { count: 0, keywords: [] },
    general: { count: 0, keywords: [] },
  };

  for (const [category, keywords] of Object.entries(PRODUCT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        scores[category as ProductCategory].count++;
        scores[category as ProductCategory].keywords.push(keyword);
      }
    }
  }

  // Find best matching category
  let bestCategory: ProductCategory = 'general';
  let bestScore = 0;

  for (const [category, data] of Object.entries(scores)) {
    if (data.count > bestScore) {
      bestScore = data.count;
      bestCategory = category as ProductCategory;
    }
  }

  // Calculate confidence: more matched keywords = higher confidence
  const confidence =
    bestScore === 0
      ? 0
      : Math.min(100, Math.round((bestScore / 3) * 100));

  return {
    category: bestCategory,
    confidence,
    matchedKeywords: scores[bestCategory].keywords,
  };
}

// ---------------------------------------------------------------------------
// Get relevant personas for a product category
// ---------------------------------------------------------------------------

interface PersonaWithRelevance {
  name: string;
  isRelevant: boolean;
  relevanceReason?: string;
}

export function getRelevantPersonas(
  category: ProductCategory,
  personaNames: string[]
): PersonaWithRelevance[] {
  return personaNames.map((name) => {
    const relevantCategories = PERSONA_PRODUCT_RELEVANCE[name] || [];
    const isRelevant = category === 'general' || relevantCategories.includes(category);
    return {
      name,
      isRelevant,
      relevanceReason: isRelevant
        ? `Intresserad av ${PRODUCT_LABELS[category]}`
        : undefined,
    };
  });
}
