/**
 * 브런치 텍스트 수집기 - 런타임 브라우저 설치 유틸리티
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { devLog } from './utils';

const execAsync = promisify(exec);

/**
 * 런타임에 Playwright 브라우저 설치 시도
 */
export async function ensurePlaywrightBrowser(): Promise<boolean> {
  try {
    devLog('런타임 Playwright 브라우저 설치 시도...');
    
    // Vercel 환경에서만 실행
    if (!process.env.VERCEL) {
      devLog('로컬 환경에서는 브라우저 설치 건너뛰기');
      return true;
    }

    // 여러 설치 명령 시도
    const installCommands = [
      'npx playwright-chromium install chromium --force',
      'npx playwright install chromium --force',
      'npx playwright install-deps && npx playwright install chromium'
    ];

    for (const command of installCommands) {
      try {
        devLog(`브라우저 설치 시도: ${command}`);
        const { stdout, stderr } = await execAsync(command, { 
          timeout: 120000, // 2분 타임아웃
          env: {
            ...process.env,
            PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: 'false'
          }
        });
        
        devLog('설치 성공:', stdout);
        if (stderr) {
          devLog('설치 경고:', stderr);
        }
        
        return true;
      } catch (error) {
        devLog(`설치 실패 (${command}):`, error);
        continue;
      }
    }

    devLog('모든 브라우저 설치 시도 실패');
    return false;

  } catch (error) {
    devLog('브라우저 설치 중 예외 발생:', error);
    return false;
  }
}

/**
 * 브라우저 실행 가능 여부 확인
 */
export async function checkBrowserAvailable(): Promise<boolean> {
  try {
    // chromium 패키지에서 브라우저 경로 확인
    const { chromium } = await import('playwright-chromium');
    
    // 브라우저 실행 테스트
    const browser = await chromium.launch({ 
      headless: true,
      timeout: 10000,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    await browser.close();
    devLog('브라우저 사용 가능 확인됨');
    return true;
    
  } catch (error) {
    devLog('브라우저 사용 불가:', error);
    return false;
  }
}

/**
 * 브라우저 준비 (설치 + 확인)
 */
export async function prepareBrowser(): Promise<boolean> {
  try {
    // 먼저 브라우저 사용 가능한지 확인
    const available = await checkBrowserAvailable();
    if (available) {
      devLog('브라우저가 이미 사용 가능합니다');
      return true;
    }

    // 사용 불가능하면 설치 시도
    devLog('브라우저 설치 필요 - 설치 시작');
    const installed = await ensurePlaywrightBrowser();
    
    if (!installed) {
      devLog('브라우저 설치 실패');
      return false;
    }

    // 설치 후 다시 확인
    return await checkBrowserAvailable();
    
  } catch (error) {
    devLog('브라우저 준비 중 오류:', error);
    return false;
  }
}
