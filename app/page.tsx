'use client';

import { useRef, useState }   from 'react';
import GameStage          from '@/components/game/GameStage';
import ScreenRouter       from '@/components/screens/ScreenRouter';
import { useScreenFlow }  from '@/hooks/useScreenFlow';
import { GAME_CONSTANTS } from '@/lib/game/constants';
import { captureGameView } from '@/lib/game/capture';
import type { PaceState } from '@/lib/game/types';

export default function HomePage() {
  const { screen, advance, goTo }     = useScreenFlow('title');
  const [paceState, setPaceState]     = useState<PaceState | null>(null);
  const [returnIndex, setReturnIndex] = useState(1);

  // 풍경 캡처 이미지 & 게임 전체 리셋 키
  const viewportRef                   = useRef<HTMLElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  // 클리어 도달 여부 — "계속 달리기"로 MainPlay에 복귀해도 클리어 상태(우주 배경 + 평온)를 유지.
  const [cleared, setCleared]         = useState(false);
  // GameStage 리마운트 키 — "다시 내딛기"가 루프 ref(속도·게이지·안정 횟수)를 통째로 초기화.
  const [runId, setRunId]             = useState(0);

  function handlePaceSet(pace: PaceState) {
    setPaceState(pace);
    advance(); // findPace → mainPlay
  }

  function handleStabilized() {
    // 저수준 이벤트 훅(루프가 게이지 리셋). 회차 카운트는 onEncounterStabilized가 담당.
  }

  function handleCleared() {
    // 2C 저수준 이벤트. Phase 3 흐름은 onEncounterStabilized(count===3)로 Clear를 연다.
  }

  // 인카운터 1회 안정 → 회차별 Return
  function handleEncounterStabilized(count: number) {
    setReturnIndex(count);
    goTo('return');
  }

  // Return dwell 후 → 3회 미만이면 다음 인카운터(MainPlay), 3회면 Clear.
  // 클리어 진입 시점에 풍경을 1회 캡처(Landscape에서 재사용)하고 cleared를 올린다 — 캡처는
  // 순수 canvas 페인트라 동기에 가깝다(실패 시 null → Landscape가 단색 fallback 처리).
  async function handleReturnDone() {
    if (returnIndex >= GAME_CONSTANTS.REQUIRED_STABILIZATIONS) {
      setCapturedImage(await captureGameView(viewportRef)); // ★ CLEAR 진입 캡처 1회
      setCleared(true);
      goTo('clear');
    } else {
      goTo('mainPlay');
    }
  }

  // Clear 짧게 머문 뒤 → 클리어한 모든 플레이어가 풍경(Landscape)을 받는다.
  function handleClearDone() {
    goTo('landscape');
  }

  // Landscape 두 버튼(저장/간직) 공통 다음 화면 — 갈림길(Crossroad).
  function handleLandscapeDone() {
    goTo('crossroad');
  }

  // "계속 달리기" — Main Play 자유(평온) 주행 복귀. cleared를 유지해 우주 배경·확정 속도를 잇고
  // freeRun(=cleared)으로 새 다른-존재 사이클을 예약하지 않는다.
  function handleContinue() {
    setReturnIndex(1);
    goTo('mainPlay');
  }

  // "내 풍경 저장하기" — 브라우저 기본 다운로드에 위임(성공/실패 UI 없음).
  function handleSave() {
    if (!capturedImage) return;
    const a = document.createElement('a');
    a.href = capturedImage;
    a.download = '나의-풍경.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // "다시 내딛기" — 게임 상태 전체 초기화 후 Title로(클린 슬레이트).
  // 화면 플래그(paceState·returnIndex·캡처·cleared)는 여기서, 루프 ref(속도·게이지·안정 횟수)는
  // GameStage 리마운트(runId 변경)로 한 번에 초기화한다 — 새 리셋 로직 없이 React 리마운트 재사용.
  function handleRestart() {
    setPaceState(null);
    setReturnIndex(1);
    setCapturedImage(null);
    setCleared(false);
    setRunId(id => id + 1);
    goTo('title');
  }

  return (
    <GameStage
      key={runId}
      screen={screen}
      ambient={screen === 'title'}
      band={paceState?.band ?? null}
      cleared={cleared}
      onStabilized={handleStabilized}
      viewportRef={viewportRef}
    >
      <ScreenRouter
        screen={screen}
        onAdvance={advance}
        onPaceSet={handlePaceSet}
        onCleared={handleCleared}
        returnIndex={returnIndex}
        onEncounterStabilized={handleEncounterStabilized}
        onReturnDone={handleReturnDone}
        onClearDone={handleClearDone}
        onLandscapeDone={handleLandscapeDone}
        onContinue={handleContinue}
        onSave={handleSave}
        onRestart={handleRestart}
        capturedImage={capturedImage}
        freeRun={cleared}
      />
    </GameStage>
  );
}
