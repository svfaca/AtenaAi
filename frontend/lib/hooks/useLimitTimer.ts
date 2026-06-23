import { useEffect, useState } from 'react';

export function useLimitTimer(initialSeconds = 0): number {
  const [seconds, setSeconds] = useState(Math.max(0, initialSeconds));

  useEffect(() => {
    setSeconds(Math.max(0, initialSeconds));
  }, [initialSeconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return seconds;
}

