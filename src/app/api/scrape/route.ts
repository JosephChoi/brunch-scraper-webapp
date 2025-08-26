/**
 * 브런치 텍스트 수집기 - 스크래핑 API Route
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
import {
  scrapeMultipleArticles,
  checkBrunchAccessibility,
} from '@/lib/scraper';
import {
  processArticlesForDownload,
  generateTextFilename,
} from '@/lib/textProcessor';
import {
  getCurrentTimestamp,
  getErrorMessage,
  devLog,
} from '@/lib/utils';
import {
  HTTP_STATUS,
  ERROR_CODES,
  ERROR_MESSAGES,
  RATE_LIMIT_PER_MINUTE,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_RETRY_AFTER,
} from '@/lib/constants';

// ===== Rate Limiting 관리 =====

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

// 메모리 기반 Rate Limiting (실제 운영환경에서는 Redis 등 사용 권장)
const rateLimitMap = new Map<string, RateLimitInfo>();

/**
 * Rate Limiting을 확인합니다.
 * @param clientId 클라이언트 식별자 (IP 주소)
 * @returns Rate Limit 상태
 */
function checkRateLimit(clientId: string): {
  allowed: boolean;
  resetTime?: number;
  remainingRequests?: number;
} {
  const now = Date.now();
  const currentInfo = rateLimitMap.get(clientId);

  // 기존 정보가 없거나 윈도우가 만료된 경우
  if (!currentInfo || now > currentInfo.resetTime) {
    const newInfo: RateLimitInfo = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
    rateLimitMap.set(clientId, newInfo);
    
    return {
      allowed: true,
      remainingRequests: RATE_LIMIT_PER_MINUTE - 1,
    };
  }

  // 제한 확인
  if (currentInfo.count >= RATE_LIMIT_PER_MINUTE) {
    return {
      allowed: false,
      resetTime: currentInfo.resetTime,
    };
  }

  // 카운트 증가
  currentInfo.count++;
  rateLimitMap.set(clientId, currentInfo);

  return {
    allowed: true,
    remainingRequests: RATE_LIMIT_PER_MINUTE - currentInfo.count,
  };
}

