/**
 * 브런치 텍스트 수집기 - Playwright 스크래핑 엔진
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import {
  ScrapeConfig,
  ScrapeResult,
  ArticleData,
  ScrapingSettings,
  DEFAULT_SCRAPING_SETTINGS,
} from './types';
import {
  buildBrunchUrl,
  delay,
  stripHtmlTags,
  normalizeWhitespace,
  getErrorMessage,
  devLog,
} from './utils';
import {
  CSS_SELECTORS,
  PAGE_LOAD_TIMEOUT,
  NETWORK_IDLE_TIMEOUT,
  DEFAULT_HEADERS,
  REQUEST_DELAY_MS,
} from './constants';

// ===== 브라우저 관리 클래스 =====

/**
 * Playwright 브라우저 인스턴스를 관리하는 클래스
 */
export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private settings: ScrapingSettings;

  constructor(settings: Partial<ScrapingSettings> = {}) {
    this.settings = { ...DEFAULT_SCRAPING_SETTINGS, ...settings };
  }

  /**
   * 브라우저 인스턴스를 초기화합니다.
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
        ],
      });

      this.context = await this.browser.newContext({
        userAgent: this.settings.userAgent,
        extraHTTPHeaders: DEFAULT_HEADERS,
        viewport: { width: 1280, height: 720 },
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
      });

      // 요청 인터셉션 설정 (이미지, 폰트 등 불필요한 리소스 차단)
      await this.context.route('**/*', (route) => {
        const resourceType = route.request().resourceType();
        
        if (['image', 'font', 'media', 'websocket'].includes(resourceType)) {
          route.abort();
        } else {
          route.continue();
        }
      });

      devLog('브라우저 초기화 완료');
    } catch (error) {
      throw new Error(`브라우저 초기화 실패: ${getErrorMessage(error)}`);
    }
  }

  /**
   * 새 페이지를 생성합니다.
   */
  async createPage(): Promise<Page> {
    if (!this.context) {
      throw new Error('브라우저 컨텍스트가 초기화되지 않았습니다.');
    }

    const page = await this.context.newPage();
    
    // 타임아웃 설정
    page.setDefaultTimeout(this.settings.timeout);
    page.setDefaultNavigationTimeout(this.settings.timeout);

    return page;
  }

  /**
   * 브라우저를 정리합니다.
   */
  async cleanup(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      
      devLog('브라우저 정리 완료');
    } catch (error) {
      devLog('브라우저 정리 중 오류:', error);
    }
  }

  /**
   * 브라우저가 초기화되었는지 확인합니다.
   */
  isInitialized(): boolean {
    return this.browser !== null && this.context !== null;
  }
}

// ===== 페이지 스크래핑 함수들 =====

/**
 * 단일 브런치 글에서 텍스트를 추출합니다.
 * @param page Playwright 페이지 인스턴스
 * @param url 스크래핑할 URL
 * @returns 추출된 글 데이터
 */
