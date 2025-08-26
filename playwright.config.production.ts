/**
 * Playwright 프로덕션 환경 설정 (Vercel용)
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 테스트 설정이 아닌 스크래핑용 브라우저 설정
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Vercel serverless 환경에서 최적화된 설정
        headless: true,
        // 메모리 사용량 최적화
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        }
      },
    },
  ],
  
  // 글로벌 설정
  use: {
    // 브라우저 실행 타임아웃
    actionTimeout: 30 * 1000,
    navigationTimeout: 60 * 1000,
  },
  
  // 워커 설정 (serverless 환경에서 단일 워커)
  workers: 1,
  
  // 재시도 설정
  retries: 2,
  
  // 타임아웃 설정
  timeout: 5 * 60 * 1000, // 5분
});
