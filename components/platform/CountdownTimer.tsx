'use client';

import { useEffect, useState } from 'react';
import { intervalToDuration } from 'date-fns';

export function CountdownTimer() {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    function tick() {
      const now = new Date();
      const nextMidnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0
      ));
      const ms = nextMidnight.getTime() - now.getTime();
      const duration = intervalToDuration({ start: 0, end: ms });
      const h = String(duration.hours ?? 0).padStart(2, '0');
      const m = String(duration.minutes ?? 0).padStart(2, '0');
      const s = String(duration.seconds ?? 0).padStart(2, '0');
      setRemaining(`${h}:${m}:${s}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono text-2xl font-bold tabular-nums text-red-600">
      {remaining}
    </span>
  );
}
