/** 인앱 화면 식별자 — useScreenFlow 전환 키 */
export type Screen =
  | 'title'
  | 'tutorial'
  | 'findPace'
  | 'mainPlay'
  | 'return'        // 1/2/3번째 찾음 (회차는 stabilizedCount로 구분)
  | 'clear'         // 속도 찾음 (인정)
  | 'continueOrEnd' // 계속 / 오늘은 여기까지
  | 'ending';       // 당신의 풍경

/** 속도 (단위: units/s, abstract). 항상 > 0 — 완전 정지 없음. */
export type Speed = number;

/** 게임 페이즈 최소 enum — Phase 1A 루프 코어 범위만 정의 */
export enum GamePhase {
  Idle   = 'idle',   // 루프 미시작
  Active = 'active', // 루프 구동 중
}

/** rAF 루프 한 프레임의 순간 상태 (ref 기반, React 렌더 X) */
export interface LoopState {
  speed:        Speed;
  scrollOffset: number;
  holding:      boolean;
}

/** useGameLoop 반환: UI 표시용 스로틀 스냅샷 */
export interface LoopSnapshot {
  speed:             Speed;
  phase:             GamePhase;
  holding:           boolean;
  gaugeProgress:     number;   // 안착 게이지 0..ANCHOR_GAUGE_FULL (Find Pace)
  emaSpeed:          number;   // slow EMA 속도 — myPace 확정 시 사용
  stabilityProgress: number;   // 안정 게이지 0..STABILITY_GAUGE_FULL (Main Play)
  inBand:            boolean;  // 현재 속도가 내 구간 안인지 (히스테리시스 적용)
  stabilizations:    number;   // 누적 안정 횟수 (게이지 가득 이벤트, 단조 증가) — 2C 카운트용
}

// ── 안착 게이지 내부 상태 (ref, rAF 루프) ──────────────────────────────

/**
 * 안착 게이지 전체 상태 — 입력 리듬(누름/뗌 지속시간의 반복성)을 추적한다.
 *
 * "내 속도 = 내가 반복할 수 있는 on/off 리듬." 같은 패턴을 반복할수록 충전.
 */
export interface AnchorGaugeState {
  progress:       number;   // 충전량 0..ANCHOR_GAUGE_FULL
  emaSpeed:       number;   // raw 속도 slow EMA — myPace 값 산출용

  prevHolding:    boolean;  // 직전 프레임 holding (전환 감지)
  segmentTime:    number;   // 현재 누름/뗌 세그먼트 경과 시간
  emaHold:        number;   // 평소 누름 지속시간 (0 = 미관측)
  emaRelease:     number;   // 평소 뗌 지속시간 (0 = 미관측)
  matchScore:     number;   // 0..1 최근 비트들의 리듬 일치도
  scoredSegments: number;   // 채점된 세그먼트 수 (warmup gate)
  unstableTime:   number;   // 저조 일치 지속 시간 (grace 판정)
}

export interface AnchorConstants {
  ANCHOR_FILL_RATE:       number;
  ANCHOR_DRAIN_RATE:      number;
  ANCHOR_GAUGE_FULL:      number;
  EMA_TAU:                number;
  RHYTHM_BEAT_KICK:       number;
  RHYTHM_TOLERANCE:       number;
  RHYTHM_MATCH_THRESHOLD: number;
  RHYTHM_STUCK_FACTOR:    number;
  RHYTHM_STUCK_DECAY:     number;
  RHYTHM_MAX_SEGMENT:     number;
  RHYTHM_MIN_SEGMENT:     number;
  RHYTHM_WARMUP:          number;
  DURATION_ALPHA:         number;
  MATCH_ALPHA:            number;
  STABILITY_GRACE:        number;
}

/** stepStabilityGauge 튜닝값 — 구조적 부분 집합 */
export interface StabilityConstants {
  STABILITY_FILL_RATE:   number;
  STABILITY_REVERT_RATE: number;
  STABILITY_GAUGE_FULL:  number;
}

// ── 내 속도 / 구간 ────────────────────────────────────────────────────

export interface Band {
  lo: number;
  hi: number;
}

/** FindPace 완료 후 저장되는 게임 상태 */
export interface PaceState {
  myPace: number;
  band:   Band;
}

/** isInBand 히스테리시스 상태 — enter/exit 임계 분리 */
export interface HysteresisState {
  inBand: boolean;
}
