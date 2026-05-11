# Nordea Sans Fonts

The Nordea Sans family is the primary typeface for CreativeIQ. Two
sub-families ship in this directory:

```
nordea-sans-large/    — display weights for headlines
nordea-sans-small/    — UI / body / button weights (also serves as default)
```

Each sub-family ships in `.woff2`, `.woff`, and `.ttf` for browser, legacy,
and tooling needs. All nine weights from Light (300) to Black (900) plus
italics are present.

The CSS `@font-face` declarations live in [`app/globals.css`](../../app/globals.css)
and the Tailwind v4 `@theme` exposes them as:

- `font-sans` → "Nordea Sans" (alias for Small) → falls back to Inter
- `font-display` → "Nordea Sans Large" → falls back to Inter

Inter is loaded as a final fallback so any environment without these files
(misconfigured CDN, missing volume mount) still renders correctly with a
Latin-default sans.
