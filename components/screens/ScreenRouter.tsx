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
import LandscapeScreen     from './LandscapeScreen';
import CrossroadScreen     from './CrossroadScreen';

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
  onLandscapeDone?:        () => void;
  onContinue?:             () => void;
  onSave?:                 () => void;
  onRestart?:              () => void;
  /** Landscape 엽서에 표시할 캡처 이미지(null이면 단색 fallback). */
  capturedImage?:          string | null;
  /** 클리어 후 "계속 달리기"로 복귀한 자유주행 — MainPlay 인카운터 미예약·UI 비움. */
  freeRun?:                boolean;
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
  onLandscapeDone        = noop,
  onContinue             = noop,
  onSave                 = noop,
  onRestart              = noop,
  capturedImage          = null,
  freeRun                = false,
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
          freeRun={freeRun}
        />
      )}

      {screen === 'return'    && <ReturnScreen index={returnIndex} onDone={onReturnDone} />}
      {screen === 'clear'     && <ClearScreen onDone={onClearDone} />}
      {screen === 'landscape' && <LandscapeScreen onSave={onSave} onDone={onLandscapeDone} capturedImage={capturedImage} />}
      {screen === 'crossroad' && <CrossroadScreen onContinue={onContinue} onRestart={onRestart} />}
    </>
  );
}
