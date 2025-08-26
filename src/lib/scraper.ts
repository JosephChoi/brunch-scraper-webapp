/**
 * 브런치 텍스트 수집기 - HTTP + Cheerio 스크래핑 엔진
 */

import * as cheerio from 'cheerio';
import {
  ScrapeConfig,
  ScrapeResult,
  ArticleData,
} from './types';
import { 
  CSS_SELECTORS,
  NETWORK_SETTINGS 
} from './constants';
import { devLog } from './utils';

/**
 * HTTP 기반 브런치 스크래퍼 클래스
 */
export class BrunchScraper {
  private headers: Record<string, string>;

  constructor() {
    this.headers = {
      // 브런치의 로그인 리다이렉트를 우회하기 위해 Googlebot User-Agent 사용
      'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };
  }

  /**
   * HTTP 요청으로 HTML 가져오기
   */
  private async fetchHtml(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NETWORK_SETTINGS.PAGE_TIMEOUT);

    try {
      devLog(`HTTP 요청 시작: ${url}`);
      
      const response = await fetch(url, {
        headers: this.headers,
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      devLog(`HTML 수신 성공: ${html.length} bytes`);
      
      return html;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('요청 시간 초과');
      }
      
      devLog(`HTTP 요청 실패: ${url}`, error);
      throw error;
    }
  }

  /**
   * Cheerio로 HTML 파싱 및 데이터 추출
   */
  private parseArticleData(html: string, url: string): ArticleData | null {
    try {
      const $ = cheerio.load(html);

      // 404 페이지 또는 존재하지 않는 글 확인
      if ($('title').text().includes('404') || 
          $('.error').length > 0 || 
          $('body').text().includes('존재하지 않는')) {
        devLog('404 페이지 감지');
        return null;
      }

      // 제목 추출
      let title = '';
      const titleSelectors = [
        CSS_SELECTORS.TITLE,
        '.cover_title',
        'h1.title',
        'h1',
        '.article-title',
        'title'
      ];

      for (const selector of titleSelectors) {
        const titleElement = $(selector).first();
        if (titleElement.length && titleElement.text().trim()) {
          title = titleElement.text().trim();
          devLog(`제목 추출 성공 (${selector}):`, title);
          break;
        }
      }

      if (!title) {
        throw new Error('제목을 찾을 수 없습니다');
      }

      // 내용 추출
      let content = '';
      const contentSelectors = [
        CSS_SELECTORS.CONTENT,
        '.wrap_body',
        '.article-body',
        '.content',
        '.post-content',
        'article .text'
      ];

      for (const selector of contentSelectors) {
        const contentElements = $(selector);
        if (contentElements.length > 0) {
          contentElements.each((_, element) => {
            const text = $(element).text().trim();
            if (text) {
              content += text + '\n\n';
            }
          });
          
          if (content.trim()) {
            devLog(`내용 추출 성공 (${selector}): ${content.length} chars`);
            break;
          }
        }
      }

      if (!content.trim()) {
        throw new Error('내용을 찾을 수 없습니다');
      }

      // 작성일 추출 (브런치 구조에 최적화된 셀렉터 순서)
      let publishedDate = '';
      const dateSelectors = [
        '[class*="date"]', // 브런치에서 .date 클래스 사용
        '.cover_info .date',
        'time[datetime]',
        '.byline time',
        '.article-meta time', 
        '.article_info time',
        '.publish-date',
        '[data-date]'
      ];

      for (const selector of dateSelectors) {
        const dateElement = $(selector).first();
        if (dateElement.length) {
          // datetime 속성 우선 확인
          const datetime = dateElement.attr('datetime');
          if (datetime) {
            publishedDate = datetime;
            devLog(`작성일 추출 성공 (${selector} datetime):`, publishedDate);
            break;
          }

          // data-date 속성 확인
          const dataDate = dateElement.attr('data-date');
          if (dataDate) {
            publishedDate = dataDate;
            devLog(`작성일 추출 성공 (${selector} data-date):`, publishedDate);
            break;
          }
          
          // 텍스트 내용에서 추출
          const dateText = dateElement.text().trim();
          if (dateText) {
            publishedDate = dateText;
            devLog(`작성일 추출 성공 (${selector} text):`, publishedDate);
            break;
          }
        }
      }

      // JSON-LD에서 날짜 추출 시도 (우선순위 높음)
      if (!publishedDate) {
        $('script[type="application/ld+json"]').each((_, script) => {
          try {
            const jsonData = JSON.parse($(script).html() || '{}');
            if (jsonData.datePublished) {
              publishedDate = jsonData.datePublished;
              devLog('작성일 추출 성공 (JSON-LD):', publishedDate);
              return false; // break
            }
            if (jsonData.dateCreated) {
              publishedDate = jsonData.dateCreated;
              devLog('작성일 추출 성공 (JSON-LD dateCreated):', publishedDate);
              return false; // break
            }
          } catch {
            // JSON 파싱 실패는 무시
          }
        });
      }

      // 정규식으로 HTML에서 날짜 패턴 찾기
      if (!publishedDate) {
        const datePatterns = [
          /"datePublished":\s*"([^"]+)"/,
          /"publishDate":\s*"([^"]+)"/,
          /data-publish-date="([^"]+)"/,
          /datetime="([^"]+)"/,
          /"date":\s*"([^"]+)"/
        ];

        for (const pattern of datePatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            publishedDate = match[1];
            devLog('작성일 추출 성공 (패턴 매칭):', publishedDate);
            break;
          }
        }
      }

      const articleNumber = parseInt(url.split('/').pop() || '0', 10);

      const articleData: ArticleData = {
        title: title.trim(),
        content: content.trim(),
        url,
        number: articleNumber,
        success: true,
        publishedDate: publishedDate || undefined,
      };

      devLog(`글 파싱 완료: ${title} (${content.length} chars)`);
      return articleData;

    } catch (error) {
      devLog(`HTML 파싱 실패:`, error);
      return null;
    }
  }

  /**
   * 브런치 글 존재 여부 확인
   */
  async checkArticleExists(url: string): Promise<boolean> {
    try {
      devLog(`글 존재 확인: ${url}`);
      const html = await this.fetchHtml(url);
      
      // 간단한 존재 여부 확인
      const $ = cheerio.load(html);
      
      // 404 페이지 확인
      if ($('title').text().includes('404') || 
          $('.error').length > 0 || 
          $('body').text().includes('존재하지 않는') ||
          $('body').text().includes('페이지를 찾을 수 없습니다')) {
        devLog('글이 존재하지 않음');
        return false;
      }

      // 제목이나 내용 존재 확인
      const hasTitle = $(CSS_SELECTORS.TITLE).length > 0 || $('.cover_title').length > 0;
      const hasContent = $(CSS_SELECTORS.CONTENT).length > 0 || $('.wrap_body').length > 0;
      
      const exists = hasTitle && hasContent;
      devLog(`글 존재 여부: ${exists}`);
      return exists;
      
    } catch (error) {
      devLog(`글 확인 실패: ${url}`, error);
      return false;
    }
  }

  /**
   * 단일 브런치 글 스크래핑
   */
  async scrapeArticle(url: string): Promise<ArticleData | null> {
    try {
      devLog(`글 스크래핑 시작: ${url}`);
      
      const html = await this.fetchHtml(url);
      const articleData = this.parseArticleData(html, url);
      
      if (articleData) {
        devLog(`글 스크래핑 완료: ${articleData.title}`);
      } else {
        devLog(`글 스크래핑 실패: 데이터 추출 불가`);
      }
      
      return articleData;
      
    } catch (error) {
      devLog(`글 스크래핑 실패 ${url}:`, error);
      return null;
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
    // 테스트용 브런치 메인 페이지 접근
    const testUrl = 'https://brunch.co.kr';
    await scraper.checkArticleExists(testUrl);
    
    return {
      accessible: true,
    };
  } catch (error) {
    devLog('브런치 접근성 확인 실패:', error);
    return {
      accessible: false,
      error: `브런치 사이트 접근 실패: ${error}`,
    };
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
    const totalArticles = endNum - startNum + 1;
    let processedCount = 0;

    for (let articleNumber = startNum; articleNumber <= endNum; articleNumber++) {
      const url = `${baseUrl}/${articleNumber}`;
      
      try {
        // 진행률 콜백 호출 (시작 시)
        if (onProgress) {
          await onProgress(processedCount, totalArticles, url, `글 ${articleNumber}번 처리 중...`);
        }

        // 글 존재 확인
        const exists = await scraper.checkArticleExists(url);
        if (!exists) {
          skippedUrls.push(url);
          processedCount++;
          
          // 존재하지 않는 글 처리 완료 후 진행률 업데이트
          if (onProgress) {
            await onProgress(processedCount, totalArticles, url, `글 ${articleNumber}번: 존재하지 않음`);
          }
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
        
        // 처리 완료 후 진행률 업데이트
        if (onProgress) {
          const title = articleData ? articleData.title : `글 ${articleNumber}번`;
          await onProgress(processedCount, totalArticles, url, `완료: ${title}`);
        }

        // 요청 간 지연 (서버 부하 방지)
        if (articleNumber < endNum) {
          await new Promise(resolve => setTimeout(resolve, 2500)); // 2.5초 지연
        }

      } catch (error) {
        devLog(`글 ${articleNumber}번 처리 중 오류:`, error);
        skippedUrls.push(url);
        processedCount++;
        
        // 에러 처리 완료 후 진행률 업데이트
        if (onProgress) {
          await onProgress(processedCount, totalArticles, url, `글 ${articleNumber}번: 오류 발생`);
        }
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
  }
}

// 기본 스크래퍼 인스턴스 생성 함수
export function createScraper(): BrunchScraper {
  return new BrunchScraper();
}