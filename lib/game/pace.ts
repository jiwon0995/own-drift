/**
 * Find Pace 메커닉 순수 함수 모음 — React/DOM 의존 없음.
 *
 * stepAnchorGauge : 안착 게이지 한 프레임 진행
 * computeBand     : myPace ± tolerance 구간 산출
 * isInBand        : 히스테리시스 적용 구간 판정
 */

import type { AnchorConstants, AnchorGaugeState, Band, HysteresisState } from './types';

// ── 내부 헬퍼 ──────────────────────────────────────────────────────────

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// ── 공개 순수 함수 ─────────────────────────────────────────────────────

/**
 * 안착 게이지 1프레임 진행 — 입력 리듬 기반.
 *
 * 핵심: "내 속도 = 내가 반복할 수 있는 on/off 리듬."
 * 특정 목표 속도가 없다. 누름(hold)과 뗌(release)의 지속시간을 각각 추적하고,
 * 새 세그먼트가 평소 패턴과 얼마나 일치하는지(matchScore)를 본다.
 *
 * - 매 비트(누름/뗌 종료)마다 일치도에 따라 게이지를 즉각 가감 → on/off 연동감
 * - 그루브(matchScore ≥ 임계)를 유지하면 천천히 연속 충전
 * - 무한 홀드/장기 정지는 세그먼트가 평소의 STUCK_FACTOR배를 넘으면 멈춤으로 보고 일치도 급감
 * - 한두 박 어긋남은 STABILITY_GRACE로 흡수 (즉시 0으로 떨어지지 않음)
 *
 * emaSpeed는 raw 속도 slow EMA로 별도 추적 — 게이지가 가득 찰 때 myPace 값으로 쓴다.
 */
export function stepAnchorGauge(
  state: AnchorGaugeState,
  speed: number,
  holding: boolean,
  dt: number,
  c: AnchorConstants,
): AnchorGaugeState {
  // 평균 페이스(myPace 값) — raw 속도 slow EMA
  const alphaSpeed = 1 - Math.exp(-dt / c.EMA_TAU);
  const emaSpeed   = state.emaSpeed + alphaSpeed * (speed - state.emaSpeed);

  let {
    progress, prevHolding, segmentTime,
    emaHold, emaRelease, matchScore, scoredSegments, unstableTime,
  } = state;

  segmentTime += dt;

  // ── 세그먼트 종료(토글) 처리 ───────────────────────────────────────────
  let beatKick = 0; // 이번 프레임 즉각 가감량
  if (holding !== prevHolding) {
    const dur = segmentTime;

    // 채터(너무 짧음)·탐색 멈춤(너무 김)은 리듬에서 제외
    if (dur >= c.RHYTHM_MIN_SEGMENT && dur <= c.RHYTHM_MAX_SEGMENT) {
      // prevHolding=true면 방금 끝난 건 '누름' 세그먼트
      const ema = prevHolding ? emaHold : emaRelease;

      if (ema === 0) {
        // 해당 타입 첫 관측 — seed만, 채점 없음(비교 대상이 없음)
        if (prevHolding) emaHold = dur; else emaRelease = dur;
      } else {
        const relErr   = Math.abs(dur - ema) / ema;
        const segMatch = clamp01(1 - relErr / c.RHYTHM_TOLERANCE);
        const newEma   = ema + c.DURATION_ALPHA * (dur - ema);
        if (prevHolding) emaHold = newEma; else emaRelease = newEma;

        matchScore     += c.MATCH_ALPHA * (segMatch - matchScore);
        scoredSegments += 1;
        // 좋은 비트는 +, 어긋난 비트는 − (−0.5..+0.5 → ±BEAT_KICK)
        beatKick = (segMatch - 0.5) * 2 * c.RHYTHM_BEAT_KICK;
      }
    }

    segmentTime = 0;
    prevHolding = holding;
  }

  // ── 멈춤 감지: 현재 세그먼트가 평소보다 과도하게 길면 일치도 급감 ──────────
  const expected = holding ? emaHold : emaRelease;
  const overrun  =
    (expected > 0 && segmentTime > expected * c.RHYTHM_STUCK_FACTOR) ||
    segmentTime > c.RHYTHM_MAX_SEGMENT;
  if (overrun) {
    matchScore = Math.max(0, matchScore - c.RHYTHM_STUCK_DECAY * dt);
  }

  // ── 게이지 갱신 ────────────────────────────────────────────────────────
  // 1) 비트 즉각 가감 (연동감)
  progress = Math.max(0, Math.min(c.ANCHOR_GAUGE_FULL, progress + beatKick));

  // 2) 그루브 유지 시 연속 충전 / 아니면 유예 후 방전
  const inGroove =
    scoredSegments >= c.RHYTHM_WARMUP &&
    matchScore >= c.RHYTHM_MATCH_THRESHOLD &&
    !overrun;

  if (inGroove) {
    unstableTime = 0;
    progress = Math.min(c.ANCHOR_GAUGE_FULL, progress + c.ANCHOR_FILL_RATE * dt);
  } else {
    unstableTime += dt;
    if (unstableTime > c.STABILITY_GRACE) {
      progress = Math.max(0, progress - c.ANCHOR_DRAIN_RATE * dt);
    }
  }

  return {
    progress, emaSpeed, prevHolding, segmentTime,
    emaHold, emaRelease, matchScore, scoredSegments, unstableTime,
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
