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

  return (
    <Shell>
      <ScreenRouter
        screen={screen}
        onAdvance={advance}
        paceState={paceState}
        onPaceSet={handlePaceSet}
      />
    </Shell>
  );
}
