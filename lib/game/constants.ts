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

  /**
   * Title 화면 ambient 주행 속도.
   * Spacebar 입력 없이 고정. MIN_SPEED보다 살짝 높아 배경이 은근히 흐른다.
   */
  TITLE_AMBIENT_SPEED: 0.45,

  /** Tutorial fast 스텝: 이 시간(초) 동안 홀드하면 slow로 전환. */
  TUTORIAL_FAST_HOLD_SEC: 1.5,

  /** Tutorial slow 스텝: 이 시간(초) 동안 릴리스(비홀드) 상태면 done으로 전환. */
  TUTORIAL_SLOW_RELEASE_SEC: 5.0,

  /** 튜토리얼 스텝당 폴백 타임아웃(초). 조작 없어도 이 시간 후 자동 진행. */
  TUTORIAL_FALLBACK_SEC: 9,

  /** done 문구 노출 후 FindPace로 자동 전진하는 지연(ms). */
  TUTORIAL_DONE_DELAY_MS: 2500,

  /**
   * 러너 상하 바운스 진폭 (스프라이트 로컬 px).
   * GameStage에서 scale(3) 적용되므로 1px = 화면 3px.
   */
  RUNNER_BOUNCE_PX: 1,

  // ── Phase 2A: Find Pace 안착 게이지 ────────────────────────────────

  /** 안착 중 게이지 충전 속도 (단위/s). ANCHOR_GAUGE_FULL / 이 값 = 가득 채우는 시간. */
  ANCHOR_FILL_RATE: 0.35,

  /** 불안정 시 게이지 방전 속도 (단위/s). */
  ANCHOR_DRAIN_RATE: 0.5,

  /** 게이지 최대치. 이 값에 도달하면 myPace 확정. */
  ANCHOR_GAUGE_FULL: 1.0,

  /**
   * 안착 민감도 — emaDev 이 값 이하면 "안착 중".
   * 높이면 느슨하게(쉽게 안착), 낮추면 엄격하게.
   */
  STABILITY_WINDOW: 0.08,

  /** 속도 EMA 시상수 (초). 클수록 느리게 추적. */
  EMA_TAU: 0.4,

  /** myPace 기준 band 허용 범위 (±비율). 0.15 = ±15%. */
  TOLERANCE: 0.15,

  /** isInBand 히스테리시스 마진. enter/exit 임계 분리에 사용. */
  HYSTERESIS_MARGIN: 0.02,

  /**
   * 극단 속도 패널티 구간 — MIN/MAX로부터 이 비율 이내면 충전 속도 감소.
   * 0.15 = 속도 범위의 양 끝 15%에서 살짝 더디게.
   */
  EXTREME_EDGE: 0.15,
} as const;

export type GameConstants = typeof GAME_CONSTANTS;
