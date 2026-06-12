'use client';

/**
 * Main Play — 평온 구간 (Phase 2B).
 *
 * - 진입 시 "내 속도대로.." → 잠시 후 상태 문구로 전환
 * - 내 구간(myPace±tol) 유지 → 안정 게이지 충전 / 이탈 → 멈춤·아주 살짝 되돌림
 * - 실패·경고·점수·미션완료 표현 없음. 게이지 가득은 루프가 onStabilized로 처리(여기선 평온 유지)
 * - 상태 4종은 디바운스 + 히스테리시스(루프단)로 경계 깜빡임 방지
 */

import { useEffect, useRef, useState } from 'react';
import { GAME_CONSTANTS }              from '@/lib/game/constants';
import { GAUGE_COPY, MAIN_PLAY_COPY }  from '@/lib/content/copy';
import { useGameStage }                from '@/components/game/GameStage';
import SpeechBubble                    from '@/components/game/SpeechBubble';
import StabilityGauge                  from '@/components/game/StabilityGauge';

const { STABILITY_GAUGE_FULL, STATUS_DEBOUNCE_MS } = GAME_CONSTANTS;
const S = MAIN_PLAY_COPY.status;
const ENTRY = { id: 'entry', text: MAIN_PLAY_COPY.entry };

interface Status { id: string; text: string }

export default function MainPlayScreen() {
  const { snapshot, resetStability } = useGameStage();
  const [status, setStatus] = useState<Status>(ENTRY);

  const lastInBandRef  = useRef<boolean | null>(null);
  const dwellMsRef     = useRef(0);   // 현재 inBand 상태 지속 시간(ms)
  const lastTsRef      = useRef<number | null>(null);
  const committedAtRef = useRef(0);   // 마지막 문구 변경 시각(ms)

  // 진입 시 안정 게이지 0으로 리셋 + 진입 문구를 STATUS_DEBOUNCE_MS 동안 유지
  useEffect(() => {
    resetStability();
    committedAtRef.current = performance.now();
  // resetStability는 useCallback([]) — 의존성 안정적
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 상태 문구 — 스냅샷 갱신마다 dwell 누적 후 디바운스 교체
  useEffect(() => {
    const now  = performance.now();
    const last = lastTsRef.current;
    lastTsRef.current = now;
    if (last === null) {              // 첫 스냅샷: 기준만 잡고 종료
      lastInBandRef.current = snapshot.inBand;
      return;
    }
    const dt = now - last;

    if (snapshot.inBand !== lastInBandRef.current) {
      dwellMsRef.current    = 0;
      lastInBandRef.current = snapshot.inBand;
    } else {
      dwellMsRef.current += dt;
    }

    // 막 진입/이탈(짧음) vs 지속(김)을 dwell로 구분
    const sustained = dwellMsRef.current >= STATUS_DEBOUNCE_MS;
    const target: Status = snapshot.inBand
      ? (sustained ? { id: 'inHold',  text: S.inHold  } : { id: 'inEnter', text: S.inEnter })
      : (sustained ? { id: 'stopped', text: S.stopped } : { id: 'drift',   text: S.drift   });

    // 차분한 톤 — 의미 있는 전이에서만, 최소 유지 시간 지난 뒤 교체
    setStatus(prev => {
      if (target.id === prev.id) return prev;
      if (now - committedAtRef.current < STATUS_DEBOUNCE_MS) return prev;
      committedAtRef.current = now;
      return target;
    });
  }, [snapshot]);

  return (
    <div className="absolute inset-0 pointer-events-none">

      {/* 진입/상태 문구 */}
      <div
        className="absolute left-0 right-0 flex justify-center px-8"
        style={{ top: 160, zIndex: 10 }}
      >
        <SpeechBubble text={status.text} speed={48} />
      </div>

      {/* 안정 게이지 — 압박 없이 차분 */}
      <div
        className="absolute left-0 right-0 flex justify-center"
        style={{ bottom: 180, zIndex: 10 }}
      >
        <StabilityGauge
          progress={snapshot.stabilityProgress}
          full={STABILITY_GAUGE_FULL}
          label={GAUGE_COPY.stabilizing}
        />
      </div>

    </div>
  );
}
