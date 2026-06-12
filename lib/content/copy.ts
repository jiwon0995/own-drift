import type { Screen } from '@/lib/game/types';

/** 화면별 말풍선 문구. \n = 줄바꿈. */
export const SCREEN_COPY: Record<Exclude<Screen, 'tutorial' | 'mainPlay'>, { bubble: string }> = {
  title: {
    bubble: '달리지 않아도 괜찮아요.\n먼저, 당신의 속도를 들어볼게요.',
  },
  findPace: {
    bubble: '이제 가장 편안한 속도로 걸어보세요.\n오래 머물 수 있는 리듬이면 충분해요.',
  },
};

/** Tutorial 서브 스텝별 말풍선 문구. */
export type TutorialStep = 'fast' | 'slow' | 'done';

export const TUTORIAL_STEP_COPY: Record<TutorialStep, { bubble: string }> = {
  fast: {
    bubble: '조금 빨라져볼까요?\nSpacebar 키를 눌러보세요.',
  },
  slow: {
    bubble: '이번엔 천천히 가볼까요?\nSpacebar에서 손을 떼보세요.',
  },
  done: {
    bubble: '좋아요.\n속도는 언제든 바뀔 수 있어요.',
  },
};

/** FindPace 안착 게이지 라벨 */
export const GAUGE_COPY = {
  anchoring: '머무는 중…',
} as const;
