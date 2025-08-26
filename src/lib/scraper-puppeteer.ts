/**
 * 브런치 텍스트 수집기 - Puppeteer 스크래핑 엔진 (Vercel 최적화)
 */

import puppeteer, { Browser, Page } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import {
  ScrapeConfig,
  PuppeteerScrapeResult,
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
 * Puppeteer 기반 브런치 스크래퍼 클래스
 */
export class PuppeteerBrunchScraper {
  private browser: Browser | null = null;
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

      // Vercel/AWS Lambda 환경 감지
      const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
      
      if (isVercel) {
        devLog('Vercel/AWS Lambda 환경에서 chrome-aws-lambda 사용');
        
        // @sparticuz/chromium 사용 (Vercel/AWS Lambda)
        this.browser = await puppeteer.launch({
          args: [
            ...chromium.args,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
          ],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
        });
      } else {
        devLog('로컬 환경에서 일반 Puppeteer 사용');
        
        // 로컬 개발 환경
        this.browser = await puppeteer.launch({
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
          timeout: NETWORK_SETTINGS.BROWSER_TIMEOUT,
        });
      }

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
   * 새 페이지 생성 및 설정
   */
  private async createPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('브라우저가 초기화되지 않았습니다');
    }

    const page = await this.browser.newPage();
    
    // 페이지 설정
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

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
    } catch {
      devLog(`글 확인 실패: ${url}`);
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
        ? await page.evaluate(el => el?.textContent?.trim() || '', titleElement)
        : '';

      if (!title) {
        throw new Error('제목을 찾을 수 없습니다');
      }

      // 내용 추출
      const contentElements = await page.$$(CSS_SELECTORS.CONTENT);
      let content = '';
      
      for (const element of contentElements) {
        const text = await page.evaluate(el => el?.textContent?.trim() || '', element);
        if (text) {
          content += text + '\n\n';
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
            const datetime = await page.evaluate(el => el?.getAttribute('datetime'), dateElement);
            if (datetime) {
              publishedDate = datetime;
              devLog(`작성일 추출 성공 (${selector} datetime):`, publishedDate);
              break;
            }
            
            // 텍스트 내용에서 추출
            const dateText = await page.evaluate(el => el?.textContent?.trim() || '', dateElement);
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

  /**
   * 여러 브런치 글 스크래핑 (스트리밍 방식)
   */
  async *scrapeArticles(config: ScrapeConfig): AsyncGenerator<PuppeteerScrapeResult> {
    const { baseUrl, startNumber, endNumber } = config;
    const totalArticles = endNumber - startNumber + 1;
    let processedCount = 0;
    let successCount = 0;
    const results: ArticleData[] = [];
    const errors: string[] = [];

    try {
      await this.initialize();

      for (let articleNumber = startNumber; articleNumber <= endNumber; articleNumber++) {
        const url = `${baseUrl}/${articleNumber}`;
        
        try {
          // 글 존재 확인
          const exists = await this.checkArticleExists(url);
          if (!exists) {
            errors.push(`글 ${articleNumber}번: 존재하지 않거나 접근할 수 없습니다`);
            processedCount++;
            
            yield {
              type: 'progress',
              data: {
                current: processedCount,
                total: totalArticles,
                percentage: Math.round((processedCount / totalArticles) * 100),
                currentArticle: articleNumber,
                status: `글 ${articleNumber}번: 존재하지 않음`,
              },
            };
            continue;
          }

          // 글 스크래핑
          yield {
            type: 'progress',
            data: {
              current: processedCount,
              total: totalArticles,
              percentage: Math.round((processedCount / totalArticles) * 100),
              currentArticle: articleNumber,
              status: `글 ${articleNumber}번 수집 중...`,
            },
          };

          const articleData = await this.scrapeArticle(url);
          
          if (articleData) {
            results.push(articleData);
            successCount++;
            devLog(`글 ${articleNumber}번 수집 성공:`, articleData.title);
          } else {
            errors.push(`글 ${articleNumber}번: 스크래핑 실패`);
          }

          processedCount++;

          // 진행률 업데이트
          yield {
            type: 'progress',
            data: {
              current: processedCount,
              total: totalArticles,
              percentage: Math.round((processedCount / totalArticles) * 100),
              currentArticle: articleNumber,
              status: `글 ${articleNumber}번 완료`,
            },
          };

          // 요청 간 지연
          if (articleNumber < endNumber) {
            await new Promise(resolve => setTimeout(resolve, this.settings.delayBetweenRequests));
          }

        } catch (error) {
          const errorMessage = `글 ${articleNumber}번: ${error}`;
          errors.push(errorMessage);
          processedCount++;
          
          devLog(`글 ${articleNumber}번 처리 중 오류:`, error);
          
          yield {
            type: 'progress',
            data: {
              current: processedCount,
              total: totalArticles,
              percentage: Math.round((processedCount / totalArticles) * 100),
              currentArticle: articleNumber,
              status: `글 ${articleNumber}번: 오류 발생`,
            },
          };
        }
      }

      // 완료 결과
      yield {
        type: 'complete',
        data: {
          articles: results,
          summary: {
            total: totalArticles,
            success: successCount,
            failed: totalArticles - successCount,
            errors,
          },
        },
      };

    } catch (error) {
      devLog('스크래핑 과정에서 치명적 오류:', error);
      yield {
        type: 'error',
        data: {
          message: `스크래핑 중 오류가 발생했습니다: ${error}`,
          code: 'SCRAPING_ERROR',
        },
      };
    } finally {
      await this.cleanup();
    }
  }
}

// 기본 스크래퍼 인스턴스 생성 함수
export function createScraper(settings?: Partial<ScrapingSettings>): PuppeteerBrunchScraper {
  return new PuppeteerBrunchScraper(settings);
}
