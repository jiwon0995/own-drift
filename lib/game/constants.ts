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
  ACCEL: 1.0,

  /** 릴리스 후 감속도 (units/s²). 크게 할수록 MIN으로 빨리 복귀. */
  DECEL: 0.5,

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
  TUTORIAL_FAST_HOLD_SEC: 3.0,

  /** Tutorial slow 스텝: 이 시간(초) 동안 릴리스(비홀드) 상태면 done으로 전환. */
  TUTORIAL_SLOW_RELEASE_SEC: 3.0,

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

  /** 그루브(리듬 일치) 유지 시 연속 충전 속도 (단위/s) — 천천히 차오르는 크리프. */
  ANCHOR_FILL_RATE: 0.12,

  /** 리듬이 깨졌을 때 방전 속도 (단위/s). */
  ANCHOR_DRAIN_RATE: 0.18,

  /** 비트(누름/뗌)마다 일치도에 따라 게이지를 즉각 가감하는 양 — on/off 연동감의 핵심. */
  RHYTHM_BEAT_KICK: 0.05,

  /** 누름/뗌 지속시간 상대 오차 허용폭. 0.45 = 평소의 ±45%까지 같은 리듬으로 인정. */
  RHYTHM_TOLERANCE: 0.45,

  /** matchScore가 이 값 이상이어야 연속 충전. 미만이면 유예 후 방전. */
  RHYTHM_MATCH_THRESHOLD: 0.5,

  /** 현재 세그먼트가 평소의 N배 넘게 길면 '멈춤' — 무한 홀드/장기 정지 차단. */
  RHYTHM_STUCK_FACTOR: 2.0,

  /** 멈춤 감지 시 matchScore 감쇠 속도 (단위/s). */
  RHYTHM_STUCK_DECAY: 1.5,

  /** 이보다 긴 누름/뗌은 리듬이 아니라 '탐색 멈춤'으로 보고 무시 (초). */
  RHYTHM_MAX_SEGMENT: 3.5,

  /** 이보다 짧은 토글은 채터로 보고 무시 (초). */
  RHYTHM_MIN_SEGMENT: 0.08,

  /** 채점된 세그먼트가 이 수 이상이어야 충전 시작 (리듬 워밍업). */
  RHYTHM_WARMUP: 2,

  /** emaHold/emaRelease per-beat 평활 계수. 클수록 최근 비트에 빠르게 적응. */
  DURATION_ALPHA: 0.4,

  /** matchScore per-beat 평활 계수. */
  MATCH_ALPHA: 0.5,

  /** 저조한 일치가 이 시간(초) 지속돼야 방전 — 한두 박 어긋남 흡수. */
  STABILITY_GRACE: 0.6,

  /** 게이지 최대치. 이 값에 도달하면 myPace 확정. */
  ANCHOR_GAUGE_FULL: 1.0,

  /**
   * 속도 slow EMA 시상수 (초). myPace 값(리듬의 평균 속도) 산출용.
   * 여러 on/off 사이클을 평균내므로 크게 설정해 개별 입력에 덜 흔들리게 한다.
   */
  EMA_TAU: 3.0,

  /** myPace 기준 band 허용 범위 (±비율). 0.15 = ±15%. */
  TOLERANCE: 0.15,

  /** isInBand 히스테리시스 마진. enter/exit 임계 분리에 사용. */
  HYSTERESIS_MARGIN: 0.02,
} as const;

export type GameConstants = typeof GAME_CONSTANTS;
