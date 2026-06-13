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

/**
 * 다른 존재(Phase 2C)의 끌어당김 — 위로 향하는 *약한* 드리프트 속도를 반환.
 *
 * **1A stepSpeed와 완전 분리.** 루프에서 stepSpeed(입력) 결과에 이 값을 더해 합성한다.
 * - 존재가 앞설 때(presenceSpeed > currentSpeed)만 작동, 따라잡으면 0 → "쫓아도 보상 0".
 * - strength(PULL_STRENGTH) < DECEL 이면 릴리스 감속이 항상 이겨 **저항 가능**(강제 아님).
 * - presenceSpeed를 넘겨 끌어올리지 않음(드리프트 상한).
 *
 * @returns 이번 프레임에 더할 드리프트 속도 (≥ 0)
 */
export function applyPresencePull(
  currentSpeed: number,
  presenceSpeed: number,
  strength: number,
  dt: number,
): number {
  if (currentSpeed >= presenceSpeed) return 0;
  return Math.min(strength * dt, presenceSpeed - currentSpeed);
}
