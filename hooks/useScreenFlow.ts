'use client';

import { useState, useCallback } from 'react';
import type { Screen } from '@/lib/game/types';

/**
 * 허용 전환 맵 — 데이터화.
 * Phase 3에서 새 화면 추가 시 이 맵만 확장.
 */
const TRANSITIONS: Partial<Record<Screen, Screen>> = {
  title:    'tutorial',
  tutorial: 'findPace',
  // findPace: undefined — 터미널 화면
};

interface UseScreenFlowReturn {
  screen:  Screen;
  /** 지정 화면으로 이동. TRANSITIONS 외 전환도 허용(Phase 3 직접 점프용). */
  goTo:    (next: Screen) => void;
  /** TRANSITIONS 맵 순서대로 다음 화면으로 전진. 터미널이면 no-op. */
  advance: () => void;
}

export function useScreenFlow(initial: Screen = 'title'): UseScreenFlowReturn {
  const [screen, setScreen] = useState<Screen>(initial);

  const goTo = useCallback((next: Screen) => setScreen(next), []);

  const advance = useCallback(() => {
    setScreen(current => TRANSITIONS[current] ?? current);
  }, []);

  return { screen, goTo, advance };
}
