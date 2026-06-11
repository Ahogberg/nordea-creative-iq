// Sprint 11A: Nordea Brand Library — officiella illustrations + ikoner.
//
// TODO: Integrera mot Nordeas DAM när tillgång ges. Strukturen är klar
// för:
//  - Riktig API-integration mot Nordea DAM
//  - Lokala SVG-filer i /public/brand/library/ (current mock)
//  - Supabase storage bucket
//
// För att byta källa: ersätt MOCK_BRAND_ASSETS-arrayen och behåll
// fetchBrandAssets-signaturen.

export type BrandAssetType = "illustration" | "icon" | "pattern" | "logo_variant";

export interface BrandAsset {
  id: string;
  type: BrandAssetType;
  name: string;
  category: string;
  url: string;
  thumbnail_url: string;
  width?: number;
  height?: number;
  tags: string[];
}

export const BRAND_CATEGORY_FILTERS: Array<{
  id: "all" | BrandAssetType;
  label: string;
}> = [
  { id: "all", label: "Alla" },
  { id: "illustration", label: "Illustrations" },
  { id: "icon", label: "Ikoner" },
  { id: "pattern", label: "Mönster" },
];

const MOCK_BRAND_ASSETS: BrandAsset[] = [
  {
    id: "icon-house",
    type: "icon",
    name: "Hus",
    category: "mortgage",
    url: "/brand/library/icons/house.svg",
    thumbnail_url: "/brand/library/icons/house.svg",
    width: 64,
    height: 64,
    tags: ["bolån", "hem", "fastighet", "bostad"],
  },
  {
    id: "icon-shield",
    type: "icon",
    name: "Sköld",
    category: "security",
    url: "/brand/library/icons/shield.svg",
    thumbnail_url: "/brand/library/icons/shield.svg",
    width: 64,
    height: 64,
    tags: ["trygghet", "försäkring", "skydd"],
  },
  {
    id: "icon-piggy",
    type: "icon",
    name: "Spargris",
    category: "savings",
    url: "/brand/library/icons/piggy.svg",
    thumbnail_url: "/brand/library/icons/piggy.svg",
    width: 64,
    height: 64,
    tags: ["sparande", "pengar", "sparkonto"],
  },
  {
    id: "icon-coin",
    type: "icon",
    name: "Mynt",
    category: "money",
    url: "/brand/library/icons/coin.svg",
    thumbnail_url: "/brand/library/icons/coin.svg",
    width: 64,
    height: 64,
    tags: ["pengar", "ekonomi", "valuta"],
  },
  {
    id: "icon-card",
    type: "icon",
    name: "Kreditkort",
    category: "cards",
    url: "/brand/library/icons/card.svg",
    thumbnail_url: "/brand/library/icons/card.svg",
    width: 64,
    height: 64,
    tags: ["kreditkort", "betalning", "kort"],
  },
  {
    id: "icon-chart",
    type: "icon",
    name: "Graf",
    category: "investments",
    url: "/brand/library/icons/chart.svg",
    thumbnail_url: "/brand/library/icons/chart.svg",
    width: 64,
    height: 64,
    tags: ["investering", "fonder", "tillväxt"],
  },
  {
    id: "illu-family-home",
    type: "illustration",
    name: "Familj framför hem",
    category: "lifestyle",
    url: "/brand/library/illustrations/family-home.svg",
    thumbnail_url: "/brand/library/illustrations/family-home.svg",
    width: 400,
    height: 300,
    tags: ["familj", "hem", "lifestyle", "föräldraskap"],
  },
  {
    id: "illu-skyline",
    type: "illustration",
    name: "Nordic skyline",
    category: "place",
    url: "/brand/library/illustrations/skyline.svg",
    thumbnail_url: "/brand/library/illustrations/skyline.svg",
    width: 400,
    height: 200,
    tags: ["stad", "norden", "stockholm", "skyline"],
  },
  {
    id: "pattern-grid",
    type: "pattern",
    name: "Rutmönster",
    category: "geometric",
    url: "/brand/library/patterns/grid.svg",
    thumbnail_url: "/brand/library/patterns/grid.svg",
    width: 200,
    height: 200,
    tags: ["mönster", "grid", "geometri"],
  },
];

export async function fetchBrandAssets(options?: {
  category?: "all" | BrandAssetType;
  query?: string;
  limit?: number;
}): Promise<BrandAsset[]> {
  let results = [...MOCK_BRAND_ASSETS];

  if (options?.category && options.category !== "all") {
    results = results.filter((a) => a.type === options.category);
  }

  if (options?.query) {
    const q = options.query.toLowerCase();
    results = results.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (options?.limit) {
    results = results.slice(0, options.limit);
  }

  return results;
}

export async function getBrandCategoryCounts(): Promise<
  Record<string, number>
> {
  const counts: Record<string, number> = {
    all: MOCK_BRAND_ASSETS.length,
    illustration: 0,
    icon: 0,
    pattern: 0,
    logo_variant: 0,
  };
  for (const asset of MOCK_BRAND_ASSETS) {
    counts[asset.type] = (counts[asset.type] || 0) + 1;
  }
  return counts;
}
