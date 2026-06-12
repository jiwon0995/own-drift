'use client';

/**
 * [DEV ONLY] 게임 루프 디버그 하네스 — 튜닝 후 제거 예정.
 *
 * - 배경 스크롤(속도 연동, ref→backgroundPositionX)
 * - 러너 자리표시 블록(스프라이트 X)
 * - 속도 readout: 숫자 + 막대(스로틀 스냅샷)
 * - ACCEL / DECEL / MAX_SPEED 슬라이더(dev 전용)
 */

import { useRef, useState } from 'react';
import { useGameLoop } from '@/hooks/useGameLoop';
import { GAME_CONSTANTS } from '@/lib/game/constants';
import { GamePhase } from '@/lib/game/types';

export default function LoopDebug() {
  const bgRef = useRef<HTMLDivElement>(null);

  // dev 슬라이더 상태 (constants override)
  const [accel,    setAccel]    = useState<number>(GAME_CONSTANTS.ACCEL);
  const [decel,    setDecel]    = useState<number>(GAME_CONSTANTS.DECEL);
  const [maxSpeed, setMaxSpeed] = useState<number>(GAME_CONSTANTS.MAX_SPEED);

  const { snapshot, start, stop } = useGameLoop({
    bgRef,
    constants: { ACCEL: accel, DECEL: decel, MAX_SPEED: maxSpeed },
  });

  const speedPct = ((snapshot.speed - GAME_CONSTANTS.MIN_SPEED) /
                    (maxSpeed       - GAME_CONSTANTS.MIN_SPEED)) * 100;

  return (
    <div className="relative w-full h-full flex flex-col select-none overflow-hidden bg-game">

      {/* ── 배경 스크롤 레이어 ── */}
      <div
        ref={bgRef}
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, #5e4438 0 12px, transparent 12px 24px)',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'left bottom 88px',
          backgroundSize: '24px 2px',
        }}
      />

      {/* ── 러너 자리표시 블록 ── */}
      <div
        className="absolute bottom-[92px] left-[48%] -translate-x-1/2 z-10"
        style={{ width: 10, height: 10, background: '#ffb257' }}
      />

      {/* ── DEV 배지 ── */}
      <div className="absolute top-2 left-2 z-30 text-note font-pixel text-accent-stable opacity-60">
        DEV
      </div>

      {/* ── 컨트롤 힌트 ── */}
      <div className="absolute top-2 right-2 z-30 text-note font-pixel text-ink-faint text-right">
        SPACE = 가속
      </div>

      {/* ── 속도 readout ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[55%] text-center">
        <div className="font-pixel text-label text-ink-soft mb-1">
          {snapshot.speed.toFixed(3)} u/s
        </div>
        {/* 속도 막대 */}
        <div
          className="w-full h-3 border-2 border-[#140d0a] overflow-hidden"
          style={{ background: '#3a2a22', boxShadow: 'inset 0 0 0 1px #000' }}
        >
          <div
            className="h-full transition-none"
            style={{
              width:      `${Math.max(0, Math.min(100, speedPct))}%`,
              background: '#ff9614',
              boxShadow:  'inset 0 -2px 0 0 #d97a08, inset 0 2px 0 0 #ffd9a0',
            }}
          />
        </div>
      </div>

      {/* ── 슬라이더 패널 ── */}
      <div
        className="absolute top-8 left-2 z-30 font-pixel text-note text-ink-faint flex flex-col gap-2"
        style={{ minWidth: 160 }}
      >
        <Slider label="ACCEL"     value={accel}    min={0.1} max={5}   step={0.1} onChange={setAccel} />
        <Slider label="DECEL"     value={decel}    min={0.1} max={5}   step={0.1} onChange={setDecel} />
        <Slider label="MAX_SPD"   value={maxSpeed} min={0.5} max={5}   step={0.1} onChange={setMaxSpeed} />
      </div>

      {/* ── start / stop ── */}
      <div className="absolute bottom-14 right-2 z-30 flex gap-2">
        <button
          onClick={start}
          className="font-pixel text-note px-2 py-1 border border-accent-stable text-accent-stable"
          style={{ background: '#241a17' }}
        >
          START
        </button>
        <button
          onClick={stop}
          className="font-pixel text-note px-2 py-1 border border-ink-faint text-ink-faint"
          style={{ background: '#241a17' }}
        >
          STOP
        </button>
      </div>

      {/* ── 페이즈 표시 ── */}
      <div className="absolute bottom-14 left-2 z-30 font-pixel text-note text-ink-faint">
        {snapshot.phase === GamePhase.Active ? '● ACTIVE' : '○ IDLE'}
      </div>
    </div>
  );
}

// ── 슬라이더 서브컴포넌트 ──────────────────────────────────────────────
function Slider({
  label, value, min, max, step, onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span>{label}: {value.toFixed(1)}</span>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-32 accent-[#ffb257]"
      />
    </label>
  );
}
