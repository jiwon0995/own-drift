'use client';

import { useState }       from 'react';
import GameStage          from '@/components/game/GameStage';
import ScreenRouter       from '@/components/screens/ScreenRouter';
import { useScreenFlow }  from '@/hooks/useScreenFlow';
import { GAME_CONSTANTS } from '@/lib/game/constants';
import type { PaceState } from '@/lib/game/types';

export default function HomePage() {
  const { screen, advance, goTo }     = useScreenFlow('title');
  const [paceState, setPaceState]     = useState<PaceState | null>(null);
  const [returnIndex, setReturnIndex] = useState(1);

  function handlePaceSet(pace: PaceState) {
    setPaceState(pace);
    advance(); // findPace → mainPlay
  }

  function handleStabilized() {
    // 저수준 이벤트 훅(루프가 게이지 리셋). 회차 카운트는 onEncounterStabilized가 담당.
  }

  function handleCleared() {
    // 2C 저수준 이벤트. Phase 3 흐름은 onEncounterStabilized(count===3)로 Clear를 연다.
  }

  // 인카운터 1회 안정 → 회차별 Return
  function handleEncounterStabilized(count: number) {
    setReturnIndex(count);
    goTo('return');
  }

  // Return dwell 후 → 3회 미만이면 다음 인카운터(MainPlay), 3회면 Clear
  function handleReturnDone() {
    goTo(returnIndex >= GAME_CONSTANTS.REQUIRED_STABILIZATIONS ? 'clear' : 'mainPlay');
  }

  function handleClearDone() {
    goTo('continueOrEnd');
  }

  function handleContinue() {
    setReturnIndex(1);
    goTo('mainPlay'); // 자유(평온) 주행 복귀
  }

  function handleEnd() {
    goTo('ending');
  }

  function handleSave() {
    // Phase 6: canvas 캡처 → 이미지 저장. 지금은 stub.
  }

  function handleRestart() {
    setPaceState(null);
    setReturnIndex(1);
    goTo('title'); // 처음부터 다시
  }

  return (
    <GameStage
      screen={screen}
      ambient={screen === 'title'}
      band={paceState?.band ?? null}
      onStabilized={handleStabilized}
    >
      <ScreenRouter
        screen={screen}
        onAdvance={advance}
        onPaceSet={handlePaceSet}
        onCleared={handleCleared}
        returnIndex={returnIndex}
        onEncounterStabilized={handleEncounterStabilized}
        onReturnDone={handleReturnDone}
        onClearDone={handleClearDone}
        onContinue={handleContinue}
        onEnd={handleEnd}
        onSave={handleSave}
        onRestart={handleRestart}
      />
    </GameStage>
  );
}
