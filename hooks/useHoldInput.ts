'use client';

import { useEffect, useRef } from 'react';

/**
 * Spacebar 홀드 입력 추상화.
 *
 * - key repeat 가드: keydown이 반복 발화해도 holding은 한 번만 true로 전환.
 * - preventDefault: 스페이스바 스크롤 방지.
 * - blur / visibilitychange: 포커스 잃을 때 강제 release (holding stuck 방지).
 * - 추후 pointerdown/up(터치) 이식: holdingRef를 공유하는 구조로 분리됨.
 *
 * @returns holdingRef  현재 홀드 여부를 담은 ref (per-frame 읽기용, 렌더 트리거 X)
 */
export function useHoldInput(): React.RefObject<boolean> {
  const holdingRef = useRef(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (e.repeat) return; // key repeat 가드
      holdingRef.current = true;
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.code !== 'Space') return;
      holdingRef.current = false;
    }

    function release() {
      holdingRef.current = false;
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) release();
    });

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', release);
    };
  }, []);

  return holdingRef;
}
