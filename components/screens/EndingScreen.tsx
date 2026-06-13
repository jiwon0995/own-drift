'use client';

/**
 * Ending — 당신의 풍경 (Phase 3). GameStage 위 오버레이.
 *
 * 점수·결과가 아니라 *지나온 리듬*을 선물처럼 받는 화면.
 * 순위·기록·속도 수치·성공률 노출 없음.
 * 풍경 이미지는 placeholder(캡처는 Phase 6), 저장 로직도 Phase 6 stub.
 */

import { ENDING_COPY } from '@/lib/content/copy';
import SpeechBubble    from '@/components/game/SpeechBubble';
import Button          from '@/components/ui/Button';

interface EndingScreenProps {
  /** 내 풍경 저장하기 — Phase 6에서 canvas 캡처/저장 구현 (지금 stub) */
  onSave:    () => void;
  /** 다시 걸어보기 → Title */
  onRestart: () => void;
}

export default function EndingScreen({ onSave, onRestart }: EndingScreenProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* 메인 + 서브 */}
      <div
        className="absolute left-0 right-0 flex justify-center px-8"
        style={{ top: 72, zIndex: 10 }}
      >
        <SpeechBubble text={`${ENDING_COPY.main}\n${ENDING_COPY.sub}`} speed={48} />
      </div>

      {/* 풍경 placeholder — 캡처는 Phase 6 */}
      <div
        className="absolute left-1/2 flex items-center justify-center"
        style={{
          top:        196,
          width:      280,
          height:     112,
          transform:  'translateX(-50%)',
          background: '#140d0a',
          border:     '3px solid #3a2a22',
          boxShadow:  'inset 0 0 0 2px #0a0706, 4px 4px 0 0 rgba(0,0,0,0.55)',
          zIndex:     10,
        }}
      >
        <span className="font-pixel text-ink-faint" style={{ fontSize: 12, letterSpacing: 1 }}>
          [ {ENDING_COPY.placeholder} ]
        </span>
      </div>

      {/* 버튼 */}
      <div
        className="absolute left-0 right-0 flex justify-center gap-4 pointer-events-auto"
        style={{ bottom: 84, zIndex: 10 }}
      >
        <Button variant="primary" onClick={onSave}>{ENDING_COPY.save}</Button>
        <Button variant="ghost"   onClick={onRestart}>{ENDING_COPY.restart}</Button>
      </div>
    </div>
  );
}
