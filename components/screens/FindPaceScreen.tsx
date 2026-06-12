'use client';

/**
 * Find Pace 화면 오버레이.
 *
 * - 마운트 시 resetAnchor → 게이지 0 재초기화
 * - 아무 속도든 변동 없이 유지하면 게이지 충전 (타깃 없음)
 * - 게이지 가득(ANCHOR_GAUGE_FULL) → 현재 속도를 myPace로 확정 → band 산출 → onPaceSet
 * - 실패/오답 없음. 속도 유도 없음.
 */

import { useEffect, useRef, useState } from 'react';
import { GAME_CONSTANTS }  from '@/lib/game/constants';
import { SCREEN_COPY }     from '@/lib/content/copy';
import { computeBand }     from '@/lib/game/pace';
import type { PaceState }  from '@/lib/game/types';
import { useGameStage }    from '@/components/game/GameStage';
import SpeechBubble        from '@/components/game/SpeechBubble';
import StabilityGauge      from '@/components/game/StabilityGauge';

interface FindPaceScreenProps {
  onPaceSet: (pace: PaceState) => void;
}

export default function FindPaceScreen({ onPaceSet }: FindPaceScreenProps) {
  const { snapshot, resetAnchor } = useGameStage();
  const [locked, setLocked]       = useState(false);

  // stable ref — onPaceSet이 바뀌어도 타이머 콜백이 최신값을 참조
  const onPaceSetRef = useRef(onPaceSet);
  useEffect(() => { onPaceSetRef.current = onPaceSet; }, [onPaceSet]);

  // 마운트 시 게이지 초기화 (Tutorial 중 쌓인 값 리셋)
  useEffect(() => {
    resetAnchor();
  // resetAnchor는 useCallback([]) — 의존성 안정적
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 게이지 가득 감지 — 스냅샷 스로틀(~100ms) 기반
  useEffect(() => {
    if (locked) return;
    if (snapshot.gaugeProgress >= GAME_CONSTANTS.ANCHOR_GAUGE_FULL) {
      setLocked(true);
      const myPace = snapshot.speed;
      const band   = computeBand(myPace, GAME_CONSTANTS.TOLERANCE);
      onPaceSetRef.current({ myPace, band });
    }
  }, [snapshot.gaugeProgress, locked]);

  return (
    <div className="absolute inset-0 pointer-events-none">

      {/* 말풍선 */}
      <div
        className="absolute left-0 right-0 flex justify-center px-8"
        style={{ top: 160, zIndex: 10 }}
      >
        <SpeechBubble text={SCREEN_COPY.findPace.bubble} speed={48} />
      </div>

      {/* 안착 게이지 */}
      <div
        className="absolute left-0 right-0 flex justify-center"
        style={{ bottom: 180, zIndex: 10 }}
      >
        <StabilityGauge
          progress={snapshot.gaugeProgress}
          full={GAME_CONSTANTS.ANCHOR_GAUGE_FULL}
        />
      </div>

    </div>
  );
}
