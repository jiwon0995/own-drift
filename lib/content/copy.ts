import type { Screen } from '@/lib/game/types';

/** 화면별 말풍선 문구. \n = 줄바꿈. */
type BasicScreenCopy = { bubble: string };

type ScreenCopy = Record<
  Exclude<Screen, 'tutorial' | 'journeyStart' | 'mainPlay' | 'return' | 'clear' | 'continueOrEnd' | 'ending'>,
  BasicScreenCopy
> & {
  title: BasicScreenCopy & { startButton: string };
};

export const SCREEN_COPY: ScreenCopy = {
  title: {
    bubble: '달려도, 걸어도 괜찮아요.\n당신만의 속도를 찾아볼게요.',
    startButton: '내딛기',
  },
  findPace: {
    bubble: '이제 가장 편안한 속도를 유지해보세요.\n오래 머물 수 있는 리듬이면 충분해요.',
  },
};

/**
 * Journey Start 순차 타이핑 문단 (docs/03-screens.md · game-screens.html JOURNEY_PARAGRAPHS).
 * 한 말풍선에 교체식으로 순차 타이핑된다. \n = 줄바꿈. 마지막 완료 후 자동 슬라이드 전환.
 */
export const JOURNEY_START_PARAGRAPHS = [
  '이제부터는 진짜 여정이에요.',
  '빠르게 가면 \n그만큼 쉽게 지칠 수도 있어요.',
  '천천히 가는 것도 괜찮아요.\n다만 리듬을 잃지 않는 게 중요해요.',
  '이 길의 정답은 하나가 아니에요.\n중요한 건 내 속도로 나아가는 것.',
] as const;

/** Tutorial 서브 스텝별 말풍선 문구. */
export type TutorialStep = 'fast' | 'slow' | 'done';

/** 입력 디바이스별 조작 안내 — 데스크톱(키보드) / 모바일(터치). */
const TUTORIAL_ACTION = {
  keyboard: { press: 'Spacebar 키를 눌러보세요.', release: 'Spacebar에서 손을 떼보세요.' },
  touch:    { press: '화면을 길게 눌러보세요.',     release: '화면에서 손을 떼보세요.' },
} as const;

const tutorialSteps = (a: { press: string; release: string }): Record<TutorialStep, { bubble: string }> => ({
  fast: { bubble: `조금 빨라져볼까요?\n${a.press}` },
  slow: { bubble: `이번엔 천천히 가볼까요?\n${a.release}` },
  done: { bubble: '좋아요.\n속도는 언제든 바뀔 수 있어요.' },
});

/** 데스크톱(키보드) 기본 문구. dev 디버그가 직접 참조. */
export const TUTORIAL_STEP_COPY = tutorialSteps(TUTORIAL_ACTION.keyboard);

/** 디바이스 인식 튜토리얼 문구 — touch=true면 '화면을 눌러보세요'로 교체. */
export function tutorialStepCopy(touch: boolean): Record<TutorialStep, { bubble: string }> {
  return touch ? tutorialSteps(TUTORIAL_ACTION.touch) : TUTORIAL_STEP_COPY;
}

/** 게이지 라벨 — Find Pace(안착) / Main Play(안정) */
export const GAUGE_COPY = {
  anchoring:  '머무는 중…',   // Find Pace 안착 게이지
  stabilizing: '이어가는 중…', // Main Play 안정 게이지
} as const;

/**
 * Main Play 문구 (docs/03-screens.md 1.4 / 1.7).
 * - entry: 진입 시 한 번
 * - 상태 4종: 구간 안(재진입/지속) · 이탈 · 멈춤. 경계 깜빡임은 디바운스로 방지.
 */
export const MAIN_PLAY_COPY = {
  entry: '내 속도대로..',
  encounter: '바깥의 속도가 스쳐 갑니다.', // 다른 존재 등장 (2C)
  status: {
    inEnter: '리듬이 돌아오고 있어요.',           // 구간 재진입
    inHold:  '리듬이 이어지는 중…',               // 구간 안 지속(충전)
    drift:   '조금 멀어졌어요. 다시 찾으면 됩니다.', // 막 이탈
    stopped: '잠시 멈췄어요. 다시 돌아오면 이어집니다.', // 이탈 지속
  },
} as const;

// ── Phase 3: 화면 흐름 문구 (docs/03-screens.md 1.8~1.11) ──────────────

/** Return 1/2/3 — 혼란 → 인식 → 체화. 단계-성공 아닌 인정의 톤. */
export const RETURN_COPY = [
  '처음으로 돌아왔어요.\n아직 낯설어도 괜찮아요.',
  '이제 조금 알 것 같아요.\n당신의 리듬은 사라지지 않았어요.',
  '이제 다시 찾을 수 있어요.\n당신의 속도는 당신 안에 있어요.',
] as const;

/** Clear — 승리 아닌 인정. 점수·랭킹 없음. */
export const CLEAR_COPY = {
  main: '당신의 속도를 찾았습니다.',
  sub:  '이곳에는 피니시가 없습니다.\n계속 달려도 되고, 여기서 멈춰도 괜찮아요.',
} as const;

/** Continue or End — 두 선택 동등 무게. 종료는 포기가 아님. */
export const CONTINUE_OR_END_COPY = {
  prompt:   '계속 달려도 되고,\n여기서 멈춰도 괜찮아요.',
  note:     '어느 쪽도 늦지 않습니다.',
  continue: '계속 달리기',
  end:      '오늘은 여기까지',
} as const;

/** Ending — 당신의 풍경. 순위·기록·수치 없음. */
export const ENDING_COPY = {
  main:        '당신의 풍경이 도착했어요.',
  sub:         '빠르거나 느린 기록이 아니라,\n당신이 지나온 리듬입니다.',
  placeholder: '당신의 풍경',
  save:        '내 풍경 저장하기',
  restart:     '다시 걸어보기',
} as const;

/**
 * FindPace 상황별 유도 힌트.
 * - idle:  입력 없이 머물 때 → 달려보라고 권유
 * - held:  계속 누르고만 있을 때 → 떼보라고 권유
 * - howto: 게이지를 못 채울 때 단계별 안내 (점점 구체적으로)
 */
export const FIND_PACE_HINTS = {
  idle: '천천히 가는 것도 좋지만,\n가끔 달려보면 새로운 풍경을 만날 수 있어요.',
  held: '너무 빠르게 달리기만 하면,\n중요한 걸 놓칠 수도 있어요.',
  howto: [
    '편안한 빠르기를 찾으면,\n그 리듬을 기억해보세요.',
    '눌렀다 떼기를,\n천천히 반복해보세요.',
    '같은 박자로 눌렀다 떼면,\n그게 당신의 속도가 돼요.',
    '숨을 고르듯,\n일정한 간격으로 이어가 보세요.',
    '조급해하지 않아도 돼요.\n천천히, 당신만의 리듬으로.',
  ],
} as const;
