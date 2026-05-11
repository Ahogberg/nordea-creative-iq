# MCP Setup — Vercel, Supabase, GitHub

Tre MCP-servrar kopplas in så Claude Code kan felsöka direkt mot deploy-logs,
SQL och git-flödet utan att gå via copy-paste.

| Server   | Scope            | Auth         | Skrivåtgärder           |
|----------|------------------|--------------|-------------------------|
| Vercel   | user (global)    | OAuth        | Read-only just nu       |
| GitHub   | user (global)    | Fine-grained PAT | contents/PRs rw, actions r |
| Supabase | project (denna repo) | Personal access token | SQL, schema, logs |

---

## 1. Skapa tokens (på respektive dashboard)

### Supabase access token

1. Gå till <https://supabase.com/dashboard/account/tokens>
2. **Generate new token** → namn: `Claude Code · nordea-creative-iq`
3. Kopiera token-strängen (visas bara en gång)

### GitHub fine-grained PAT

1. Gå till <https://github.com/settings/personal-access-tokens/new>
2. **Token name:** `Claude Code · nordea-creative-iq`
3. **Expiration:** 30 dagar (förnyas explicit)
4. **Repository access:** *Only select repositories* → välj `nordea-creative-iq`
5. **Repository permissions** (minimum):
   - `Contents`: **Read and write**
   - `Pull requests`: **Read and write**
   - `Actions`: **Read-only**
   - `Metadata`: **Read-only** (auto-vald)
6. Generera token, kopiera direkt

### Vercel — ingen token behövs

Vercel MCP använder OAuth. Inloggning sker via browser första gången du
kör `/mcp` i en session.

---

## 2. Lägg tokens i `.claude/settings.local.json` (gitignored)

Skapa filen `.claude/settings.local.json` i projektroten (mappen `/.claude/`
är redan i `.gitignore`):

```json
{
  "env": {
    "SUPABASE_ACCESS_TOKEN": "sbp_PLAKETIT_HÄR",
    "GITHUB_TOKEN": "github_pat_PLAKETIT_HÄR"
  }
}
```

Claude Code laddar `env`-blocket vid session-start så `${SUPABASE_ACCESS_TOKEN}`
i `.mcp.json` resolverar korrekt.

**Varför inte `.env.local`?** `.env.local` läses av Next.js dev server, inte
av Claude Code-processen. `.claude/settings.local.json` är den officiella
platsen för per-projekt secrets som ska in i MCP-config.

---

## 3. Lägg till user-scope MCP-servrar (Vercel + GitHub)

I terminalen från valfri katalog:

```bash
# Vercel (OAuth)
claude mcp add --scope user --transport http vercel https://mcp.vercel.com

# GitHub (PAT via env-var-expansion)
claude mcp add --scope user --transport http github https://api.githubcopilot.com/mcp \
  --header "Authorization: Bearer \${GITHUB_TOKEN}"
```

Båda hamnar i din globala `~/.claude.json` och gäller alla projekt.

---

## 4. Project-scope Supabase är redan på plats

`.mcp.json` i repo-roten är committad och pekar mot Supabase-projektet
`hmiswsvtddsgvsrqcynb`. Inget mer behövs efter att du lagt
`SUPABASE_ACCESS_TOKEN` i `.claude/settings.local.json` (steg 2).

---

## 5. Verifiera

I en Claude Code-session:

```
/mcp
```

Förväntat output: tre servrar listade som *connected*.

- **Vercel:** Första gången triggers OAuth-flödet — godkänn i browsern
- **GitHub:** Ska connecta direkt om `GITHUB_TOKEN` är giltig
- **Supabase:** Ska connecta direkt om `SUPABASE_ACCESS_TOKEN` är giltig

### Test-anrop

Be Claude utföra något enkelt mot varje:

- *"Lista de senaste 5 deploys i Vercel"* → Vercel MCP
- *"Visa de senaste 3 commits på main"* → GitHub MCP
- *"Lista alla tabeller i public-schemat"* → Supabase MCP

---

## Säkerhet

- `.claude/settings.local.json` är gitignored (via `/.claude/` i `.gitignore`)
- `.mcp.json` innehåller **inga** secrets, bara `${VAR}`-referenser
- GitHub-PAT är repository-scoped till bara detta repo (kan inte röra andra)
- Vercel MCP är read-only — kan inte ändra env vars eller redeploya
- Supabase-token har samma access som ditt Supabase-konto — använd ej en
  team-token om du är solo

## Förnyelse

- **GitHub PAT:** 30 dagar — sätt en kalenderpåminnelse. Ny token via samma
  flöde, byt ut värdet i `.claude/settings.local.json`.
- **Supabase token:** ingen utgång satt som default, men du kan revoka
  när som helst i dashboarden.
- **Vercel OAuth:** auto-refreshas, sköter sig själv.
