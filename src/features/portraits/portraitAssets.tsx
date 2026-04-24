import mothIcon from '../../assets/moth_icon.png';
import mothPortraits from '../../assets/moth_portraits.png';

type PortraitAssetKey =
  | 'mascot_larvae_starter'
  | 'mascot_curious_larvae'
  | 'mascot_silken_cocoon'
  | 'mascot_emerging_moth'
  | 'mascot_young_moth'
  | 'mascot_lexipal_moth';

const PORTRAIT_SPRITE_POSITIONS: Record<PortraitAssetKey, { column: 0 | 1 | 2; row: 0 | 1 }> = {
  mascot_larvae_starter: { column: 0, row: 0 },
  mascot_curious_larvae: { column: 1, row: 0 },
  mascot_silken_cocoon: { column: 2, row: 0 },
  mascot_emerging_moth: { column: 0, row: 1 },
  mascot_young_moth: { column: 1, row: 1 },
  mascot_lexipal_moth: { column: 2, row: 1 },
};

const isKnownPortraitAssetKey = (assetKey: string): assetKey is PortraitAssetKey => {
  return assetKey in PORTRAIT_SPRITE_POSITIONS;
};

interface PortraitImageProps {
  assetKey?: string | null;
  name?: string | null;
  className?: string;
  imageClassName?: string;
}

export function PortraitImage({
  assetKey,
  name,
  className = '',
  imageClassName = '',
}: PortraitImageProps) {
  const label = name?.trim() ? name : 'Lexipal portrait';

  if (!assetKey || !isKnownPortraitAssetKey(assetKey)) {
    return (
      <span
        className={`flex aspect-square items-center justify-center overflow-hidden rounded-full bg-brand-soft ${className}`.trim()}
        role="img"
        aria-label={label}
      >
        <img src={mothIcon} alt="" className={`h-3/5 w-3/5 object-contain ${imageClassName}`.trim()} />
      </span>
    );
  }

  const { column, row } = PORTRAIT_SPRITE_POSITIONS[assetKey];
  const translateX = `${column * -33.333333}%`;
  const translateY = row === 0 ? '-8%' : '-50.5%';

  return (
    <span
      className={`relative block aspect-square overflow-hidden rounded-full bg-[#838ab8] ${className}`.trim()}
      role="img"
      aria-label={label}
    >
      <img
        src={mothPortraits}
        alt=""
        className={`pointer-events-none absolute left-0 top-0 h-auto max-w-none select-none ${imageClassName}`.trim()}
        style={{
          width: '300%',
          transform: `translate(${translateX}, ${translateY})`,
        }}
      />
    </span>
  );
}
