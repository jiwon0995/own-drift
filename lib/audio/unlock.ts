/**
 * 오디오 언락 싱글톤 (Phase 5).
 *
 * AudioContext lazy 생성 + resume() + "언락됨" 구독 스토어.
 * 타이틀 버튼이 unlockAudio()를 호출하면 unlocked=true로 바뀌고,
 * GameStage의 useAudio가 useSyncExternalStore로 이를 구독해 재생을 시작한다
 * (프롭 드릴 없이 단일 출처).
 *
 * - SSR-safe: typeof window 가드
 * - idempotent: state === 'running' 이면 resume 생략
 */

let ctx: AudioContext | null = null;

// ── 언락 구독 스토어 (useSyncExternalStore) ─────────────────────────────
let unlocked = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

/** unlocked 변경 구독. unsubscribe 반환. */
export function subscribeUnlock(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** 현재 언락 상태 — useSyncExternalStore getSnapshot. */
export function getUnlockedSnapshot(): boolean {
  return unlocked;
}

/** AudioContext 싱글톤 반환. SSR에서는 null. */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor() as AudioContext;
  }
  return ctx;
}

/**
 * 유저 제스처에 호출 → AudioContext를 'running'으로 전환 + 언락 플래그 on.
 * iOS/모바일에서 첫 터치 시 호출 필수.
 *
 * unlocked는 resume await 이전에 동기로 켜 구독자(useAudio)가 즉시 반응하게 한다.
 * useAudio의 init도 resume을 한 번 더 호출하므로(멱등) 경합 걱정 없음.
 */
export async function unlockAudio(): Promise<void> {
  const context = getAudioContext();
  if (!context) return;
  if (!unlocked) {
    unlocked = true;
    emit();
  }
  if (context.state === 'running') return;
  await context.resume();
}

/** 현재 AudioContext 상태 ('suspended' | 'running' | 'closed' | null) */
export function getAudioState(): AudioContextState | null {
  return ctx?.state ?? null;
}
