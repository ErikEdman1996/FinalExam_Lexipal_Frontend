import { ChevronDown, Music2, Pause, Play, Repeat, Volume1, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  readingAudioTracks,
  type ReadingAudioCategory,
  type ReadingAudioTrack,
} from './readingAudioTracks';

const AUDIO_CATEGORIES: Array<{ id: ReadingAudioCategory; label: string }> = [
  { id: 'ambience', label: 'Ambience' },
  { id: 'songs', label: 'Songs' },
];

const DEFAULT_VOLUME = 0.55;
const defaultTrack = readingAudioTracks[0];

const formatAudioTime = (timeInSeconds: number) => {
  if (!Number.isFinite(timeInSeconds) || timeInSeconds <= 0) {
    return '0:00';
  }

  const totalSeconds = Math.floor(timeInSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const getDefaultTrackForCategory = (category: ReadingAudioCategory) => {
  return readingAudioTracks.find((track) => track.category === category) ?? defaultTrack;
};

const getTrackById = (trackId: string): ReadingAudioTrack => {
  return readingAudioTracks.find((track) => track.id === trackId) ?? defaultTrack;
};

const getVolumeIcon = (volume: number) => {
  if (volume === 0) {
    return <VolumeX size={18} />;
  }

  if (volume < 0.5) {
    return <Volume1 size={18} />;
  }

  return <Volume2 size={18} />;
};

export function ReadingMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousTrackSrcRef = useRef(defaultTrack.src);
  const [category, setCategory] = useState<ReadingAudioCategory>('ambience');
  const [selectedTrackId, setSelectedTrackId] = useState(defaultTrack.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(defaultTrack.defaultLoop);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);

  const selectedTrack = getTrackById(selectedTrackId);
  const visibleTracks = readingAudioTracks.filter((track) => track.category === category);

  useEffect(() => {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    audioElement.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    audioElement.loop = isLooping;
  }, [isLooping]);

  useEffect(() => {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    let isCancelled = false;
    const hasTrackChanged = previousTrackSrcRef.current !== selectedTrack.src;

    if (hasTrackChanged) {
      previousTrackSrcRef.current = selectedTrack.src;
      audioElement.load();
    }

    if (!isPlaying) {
      audioElement.pause();
      return () => {
        isCancelled = true;
      };
    }

    void audioElement.play().catch((error: unknown) => {
      if (isCancelled) {
        return;
      }

      console.error('Error playing reading audio:', error);
      setPlaybackError('Could not play this track. Try another one.');
      setIsPlaying(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [isPlaying, selectedTrack.src]);

  useEffect(() => {
    const audioElement = audioRef.current;

    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, []);

  const handleCategoryChange = (nextCategory: ReadingAudioCategory) => {
    setCategory(nextCategory);
    setPlaybackError(null);

    const nextTrack = getDefaultTrackForCategory(nextCategory);
    setSelectedTrackId(nextTrack.id);
    setIsLooping(nextTrack.defaultLoop);
  };

  const handleTrackSelect = (track: ReadingAudioTrack) => {
    setSelectedTrackId(track.id);
    setIsLooping(track.defaultLoop);
    setPlaybackError(null);
    setCurrentTime(0);
    setDuration(0);
  };

  const handleTogglePlayback = () => {
    setPlaybackError(null);
    setIsPlaying((currentValue) => !currentValue);
  };

  const handleToggleExpanded = () => {
    if (isExpanded) {
      setIsVolumeOpen(false);
    }

    setIsExpanded((currentValue) => !currentValue);
  };

  const handleLoadedMetadata = () => {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    setDuration(Number.isFinite(audioElement.duration) ? audioElement.duration : 0);
    setCurrentTime(audioElement.currentTime);
  };

  const handleTimeUpdate = () => {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    setCurrentTime(audioElement.currentTime);
  };

  const handleSeek = (nextTime: number) => {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    audioElement.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleTrackEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const volumeLabel = `${Math.round(volume * 100)}%`;
  const progressMax = duration > 0 ? duration : 0;

  return (
    <section
      className={`mt-4 rounded-[24px] border bg-surface shadow-[0_12px_26px_rgba(31,41,55,0.05)] transition-colors ${
        isExpanded || isPlaying ? 'border-brand/25' : 'border-border'
      }`}
    >
      {/* Instrumental focus audio uses custom controls and has no spoken caption track. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={selectedTrack.src}
        preload="metadata"
        onDurationChange={handleLoadedMetadata}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleTrackEnded}
      />

      <button
        type="button"
        onClick={handleToggleExpanded}
        className="flex w-full items-center justify-between gap-3 rounded-[24px] px-4 py-3 text-left transition-colors hover:bg-surface-alt/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
        aria-expanded={isExpanded}
        aria-controls="reading-audio-controls"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isPlaying ? 'bg-brand text-text-on-brand' : 'bg-surface-muted text-text-muted'
            }`}
          >
            <Music2 size={18} />
          </span>
          <span className="min-w-0">
            <span className="block text-xs uppercase tracking-[0.22em] text-text-subtle">Reading Audio</span>
            <span className="mt-1 block truncate text-sm font-medium text-text">
              {isPlaying ? `Playing ${selectedTrack.title}` : selectedTrack.title}
            </span>
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2">
          <span className="hidden rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-text-muted sm:inline-flex">
            {category === 'ambience' ? 'Ambience' : 'Songs'}
          </span>
          <ChevronDown
            size={18}
            className={`text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {isExpanded ? (
        <div
          id="reading-audio-controls"
          className="mx-4 flex flex-col gap-4 border-t border-border/70 pb-4 pt-4"
        >
          <div className="flex w-full gap-1 rounded-full border border-border bg-surface-alt p-1 sm:w-fit">
            {AUDIO_CATEGORIES.map((audioCategory) => {
              const isActive = audioCategory.id === category;

              return (
                <button
                  key={audioCategory.id}
                  type="button"
                  onClick={() => handleCategoryChange(audioCategory.id)}
                  className={`h-9 flex-1 rounded-full px-3 text-sm font-medium transition-colors sm:flex-none ${
                    isActive
                      ? 'bg-brand text-text-on-brand shadow-[0_6px_14px_rgba(154,74,66,0.22)]'
                      : 'text-text-muted hover:text-text'
                  }`}
                  aria-pressed={isActive}
                >
                  {audioCategory.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-2">
            {visibleTracks.map((track) => {
              const isSelected = track.id === selectedTrack.id;

              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handleTrackSelect(track)}
                  className={`flex min-h-12 items-center justify-between gap-3 rounded-[18px] border px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? 'border-brand/40 bg-brand-soft text-brand-strong'
                      : 'border-border bg-surface-alt text-text hover:bg-surface-muted'
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="min-w-0 truncate text-sm font-medium">{track.title}</span>
                  <span className={`text-xs ${isSelected ? 'text-brand-strong' : 'text-text-subtle'}`}>
                    {track.defaultLoop ? 'Loop' : 'Song'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 rounded-[22px] bg-surface-muted p-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePlayback}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-text-on-brand shadow-[0_10px_20px_rgba(154,74,66,0.2)] transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand"
                aria-label={isPlaying ? 'Pause reading audio' : 'Play reading audio'}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>

              <button
                type="button"
                onClick={() => setIsLooping((currentValue) => !currentValue)}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-brand ${
                  isLooping
                    ? 'border-brand/40 bg-brand-soft text-brand-strong'
                    : 'border-border bg-surface text-text-muted hover:bg-surface-alt hover:text-text'
                }`}
                aria-label={isLooping ? 'Turn looping off' : 'Turn looping on'}
                aria-pressed={isLooping}
              >
                <Repeat size={18} />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3 text-xs font-medium tabular-nums text-text-subtle">
                <span>{formatAudioTime(currentTime)}</span>
                <span>{formatAudioTime(duration)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={progressMax}
                step="1"
                value={Math.min(currentTime, progressMax)}
                onChange={(event) => handleSeek(Number(event.target.value))}
                disabled={duration <= 0}
                className="mt-2 h-2 w-full accent-brand disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Reading audio playback position"
              />
            </div>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsVolumeOpen((currentValue) => !currentValue)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-text-muted transition-colors hover:bg-surface-alt hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                aria-label={`Volume ${volumeLabel}`}
                aria-expanded={isVolumeOpen}
                aria-controls="reading-audio-volume-slider"
              >
                {getVolumeIcon(volume)}
              </button>

              {isVolumeOpen ? (
                <div
                  id="reading-audio-volume-slider"
                  className="absolute bottom-14 right-1/2 z-10 flex translate-x-1/2 flex-col items-center gap-3 rounded-full border border-border bg-surface px-3 py-4 shadow-[0_16px_30px_rgba(17,24,39,0.18)]"
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(event) => setVolume(Number(event.target.value))}
                    className="h-28 w-2 accent-brand"
                    style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                    aria-label="Reading audio volume"
                    aria-orientation="vertical"
                  />
                  <span className="text-xs font-medium tabular-nums text-text-subtle">
                    {volumeLabel}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {playbackError ? <p className="text-sm text-danger">{playbackError}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
