'use client';

import { useScreenFlow } from '@/hooks/useScreenFlow';
import ScreenRouter from '@/components/screens/ScreenRouter';
import GameStage from '@/components/game/GameStage';
import type { Screen } from '@/lib/game/types';

const ALL_SCREENS: Screen[] = ['title', 'tutorial', 'findPace', 'journeyStart', 'mainPlay', 'return', 'clear', 'landscape', 'crossroad'];

export default function ScreenFlowDebug() {
  const { screen, goTo, advance } = useScreenFlow('title');

  return (
    <div className="flex flex-col gap-3 p-4 h-full">
      <div className="font-pixel text-note text-accent-stable">ScreenFlow DEV</div>

      {/* 직접 점프 버튼 */}
      <div className="flex gap-2">
        {ALL_SCREENS.map(s => (
          <button
            key={s}
            onClick={() => goTo(s)}
            className="font-pixel text-note px-2 py-1 border"
            style={{
              borderColor: screen === s ? '#ffb257' : '#7a6256',
              color:        screen === s ? '#ffb257' : '#7a6256',
              background:  '#241a17',
            }}
          >
            {s}
          </button>
        ))}
        <button
          onClick={advance}
          className="font-pixel text-note px-2 py-1 border border-ink-faint text-ink-faint ml-auto"
          style={{ background: '#241a17' }}
        >
          advance →
        </button>
      </div>

      {/* 스텁 렌더 */}
      <div
        className="flex-1 border"
        style={{ borderColor: '#3a2a22', minHeight: 120 }}
      >
        {/* 스테이지가 상위로 올라가 ScreenRouter는 더 이상 GameStage를 감싸지 않음 — 여기서 감싼다 */}
        <GameStage screen={screen} ambient={screen === 'title'}>
          <ScreenRouter screen={screen} onAdvance={advance} onPaceSet={() => {}} onCleared={() => {}} />
        </GameStage>
      </div>

      <div className="font-pixel text-note text-ink-faint">
        현재 화면: <span className="text-accent-stable">{screen}</span>
      </div>
    </div>
  );
}
