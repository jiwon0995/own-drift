'use client';

/**
 * 화면 라우터 — 현재 screen에 맞는 오버레이만 렌더한다.
 * 지속 스테이지(GameStage: 셸·배너·배경·러너·루프)는 상위(app/page)에서 이 라우터를 감싼다.
 */

import type { Screen, PaceState } from '@/lib/game/types';
import TitleScreen         from './TitleScreen';
import TutorialScreen      from './TutorialScreen';
import FindPaceScreen      from './FindPaceScreen';
import JourneyStartScreen  from './JourneyStartScreen';
import MainPlayScreen      from './MainPlayScreen';
import ReturnScreen        from './ReturnScreen';
import ClearScreen         from './ClearScreen';
import ContinueOrEndScreen from './ContinueOrEndScreen';
import EndingScreen        from './EndingScreen';

const noop = () => {};

interface ScreenRouterProps {
  screen:        Screen;
  onAdvance:     () => void;
  onPaceSet:     (pace: PaceState) => void;
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
  /** Phase 6 — 엔딩 엽서에 표시할 캡처 이미지(null이면 단색 fallback). */
  capturedImage?:          string | null;
}

export default function ScreenRouter({
  screen,
  onAdvance,
  onPaceSet,
  onCleared,
  returnIndex            = 1,
  onEncounterStabilized  = noop,
  onReturnDone           = noop,
  onClearDone            = noop,
  onContinue             = noop,
  onEnd                  = noop,
  onSave                 = noop,
  onRestart              = noop,
  capturedImage          = null,
}: ScreenRouterProps) {
  return (
    <>
      {screen === 'title'        && <TitleScreen    onAdvance={onAdvance} />}
      {screen === 'tutorial'     && <TutorialScreen onAdvance={onAdvance} />}
      {screen === 'findPace'     && <FindPaceScreen onPaceSet={onPaceSet} />}
      {/* journeyStart → mainPlay: TRANSITIONS가 매핑하므로 onAdvance로 전진 */}
      {screen === 'journeyStart' && <JourneyStartScreen onComplete={onAdvance} />}

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
      {screen === 'ending'        && <EndingScreen onSave={onSave} onRestart={onRestart} capturedImage={capturedImage} />}
    </>
  );
}
