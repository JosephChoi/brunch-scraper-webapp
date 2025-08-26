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

    // HTTP 스크래핑을 위한 네트워크 접근성 확인
    devLog('브런치 사이트 접근성 확인 중...');
    const accessibility = await checkBrunchAccessibility();
    if (!accessibility.accessible) {
      const errorResponse: ErrorResponse = {
        type: 'error',
        error: ERROR_CODES.INTERNAL_ERROR,
        message: '브런치 사이트에 접근할 수 없습니다.',
        details: accessibility.error || '네트워크 연결을 확인해주세요.',
        timestamp: getCurrentTimestamp(),
      };

      return NextResponse.json(errorResponse, {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      });
    }
    devLog('브런치 사이트 접근 가능');



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
        onProgress: async (current: number, total: number, url: string, title?: string) => {
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
              totalArticles: endNum - startNum + 1,
              successCount: scrapeResult.data.length,
              skippedCount: (endNum - startNum + 1) - scrapeResult.data.length,
              skippedUrls: scrapeResult.skippedUrls || [],
              generatedAt: getCurrentTimestamp(),
              authorId,
              range: `${startNum}-${endNum}`,
            }
          },
          timestamp: getCurrentTimestamp(),
        };

        await writer.write(completeResponse);
        devLog('스크래핑 및 전송 완료');

      } catch (error) {
        devLog('스크래핑 중 오류:', error);
        
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