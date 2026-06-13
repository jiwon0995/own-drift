'use client';

/**
 * Return — 1/2/3번째 "찾음" (Phase 3). GameStage 위 오버레이.
 *
 * 흔들린 뒤 자기 속도로 돌아왔음을 *인정*하는 화면. 단계-성공/점수 느낌 없음.
 * 회차(index)로 문구 차등(혼란→인식→체화) + dwell 차등(갈수록 길게=차분).
 * 조작 없이 dwell 후 onDone → 다음 인카운터 또는 Clear.
 */

import { useEffect, useRef } from 'react';
import { GAME_CONSTANTS } from '@/lib/game/constants';
import { RETURN_COPY }    from '@/lib/content/copy';
import SpeechBubble       from '@/components/game/SpeechBubble';

interface ReturnScreenProps {
  /** 회차 1/2/3 */
  index:  number;
  /** dwell 후 호출 — count<3이면 MainPlay 복귀, ==3이면 Clear */
  onDone: () => void;
}

export default function ReturnScreen({ index, onDone }: ReturnScreenProps) {
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });

  useEffect(() => {
    const { RETURN_DWELL_BASE_MS, RETURN_DWELL_STEP_MS } = GAME_CONSTANTS;
    const dwell = RETURN_DWELL_BASE_MS + (index - 1) * RETURN_DWELL_STEP_MS;
    const id = setTimeout(() => onDoneRef.current(), dwell);
    return () => clearTimeout(id);
  }, [index]);

  const text = RETURN_COPY[Math.min(Math.max(index, 1), RETURN_COPY.length) - 1];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* MainPlay UI는 dimmed로 숨겨져 있고 러너·배경은 차분히 유지 */}
      <div
        className="absolute left-0 right-0 flex justify-center px-8"
        style={{ top: 200, zIndex: 12 }}
      >
        <SpeechBubble key={index} text={text} speed={48} />
      </div>
    </div>
  );
}
