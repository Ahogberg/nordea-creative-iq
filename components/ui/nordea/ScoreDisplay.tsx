interface ScoreDisplayProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreDisplay({ score, label, size = 'md' }: ScoreDisplayProps) {
  const sizes = { sm: 'text-xl', md: 'text-3xl', lg: 'text-4xl' };
  return (
    <div className="text-center">
      <span className={`font-semibold tracking-tight text-gray-900 ${sizes[size]}`}>{score}</span>
      {label && <p className="text-xs text-gray-500 mt-1">{label}</p>}
    </div>
  );
}
