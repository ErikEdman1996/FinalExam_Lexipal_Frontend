import { Check } from 'lucide-react';
import { NOTE_TAG_COLOR_OPTIONS } from './noteTagColors';

interface TagColorSwatchesProps {
  value: string;
  onChange: (colorHex: string) => void;
  disabled?: boolean;
}

export function TagColorSwatches({
  value,
  onChange,
  disabled = false,
}: TagColorSwatchesProps) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tag color">
      {NOTE_TAG_COLOR_OPTIONS.map((option) => {
        const isSelected = option.hex.toLowerCase() === value.toLowerCase();

        return (
          <button
            key={option.hex}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
            title={option.label}
            disabled={disabled}
            onClick={() => onChange(option.hex)}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50 ${
              isSelected
                ? 'border-text shadow-[0_0_0_3px_rgba(184,90,62,0.18)]'
                : 'border-border hover:scale-105'
            }`}
            style={{ backgroundColor: option.hex }}
          >
            {isSelected ? <Check size={15} className="text-white drop-shadow" /> : null}
          </button>
        );
      })}
    </div>
  );
}
