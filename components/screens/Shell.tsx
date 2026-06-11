import type { ReactNode } from 'react';

interface ShellProps {
  leftBanner?: ReactNode;
  rightBanner?: ReactNode;
  children: ReactNode;
}

export default function Shell({ leftBanner, rightBanner, children }: ShellProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-base">
      {/*
        데스크톱(≥1280px): 배너 240 / 게임 1fr / 배너 240
        모바일(<768px):    게임 1fr, 배너 숨김
        pixel-frame은 전체 셸을 감쌈
      */}
      <div className="pixel-frame w-full max-w-[1280px] grid grid-cols-[1fr] md:grid-cols-[240px_1fr_240px] h-[520px] bg-base overflow-hidden">
        {/* 왼쪽 배너 */}
        <aside className="hidden md:flex flex-col items-center justify-around px-2.5 py-4 bg-banner-idle">
          {leftBanner}
        </aside>

        {/* 게임 뷰포트 */}
        <main className="scanline-vignette relative overflow-hidden h-full">
          {children}
        </main>

        {/* 오른쪽 배너 */}
        <aside className="hidden md:flex flex-col items-center justify-around px-2.5 py-4 bg-banner-idle">
          {rightBanner}
        </aside>
      </div>
    </div>
  );
}
