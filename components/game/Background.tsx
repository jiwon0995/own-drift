'use client';

/**
 * 배경 씬 (Phase 4C) — game-screens.html buildScene를 순수 React로 이식.
 * DOM 직접 조작 없이 JSX + CSS만 사용한다.
 *
 * - 5개 씬(road/cityDay/cityNight/highway/space)을 sky gradient + 데코로 그린다.
 * - scene 변경 시 새 레이어가 위에서 fade-in(crossfade) → 이전 레이어를 덮는다.
 * - 별 등 *랜덤* 데코 좌표는 useMemo로 레이어 1회 생성 — 전환/리렌더마다 재계산하지 않는다.
 * - 지면 스크롤 라인은 scrollSpeed(0~1)를 animation-duration으로 받아 빨라지고/느려진다.
 *
 * 씬별 색·좌표는 디자인 목업(game-screens.html) 1:1. 게임 로직 수치가 아니라
 * 프리젠테이션 상수라 GameStage 패턴대로 컴포넌트에 인라인한다.
 */

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { GAME_CONSTANTS } from '@/lib/game/constants';
import type { Scene } from '@/lib/game/types';

const { GROUND_SCROLL_FAST_S, GROUND_SCROLL_SLOW_S, SCENE_CROSSFADE_MS } = GAME_CONSTANTS;

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface BackgroundProps {
  scene:       Scene;
  /** 0~1. 지면 스크롤 animation-duration 연동용(1=빠름). GameStage가 양자화해 전달. */
  scrollSpeed: number;
}

// ── 씬별 하늘 gradient (buildScene) ───────────────────────────────────────
const SKY: Record<Scene, string> = {
  road:         'linear-gradient(180deg,#6f9bc4 0%,#9cc0dd 55%,#c9ddd0 100%)',
  journeyStart: 'linear-gradient(180deg,#f0c97a 0%,#f5dfa0 40%,#e8c88a 100%)', // 노란기 도는 이른 아침
  cityDay:      'linear-gradient(180deg,#7fa8c8 0%,#e0b890 100%)',
  cityNight:    'linear-gradient(180deg,#140f22 0%,#3a2238 100%)',
  highway:      'linear-gradient(180deg,#16121f 0%,#241a2a 100%)',
  space:        'radial-gradient(ellipse at 50% 120%,#2b1a3a 0%,#14101e 60%,#0d0a14 100%)',
};

// ── 씬별 90px 지면 채움 색. space는 지면 없음(undefined) ──────────────────
const GROUND_FILL: Partial<Record<Scene, string>> = {
  road:         '#3a3026',
  journeyStart: '#4a3826',   // road 패턴, 색만 따뜻하게
  cityDay:      '#2a1d18',
  cityNight:    '#160f14',
  highway:      '#161018',
};

// ── 결정적(deterministic) 데코 — import 시 1회 산출, 랜덤 아님 ─────────────
const ROAD_CLOUDS = [
  { left: 60,  top: 70,  width: 90,  height: 22 },
  { left: 280, top: 120, width: 120, height: 26 },
  { left: 480, top: 60,  width: 70,  height: 18 },
];
// journeyStart 구름 — road 패턴, 더 낮게(top↑) 더 선명하게(opacity↑)
const JOURNEY_CLOUDS = [
  { left: 60,  top: 95,  width: 90,  height: 22 },
  { left: 280, top: 150, width: 120, height: 26 },
  { left: 480, top: 85,  width: 70,  height: 18 },
];
// journeyStart 원경 언덕 실루엣 2겹 — 각짐(clip-path) 유지, 수평선 강조
const JOURNEY_HILLS = [
  { height: 70, background: '#e3b878', zIndex: 2, clip: 'polygon(0 100%,0 55%,18% 35%,40% 60%,62% 25%,82% 55%,100% 30%,100% 100%)' },
  { height: 48, background: '#cf9a55', zIndex: 3, clip: 'polygon(0 100%,0 70%,30% 40%,55% 75%,78% 45%,100% 70%,100% 100%)' },
];
// cityDay/cityNight 빌딩 9개 — buildScene 공식 그대로
const CITY_BUILDINGS = Array.from({ length: 9 }, (_, i) => ({
  left:   `${i * 11.5}%`,
  width:  40 + ((i * 37) % 50),
  height: 100 + ((i * 53) % 150),
}));
// highway 원경 빌딩 14개
const HW_BUILDINGS = Array.from({ length: 14 }, (_, i) => ({
  left:   `${i * 7.3}%`,
  height: 20 + ((i * 29) % 40),
}));
// highway 나무 7개 (몸통 + 수관)
const HW_TREES = Array.from({ length: 7 }, (_, i) => {
  const x  = 20 + i * 14;
  const th = 36 + ((i * 31) % 28);
  return { x, th };
});

interface Star { left: string; top: string; opacity: number }

/** 씬별 랜덤 별 좌표 — useMemo로 레이어당 1회만 생성한다. */
function makeStars(scene: Scene): Star[] {
  const rnd = (n: number, make: () => Star) => Array.from({ length: n }, make);
  if (scene === 'cityNight')
    return rnd(24, () => ({ left: `${5 + Math.random() * 90}%`, top: `${Math.random() * 45}%`, opacity: 0.8 }));
  if (scene === 'highway')
    return rnd(22, () => ({ left: `${5 + Math.random() * 90}%`, top: `${Math.random() * 40}%`, opacity: 0.7 }));
  if (scene === 'space')
    return rnd(70, () => ({ left: `${2 + Math.random() * 96}%`, top: `${2 + Math.random() * 96}%`, opacity: 0.4 + Math.random() * 0.5 }));
  return [];
}

