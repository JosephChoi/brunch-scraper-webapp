/**
 * 브런치 텍스트 수집기 - Puppeteer 기반 스크래핑 API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  ScrapeRequest,
  ProgressResponse,
  CompleteResponse,
  ErrorResponse,
  ScrapeConfig,
  StreamResponse,
} from '@/lib/types';
import {
  validateScrapeRequest,
  toValidationResponse,
} from '@/lib/validator';
import { createScraper } from '@/lib/scraper-puppeteer';
import {
  processArticlesForDownload,
  generateTextFilename,
} from '@/lib/textProcessor';
import {
  getCurrentTimestamp,
  getErrorMessage,
  devLog,
} from '@/lib/utils';

// ===== 상수 정의 =====

const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SCRAPING_ERROR: 'SCRAPING_ERROR',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

const ERROR_MESSAGES = {
  [ERROR_CODES.VALIDATION_ERROR]: '입력 데이터가 올바르지 않습니다.',
  [ERROR_CODES.NETWORK_ERROR]: '네트워크 연결에 문제가 있습니다.',
  [ERROR_CODES.SCRAPING_ERROR]: '웹 페이지 수집 중 오류가 발생했습니다.',
  [ERROR_CODES.PROCESSING_ERROR]: '데이터 처리 중 오류가 발생했습니다.',
  [ERROR_CODES.INTERNAL_ERROR]: '서버 내부 오류가 발생했습니다.',
} as const;

// ===== IP 주소 추출 =====

/**
 * 클라이언트 IP 주소를 추출합니다.
 * @param request NextRequest 객체
 * @returns 클라이언트 IP 주소
 */
function getClientIP(request: NextRequest): string {
  // Vercel의 경우
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // 기타 프록시
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // 개발 환경 등
  return 'unknown';
}

// ===== 스트리밍 응답 유틸리티 =====

/**
 * 스트리밍 응답용 Encoder
 */
class StreamEncoder {
  private encoder = new TextEncoder();

  /**
   * JSON 데이터를 스트리밍용 청크로 변환합니다.
   * @param data 전송할 데이터
   * @returns 인코딩된 청크
   */
  encode(data: StreamResponse): Uint8Array {
    const jsonString = JSON.stringify(data) + '\n';
    return this.encoder.encode(jsonString);
  }
}

/**
 * 스트리밍 Writer 인터페이스
 */
interface StreamWriter {
  write: (chunk: StreamResponse) => Promise<void>;
  close: () => Promise<void>;
}

/**
 * Server-Sent Events 스트리밍 응답을 생성합니다.
 * @param onStream 스트리밍 콜백 함수
 * @returns ReadableStream 응답
 */
