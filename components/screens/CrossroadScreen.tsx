'use client';

/**
 * Crossroad — 갈림길 (엔딩 플로우 재배치). GameStage 위 오버레이.
 *
 * Landscape 다음에 모든 플레이어가 만나는 분기. 선택의 우열 없음 — 어느 쪽도 강한 CTA로
 * 보이지 않게 두 버튼 모두 같은 무게(ghost 동일·같은 크기)다. "오늘은 여기까지" 종료 분기는
 * 없앴고(종료는 탭 닫기), 대신 계속과 처음-부터를 나란히 둔다.
 *
 * - 계속 달리기 → Main Play 자유주행 복귀(확정 속도 + 클리어 상태=우주 배경 유지, 인카운터 없음)
 * - 다시 내딛기 → Title로 전체 리셋(확정 속도·게이지·성공 카운트·씬·캡처 전부 초기화)
 */

import { CROSSROAD_COPY } from '@/lib/content/copy';
import SpeechBubble       from '@/components/game/SpeechBubble';
import Button             from '@/components/ui/Button';

interface CrossroadScreenProps {
  /** 계속 달리기 → Main Play 자유(평온) 주행 복귀 */
  onContinue: () => void;
  /** 다시 내딛기 → Title 전체 리셋 */
  onRestart:  () => void;
}

export default function CrossroadScreen({ onContinue, onRestart }: CrossroadScreenProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* 안내 */}
      <div
        className="absolute left-0 right-0 flex justify-center px-8"
        style={{ top: 150, zIndex: 10 }}
      >
        <SpeechBubble text={CROSSROAD_COPY.text} speed={48} />
      </div>

      {/* 보조 문구 */}
      <div
        className="absolute left-0 right-0 text-center font-pixel text-ink-faint select-none"
        style={{ top: 272, fontSize: 11, letterSpacing: 1, zIndex: 10 }}
      >
        {CROSSROAD_COPY.sub}
      </div>

      {/* 두 버튼 — 동등 무게(ghost 동일, 같은 크기) */}
      <div
        className="absolute left-0 right-0 flex justify-center gap-4 pointer-events-auto"
        style={{ bottom: 140, zIndex: 10 }}
      >
        <Button variant="ghost" onClick={onContinue}>{CROSSROAD_COPY.continue}</Button>
        <Button variant="ghost" onClick={onRestart}>{CROSSROAD_COPY.restart}</Button>
      </div>
    </div>
  );
}
