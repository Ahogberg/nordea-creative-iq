"use client";

// Felgräns för hela arbetsytan: ett fel i en vy ska inte ge en vit sida mitt
// i en visning. Sidomenyn ligger kvar (layouten renderas utanför gränsen).

import { useEffect } from "react";
import Link from "next/link";
import { ErrorState } from "@/components/ui/states";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] vyn kraschade:", error);
  }, [error]);

  return (
    <div className="nordea-card mt-8 max-w-xl mx-auto">
      <ErrorState
        title="Vyn kunde inte visas"
        description={
          error.digest
            ? `Ett oväntat fel inträffade. Felkod: ${error.digest}`
            : "Ett oväntat fel inträffade. Försök igen, eller gå tillbaka till översikten."
        }
        onRetry={reset}
        action={
          <Link href="/dashboard" className="nordea-btn nordea-btn-ghost">
            Till översikten
          </Link>
        }
      />
    </div>
  );
}
