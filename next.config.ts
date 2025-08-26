import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 배포 최적화 설정
  output: 'standalone',
  
  // 이미지 최적화 설정
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // API 라우트 설정
  async headers() {
    return [
      {
        source: '/api/scrape',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  
  // 서버 외부 패키지 설정 (Vercel에서 Puppeteer 최적화)
  serverExternalPackages: ['puppeteer'],
};

export default nextConfig;
