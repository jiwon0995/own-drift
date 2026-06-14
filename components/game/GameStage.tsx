'use client';

/**
 * 지속 스테이지 + 3단 셸 (Phase 4B/4C 통합).
 *
 * 게임 루프를 소유하고 --stability를 셸 그리드(배너·뷰포트의 공통 조상)에 매 프레임 write한다.
 * 그래서 양옆 배너 소란(--banner-soran)과 뷰포트 선명도/흔들림(.scene-fx)이 모두 상속으로 구동된다.
 *
 * 레이아웃:  [SideBanner] | [game viewport] | [SideBanner]
 *   viewport = .scene-fx(Background, blur/흔들림) + 러너(또렷) + 화면 오버레이(children)
 *
 * 자식 오버레이(Title/FindPace/MainPlay…)는 useGameStage()로 snapshot·컨트롤을 읽는다.
 * scene/scrollSpeed/bannerVariant는 이 컴포넌트가 snapshot+screen에서 파생한다.
 */

import { createContext, useContext, useRef, type ReactNode, type Ref } from 'react';
import { useGameLoop }      from '@/hooks/useGameLoop';
import { useAudio }         from '@/hooks/useAudio';
import { GAME_CONSTANTS }   from '@/lib/game/constants';
import { playProgressToScene } from '@/lib/game/engine';
import type { LoopSnapshot, Band, Scene, Screen } from '@/lib/game/types';
import Shell                from '@/components/screens/Shell';
import SideBanner           from '@/components/hud/SideBanner';
import MuteButton           from '@/components/hud/MuteButton';
import Background           from './Background';
import PixelRunner         from './PixelRunner';

const {
  MIN_SPEED, MAX_SPEED, REQUIRED_STABILIZATIONS, STABILITY_GAUGE_FULL,
  SCROLL_SPEED_STEPS,
} = GAME_CONSTANTS;

interface GameStageContextValue {
  snapshot:          LoopSnapshot;
  resetAnchor:       () => void;
  resetStability:    () => void;
  setPresenceActive: (active: boolean) => void;
}

const GameStageContext = createContext<GameStageContextValue | null>(null);

export function useGameStage(): GameStageContextValue {
  const ctx = useContext(GameStageContext);
  if (!ctx) throw new Error('useGameStage must be used inside <GameStage>');
  return ctx;
}

/** 프롤로그 화면 — road 고정(학습 구간). 본편(journeyStart~)은 도시 씬으로 진행한다. */
const PROLOGUE_SCREENS: Screen[] = ['title', 'tutorial', 'findPace'];

/** clear 이후 화면은 진행도와 무관하게 space로 고정한다. */
const POST_CLEAR_SCREENS: Screen[] = ['clear', 'landscape', 'crossroad'];

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface GameStageProps {
  /** 현재 화면 — 씬(clear→space) · 배너 이스터에그 트리거에 사용. */
  screen:        Screen;
  ambient?:      boolean;
  /** 확정된 내 구간 — Main Play에서 안정 게이지 계산용. */
  band?:         Band | null;
  /**
   * 클리어 도달 후 true. "계속 달리기"로 Main Play에 복귀해도 클리어 상태(우주 배경 + 평온)를
   * 유지한다 — 화면이 POST_CLEAR가 아니어도 씬을 space로 고정하고 band를 비활성(평온)으로 둔다.
   */
  cleared?:      boolean;
  /** 안정 게이지 가득 이벤트 (2C·Phase 3 소비). */
  onStabilized?: () => void;
  /** 게임 뷰포트(main)에 전달할 ref — Phase 6 엔딩 캡처용. */
  viewportRef?:  Ref<HTMLElement>;
  children?:     ReactNode;
}

