'use client';

/**
 * Title 화면 오버레이 — GameStage 위에 얹힘.
 * 자체 배경/러너 없음. 타이틀 텍스트 + 말풍선 + 버튼만.
 */

import { useState } from 'react';
import SpeechBubble from '@/components/game/SpeechBubble';
import Button       from '@/components/ui/Button';
import { SCREEN_COPY } from '@/lib/content/copy';
import { unlockAudio } from '@/lib/audio/unlock';

interface TitleScreenProps {
  onAdvance: () => void;
}

export default function TitleScreen({ onAdvance }: TitleScreenProps) {
  const [bubbleDone, setBubbleDone] = useState(false);

  function handleStart() {
    void unlockAudio(); // 유저 제스처 컨텍스트 — iOS AudioContext 해제
    onAdvance();        // title → tutorial
  }

  return (
    <div className="absolute inset-0 pointer-events-none">

      {/* 픽셀 타이틀 — game-screens.html .title-text 톤 */}
      <div
        className="absolute left-0 right-0 text-center text-[70px] font-pixel tracking-[3px] text-ink-primary select-none"
        style={{
          top:        90,
          textShadow: '3px 3px 0 #b3611a, 5px 5px 0 #0a0706',
          zIndex:     9,
        }}
      >
        OWN DRIFT
      </div>

      {/* 말풍선 — bubbleTop:300 (game-screens.html Title 기준) */}
      <div
        className="absolute left-0 right-0 flex justify-center px-8"
        style={{ top: 200, zIndex: 10 }}
      >
        <SpeechBubble
          text={SCREEN_COPY.title.bubble}
          speed={48}
          onDone={() => setBubbleDone(true)}
        />
      </div>

      {/* 버튼 — 말풍선 완료 후 페이드인 */}
      <div
        className="absolute left-0 right-0 flex justify-center pointer-events-auto"
        style={{
          bottom:     150,
          zIndex:     10,
          opacity:    bubbleDone ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      >
        <Button variant="primary" onClick={handleStart} disabled={!bubbleDone}>
          {SCREEN_COPY.title.startButton}
        </Button>
      </div>

    </div>
  );
}
