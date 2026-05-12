"use client";

import { Check } from "lucide-react";
import { WIZARD_STAGES } from "@/lib/brief/types";

interface Props {
  currentStage: number;
}

export function WizardProgress({ currentStage }: Props) {
  return (
    <div className="bg-white border-b border-nordea-hairline px-6 py-3">
      <div className="max-w-2xl mx-auto flex items-center">
        {WIZARD_STAGES.map((stage, idx) => {
          const isActive = idx === currentStage;
          const isCompleted = idx < currentStage;

          return (
            <div key={stage.id} className="flex items-center flex-1 last:flex-initial">
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0
                  ${isCompleted ? "bg-nordea-teal text-nordea-deep" : ""}
                  ${isActive ? "bg-nordea-blue text-white" : ""}
                  ${!isActive && !isCompleted ? "bg-nordea-bg-hover text-nordea-text-tertiary" : ""}
                `}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <div className="ml-2 mr-2 min-w-0 hidden sm:block">
                <div
                  className={`text-xs font-medium truncate ${
                    isActive
                      ? "text-nordea-text"
                      : "text-nordea-text-tertiary"
                  }`}
                >
                  {stage.name}
                </div>
              </div>
              {idx < WIZARD_STAGES.length - 1 && (
                <div
                  className={`flex-1 h-px ${
                    isCompleted ? "bg-nordea-teal" : "bg-nordea-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
