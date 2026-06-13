'use client';

/**
 * 지속 스테이지 — 배경 스크롤 + PixelRunner 레이어.
 * GameStageContext를 통해 오버레이(자식)에서 snapshot·resetAnchor를 읽는다.
 */

import { createContext, useContext, useRef, type ReactNode } from 'react';
import { useGameLoop }    from '@/hooks/useGameLoop';
import type { LoopSnapshot, Band } from '@/lib/game/types';
import PixelRunner        from './PixelRunner';

interface GameStageContextValue {
  snapshot:          LoopSnapshot;
  resetAnchor:       () => void;
  resetStability:    () => void;
  setPresenceActive: (active: boolean) => void;
}

const GameStageContext = createContext<GameStageContextValue | null>(null);

export function useGameStage(): GameStageContextValue {
  const ctx = useContext(GameStageContext);
  if (!ctx) throw new Error('useGameStage must be used inside <GameStage>');
  return ctx;
}

interface GameStageProps {
  ambient?:      boolean;
  /** 확정된 내 구간 — Main Play에서 안정 게이지 계산용. */
  band?:         Band | null;
  /** 안정 게이지 가득 이벤트 (2C·Phase 3 소비). */
  onStabilized?: () => void;
  children?:     ReactNode;
}

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function GameStage({ ambient = false, band = null, onStabilized, children }: GameStageProps) {
  const groundRef = useRef<HTMLDivElement>(null);

  const { snapshot, resetAnchor, resetStability, setPresenceActive } = useGameLoop({
    bgRef:   reducedMotion ? undefined : groundRef,
    ambient,
    band,
    onStabilized,
  });

  return (
    <GameStageContext.Provider value={{ snapshot, resetAnchor, resetStability, setPresenceActive }}>
      <div className="relative w-full h-full overflow-hidden">

        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, #6b8fa8 0%, #8fb0c4 50%, #b8c9c0 100%)' }}
        />

        <div
          className="absolute bottom-0 left-0 right-0 h-[90px] z-[4]"
          style={{ background: '#2d231c' }}
        />

        <div
          ref={groundRef}
          className="absolute left-0 right-0 z-[5]"
          style={{
            bottom:           88,
            height:           2,
            backgroundImage:  'repeating-linear-gradient(90deg, #5e4438 0 12px, transparent 12px 24px)',
            backgroundRepeat: 'repeat-x',
            backgroundSize:   '24px 2px',
          }}
        />

        <div
          className="absolute z-[8]"
          style={{
            bottom:          100,
            left:            '48%',
            transform:       'translateX(-50%) scale(3)',
            transformOrigin: 'bottom center',
            imageRendering:  'pixelated',
          }}
        >
          <PixelRunner speed={snapshot.speed} paused={reducedMotion} />
        </div>

        <div className="absolute inset-0 z-[10]">
          {children}
        </div>

      </div>
    </GameStageContext.Provider>
  );
}
