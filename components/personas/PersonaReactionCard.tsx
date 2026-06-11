'use client';

import { useEffect, useState } from 'react';
import { PersonaImage } from '@/components/ui/persona-image';
import { ThumbsUp, ThumbsDown, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';

export interface PersonaReactionData {
  firstImpression: string;
  wouldClick: number;
  emotionalResponse?: string | null;
  objections: string[];
  relevance?: { score: number; explanation?: string } | null;
  trustLevel?: { score: number; explanation?: string } | null;
  whatWorked?: string | null;
  missingInfo?: string | null;
  suggestion?: string | null;
}

interface PersonaReactionCardProps {
  personaName: string;
  personaColor?: string;
  reaction: PersonaReactionData;
  isLoading?: boolean;
  className?: string;
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 80);
    return () => clearTimeout(t);
  }, [score]);

  const color =
    score >= 70
      ? 'bg-emerald-500'
      : score >= 40
        ? 'bg-amber-500'
        : 'bg-red-500';

  const textColor =
    score >= 70
      ? 'text-emerald-600'
      : score >= 40
        ? 'text-amber-600'
        : 'text-red-500';

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 truncate">{label}</span>
        <span className={`text-xs font-bold ml-1 ${textColor}`}>{animated}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${animated}%` }}
        />
      </div>
    </div>
  );
}

function ClickGauge({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 150);
    return () => clearTimeout(t);
  }, [score]);

  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (animated / 100) * circumference;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 70 ? 'Troligen' : score >= 40 ? 'Kanske' : 'Troligen inte';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#f3f4f6" strokeWidth="5" />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-900">{animated}</span>
        </div>
      </div>
      <span className="text-xs text-gray-500 text-center leading-tight">{label}<br />klicka</span>
    </div>
  );
}

export function PersonaReactionCard({
  personaName,
  personaColor,
  reaction,
  isLoading,
  className = '',
}: PersonaReactionCardProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  if (isLoading) {
    return (
      <div className={`glass-card ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="space-y-1 flex-1">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
            <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2.5 bg-gray-100 rounded animate-pulse" />
          <div className="h-2.5 bg-gray-100 rounded animate-pulse w-4/5" />
          <div className="h-2.5 bg-gray-100 rounded animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`glass-card transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <PersonaImage name={personaName} color={personaColor} size="md" />
        <div>
          <p className="font-semibold text-gray-900 text-sm">{personaName}</p>
          <div className="flex items-center gap-1 mt-0.5">
            {reaction.wouldClick >= 60 ? (
              <ThumbsUp className="w-3 h-3 text-emerald-500" />
            ) : (
              <ThumbsDown className="w-3 h-3 text-red-400" />
            )}
            <span className="text-xs text-gray-500">
              {reaction.wouldClick >= 70
                ? 'Positiv reaktion'
                : reaction.wouldClick >= 40
                  ? 'Blandad reaktion'
                  : 'Negativ reaktion'}
            </span>
          </div>
        </div>
      </div>

      {/* Scores row */}
      <div className="flex items-start gap-4 mb-5 p-3 bg-gray-50 rounded-xl">
        <ClickGauge score={reaction.wouldClick} />
        <div className="flex-1 flex flex-col gap-2.5">
          {reaction.relevance && (
            <ScoreBar score={reaction.relevance.score} label="Relevans" />
          )}
          {reaction.trustLevel && (
            <ScoreBar score={reaction.trustLevel.score} label="Förtroende" />
          )}
          {!reaction.relevance && !reaction.trustLevel && (
            <ScoreBar score={Math.max(0, reaction.wouldClick - 10)} label="Engagemang" />
          )}
        </div>
      </div>

      {/* First impression */}
      <blockquote className="text-sm text-gray-700 italic border-l-2 border-nordea-blue pl-3 mb-4 leading-relaxed">
        &quot;{reaction.firstImpression}&quot;
      </blockquote>

      {/* What worked */}
      {reaction.whatWorked && (
        <div className="flex items-start gap-2 mb-3">
          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-700">{reaction.whatWorked}</p>
        </div>
      )}

      {/* Objections */}
      {reaction.objections.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-gray-700">Invändningar</span>
          </div>
          <ul className="space-y-1">
            {reaction.objections.map((obj, i) => (
              <li key={i} className="text-xs text-gray-600 pl-3 border-l border-amber-200">
                {obj}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestion */}
      {reaction.suggestion && (
        <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-100">
          <Lightbulb className="w-4 h-4 text-nordea-blue mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-600">{reaction.suggestion}</p>
        </div>
      )}
    </div>
  );
}
