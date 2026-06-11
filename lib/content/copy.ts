import type { Screen } from '@/lib/game/types';

/** 화면별 말풍선 문구. \n = 줄바꿈. 1C/1D에서 이 키로 참조. */
export const SCREEN_COPY: Record<Screen, { bubble: string }> = {
  title: {
    bubble: '달리지 않아도 괜찮아요.\n먼저, 당신의 속도를 들어볼게요.',
  },
  tutorial: {
    bubble: '조금 빨라져볼까요?\nSpacebar 키를 눌러보세요.',
  },
  findPace: {
    bubble: '이제 가장 편안한 속도로 걸어보세요.\n오래 머물 수 있는 리듬이면 충분해요.',
  },
};
