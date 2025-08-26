/**
 * 브런치 텍스트 수집기 - Playwright 스크래핑 엔진
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright-chromium';
import {
  ScrapeConfig,
  ScrapeResult,
  ArticleData,
  ScrapingSettings,
} from './types';
import { 
  CSS_SELECTORS, 
  SCRAPING_SETTINGS,
  NETWORK_SETTINGS 
} from './constants';
import { devLog } from './utils';

/**
 * Playwright 기반 브런치 스크래퍼 클래스
 */
export class BrunchScraper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private settings: ScrapingSettings;

  constructor(settings: Partial<ScrapingSettings> = {}) {
    this.settings = {
      ...SCRAPING_SETTINGS,
      ...settings,
    };
  }

  /**
   * 브라우저 초기화
   */
  async initialize(): Promise<void> {
    try {
      devLog('브라우저 초기화 시작...');

      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--memory-pressure-off',
        ],
        timeout: NETWORK_SETTINGS.BROWSER_TIMEOUT,
      });

      this.context = await this.browser.newContext({
        userAgent: this.settings.userAgent,
        viewport: { width: 1280, height: 800 },
        ignoreHTTPSErrors: true,
      });

      devLog('브라우저 초기화 완료');
    } catch (error) {
      devLog('브라우저 초기화 실패:', error);
      throw new Error(`브라우저 초기화에 실패했습니다: ${error}`);
    }
  }

  /**
   * 브라우저 정리
   */
  async cleanup(): Promise<void> {
    if (this.context) {
      try {
        await this.context.close();
        this.context = null;
      } catch (error) {
        devLog('컨텍스트 정리 중 오류:', error);
      }
    }

    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        devLog('브라우저 정리 완료');
      } catch (error) {
        devLog('브라우저 정리 중 오류:', error);
      }
    }
  }

  /**
   * 새 페이지 생성
   */
  private async createPage(): Promise<Page> {
    if (!this.context) {
      throw new Error('브라우저 컨텍스트가 초기화되지 않았습니다');
    }

    const page = await this.context.newPage();
    
    // 타임아웃 설정
    page.setDefaultTimeout(NETWORK_SETTINGS.PAGE_TIMEOUT);
    page.setDefaultNavigationTimeout(NETWORK_SETTINGS.NAVIGATION_TIMEOUT);

    return page;
  }

  /**
   * 브런치 글 존재 여부 확인
   */
  async checkArticleExists(url: string): Promise<boolean> {
    let page: Page | null = null;
    
    try {
      devLog(`글 존재 확인: ${url}`);
      page = await this.createPage();
      
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: NETWORK_SETTINGS.NAVIGATION_TIMEOUT,
      });

      if (!response || response.status() !== 200) {
        return false;
      }

      // 글 내용이 있는지 확인
      const hasContent = await page.$(CSS_SELECTORS.CONTENT);
      const exists = !!hasContent;
      
      devLog(`글 존재 여부: ${exists}`);
      return exists;
    } catch (error) {
      devLog(`글 확인 실패: ${url}`, error);
      return false;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * 단일 브런치 글 스크래핑
   */
  async scrapeArticle(url: string): Promise<ArticleData | null> {
    let page: Page | null = null;
    
    try {
      devLog(`글 스크래핑 시작: ${url}`);
      page = await this.createPage();
      
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: NETWORK_SETTINGS.NAVIGATION_TIMEOUT,
      });

      if (!response || response.status() !== 200) {
        throw new Error(`페이지 로드 실패: HTTP ${response?.status()}`);
      }

      // 페이지 로딩 대기
      await page.waitForSelector(CSS_SELECTORS.CONTENT, { 
        timeout: this.settings.waitTimeout 
      });

      // 제목 추출
      const titleElement = await page.$(CSS_SELECTORS.TITLE);
      const title = titleElement 
        ? await titleElement.textContent() || ''
        : '';

      if (!title.trim()) {
        throw new Error('제목을 찾을 수 없습니다');
      }

      // 내용 추출
      const contentElements = await page.$$(CSS_SELECTORS.CONTENT);
      let content = '';
      
      for (const element of contentElements) {
        const text = await element.textContent() || '';
        if (text.trim()) {
          content += text.trim() + '\n\n';
        }
      }

      if (!content.trim()) {
        throw new Error('내용을 찾을 수 없습니다');
      }

      // 작성일 추출
      let publishedDate = '';
      const dateSelectors = [
        '.cover_info .date', 
        'time[datetime]',
        '.byline time',
        '.article-meta time',
        '.article_info time',
        '.publish-date',
        '[class*="date"]',
        '[class*="time"]'
      ];

      for (const selector of dateSelectors) {
        try {
          const dateElement = await page.$(selector);
          if (dateElement) {
            // datetime 속성이 있으면 우선 사용
            const datetime = await dateElement.getAttribute('datetime');
            if (datetime) {
              publishedDate = datetime;
              devLog(`작성일 추출 성공 (${selector} datetime):`, publishedDate);
              break;
            }
            
            // 텍스트 내용에서 추출
            const dateText = await dateElement.textContent() || '';
            if (dateText.trim()) {
              publishedDate = dateText.trim();
              devLog(`작성일 추출 성공 (${selector} text):`, publishedDate);
              break;
            }
          }
        } catch {
          // 개별 셀렉터 오류는 무시하고 다음 시도
          continue;
        }
      }

      // 만약 여전히 찾지 못했다면 페이지 소스에서 직접 찾기
      if (!publishedDate) {
        const pageContent = await page.content();
        const datePatterns = [
          /"datePublished":\s*"([^"]+)"/,
          /"publishDate":\s*"([^"]+)"/,
          /data-publish-date="([^"]+)"/,
          /datetime="([^"]+)"/
        ];

        for (const pattern of datePatterns) {
          const match = pageContent.match(pattern);
          if (match && match[1]) {
            publishedDate = match[1];
            devLog(`작성일 추출 성공 (패턴 매칭):`, publishedDate);
            break;
          }
        }
      }

      const articleData: ArticleData = {
        title: title.trim(),
        content: content.trim(),
        url,
        number: parseInt(url.split('/').pop() || '0', 10),
        success: true,
        publishedDate: publishedDate || undefined,
      };

      devLog(`글 스크래핑 완료: ${title}`);
      return articleData;

    } catch (error) {
      devLog(`글 스크래핑 실패 ${url}:`, error);
      return null;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }
}

