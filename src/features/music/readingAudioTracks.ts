import forestCampfireMeditation from '../../assets/music/ambience/soundreality-ambient-forest-campfire-meditation-452486.mp3';
import springForest from '../../assets/music/ambience/soundreality-ambient-spring-forest-323801.mp3';
import wanderingWind from '../../assets/music/ambience/soundreality-ambient-wandering-wind-321158.mp3';
import retroLounge from '../../assets/music/songs/bransboynd-retro-lounge-389644.mp3';
import lateNightStudy from '../../assets/music/songs/grand_project-background-lofi-hip-hop-late-night-study-502734.mp3';
import library from '../../assets/music/songs/the_mountain-library-149940.mp3';

export type ReadingAudioCategory = 'ambience' | 'songs';

export interface ReadingAudioTrack {
  id: string;
  category: ReadingAudioCategory;
  title: string;
  src: string;
  defaultLoop: boolean;
}

export const readingAudioTracks = [
  {
    id: 'forest-campfire-meditation',
    category: 'ambience',
    title: 'Forest Campfire Meditation',
    src: forestCampfireMeditation,
    defaultLoop: true,
  },
  {
    id: 'spring-forest',
    category: 'ambience',
    title: 'Spring Forest',
    src: springForest,
    defaultLoop: true,
  },
  {
    id: 'wandering-wind',
    category: 'ambience',
    title: 'Wandering Wind',
    src: wanderingWind,
    defaultLoop: true,
  },
  {
    id: 'retro-lounge',
    category: 'songs',
    title: 'Retro Lounge',
    src: retroLounge,
    defaultLoop: false,
  },
  {
    id: 'late-night-study',
    category: 'songs',
    title: 'Late Night Study',
    src: lateNightStudy,
    defaultLoop: false,
  },
  {
    id: 'library',
    category: 'songs',
    title: 'Library',
    src: library,
    defaultLoop: false,
  },
] satisfies ReadingAudioTrack[];
