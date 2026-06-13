'use client';

/**
 * 픽셀 러너 스프라이트.
 *
 * 속도 기반 4단계 gait: walk → jog → run → sprint
 * - 히스테리시스로 경계 떨림 방지 (진입 임계 > 이탈 임계)
 * - 각 gait 안에서 playbackRate를 속도에 비례해 연속감 부여
 * - gait별 bounce 진폭 차등
 * - prefers-reduced-motion: 0번 프레임 정지
 */

import { useEffect, useRef, useState } from 'react';
import { GAME_CONSTANTS } from '@/lib/game/constants';

const U = 5; // 픽셀 유닛 px

/** 4프레임 걷기 스프라이트. 각 픽셀 = [col, row] */
const RUN: [number, number][][] = [
  [[3,0],[2,1],[2,2],[1,3],[3,4]],
  [[3,0],[2,1],[2,2],[2,3],[2,4]],
  [[3,0],[2,1],[2,2],[3,3],[1,4]],
  [[3,0],[2,1],[2,2],[2,3],[2,4]],
];

function buildShadow(pixels: [number, number][], color: string): string {
  return pixels.map(([x, y]) => `${x * U}px ${y * U}px 0 ${color}`).join(', ');
}

// ── Gait 정의 ─────────────────────────────────────────────────────────────

type Gait = 'walk' | 'jog' | 'run' | 'sprint';

/** 히스테리시스 gait 전환 — 경계 근처에서 단계가 깜빡이지 않음 */
function nextGait(current: Gait, v: number): Gait {
  switch (current) {
    case 'walk':   return v > 0.85 ? 'jog'    : 'walk';
    case 'jog':    return v > 1.45 ? 'run'    : v < 0.75 ? 'walk' : 'jog';
    case 'run':    return v > 2.05 ? 'sprint' : v < 1.35 ? 'jog'  : 'run';
    case 'sprint': return v < 1.95 ? 'run'    : 'sprint';
  }
}

/** gait별 속도 band (lerp 기준점) */
const GAIT_BAND: Record<Gait, [min: number, max: number]> = {
  walk:   [GAME_CONSTANTS.MIN_SPEED, 0.85],
  jog:    [0.75, 1.45],
  run:    [1.35, 2.05],
  sprint: [1.95, GAME_CONSTANTS.MAX_SPEED],
};

/** gait별 frameInterval 범위 [slowMs, fastMs] */
const GAIT_INTERVAL: Record<Gait, [number, number]> = {
  walk:   [400, 260],
  jog:    [260, 160],
  run:    [160, 100],
  sprint: [100, 60],
};

/** gait별 bounce 진폭 (로컬 px, RUNNER_BOUNCE_PX 곱하기 전) */
const GAIT_BOUNCE: Record<Gait, number> = {
  walk:   0.3,
  jog:    0.7,
  run:    1.0,
  sprint: 1.5,
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function gaitInterval(gait: Gait, speed: number): number {
  const [bandMin, bandMax] = GAIT_BAND[gait];
  const t = bandMax > bandMin ? (speed - bandMin) / (bandMax - bandMin) : 0.5;
  const [slowMs, fastMs] = GAIT_INTERVAL[gait];
  return Math.round(lerp(slowMs, fastMs, t));
}

const BOUNCE_Y_TABLE = [1, -1, 1, -1] as const;

// ── 컴포넌트 ──────────────────────────────────────────────────────────────

interface PixelRunnerProps {
  speed:   number;
  paused?: boolean;
}

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function PixelRunner({ speed, paused = false }: PixelRunnerProps) {
  const [frame, setFrame] = useState(0);
  const [gait,  setGait]  = useState<Gait>('walk');

  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef    = useRef(speed);
  speedRef.current  = speed;

  const gaitRef    = useRef<Gait>('walk');

  // speed → gait 갱신 (매 렌더, 히스테리시스 적용)
  const nextG = nextGait(gaitRef.current, speed);
  if (nextG !== gaitRef.current) {
    gaitRef.current = nextG;
    setGait(nextG);
  }

  useEffect(() => {
    if (intervalRef.current) clearTimeout(intervalRef.current);
    if (paused || reducedMotion) return;

    function step() {
      setFrame(f => (f + 1) % 4);
      intervalRef.current = setTimeout(step, gaitInterval(gaitRef.current, speedRef.current));
    }
    intervalRef.current = setTimeout(step, gaitInterval(gaitRef.current, speedRef.current));
    return () => { if (intervalRef.current) clearTimeout(intervalRef.current); };
  // gait/speed는 ref로 관리 — deps 제외로 타이머 연속성 유지
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, reducedMotion]);

  // 색은 --accent-current(안정=따뜻 #ffb257 ↔ 멀어짐=차가움 #7e8a99) — CSS color-mix 보간.
  const shadow  = buildShadow(RUN[frame], 'var(--accent-current)');
  const bounceAmp = (paused || reducedMotion)
    ? 0
    : GAIT_BOUNCE[gait] * GAME_CONSTANTS.RUNNER_BOUNCE_PX;
  const bounceY = bounceAmp * BOUNCE_Y_TABLE[frame];

  return (
    <div
      style={{
        position:       'relative',
        width:          U,
        height:         U,
        imageRendering: 'pixelated',
      }}
    >
      <div style={{ transform: `translateY(${bounceY}px)` }}>
        <i
          style={{
            position:  'absolute',
            width:     U,
            height:    U,
            boxShadow: shadow,
          }}
        />
      </div>
    </div>
  );
}
