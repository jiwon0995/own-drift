'use client';

import { useState, useCallback } from 'react';
import type { Screen } from '@/lib/game/types';

const TRANSITIONS: Partial<Record<Screen, Screen>> = {
  title:     'tutorial',
  tutorial:  'findPace',
  findPace:  'mainPlay',
};

interface UseScreenFlowReturn {
  screen:  Screen;
  goTo:    (next: Screen) => void;
  advance: () => void;
}

export function useScreenFlow(initial: Screen = 'title'): UseScreenFlowReturn {
  const [screen, setScreen] = useState<Screen>(initial);
  const goTo    = useCallback((next: Screen) => setScreen(next), []);
  const advance = useCallback(() => {
    setScreen(current => TRANSITIONS[current] ?? current);
  }, []);
  return { screen, goTo, advance };
}
