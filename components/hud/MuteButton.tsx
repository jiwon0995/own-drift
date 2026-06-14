'use client';

/**
 * 음소거 토글 — 게임 뷰포트 우측 상단 고정(32×32, z-30 스캔라인 위).
 *
 * 아이콘은 lucide 등 미사용 → PixelRunner와 동일하게 box-shadow 픽셀(5px 유닛)로 직접 그린다.
 * 색은 --mute-icon(globals.css .mute-btn) 참조 — hover=accent, muted=faint. (단일 출처)
 *  - 음소거 해제: 스피커 + 음파
 *  - 음소거:      스피커 + 사선(슬래시), opacity 0.6
 */

const U = 5; // 픽셀 유닛 px

// 6열(0..5) × 5행(0..4) 그리드. [col, row]
const SPEAKER: [number, number][] = [
  [0, 2],
  [1, 1], [1, 2], [1, 3],
  [2, 0], [2, 1], [2, 2], [2, 3], [2, 4],
];
const WAVES: [number, number][] = [
  [4, 1], [4, 3],
  [5, 0], [5, 2], [5, 4],
];
const SLASH: [number, number][] = [
  [1, 4], [2, 3], [3, 2], [4, 1], [5, 0],
];

function buildShadow(pixels: [number, number][], color: string): string {
  return pixels.map(([x, y]) => `${x * U}px ${y * U}px 0 ${color}`).join(', ');
}

interface MuteButtonProps {
  isMuted:  boolean;
  onToggle: () => void;
}

export default function MuteButton({ isMuted, onToggle }: MuteButtonProps) {
  const pixels = isMuted ? [...SPEAKER, ...SLASH] : [...SPEAKER, ...WAVES];
  const shadow = buildShadow(pixels, 'var(--mute-icon)');
  const label  = isMuted ? '음소거 해제' : '음소거';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={isMuted}
      title={label}
      data-muted={isMuted}
      className="mute-btn absolute top-3 right-3 z-30 grid place-items-center w-8 h-8 cursor-pointer bg-game"
      style={{ border: '2px solid #0a0706', borderRadius: 0, padding: 0, imageRendering: 'pixelated' }}
    >
      {/* 아이콘 bounds 6U×5U — 버튼 중앙 정렬 */}
      <span style={{ position: 'relative', width: 6 * U, height: 5 * U, opacity: isMuted ? 0.6 : 1 }}>
        <i style={{ position: 'absolute', left: 0, top: 0, width: U, height: U, boxShadow: shadow }} />
      </span>
    </button>
  );
}
