'use client';

/**
 * Tutorial 화면 오버레이 — fast → slow → done 3단계 서브 상태기.
 *
 * - fast: Spacebar 홀드 시간 누적 → TUTORIAL_FAST_HOLD_SEC 도달 시 slow
 * - slow: 비홀드(릴리스) 시간 누적 → TUTORIAL_SLOW_RELEASE_SEC 도달 시 done
 * - done: 짧은 지연 후 onAdvance() → FindPace
 * - 각 스텝마다 TUTORIAL_FALLBACK_SEC 폴백 타임아웃 (행동 없어도 자동 진행)
 * - 실패/재시도 없음. 말풍선만 바뀜.
 */

import { useEffect, useReducer, useRef } from 'react';
import { GAME_CONSTANTS } from '@/lib/game/constants';
import { tutorialStepCopy, type TutorialStep } from '@/lib/content/copy';
import { useGameStage } from '@/components/game/GameStage';
import { useIsTouch } from '@/hooks/useIsTouch';
import SpeechBubble from '@/components/game/SpeechBubble';

const {
  TUTORIAL_FAST_HOLD_SEC,
  TUTORIAL_SLOW_RELEASE_SEC,
  TUTORIAL_FALLBACK_SEC,
  TUTORIAL_DONE_DELAY_MS,
  UI_THROTTLE_MS,
} = GAME_CONSTANTS;

// ── 서브 상태기 ─────────────────────────────────────────────────────────
type TutState = { step: TutorialStep };
type TutAction = { type: 'NEXT' };

function nextStep(s: TutorialStep): TutorialStep {
  if (s === 'fast') return 'slow';
  if (s === 'slow') return 'done';
  return 'done';
}

function reducer(state: TutState, action: TutAction): TutState {
  if (action.type === 'NEXT') return { step: nextStep(state.step) };
  return state;
}

// ── 컴포넌트 ────────────────────────────────────────────────────────────
export default function TutorialScreen({ onAdvance }: { onAdvance: () => void }) {
  const { snapshot } = useGameStage();
  const touch = useIsTouch();
  const stepCopy = tutorialStepCopy(touch);
  const [{ step }, dispatch] = useReducer(reducer, { step: 'fast' });

  const accRef     = useRef(0);
  const prevStepRef = useRef<TutorialStep>('fast');
  const onAdvanceRef = useRef(onAdvance);
  useEffect(() => { onAdvanceRef.current = onAdvance; }, [onAdvance]);

  // 누적 시간 — 스냅샷 변경마다 (~UI_THROTTLE_MS) 실행
  useEffect(() => {
    // 스텝 변경 시 누적 리셋, 해당 사이클은 건너뜀
    if (prevStepRef.current !== step) {
      accRef.current = 0;
      prevStepRef.current = step;
      return;
    }

    if (step === 'done') return;

    const dt = UI_THROTTLE_MS / 1000;

    if (step === 'fast' && snapshot.holding) {
      accRef.current += dt;
      if (accRef.current >= TUTORIAL_FAST_HOLD_SEC) dispatch({ type: 'NEXT' });
    } else if (step === 'slow' && !snapshot.holding) {
      accRef.current += dt;
      if (accRef.current >= TUTORIAL_SLOW_RELEASE_SEC) dispatch({ type: 'NEXT' });
    }
  }, [snapshot, step]);

  // 폴백 타임아웃 — 행동이 없어도 자동 진행
  useEffect(() => {
    if (step === 'done') return;
    const id = setTimeout(() => dispatch({ type: 'NEXT' }), TUTORIAL_FALLBACK_SEC * 1000);
    return () => clearTimeout(id);
  }, [step]);

  // done → FindPace 자동 전진
  useEffect(() => {
    if (step !== 'done') return;
    const id = setTimeout(() => onAdvanceRef.current(), TUTORIAL_DONE_DELAY_MS);
    return () => clearTimeout(id);
  }, [step]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute left-0 right-0 flex justify-center px-8"
        style={{ top: 260, zIndex: 10 }}
      >
        <SpeechBubble key={`${step}-${touch}`} text={stepCopy[step].bubble} speed={48} />
      </div>
    </div>
  );
}
