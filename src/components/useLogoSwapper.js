'use client';

import { useEffect, useRef, useState } from 'react';
import { BRANDS, SLOT_COUNT } from './data';

/**
 * The original client strip: a fixed row of slots where one logo at a time
 * fades out, is replaced by a brand not currently on screen, and fades back in.
 *
 * Two swap chains run at once on independent random clocks, so the strip never
 * settles into a visible rhythm. A slot stays "busy" for 1.4s after it is
 * picked and its immediate neighbours are excluded while it is, otherwise two
 * adjacent logos can be mid-fade together and the row reads as a gap.
 */
export default function useLogoSwapper() {
  // Deterministic first render: the server and the client agree, and the
  // randomness only starts once the effect runs.
  const [slots, setSlots] = useState(() =>
    Array.from({ length: SLOT_COUNT }, (_, i) => ({ idx: i, visible: true }))
  );

  const timers = useRef([]);
  const busy = useRef({});

  useEffect(() => {
    let cancelled = false;
    const push = (t) => timers.current.push(t);

    const scheduleSwap = () => {
      const wait = 700 + Math.random() * 1500;
      push(
        setTimeout(() => {
          if (cancelled) return;

          const free = [];
          for (let i = 0; i < SLOT_COUNT; i += 1) {
            if (!busy.current[i] && !busy.current[i - 1] && !busy.current[i + 1]) free.push(i);
          }
          if (!free.length) {
            scheduleSwap();
            return;
          }

          const slotN = free[Math.floor(Math.random() * free.length)];
          busy.current[slotN] = true;
          push(setTimeout(() => { delete busy.current[slotN]; }, 1400));

          setSlots((st) => st.map((sl, i) => (i === slotN ? { ...sl, visible: false } : sl)));

          // Swaps the brand while the slot is invisible, so the change itself
          // is never seen — only the fade.
          push(
            setTimeout(() => {
              if (cancelled) return;
              setSlots((st) => {
                const shown = st.map((sl) => sl.idx);
                const pool = BRANDS.map((_, i) => i).filter((i) => shown.indexOf(i) === -1);
                const next = pool.length
                  ? pool[Math.floor(Math.random() * pool.length)]
                  : shown[slotN];
                return st.map((sl, i) => (i === slotN ? { idx: next, visible: true } : sl));
              });
            }, 600)
          );

          scheduleSwap();
        }, wait)
      );
    };

    scheduleSwap();
    scheduleSwap();

    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
      busy.current = {};
    };
  }, []);

  return slots;
}
