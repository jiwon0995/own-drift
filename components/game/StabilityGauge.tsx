'use client';

/**
 * 안착(Find Pace) 게이지 — design-system .gauge 이식 최소판.
 * 폴리싱(애니메이션·색 보간)은 Phase 4.
 * prefers-reduced-motion: 채움 표시 없음(정적 빈 게이지).
 */

import { GAUGE_COPY } from '@/lib/content/copy';

interface StabilityGaugeProps {
  progress: number;
  full:     number;
  /** 라벨 텍스트. 기본은 Find Pace 안착 라벨. Main Play는 stabilizing 전달. */
  label?:   string;
}

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function StabilityGauge({ progress, full, label = GAUGE_COPY.anchoring }: StabilityGaugeProps) {
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
          width:     180,
          height:    14,
          background: '#140d0a',
          border:    '2px solid #3a2a22',
          boxShadow: 'inset 0 0 0 1px #0a0706, 2px 2px 0 0 rgba(0,0,0,0.55)',
          padding:   2,
        }}
      >
        {/* 채움 */}
        <div
          style={{
            width:      `${fillPct}%`,
            height:     '100%',
            background: '#ffb257',
            boxShadow:  fillPct > 0 ? 'inset 0 0 0 1px #ffd9a0' : 'none',
          }}
        />
      </div>
    </div>
  );
}
