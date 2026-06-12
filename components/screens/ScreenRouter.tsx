'use client';

/**
 * 오버레이 라우터.
 * GameStage(배경+러너)를 항상 렌더하고, 화면별 UI를 children으로 얹는다.
 * Phase 3에서 케이스 추가 — GameStage는 건드리지 않아도 됨.
 */

import type { Screen } from '@/lib/game/types';
import GameStage      from '@/components/game/GameStage';
import TitleScreen    from './TitleScreen';
import TutorialScreen from './TutorialScreen';
import FindPaceScreen from './FindPaceScreen';

interface ScreenRouterProps {
  screen:    Screen;
  onAdvance: () => void;
}

export default function ScreenRouter({ screen, onAdvance }: ScreenRouterProps) {
  // Title만 ambient(입력 무시, 고정 속도). 이후 화면은 정상 입력.
  const isAmbient = screen === 'title';

  return (
    <GameStage ambient={isAmbient}>
      {screen === 'title'    && <TitleScreen    onAdvance={onAdvance} />}
      {screen === 'tutorial' && <TutorialScreen onAdvance={onAdvance} />}
      {screen === 'findPace' && <FindPaceScreen />}
    </GameStage>
  );
}