export async function scrapeArticle(page: Page, url: string): Promise<ArticleData> {
  const startTime = Date.now();
  
  try {
    devLog(`글 스크래핑 시작: ${url}`);

    // 페이지 이동
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: PAGE_LOAD_TIMEOUT,
    });

    // 응답 상태 확인
    if (!response || !response.ok()) {
      const status = response?.status() || 0;
      
      if (status === 404) {
        throw new Error('글을 찾을 수 없습니다. (404)');
      } else if (status >= 500) {
        throw new Error(`서버 오류가 발생했습니다. (${status})`);
      } else {
        throw new Error(`페이지 로딩 실패 (${status})`);
      }
    }

    // 네트워크 활동 안정화 대기
    await page.waitForLoadState('networkidle', {
      timeout: NETWORK_IDLE_TIMEOUT,
    }).catch(() => {
      // 네트워크 idle 대기 실패 시에도 계속 진행
      devLog('네트워크 idle 대기 타임아웃 - 계속 진행');
    });

    // 필수 요소 대기
    await page.waitForSelector(CSS_SELECTORS.ARTICLE_BODY, {
      timeout: 5000,
    }).catch(() => {
      throw new Error('글 본문을 찾을 수 없습니다.');
    });

    // 제목 추출
    let title = '';
    try {
      const titleElement = await page.$(CSS_SELECTORS.TITLE);
      if (titleElement) {
        title = await titleElement.textContent() || '';
        title = normalizeWhitespace(stripHtmlTags(title));
      }
    } catch (error) {
      devLog('제목 추출 실패:', error);
    }

    // 작성일 추출
    let publishedDate = '';
    try {
      // 여러 방법으로 작성일 추출 시도
      const dateSelectors = [
        '.cover_info .f_l',
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
            devLog('작성일 추출 성공 (페이지 소스):', publishedDate);
            break;
          }
        }
      }
    } catch (error) {
      devLog('작성일 추출 실패:', error);
    }

    // 본문 추출
    let content = '';
    try {
      const contentElement = await page.$(CSS_SELECTORS.CONTENT);
      if (contentElement) {
        // HTML 내용 추출
        const htmlContent = await contentElement.innerHTML();
        
        // HTML 태그 제거 및 텍스트 정제
        content = normalizeWhitespace(stripHtmlTags(htmlContent));
      }
    } catch (error) {
      devLog('본문 추출 실패:', error);
    }

    // 추출된 데이터 검증
    if (!title && !content) {
      throw new Error('제목과 본문을 모두 추출할 수 없습니다.');
    }

    const processingTime = Date.now() - startTime;
    devLog(`글 스크래핑 완료: ${title || '(제목 없음)'} (${processingTime}ms)`);

    // 글 번호 추출
    const urlMatch = url.match(/\/(\d+)$/);
    const articleNumber = urlMatch ? parseInt(urlMatch[1], 10) : 0;

    return {
      title: title || '(제목 없음)',
      content: content || '(내용을 추출할 수 없습니다)',
      url,
      number: articleNumber,
      success: true,
      publishedDate: publishedDate || undefined,
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = getErrorMessage(error);
    
    devLog(`글 스크래핑 실패: ${url} - ${errorMessage} (${processingTime}ms)`);

    // 글 번호 추출
    const urlMatch = url.match(/\/(\d+)$/);
    const articleNumber = urlMatch ? parseInt(urlMatch[1], 10) : 0;

    return {
      title: '(스크래핑 실패)',
      content: `스크래핑 실패: ${errorMessage}`,
      url,
      number: articleNumber,
      success: false,
      publishedDate: undefined,
    };
  }
}

/**
 * 여러 브런치 글을 순차적으로 스크래핑합니다.
 * @param config 스크래핑 설정
 * @returns 스크래핑 결과
 */
