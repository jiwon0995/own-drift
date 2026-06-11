'use client';

import type { Screen } from '@/lib/game/types';
import TitleScreen    from './TitleScreen';
import TutorialScreen from './TutorialScreen';
import FindPaceScreen from './FindPaceScreen';

interface ScreenRouterProps {
  screen:  Screen;
  onAdvance: () => void;
}

/** 현재 Screen 값에 맞는 컴포넌트를 렌더한다. Phase 3에서 케이스 추가. */
export default function ScreenRouter({ screen, onAdvance }: ScreenRouterProps) {
  switch (screen) {
    case 'title':    return <TitleScreen    onAdvance={onAdvance} />;
    case 'tutorial': return <TutorialScreen onAdvance={onAdvance} />;
    case 'findPace': return <FindPaceScreen />;
  }
}
