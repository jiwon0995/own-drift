'use client';

import { useEffect, useRef, useState } from 'react';

interface SpeechBubbleProps {
  text:       string;
  /** 글자당 타이핑 간격 (ms). 기본 45ms. */
  speed?:     number;
  onDone?:    () => void;
  className?: string;
}

/**
 * 고전 게임풍 타이프라이터 말풍선.
 *
 * 디자인 기준: design-system.html .bubble
 * - 이중 픽셀 테두리(border + inset box-shadow) + 픽셀 베벨 그림자
 * - \n → 줄바꿈, 깜빡 커서(▌), 클릭으로 즉시 완성
 * - prefers-reduced-motion → 전체 즉시 표시
 * - text/unmount 변경 시 타이머 cleanup
 */
export default function SpeechBubble({
  text,
  speed = 45,
  onDone,
  className = '',
}: SpeechBubbleProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone]           = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  // prefers-reduced-motion 감지
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    // 이전 타이머 정리
    if (timerRef.current) clearTimeout(timerRef.current);
    setDone(false);

    if (reducedMotion) {
      setDisplayed(text);
      setDone(true);
      onDoneRef.current?.();
      return;
    }

    setDisplayed('');
    let idx = 0;

    function typeNext() {
      idx++;
      setDisplayed(text.slice(0, idx));
      if (idx < text.length) {
        timerRef.current = setTimeout(typeNext, speed);
      } else {
        setDone(true);
        onDoneRef.current?.();
      }
    }

    timerRef.current = setTimeout(typeNext, speed);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // speed 변경은 리셋 없이 다음 글자부터 적용하려면 deps에서 제외할 수도 있지만
  // text가 바뀌면 반드시 리셋해야 하므로 text만 dep으로
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  /** 클릭 시 즉시 완성 */
  function skip() {
    if (done) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayed(text);
    setDone(true);
    onDoneRef.current?.();
  }

  // \n → 줄 단위로 분리해 <br /> 렌더
  const lines = displayed.split('\n');

  return (
    <div
      onClick={skip}
      className={`relative inline-block max-w-[90%] rounded-none font-pixel text-body text-ink-primary leading-relaxed cursor-pointer ${className}`}
      style={{
        background:  '#140d0a',
        border:      '3px solid #ffb257',
        padding:     '14px 20px',
        boxShadow:   'inset 0 0 0 3px #140d0a, inset 0 0 0 5px #3a2a22, 4px 4px 0 0 rgba(0,0,0,0.55)',
      }}
    >
      {/* 텍스트 + 커서 */}
      <span>
        {lines.map((line, i) => (
          <span key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
        {!done && (
          <span className="cursor-blink text-accent-stable ml-0.5">▌</span>
        )}
      </span>

      {/* 픽셀 꼬리 — 절대 위치 인라인 div */}
      <span
        aria-hidden
        style={{
          position:   'absolute',
          left:       24,
          bottom:     -8,
          width:      6,
          height:     6,
          background: '#ffb257',
          boxShadow:  '-6px -6px 0 0 #ffb257, 6px 0 0 0 #ffb257',
        }}
      />
    </div>
  );
}