export async function scrapeMultipleArticles(config: ScrapeConfig): Promise<ScrapeResult> {
  const startTime = Date.now();
  let browserManager: BrowserManager | null = null;
  let page: Page | null = null;

  try {
    devLog('다중 글 스크래핑 시작', config);

    // 브라우저 초기화
    browserManager = new BrowserManager();
    await browserManager.initialize();
    
    page = await browserManager.createPage();

    const articles: ArticleData[] = [];
    const skippedUrls: string[] = [];
    const totalArticles = config.endNum - config.startNum + 1;

    // 각 글을 순차적으로 스크래핑
    for (let i = config.startNum; i <= config.endNum; i++) {
      const currentUrl = buildBrunchUrl(config.authorId, i);
      const currentIndex = i - config.startNum + 1;

      try {
        // 진행 상황 콜백 호출
        if (config.onProgress) {
          config.onProgress(currentIndex, totalArticles, currentUrl);
        }

        // 글 스크래핑
        const article = await scrapeArticle(page, currentUrl);
        articles.push(article);

        // 실패한 글 URL 기록
        if (!article.success) {
          skippedUrls.push(currentUrl);
        }

        // 마지막 글이 아니면 딜레이
        if (i < config.endNum) {
          await delay(REQUEST_DELAY_MS);
        }

      } catch (error) {
        const errorMessage = getErrorMessage(error);
        devLog(`글 ${i} 스크래핑 중 오류:`, errorMessage);

        // 실패한 글도 기록
        const failedArticle: ArticleData = {
          title: '(스크래핑 실패)',
          content: `스크래핑 실패: ${errorMessage}`,
          url: currentUrl,
          number: i,
          success: false,
        };
        
        articles.push(failedArticle);
        skippedUrls.push(currentUrl);

        // 연속 실패 시 중단 조건 (선택사항)
        const recentFailures = articles.slice(-3).filter(a => !a.success).length;
        if (recentFailures >= 3) {
          devLog('연속 3회 실패로 스크래핑 중단');
          break;
        }

        // 딜레이 후 계속
        if (i < config.endNum) {
          await delay(REQUEST_DELAY_MS);
        }
      }
    }

    const processingTime = Date.now() - startTime;
    const successCount = articles.filter(a => a.success).length;

    devLog(`다중 글 스크래핑 완료: ${successCount}/${totalArticles} 성공 (${processingTime}ms)`);

    return {
      success: true,
      data: articles,
      skippedUrls,
      processingTime,
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = getErrorMessage(error);
    
    devLog(`다중 글 스크래핑 실패:`, errorMessage);

    return {
      success: false,
      error: errorMessage,
      processingTime,
    };

  } finally {
    // 리소스 정리
    if (page) {
      try {
        await page.close();
      } catch (error) {
        devLog('페이지 정리 중 오류:', error);
      }
    }

    if (browserManager) {
      await browserManager.cleanup();
    }
  }
}

// ===== 유틸리티 함수들 =====

/**
 * 브런치 사이트의 접근 가능성을 확인합니다.
 * @returns 접근 가능 여부
 */
export async function checkBrunchAccessibility(): Promise<{
  accessible: boolean;
  error?: string;
  responseTime?: number;
}> {
  let browserManager: BrowserManager | null = null;
  let page: Page | null = null;

  try {
    const startTime = Date.now();
    
    browserManager = new BrowserManager();
    await browserManager.initialize();
    
    page = await browserManager.createPage();

    // 브런치 메인 페이지 접근 테스트
    const response = await page.goto('https://brunch.co.kr', {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });

    const responseTime = Date.now() - startTime;

    if (response && response.ok()) {
      return {
        accessible: true,
        responseTime,
      };
    } else {
      return {
        accessible: false,
        error: `HTTP ${response?.status() || 'unknown'} 응답`,
        responseTime,
      };
    }

  } catch (error) {
    return {
      accessible: false,
      error: getErrorMessage(error),
    };

  } finally {
    if (page) {
      try {
        await page.close();
      } catch (error) {
        devLog('페이지 정리 중 오류:', error);
      }
    }

    if (browserManager) {
      await browserManager.cleanup();
    }
  }
}

/**
 * 브런치 글이 존재하는지 확인합니다.
 * @param url 확인할 URL
 * @returns 존재 여부
 */
export async function checkArticleExists(url: string): Promise<{
  exists: boolean;
  error?: string;
  title?: string;
}> {
  let browserManager: BrowserManager | null = null;
  let page: Page | null = null;

  try {
    browserManager = new BrowserManager();
    await browserManager.initialize();
    
    page = await browserManager.createPage();

    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });

    if (!response || response.status() === 404) {
      return {
        exists: false,
        error: '글을 찾을 수 없습니다.',
      };
    }

    if (!response.ok()) {
      return {
        exists: false,
        error: `HTTP ${response.status()} 오류`,
      };
    }

    // 제목 추출 시도
    let title = '';
    try {
      const titleElement = await page.$(CSS_SELECTORS.TITLE);
      if (titleElement) {
        title = await titleElement.textContent() || '';
        title = normalizeWhitespace(stripHtmlTags(title));
      }
    } catch {
      // 제목 추출 실패해도 존재하는 것으로 판단
    }

    return {
      exists: true,
      title: title || undefined,
    };

  } catch (error) {
    return {
      exists: false,
      error: getErrorMessage(error),
    };

  } finally {
    if (page) {
      try {
        await page.close();
      } catch (error) {
        devLog('페이지 정리 중 오류:', error);
      }
    }

    if (browserManager) {
      await browserManager.cleanup();
    }
  }
}

/**
 * 스크래핑 성능을 측정합니다.
 * @param url 테스트할 URL
 * @returns 성능 정보
 */
export async function measureScrapingPerformance(url: string): Promise<{
  success: boolean;
  metrics?: {
    totalTime: number;
    loadTime: number;
    extractionTime: number;
    titleLength: number;
    contentLength: number;
  };
  error?: string;
}> {
  let browserManager: BrowserManager | null = null;
  let page: Page | null = null;

  try {
    const startTime = Date.now();
    
    browserManager = new BrowserManager();
    await browserManager.initialize();
    
    page = await browserManager.createPage();

    // 페이지 로딩 시간 측정
    const loadStartTime = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - loadStartTime;

    // 텍스트 추출 시간 측정
    const extractionStartTime = Date.now();
    const article = await scrapeArticle(page, url);
    const extractionTime = Date.now() - extractionStartTime;

    const totalTime = Date.now() - startTime;

    return {
      success: true,
      metrics: {
        totalTime,
        loadTime,
        extractionTime,
        titleLength: article.title.length,
        contentLength: article.content.length,
      },
    };

  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };

  } finally {
    if (page) {
      try {
        await page.close();
      } catch (error) {
        devLog('페이지 정리 중 오류:', error);
      }
    }

    if (browserManager) {
      await browserManager.cleanup();
    }
  }
}
