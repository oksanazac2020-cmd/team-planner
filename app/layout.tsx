import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Планер задач',
  description: 'Минималистичный интерфейс для обзора задач команды.',
  openGraph: {
    title: 'Планер задач',
    description: 'Вся работа команды — на одном экране',
    images: '/og.png',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Планер задач',
    description: 'Вся работа команды — на одном экране',
    images: '/og.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
