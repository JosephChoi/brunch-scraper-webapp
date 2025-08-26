import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 배포 최적화 설정
  output: 'standalone',
  
  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
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
  
  // 서버 전용 패키지 설정 
  serverExternalPackages: ['cheerio'],
  
  // 웹팩 설정으로 cheerio를 서버에서만 사용하도록 강제
  webpack: (config: any, { isServer }: any) => {
    if (!isServer) {
      // 클라이언트 번들에서 cheerio 제외
      config.resolve.fallback = {
        ...config.resolve.fallback,
        cheerio: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
