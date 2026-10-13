// ── Databasåtkomst i API:et: rätt klient och rätt ägare ──
//
// Inloggad användare → Supabase-klienten med användarens session. RLS gäller,
// och ägaren är användarens id.
//
// Demoläge (NEXT_PUBLIC_ENABLE_DEMO + demo-session-cookie) → det finns ingen
// Supabase-användare, så servernyckeln används och ägaren är "demo". RLS går
// då förbi — därför ska alla läsningar och ändringar filtrera på `ownerId`
// (se ownerColumn nedan), även när RLS skulle ha gjort det.

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./server";
import { createServiceClient } from "./service";

export const DEMO_OWNER_ID = "demo";

export interface Db {
  supabase: SupabaseClient;
  /** Värdet i tabellernas ägarkolumn (user_id / created_by). */
  ownerId: string;
  isDemo: boolean;
}

export class DbConfigError extends Error {}

async function isDemoSession(): Promise<boolean> {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO !== "true") return false;
  const cookieStore = await cookies();
  return cookieStore.get("demo-session")?.value === "true";
}

/** Databasen för den här förfrågan, eller null om ingen är inloggad. */
export async function getDb(): Promise<Db | null> {
  if (await isDemoSession()) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new DbConfigError(
        "Demoläget behöver SUPABASE_SERVICE_ROLE_KEY i .env.local (Supabase → Project Settings → API Keys)."
      );
    }
    return { supabase: createServiceClient(), ownerId: DEMO_OWNER_ID, isDemo: true };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, ownerId: user.id, isDemo: false };
}

/**
 * För API-routes:
 *   const db = await requireDb();
 *   if ("response" in db) return db.response;
 */
export async function requireDb(): Promise<Db | { response: NextResponse }> {
  try {
    const db = await getDb();
    if (!db) return { response: NextResponse.json({ error: "Inte inloggad" }, { status: 401 }) };
    return db;
  } catch (err) {
    if (err instanceof DbConfigError) {
      return { response: NextResponse.json({ error: err.message }, { status: 503 }) };
    }
    throw err;
  }
}
