import mothIcon from '../../assets/moth_icon.svg';
import mothIconLight from '../../assets/moth_icon_light.png';
import mascotCuriousLarvae from '../../assets/portraits/mascot_curious_larvae.svg';
import mascotCuriousLarvaeLight from '../../assets/portraits/mascot_curious_larvae_light.svg';
import mascotEmergingMoth from '../../assets/portraits/mascot_emerging_moth.svg';
import mascotEmergingMothLight from '../../assets/portraits/mascot_emerging_moth_light.svg';
import mascotLarvaeStarter from '../../assets/portraits/mascot_larvae_starter.svg';
import mascotLarvaeStarterLight from '../../assets/portraits/mascot_larvae_starter_light.svg';
import mascotLexipalMoth from '../../assets/portraits/mascot_lexipal_moth.svg';
import mascotLexipalMothLight from '../../assets/portraits/mascot_lexipal_moth_light.svg';
import mascotSilkenCocoon from '../../assets/portraits/mascot_silken_cocoon.svg';
import mascotSilkenCocoonLight from '../../assets/portraits/mascot_silken_cocoon_light.svg';
import mascotYoungMoth from '../../assets/portraits/mascot_young_moth.svg';
import mascotYoungMothLight from '../../assets/portraits/mascot_young_moth_light.svg';
import { useTheme } from '../theme/useTheme';

type PortraitAssetKey =
  | 'mascot_larvae_starter'
  | 'mascot_curious_larvae'
  | 'mascot_silken_cocoon'
  | 'mascot_emerging_moth'
  | 'mascot_young_moth'
  | 'mascot_lexipal_moth';

const PORTRAIT_ASSETS: Record<'dark' | 'light', Record<PortraitAssetKey, string>> = {
  dark: {
    mascot_larvae_starter: mascotLarvaeStarter,
    mascot_curious_larvae: mascotCuriousLarvae,
    mascot_silken_cocoon: mascotSilkenCocoon,
    mascot_emerging_moth: mascotEmergingMoth,
    mascot_young_moth: mascotYoungMoth,
    mascot_lexipal_moth: mascotLexipalMoth,
  },
  light: {
    mascot_larvae_starter: mascotLarvaeStarterLight,
    mascot_curious_larvae: mascotCuriousLarvaeLight,
    mascot_silken_cocoon: mascotSilkenCocoonLight,
    mascot_emerging_moth: mascotEmergingMothLight,
    mascot_young_moth: mascotYoungMothLight,
    mascot_lexipal_moth: mascotLexipalMothLight,
  },
};

const isKnownPortraitAssetKey = (assetKey: string): assetKey is PortraitAssetKey => {
  return Object.prototype.hasOwnProperty.call(PORTRAIT_ASSETS.dark, assetKey);
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
  const { theme } = useTheme();
  const label = name?.trim() ? name : 'Bookmark portrait';
  const isLight = theme === 'light';

  if (!assetKey || !isKnownPortraitAssetKey(assetKey)) {
    return (
      <span
        className={`flex aspect-square items-center justify-center overflow-hidden rounded-full bg-brand-soft ${className}`.trim()}
        role="img"
        aria-label={label}
      >
        <img
          src={isLight ? mothIconLight : mothIcon}
          alt=""
          className={`h-3/5 w-3/5 object-contain ${imageClassName}`.trim()}
        />
      </span>
    );
  }

  const portraitSrc = PORTRAIT_ASSETS[theme][assetKey];

  return (
    <span
      className={`relative block aspect-square overflow-hidden rounded-full ${isLight ? 'bg-[#f8f5ee]' : 'bg-[#0d0d0c]'} ${className}`.trim()}
      role="img"
      aria-label={label}
    >
      <img
        src={portraitSrc}
        alt=""
        className={`pointer-events-none h-full w-full select-none object-cover ${imageClassName}`.trim()}
      />
    </span>
  );
}
