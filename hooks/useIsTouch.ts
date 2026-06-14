'use client';

import { useSyncExternalStore } from 'react';

/**
 * 주 입력이 터치인지 감지 — 모바일/태블릿 안내 문구 분기용.
 *
 * matchMedia는 외부 스토어라 useSyncExternalStore로 구독한다 (effect+setState 캐스케이딩 렌더 회피).
 * '(hover: none) and (pointer: coarse)' = 호버 불가 + 굵은 포인터 → 마우스 없는 터치 1차 디바이스.
 * SSR·첫 렌더는 false(데스크톱 가정), hydration 직후 실제 값으로 동기화된다.
 */
const QUERY = '(hover: none) and (pointer: coarse)';

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;
const getServerSnapshot = () => false;

export function useIsTouch(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
