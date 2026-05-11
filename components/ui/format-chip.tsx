interface FormatChipProps {
  ratio: string;
  active?: boolean;
}

/**
 * Tiny monospace chip showing an aspect ratio like 9:16. Used on template
 * cards, production previews, and the editor toolbar.
 */
export function FormatChip({ ratio, active }: FormatChipProps) {
  return (
    <span
      className={`nordea-format-chip ${active ? "nordea-format-chip-active" : ""}`}
    >
      {ratio}
    </span>
  );
}
