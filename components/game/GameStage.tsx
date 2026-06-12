'use client';

/**
 * 지속 스테이지 — 배경 스크롤 + PixelRunner 레이어.
 *
 * 항상 깔려 있고, 화면별 UI(overlay)가 children으로 얹힌다.
 * - ambient=true(Title용): TITLE_AMBIENT_SPEED 고정, Spacebar 무시
 * - ambient=false: 정상 입력 반영
 * - prefers-reduced-motion: 배경 스크롤 DOM 쓰기 중단, Runner 정지
 * - 씬 진행(낮밤/도시)은 Phase 4
 */

import { useRef, type ReactNode } from 'react';
import { useGameLoop } from '@/hooks/useGameLoop';
import PixelRunner from './PixelRunner';

interface GameStageProps {
  ambient?:  boolean;
  children?: ReactNode;
}

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function GameStage({ ambient = false, children }: GameStageProps) {
  const groundRef = useRef<HTMLDivElement>(null);

  const { snapshot } = useGameLoop({
    bgRef:   reducedMotion ? undefined : groundRef,
    ambient,
  });

  return (
    <div className="relative w-full h-full overflow-hidden">

      {/* 하늘 — 차분한 단일 배경 (Phase 4에서 씬별 교체) */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #6b8fa8 0%, #8fb0c4 50%, #b8c9c0 100%)',
        }}
      />

      {/* 땅 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[90px] z-[4]"
        style={{ background: '#2d231c' }}
      />

      {/* 스크롤 지면선 — bgRef 직접 DOM 쓰기 */}
      <div
        ref={groundRef}
        className="absolute left-0 right-0 z-[5]"
        style={{
          bottom:              88,
          height:              2,
          backgroundImage:
            'repeating-linear-gradient(90deg, #5e4438 0 12px, transparent 12px 24px)',
          backgroundRepeat:    'repeat-x',
          backgroundSize:      '24px 2px',
        }}
      />

      {/* PixelRunner — 화면 48% 지점, 지면 위 */}
      <div
        className="absolute z-[8]"
        style={{
          bottom:    92,
          left:      '48%',
          transform: 'translateX(-50%) scale(3)',
          transformOrigin: 'bottom center',
          imageRendering: 'pixelated',
        }}
      >
        <PixelRunner speed={snapshot.speed} paused={reducedMotion} />
      </div>

      {/* 화면별 UI 오버레이 — z-index 10 이상, scanline(20) 아래 */}
      <div className="absolute inset-0 z-[10]">
        {children}
      </div>

    </div>
  );
}
