'use client';

import { useRef } from 'react';
import PixelRunner from '@/components/game/PixelRunner';
import { useGameLoop } from '@/hooks/useGameLoop';
import { GAME_CONSTANTS } from '@/lib/game/constants';

export default function PixelRunnerDebug() {
  const bgRef = useRef<HTMLDivElement>(null);
  const { snapshot } = useGameLoop({ bgRef });

  const { speed } = snapshot;
  const pct = ((speed - GAME_CONSTANTS.MIN_SPEED) /
               (GAME_CONSTANTS.MAX_SPEED - GAME_CONSTANTS.MIN_SPEED)) * 100;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="font-pixel text-note text-accent-stable">PixelRunner DEV — Space로 속도 변화 확인</div>

      {/* 배경 + 러너 */}
      <div
        className="relative h-24 overflow-hidden"
        style={{ background: '#2b1a17' }}
      >
        {/* 스크롤 배경 */}
        <div
          ref={bgRef}
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #5e4438 0 12px, transparent 12px 24px)',
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'left bottom 10px',
            backgroundSize: '24px 2px',
          }}
        />
        {/* 러너 — 픽셀 유닛이 작으므로 scale로 확대 표시 */}
        <div
          className="absolute"
          style={{
            bottom: 14,
            left: '48%',
            transform: 'translateX(-50%) scale(3)',
            transformOrigin: 'bottom center',
            imageRendering: 'pixelated',
          }}
        >
          <PixelRunner speed={speed} />
        </div>
      </div>

      {/* 속도 readout */}
      <div className="font-pixel text-note text-ink-soft">
        speed: {speed.toFixed(3)} u/s
      </div>
      <div
        className="w-full h-2 overflow-hidden"
        style={{ background: '#3a2a22' }}
      >
        <div
          className="h-full"
          style={{
            width:      `${Math.max(0, Math.min(100, pct))}%`,
            background: '#ff9614',
          }}
        />
      </div>

      <div className="font-pixel text-note text-ink-faint">
        SPACE 홀드 → 빠른 걸음 / 릴리스 → 느린 걸음
      </div>
    </div>
  );
}
