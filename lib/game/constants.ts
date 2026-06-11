/**
 * 튜닝 파라미터 — 모든 수치는 여기서만 조정한다 (GDD §11 기준).
 *
 * Speed 단위: units/s (추상).  1 unit ≈ "편안한 걷기 속도".
 * BG_SCROLL_PX_PER_UNIT: 속도 1 unit → 배경이 초당 몇 px 이동할지.
 */
export const GAME_CONSTANTS = {
  /** 자동 전진 바닥 속도. 홀드를 완전히 놓아도 이 속도 이하로 내려가지 않는다. */
  MIN_SPEED: 0.3,

  /** Spacebar 홀드 시 도달 가능한 최대 속도. */
  MAX_SPEED: 2.5,

  /** 게임 시작 초기 속도. */
  START_SPEED: 0.6,

  /** 홀드 중 가속도 (units/s²). 크게 할수록 빠르게 MAX에 도달. */
  ACCEL: 1.5,

  /** 릴리스 후 감속도 (units/s²). 크게 할수록 MIN으로 빨리 복귀. */
  DECEL: 1.0,

  /**
   * 프레임 dt 캡 (초).
   * 탭 전환·백그라운드 복귀 시 누적된 큰 dt가 들어와
   * 속도가 순간 점프하는 현상을 막는다.
   */
  MAX_DT: 0.1,

  /**
   * 속도 → 배경 스크롤 픽셀 변환 계수.
   * scrollOffset += speed * dt * BG_SCROLL_PX_PER_UNIT
   */
  BG_SCROLL_PX_PER_UNIT: 120,

  /** UI 스냅샷 스로틀 간격 (ms). 디버그 HUD 리렌더 빈도. */
  UI_THROTTLE_MS: 100,
} as const;

export type GameConstants = typeof GAME_CONSTANTS;
