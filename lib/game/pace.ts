/**
 * Find Pace 메커닉 순수 함수 모음 — React/DOM 의존 없음.
 *
 * stepAnchorGauge : 안착 게이지 한 프레임 진행
 * computeBand     : myPace ± tolerance 구간 산출
 * isInBand        : 히스테리시스 적용 구간 판정
 */

import type { AnchorGaugeState, Band, HysteresisState } from './types';

// ── 상수 인터페이스 ────────────────────────────────────────────────────

export interface AnchorConstants {
  ANCHOR_FILL_RATE:  number;
  ANCHOR_DRAIN_RATE: number;
  ANCHOR_GAUGE_FULL: number;
  STABILITY_WINDOW:  number;
  EMA_TAU:           number;
  EXTREME_EDGE:      number;
  MIN_SPEED:         number;
  MAX_SPEED:         number;
}

// ── 내부 헬퍼 ──────────────────────────────────────────────────────────

/**
 * 극단 속도 패널티 계수 (0.5 ~ 1.0).
 * MIN/MAX 근처일수록 충전이 살짝 더디고, 중간 구간은 전부 1.0.
 */
function edgePenalty(speed: number, c: AnchorConstants): number {
  const range = c.MAX_SPEED - c.MIN_SPEED;
  const dMin  = (speed - c.MIN_SPEED) / range; // 0=MIN, 1=MAX
  const dMax  = (c.MAX_SPEED - speed) / range;
  const e     = c.EXTREME_EDGE;
  if (dMin < e) return 0.5 + 0.5 * (dMin / e);
  if (dMax < e) return 0.5 + 0.5 * (dMax / e);
  return 1.0;
}

// ── 공개 순수 함수 ─────────────────────────────────────────────────────

/**
 * 안착 게이지 1프레임 진행.
 *
 * "특정 속도 타깃 없음 — 변동 없이 유지하면 충전."
 * EMA 추적으로 변동폭(emaDev)을 산출하고, STABILITY_WINDOW 이하면 안착 중으로 판정.
 * 극단 속도에서 살짝 패널티, 불안정 시 방전.
 */
export function stepAnchorGauge(
  state: AnchorGaugeState,
  speed: number,
  dt: number,
  c: AnchorConstants,
): AnchorGaugeState {
  // 지수이동평균 갱신: alpha ≈ dt/tau (exp 근사)
  const alpha  = 1 - Math.exp(-dt / c.EMA_TAU);
  const newEma = state.stability.emaSpeed + alpha * (speed - state.stability.emaSpeed);
  const dev    = Math.abs(speed - state.stability.emaSpeed);
  const newDev = state.stability.emaDev   + alpha * (dev   - state.stability.emaDev);

  const stable  = newDev < c.STABILITY_WINDOW;
  const penalty = edgePenalty(speed, c);

  const delta      = stable
    ? c.ANCHOR_FILL_RATE * penalty * dt
    : -c.ANCHOR_DRAIN_RATE * dt;
  const newProgress = Math.max(0, Math.min(c.ANCHOR_GAUGE_FULL, state.progress + delta));

  return {
    progress:  newProgress,
    stability: { emaSpeed: newEma, emaDev: newDev },
  };
}

/**
 * myPace 기준 ± tolerance 비율 구간 산출.
 * tolerance = 0.15 → ±15%.
 */
export function computeBand(myPace: number, tolerance: number): Band {
  return {
    lo: myPace * (1 - tolerance),
    hi: myPace * (1 + tolerance),
  };
}

/**
 * 히스테리시스 구간 판정.
 *
 * 경계 깜빡임 방지:
 * - 밴드 안에 있었다면 margin만큼 넓힌 범위에서 벗어날 때 out
 * - 밴드 밖에 있었다면 margin만큼 좁힌 범위 안에 들어올 때 in
 *
 * 반환값 그대로 다음 호출의 prev에 전달한다 (2B 안정 게이지 재사용).
 */
export function isInBand(
  speed: number,
  band: Band,
  prev: HysteresisState,
  margin: number,
): HysteresisState {
  let inBand: boolean;
  if (prev.inBand) {
    // 이미 안에 있음 — 넓힌 범위 밖으로 나가야 exit
    inBand = speed >= band.lo - margin && speed <= band.hi + margin;
  } else {
    // 밖에 있음 — 좁힌 범위 안에 들어와야 enter
    const enterLo = band.lo + margin;
    const enterHi = band.hi - margin;
    inBand = enterLo <= enterHi
      ? speed >= enterLo && speed <= enterHi
      : speed >= (band.lo + band.hi) / 2 - 0.001 && speed <= (band.lo + band.hi) / 2 + 0.001;
  }
  return { inBand };
}
