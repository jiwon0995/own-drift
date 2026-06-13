'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { stepSpeed, applyPresencePull }       from '@/lib/game/engine';
import { stepAnchorGauge, isInBand, stepStabilityGauge } from '@/lib/game/pace';
import { GAME_CONSTANTS }                     from '@/lib/game/constants';
import { GamePhase }                          from '@/lib/game/types';
import type { AnchorGaugeState, LoopSnapshot, Band, HysteresisState } from '@/lib/game/types';
import { useHoldInput }                       from './useHoldInput';

interface UseGameLoopOptions {
  bgRef?:       React.RefObject<HTMLElement | null>;
  constants?:   Partial<Record<keyof typeof GAME_CONSTANTS, number>>;
  ambient?:     boolean;
  /** 확정된 내 구간 — 있으면 매 프레임 안정 게이지 계산(Main Play). null이면 비활성. */
  band?:        Band | null;
  /** 안정 게이지 가득 찰 때 발생(루프가 리셋). 2C·Phase 3가 소비. */
  onStabilized?: () => void;
}

interface UseGameLoopReturn {
  snapshot:           LoopSnapshot;
  start:              () => void;
  stop:               () => void;
  resetAnchor:        () => void;
  resetStability:     () => void;
  /** 다른 존재 끌어당김 on/off (2C, Main Play 인카운터가 제어). */
  setPresenceActive:  (active: boolean) => void;
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
    progress:       0,
    emaSpeed:       c.START_SPEED,
    prevHolding:    false,
    segmentTime:    0,
    emaHold:        0,
    emaRelease:     0,
    matchScore:     0,
    scoredSegments: 0,
    unstableTime:   0,
  });

  // constants ref — ambientRef 패턴과 동일. 매 렌더마다 갱신해
  // tick 클로저(useCallback [])가 항상 최신 c를 참조하게 한다.
  const cRef = useRef(c);
  cRef.current = c;

  // 안정 게이지(Phase 2B) — band가 있을 때만 활성. ref+루프, UI는 스냅샷.
  const bandRef = useRef<Band | null>(options.band ?? null);
  bandRef.current = options.band ?? null;
  const onStabilizedRef = useRef(options.onStabilized);
  onStabilizedRef.current = options.onStabilized;
  const stabilityRef  = useRef<number>(0);
  const hysteresisRef = useRef<HysteresisState>({ inBand: false });

  // 다른 존재(Phase 2C) — 인카운터가 setPresenceActive로 끌어당김을 켠다.
  const presenceActiveRef = useRef(false);
  const stabilizationsRef = useRef(0); // 누적 안정 횟수(단조 증가)

  // ── UI 스냅샷 ─────────────────────────────────────────────────────
  const [snapshot, setSnapshot] = useState<LoopSnapshot>({
    speed:             c.START_SPEED,
    phase:             GamePhase.Idle,
    holding:           false,
    gaugeProgress:     0,
    emaSpeed:          c.START_SPEED,
    stabilityProgress: 0,
    inBand:            false,
    stabilizations:    0,
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
      // 1A 입력 속도 (stepSpeed 무변)
      speedRef.current = stepSpeed(speedRef.current, holdingRef.current, dt, cc);
      // 2C 다른 존재 끌어당김 — 입력 결과에 약한 드리프트 합성. 존재는 내 페이스보다 살짝 앞.
      const pband = bandRef.current;
      if (presenceActiveRef.current && pband) {
        const presenceTarget = (pband.lo + pband.hi) / 2 + cc.PRESENCE_APPROACH_SPEED;
        const drift = applyPresencePull(speedRef.current, presenceTarget, cc.PULL_STRENGTH, dt);
        speedRef.current = Math.min(cc.MAX_SPEED, Math.max(cc.MIN_SPEED, speedRef.current + drift));
      }
    }

    scrollOffsetRef.current += speedRef.current * dt * cc.BG_SCROLL_PX_PER_UNIT;

    if (options.bgRef?.current) {
      options.bgRef.current.style.backgroundPositionX =
        `${-(scrollOffsetRef.current % 120)}px`;
    }

    // 안착 게이지 매 프레임 계산
    anchorRef.current = stepAnchorGauge(anchorRef.current, speedRef.current, holdingRef.current, dt, cc);

    // 안정 게이지 — 내 구간이 설정된 동안(Main Play)만. 히스테리시스로 경계 떨림 방지.
    const band = bandRef.current;
    if (band && !ambientRef.current) {
      hysteresisRef.current = isInBand(speedRef.current, band, hysteresisRef.current, cc.HYSTERESIS_MARGIN);
      stabilityRef.current  = stepStabilityGauge(stabilityRef.current, hysteresisRef.current.inBand, dt, cc);
      if (stabilityRef.current >= cc.STABILITY_GAUGE_FULL) {
        stabilityRef.current     = 0;       // 가득 → 리셋 ("한 번 찾음")
        stabilizationsRef.current += 1;     // 2C 카운트가 스냅샷에서 diff
        onStabilizedRef.current?.();        // 저수준 이벤트 훅
      }
    }

    if (timestamp - lastSnapshotRef.current >= cc.UI_THROTTLE_MS) {
      lastSnapshotRef.current = timestamp;
      setSnapshot({
        speed:             speedRef.current,
        phase:             phaseRef.current,
        holding:           holdingRef.current,
        gaugeProgress:     anchorRef.current.progress,
        emaSpeed:          anchorRef.current.emaSpeed,
        stabilityProgress: stabilityRef.current,
        inBand:            hysteresisRef.current.inBand,
        stabilizations:    stabilizationsRef.current,
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
      progress:       0,
      emaSpeed:       speedRef.current,
      prevHolding:    holdingRef.current,
      segmentTime:    0,
      emaHold:        0,
      emaRelease:     0,
      matchScore:     0,
      scoredSegments: 0,
      unstableTime:   0,
    };
    setSnapshot(s => ({ ...s, gaugeProgress: 0, emaSpeed: speedRef.current }));
  }, []);

  const resetStability = useCallback(() => {
    stabilityRef.current  = 0;
    hysteresisRef.current = { inBand: false };
    setSnapshot(s => ({ ...s, stabilityProgress: 0, inBand: false }));
  }, []);

  const setPresenceActive = useCallback((active: boolean) => {
    presenceActiveRef.current = active;
  }, []);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  return { snapshot, start, stop, resetAnchor, resetStability, setPresenceActive };
}
