# CLAUDE.md - Nordea CreativeIQ Project

> **VIKTIGT:** Läs hela denna fil och NORDEA-CREATIVEIQ-SPEC.md innan du börjar bygga.

## 🎯 Vad är detta?

Nordea CreativeIQ är en **intern AI-driven plattform** för Nordeas marknadsföringsteam. Det är INTE ett externt kundverktyg – det är för Nordeas egna anställda att:

1. Analysera och kvalitetssäkra annonser innan publicering
2. Generera on-brand copy med Nordeas Tone of Voice
3. Testa material med simulerade kundpersonas
4. Planera kampanjbudgetar med prognoser
5. Lokalisera innehåll för nordiska marknader (SE, DK, NO, FI, EE, LT)

## 📋 Huvudspecifikation

Se `NORDEA-CREATIVEIQ-SPEC.md` för komplett dokumentation med:
- Nordeas officiella färgpalett och design system
- Databas-schema med SQL
- Alla komponenter och API:er
- AI-prompts med Nordeas Tone of Voice
- Default personas (Nordea privatkunder)

## 🏦 Nordea Branding - KRITISKT

### Färger
```css
--nordea-blue: #0000A0;      /* Huvudfärg - använd överallt */
--nordea-blue-dark: #000080; /* Hover states */
```

### Font
- **Nordea Sans** är officiella fonten
- Fontfiler kommer läggas i `/public/fonts/` av användaren
- **Fallback:** Om fontfilerna inte finns, använd `Inter` från Google Fonts
- Sätt upp font-loading som hanterar båda fallen

### Logotyp
- SVG-logotyp kommer läggas i `/public/images/nordea-logo.svg`
- **Fallback:** Om filen inte finns, använd en placeholder med texten "Nordea" och en N-ikon

## 👥 Default Personas

Dessa 4 personas ska seedas i databasen (se spec för fullständig data):

1. **Ung Förstagångsköpare** 🏠
   - 25-35 år, digital native, vill köpa första bostaden
   - Skeptisk, researchar mycket, vill ha transparens

2. **Spararen** 💰
   - 30-50 år, vill få pengarna att växa
   - Jämför alternativ, orolig för avgifter

3. **Familjeföräldern** 👨‍👩‍👧‍👦
   - 32-45 år, småbarnsförälder
   - Tidspressad, vill ha enkla lösningar

4. **Pensionsspararen** 🌅
   - 55-67 år, närmar sig pension
   - Trygghetsfokuserad, föredrar personlig kontakt

## 🏃 Arbetssätt

### Autonomt byggande
Bygg hela projektet självständigt. Följ specifikationen och fatta rimliga beslut för detaljer som inte är specificerade.

### Prioriteringar
1. **Funktion först** - Få allt att fungera, polish sedan
2. **Nordea-branding** - Färger och stil ska vara rätt från start
3. **TypeScript strikt** - Inga `any` utan bra anledning
4. **Personas fungerar** - Virtual Focus Group är en nyckelfeature

### Om API-nycklar saknas
Om OpenAI/Anthropic API-nyckel inte finns i env:
- Bygg UI:t komplett
- Mocka AI-responser med realistisk dummy-data
- Logga tydligt att API-nyckel saknas

## 📁 Viktiga filer att skapa

```
/app/(auth)/login/page.tsx      - Nordea-branded login
/app/(dashboard)/layout.tsx     - Sidebar + header layout
/app/(dashboard)/ad-studio/     - Annonsanalys med heatmap + focus group
/app/(dashboard)/copy-studio/   - AI copy-generering
/app/(dashboard)/campaign-planner/ - Budget + prognoser
/lib/ai/prompts/               - Alla AI-prompts med Nordea ToV
/lib/constants/personas.ts     - Default persona-data
```

## ⚠️ Viktigt

1. **@nordea.com-validering** - Login ska ENDAST tillåta Nordea-mailadresser
2. **Swedish as default** - UI-språk är svenska, men texten i prompts ska kunna hantera alla nordiska marknader
3. **Heatmap** - Eye-tracking simulation är viktig feature i Ad Studio
4. **Persona Chat** - Måste kännas som att prata med en riktig person

## 🚀 När du är klar

1. Verifiera att alla sidor fungerar
2. Kör `npm run build` utan fel  
3. Testa login med `test@nordea.com`
4. Testa Virtual Focus Group med alla 4 personas
5. Skriv en sammanfattning av vad som byggts

---

**Börja med: `npx create-next-app@latest nordea-creative-iq --typescript --tailwind --app`**

**Bygg sedan autonomt tills allt är klart!** 🚀