/**
 * 클라이언트 IP 주소를 추출합니다.
 * @param request Next.js Request 객체
 * @returns IP 주소
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
      const writer = controller;
      
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
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// ===== API Route 핸들러들 =====

/**
 * POST /api/scrape
 * 브런치 글 스크래핑을 수행합니다.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    devLog('스크래핑 요청 받음');

    // Rate Limiting 확인
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP);

    if (!rateLimitResult.allowed) {
      const errorResponse: ErrorResponse = {
        type: 'error',
        error: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT_EXCEEDED],
        retryAfter: RATE_LIMIT_RETRY_AFTER,
        timestamp: getCurrentTimestamp(),
      };

      return NextResponse.json(errorResponse, {
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        headers: {
          'Retry-After': RATE_LIMIT_RETRY_AFTER.toString(),
          'X-RateLimit-Limit': RATE_LIMIT_PER_MINUTE.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
        },
      });
    }

    // 요청 본문 파싱
    let requestBody: ScrapeRequest;
    try {
      requestBody = await request.json();
    } catch (error) {
      const errorResponse: ErrorResponse = {
        type: 'error',
        error: ERROR_CODES.VALIDATION_ERROR,
        message: '잘못된 JSON 형식입니다.',
        details: getErrorMessage(error),
        timestamp: getCurrentTimestamp(),
      };

      return NextResponse.json(errorResponse, {
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // 입력값 검증
    devLog('요청 본문:', JSON.stringify(requestBody, null, 2));
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

    // 브런치 접근 가능성 사전 확인
    devLog('브런치 접근성 확인 중...');
    const accessibilityCheck = await checkBrunchAccessibility();
    if (!accessibilityCheck.accessible) {
      const errorResponse: ErrorResponse = {
        type: 'error',
        error: ERROR_CODES.NETWORK_ERROR,
        message: '브런치 사이트에 접근할 수 없습니다.',
        details: accessibilityCheck.error,
        timestamp: getCurrentTimestamp(),
      };

      return NextResponse.json(errorResponse, {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      });
    }

    // 스트리밍 응답 시작
    return createStreamingResponse(async (writer) => {
      const totalArticles = endNum - startNum + 1;
      let processedCount = 0;

      // 스크래핑 설정
      const scrapeConfig: ScrapeConfig = {
        baseUrl,
        authorId,
        startNum,
        endNum,
        onProgress: async (current: number, total: number, url: string, title?: string) => {
          processedCount = current;
          
          const progressResponse: ProgressResponse = {
            type: 'progress',
            current,
            total,
            url,
            title,
            timestamp: getCurrentTimestamp(),
          };

          await writer.write(progressResponse);
          devLog(`진행 상황: ${current}/${total} - ${url}`);
        },
      };

      try {
        devLog(`스크래핑 시작: ${authorId}, ${startNum}-${endNum}`);

        // 스크래핑 실행
        const scrapeResult = await scrapeMultipleArticles(scrapeConfig);

        if (!scrapeResult.success) {
          const errorResponse: ErrorResponse = {
            type: 'error',
            error: ERROR_CODES.SCRAPING_ERROR,
            message: ERROR_MESSAGES[ERROR_CODES.SCRAPING_ERROR],
            details: scrapeResult.error,
            timestamp: getCurrentTimestamp(),
          };

          await writer.write(errorResponse);
          return;
        }

        if (!scrapeResult.data || scrapeResult.data.length === 0) {
          const errorResponse: ErrorResponse = {
            type: 'error',
            error: ERROR_CODES.PROCESSING_ERROR,
            message: '수집된 데이터가 없습니다.',
            timestamp: getCurrentTimestamp(),
          };

          await writer.write(errorResponse);
          return;
        }

        devLog(`스크래핑 완료: ${scrapeResult.data.length}개 글 수집`);

        // 텍스트 처리
        const processedText = processArticlesForDownload(
          scrapeResult.data,
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
              totalArticles: scrapeResult.data.length,
              successCount: processedText.metadata.successCount,
              skippedCount: processedText.metadata.skippedCount,
              skippedUrls: scrapeResult.skippedUrls || [],
              generatedAt: processedText.metadata.generatedAt.toISOString(),
              authorId,
              range: startNum === endNum ? `${startNum}` : `${startNum}-${endNum}`,
            },
          },
          timestamp: getCurrentTimestamp(),
        };

        await writer.write(completeResponse);
        devLog('스크래핑 완료 응답 전송');

      } catch (error) {
        devLog('스크래핑 중 예외 발생:', error);

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
    devLog('API Route 처리 중 예외:', error);

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
 * OPTIONS /api/scrape
 * CORS preflight 요청 처리
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24시간
    },
  });
}

/**
 * GET /api/scrape
 * API 상태 확인 (헬스체크)
 */
export async function GET(): Promise<NextResponse> {
  try {
    // 브런치 접근성 확인
    const accessibilityCheck = await checkBrunchAccessibility();
    
    const status = {
      service: 'Brunch Text Scraper API',
      version: '1.0.0',
      status: 'healthy',
      timestamp: getCurrentTimestamp(),
      brunchAccessible: accessibilityCheck.accessible,
      brunchResponseTime: accessibilityCheck.responseTime,
    };

    if (!accessibilityCheck.accessible) {
      status.status = 'degraded';
    }

    return NextResponse.json(status, {
      status: HTTP_STATUS.OK,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    const errorStatus = {
      service: 'Brunch Text Scraper API',
      version: '1.0.0',
      status: 'error',
      timestamp: getCurrentTimestamp(),
      error: getErrorMessage(error),
    };

    return NextResponse.json(errorStatus, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

// ===== 정리 작업 =====

// 주기적으로 만료된 Rate Limit 데이터 정리
setInterval(() => {
  const now = Date.now();
  for (const [clientId, info] of rateLimitMap.entries()) {
    if (now > info.resetTime) {
      rateLimitMap.delete(clientId);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

devLog('스크래핑 API Route 초기화 완료');
