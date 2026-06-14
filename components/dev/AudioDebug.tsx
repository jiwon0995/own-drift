'use client';

import { useState } from 'react';
import { unlockAudio, getAudioState } from '@/lib/audio/unlock';

export default function AudioDebug() {
  const [state, setState] = useState<string | null>(getAudioState);

  async function handleUnlock() {
    await unlockAudio();
    setState(getAudioState());
  }

  const isRunning = state === 'running';

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="font-pixel text-note text-accent-stable">Audio Unlock DEV</div>

      <div className="font-pixel text-label text-ink-soft">
        context.state:{' '}
        <span style={{ color: isRunning ? '#ffb257' : '#7a6256' }}>
          {state ?? '미생성'}
        </span>
      </div>

      <button
        onClick={handleUnlock}
        className="font-pixel text-label px-4 py-2 border self-start"
        style={{
          borderColor: '#ffb257',
          color:        '#ffb257',
          background:  '#241a17',
        }}
      >
        UNLOCK AUDIO
      </button>

      <div className="font-pixel text-note text-ink-faint leading-relaxed">
        {isRunning
          ? '✓ AudioContext running — 에셋 재생 가능 상태 (Phase 5에서 추가)'
          : '버튼 클릭(유저 제스처) 후 running으로 전환됩니다.'}
      </div>
    </div>
  );
}
