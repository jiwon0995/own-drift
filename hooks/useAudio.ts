'use client';

/**
 * 오디오 시스템 (Phase 5) — Web Audio API.
 *
 * 그래프:  [BGM] [발자국] [앰비언스] → master(음소거) → destination
 *   - BGM(main-theme): 언락 즉시 loop, 전 구간.
 *   - 발자국(footstep): loop + playbackRate로 현재 속도 반영(러너 gait와 동기).
 *   - 앰비언스: scene 연동, 전환 시 crossfade(out 0.4s / in 0.6s), BGM보다 낮은 볼륨.
 *   - 음소거: master.gain 0↔1 — 셋 동시. localStorage 'own-drift-muted'로 persist.
 *
 * 언락: 타이틀 버튼이 unlockAudio() 호출 → 구독(useSyncExternalStore)으로 감지해 init.
 * 음소거도 localStorage 백킹 외부 스토어로 둬, SSR 불일치/마운트 setState 없이 복원한다.
 * playbackRate/페이드는 모두 AudioParam 스케줄(setTargetAtTime/linearRamp)로 — 매 프레임
 * JS 없이 엔진이 부드럽게 보간한다. speed 프롭은 스로틀 스냅샷(≈10fps)이라 effect로 충분.
 *
 * 주의: 싱글톤 AudioContext는 cleanup에서 close하지 않는다(재마운트/재언락 안전). 이 마운트가
 * 만든 노드만 stop/disconnect한다.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getAudioContext, subscribeUnlock, getUnlockedSnapshot } from '@/lib/audio/unlock';
import type { Scene } from '@/lib/game/types';

// ── 오디오 믹스/타이밍 (게임플레이 상수와 분리 — GAME_CONSTANTS는 GDD 수치 전용) ──
const BGM_LEVEL      = 0.5;
const FOOTSTEP_LEVEL = 0.15;
const AMBIENCE_LEVEL = 0.35;  // 스펙: BGM보다 낮게
const FOOT_RATE_MIN  = 0.6;   // playbackRate = 0.6 + speed(0..1) * 0.9  → 0.6x ~ 1.5x
const FOOT_RATE_SPAN = 0.9;
const FOOT_RATE_TC   = 0.08;  // setTargetAtTime 시상수(초) — 스냅샷 계단 평활
const AMB_FADE_OUT_S = 0.4;
const AMB_FADE_IN_S  = 0.6;
const MUTE_RAMP_S    = 0.05;  // 클릭 노이즈 방지용 짧은 램프
const MUTED_KEY      = 'own-drift-muted';

const BGM_SRC      = '/audio/bgm/main-theme.mp3';
const FOOTSTEP_SRC = '/audio/sfx/footstep.mp3';

/** scene → 앰비언스 파일. road · journeyStart · space 는 무음(없음). */
const AMBIENCE_SRC: Partial<Record<Scene, string>> = {
  cityDay:   '/audio/ambience/city.mp3',
  cityNight: '/audio/ambience/city-night.mp3',
  highway:   '/audio/ambience/crickets.mp3',
};

/** 디코드된 버퍼는 url별로 모듈 캐시 — 재마운트(StrictMode)·씬 재진입 시 재요청 방지. */
const bufferCache = new Map<string, AudioBuffer>();

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// ── 음소거 외부 스토어 (localStorage 백킹) ──────────────────────────────
// useSyncExternalStore로 읽어 SSR 스냅샷(false)과 클라 값 차이를 React가 안전 처리
// (하이드레이션 불일치 경고 없음). 토글은 store를 갱신하고 구독자에 통지한다.
function readStoredMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

let mutedState = readStoredMuted();
const muteListeners = new Set<() => void>();

function setMutedStore(next: boolean): void {
  if (next === mutedState) return;
  mutedState = next;
  try { window.localStorage.setItem(MUTED_KEY, next ? '1' : '0'); } catch { /* noop */ }
  muteListeners.forEach((l) => l());
}

function subscribeMuted(cb: () => void): () => void {
  muteListeners.add(cb);
  return () => muteListeners.delete(cb);
}

interface AudioGraph {
  ctx:        AudioContext;
  master:     GainNode;
  bgmSource:  AudioBufferSourceNode | null;
  footSource: AudioBufferSourceNode | null;
  ambGain:    GainNode | null;
  ambSource:  AudioBufferSourceNode | null;
  ambUrl:     string | null;  // 현재 재생 중 앰비언스 url (null=무음)
}

async function loadBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  const hit = bufferCache.get(url);
  if (hit) return hit;
  const res = await fetch(url);
  const arr = await res.arrayBuffer();
  const buf = await ctx.decodeAudioData(arr);
  bufferCache.set(url, buf);
  return buf;
}

/** 현재값에서 target으로 dur초 선형 페이드 (이전 스케줄 취소 후 재앵커). */
function fadeTo(param: AudioParam, target: number, dur: number, ctx: AudioContext): void {
  const t = ctx.currentTime;
  param.cancelScheduledValues(t);
  param.setValueAtTime(param.value, t);
  param.linearRampToValueAtTime(target, t + dur);
}

export interface UseAudioOptions {
  /** 현재 배경 씬 — 앰비언스 선택. */
  scene: Scene;
  /** 정규화된 현재 속도 0..1 (순간값) — 발자국 playbackRate. */
  speed: number;
}

export interface UseAudioReturn {
  isMuted:    boolean;
  toggleMute: () => void;
}

