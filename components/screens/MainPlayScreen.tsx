'use client';

import type { PaceState } from '@/lib/game/types';

interface MainPlayScreenProps {
  paceState: PaceState | null;
}

/** Main Play 평온 스텁 — 2B/2C에서 채움. */
export default function MainPlayScreen({ paceState }: MainPlayScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2">
      <p className="font-pixel text-label text-ink-faint">[Main Play Screen]</p>
      {paceState && (
        <p className="font-pixel text-label text-ink-faint" style={{ fontSize: 10 }}>
          myPace: {paceState.myPace.toFixed(2)} | band: [{paceState.band.lo.toFixed(2)}, {paceState.band.hi.toFixed(2)}]
        </p>
      )}
    </div>
  );
}
