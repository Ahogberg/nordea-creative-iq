"use client";

import { Loader2 } from "lucide-react";

interface Props {
  briefId: string;
  answers: Record<string, unknown>;
  onApprove: () => void;
  onBack: () => void;
}

// Stub — fully implemented in Sprint 10.4 (synthesis + strategy document).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ReviewStage(_props: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Loader2 className="w-8 h-8 text-nordea-blue animate-spin mb-3" />
      <p className="text-sm font-medium text-nordea-text">
        Granskningsvyn byggs i Sprint 10.4
      </p>
    </div>
  );
}
