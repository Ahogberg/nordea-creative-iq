// ── Renderarens förmågor — delat prompt-block för alla VideoConfig-flöden ──
//
// Skapa video, brief → kampanj, varianter och Motion Studio-chatten beskrev
// tidigare scentyperna var för sig och glömde nya fält. Det här blocket är
// den enda beskrivningen av vad renderaren kan; lägg till det med
// withMotionCapabilities() före withVisualGrammar().

import { formatLibraryForPrompt } from "./lottie-library";

const SCENE_CATALOG = `═══ SCENKATALOG (alla scentyper renderaren kan visa) ═══
Gemensamma valfria fält på alla scener: durationSeconds (krävs), background (hex eller "url(...)"), headlineColor (hex, rubrikfärg för just den scenen).

- "title": { headline, subtitle?, alignment?: "center"|"left", accentLine?: boolean } — rubrik + underrubrik. accentLine (kort turkos linje) är av som standard; Nordeas annonser har ingen.
- "canvas": fri komposition med egen TSX-kod — se ILLUSTRATIONER OCH FRI ANIMATION nedan. Fält: tsxCode, description, och för illustrationsscener: headline?, subtitle?, illustrationLayout?: "illustration-top"|"illustration-bottom", illustrationHeightPercent? (20–70, standard 48).
- "terms": { heading?, body } — villkor eller räkneexempel, centrerad liten text, heading i bold. Ordagrann juridisk text; hitta aldrig på räntor eller belopp.
- "text-reveal": { lines: string[], highlight? } — rader som tonar in en i taget. highlight gör hela raden turkos; använd hellre **fet** i raden.
- "counter": { label, fromValue, toValue, suffix?, prefix?, description? } — räknare.
- "highlight-number": { number, label, description?, accentColor? } — stort nummer.
- "bars": { title?, bars: [{ label, value, maxValue, color? }] } — stapeldiagram.
- "split": { leftLabel, leftValue, rightLabel, rightValue, vsText? } — jämförelse.
- "icon-grid": { title, items: [{ icon (emoji), label, value? }] } — ikonrutnät.
- "lottie": { animationId, headline?, caption?, sizePercent?, position?: "top"|"center"|"bottom", loop? } — färdig animation ur biblioteket nedan. Generisk stil; föredra canvas-illustrationer när Nordea-stil är viktig.
- "cta": { headline, buttonText, subtitle? } — turkos knapp. Nordeas annonser har ingen knapp: avsluta hellre med en "title" där subtitle är en URL (t.ex. "nordea.se/**betalarmband**") eller en mjuk uppmaning. Använd "cta" bara om användaren ber om en knapp.

Lottie-bibliotek (animationId):
${formatLibraryForPrompt()}`;

const TEXT_AND_COLOR = `═══ TEXT, FÄRG OCH JURIDIK ═══
FETSTIL I RUBRIKER: skriv **så här** runt nyckelordet i headline, subtitle, lines, caption och body. Då blir löptexten regular och det markerade bold — som i Nordeas annonser: "Spara **tid** eller spara **pengar?**", "Få **reseförsäkring** för familjen". Utan ** blir hela rubriken fet. Radbrytning med \\n.

RUBRIKFÄRG: VideoConfig.headlineColor (hex) gäller alla scener, scen.headlineColor en enskild scen. Persika "#FBD9CA" på Nordea-blått är Nordeas vanliga rubrikfärg; loggan och brödtexten förblir vita. Färgen ignoreras automatiskt på scener där kontrasten är för låg (t.ex. persika rubrik på persika bakgrund), så den kan sättas på hela videon.

JURIDIK (VideoConfig.legal):
- legal.riskNote: en rad längst ned genom hela filmen. Sparande och fonder: "Investeringar innebär en risk."
- legal.creditWarning: { fromSeconds? } — Konsumentverkets varning "Att låna kostar pengar! …" i ett vitt band nertill (texten läggs in automatiskt, skriv den inte själv). KRÄVS för konsumentkrediter: kreditkort, privatlån, samlingslån, billån. Inte för bolån — där räcker ett räkneexempel i en "terms"-scen.
- Scenerna hålls automatiskt ovanför bandet och riskraden.
- Villkor och räkneexempel läggs i en "terms"-scen sist, med text som användaren eller briefen har gett. Saknas siffror: skriv "[Villkor och räkneexempel läggs in här]" i body i stället för att hitta på.`;

