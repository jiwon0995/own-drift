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

  /** 홀드 시 MAX로 수렴하는 비율(rate, 1/s). 1.0 = 시상수 1초. 크게 할수록 빠르게 MAX 접근. */
  ACCEL: 1.0,

  /** 릴리스 시 MIN으로 수렴하는 비율(rate, 1/s). 0.5 = 시상수 2초. 크게 할수록 빨리 MIN 복귀. */
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

  /**
   * myPace 기준 band 허용 범위 (±비율). 0.20 = ±20%.
   * 안정 판정은 slow EMA(평균 페이스)로 하지만, 느린 리듬일수록 EMA에도 리플이 남는다
   * (매우 느린 리듬 ≈ ±16%). 이를 덮고 차분하게 충전되도록 ±20%로 둔다.
   */
  TOLERANCE: 0.20,

  /** isInBand 히스테리시스 마진. enter/exit 임계 분리에 사용. */
  HYSTERESIS_MARGIN: 0.02,

  // ── Find Pace 유도 힌트 타이밍 ─────────────────────────────────────

  /** 입력 전환 없이 이 시간(초) 지나면 idle/held 힌트 노출. */
  FINDPACE_HINT_IDLE_SEC: 8.0,

  /** how-to 힌트 첫 노출 시점 (화면 진입 후 누적 초). idle/held(8s)보다 늦게 둬 충돌 방지. */
  FINDPACE_HINT_HOWTO_START_SEC: 10,

  /** how-to 힌트 단계 전환 간격 (초). 클수록 한 메시지를 더 오래 보여줌(읽을 시간). */
  FINDPACE_HINT_HOWTO_INTERVAL_SEC: 8,

  /** 게이지가 이 값 이상이면 how-to 유도 숨김 — 이미 방법을 찾은 것으로 간주. */
  FINDPACE_HINT_PROGRESS_GATE: 0.15,

  /** 힌트 최소 유지 시간(ms) — 읽을 시간 확보 + 깜빡임 방지(차분한 톤). */
  FINDPACE_HINT_HOLD_MS: 4500,

  // ── Phase 2B: 안정 게이지 (Main Play) ──────────────────────────────

  /** 내 구간(myPace±tol) 안에 있을 때 안정 게이지 충전 속도 (단위/s). FULL/이 값 = 채우는 시간. */
  STABILITY_FILL_RATE: 0.2,

  /**
   * 구간 이탈 시 되돌림 속도 (단위/s). 0 = 순수 멈춤(되돌림 없음).
   * 아주 작게 둬 "살짝 되돌림" — 0으로 clamp되어 음수·실패는 절대 없음.
   */
  STABILITY_REVERT_RATE: 0.05,

  /** 안정 게이지 최대치. 도달하면 onStabilized 발생 + 리셋. */
  STABILITY_GAUGE_FULL: 1.0,

  /** 상태 문구 최소 유지 시간(ms) — 경계에서 톡톡 바뀌어 재타이핑되는 깜빡임 방지. */
  STATUS_DEBOUNCE_MS: 2500,

  // ── Phase 2C: 다른 존재 (외부 압박) ────────────────────────────────

  /** Main Play 진입 후 첫 다른 존재 등장까지 평온 시간 (초). */
  FIRST_ENCOUNTER_DELAY: 6,

  /** 인카운터 사이 평온 복귀 시간 (초). */
  INTER_ENCOUNTER_CALM: 4,

  /**
   * 다른 존재가 내 페이스보다 얼마나 빠른지 (units/s 상대 리드).
   * 끌어당김 목표 = myPace + 이 값 → 어떤 플레이어든 "조금 앞선" 존재가 됨.
   */
  PRESENCE_APPROACH_SPEED: 0.4,

  /** 끌어당김 드리프트 세기 (units/s). DECEL보다 작아 릴리스로 항상 상쇄 가능(강제 아님). */
  PULL_STRENGTH: 0.25,

  /** 클리어에 필요한 안정(=한 번 찾음) 횟수. */
  REQUIRED_STABILIZATIONS: 3,

  /** OtherPresence 등장(접근) 애니메이션 시간 (ms). */
  PRESENCE_APPROACH_MS: 2600,

  /** OtherPresence 페이드(소멸) 시간 (ms). */
  PRESENCE_FADE_MS: 700,

  // ── Phase 3: 화면 흐름 ─────────────────────────────────────────────

  /** Return 화면 기본 dwell (ms, 1회차). INTER_ENCOUNTER_CALM보다 짧아 다음 등장 전에 닫힘. */
  RETURN_DWELL_BASE_MS: 2600,

  /** Return 회차당 dwell 증가 (ms) — 혼란→체화로 갈수록 길게(차분). */
  RETURN_DWELL_STEP_MS: 700,

  /** Clear 노출 후 ContinueOrEnd 자동 전환까지 (ms). */
  CLEAR_DWELL_MS: 4200,

  // ── Phase 4A: 상태 색 (연속 안정도 신호) ───────────────────────────

  /**
   * 안정도 falloff — band 중앙 기준 정규화 거리 d가 이 값일 때 안정도 0.5.
   * 1/(1+(d/falloff)²). 크게 할수록 넓게 따뜻(천천히 식음).
   */
  STABILITY_FALLOFF: 1.3,

  /** 안정도 신호 smoothing 시상수(초) — --stability 떨림 제거. 작을수록 빠르게 반응. */
  STABILITY_SMOOTHING: 0.35,
} as const;

export type GameConstants = typeof GAME_CONSTANTS;
