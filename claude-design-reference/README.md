# Claude Design Reference

Original JSX mockups from Claude Design (May 2026) used as visual spec for
**Sprint 7 — Design Alignment**. These files are *not* compiled or imported
by the Next.js app — they're paste-as-is artefacts so future iterations
can compare implementation against the source design.

The JSX uses local helper components (`Sidebar`, `Topbar`, `Button`,
`Card`, `Badge`, `FormatChip`, `Icon`, `IconButton`, `StatCard`, `Avatar`,
`Wordmark`, `Logo`, `Progress`, `Tabs`, `Checkbox`, `Radio`, `Toggle`,
`Slider`, `Input`, `SectionTitle`, `Stat`) that exist in the design tool's
own runtime — they're referenced here for layout structure, not direct
reuse. Sprint 7 translates each design into Next.js + Tailwind components
using the shared primitives in `components/layout/` and `components/ui/`.

## Files

| File              | Maps to                                                       |
|-------------------|---------------------------------------------------------------|
| `dashboard.jsx`   | `app/(dashboard)/dashboard/page.tsx`                          |
| `editor.jsx`      | `app/(dashboard)/create/video/page.tsx` (existing Motion Studio kept) |
| `templates.jsx`   | `app/(dashboard)/templates/page.tsx`                          |
| `produce.jsx`     | `app/(dashboard)/produce/page.tsx`                            |
| `qa.jsx`          | `app/(dashboard)/qa/page.tsx`                                 |
| `dam.jsx`         | `app/(dashboard)/dam/page.tsx` (stub — full impl Sprint 8)    |
| `uikit.jsx`       | components/ui/* + components/layout/* (split across files)    |

## Color mapping (design → Nordea)

| Design token         | Nordea token                |
|----------------------|-----------------------------|
| deep cobalt `#07091F`| `--nordea-bg` `#F7F8FA` (inverted to light) |
| `#4D6BFF` primary    | `--nordea-blue` `#0000A0`   |
| `#34D6B0` teal       | `--nordea-teal` `#40BFA3`   |
| `#E5B25C` amber      | `--nordea-amber` `#C49327`  |
| `#E5675C` rose       | `--nordea-rose` `#C8575C`   |
| `#1FA084` success    | `--nordea-green` `#1FA084`  |

## Theme inversion note

The design originals are dark-themed (deep cobalt background). The Nordea
implementation flips this to a **light theme** with Nordea Deep
(`#00005E`) as the primary text color and Nordea Teal as the CTA accent.
The `.nordea-dark` scope class (defined in `app/globals.css`) preserves
the design's dark surfaces for opt-in modal/overlay use — Save Template,
QA Modal, render progress.
