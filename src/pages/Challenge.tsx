import { Link } from 'react-router-dom';
import { Brain, ChevronRight, Grid3x3, LockKeyhole, Swords, type LucideIcon } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { ChallengeNavTabs } from '../components/ChallengeNavTabs';

interface MinigameTile {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  route: string | null;
  locked: boolean;
}

const MINIGAMES: MinigameTile[] = [
  {
    id: 'flashcard',
    title: 'Flashcard',
    description: 'Pick the right definition from four choices before the timer runs out.',
    icon: Swords,
    route: '/challenges/flashcard',
    locked: false,
  },
  {
    id: 'crossword',
    title: 'Crossword',
    description: 'Fill a 5-word crossword built from your looked-up words.',
    icon: Grid3x3,
    route: '/challenges/crossword',
    locked: false,
  },
  {
    id: 'soon-2',
    title: 'Coming Soon',
    description: 'A new minigame is on the way.',
    icon: LockKeyhole,
    route: null,
    locked: true,
  },
  {
    id: 'soon-3',
    title: 'Coming Soon',
    description: 'A new minigame is on the way.',
    icon: LockKeyhole,
    route: null,
    locked: true,
  },
];

interface MinigameTileCardProps {
  tile: MinigameTile;
}

function MinigameTileCard({ tile }: MinigameTileCardProps) {
  const { title, description, icon: Icon, locked } = tile;

  if (locked) {
    return (
      <div
        aria-disabled="true"
        className="relative cursor-not-allowed overflow-hidden rounded-[26px] border border-border bg-surface p-6 opacity-60 shadow-[0_14px_28px_rgba(31,41,55,0.06)]"
      >
        <span className="absolute right-4 top-4 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium uppercase tracking-[0.18em] text-text-subtle">
          Soon
        </span>
        <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-surface-muted">
          <Icon size={24} className="text-text-subtle" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-text">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">{description}</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-surface-muted px-3 py-1.5 text-sm font-medium text-text-subtle">
          <LockKeyhole size={14} />
          Coming Soon
        </div>
      </div>
    );
  }

  return (
    <Link
      to={tile.route ?? '/challenges'}
      className="group flex flex-col items-start rounded-[26px] border border-border bg-surface p-6 text-left shadow-[0_14px_28px_rgba(31,41,55,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-brand"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-accent-soft shadow-[0_10px_24px_rgba(212,146,79,0.16)]">
        <Icon size={24} className="text-accent-strong" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold text-text">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">{description}</p>
      <div className="mt-6 inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1.5 text-sm font-medium text-brand-strong transition-transform group-hover:translate-x-0.5">
        Play
        <ChevronRight size={16} />
      </div>
    </Link>
  );
}

export default function Challenge() {
  return (
    <div className="page-bg min-h-screen pb-24 lg:pl-60 lg:pb-0">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.03em] text-text">Challenges</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
              Pick a mini game to train your vocabulary.
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-brand-soft shadow-[0_10px_24px_rgba(62,157,123,0.16)]">
            <Brain size={26} className="text-brand-strong" />
          </div>
        </div>

        <ChallengeNavTabs className="mb-6" />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {MINIGAMES.map((tile) => (
            <MinigameTileCard key={tile.id} tile={tile} />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
