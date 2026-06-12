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
    // 안정 게이지 1회 가득 = "한 번 찾음". 루프가 게이지를 리셋했고 Main Play는 평온 유지.
    // 2C: 여기서 3회 카운트 → 다른 존재 소멸/Clear 화면으로 이어진다.
  }

  return (
    <Shell>
      <ScreenRouter
        screen={screen}
        onAdvance={advance}
        paceState={paceState}
        onPaceSet={handlePaceSet}
        onStabilized={handleStabilized}
      />
    </Shell>
  );
}
