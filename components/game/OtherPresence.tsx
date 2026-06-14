'use client';

/**
 * 다른 존재 (Phase 2C 최소판; 폴리싱 Phase 4).
 *
 * design-system/game-screens의 .other 이식:
 * - fig-other 색(흰색), opacity ~0.6, blur로 흐릿
 * - 러너와 같은 4프레임 스프라이트를 frame+2 오프셋(다른 위상)
 * - 뒤에서 다가와 플레이어를 조금 앞섬 → leaving이면 앞으로 스쳐 지나가며 페이드
 *   (페이드인을 접근보다 짧게 둬 멀찍이 뒤에서 먼저 보이게 — 갑자기 옆에 나타나는 느낌 방지)
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

// 러너 기준 가로 오프셋(px): 뒤에서 등장 → 조금 앞섬 → 앞으로 스쳐 지나가며 소멸
const BEHIND_X = -70; // 뒤
const AHEAD_X  = 46;  // 조금 앞
const FAR_X    = 130; // 스쳐 지나간 뒤

interface OtherPresenceProps {
  /** true면 앞으로 스쳐 지나가며 페이드아웃(소멸). */
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

  const shadow = buildShadow(RUN[(frame + 2) % 4], 'var(--color-fig-other)'); // frame+2 위상, fig-other(흰색)
  const tx = !entered ? BEHIND_X : (leaving ? FAR_X : AHEAD_X);
  const op = reducedMotion
    ? (leaving ? 0 : 0.6)
    : (!entered ? 0 : (leaving ? 0 : 0.6));

  // 이동(접근/후퇴)과 페이드를 분리 — 등장 시 페이드인을 접근보다 짧게 둬 멀찍이 뒤에서 먼저 보이게 한다.
  const moveDur = leaving ? GAME_CONSTANTS.PRESENCE_FADE_MS : GAME_CONSTANTS.PRESENCE_APPROACH_MS;
  const fadeDur = leaving ? GAME_CONSTANTS.PRESENCE_FADE_MS : GAME_CONSTANTS.PRESENCE_FADEIN_MS;

  return (
    <div
      aria-hidden
      style={{
        position:   'absolute',
        left:       '48%',
        bottom:     100,                       // 러너와 같은 베이스라인
        transform:  `translateX(${tx}px)`,     // 화면 좌표 접근 오프셋
        opacity:    op,
        transition: reducedMotion ? 'none' : `transform ${moveDur}ms linear, opacity ${fadeDur}ms ease`,
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
