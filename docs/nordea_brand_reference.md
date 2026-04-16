# Nordea — Brand & Design Reference

## Färger

| Namn | Hex | Användning |
|------|-----|------------|
| Nordea Blue | `#0000A0` | Primär bakgrundsfärg, all display-annonsering |
| Nordea Peach | `#FBD9CA` | Sekundär bakgrundsfärg. Text och logotyp i Nordea Blue (#0000A0) |
| Nordea Teal / CTA | `#40BFA3` | CTA-knappar i display och video |
| Vit | `#FFFFFF` | Primär textfärg på blå bakgrund |
| Vit 65% | `rgba(255,255,255,0.65)` | Subtext, sekundär text |
| Vit 50% | `rgba(255,255,255,0.50)` | Placeholder-text, diskret info |

---

## Typsnitt

Nordea använder två egna typsnitt — **NordeaSansLarge** för rubriker och **NordeaSansSmall** för brödtext och UI.

### NordeaSansLarge
Används för stora rubriker och headlines i annonser.

| Snitt | Användning |
|-------|------------|
| Black | Primära headlines i display-annonser |
| Bold | Sekundära rubriker |
| Medium | Mellanrubriker |
| Regular | Löptext i stora format |
| Light | Ingress i stora format |

### NordeaSansSmall
Används för brödtext, UI-element, knappar och logotyp.

| Snitt | Användning |
|-------|------------|
| Bold | Logotyp "Nordea", navigationstext |
| Medium | CTA-knappar, etiketter |
| Regular | Brödtext, subtext |
| Light | Diskret text, fotnoter |

### Fallback-typsnitt
`sans-serif` — används om Nordea-fonterna inte laddas.

---

## Display-annonsformat

| Format | Storlek | Användning |
|--------|---------|------------|
| Billboard | 980 × 240 px | Bred banner, topp på sida |
| Half Page | 300 × 600 px | Vertikal, sidopanel |
| Medium Rectangle | 300 × 250 px | Standardrektangel |

---

## Annonsuppbyggnad — standard MREC (300×250)

```
┌─────────────────────────┐
│         Nordea          │  ← Logo-rad, 40px, NordeaSansSmall-Bold
├─────────────────────────┤
│                         │
│         [ikon]          │  ← SVG-ikon, 38px, fixerad höjd 42px
│                         │
│       Rubriktext        │  ← NordeaSansLarge-Black, 20px
│       Rubriktext        │
│                         │
│      Subtext här        │  ← NordeaSansSmall-Light, 11px
│      subtext här        │
│                         │
│    [ CTA-KNAPP ]        │  ← #40BFA3, NordeaSansSmall-Medium, 8-9px
└─────────────────────────┘
```

**Padding:** `18px 20px 16px`
**Ikoncontainer:** `height: 42px`, centrerad
**Textblock padding:** `10px 0`
**Gap headline → subtext:** `7px margin-top`

---

## Annonsuppbyggnad — Billboard (980×240)

```
┌──────────┬──────────────────────────┬──────────────┐
│          │    Rubriktext            │              │
│  Nordea  │    Subtext subtext       │  [kortbild]  │
│          │    [ CTA-KNAPP ]         │  placeholder │
└──────────┴──────────────────────────┴──────────────┘
```

- **Logo:** NordeaSansSmall-Bold, 32px, vänsterjusterad
- **Textblock:** centrerat, `flex:1`
- **Kortbild:** placeholder höger, ersätts med produktfoto
- **Padding:** `0 40px`

---

## CTA-knappar

```css
background: #40BFA3;
color: #fff;
border-radius: 20px;         /* pill-form */
font-family: NordeaSansSmall-Medium;
font-size: 8–11px;           /* beroende på format */
padding: 6–11px 14–26px;     /* beroende på format */
text-transform: uppercase;
letter-spacing: 0.07em;
```

---

## Ikonstilar

Alla ikoner i display-annonser är **outline/linjikoner** med:
- `stroke: rgba(255,255,255,0.4)` på kontur
- `fill: rgba(255,255,255,0.12)` på yta
- `stroke-width: 1.4`
- Checkmarks/aktiva element: `stroke: white`, `stroke-width: 2`

### Ikoner per annons
| Annons | Ikon | Beskrivning |
|--------|------|-------------|
| Innan du bokar | Sköld med bock | Trygghet/skydd |
| Försenat flyg | Flygplan (roterat -30°) | Flyg/resa |
| Försenat bagage | Resväska med bock | Bagage |
| Det oväntade | Klocka | Händer när du minst anar det |

---

## Tonalitet & copy

- **Aldrig "kort"** — skriv alltid "kreditkort" i annonstext
- **Aldrig "fixar"** — lovar ersättning, inte operativ lösning
- **Frågeformat** funkar bra för problemrubriker: "Försenat flyg?" → "Ersättningen ingår."
- **Mjuk CTA** — "Se dina förmåner", "Kolla dina kortförmåner" — inte "Ansök nu"
- **Med måtta** — inte för pushiga säljbudskap, Nordeas tonalitet är lugn och rådgivande

---

## Fontfiler

Fontfiler finns uppladdade i projektet:
- `Nordea_Sans_Large_Web.zip` — NordeaSansLarge (alla snitt)
- `Nordea_Sans_Small_Web.zip` — NordeaSansSmall (alla snitt)

Format: `.woff2`, `.woff`, `.ttf`, `.eot`
Bädda in som base64 i HTML för självständiga filer utan externa beroenden.