export function useAudio({ scene, speed }: UseAudioOptions): UseAudioReturn {
  const isUnlocked = useSyncExternalStore(subscribeUnlock, getUnlockedSnapshot, () => false);
  const isMuted    = useSyncExternalStore(subscribeMuted, () => mutedState, () => false);
  const [ready, setReady] = useState(false);

  const graphRef = useRef<AudioGraph | null>(null);

  // 최신 speed — init 비동기 클로저가 시작 시점 playbackRate를 잡을 때 참조.
  // (useGameLoop/PixelRunner와 동일한 render-time ref 갱신 패턴.)
  const speedRef = useRef(speed);
  speedRef.current = speed;

  // ── 언락 시 1회: 그래프 구성 + BGM·발자국 시작 ──────────────────────
  useEffect(() => {
    if (!isUnlocked || graphRef.current) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    let cancelled = false;

    const master = ctx.createGain();
    master.gain.value = mutedState ? 0 : 1;  // 초기 음소거 즉시 반영(램프 없음)
    master.connect(ctx.destination);

    // 동기로 graph 생성 → cleanup이 항상 이 객체를 정리(비동기 경합 안전)
    const graph: AudioGraph = {
      ctx, master,
      bgmSource: null, footSource: null,
      ambGain: null, ambSource: null, ambUrl: null,
    };
    graphRef.current = graph;

    void (async () => {
      void ctx.resume();  // 언락 제스처에서 이미 resume했으나 멱등 보강
      try {
        const [bgmBuf, footBuf] = await Promise.all([
          loadBuffer(ctx, BGM_SRC),
          loadBuffer(ctx, FOOTSTEP_SRC),
        ]);
        if (cancelled) return;

        // BGM — loop, 전 구간
        const bgmGain = ctx.createGain();
        bgmGain.gain.value = BGM_LEVEL;
        bgmGain.connect(master);
        const bgmSource = ctx.createBufferSource();
        bgmSource.buffer = bgmBuf;
        bgmSource.loop = true;
        bgmSource.connect(bgmGain);
        bgmSource.start();
        graph.bgmSource = bgmSource;

        // 발자국 — loop + playbackRate(현재 속도)
        const footGain = ctx.createGain();
        footGain.gain.value = FOOTSTEP_LEVEL;
        footGain.connect(master);
        const footSource = ctx.createBufferSource();
        footSource.buffer = footBuf;
        footSource.loop = true;
        footSource.playbackRate.value = FOOT_RATE_MIN + clamp01(speedRef.current) * FOOT_RATE_SPAN;
        footSource.connect(footGain);
        footSource.start();
        graph.footSource = footSource;

        if (cancelled) return;
        setReady(true);  // scene/speed/mute effect 활성화
      } catch {
        // 로드 실패 — 무음으로 진행(게임 진행엔 영향 없음)
      }
    })();

    return () => {
      cancelled = true;
      try { graph.bgmSource?.stop(); }  catch { /* 이미 정지 */ }
      try { graph.footSource?.stop(); } catch { /* 이미 정지 */ }
      try { graph.ambSource?.stop(); }  catch { /* 이미 정지 */ }
      try { master.disconnect(); }      catch { /* noop */ }
      if (graphRef.current === graph) graphRef.current = null;
      setReady(false);
    };
  }, [isUnlocked]);

  // ── 발자국 playbackRate ← 속도(0..1) ───────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const g = graphRef.current;
    if (!g?.footSource) return;
    const target = FOOT_RATE_MIN + clamp01(speed) * FOOT_RATE_SPAN;
    g.footSource.playbackRate.setTargetAtTime(target, g.ctx.currentTime, FOOT_RATE_TC);
  }, [speed, ready]);

  // ── 앰비언스 ← scene (crossfade) ───────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const g = graphRef.current;
    if (!g) return;

    const url = AMBIENCE_SRC[scene] ?? null;
    if (url === g.ambUrl) return;  // 같은 앰비언스 → 유지

    // 1) 현재 앰비언스 fade out → 정지
    if (g.ambGain && g.ambSource) {
      const oldSource = g.ambSource;
      fadeTo(g.ambGain.gain, 0, AMB_FADE_OUT_S, g.ctx);
      try { oldSource.stop(g.ctx.currentTime + AMB_FADE_OUT_S + 0.05); } catch { /* noop */ }
    }
    g.ambGain   = null;
    g.ambSource = null;
    g.ambUrl    = url;  // 진행 중인 이전 로드가 자신을 폐기하는 기준(아래 가드)

    // 2) 무음 씬이면 종료
    if (!url) return;

    // 3) 새 앰비언스 로드 → fade in. 늦게 오면(씬 바뀜) 폐기.
    let cancelled = false;
    void (async () => {
      try {
        const buf = await loadBuffer(g.ctx, url);
        if (cancelled || g.ambUrl !== url) return;  // 그 사이 씬 변경 → 폐기
        const ambGain = g.ctx.createGain();
        ambGain.gain.value = 0;
        ambGain.connect(g.master);
        const ambSource = g.ctx.createBufferSource();
        ambSource.buffer = buf;
        ambSource.loop = true;
        ambSource.connect(ambGain);
        ambSource.start();
        fadeTo(ambGain.gain, AMBIENCE_LEVEL, AMB_FADE_IN_S, g.ctx);
        g.ambGain   = ambGain;
        g.ambSource = ambSource;
      } catch {
        /* 로드 실패 — 무음 유지 */
      }
    })();
    return () => { cancelled = true; };
  }, [scene, ready]);

  // ── 음소거 ← isMuted (master 전체) ─────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const g = graphRef.current;
    if (!g) return;
    fadeTo(g.master.gain, isMuted ? 0 : 1, MUTE_RAMP_S, g.ctx);
  }, [isMuted, ready]);

  const toggleMute = useCallback(() => {
    setMutedStore(!mutedState);
  }, []);

  return { isMuted, toggleMute };
}
