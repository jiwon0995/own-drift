'use client';

/**
 * 양옆 광고 배너 (Phase 4B/4C).
 *
 * - idle / loud : 게임 중. 배경은 --stability에 *연속* 반응(안정=차분 idle색 ↔ 이탈=소란 loud색),
 *   color-mix 보간으로 — 4A --gauge-fill-current와 동일한 패턴. 'loud'는 광고 문구도 바뀐다.
 * - company    : 클리어 이스터에그. 광고가 아닌 애정 어린 오마주. 깜빡임·애니메이션 없이 조용히 등장.
 *
 * 소란(idle↔loud)의 *연속 배경*은 CSS(--stability)가, *문구 전환*은 GameShell의
 * bannerVariant(useState)가 구동한다. variant는 디바운스되어 차분하게만 바뀐다.
 */

import { COMPANY_NAME } from '@/lib/game/constants';

interface SideBannerProps {
  variant: 'idle' | 'loud' | 'company';
  side:    'left' | 'right';
}

export default function SideBanner({ variant, side }: SideBannerProps) {
  const isCompany = variant === 'company';
  const adText    = variant === 'loud' ? 'AD! AD!' : '광고';

  return (
    <div
      className={`side-banner side-banner--${variant} flex h-full w-full flex-col items-center justify-around gap-3 px-2.5 py-4`}
      data-side={side}
      aria-hidden
    >
      {isCompany ? (
        <>
          {/* 상단: 애정 어린 헌사 */}
          <div className="banner-ad banner-ad--company">♥ {COMPANY_NAME}</div>
          {/* 하단: 게임 이름(픽셀 폰트) */}
          <div className="banner-ad banner-ad--company font-pixel">own-drift</div>
        </>
      ) : (
        <>
          <div className="banner-ad">{adText}</div>
          <div className="banner-ad">{adText}</div>
        </>
      )}
    </div>
  );
}
