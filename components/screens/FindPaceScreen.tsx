'use client';

/**
 * Find Pace 화면 오버레이.
 *
 * - 마운트 시 resetAnchor → 게이지 0 재초기화
 * - 아무 속도든 일정한 on/off 리듬을 반복하면 게이지 충전 (타깃 없음)
 * - 게이지 가득(ANCHOR_GAUGE_FULL) → 현재 평균 속도를 myPace로 확정 → band 산출 → onPaceSet
 * - 실패/오답 없음. 대신 상황별 유도 힌트로 길을 열어준다:
 *     · 입력 없이 머물면(idle)        → 달려보라고 권유
 *     · 계속 누르고만 있으면(held)     → 떼보라고 권유
 *     · 시도하는데 못 채우면(how-to)   → 단계별 방법 안내
 */

import { useEffect, useRef, useState } from 'react';
import { GAME_CONSTANTS }       from '@/lib/game/constants';
import { SCREEN_COPY, FIND_PACE_HINTS } from '@/lib/content/copy';
import { computeBand }          from '@/lib/game/pace';
import type { PaceState }       from '@/lib/game/types';
import { useGameStage }         from '@/components/game/GameStage';
import SpeechBubble             from '@/components/game/SpeechBubble';
import StabilityGauge           from '@/components/game/StabilityGauge';

const {
  ANCHOR_GAUGE_FULL,
  TOLERANCE,
  FINDPACE_HINT_IDLE_SEC,
  FINDPACE_HINT_STAGE1_SEC,
  FINDPACE_HINT_STAGE2_SEC,
  FINDPACE_HINT_STAGE3_SEC,
  FINDPACE_HINT_PROGRESS_GATE,
  FINDPACE_HINT_HOLD_MS,
} = GAME_CONSTANTS;

const DEFAULT_HINT = { id: 'default', text: SCREEN_COPY.findPace.bubble };
const HOWTO_AT = [FINDPACE_HINT_STAGE1_SEC, FINDPACE_HINT_STAGE2_SEC, FINDPACE_HINT_STAGE3_SEC];

interface Hint { id: string; text: string }

interface FindPaceScreenProps {
  onPaceSet: (pace: PaceState) => void;
}

export default function FindPaceScreen({ onPaceSet }: FindPaceScreenProps) {
  const { snapshot, resetAnchor } = useGameStage();
  const [hint, setHint] = useState<Hint>(DEFAULT_HINT);

  // stable ref — onPaceSet이 바뀌어도 콜백이 최신값을 참조
  const onPaceSetRef = useRef(onPaceSet);
  useEffect(() => { onPaceSetRef.current = onPaceSet; }, [onPaceSet]);

  // 게이지 가득 감지 무장 플래그.
  // 리셋 후 게이지가 낮은 값을 한 번 본 뒤에만 true → Tutorial의 stale high값 오발화 차단.
  const armedRef = useRef(false);

  // 힌트 타이밍 추적 ref (스냅샷 스트림에서 재구성)
  const lastHoldingRef     = useRef<boolean>(false);
  const timeSinceToggleRef = useRef<number>(0);   // 마지막 입력 전환 후 경과(초)
  const elapsedRef         = useRef<number>(0);   // 화면 진입 후 누적(초)
  const lastTsRef          = useRef<number | null>(null);
  const committedAtRef     = useRef<number>(0);   // 마지막 힌트 변경 시각(ms)

  // 마운트 시 게이지 초기화
  useEffect(() => {
    resetAnchor();
  // resetAnchor는 useCallback([]) — 의존성 안정적
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 게이지 가득 감지 — myPace 확정
  useEffect(() => {
    // 리셋으로 낮아지면 무장, 가득 차면 발화
    if (snapshot.gaugeProgress < FINDPACE_HINT_PROGRESS_GATE) armedRef.current = true;
    if (armedRef.current && snapshot.gaugeProgress >= ANCHOR_GAUGE_FULL) {
      armedRef.current = false; // 재발화 방지
      const myPace = snapshot.emaSpeed; // 리듬의 평균 속도
      const band   = computeBand(myPace, TOLERANCE);
      onPaceSetRef.current({ myPace, band });
    }
  }, [snapshot]);

  // 상황별 힌트 — 스냅샷 갱신마다 타이밍 누적 후 목표 힌트 산출
  useEffect(() => {
    const now  = performance.now();
    const last = lastTsRef.current;
    lastTsRef.current = now;
    if (last === null) {                 // 첫 스냅샷: 기준만 잡고 종료
      lastHoldingRef.current = snapshot.holding;
      return;
    }
    const dt = (now - last) / 1000;

    // 입력 전환 추적
    if (snapshot.holding !== lastHoldingRef.current) {
      timeSinceToggleRef.current = 0;
      lastHoldingRef.current     = snapshot.holding;
    } else {
      timeSinceToggleRef.current += dt;
    }
    elapsedRef.current += dt;

    // 목표 힌트 결정
    const tst = timeSinceToggleRef.current;
    const el  = elapsedRef.current;
    const gp  = snapshot.gaugeProgress;

    let target: Hint = DEFAULT_HINT;
    if (tst > FINDPACE_HINT_IDLE_SEC) {
      // 전환 없이 오래 머묾 → 현재 상태에 맞는 권유
      target = snapshot.holding
        ? { id: 'held', text: FIND_PACE_HINTS.held }
        : { id: 'idle', text: FIND_PACE_HINTS.idle };
    } else if (gp < FINDPACE_HINT_PROGRESS_GATE) {
      // 시도 중인데 게이지가 거의 안 참 → 단계별 how-to
      if      (el >= HOWTO_AT[2]) target = { id: 'howto2', text: FIND_PACE_HINTS.howto[2] };
      else if (el >= HOWTO_AT[1]) target = { id: 'howto1', text: FIND_PACE_HINTS.howto[1] };
      else if (el >= HOWTO_AT[0]) target = { id: 'howto0', text: FIND_PACE_HINTS.howto[0] };
    }

    // 차분한 톤 — 최소 유지 시간 지난 뒤에만 교체
    setHint(prev => {
      if (target.id === prev.id) return prev;
      if (now - committedAtRef.current < FINDPACE_HINT_HOLD_MS) return prev;
      committedAtRef.current = now;
      return target;
    });
  }, [snapshot]);

  return (
    <div className="absolute inset-0 pointer-events-none">

      {/* 말풍선 — hint.text 변경 시 자동으로 다시 타이핑 */}
      <div
        className="absolute left-0 right-0 flex justify-center px-8"
        style={{ top: 160, zIndex: 10 }}
      >
        <SpeechBubble text={hint.text} speed={48} />
      </div>

      {/* 안착 게이지 */}
      <div
        className="absolute left-0 right-0 flex justify-center"
        style={{ bottom: 180, zIndex: 10 }}
      >
        <StabilityGauge
          progress={snapshot.gaugeProgress}
          full={ANCHOR_GAUGE_FULL}
        />
      </div>

    </div>
  );
}
