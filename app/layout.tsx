import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Own Drift',
  description: '나만의 속도를 찾아가는 감성 게임',
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
