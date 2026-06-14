/**
 * 게임 뷰포트 캡처 (Phase 6) — "당신의 풍경" 엽서 이미지.
 *
 * 이 게임의 씬은 canvas가 아니라 DOM/CSS(인라인 gradient·div·box-shadow 러너)다.
 * 그래서 canvas.toDataURL을 직접 쓸 대상이 없고, 원본 <main>을 그대로 grab하면
 * 위에 떠 있는 오버레이 UI(말풍선·버튼)까지 함께 담겨 엽서로는 부적합하다.
 *
 * 대신 html2canvas 같은 외부 의존성 없이 *순수 Canvas 2D API로 씬을 다시 그린다*.
 * 엔딩 진입 시점의 라이브 씬은 항상 'space'로 고정이지만, 엽서엔 플레이어가 *지나온
 * 여정의 씬*(road→cityDay→cityNight→highway→space) 중 하나를 **랜덤으로** 그려
 * "여정의 한 장면을 캡처한" 느낌을 준다. 씬 색·실루엣은 Background.tsx 공식을 미러링.
 *   - 의존성 0, 번들 영향 없음
 *   - 오버레이 UI는 구조적으로 제외됨
 *   - cross-origin 이미지 taint 없음 → toDataURL 실패 위험 없음
 *
 * 실패(캔버스 미지원 등) 시 throw하지 않고 null을 반환한다 — 호출측은 단색 fallback +
 * 저장 버튼 비활성화로 처리(에러 팝업 없음).
 */

import type { RefObject } from 'react';

/** 엽서에 그릴 수 있는 씬 — 여정 씬 풀(journeyStart 전환 씬은 제외). */
type PaintableScene = 'road' | 'cityDay' | 'cityNight' | 'highway' | 'space';

/** 캡처 시 랜덤으로 고를 "지나온 여정" 씬 풀. */
const JOURNEY_SCENES: PaintableScene[] = ['road', 'cityDay', 'cityNight', 'highway', 'space'];

/** 기본 뷰포트 크기 (Shell: 데스크톱 뷰포트 ≈ 800×520) — 모든 데코 좌표의 기준 캔버스. */
const BASE_W = 800;
const BASE_H = 520;

/** 러너 기본색 (--color-fig-player). 전달된 엘리먼트에서 실제 값을 읽어 덮어쓴다. */
const DEFAULT_RUNNER = '#ffb257';

// ── 씬별 프리젠테이션 상수 (Background.tsx 미러) ──────────────────────────

interface SkySpec { type: 'linear' | 'radial'; stops: [number, string][]; }

const SKY: Record<PaintableScene, SkySpec> = {
  road:      { type: 'linear', stops: [[0, '#6f9bc4'], [0.55, '#9cc0dd'], [1, '#c9ddd0']] },
  cityDay:   { type: 'linear', stops: [[0, '#7fa8c8'], [1, '#e0b890']] },
  cityNight: { type: 'linear', stops: [[0, '#140f22'], [1, '#3a2238']] },
  highway:   { type: 'linear', stops: [[0, '#16121f'], [1, '#241a2a']] },
  space:     { type: 'radial', stops: [[0, '#2b1a3a'], [0.6, '#14101e'], [1, '#0d0a14']] },
};

/** 90px 지면 채움 색 (space는 지면 없음). */
const GROUND_FILL: Partial<Record<PaintableScene, string>> = {
  road: '#3a3026', cityDay: '#2a1d18', cityNight: '#160f14', highway: '#161018',
};

/** 별 개수 (800×520 기준, 면적 비례로 스케일). */
const STAR_COUNT: Partial<Record<PaintableScene, number>> = {
  cityNight: 24, highway: 22, space: 70,
};

/** PixelRunner RUN[0] 프레임 — [col, row]. 엽서엔 한 포즈만 고정. */
const RUNNER_SPRITE: ReadonlyArray<readonly [number, number]> = [
  [3, 0], [2, 1], [2, 2], [1, 3], [3, 4],
];

type CaptureTarget = HTMLElement | RefObject<HTMLElement | null> | null | undefined;

function resolveElement(target: CaptureTarget): HTMLElement | null {
  if (!target) return null;
  if (target instanceof HTMLElement) return target;
  return target.current ?? null;
}

// ── 씬 페인터 ─────────────────────────────────────────────────────────────

function paintSky(ctx: CanvasRenderingContext2D, scene: PaintableScene, w: number, h: number): void {
  const spec = SKY[scene];
  let g: CanvasGradient;
  if (spec.type === 'radial') {
    const cx = w * 0.5, cy = h * 1.2;
    const r = Math.hypot(Math.max(cx, w - cx), cy);
    g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  } else {
    g = ctx.createLinearGradient(0, 0, 0, h); // 180deg = top→bottom
  }
  for (const [at, color] of spec.stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function paintStars(ctx: CanvasRenderingContext2D, scene: PaintableScene, w: number, h: number): void {
  const base = STAR_COUNT[scene];
  if (!base) return;
  const count = Math.round(base * (w * h) / (BASE_W * BASE_H));
  const topMax = scene === 'space' ? 0.98 : scene === 'cityNight' ? 0.45 : 0.40;
  const topMin = scene === 'space' ? 0.02 : 0;
  const pad    = scene === 'space' ? 0.02 : 0.05;
  ctx.fillStyle = '#f3e6d8';
  for (let i = 0; i < count; i++) {
    const x = w * (pad + Math.random() * (1 - 2 * pad));
    const y = h * (topMin + Math.random() * (topMax - topMin));
    ctx.globalAlpha = scene === 'space' ? 0.4 + Math.random() * 0.5 : scene === 'cityNight' ? 0.8 : 0.7;
    ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
  }
  ctx.globalAlpha = 1;
}

function paintGround(ctx: CanvasRenderingContext2D, scene: PaintableScene, w: number, h: number): number {
  const groundH = Math.round(90 * h / BASE_H);
  const groundTop = h - groundH;
  const fill = GROUND_FILL[scene];
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, groundTop, w, groundH);
  }
  return groundTop;
}

