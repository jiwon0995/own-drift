import type { Metadata, Viewport } from 'next';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const title = 'Own Drift — 나만의 속도를 찾는 감성 웹 게임';
// 검색엔진(구글 등) 노출용 — 키워드가 풍부한 긴 설명
const description = '혼란 속에서 자신만의 리듬을 되찾는 픽셀 아트 감성 웹게임. 인디 힐링 게임으로 \'내 속도\'를 찾는 짧은 여정을 경험하세요.';
// 공유 카드(카카오톡·X) 미리보기용 — 짧고 감성적인 한 줄
const shareDescription = '나만의 속도를 찾아가는 감성 웹 게임.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: title,
    template: '%s · Own Drift',
  },
  description,
  applicationName: 'Own Drift',
  keywords: ['감성게임', '인디게임', '웹게임', '레트로게임', '도트게임', '힐링게임'],
  authors: [{ name: 'SSAUMZZANG' }],
  creator: 'SSAUMZZANG',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    siteName: 'Own Drift',
    title,
    description: shareDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description: shareDescription,
  },
};

export const viewport: Viewport = {
  themeColor: '#ffb257', // 게임 캐릭터(러너) 색
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full font-pixel">{children}</body>
    </html>
  );
}
