'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { stepSpeed }        from '@/lib/game/engine';
import { stepAnchorGauge }  from '@/lib/game/pace';
import { GAME_CONSTANTS }   from '@/lib/game/constants';
import { GamePhase }        from '@/lib/game/types';
import type { AnchorGaugeState, LoopSnapshot } from '@/lib/game/types';
import { useHoldInput }     from './useHoldInput';

interface UseGameLoopOptions {
  bgRef?:     React.RefObject<HTMLElement | null>;
  constants?: Partial<Record<keyof typeof GAME_CONSTANTS, number>>;
  ambient?:   boolean;
}

interface UseGameLoopReturn {
  snapshot:    LoopSnapshot;
  start:       () => void;
  stop:        () => void;
  resetAnchor: () => void;
}

export function useGameLoop(options: UseGameLoopOptions = {}): UseGameLoopReturn {
  const c = { ...GAME_CONSTANTS, ...options.constants };

  const ambientRef = useRef(options.ambient ?? false);
  ambientRef.current = options.ambient ?? false;

  // ── 고빈도 상태 ref ───────────────────────────────────────────────
  const speedRef        = useRef<number>(c.START_SPEED);
  const scrollOffsetRef = useRef<number>(0);
  const lastTimeRef     = useRef<number | null>(null);
  const rafIdRef        = useRef<number | null>(null);
  const phaseRef        = useRef<GamePhase>(GamePhase.Idle);
  const lastSnapshotRef = useRef<number>(0);
  const holdingRef      = useHoldInput();

  // 안착 게이지 — FindPaceScreen 마운트 시 resetAnchor로 재초기화
  const anchorRef = useRef<AnchorGaugeState>({
    progress:        0,
    stability:       { emaSpeed: c.START_SPEED, emaDev: 0 },
    unstableTime:    0,
    timeSinceToggle: 0,
    prevHolding:     false,
  });

  // constants ref — ambientRef 패턴과 동일. 매 렌더마다 갱신해
  // tick 클로저(useCallback [])가 항상 최신 c를 참조하게 한다.
  const cRef = useRef(c);
  cRef.current = c;

  // ── UI 스냅샷 ─────────────────────────────────────────────────────
  const [snapshot, setSnapshot] = useState<LoopSnapshot>({
    speed:         c.START_SPEED,
    phase:         GamePhase.Idle,
    holding:       false,
    gaugeProgress: 0,
    emaSpeed:      c.START_SPEED,
  });

  // ── rAF 루프 ──────────────────────────────────────────────────────
  const tick = useCallback((timestamp: number) => {
    if (lastTimeRef.current === null) lastTimeRef.current = timestamp;

    const cc  = cRef.current; // ← cRef로 최신 constants 참조
    const rawDt = (timestamp - lastTimeRef.current) / 1000;
    const dt    = Math.min(rawDt, cc.MAX_DT);
    lastTimeRef.current = timestamp;

    if (ambientRef.current) {
      speedRef.current = cc.TITLE_AMBIENT_SPEED;
    } else {
      speedRef.current = stepSpeed(speedRef.current, holdingRef.current, dt, cc);
    }

    scrollOffsetRef.current += speedRef.current * dt * cc.BG_SCROLL_PX_PER_UNIT;

    if (options.bgRef?.current) {
      options.bgRef.current.style.backgroundPositionX =
        `${-(scrollOffsetRef.current % 120)}px`;
    }

    // 안착 게이지 매 프레임 계산
    anchorRef.current = stepAnchorGauge(anchorRef.current, speedRef.current, holdingRef.current, dt, cc);

    if (timestamp - lastSnapshotRef.current >= cc.UI_THROTTLE_MS) {
      lastSnapshotRef.current = timestamp;
      setSnapshot({
        speed:         speedRef.current,
        phase:         phaseRef.current,
        holding:       holdingRef.current,
        gaugeProgress: anchorRef.current.progress,
        emaSpeed:      anchorRef.current.stability.emaSpeed,
      });
    }

    rafIdRef.current = requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(() => {
    if (phaseRef.current === GamePhase.Active) return;
    phaseRef.current    = GamePhase.Active;
    speedRef.current    = ambientRef.current
      ? GAME_CONSTANTS.TITLE_AMBIENT_SPEED
      : cRef.current.START_SPEED;
    lastTimeRef.current = null;
    rafIdRef.current    = requestAnimationFrame(tick);
    setSnapshot(s => ({ ...s, phase: GamePhase.Active }));
  }, [tick]);

  const stop = useCallback(() => {
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    phaseRef.current = GamePhase.Idle;
    setSnapshot(s => ({ ...s, phase: GamePhase.Idle }));
  }, []);

  const resetAnchor = useCallback(() => {
    anchorRef.current = {
      progress:        0,
      stability:       { emaSpeed: speedRef.current, emaDev: 0 },
      unstableTime:    0,
      timeSinceToggle: 0,
      prevHolding:     false,
    };
    setSnapshot(s => ({ ...s, gaugeProgress: 0, emaSpeed: speedRef.current }));
  }, []);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  return { snapshot, start, stop, resetAnchor };
}
