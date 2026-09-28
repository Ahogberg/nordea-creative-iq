# Supabase

Projekt: `beiulqgftqiqtntumqmj` (eu-west-3).

## Schema

Kör filerna i `migrations/` i namnordning på ett nytt projekt:

1. `migrations/20260926000000_creativeiq_schema.sql` — alla tabeller, index,
   radnivåsäkerhet (RLS) och behörigheter
2. `personas_seed.sql` — standardpersonas ur `lib/persona-library.ts`
   (generera om med `npm run personas:seed-sql` när biblioteket ändras)

`migration.sql` och `rls_sprint12.sql` är den gamla uppsättningen och ska inte
köras på nya projekt: RLS-filen pekade på kolumner som inte finns.

## Ägare och RLS

Varje tabell har en ägarkolumn (`user_id` eller `created_by`, TEXT eller UUID)
som API:et sätter via `lib/supabase/db.ts`:

- inloggad användare → användarens id, med sessionen (RLS gäller)
- demoläget → ägaren `demo`, med servernyckeln (`SUPABASE_SERVICE_ROLE_KEY`),
  som går förbi RLS — API:et filtrerar därför alltid på ägaren själv

Mallbiblioteket (`templates`) delas: alla inloggade läser, bara ägaren ändrar.

## Miljövariabler (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://beiulqgftqiqtntumqmj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service_role / secret key — krävs för demoläget och bakgrundsjobb>
```
