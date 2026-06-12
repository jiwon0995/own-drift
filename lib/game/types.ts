/** 인앱 화면 식별자 — useScreenFlow 전환 키 */
export type Screen = 'title' | 'tutorial' | 'findPace' | 'mainPlay';

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
  speed:         Speed;
  phase:         GamePhase;
  holding:       boolean;
  gaugeProgress: number;   // 안착 게이지 0..ANCHOR_GAUGE_FULL
}

// ── 안착 게이지 내부 상태 (ref, rAF 루프) ──────────────────────────────

/** 속도 EMA 추적 상태 */
export interface StabilityState {
  emaSpeed: number;  // 속도 지수이동평균
  emaDev:   number;  // |speed - ema| 지수이동평균 (변동폭 추적)
}

/** 안착 게이지 전체 상태 */
export interface AnchorGaugeState {
  progress:  number;         // 충전량 0..ANCHOR_GAUGE_FULL
  stability: StabilityState;
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
