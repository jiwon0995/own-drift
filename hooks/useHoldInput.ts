'use client';

import { useEffect, useRef } from 'react';

/**
 * 홀드 입력 추상화 — Spacebar(데스크톱) + 포인터/터치(모바일) 공통.
 *
 * - key repeat 가드: keydown이 반복 발화해도 holding은 한 번만 true로 전환.
 * - 포인터: pointerdown→누름 / pointerup·pointercancel→뗌. 마우스·터치·펜 통합.
 *   멀티터치는 활성 포인터 집합으로 추적 — 한 손가락을 떼도 다른 손가락이 남아있으면 holding 유지.
 * - 버튼/링크 위의 포인터다운은 무시 — 타이틀 '내딛기'·음소거 토글 같은 UI 탭이 홀드로 새지 않게.
 *   (touch-action:none·select-none은 Shell <main>이 담당 — 더블탭 줌·선택·드리프트 취소 방지.)
 * - preventDefault: 스페이스바 스크롤 방지.
 * - blur / visibilitychange: 포커스 잃을 때 강제 release (holding stuck 방지).
 *
 * @returns holdingRef  현재 홀드 여부를 담은 ref (per-frame 읽기용, 렌더 트리거 X)
 */
export function useHoldInput(): React.RefObject<boolean> {
  const holdingRef = useRef(false);

  useEffect(() => {
    // 활성 포인터 집합 — 멀티터치에서 "아직 누르고 있는" 포인터 추적. size>0 == holding.
    const activePointers = new Set<number>();

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

    function onPointerDown(e: PointerEvent) {
      // UI(버튼·링크·입력) 탭은 홀드로 취급하지 않음 — 그쪽 클릭 핸들러에 맡긴다.
      if ((e.target as Element | null)?.closest('button, a, input, [role="button"]')) return;
      activePointers.add(e.pointerId);
      holdingRef.current = true;
    }

    function onPointerUp(e: PointerEvent) {
      activePointers.delete(e.pointerId);
      if (activePointers.size === 0) holdingRef.current = false;
    }

    function release() {
      activePointers.clear();
      holdingRef.current = false;
    }

    function onVisibility() {
      if (document.hidden) release();
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return holdingRef;
}
