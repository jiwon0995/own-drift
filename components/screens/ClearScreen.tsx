'use client';

/**
 * Clear — 속도 찾음 (Phase 3). GameStage 위 오버레이.
 *
 * 승리가 아니라 *인정*의 순간. 점수판·랭킹·기록·"Clear/Win" 표현 없음.
 * 배너 스왑(일반→회사)은 Phase 4 — 지금은 idle 유지(placeholder).
 * 풍경 캡처는 이 화면 진입 시 상위(app/page)에서 1회 수행하고, 일정 시간(CLEAR_DWELL_MS) 후
 * Landscape로 자동 전환한다(클리어한 모든 플레이어가 풍경을 받는다).
 */

import { useEffect, useRef } from 'react';
import { GAME_CONSTANTS } from '@/lib/game/constants';
import { CLEAR_COPY }     from '@/lib/content/copy';
import SpeechBubble       from '@/components/game/SpeechBubble';

interface ClearScreenProps {
  onDone: () => void;
}

export default function ClearScreen({ onDone }: ClearScreenProps) {
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });

  useEffect(() => {
    const id = setTimeout(() => onDoneRef.current(), GAME_CONSTANTS.CLEAR_DWELL_MS);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* 메인 — 감정적 정점. 점수/랭킹 없음 */}
      <div
        className="absolute left-0 right-0 text-center font-pixel text-ink-primary select-none"
        style={{ top: 120, fontSize: 22, letterSpacing: 1, textShadow: '2px 2px 0 #0a0706', zIndex: 10 }}
      >
        {CLEAR_COPY.main}
      </div>

      {/* 서브 — 피니시 없음의 안내 */}
      <div
        className="absolute left-0 right-0 flex justify-center px-8"
        style={{ top: 210, zIndex: 10 }}
      >
        <SpeechBubble text={CLEAR_COPY.sub} speed={48} />
      </div>
    </div>
  );
}
