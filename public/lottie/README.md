# Lottie Animations

Drop `.json`-filer här för Motion Studios Lottie-scen.

## Så här lägger du till en animation

1. Gå till [lottiefiles.com](https://lottiefiles.com) eller [lordicon.com](https://lordicon.com)
2. Ladda ner animationen som `.json` (Lottie-format)
3. Döp om filen till det `id` som finns i [lib/remotion/lottie-library.ts](../../lib/remotion/lottie-library.ts), t.ex. `money-growth.json`
4. Lägg filen i den här mappen

Registret i `lottie-library.ts` mappar varje `id` till `/lottie/<id>.json`. Tills du lagt in filerna kommer scenen visa en snäll fallback (🎬-ikon + "Animation saknas").

## Registrerade ids

Se [lib/remotion/lottie-library.ts](../../lib/remotion/lottie-library.ts) för full lista. Samlade ids just nu:

- `money-growth`, `coin-stack`, `piggy-bank`, `chart-rising`
- `credit-card`, `mobile-banking`, `secure-lock`
- `house-keys`, `calculator`
- `handshake`, `customer-service`
- `checkmark`, `celebration`, `arrow-forward`

## Tips för Nordea-anpassning

- Välj animationer med **ljusa/vita element** — de syns bäst mot Nordea-blått (#0000A0)
- Undvik animationer med bakgrundsfärger som inte går ihop med brand
- Prefer **loopbara** animationer (2-4 sek) — de återanvänds i korta scen-klipp
- För custom brand-färger: öppna JSON-filen och ersätt hex-koder med Nordeas palett:
  - Nordea Blue: `#0000A0`
  - Teal accent: `#40BFA3`
  - Vit: `#FFFFFF`
