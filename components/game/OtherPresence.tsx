'use client';

/**
 * 다른 존재 (Phase 2C 최소판; 폴리싱 Phase 4).
 *
 * design-system/game-screens의 .other 이식:
 * - fig-other 색(#6b5a4e), opacity ~0.4, blur로 흐릿
 * - 러너와 같은 4프레임 스프라이트를 frame+2 오프셋(다른 위상)
 * - 뒤(왼쪽 아래)에서 다가와 플레이어를 조금 앞서 → leaving이면 스쳐 지나가며 페이드
 * - UI 크롬·순위·이름·체력바 일절 없음. 플레이어를 쳐다보거나 반응하지 않음.
 */

import { useEffect, useState } from 'react';
import { GAME_CONSTANTS } from '@/lib/game/constants';

const U = 5; // 픽셀 유닛 px (러너와 동일)

/** 4프레임 걷기 스프라이트 (러너와 동일 데이터, 위상만 다름) */
const RUN: [number, number][][] = [
  [[3,0],[2,1],[2,2],[1,3],[3,4]],
  [[3,0],[2,1],[2,2],[2,3],[2,4]],
  [[3,0],[2,1],[2,2],[3,3],[1,4]],
  [[3,0],[2,1],[2,2],[2,3],[2,4]],
];

function buildShadow(pixels: [number, number][], color: string): string {
  return pixels.map(([x, y]) => `${x * U}px ${y * U}px 0 ${color}`).join(', ');
}

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 러너 기준 가로 오프셋(px, 스케일 전): 뒤 → 조금 앞 → 스쳐 지나간 뒤
const BEHIND_X = -70;
const AHEAD_X  = 46;
const FAR_X    = 130;

interface OtherPresenceProps {
  /** true면 페이드아웃하며 앞으로 스쳐 지나감(소멸). */
  leaving?: boolean;
}

export default function OtherPresence({ leaving = false }: OtherPresenceProps) {
  const [frame, setFrame]     = useState(0);
  const [entered, setEntered] = useState(false);

  // 다리 사이클 — setInterval(저빈도). hidden 탭에서도 동작.
  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => setFrame(f => (f + 1) % 4), 140);
    return () => clearInterval(id);
  }, []);

  // 등장 트리거 — setTimeout으로 transition 발동 (rAF는 hidden 탭에서 멈춤)
  useEffect(() => {
    const id = setTimeout(() => setEntered(true), 20);
    return () => clearTimeout(id);
  }, []);

  const shadow = buildShadow(RUN[(frame + 2) % 4], '#6b5a4e'); // frame+2 위상, fig-other
  const tx = !entered ? BEHIND_X : (leaving ? FAR_X : AHEAD_X);
  const op = reducedMotion
    ? (leaving ? 0 : 0.4)
    : (!entered ? 0 : (leaving ? 0 : 0.4));

  const dur = leaving ? GAME_CONSTANTS.PRESENCE_FADE_MS : GAME_CONSTANTS.PRESENCE_APPROACH_MS;

  return (
    <div
      aria-hidden
      style={{
        position:   'absolute',
        left:       '48%',
        bottom:     100,                       // 러너와 같은 베이스라인
        transform:  `translateX(${tx}px)`,     // 화면 좌표 접근 오프셋
        opacity:    op,
        transition: reducedMotion ? 'none' : `transform ${dur}ms linear, opacity ${dur}ms ease`,
        zIndex:     7,
        pointerEvents: 'none',
        filter:     'blur(1px)',               // 흐릿
      }}
    >
      <div
        style={{
          transform:       'translateX(-50%) scale(3)',
          transformOrigin: 'bottom center',
          imageRendering:  'pixelated',
        }}
      >
        <i style={{ position: 'absolute', width: U, height: U, boxShadow: shadow }} />
      </div>
    </div>
  );
}
