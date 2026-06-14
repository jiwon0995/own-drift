'use client';

/**
 * 안정 게이지 — design-system .gauge 이식 최소판. 동작 로직은 2B 그대로(progress만 받음).
 * 채움색은 --gauge-fill-current로 stability에 *절제되게* 반응(Phase 4A).
 * prefers-reduced-motion: 채움 너비 표시 없음(정적 빈 게이지) — 색 보간은 모션 아님이라 무관.
 */

import { GAUGE_COPY } from '@/lib/content/copy';

interface StabilityGaugeProps {
  progress: number;
  full:     number;
  /** 라벨 텍스트. 기본은 Find Pace 안착 라벨. Main Play는 stabilizing 전달. */
  label?:   string;
  /** 게이지 외곽 최대 폭(px). 기본 180. Main Play는 유지 시간↑(10초)에 맞춰 넓게. 모바일은 90vw로 자동 축소. */
  width?:   number;
}

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function StabilityGauge({ progress, full, label = GAUGE_COPY.anchoring, width = 180 }: StabilityGaugeProps) {
  const ratio   = reducedMotion ? 0 : Math.min(1, Math.max(0, progress / full));
  const fillPct = Math.round(ratio * 100);

  return (
    <div className="flex flex-col items-center gap-[8px]">
      <span className="font-pixel text-body text-ink-faint">
        {label}
      </span>

      {/* 외곽 — 이중 픽셀 테두리 */}
      <div
        style={{
          width:     `min(${width}px, 90vw)`,
          height:    14,
          background: '#140d0a',
          border:    '2px solid #3a2a22',
          boxShadow: 'inset 0 0 0 1px #0a0706, 2px 2px 0 0 rgba(0,0,0,0.55)',
          padding:   2,
        }}
      >
        {/* 채움 — 색은 stability에 절제되게 반응 */}
        <div
          style={{
            width:      `${fillPct}%`,
            height:     '100%',
            background: 'var(--gauge-fill-current)',
            boxShadow:  fillPct > 0 ? 'inset 0 0 0 1px #ffd9a0' : 'none',
          }}
        />
      </div>
    </div>
  );
}
