declare module 'canvas-confetti' {
  export interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    x?: number;
    y?: number;
    scalar?: number;
    zIndex?: number;
    colors?: string[];
    shapes?: string[];
    origin?: {
      x?: number;
      y?: number;
    };
    resize?: boolean;
    useWorker?: boolean;
  }

  interface ConfettiFn {
    (options?: Options): Promise<null> | null;
  }

  const confetti: ConfettiFn;
  export default confetti;
}
