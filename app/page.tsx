'use client';

import { useState }          from 'react';
import Shell                 from '@/components/screens/Shell';
import ScreenRouter          from '@/components/screens/ScreenRouter';
import { useScreenFlow }     from '@/hooks/useScreenFlow';
import type { PaceState }    from '@/lib/game/types';

export default function HomePage() {
  const { screen, advance }            = useScreenFlow('title');
  const [paceState, setPaceState]      = useState<PaceState | null>(null);

  function handlePaceSet(pace: PaceState) {
    setPaceState(pace);
    advance(); // findPace → mainPlay
  }

  function handleStabilized() {
    // 안정 게이지 1회 가득 = "한 번 찾음". 저수준 이벤트 훅(루프가 게이지 리셋).
    // 카운트는 Main Play 인카운터가 snapshot.stabilizations로 직접 처리한다.
  }

  function handleCleared() {
    // 3회 안정 = 클리어. Phase 3: Clear/Continue/Ending 화면으로 전환되는 지점.
  }

  return (
    <Shell>
      <ScreenRouter
        screen={screen}
        onAdvance={advance}
        paceState={paceState}
        onPaceSet={handlePaceSet}
        onStabilized={handleStabilized}
        onCleared={handleCleared}
      />
    </Shell>
  );
}
