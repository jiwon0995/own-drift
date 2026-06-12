import type { Speed } from './types';

/** stepSpeed에 필요한 튜닝값만 구조적으로 받음 — 리터럴 타입 전파 방지 */
export interface SpeedConstants {
  MIN_SPEED: number;
  MAX_SPEED: number;
  ACCEL:     number;
  DECEL:     number;
}

/**
 * 순수 함수 — 프레임 단위 속도 계산.
 *
 * React/DOM 의존 없음. 단위 테스트 가능.
 *
 * @param current  현재 속도 (units/s)
 * @param holding  Spacebar 홀드 여부
 * @param dt       경과 시간 (초). 호출 전 MAX_DT 캡 적용 권장.
 * @param c        튜닝 상수
 * @returns        다음 프레임 속도 (MIN_SPEED ≤ result ≤ MAX_SPEED)
 */
export function stepSpeed(
  current: Speed,
  holding: boolean,
  dt: number,
  c: SpeedConstants,
): Speed {
  const delta = holding ? c.ACCEL * dt : -(c.DECEL * dt);
  const next = current + delta;
  return Math.min(c.MAX_SPEED, Math.max(c.MIN_SPEED, next));
}
