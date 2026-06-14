'use client';

/**
 * Landscape — 당신의 풍경 (엔딩 플로우 재배치). GameStage 위 오버레이.
 *
 * 클리어한 *모든* 플레이어가 보는 화면(이전엔 "오늘은 여기까지"를 누른 사람만 봤다).
 * 점수·결과가 아니라 *지나온 리듬*을 선물처럼 받는다. 순위·기록·속도 수치 노출 없음.
 *
 * - 메인 → 서브 문구를 한 말풍선에서 순차 타이핑(타이프라이터). 완료 후 두 버튼 fade-in.
 * - 두 버튼은 같은 무게(색만 다르고 크기·위치 동등)이고 *다음 화면(Crossroad)도 동일*.
 *   "내 풍경 저장하기"만 download를 발화하고, "기억으로 간직하기"는 다운로드 없이 넘어간다.
 * - 저장 시 "저장됐어요" 한 박자(LANDSCAPE_SAVED_DWELL_MS) 후 Crossroad로.
 * - 캡처 이미지(클리어 진입 시 1회 캡처분)는 픽셀아트 엽서 프레임 안에(image-rendering: pixelated).
 *   캡처 실패(null)면 풍경색 단색 fallback + 저장 버튼 비활성화(오류 문구·팝업 없음).
 */

import { useEffect, useRef, useState } from 'react';
import { GAME_CONSTANTS } from '@/lib/game/constants';
import { LANDSCAPE_COPY } from '@/lib/content/copy';
import SpeechBubble       from '@/components/game/SpeechBubble';
import Button             from '@/components/ui/Button';

interface LandscapeScreenProps {
  /** 내 풍경 저장하기 — 캡처 data URL을 다운로드(상위에서 처리). */
  onSave:         () => void;
  /** 두 버튼 공통 다음 화면 — Crossroad로 전환(상위에서 처리). */
  onDone:         () => void;
  /** 클리어 진입 시 캡처된 풍경 PNG data URL. null이면 단색 fallback + 저장 비활성화. */
  capturedImage?: string | null;
}

/** 엽서 프레임 크기 — 캡처 뷰포트(≈800×520)와 같은 비율. */
const FRAME_W = 288;
const FRAME_H = 188;

/** 캡처 실패 시 단색 fallback (Background SKY.space 베이스 색). */
const FALLBACK_COLOR = '#14101e';

export default function LandscapeScreen({ onSave, onDone, capturedImage = null }: LandscapeScreenProps) {
  const [revealed, setRevealed] = useState(false);
  const [saved, setSaved]       = useState(false);

  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });

  // 저장 후 "저장됐어요" 한 박자 → Crossroad
  useEffect(() => {
    if (!saved) return;
    const id = setTimeout(() => onDoneRef.current(), GAME_CONSTANTS.LANDSCAPE_SAVED_DWELL_MS);
    return () => clearTimeout(id);
  }, [saved]);

  // "내 풍경 저장하기" — 다운로드 발화 후 저장 확인 한 박자
  function handleSave() {
    if (saved) return;
    onSave();
    setSaved(true);
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* 메인 + 서브 — 한 말풍선에서 순차 타이핑, 완료 시 버튼 노출 */}
      <div
        className="absolute left-0 right-0 flex justify-center px-8"
        style={{ top: 56, zIndex: 10 }}
      >
        <SpeechBubble
          text={`${LANDSCAPE_COPY.main}\n${LANDSCAPE_COPY.sub}`}
          speed={48}
          onDone={() => setRevealed(true)}
        />
      </div>

      {/* 풍경 엽서 — 픽셀아트 프레임. 캡처는 background-image(pixelated), 없으면 단색 fallback */}
      <div
        role="img"
        aria-label={LANDSCAPE_COPY.main}
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

      {/* 저장 후 한 박자: 확인 문구. 그 전: 두 버튼(타이핑 완료 후 fade-in) */}
      {saved ? (
        <div
          className="absolute left-0 right-0 text-center font-pixel text-ink-primary select-none"
          style={{ bottom: 84, fontSize: 14, letterSpacing: 1, zIndex: 10 }}
        >
          {LANDSCAPE_COPY.saved}
        </div>
      ) : (
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
          {/* 같은 무게(색만 다르고 크기·위치 동등). 캡처 실패 시 저장만 비활성, 간직은 그대로 */}
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!capturedImage}
            className={!capturedImage ? 'opacity-50' : ''}
          >
            {LANDSCAPE_COPY.save}
          </Button>
          <Button variant="ghost" onClick={onDone}>{LANDSCAPE_COPY.keep}</Button>
        </div>
      )}
    </div>
  );
}
