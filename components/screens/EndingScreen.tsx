'use client';

/**
 * Ending — 당신의 풍경 (Phase 3 골격 → Phase 6 완성). GameStage 위 오버레이.
 *
 * 점수·결과가 아니라 *지나온 리듬*을 선물처럼 받는 화면.
 * 순위·기록·속도 수치·성공률 노출 없음. 클리어 팡파르·"완료" 류 문구 없음.
 *
 * - 메인 → 서브 문구를 한 말풍선에서 순차 타이핑(타이프라이터).
 * - 타이핑 완료 후 두 버튼이 fade-in. 저장(primary)·다시 걸어보기(ghost)는 색만 다르고
 *   크기·위치는 동등 — 어느 쪽도 약해 보이지 않게.
 * - 캡처 이미지는 픽셀아트 엽서 프레임 안에(image-rendering: pixelated). 캡처 실패(null)면
 *   풍경색 단색 fallback + 저장 버튼 비활성화(오류 문구·팝업 없음).
 */

import { useState } from 'react';
import { ENDING_COPY } from '@/lib/content/copy';
import SpeechBubble    from '@/components/game/SpeechBubble';
import Button          from '@/components/ui/Button';

interface EndingScreenProps {
  /** 내 풍경 저장하기 — 캡처 data URL을 다운로드(상위에서 처리). */
  onSave:         () => void;
  /** 다시 걸어보기 → Title (게임 전체 리셋). */
  onRestart:      () => void;
  /** 캡처된 풍경 PNG data URL. null이면 단색 fallback + 저장 비활성화. */
  capturedImage?: string | null;
}

/** 엽서 프레임 크기 — 캡처 뷰포트(≈800×520)와 같은 비율. */
const FRAME_W = 288;
const FRAME_H = 188;

/** 캡처 실패 시 단색 fallback (Background SKY.space 베이스 색). */
const FALLBACK_COLOR = '#14101e';

export default function EndingScreen({ onSave, onRestart, capturedImage = null }: EndingScreenProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* 메인 + 서브 — 한 말풍선에서 순차 타이핑, 완료 시 버튼 노출 */}
      <div
        className="absolute left-0 right-0 flex justify-center px-8"
        style={{ top: 56, zIndex: 10 }}
      >
        <SpeechBubble
          text={`${ENDING_COPY.main}\n${ENDING_COPY.sub}`}
          speed={48}
          onDone={() => setRevealed(true)}
        />
      </div>

      {/* 풍경 엽서 — 픽셀아트 프레임. 캡처는 background-image(pixelated), 없으면 단색 fallback */}
      <div
        role="img"
        aria-label={ENDING_COPY.main}
        className="absolute left-1/2"
        style={{
          top:             176,
          width:           FRAME_W,
          height:          FRAME_H,
          transform:       'translateX(-50%)',
          backgroundColor: FALLBACK_COLOR,
          border:          '3px solid #3a2a22',
          boxShadow:       'inset 0 0 0 2px #0a0706, 4px 4px 0 0 rgba(0,0,0,0.55)',
          zIndex:          10,
          ...(capturedImage && {
            backgroundImage:  `url("${capturedImage}")`,
            backgroundSize:   'cover',
            backgroundRepeat: 'no-repeat',
            imageRendering:   'pixelated',
          }),
        }}
      />

      {/* 버튼 — 타이핑 완료 후 fade-in. primary/ghost는 색만 다르고 크기·위치 동등 */}
      <div
        className="absolute left-0 right-0 flex justify-center gap-4"
        style={{
          bottom:        72,
          zIndex:        10,
          opacity:       revealed ? 1 : 0,
          transition:    'opacity 600ms ease',
          pointerEvents: revealed ? 'auto' : 'none',
        }}
      >
        <Button
          variant="primary"
          onClick={onSave}
          disabled={!capturedImage}
          className={!capturedImage ? 'opacity-50' : ''}
        >
          {ENDING_COPY.save}
        </Button>
        <Button variant="ghost" onClick={onRestart}>{ENDING_COPY.restart}</Button>
      </div>
    </div>
  );
}
