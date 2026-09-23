// Exempelannonser som riktiga VideoConfigs. Används av dashboarden (och andra
// tomma lägen) så att plattformen visar renderade annonser i stället för
// grå platshållare. Byts mot riktiga projekt när projekttabellen finns.

import { DEFAULT_MOTION_CONFIG, type VideoConfig } from "@/lib/remotion/types";

const calm = {
  ...DEFAULT_MOTION_CONFIG,
  logo: { reveal: "fade" as const, duration: 18 },
  cta: { reveal: "slide-up" as const, spring: "gentle" as const },
};

const energetic = {
  ...DEFAULT_MOTION_CONFIG,
  text: { stagger: "word" as const, delayBetween: 2, useSpring: true },
  cta: { reveal: "spring" as const, spring: "snappy" as const },
  transitions: { style: "slide" as const, duration: 10 },
};

function total(scenes: VideoConfig["scenes"]): number {
  return scenes.reduce((s, sc) => s + sc.durationSeconds, 0);
}

function make(config: Omit<VideoConfig, "totalDurationSeconds" | "showLogo">): VideoConfig {
  return { ...config, showLogo: true, totalDurationSeconds: total(config.scenes) };
}

export interface SampleCreative {
  id: string;
  name: string;
  product: string;
  status: "Utkast" | "Producerar" | "Under granskning" | "Godkänd";
  tone: "neutral" | "cobalt" | "amber" | "green";
  score: number | null;
  updated: string;
  formats: string[];
  config: VideoConfig;
}

export const SAMPLE_CREATIVES: SampleCreative[] = [
  {
    id: "bolan-q2",
    name: "Bolån — Q2-lansering · hjältefilm",
    product: "Bolån",
    status: "Under granskning",
    tone: "amber",
    score: 87,
    updated: "2h sedan",
    formats: ["9:16", "16:9", "1:1"],
    config: make({
      id: "sample-bolan",
      title: "Bolån Q2",
      format: "story",
      backgroundColor: "#0000A0",
      accentColor: "#40BFA3",
      motion: calm,
      scenes: [
        { type: "title", durationSeconds: 2.5, headline: "Drömhuset väntar", subtitle: "Räkna på ditt bolån idag" },
        { type: "counter", durationSeconds: 3, label: "KONTANTINSATS FRÅN", fromValue: 0, toValue: 15, suffix: " %" },
        { type: "cta", durationSeconds: 2.5, headline: "Vi finns här — innan, under och efter", buttonText: "RÄKNA PÅ BOLÅN" },
      ],
    }),
  },
  {
    id: "spara-pension",
    name: "Pension — det är aldrig för sent",
    product: "Pension",
    status: "Godkänd",
    tone: "green",
    score: 94,
    updated: "Igår",
    formats: ["4:5", "1:1"],
    config: make({
      id: "sample-pension",
      title: "Pension",
      format: "vertical",
      backgroundColor: "#0000A0",
      accentColor: "#40BFA3",
      motion: calm,
      scenes: [
        { type: "title", durationSeconds: 2.5, headline: "Det är aldrig för sent att börja", alignment: "left" },
        { type: "highlight-number", durationSeconds: 2.5, number: "30 min", label: "med en rådgivare", description: "Se hur långt din pension räcker" },
        { type: "cta", durationSeconds: 2.5, headline: "Boka ett möte", buttonText: "BOKA TID" },
      ],
    }),
  },
  {
    id: "kort-resa",
    name: "Kreditkort — innan du bokar resan",
    product: "Kort",
    status: "Producerar",
    tone: "cobalt",
    score: null,
    updated: "2 dagar sedan",
    formats: ["1:1", "9:16"],
    config: make({
      id: "sample-kort",
      title: "Kreditkort resa",
      format: "feed",
      backgroundColor: "#FFFFFF",
      accentColor: "#40BFA3",
      motion: energetic,
      scenes: [
        { type: "title", durationSeconds: 2.5, headline: "Innan du bokar — kolla kortförmånerna" },
        { type: "text-reveal", durationSeconds: 3, lines: ["Avbeställningsskydd", "Försenat bagage", "Sjukvård utomlands"], highlight: "Försenat bagage" },
        { type: "cta", durationSeconds: 2.5, headline: "Ingår i vissa Nordea-kreditkort", buttonText: "SE FÖRMÅNERNA" },
      ],
    }),
  },
  {
    id: "isk-spara",
    name: "Spara & investera — månadsspar",
    product: "Sparande",
    status: "Godkänd",
    tone: "green",
    score: 91,
    updated: "4 dagar sedan",
    formats: ["16:9", "1:1"],
    config: make({
      id: "sample-isk",
      title: "Månadsspar",
      format: "landscape",
      backgroundColor: "#0000A0",
      accentColor: "#40BFA3",
      motion: DEFAULT_MOTION_CONFIG,
      scenes: [
        { type: "title", durationSeconds: 2.5, headline: "Små belopp. Stor skillnad.", subtitle: "Månadsspara i fonder" },
        { type: "counter", durationSeconds: 3, label: "SPARA PER MÅNAD", fromValue: 0, toValue: 500, suffix: " kr" },
        { type: "cta", durationSeconds: 2.5, headline: "Kom igång på några minuter", buttonText: "BÖRJA SPARA", subtitle: "Historisk avkastning är ingen garanti för framtida avkastning." },
      ],
    }),
  },
  {
    id: "forsta-bostad",
    name: "Första bostaden — sociala klipp",
    product: "Bolån",
    status: "Utkast",
    tone: "neutral",
    score: null,
    updated: "1 vecka sedan",
    formats: ["9:16"],
    config: make({
      id: "sample-forsta",
      title: "Första bostaden",
      format: "story",
      backgroundColor: "#00005E",
      accentColor: "#40BFA3",
      motion: energetic,
      scenes: [
        { type: "title", durationSeconds: 2, headline: "Första bostaden?", subtitle: "Så funkar lånelöftet" },
        { type: "split", durationSeconds: 3, leftLabel: "Lånelöfte", leftValue: "Direkt", rightLabel: "Giltigt", rightValue: "6 mån" },
        { type: "cta", durationSeconds: 2.5, headline: "Ansök i appen", buttonText: "ANSÖK NU" },
      ],
    }),
  },
];
