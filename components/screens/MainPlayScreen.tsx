'use client';

/**
 * Main Play — 평온 구간 + 다른 존재 인카운터 (Phase 2B + 2C).
 *
 * 인카운터 루프:
 *   평온 → FIRST_ENCOUNTER_DELAY 후 다른 존재 등장(끌어당김 on)
 *   → 구간 유지로 2B 안정 게이지 충전 → 가득(loop가 stabilizations++) → 존재 페이드 + count++
 *   → count<3: INTER_ENCOUNTER_CALM 후 다음 등장 / count==3: onCleared
 *
 * 끌어당김은 약한 드리프트(루프의 applyPresencePull) — 릴리스로 상쇄 가능, 실패 없음.
 * 쫓아가도 구간 이탈로 게이지가 멈출 뿐 보상/처벌 없음. 상태 문구는 디바운스로 차분.
 *
 * 고빈도(속도·게이지·끌어당김)는 루프(ref), 화면은 스로틀 스냅샷.
 * 인카운터 단계 전환은 저빈도(타이머/이벤트) — per-frame setState 없음.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GAME_CONSTANTS }              from '@/lib/game/constants';
import { GAUGE_COPY, MAIN_PLAY_COPY }  from '@/lib/content/copy';
import { useGameStage }                from '@/components/game/GameStage';
import SpeechBubble                    from '@/components/game/SpeechBubble';
import StabilityGauge                  from '@/components/game/StabilityGauge';
import OtherPresence                   from '@/components/game/OtherPresence';

const {
  STABILITY_GAUGE_FULL, STATUS_DEBOUNCE_MS,
  FIRST_ENCOUNTER_DELAY, INTER_ENCOUNTER_CALM,
  REQUIRED_STABILIZATIONS, PRESENCE_FADE_MS,
} = GAME_CONSTANTS;

const S = MAIN_PLAY_COPY.status;
const ENTRY    = { id: 'entry',     text: MAIN_PLAY_COPY.entry };
const ENC      = { id: 'encounter', text: MAIN_PLAY_COPY.encounter };
const IN_ENTER = { id: 'inEnter',   text: S.inEnter };
const IN_HOLD  = { id: 'inHold',    text: S.inHold };
const DRIFT    = { id: 'drift',     text: S.drift };
const STOPPED  = { id: 'stopped',   text: S.stopped };

interface Status { id: string; text: string }
type PresencePhase = 'hidden' | 'active' | 'leaving';

interface MainPlayScreenProps {
  /** 3회 안정 달성 = 클리어. Phase 3가 Clear/Continue/Ending으로 소비. */
  onCleared: () => void;
  /** 인카운터 1회 안정 시 회차(count) 통지 — Phase 3가 Return 트리거로 소비. */
  onEncounterStabilized?: (count: number) => void;
  /** Return 오버레이가 위에 떠 있는 동안 본 화면 UI를 숨김(머신은 계속 구동). */
  dimmed?: boolean;
}

