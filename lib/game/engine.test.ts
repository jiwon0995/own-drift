import { describe, it, expect } from 'vitest';
import { progressToScene, playProgressToScene } from '@/lib/game/engine';
import { SCENE_THRESHOLDS } from '@/lib/game/constants';

/**
 * progressToScene(gameProgress) 단위 테스트 — Phase 4C 씬 진행의 source of truth.
 * 경계는 [lo, hi) 반열림: 커트라인 값 자체는 다음 씬에 속한다.
 */
describe('progressToScene', () => {
  it('brief 명시 경계값', () => {
    expect(progressToScene(0)).toBe('road');
    expect(progressToScene(0.249)).toBe('road');
    expect(progressToScene(0.25)).toBe('cityDay');   // 커트라인 = 다음 씬
    expect(progressToScene(0.749)).toBe('cityNight');
    expect(progressToScene(0.75)).toBe('highway');
    expect(progressToScene(1)).toBe('highway');
  });

  it('중간 구간', () => {
    expect(progressToScene(0.4)).toBe('cityDay');
    expect(progressToScene(0.5)).toBe('cityNight'); // 두 번째 커트라인
    expect(progressToScene(0.6)).toBe('cityNight');
  });

  it('범위 밖 입력도 양 끝 씬으로 안전 수렴 (클램프 불필요)', () => {
    expect(progressToScene(-1)).toBe('road');
    expect(progressToScene(2)).toBe('highway');
  });

  it('단방향: 진행도가 커져도 씬 순서가 역행하지 않음', () => {
    const order = ['road', 'cityDay', 'cityNight', 'highway'];
    let lastIdx = -1;
    for (let p = 0; p <= 1.0001; p += 0.02) {
      const idx = order.indexOf(progressToScene(p));
      expect(idx).toBeGreaterThanOrEqual(lastIdx);
      lastIdx = idx;
    }
  });

  it('커트라인은 SCENE_THRESHOLDS 단일 출처를 따른다', () => {
    const [t1, t2, t3] = SCENE_THRESHOLDS;
    expect(progressToScene(t1 - 0.001)).toBe('road');
    expect(progressToScene(t1)).toBe('cityDay');
    expect(progressToScene(t2)).toBe('cityNight');
    expect(progressToScene(t3)).toBe('highway');
  });
});

/**
 * playProgressToScene — 본편(journeyStart 이후) 도시 씬 진행.
 * road 프롤로그 구간을 건너뛰어 진입부터 cityDay로 시작한다.
 */
describe('playProgressToScene', () => {
  it('본편 진입(0)은 도시(cityDay) — road를 건너뛴다', () => {
    expect(playProgressToScene(0)).toBe('cityDay');
  });

  it('road는 절대 반환하지 않는다 (프롤로그 전용 씬)', () => {
    for (let p = 0; p <= 1.0001; p += 0.05) {
      expect(playProgressToScene(p)).not.toBe('road');
    }
  });

  it('3단계 진행: cityDay → cityNight → highway', () => {
    expect(playProgressToScene(0)).toBe('cityDay');       // 1라운드
    expect(playProgressToScene(1 / 3)).toBe('cityNight'); // 2라운드 진입
    expect(playProgressToScene(2 / 3)).toBe('highway');   // 3라운드 진입
    expect(playProgressToScene(1)).toBe('highway');
  });
});
