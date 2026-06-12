import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
}

/**
 * 픽셀 스타일 버튼 — design-system.html .btn 이식.
 * - primary: accent-stable 채움 + 픽셀 베벨
 * - ghost:   테두리만 + banner-idle 배경
 * - active 시 translate(3px,3px) — box-shadow 사라짐으로 눌린 느낌
 */
export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'font-pixel text-body cursor-pointer rounded-none transition-none ' +
    'active:translate-x-[3px] active:translate-y-[3px] px-[28px] py-[13px] ' +
    'focus-visible:outline-none';

  const variants = {
    primary: {
      style: {
        background:  '#ffb257',
        color:       '#17100f',
        border:      '3px solid #140d0a',
        boxShadow:   '4px 4px 0 0 #000, inset 0 0 0 2px #ffd9a0',
      },
    },
    ghost: {
      style: {
        background:  '#241a17',
        color:       '#ffb257',
        border:      '3px solid #ffb257',
        boxShadow:   '4px 4px 0 0 #000, inset 0 0 0 2px #3a2a22',
      },
    },
  };

  return (
    <button
      className={`${base} ${className}`}
      style={variants[variant].style}
      {...props}
    >
      {children}
    </button>
  );
}
