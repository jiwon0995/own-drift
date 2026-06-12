/** 인앱 화면 식별자 — useScreenFlow 전환 키 */
export type Screen = 'title' | 'tutorial' | 'findPace';

/** 속도 (단위: units/s, abstract). 항상 > 0 — 완전 정지 없음. */
export type Speed = number;

/** 게임 페이즈 최소 enum — Phase 1A 루프 코어 범위만 정의 */
export enum GamePhase {
  Idle   = 'idle',   // 루프 미시작
  Active = 'active', // 루프 구동 중
}

/** rAF 루프 한 프레임의 순간 상태 (ref 기반, React 렌더 X) */
export interface LoopState {
  speed:        Speed;   // 현재 속도
  scrollOffset: number;  // 배경 누적 스크롤 픽셀
  holding:      boolean; // Spacebar 홀드 여부
}

/** useGameLoop 반환: UI 표시용 스로틀 스냅샷 */
export interface LoopSnapshot {
  speed:   Speed;
  phase:   GamePhase;
  holding: boolean;
}
