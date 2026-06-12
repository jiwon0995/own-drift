'use client';

import { useEffect, useRef, useState } from 'react';
import { GAME_CONSTANTS } from '@/lib/game/constants';

/**
 * 픽셀 러너 스프라이트.
 *
 * 디자인 기준: design-system.html / game-screens.html 러너 로직
 * - U=5px 픽셀 유닛, 4프레임 RUN 배열, box-shadow로 픽셀 그리기
 * - 프레임 cadence = speed에 비례 (빠를수록 빠른 걷기 사이클)
 * - 저빈도 프레임 전환 → React state 허용 (rAF 아님)
 * - 색: --fig-player(#ffb257) 고정. 상태색 보간은 Phase 4
 * - prefers-reduced-motion → 0번 프레임 정지
 * - image-rendering: pixelated (body에 이미 적용, 여기서도 명시)
 */

const U = 5; // 픽셀 유닛 px

/** 4프레임 걷기 스프라이트. 각 픽셀 = [col, row] */
const RUN: [number, number][][] = [
  [[3,0],[2,1],[2,2],[1,3],[3,4]],
  [[3,0],[2,1],[2,2],[2,3],[2,4]],
  [[3,0],[2,1],[2,2],[3,3],[1,4]],
  [[3,0],[2,1],[2,2],[2,3],[2,4]],
];

/** [col, row][] → box-shadow 문자열 */
function buildShadow(pixels: [number, number][], color: string): string {
  return pixels.map(([x, y]) => `${x * U}px ${y * U}px 0 ${color}`).join(', ');
}

/** speed → 프레임 간격 ms. MIN에서 느리게, MAX에서 빠르게. */
function frameInterval(speed: number): number {
  const { MIN_SPEED, MAX_SPEED } = GAME_CONSTANTS;
  const t = (speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED); // 0~1
  return Math.round(400 - t * 320); // 400ms(느림) ~ 80ms(빠름)
}

/**
 * 프레임별 Y 바운스 오프셋 테이블 (로컬 px, 정수).
 * 발 딛는 프레임(0,2) = +1(아래), 패싱 프레임(1,3) = -1(위).
 * RUNNER_BOUNCE_PX를 곱해 실제 진폭 결정.
 */
const BOUNCE_Y_TABLE = [1, -1, 1, -1] as const;

interface PixelRunnerProps {
  speed:   number;
  paused?: boolean;
}

export default function PixelRunner({ speed, paused = false }: PixelRunnerProps) {
  const [frame, setFrame] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // speed를 ref로 올려 타이머 클로저가 항상 최신값을 참조.
  // deps에서 제외해 speed 변경 시 타이머 리셋 없음 → 발 멈춤 현상 방지.
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (intervalRef.current) clearTimeout(intervalRef.current);
    if (paused || reducedMotion) return;

    function step() {
      setFrame(f => (f + 1) % 4);
      intervalRef.current = setTimeout(step, frameInterval(speedRef.current));
    }
    intervalRef.current = setTimeout(step, frameInterval(speedRef.current));
    return () => { if (intervalRef.current) clearTimeout(intervalRef.current); };
  // speed는 ref로 관리 — deps 제외로 타이머 연속성 유지
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, reducedMotion]);

  const shadow = buildShadow(RUN[frame], '#ffb257');
  // 기존 프레임 index에서 bounce 파생 — 새 타이머/rAF 없음.
  // reduced-motion 또는 paused 시 0으로 고정.
  const bounceY = (paused || reducedMotion)
    ? 0
    : BOUNCE_Y_TABLE[frame] * GAME_CONSTANTS.RUNNER_BOUNCE_PX;

  return (
    /* 스프라이트 bounding box: 5col × 5row × U px */
    <div
      style={{
        position:       'relative',
        width:          U,
        height:         U,
        imageRendering: 'pixelated',
      }}
    >
      {/* bounce wrapper — 위치용 transform과 분리해 내부에서만 적용 */}
      <div style={{ transform: `translateY(${bounceY}px)` }}>
        <i
          style={{
            position:   'absolute',
            width:      U,
            height:     U,
            boxShadow:  shadow,
          }}
        />
      </div>
    </div>
  );
}