export default function GameStage({ screen, ambient = false, band = null, cleared = false, onStabilized, viewportRef, children }: GameStageProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // 클리어 상태 — 클리어 이후 화면(clear/landscape/crossroad)이거나, "계속 달리기"로 복귀한
  // 자유주행(cleared && mainPlay)을 함께 포괄한다. 둘 다 우주 배경 + 평온(band 비활성)을 유지.
  const atClearState = cleared || POST_CLEAR_SCREENS.includes(screen);

  // 클리어 상태는 평온 — 씬을 space로 고정하듯 --stability도 1로 둬 배너 소란(loud)·씬 색온도
  // 변화를 끈다. band=null이면 루프가 rawSignal=1로 유지(Phase 6).
  const loopBand = atClearState ? null : band;

  // 루프: --stability를 rootRef(셸 그리드)에 write. bgRef는 넘기지 않음 — 지면 스크롤은 Background가 CSS로.
  const { snapshot, resetAnchor, resetStability, setPresenceActive } = useGameLoop({
    rootRef,
    ambient,
    band: loopBand,
    onStabilized,
  });

  // ── 4C 씬 진행 ──
  // gameProgress = (누적 안정 횟수 + 현재 안정 게이지 비율) / 필요 횟수. 단방향, [0,1] clamp.
  // 프롤로그(title/tutorial/findPace)는 road, clear 이후는 space 고정.
  // 본편(journeyStart/mainPlay/return)은 진입부터 도시(cityDay→cityNight→highway).
  // 프롤로그와 본편 진입은 둘 다 gameProgress 0이라 씬은 *화면 단계*로 갈라야 한다.
  const gaugeRatio   = Math.min(1, snapshot.stabilityProgress / STABILITY_GAUGE_FULL);
  const gameProgress = Math.min(1, (snapshot.stabilizations + gaugeRatio) / REQUIRED_STABILIZATIONS);
  const scene: Scene =
    atClearState ? 'space'
    : PROLOGUE_SCREENS.includes(screen) ? 'road'
    : playProgressToScene(gameProgress);

  // ── 4C 스크롤 속도 ──
  // 평균 페이스(emaSpeed)를 0~1로 정규화 후 양자화 — duration 문자열을 안정화(애니메이션 재시작 방지).
  const norm        = (snapshot.emaSpeed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED);
  const scrollSpeed = Math.max(0, Math.min(1, Math.round(norm * SCROLL_SPEED_STEPS) / SCROLL_SPEED_STEPS));

  // ── Phase 5 오디오 ──
  // BGM(전 구간) + 발자국(playbackRate ← 순간 속도, 러너 gait와 동기) + 앰비언스(scene 연동).
  // 발자국은 평균이 아닌 *순간* 속도(snapshot.speed)로 — 보이는 발과 일치. 음소거는 master 전체.
  const footSpeed = Math.max(0, Math.min(1, (snapshot.speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)));
  const { isMuted, toggleMute } = useAudio({ scene, speed: footSpeed });

  return (
    <GameStageContext.Provider value={{ snapshot, resetAnchor, resetStability, setPresenceActive }}>
      <Shell
        rootRef={rootRef}
        viewportRef={viewportRef}
        leftBanner={<SideBanner side="left" />}
        rightBanner={<SideBanner side="right" />}
      >
        {/* 씬 레이어 — 색온도는 여기에만 적용(러너·UI는 또렷 유지) */}
        <div className="scene-fx absolute inset-0">
          <Background scene={scene} scrollSpeed={scrollSpeed} />
        </div>

        {/*
          러너 — 또렷한 앵커("세상은 흔들려도 나는 나").
          journeyStart는 화면 오버레이(z-10)가 자체 씬을 덮어 그리므로, 그 위(z-11)로 올려
          내러티브·슬라이드 전환 내내 러너가 계속 보이게 한다. 스캔라인(z-20)보다는 아래.
        */}
        <div
          className={`absolute ${screen === 'journeyStart' ? 'z-[11]' : 'z-[8]'}`}
          style={{
            bottom:          100,
            left:            '48%',
            transform:       'translateX(-50%) scale(3)',
            transformOrigin: 'bottom center',
            imageRendering:  'pixelated',
          }}
        >
          <PixelRunner speed={snapshot.speed} paused={reducedMotion} />
        </div>

        {/* 화면 오버레이 */}
        <div className="absolute inset-0 z-[10]">{children}</div>

        {/* 음소거 토글 — 뷰포트 우측 상단(스캔라인 위, 오버레이 위) */}
        <MuteButton isMuted={isMuted} onToggle={toggleMute} />
      </Shell>
    </GameStageContext.Provider>
  );
}