/**
 * 한 씬의 sky + 데코 + 지면. 랜덤 별만 useMemo, 나머지는 결정적.
 * JourneyStartScreen이 슬라이드 전환의 outgoing/incoming 레이어로 직접 재사용한다(named export).
 */
export function SceneLayer({ scene, scrollSpeed }: { scene: Scene; scrollSpeed: number }) {
  // scene은 이 레이어 수명 동안 고정 → 별 좌표는 마운트 시 1회 산출(전환/스크롤 변동에 불변)
  const stars = useMemo(() => makeStars(scene), [scene]);

  const groundFill = GROUND_FILL[scene];
  // scrollSpeed 1 → FAST, 0 → SLOW 선형 매핑
  const scrollDur = GROUND_SCROLL_SLOW_S + (GROUND_SCROLL_FAST_S - GROUND_SCROLL_SLOW_S) * scrollSpeed;
  const isNight = scene === 'cityNight';

  return (
    <>
      {/* 하늘 */}
      <div className="absolute inset-0" style={{ background: SKY[scene] }} />

      {/* 구름 (road) */}
      {scene === 'road' && ROAD_CLOUDS.map((c, i) => (
        <div
          key={`cloud-${i}`}
          className="absolute"
          style={{ left: c.left, top: c.top, width: c.width, height: c.height, borderRadius: 14, background: 'rgba(243,230,216,.6)', opacity: 0.7 }}
        />
      ))}

      {/* 구름 + 원경 언덕 (journeyStart) */}
      {scene === 'journeyStart' && JOURNEY_CLOUDS.map((c, i) => (
        <div
          key={`jcloud-${i}`}
          className="absolute"
          style={{ left: c.left, top: c.top, width: c.width, height: c.height, borderRadius: 14, background: 'rgba(243,230,216,.6)', opacity: 0.9 }}
        />
      ))}
      {scene === 'journeyStart' && JOURNEY_HILLS.map((h, i) => (
        <div
          key={`jhill-${i}`}
          className="absolute left-0 right-0"
          style={{ bottom: 90, height: h.height, background: h.background, zIndex: h.zIndex, borderRadius: 0, clipPath: h.clip }}
        />
      ))}

      {/* 달 (cityNight) */}
      {isNight && (
        <div className="absolute" style={{ right: '18%', top: 40, width: 34, height: 34, borderRadius: '50%', background: '#f3e6d8' }} />
      )}

      {/* 별 (cityNight/highway/space) — 랜덤, 메모이즈 */}
      {stars.map((s, i) => (
        <div
          key={`star-${i}`}
          className="absolute"
          style={{ left: s.left, top: s.top, width: 2, height: 2, borderRadius: '50%', background: '#f3e6d8', opacity: s.opacity }}
        />
      ))}

      {/* 빌딩 (cityDay/cityNight) */}
      {(scene === 'cityDay' || isNight) && CITY_BUILDINGS.map((b, i) => (
        <div
          key={`bld-${i}`}
          className="absolute"
          style={{ bottom: 90, left: b.left, width: b.width, height: b.height, background: isNight ? '#000' : '#4a4658', zIndex: 3 }}
        />
      ))}

      {/* 원경 빌딩 (highway) */}
      {scene === 'highway' && HW_BUILDINGS.map((b, i) => (
        <div
          key={`hb-${i}`}
          className="absolute"
          style={{ bottom: 120, left: b.left, width: 26, height: b.height, background: '#241c2e', zIndex: 2 }}
        />
      ))}

      {/* 나무 (highway) — 몸통 + 수관 */}
      {scene === 'highway' && HW_TREES.map((t, i) => (
        <Fragment key={`tree-${i}`}>
          <div className="absolute" style={{ bottom: 90, left: `${t.x}%`, width: 8, height: t.th, background: '#1a2420', zIndex: 3 }} />
          <div className="absolute" style={{ bottom: 90 + t.th - 6, left: `calc(${t.x}% - 11px)`, width: 30, height: 30, borderRadius: '50% 50% 45% 45%', background: '#1f2e26', zIndex: 3 }} />
        </Fragment>
      ))}

      {/* 지면 채움 (space 제외) */}
      {groundFill && (
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 90, background: groundFill, zIndex: 4 }} />
      )}

      {/* 지면 스크롤 라인 (space 제외) — duration이 scrollSpeed 연동 */}
      {groundFill && (
        <div
          className="ground-scroll-line absolute left-0 right-0"
          style={{
            bottom: 90,
            height: 2,
            zIndex: 5,
            ...(reducedMotion ? { animation: 'none' } : { animationDuration: `${scrollDur}s` }),
          }}
        />
      )}
    </>
  );
}

export default function Background({ scene, scrollSpeed }: BackgroundProps) {
  // crossfade 스택: scene 변경 시 새 레이어를 쌓고, crossfade 후 최신만 남긴다.
  const [layers, setLayers] = useState<{ scene: Scene; key: number }[]>(() => [{ scene, key: 0 }]);
  const keyRef  = useRef(0);
  const lastRef = useRef(scene);

  useEffect(() => {
    if (scene === lastRef.current) return;
    lastRef.current = scene;
    const key = ++keyRef.current;
    setLayers(prev => [...prev, { scene, key }]);
    const t = setTimeout(() => setLayers(prev => prev.filter(l => l.key === key)), SCENE_CROSSFADE_MS);
    return () => clearTimeout(t);
  }, [scene]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {layers.map(l => (
        <div
          key={l.key}
          className="scene-layer absolute inset-0"
          style={{ animationDuration: reducedMotion ? '0ms' : `${SCENE_CROSSFADE_MS}ms` }}
        >
          <SceneLayer scene={l.scene} scrollSpeed={scrollSpeed} />
        </div>
      ))}
    </div>
  );
}
