'use client';

import type { Screen, PaceState } from '@/lib/game/types';
import GameStage           from '@/components/game/GameStage';
import TitleScreen         from './TitleScreen';
import TutorialScreen      from './TutorialScreen';
import FindPaceScreen      from './FindPaceScreen';
import MainPlayScreen      from './MainPlayScreen';
import ReturnScreen        from './ReturnScreen';
import ClearScreen         from './ClearScreen';
import ContinueOrEndScreen from './ContinueOrEndScreen';
import EndingScreen        from './EndingScreen';

const noop = () => {};

interface ScreenRouterProps {
  screen:        Screen;
  onAdvance:     () => void;
  paceState:     PaceState | null;
  onPaceSet:     (pace: PaceState) => void;
  onStabilized:  () => void;
  onCleared:     () => void;
  // ── Phase 3 흐름 (옵셔널: 없으면 no-op — dev 화면 등) ──
  returnIndex?:            number;
  onEncounterStabilized?:  (count: number) => void;
  onReturnDone?:           () => void;
  onClearDone?:            () => void;
  onContinue?:             () => void;
  onEnd?:                  () => void;
  onSave?:                 () => void;
  onRestart?:              () => void;
}

export default function ScreenRouter({
  screen,
  onAdvance,
  paceState,
  onPaceSet,
  onStabilized,
  onCleared,
  returnIndex            = 1,
  onEncounterStabilized  = noop,
  onReturnDone           = noop,
  onClearDone            = noop,
  onContinue             = noop,
  onEnd                  = noop,
  onSave                 = noop,
  onRestart              = noop,
}: ScreenRouterProps) {
  const isAmbient = screen === 'title';

  return (
    <GameStage
      ambient={isAmbient}
      band={paceState?.band ?? null}
      onStabilized={onStabilized}
    >
      {screen === 'title'    && <TitleScreen    onAdvance={onAdvance} />}
      {screen === 'tutorial' && <TutorialScreen onAdvance={onAdvance} />}
      {screen === 'findPace' && <FindPaceScreen onPaceSet={onPaceSet} />}

      {/* MainPlay는 return 중에도 마운트 유지(인카운터 count/머신 보존), UI만 dimmed */}
      {(screen === 'mainPlay' || screen === 'return') && (
        <MainPlayScreen
          onCleared={onCleared}
          onEncounterStabilized={onEncounterStabilized}
          dimmed={screen === 'return'}
        />
      )}

      {screen === 'return'        && <ReturnScreen index={returnIndex} onDone={onReturnDone} />}
      {screen === 'clear'         && <ClearScreen onDone={onClearDone} />}
      {screen === 'continueOrEnd' && <ContinueOrEndScreen onContinue={onContinue} onEnd={onEnd} />}
      {screen === 'ending'        && <EndingScreen onSave={onSave} onRestart={onRestart} />}
    </GameStage>
  );
}
