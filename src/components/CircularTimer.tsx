import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { Button } from './Button';

interface CircularTimerProps {
  onStop: (duration: number) => void;
}

export interface CircularTimerHandle {
  pause: () => void;
  resume: () => void;
  isRunning: () => boolean;
}

export const CircularTimer = forwardRef<CircularTimerHandle, CircularTimerProps>(function CircularTimer(
  { onStop }: CircularTimerProps,
  ref,
) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    pause: () => setIsRunning(false),
    resume: () => setIsRunning(true),
    isRunning: () => isRunning,
  }), [isRunning]);
  
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);
  
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleStop = () => {
    setIsRunning(false);
    onStop(seconds);
    setSeconds(0);
  };
  
  const circumference = 2 * Math.PI * 140;
  const progress = (seconds % 60) / 60;
  const offset = circumference - progress * circumference;
  
  return (
    <div className="flex flex-col items-center">
      {/* Circular Timer */}
      <div className="relative w-80 h-80 mb-8">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="160"
            cy="160"
            r="140"
            stroke="#F0F2F5"
            strokeWidth="16"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="160"
            cy="160"
            r="140"
            stroke="#A8E6CF"
            strokeWidth="16"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        
        {/* Time display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl font-semibold text-[#2C3E50] tabular-nums">
              {formatTime(seconds)}
            </div>
            <div className="text-sm text-[#6C757D] mt-2">
              {isRunning ? 'Reading...' : 'Paused'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex gap-4">
        <Button
          variant="primary"
          onClick={() => setIsRunning(!isRunning)}
          className="w-32"
        >
          {isRunning ? (
            <>
              <Pause size={20} className="mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play size={20} className="mr-2" />
              Start
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleStop}
          disabled={seconds === 0}
          className="w-32"
        >
          <Square size={20} className="mr-2" />
          Stop
        </Button>
      </div>
    </div>
  );
});