/**
 * 브런치 접근 가능성 확인
 */
export async function checkBrunchAccessibility(): Promise<{
  accessible: boolean;
  error?: string;
}> {
  const scraper = new BrunchScraper();
  
  try {
    await scraper.initialize();
    
    // 테스트용 브런치 메인 페이지 접근
    await scraper.checkArticleExists('https://brunch.co.kr');
    
    return {
      accessible: true,
    };
  } catch (error) {
    devLog('브런치 접근성 확인 실패:', error);
    return {
      accessible: false,
      error: `브런치 사이트 접근 실패: ${error}`,
    };
  } finally {
    await scraper.cleanup();
  }
}

/**
 * 여러 브런치 글 스크래핑
 */
export async function scrapeMultipleArticles(config: ScrapeConfig): Promise<ScrapeResult> {
  const { baseUrl, startNum, endNum, onProgress } = config;
  const scraper = new BrunchScraper();
  const results: ArticleData[] = [];
  const skippedUrls: string[] = [];
  
  const startTime = Date.now();

  try {
    await scraper.initialize();

    const totalArticles = endNum - startNum + 1;
    let processedCount = 0;

    for (let articleNumber = startNum; articleNumber <= endNum; articleNumber++) {
      const url = `${baseUrl}/${articleNumber}`;
      
      try {
        // 진행률 콜백 호출
        if (onProgress) {
          await onProgress(processedCount, totalArticles, url);
        }

        // 글 존재 확인
        const exists = await scraper.checkArticleExists(url);
        if (!exists) {
          skippedUrls.push(url);
          processedCount++;
          continue;
        }

        // 글 스크래핑
        const articleData = await scraper.scrapeArticle(url);
        
        if (articleData) {
          results.push(articleData);
          devLog(`글 ${articleNumber}번 수집 성공:`, articleData.title);
        } else {
          skippedUrls.push(url);
        }

        processedCount++;

        // 요청 간 지연
        if (articleNumber < endNum) {
          await new Promise(resolve => setTimeout(resolve, 2500)); // 2.5초 지연
        }

      } catch (error) {
        devLog(`글 ${articleNumber}번 처리 중 오류:`, error);
        skippedUrls.push(url);
        processedCount++;
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      data: results,
      skippedUrls,
      processingTime,
    };

  } catch (error) {
    devLog('스크래핑 과정에서 치명적 오류:', error);
    return {
      success: false,
      error: `스크래핑 중 오류가 발생했습니다: ${error}`,
      skippedUrls,
      processingTime: Date.now() - startTime,
    };
  } finally {
    await scraper.cleanup();
  }
}

// 기본 스크래퍼 인스턴스 생성 함수
export function createScraper(settings?: Partial<ScrapingSettings>): BrunchScraper {
  return new BrunchScraper(settings);
}
