'use client';

import { useState } from 'react';
import Shell           from '@/components/screens/Shell';
import LoopDebug       from '@/components/dev/LoopDebug';
import SpeechBubbleDebug from '@/components/dev/SpeechBubbleDebug';
import PixelRunnerDebug  from '@/components/dev/PixelRunnerDebug';
import ScreenFlowDebug   from '@/components/dev/ScreenFlowDebug';
import AudioDebug        from '@/components/dev/AudioDebug';

type Tab = 'loop' | 'bubble' | 'runner' | 'screen' | 'audio';

const TABS: { id: Tab; label: string }[] = [
  { id: 'loop',   label: 'Loop'   },
  { id: 'bubble', label: 'Bubble' },
  { id: 'runner', label: 'Runner' },
  { id: 'screen', label: 'Screen' },
  { id: 'audio',  label: 'Audio'  },
];

export default function DevPage() {
  const [tab, setTab] = useState<Tab>('loop');

  return (
    <Shell>
      <div className="flex flex-col h-full bg-game">
        {/* 탭 바 */}
        <div className="flex border-b border-[#3a2a22] shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="font-pixel text-note px-3 py-2"
              style={{
                color:           tab === t.id ? '#ffb257' : '#7a6256',
                borderBottom:    tab === t.id ? '2px solid #ffb257' : '2px solid transparent',
                background:      'transparent',
              }}
            >
              {t.label}
            </button>
          ))}
          <span className="font-pixel text-note text-ink-faint ml-auto px-2 py-2 self-center opacity-50">
            DEV
          </span>
        </div>

        {/* 패널 */}
        <div className="flex-1 overflow-auto">
          {tab === 'loop'   && <LoopDebug />}
          {tab === 'bubble' && <SpeechBubbleDebug />}
          {tab === 'runner' && <PixelRunnerDebug />}
          {tab === 'screen' && <ScreenFlowDebug />}
          {tab === 'audio'  && <AudioDebug />}
        </div>
      </div>
    </Shell>
  );
}
