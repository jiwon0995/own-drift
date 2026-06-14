'use client';

/**
 * 양옆 사이드 배너 — 고정 이미지(왼쪽 banner-1 / 오른쪽 banner-2) 위에 게임 중 효과 오버레이.
 *
 * 이미지는 항상 고정. 그 위 .side-banner__fx가 --stability(루프가 매 프레임 write)에 반응해
 * 구간 이탈 시 소란색을 blend로 얹는다 — 안정(=1)이면 opacity 0으로 이미지 그대로.
 * 추후 게임 중 효과는 이 오버레이 레이어에 더 얹는다.
 *
 * 클릭 시 연결된 외부 링크를 새 창으로 연다(target=_blank + rel=noopener noreferrer).
 * 인터랙티브 요소라 aria-hidden을 쓰지 않고 aria-label로 목적지를 알린다(이미지는 alt="" 장식).
 */

interface SideBannerProps {
  side: 'left' | 'right';
}

interface BannerInfo {
  /** public/images 경로 */
  src:   string;
  /** 클릭 시 새 창으로 열 외부 링크 */
  href:  string;
  /** 스크린리더용 라벨 — 도메인 기반(새 창 안내 포함) */
  label: string;
}

/** 왼쪽=banner-1, 오른쪽=banner-2. */
const BANNER: Record<SideBannerProps['side'], BannerInfo> = {
  left: {
    src:   '/images/banner-1.png',
    href:  'https://nol.yanolja.com/ticket/products/26008189',
    label: '야놀자 (새 창에서 열림)',
  },
  right: {
    src:   '/images/banner-2.png',
    href:  'https://www.youtube.com/playlist?list=OLAK5uy_mI3-Pb3_3pwCLegdLaurhcBdT8m8hHk38',
    label: 'YouTube 재생목록 (새 창에서 열림)',
  },
};

export default function SideBanner({ side }: SideBannerProps) {
  const { src, href, label } = BANNER[side];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="side-banner relative block h-full w-full overflow-hidden"
      data-side={side}
      aria-label={label}
    >
      {/* 고정 이미지 — 배너 슬롯을 꽉 채움. 전역 pixelated 상속을 끄고 선명하게(광고 이미지는 픽셀아트 아님). */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ imageRendering: 'auto' }}
        draggable={false}
      />
      {/* 게임 중 효과 오버레이 — 구간 이탈 시 소란색이 이미지 위에 얹힘(클릭은 통과) */}
      <div className="side-banner__fx absolute inset-0 pointer-events-none" />
    </a>
  );
}
