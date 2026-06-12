'use client';

import type { Screen, PaceState } from '@/lib/game/types';
import GameStage       from '@/components/game/GameStage';
import TitleScreen     from './TitleScreen';
import TutorialScreen  from './TutorialScreen';
import FindPaceScreen  from './FindPaceScreen';
import MainPlayScreen  from './MainPlayScreen';

interface ScreenRouterProps {
  screen:     Screen;
  onAdvance:  () => void;
  paceState:  PaceState | null;
  onPaceSet:  (pace: PaceState) => void;
}

export default function ScreenRouter({
  screen,
  onAdvance,
  paceState,
  onPaceSet,
}: ScreenRouterProps) {
  const isAmbient = screen === 'title';

  return (
    <GameStage ambient={isAmbient}>
      {screen === 'title'    && <TitleScreen    onAdvance={onAdvance} />}
      {screen === 'tutorial' && <TutorialScreen onAdvance={onAdvance} />}
      {screen === 'findPace' && <FindPaceScreen onPaceSet={onPaceSet} />}
      {screen === 'mainPlay' && <MainPlayScreen paceState={paceState} />}
    </GameStage>
  );
}