function createStreamingResponse(
  onStream: (writer: StreamWriter) => Promise<void>
): NextResponse {
  const encoder = new StreamEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await onStream({
          write: (chunk: StreamResponse) => {
            const encodedChunk = encoder.encode(chunk);
            controller.enqueue(encodedChunk);
            return Promise.resolve();
          },
          close: () => {
            controller.close();
            return Promise.resolve();
          },
        });
      } catch (error) {
        devLog('스트리밍 중 오류:', error);
        
        // 에러 응답 전송
        const errorResponse: ErrorResponse = {
          type: 'error',
          error: ERROR_CODES.INTERNAL_ERROR,
          message: ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
          details: getErrorMessage(error),
          timestamp: getCurrentTimestamp(),
        };
        
        const errorChunk = encoder.encode(errorResponse);
        controller.enqueue(errorChunk);
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    status: HTTP_STATUS.OK,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// ===== API 핸들러 =====

/**
 * OPTIONS 메서드 핸들러 (CORS Preflight)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: HTTP_STATUS.OK,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * POST 메서드 핸들러 - 스크래핑 요청 처리
 */
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  devLog(`스크래핑 요청 시작 - IP: ${clientIP}`);

  try {
    // 요청 본문 파싱
    const requestBody: ScrapeRequest = await request.json();
    devLog('요청 데이터:', JSON.stringify(requestBody, null, 2));

    // 입력 검증
    const validation = validateScrapeRequest(requestBody);
    devLog('검증 결과:', JSON.stringify(validation, null, 2));
    
    if (!validation.isValid) {
      const validationResponse = toValidationResponse(validation);
      devLog('검증 실패 응답:', JSON.stringify(validationResponse, null, 2));
      return NextResponse.json(validationResponse, {
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    const { authorId, baseUrl, startNum, endNum } = validation.parsed!;

    // 스트리밍 응답 시작
    return createStreamingResponse(async (writer) => {
      // 스크래핑 설정
      const scrapeConfig: ScrapeConfig = {
        baseUrl,
        authorId,
        startNum,
        endNum,
        startNumber: startNum,
        endNumber: endNum,
      };

      devLog(`Puppeteer 스크래핑 시작: ${authorId}, ${startNum}-${endNum}`);

      // Puppeteer 스크래퍼 생성
      const scraper = createScraper();

      try {
        // 스크래핑 실행 (Generator 방식)
        for await (const result of scraper.scrapeArticles(scrapeConfig)) {
          if (result.type === 'progress') {
            const progressResponse: ProgressResponse = {
              type: 'progress',
              current: result.data.current,
              total: result.data.total,
              url: `${baseUrl}/${result.data.currentArticle}`,
              title: result.data.status,
              timestamp: getCurrentTimestamp(),
            };
            await writer.write(progressResponse);
            devLog(`진행 상황: ${result.data.current}/${result.data.total} - ${result.data.status}`);

          } else if (result.type === 'complete') {
            devLog(`스크래핑 완료: ${result.data.articles.length}개 글 수집`);

            // 텍스트 처리
            const processedText = processArticlesForDownload(
              result.data.articles,
              authorId,
              startNum,
              endNum
            );

            // 파일명 생성
            const filename = generateTextFilename(authorId, startNum, endNum);

            // 완료 응답 전송
            const completeResponse: CompleteResponse = {
              type: 'complete',
              data: {
                content: processedText.content,
                filename,
                metadata: {
                  totalArticles: result.data.summary.total,
                  successCount: result.data.summary.success,
                  skippedCount: result.data.summary.failed,
                  skippedUrls: result.data.summary.errors,
                  generatedAt: getCurrentTimestamp(),
                  authorId,
                  range: `${startNum}-${endNum}`,
                }
              },
              timestamp: getCurrentTimestamp(),
            };

            await writer.write(completeResponse);
            devLog('스크래핑 및 전송 완료');
            break;

          } else if (result.type === 'error') {
            const errorResponse: ErrorResponse = {
              type: 'error',
              error: ERROR_CODES.SCRAPING_ERROR,
              message: result.data.message,
              details: result.data.code,
              timestamp: getCurrentTimestamp(),
            };
            await writer.write(errorResponse);
            break;
          }
        }

      } catch (error) {
        devLog('Puppeteer 스크래핑 중 오류:', error);
        
        const errorResponse: ErrorResponse = {
          type: 'error',
          error: ERROR_CODES.INTERNAL_ERROR,
          message: ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
          details: getErrorMessage(error),
          timestamp: getCurrentTimestamp(),
        };

        await writer.write(errorResponse);
      }
    });

  } catch (error) {
    devLog('API 처리 중 오류:', error);

    const errorResponse: ErrorResponse = {
      type: 'error',
      error: ERROR_CODES.INTERNAL_ERROR,
      message: ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
      details: getErrorMessage(error),
      timestamp: getCurrentTimestamp(),
    };

    return NextResponse.json(errorResponse, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * GET 메서드 핸들러 - Health Check
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'brunch-scraper-api',
    timestamp: getCurrentTimestamp(),
  });
}