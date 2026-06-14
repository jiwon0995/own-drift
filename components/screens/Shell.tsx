import type { ReactNode, Ref } from 'react';

interface ShellProps {
  leftBanner?:  ReactNode;
  rightBanner?: ReactNode;
  /**
   * 3단 그리드 컨테이너에 붙는 ref. 게임 루프가 여기에 --stability를 매 프레임 write하면
   * 양옆 배너(aside)와 게임 뷰포트(main)가 *공통 조상*에서 상속한다 (Phase 4A/4B).
   */
  rootRef?:     Ref<HTMLDivElement>;
  /** 게임 뷰포트(main)에 붙는 ref — Phase 6 캡처가 크기·러너색을 읽는다. */
  viewportRef?: Ref<HTMLElement>;
  children:     ReactNode;
}

export default function Shell({ leftBanner, rightBanner, rootRef, viewportRef, children }: ShellProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-base">
      {/*
        데스크톱(≥768px): 배너 240 / 게임 1fr / 배너 240
        모바일(<768px):    게임 1fr, 배너 숨김
        pixel-frame은 전체 셸을 감쌈. --stability는 이 그리드 div에서 상속된다.
      */}
      <div
        ref={rootRef}
        className="pixel-frame w-full max-w-[1280px] grid grid-cols-[1fr] md:grid-cols-[240px_1fr_240px] h-[520px] bg-base overflow-hidden"
      >
        {/* 왼쪽 배너 슬롯 — SideBanner가 배경·레이아웃을 직접 채운다 */}
        <aside className="hidden md:block">{leftBanner}</aside>

        {/*
          게임 뷰포트. touch-none = 더블탭 줌·팬 차단(빠른 연타 시 확대 방지 + 홀드 중 손가락
          드리프트로 pointercancel 나는 것 방지). select-none = 길게 눌러도 텍스트 선택 안 됨.
        */}
        <main ref={viewportRef} className="scanline-vignette relative overflow-hidden h-full touch-none select-none">
          {children}
        </main>

        {/* 오른쪽 배너 슬롯 */}
        <aside className="hidden md:block">{rightBanner}</aside>
      </div>
    </div>
  );
}
