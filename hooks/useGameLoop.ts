'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { stepSpeed } from '@/lib/game/engine';
import { GAME_CONSTANTS } from '@/lib/game/constants';
import { GamePhase } from '@/lib/game/types';
import type { LoopSnapshot } from '@/lib/game/types';
import { useHoldInput } from './useHoldInput';

interface UseGameLoopOptions {
  /** 배경 스크롤 DOM ref. 매 프레임 backgroundPositionX를 직접 씀. */
  bgRef?: React.RefObject<HTMLElement | null>;
  /** constants 오버라이드 — dev 슬라이더 튜닝용. as const 리터럴 타입 방지를 위해 Partial<Record>. */
  constants?: Partial<Record<keyof typeof GAME_CONSTANTS, number>>;
}

interface UseGameLoopReturn {
  /** UI 표시용 스로틀 스냅샷 (setState, ~100ms) */
  snapshot: LoopSnapshot;
  start: () => void;
  stop:  () => void;
}

export function useGameLoop(options: UseGameLoopOptions = {}): UseGameLoopReturn {
  const c = { ...GAME_CONSTANTS, ...options.constants };

  // ── 고빈도 상태: ref (React 렌더 트리거 X) ──────────────────────────
  const speedRef        = useRef<number>(c.START_SPEED);
  const scrollOffsetRef = useRef<number>(0);
  const lastTimeRef     = useRef<number | null>(null);
  const rafIdRef        = useRef<number | null>(null);
  const phaseRef        = useRef<GamePhase>(GamePhase.Idle);
  const lastSnapshotRef = useRef<number>(0);

  const holdingRef = useHoldInput();

  // ── UI 스냅샷 (스로틀, ~UI_THROTTLE_MS 간격) ──────────────────────
  const [snapshot, setSnapshot] = useState<LoopSnapshot>({
    speed: c.START_SPEED,
    phase: GamePhase.Idle,
  });

  // ── rAF 루프 ──────────────────────────────────────────────────────
  const tick = useCallback((timestamp: number) => {
    if (lastTimeRef.current === null) {
      lastTimeRef.current = timestamp;
    }

    const rawDt = (timestamp - lastTimeRef.current) / 1000; // ms → s
    const dt    = Math.min(rawDt, c.MAX_DT);                // 탭 복귀 점프 방지
    lastTimeRef.current = timestamp;

    // 속도 갱신 (순수 함수)
    speedRef.current = stepSpeed(speedRef.current, holdingRef.current, dt, c);

    // 배경 스크롤 offset 누적
    scrollOffsetRef.current += speedRef.current * dt * c.BG_SCROLL_PX_PER_UNIT;

    // DOM 직접 쓰기 — React 리렌더 없이 배경 이동
    if (options.bgRef?.current) {
      options.bgRef.current.style.backgroundPositionX =
        `${-(scrollOffsetRef.current % 120)}px`;
    }

    // 스로틀 스냅샷 — UI/디버그 HUD 갱신
    if (timestamp - lastSnapshotRef.current >= c.UI_THROTTLE_MS) {
      lastSnapshotRef.current = timestamp;
      setSnapshot({ speed: speedRef.current, phase: phaseRef.current });
    }

    rafIdRef.current = requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(() => {
    if (phaseRef.current === GamePhase.Active) return;
    phaseRef.current   = GamePhase.Active;
    speedRef.current   = c.START_SPEED;
    lastTimeRef.current = null;
    rafIdRef.current   = requestAnimationFrame(tick);
    setSnapshot(s => ({ ...s, phase: GamePhase.Active }));
  }, [tick, c.START_SPEED]);

  const stop = useCallback(() => {
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    phaseRef.current = GamePhase.Idle;
    setSnapshot(s => ({ ...s, phase: GamePhase.Idle }));
  }, []);

  // 마운트 시 자동 시작, 언마운트 시 정리
  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  return { snapshot, start, stop };
}
