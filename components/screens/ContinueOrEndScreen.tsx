'use client';

/**
 * Continue or End — 계속 / 오늘은 여기까지 (Phase 3). GameStage 위 오버레이.
 *
 * 선택의 우열 없음: 계속도 정답 아니고, 멈춤도 포기 아님.
 * 두 버튼은 같은 무게(같은 variant·크기). 종료를 부정적으로 보이게 하지 않음.
 */

import { CONTINUE_OR_END_COPY } from '@/lib/content/copy';
import SpeechBubble            from '@/components/game/SpeechBubble';
import Button                  from '@/components/ui/Button';

interface ContinueOrEndScreenProps {
  /** 계속 → MainPlay 자유(평온) 주행 복귀 */
  onContinue: () => void;
  /** 오늘은 여기까지 → Ending */
  onEnd:      () => void;
}

export default function ContinueOrEndScreen({ onContinue, onEnd }: ContinueOrEndScreenProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* 안내 */}
      <div
        className="absolute left-0 right-0 flex justify-center px-8"
        style={{ top: 160, zIndex: 10 }}
      >
        <SpeechBubble text={CONTINUE_OR_END_COPY.prompt} speed={48} />
      </div>

      {/* 보조 문구 */}
      <div
        className="absolute left-0 right-0 text-center font-pixel text-ink-faint select-none"
        style={{ top: 268, fontSize: 11, letterSpacing: 1, zIndex: 10 }}
      >
        {CONTINUE_OR_END_COPY.note}
      </div>

      {/* 두 버튼 — 동등 무게(ghost 동일, 같은 크기) */}
      <div
        className="absolute left-0 right-0 flex justify-center gap-4 pointer-events-auto"
        style={{ bottom: 140, zIndex: 10 }}
      >
        <Button variant="ghost" onClick={onContinue}>{CONTINUE_OR_END_COPY.continue}</Button>
        <Button variant="ghost" onClick={onEnd}>{CONTINUE_OR_END_COPY.end}</Button>
      </div>
    </div>
  );
}