const ILLUSTRATION = `═══ ILLUSTRATIONER OCH FRI ANIMATION (canvas) ═══
Canvas-scenen är fri: du skriver en React-komponent som ritar och animerar vad som helst i SVG/HTML — former, linjer, masker, morfningar, partiklar, text som avslöjas av en form. Tänk som en motion designer, inte som en mall.

Två lägen:
1) Illustrationsscen (vanligast): sätt headline (+ subtitle) och illustrationLayout. Scenen renderar rubriken med Nordeas typografi; din kod ritar BARA illustrationen i sin yta (width × height du får som props, höjd = illustrationHeightPercent av bilden). Rita INTE rubriken i koden.
   - "illustration-top": illustration i mitten, rubrik under (arketyp "illustration-mitt-rubrik-under")
   - "illustration-bottom": rubrik överst, illustration under (arketyp "rubrik-over-bild")
2) Helbild: utan headline ritar koden hela bilden (egen text, masker, övergångar).

SÄKER YTA (gäller alla scener): loggan ritas av renderaren överst i mitten och nedre delen av bilden hålls fri (plattformarnas gränssnitt, juridisk text). Mallscenerna och illustrationsytan håller sig automatiskt innanför. I helbild får du props.safe = { top, bottom } i px: all text och alla viktiga objekt — även under animation, t.ex. något som faller in eller glider förbi — ska ligga mellan y = safe.top och y = height - safe.bottom. Bara bakgrundsformer och färgytor får gå ut i kanterna. I illustrationsläget är safe = { top: 0, bottom: 0 } och allt som ritas utanför ytan klipps bort.

Kodregler:
- Definiera \`function Scene({ width, height, scale, safe }) { ... }\` och returnera en <AbsoluteFill>-rot. Inga import-satser, inga fetch/eval.
- Tid: const frame = useCurrentFrame(); 30 fps. Skala pixelmått med scale.
- I scope: React, AbsoluteFill, Sequence, Img, useCurrentFrame, useVideoConfig, interpolate, interpolateColors, spring, Easing, random, colors, fonts, RichText (<RichText text="Spara **tid**" style={{...}} />).
- Illustrationskit (valfritt att använda, fritt att kombinera med egen SVG):
  palette: blue #0000A0, deep #00005E, electric #0300ED, electricSoft #1A1AF0, mid #3D9BF5, sky #9ECAF9, pale #A5CEFC, mist #E5EFFB, white, peach #FBD9CA, peachLight #FCE4E0, peachDark #E8B9A5, roof #1A1A7A, shadow #00007A.
  iso(x, y, z, unit) → [px, py]: isometrisk projektion (30°). x snett ned åt höger, y snett ned åt vänster, z uppåt. Origo där du placerar <g transform>.
  SVG-komponenter (lägg i <svg>): <IsoBox x y z w d h unit colors?={{top,left,right}} />, <IsoFaceRect face="left|right|top" at a={[från,till]} b={[från,till]} unit fill /> (fönster/dörrar på en yta), <IsoRoof x y z w d rise unit />, <IsoCylinder x y z r h unit top side rim? />, <IsoShadow x y r unit />, <IsoHouse x y unit lit={0..1} />, <IsoCoin x y z unit />, <IsoCoinStack x y count unit />, <Disc cx cy r fill? />, <PillBars x y barWidth heights? fill? frame /> (Nordeas stapelmönster), <Sparkle cx cy r frame start? /> (pulserande strålkrans). BLUE_FACES och PEACH_FACES är färdiga toner för colors.
  Rörelse (returnerar värden): fall(frame, start, dur, distance) → {y, opacity}; slideIn(frame, start, dur, [dx, dy]) → {x, y, opacity}; slideAlongIso(frame, start, dur, [dx, dy, dz], unit) → {x, y, opacity}; grow(frame, start, dur) → {scale, opacity}; progress(frame, start, dur) → 0..1; loop(frame, period, start?) → 0..1 upprepat; bob(frame, amplitude, period?); drawOn(frame, start, dur, length) → strokeDashoffset; transformAt(x, y, scale?) → SVG-transform; ease.out / ease.inOut.

Nordea-stil för illustrationer (från de analyserade annonserna): isometrisk 30°, platta ytor med 2–3 blå toner per objekt, inga konturer, inga gradienter, persika som enda varma accent på det viktigaste objektet, mjuk mörkblå skugga, rundade enkla former, inga människor. Illustrationen står oftast färdig från start och EN liten rörelse bär berättelsen: ett mynt faller, en pil sjunker i en korg, fordon glider in längs axlarna, fönster tänds. Lugnt tempo, ease-out, ingen studs. Andra motiv (spargris, varukorg, flygplan, kort, pajdiagram …) bygger du själv av IsoBox/IsoCylinder/polygoner i samma stil — eller helt fritt i SVG om budskapet kräver det.

EXEMPEL — illustrationsscen (hus där mynt faller ner och fönstren tänds):
{ "type": "canvas", "durationSeconds": 3.5, "description": "Hus med fallande mynt", "headline": "Så här får du **råd att köpa bostad**", "illustrationLayout": "illustration-top", "tsxCode": "function Scene({ width, height, scale }) {\\n  const frame = useCurrentFrame();\\n  const u = Math.min(width, height * 1.4) / 9;\\n  const c1 = fall(frame, 30, 18, 260 * scale);\\n  const c2 = fall(frame, 52, 18, 260 * scale);\\n  const lit = progress(frame, 70, 20);\\n  return (\\n    <AbsoluteFill>\\n      <svg width={width} height={height}>\\n        <g transform={\`translate(\${width / 2} \${height * 0.62})\`}>\\n          <IsoShadow x={1} y={1} r={1.8} unit={u} />\\n          <IsoHouse x={0} y={0} unit={u} lit={lit} />\\n          <g transform={\`translate(0 \${c1.y})\`} opacity={c1.opacity}><IsoCoin x={3} y={0.6} unit={u} /></g>\\n          <g transform={\`translate(0 \${c2.y})\`} opacity={c2.opacity}><IsoCoin x={3} y={0.6} z={0.2} unit={u} /></g>\\n        </g>\\n      </svg>\\n    </AbsoluteFill>\\n  );\\n}" }

EXEMPEL — helbild där en persika pensel­strimma målar fram frågan (mask-reveal):
{ "type": "canvas", "durationSeconds": 3, "description": "Penseldrag avslöjar rubriken", "tsxCode": "function Scene({ width, height, scale }) {\\n  const frame = useCurrentFrame();\\n  const t = progress(frame, 6, 24, ease.inOut);\\n  const stroke = width * 1.4 * t;\\n  return (\\n    <AbsoluteFill>\\n      <svg width={width} height={height}>\\n        <defs><clipPath id=\\"paint\\"><rect x={-width * 0.2} y={height * 0.42} width={stroke} height={height * 0.16} rx={height * 0.08} transform={\`rotate(-8 \${width / 2} \${height / 2})\`} /></clipPath></defs>\\n        <rect x={-width * 0.2} y={height * 0.42} width={stroke} height={height * 0.16} rx={height * 0.08} fill={palette.peach} transform={\`rotate(-8 \${width / 2} \${height / 2})\`} />\\n        <g clipPath=\\"url(#paint)\\"><text x={width / 2} y={height / 2 + 24 * scale} textAnchor=\\"middle\\" fontFamily={fonts.headline} fontWeight={700} fontSize={72 * scale} fill={palette.blue}>Dags att renovera?</text></g>\\n      </svg>\\n    </AbsoluteFill>\\n  );\\n}" }`;

export const MOTION_CAPABILITIES_PROMPT = [SCENE_CATALOG, TEXT_AND_COLOR, ILLUSTRATION].join("\n\n");

/** Lägger till renderarens förmågor sist i en systemprompt. */
export function withMotionCapabilities(systemPrompt: string): string {
  return `${systemPrompt}\n\n${MOTION_CAPABILITIES_PROMPT}`;
}
