import { useCallback, useEffect, useRef, useState } from 'react';

export type ScreenWakeLockStatus = 'unsupported' | 'inactive' | 'requesting' | 'active' | 'unavailable';

const isScreenWakeLockSupported = () => {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
};

const getWakeLockErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Screen wake lock is unavailable.';
};

export function useScreenWakeLock(shouldKeepAwake: boolean) {
  const [status, setStatus] = useState<ScreenWakeLockStatus>(() => (
    isScreenWakeLockSupported() ? 'inactive' : 'unsupported'
  ));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const isRequestingRef = useRef(false);
  const isMountedRef = useRef(false);
  const shouldKeepAwakeRef = useRef(shouldKeepAwake);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    shouldKeepAwakeRef.current = shouldKeepAwake;
  }, [shouldKeepAwake]);

  const releaseWakeLock = useCallback(() => {
    const sentinel = sentinelRef.current;
    sentinelRef.current = null;

    if (!sentinel || sentinel.released) {
      return;
    }

    void sentinel.release().catch((error: unknown) => {
      console.error('Error releasing screen wake lock:', error);
    });
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!isScreenWakeLockSupported()) {
      if (isMountedRef.current) {
        setStatus('unsupported');
        setErrorMessage(null);
      }

      return;
    }

    if (
      isRequestingRef.current
      || sentinelRef.current
      || document.visibilityState !== 'visible'
    ) {
      return;
    }

    isRequestingRef.current = true;

    if (isMountedRef.current) {
      setStatus('requesting');
      setErrorMessage(null);
    }

    try {
      const sentinel = await navigator.wakeLock.request('screen');

      if (
        !isMountedRef.current
        || !shouldKeepAwakeRef.current
        || document.visibilityState !== 'visible'
      ) {
        if (!sentinel.released) {
          void sentinel.release().catch((error: unknown) => {
            console.error('Error releasing unused screen wake lock:', error);
          });
        }

        return;
      }

      sentinelRef.current = sentinel;

      sentinel.addEventListener('release', () => {
        if (sentinelRef.current !== sentinel || !isMountedRef.current) {
          return;
        }

        sentinelRef.current = null;
        setStatus(
          shouldKeepAwakeRef.current && document.visibilityState === 'visible'
            ? 'unavailable'
            : 'inactive',
        );
      });

      if (isMountedRef.current) {
        setStatus('active');
        setErrorMessage(null);
      }
    } catch (error) {
      console.error('Error requesting screen wake lock:', error);
      sentinelRef.current = null;

      if (isMountedRef.current) {
        setStatus(shouldKeepAwakeRef.current ? 'unavailable' : 'inactive');
        setErrorMessage(shouldKeepAwakeRef.current ? getWakeLockErrorMessage(error) : null);
      }
    } finally {
      isRequestingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isScreenWakeLockSupported()) {
      releaseWakeLock();
      setStatus('unsupported');
      setErrorMessage(null);
      return;
    }

    if (!shouldKeepAwake) {
      releaseWakeLock();
      setStatus('inactive');
      setErrorMessage(null);
      return;
    }

    void requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && shouldKeepAwakeRef.current) {
        void requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [releaseWakeLock, requestWakeLock, shouldKeepAwake]);

  return {
    errorMessage,
    isSupported: status !== 'unsupported',
    status,
  };
}