export default function MainPlayScreen({ onCleared, onEncounterStabilized, dimmed = false }: MainPlayScreenProps) {
  const { snapshot, resetStability, setPresenceActive } = useGameStage();
  const [status,      setStatus]      = useState<Status>(ENTRY);
  const [presence,    setPresence]    = useState<PresencePhase>('hidden');
  const [encounterId, setEncounterId] = useState(0);

  // 최신 콜백 묶음 — 타이머 클로저 stale 방지 (effect에서 갱신해 render 중 ref-write 회피)
  const apiRef = useRef({ resetStability, setPresenceActive, onCleared, onEncounterStabilized });
  useEffect(() => {
    apiRef.current = { resetStability, setPresenceActive, onCleared, onEncounterStabilized };
  });

  // 인카운터 상태 ref
  const presenceRef = useRef<PresencePhase>('hidden');
  const countRef    = useRef(0);
  const lastStabRef = useRef(0);
  const timersRef   = useRef<ReturnType<typeof setTimeout>[]>([]);

  // 상태 문구 ref
  const lastInBandRef    = useRef<boolean | null>(null);
  const dwellMsRef       = useRef(0);
  const lastTsRef        = useRef<number | null>(null);
  const committedAtRef   = useRef(0);
  const announceUntilRef = useRef(0);

  // 다른 존재 등장 — 끌어당김 on, 게이지 0, 등장 알림
  const startEncounter = useCallback(() => {
    apiRef.current.resetStability();
    apiRef.current.setPresenceActive(true);
    presenceRef.current = 'active';
    setPresence('active');
    setEncounterId(id => id + 1);            // OtherPresence 재등장(key)
    announceUntilRef.current = performance.now() + STATUS_DEBOUNCE_MS;
  }, []);

  // 안정 1회 — 끌어당김 off, 존재 페이드, count++ → 다음 등장 또는 클리어
  const onStabilization = useCallback(() => {
    apiRef.current.setPresenceActive(false);
    presenceRef.current = 'leaving';
    setPresence('leaving');
    countRef.current += 1;
    apiRef.current.onEncounterStabilized?.(countRef.current); // 회차 통지 → Phase 3 Return
    const fadeId = setTimeout(() => {
      presenceRef.current = 'hidden';
      setPresence('hidden');
      if (countRef.current >= REQUIRED_STABILIZATIONS) {
        apiRef.current.onCleared();          // 3회 → 클리어 이벤트 (Phase 3)
      } else {
        const nextId = setTimeout(startEncounter, INTER_ENCOUNTER_CALM * 1000);
        timersRef.current.push(nextId);      // 평온 후 다음 등장
      }
    }, PRESENCE_FADE_MS);
    timersRef.current.push(fadeId);
  }, [startEncounter]);

  // 마운트: 게이지 리셋 + 진입 문구 유지 + 첫 등장 예약
  useEffect(() => {
    apiRef.current.resetStability();
    committedAtRef.current = performance.now();
    const firstId = setTimeout(startEncounter, FIRST_ENCOUNTER_DELAY * 1000);
    timersRef.current.push(firstId);
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      apiRef.current.setPresenceActive(false);
    };
  }, [startEncounter]);

  // 스냅샷 갱신마다: 안정 이벤트 감지 + 상태 문구(디바운스)
  useEffect(() => {
    const now  = performance.now();
    const last = lastTsRef.current;
    if (last === null) {                      // 첫 스냅샷: 기준만 잡고 종료
      lastTsRef.current     = now;
      lastStabRef.current   = snapshot.stabilizations;
      lastInBandRef.current = snapshot.inBand;
      return;
    }
    lastTsRef.current = now;
    const dt = now - last;

    // 1) 안정 이벤트 — 인카운터 중일 때만 카운트 진행
    if (snapshot.stabilizations > lastStabRef.current) {
      lastStabRef.current = snapshot.stabilizations;
      if (presenceRef.current === 'active') onStabilization();
    }

    // 2) 상태 문구
    if (snapshot.inBand !== lastInBandRef.current) {
      dwellMsRef.current    = 0;
      lastInBandRef.current = snapshot.inBand;
    } else {
      dwellMsRef.current += dt;
    }

    const sustained = dwellMsRef.current >= STATUS_DEBOUNCE_MS;
    let target: Status;
    if (now < announceUntilRef.current)  target = ENC;               // 등장 알림 우선
    else if (snapshot.inBand)            target = sustained ? IN_HOLD : IN_ENTER;
    else                                 target = sustained ? STOPPED : DRIFT;

    setStatus(prev => {
      if (target.id === prev.id) return prev;
      if (now - committedAtRef.current < STATUS_DEBOUNCE_MS) return prev;
      committedAtRef.current = now;
      return target;
    });
  }, [snapshot, onStabilization]);

  // Return 오버레이가 위에 떠 있는 동안: 본 UI 숨김 (러너·배경은 GameStage라 그대로 유지)
  if (dimmed) return <div className="absolute inset-0 pointer-events-none" aria-hidden />;

  return (
    <div className="absolute inset-0 pointer-events-none">

      {/* 다른 존재 — 흐릿하게 뒤에서 다가와 스침 (UI 크롬 없음) */}
      {presence !== 'hidden' && (
        <OtherPresence key={encounterId} leaving={presence === 'leaving'} />
      )}

      {/* 진입/상태 문구 */}
      <div
        className="absolute left-0 right-0 flex justify-center px-8"
        style={{ top: 160, zIndex: 11 }}
      >
        <SpeechBubble text={status.text} speed={48} />
      </div>

      {/* 안정 게이지 — 압박 없이 차분 */}
      <div
        className="absolute left-0 right-0 flex justify-center"
        style={{ bottom: 180, zIndex: 11 }}
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
