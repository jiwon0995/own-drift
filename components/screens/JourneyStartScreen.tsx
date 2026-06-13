'use client';

/**
 * Journey Start — Find Pace → Main Play 사이 내러티브 전환 화면.
 *
 * 디자인 원칙(03-screens.md · game-screens.html):
 *  1. 버튼 없음 — 마지막 문단 완료 후 자동으로 Main Play로 전환(플레이어를 재촉하지 않음).
 *  2. 컷이 아니라 공간이 밀려오는 슬라이드 — 길을 달려 다음 풍경으로 진입하는 느낌.
 *  3. border-radius:0 — 전환 오버레이 포함 모든 요소 각짐 유지.
 *  4. 실패 없음 — 게이지·경고·판정 없는 순수 내러티브 구간.
 *
 * 구조(self-contained): journeyStart 씬을 이 컴포넌트가 직접 덮어 렌더한다(GameStage는 건드리지 않음).
 * 그래서 슬라이드가 드러내는 씬 = Main Play 진입 씬과 같아, 오버레이 제거 시 컷/크로스페이드 없이 매끄럽다.
 *
 * 타이핑: PARAGRAPHS를 한 말풍선에 교체식 순차 타이핑(SpeechBubble의 text 변경 = 리셋·재타이핑).
 * 전환: 마지막 문단 + FINAL_HOLD 후, outgoing(journeyStart) -30% · incoming(다음 씬) 100%→0 동시 슬라이드.
 *        rAF 비의존(프리뷰 hidden 탭은 rAF가 멈춤) — reflow 후 transform을 동기 적용해 transition을 발화한다.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { playProgressToScene } from '@/lib/game/engine';
import { JOURNEY_START_PARAGRAPHS } from '@/lib/content/copy';
import { SceneLayer } from '@/components/game/Background';
import SpeechBubble from '@/components/game/SpeechBubble';

const TYPE_SPEED_MS     = 55;    // 글자당 타이핑 간격
const PARA_PAUSE_MS     = 400;   // 문단 완료 후 다음 문단까지 pause
const FINAL_HOLD_MS     = 600;   // 마지막 문단 완료 후 슬라이드 시작까지
const SLIDE_MS          = 1100;  // 슬라이드 전환 시간
const SLIDE_FALLBACK_MS = 1300;  // transitionend 누락(hidden 탭) 대비 폴백
const NARRATIVE_SCROLL  = 0.5;   // journeyStart 지면 스크롤(전진감) — 게이지 무관 고정값
const BUBBLE_TOP        = 300;   // 말풍선 세로 위치(game-screens.html bubbleTop)

/**
 * 슬라이드가 드러낼 씬 = Main Play 진입 씬 = cityDay(도시).
 * GameStage도 본편 진입을 cityDay로 두므로(playProgressToScene) 오버레이 제거 시 컷 없이 잇는다.
 */
const NEXT_SCENE = playProgressToScene(0);

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface JourneyStartScreenProps {
  /** 전환 완료 시 호출 — 부모가 mainPlay로 이동한다. */
  onComplete: () => void;
}

export default function JourneyStartScreen({ onComplete }: JourneyStartScreenProps) {
  const [index, setIndex]     = useState(0);
  const [sliding, setSliding] = useState(false);

  // 진행 중 타이머 모음 — 언마운트/강제 이동 시 전부 정리
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const after = (ms: number, fn: () => void) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
  };
  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // onComplete 최신 참조
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // 전환 완료(중복 방지) — transitionend 우선 + 폴백 타이머 공용
  const doneRef = useRef(false);
  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    onCompleteRef.current();
  }

  // 문단 타이핑 완료 → 다음 문단(pause) / 마지막이면 hold 후 슬라이드
  const isLast = index >= JOURNEY_START_PARAGRAPHS.length - 1;
  function handleParaDone() {
    if (sliding) return;
    if (isLast) after(FINAL_HOLD_MS, () => setSliding(true));
    else        after(PARA_PAUSE_MS, () => setIndex(i => i + 1));
  }

  // ── 슬라이드 발화 ── reflow로 시작 상태를 확정한 뒤 목표 transform을 동기 적용(rAF 비의존).
  const outRef = useRef<HTMLDivElement>(null);
  const incRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!sliding) return;
    const out = outRef.current;
    const inc = incRef.current;
    if (!out || !inc) return;
    if (reducedMotion) { finish(); return; }   // 모션 끄면 즉시 완료(슬라이드 생략)
    void out.offsetWidth;                       // reflow — 시작 상태(0 / 100%) 확정
    out.style.transform = 'translateX(-30%)';   // 현재 씬: 왼쪽으로 살짝(parallax)
    inc.style.transform = 'translateX(0)';      // 다음 씬: 오른쪽에서 밀려들어옴
    after(SLIDE_FALLBACK_MS, finish);           // transitionend 누락 대비 안전 폴백
  }, [sliding]);

  // ── 슬라이드 단계 ── z-30: 타이핑 커버·러너 위를 덮는다. 각짐 유지.
  if (sliding) {
    return (
      <div className="absolute inset-0 z-30 overflow-hidden pointer-events-none" style={{ borderRadius: 0 }}>
        <div
          ref={outRef}
          className="absolute inset-0"
          style={{ transform: 'translateX(0)', transition: `transform ${SLIDE_MS}ms ease-in-out` }}
        >
          <SceneLayer scene="journeyStart" scrollSpeed={NARRATIVE_SCROLL} />
        </div>
        <div
          ref={incRef}
          className="absolute inset-0"
          style={{ transform: 'translateX(100%)', transition: `transform ${SLIDE_MS}ms ease-in-out` }}
          onTransitionEnd={(e) => { if (e.propertyName === 'transform') finish(); }}
        >
          <SceneLayer scene={NEXT_SCENE} scrollSpeed={NARRATIVE_SCROLL} />
        </div>
      </div>
    );
  }

  // ── 타이핑 단계 ── journeyStart 씬 커버(부드럽게 등장) + 순차 타이핑 말풍선.
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute inset-0"
        style={{ animation: reducedMotion ? undefined : 'scene-fade-in 500ms ease both' }}
      >
        <SceneLayer scene="journeyStart" scrollSpeed={NARRATIVE_SCROLL} />
      </div>

      <div
        className="absolute left-0 right-0 flex justify-center px-8"
        style={{ top: BUBBLE_TOP, zIndex: 10 }}
      >
        <SpeechBubble text={JOURNEY_START_PARAGRAPHS[index]} speed={TYPE_SPEED_MS} onDone={handleParaDone} />
      </div>
    </div>
  );
}
