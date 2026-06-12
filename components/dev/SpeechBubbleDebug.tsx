'use client';

import { useState } from 'react';
import SpeechBubble from '@/components/game/SpeechBubble';
import { SCREEN_COPY, TUTORIAL_STEP_COPY } from '@/lib/content/copy';

const SAMPLES = [
  SCREEN_COPY.title.bubble,
  TUTORIAL_STEP_COPY.fast.bubble,
  TUTORIAL_STEP_COPY.slow.bubble,
  TUTORIAL_STEP_COPY.done.bubble,
  SCREEN_COPY.findPace.bubble,
];

export default function SpeechBubbleDebug() {
  const [key,   setKey]   = useState(0);   // key 변경으로 강제 리마운트
  const [idx,   setIdx]   = useState(0);
  const [done,  setDone]  = useState(false);

  function replay() { setKey(k => k + 1); setDone(false); }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="font-pixel text-note text-accent-stable">SpeechBubble DEV</div>

      {/* 문구 선택 */}
      <div className="flex gap-2">
        {SAMPLES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setIdx(i); setKey(k => k + 1); setDone(false); }}
            className="font-pixel text-note px-2 py-1 border"
            style={{
              borderColor: idx === i ? '#ffb257' : '#7a6256',
              color:        idx === i ? '#ffb257' : '#7a6256',
              background:  '#241a17',
            }}
          >
            {['Title','Tutorial','FindPace'][i]}
          </button>
        ))}
      </div>

      {/* 말풍선 */}
      <div className="flex justify-center pt-2">
        <SpeechBubble
          key={key}
          text={SAMPLES[idx]}
          speed={45}
          onDone={() => setDone(true)}
        />
      </div>

      {/* 상태 + 리플레이 */}
      <div className="flex items-center gap-3">
        <span className="font-pixel text-note text-ink-faint">
          {done ? '● 완료' : '● 타이핑 중...'}
        </span>
        <button
          onClick={replay}
          className="font-pixel text-note px-2 py-1 border border-ink-faint text-ink-faint"
          style={{ background: '#241a17' }}
        >
          REPLAY
        </button>
      </div>
    </div>
  );
}
