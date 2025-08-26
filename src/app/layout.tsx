import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://brunch-scraper-webapp.vercel.app'),
  title: "브런치 텍스트 수집기",
  description: "브런치(brunch.co.kr) 글을 수집하여 텍스트 파일로 다운로드할 수 있는 웹 애플리케이션",
  keywords: ["브런치", "텍스트수집", "스크래핑", "다운로드", "브런치글수집"],
  authors: [{ name: "Joseph Choi" }],
  creator: "Joseph Choi",
  publisher: "브런치 텍스트 수집기",
  icons: {
    icon: [
      {
        url: "/brunch logo.jpg",
        sizes: "32x32",
        type: "image/jpeg",
      },
      {
        url: "/brunch logo.jpg", 
        sizes: "16x16",
        type: "image/jpeg",
      },
      {
        url: "/brunch logo.jpg",
        sizes: "any",
        type: "image/jpeg",
      }
    ],
    apple: [
      {
        url: "/brunch logo.jpg",
        sizes: "180x180",
        type: "image/jpeg",
      }
    ],
    other: [
      {
        rel: "icon",
        url: "/brunch logo.jpg",
        type: "image/jpeg",
      }
    ],
  },
  openGraph: {
    title: "브런치 텍스트 수집기",
    description: "브런치 글을 쉽게 수집하고 텍스트 파일로 다운로드하세요",
    type: "website",
    locale: "ko_KR",
    images: [
      {
        url: "/brunch logo.jpg",
        width: 1200,
        height: 630,
        alt: "브런치 텍스트 수집기",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "브런치 텍스트 수집기",
    description: "브런치 글을 쉽게 수집하고 텍스트 파일로 다운로드하세요",
    images: ["/brunch logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