function paintBuildings(ctx: CanvasRenderingContext2D, scene: PaintableScene, w: number, h: number, groundTop: number): void {
  const sx = w / BASE_W, sy = h / BASE_H;
  if (scene === 'cityDay' || scene === 'cityNight') {
    ctx.fillStyle = scene === 'cityNight' ? '#000' : '#4a4658';
    for (let i = 0; i < 9; i++) {
      const bw = (40 + (i * 37) % 50) * sx;
      const bh = (100 + (i * 53) % 150) * sy;
      ctx.fillRect((i * 11.5 / 100) * w, groundTop - bh, bw, bh);
    }
  } else if (scene === 'highway') {
    ctx.fillStyle = '#241c2e';
    const y = h - 120 * sy; // 원경 빌딩은 지면보다 위
    for (let i = 0; i < 14; i++) {
      const bh = (20 + (i * 29) % 40) * sy;
      ctx.fillRect((i * 7.3 / 100) * w, y - bh, 26 * sx, bh);
    }
  }
}

function paintDecor(ctx: CanvasRenderingContext2D, scene: PaintableScene, w: number, h: number): void {
  const sx = w / BASE_W, sy = h / BASE_H;
  // 달 (cityNight)
  if (scene === 'cityNight') {
    ctx.fillStyle = '#f3e6d8';
    ctx.beginPath();
    ctx.arc(w * 0.82, (40 + 17) * sy, 17 * sy, 0, Math.PI * 2);
    ctx.fill();
  }
  // 구름 (road)
  if (scene === 'road') {
    ctx.fillStyle = 'rgba(243,230,216,0.6)';
    ctx.globalAlpha = 0.7;
    for (const [cl, ct, cw, ch] of [[60, 70, 90, 22], [280, 120, 120, 26], [480, 60, 70, 18]]) {
      ctx.beginPath();
      ctx.ellipse((cl + cw / 2) * sx, (ct + ch / 2) * sy, (cw / 2) * sx, (ch / 2) * sy, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function paintRunner(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
  const sy = h / BASE_H;
  const block = Math.max(1, Math.round(15 * sy));
  const baseY = h - Math.round(100 * sy); // 스프라이트 바닥(지면 위)
  const left  = Math.round(w * 0.48 - (5 * block) / 2);
  const top   = baseY - 5 * block;
  ctx.fillStyle = color;
  for (const [col, row] of RUNNER_SPRITE) {
    ctx.fillRect(left + col * block, top + row * block, block, block);
  }
}

function paintVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w * 0.5;
  const r = Math.hypot(cx, h * 0.7);
  const vig = ctx.createRadialGradient(cx, h * 0.5, h * 0.3, cx, h * 0.5, r);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

// ── 공개 API ──────────────────────────────────────────────────────────────

/**
 * 게임 뷰포트(중앙 씬 영역)를 엽서 PNG data URL로 캡처한다.
 *
 * @param target 뷰포트 엘리먼트 또는 그 ref — 크기·러너색을 읽는다(없으면 기본값).
 * @param scene  그릴 씬. 생략 시 여정 씬 중 랜덤("지나온 한 장면" 느낌).
 * @returns data URL 문자열, 실패 시 null.
 */
export async function captureGameView(target?: CaptureTarget, scene?: PaintableScene): Promise<string | null> {
  if (typeof document === 'undefined') return null;

  try {
    const el = resolveElement(target);

    let width = BASE_W;
    let height = BASE_H;
    let runnerColor = DEFAULT_RUNNER;

    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        width = Math.round(rect.width);
        height = Math.round(rect.height);
      }
      const v = getComputedStyle(el).getPropertyValue('--color-fig-player').trim();
      if (v) runnerColor = v;
    }

    const picked = scene ?? JOURNEY_SCENES[Math.floor(Math.random() * JOURNEY_SCENES.length)];

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = false;

    paintSky(ctx, picked, width, height);
    paintStars(ctx, picked, width, height);
    paintDecor(ctx, picked, width, height);
    const groundTop = paintGround(ctx, picked, width, height);
    paintBuildings(ctx, picked, width, height, groundTop);
    paintRunner(ctx, width, height, runnerColor);
    paintVignette(ctx, width, height);

    return canvas.toDataURL('image/png');
  } catch {
    // 캡처 실패 — null 반환(호출측이 단색 fallback + 저장 비활성화로 처리)
    return null;
  }
}
