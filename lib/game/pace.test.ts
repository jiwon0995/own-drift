import { describe, it, expect } from 'vitest';
import { computeStability } from '@/lib/game/pace';
import { GAME_CONSTANTS } from '@/lib/game/constants';

/**
 * computeStability(speed, band, falloff) 단위 테스트 — Phase 4A 색의 source of truth.
 *
 * 구현 모델: center=(lo+hi)/2, half=(hi-lo)/2,
 *   dd = |speed-center| / half / falloff,  결과 = 1/(1+dd²).
 * brief의 pow(1-d, falloff)가 아니라 *부드러운 rational* — 경계에서 0이 아니라
 * falloff에 따른 값으로 식고, 절대 0/1 밖으로 나가지 않는다. 아래는 그 실제 거동을 고정한다.
 */

const band = (lo: number, hi: number) => ({ lo, hi });

describe('computeStability', () => {
  it('구간 중앙 = 정확히 1 (완전 안정)', () => {
    expect(computeStability(1.0, band(0.8, 1.2), 2)).toBe(1);
    // 스케일 무관 — 다른 구간 중앙도 1
    expect(computeStability(2.5, band(2.0, 3.0), 2)).toBe(1);
  });

  it('폭 0 또는 역전 구간 = 0 (0 나눗셈 방지)', () => {
    expect(computeStability(1.0, band(1.0, 1.0), 2)).toBe(0); // half = 0
    expect(computeStability(1.0, band(1.2, 0.8), 2)).toBe(0); // half < 0 (lo>hi)
  });

  it('구간 경계 = 1/(1+(1/falloff)²) — 경계에서 0이 아니다', () => {
    // falloff=2, half=0.2 → dd=0.2/0.2/2=0.5 → 1/(1+0.25)=0.8
    expect(computeStability(1.2, band(0.8, 1.2), 2)).toBeCloseTo(0.8, 10); // hi 경계
    expect(computeStability(0.8, band(0.8, 1.2), 2)).toBeCloseTo(0.8, 10); // lo 경계
    // 스케일 무관 — half=0.5라도 경계값 동일
    expect(computeStability(3.0, band(2.0, 3.0), 2)).toBeCloseTo(0.8, 10);
  });

  it('정규화 거리 = falloff 지점에서 안정도 0.5 (constants 주석 계약)', () => {
    // 정규화 거리 D=|speed-center|/half. D=falloff일 때 dd=1 → 0.5.
    // falloff=2, half=0.2 → |Δ|=2*0.2=0.4 → speed=1.4
    expect(computeStability(1.4, band(0.8, 1.2), 2)).toBeCloseTo(0.5, 10);
  });

  it('중앙 대칭 — 같은 거리면 위/아래 동일', () => {
    const b = band(0.8, 1.2);
    expect(computeStability(0.9, b, 2)).toBeCloseTo(computeStability(1.1, b, 2), 12);
    expect(computeStability(0.6, b, 2)).toBeCloseTo(computeStability(1.4, b, 2), 12);
  });

  it('중앙에서 멀어질수록 단조 감소', () => {
    const b = band(0.8, 1.2);
    const speeds = [1.0, 1.05, 1.1, 1.2, 1.4, 2.0, 5.0];
    const vals = speeds.map((s) => computeStability(s, b, 2));
    for (let i = 1; i < vals.length; i++) {
      expect(vals[i]).toBeLessThan(vals[i - 1]);
    }
  });

  it('항상 [0,1] — 극단 입력에서도 발산/음수 없음', () => {
    const b = band(0.8, 1.2);
    for (const s of [-1000, -1, 0, 0.5, 1, 1.5, 1000]) {
      const v = computeStability(s, b, 2);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    // 아주 먼 속도 → 0에 수렴하되 양수 유지 (|speed| abs 적용)
    expect(computeStability(1000, b, 2)).toBeGreaterThan(0);
    expect(computeStability(1000, b, 2)).toBeLessThan(1e-3);
  });

  it('falloff ↑ → 같은 거리에서 더 따뜻 (warm zone 확대)', () => {
    const b = band(0.8, 1.2);
    const narrow = computeStability(1.1, b, 1); // dd=0.5 → 0.8
    const wide   = computeStability(1.1, b, 2); // dd=0.25 → ~0.941
    expect(wide).toBeGreaterThan(narrow);
    expect(narrow).toBeCloseTo(0.8, 10);
  });

  it('실제 STABILITY_FALLOFF 상수와 정합 — 중앙=1, 경미한 이탈은 따뜻 유지', () => {
    const f = GAME_CONSTANTS.STABILITY_FALLOFF; // 1.3
    const b = band(0.8, 1.2);
    expect(computeStability(1.0, b, f)).toBe(1);
    // 중앙에서 half의 절반(0.1) 이탈 → 여전히 따뜻(>0.8)
    expect(computeStability(1.1, b, f)).toBeGreaterThan(0.8);
  });
});
