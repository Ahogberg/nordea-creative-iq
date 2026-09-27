// ── Visningsnamn och initialer för inloggad användare ──
// Delas av sidomenyn och dashboarden. Demoläget visar "Demoanvändare".

import type { User } from "@supabase/supabase-js";

export interface UserDisplay {
  name: string;
  initials: string;
  email: string;
}

function titleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function userDisplay(user: Pick<User, "id" | "email" | "user_metadata">): UserDisplay {
  const email = user.email ?? "";
  if (user.id === "demo") return { name: "Demoanvändare", initials: "D", email };

  const full = (user.user_metadata as { full_name?: unknown } | undefined)?.full_name;
  const parts =
    typeof full === "string" && full.trim()
      ? full.trim().split(/\s+/)
      : (email.split("@")[0] ?? "").split(/[._-]+/).filter((p) => p && !/\d/.test(p));

  if (parts.length === 0) return { name: email || "Användare", initials: (email[0] ?? "?").toUpperCase(), email };

  const name = parts.map(titleCase).join(" ");
  const initials = (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  return { name, initials, email };
}

/** Förnamnet att hälsa med, eller null för demo och okända adressformat. */
export function greetingName(user: Pick<User, "id" | "email" | "user_metadata">): string | null {
  if (user.id === "demo") return null;
  const { name, email } = userDisplay(user);
  if (!name || name === email || name === "Användare") return null;
  return name.split(" ")[0];
}
