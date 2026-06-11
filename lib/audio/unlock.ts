/**
 * 오디오 언락 싱글톤 — Phase 5에서 에셋/재생 추가 예정.
 * 지금은 AudioContext lazy 생성 + resume()만 동작.
 *
 * - SSR-safe: typeof window 가드
 * - idempotent: state === 'running' 이면 즉시 반환
 */

let ctx: AudioContext | null = null;

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
 * 유저 제스처에 호출 → AudioContext를 'running' 상태로 전환.
 * iOS/모바일에서 첫 터치 시 호출 필수.
 */
export async function unlockAudio(): Promise<void> {
  const context = getAudioContext();
  if (!context) return;
  if (context.state === 'running') return;
  await context.resume();
}

/** 현재 AudioContext 상태 ('suspended' | 'running' | 'closed' | null) */
export function getAudioState(): AudioContextState | null {
  return ctx?.state ?? null;
}
