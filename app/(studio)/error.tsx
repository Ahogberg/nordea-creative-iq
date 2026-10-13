"use client";

// Felgräns för Motion Studio och displaystudion. Studion har ingen sidomeny,
// så felvyn ger en väg tillbaka i stället för en vit skärm.

import { useEffect } from "react";
import Link from "next/link";
import { ErrorState } from "@/components/ui/states";

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[studio] editorn kraschade:", error);
  }, [error]);

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="nordea-card max-w-xl w-full">
        <ErrorState
          title="Studion kunde inte starta"
          description={
            error.digest
              ? `Ett oväntat fel inträffade. Felkod: ${error.digest}`
              : "Ett oväntat fel inträffade. Försök igen, eller gå tillbaka till kampanjerna."
          }
          onRetry={reset}
          action={
            <Link href="/campaigns" className="nordea-btn nordea-btn-ghost">
              Till kampanjerna
            </Link>
          }
        />
      </div>
    </div>
  );
}
