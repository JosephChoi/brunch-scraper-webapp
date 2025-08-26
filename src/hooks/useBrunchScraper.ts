/**
 * 브런치 스크래핑 커스텀 훅
 */

import { useState, useCallback, useRef } from 'react';
import {
  ScrapeRequest,
  StreamResponse,
  ScrapingState,
  ScrapingProgress,
  ScrapingResult,
} from '@/lib/types';
import { devLog, getErrorMessage } from '@/lib/utils';

export interface UseBrunchScraperOptions {
  onProgress?: (progress: ScrapingProgress) => void;
  onComplete?: (result: ScrapingResult) => void;
  onError?: (error: string) => void;
}

export interface UseBrunchScraperReturn {
  // 상태
  state: ScrapingState;
  progress: ScrapingProgress | null;
  result: ScrapingResult | null;
  error: string | null;
  isLoading: boolean;
  
  // 액션
  startScraping: (request: ScrapeRequest) => Promise<void>;
  cancelScraping: () => void;
  resetState: () => void;
}

/**
 * 브런치 스크래핑을 위한 커스텀 훅
 */
export function useBrunchScraper(options: UseBrunchScraperOptions = {}): UseBrunchScraperReturn {
  const { onProgress, onComplete, onError } = options;

  // 상태 관리
  const [state, setState] = useState<ScrapingState>('idle');
  const [progress, setProgress] = useState<ScrapingProgress | null>(null);
  const [result, setResult] = useState<ScrapingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AbortController 참조
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 상태 초기화
   */
  const resetState = useCallback(() => {
    setState('idle');
    setProgress(null);
    setResult(null);
    setError(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * 스크래핑 취소
   */
  const cancelScraping = useCallback(() => {
    if (abortControllerRef.current) {
      devLog('스크래핑 취소');
      abortControllerRef.current.abort();
      setState('idle');
    }
  }, []);

  /**
   * 스트리밍 응답 처리
   */
  const processStreamResponse = useCallback(
    (response: StreamResponse) => {
      switch (response.type) {
        case 'progress':
          const progressData: ScrapingProgress = {
            current: response.current,
            total: response.total,
            percentage: Math.round((response.current / response.total) * 100),
            currentUrl: response.url,
            currentTitle: response.title,
          };
          
          setProgress(progressData);
          onProgress?.(progressData);
          break;

        case 'complete':
          const resultData: ScrapingResult = {
            content: response.data.content,
            filename: response.data.filename,
            metadata: response.data.metadata,
          };
          
          setResult(resultData);
          setState('completed');
          onComplete?.(resultData);
          devLog('스크래핑 완료:', resultData.metadata);
          break;

        case 'error':
          const errorMessage = response.message || '알 수 없는 오류가 발생했습니다.';
          setError(errorMessage);
          setState('error');
          onError?.(errorMessage);
          devLog('스크래핑 오류:', errorMessage);
          break;

        default:
          devLog('알 수 없는 응답 타입:', response);
      }
    },
    [onProgress, onComplete, onError]
  );

  /**
   * 스트리밍 응답 파싱
   */
  const parseStreamChunk = useCallback(
    (chunk: string): StreamResponse[] => {
      const lines = chunk.split('\n').filter(line => line.trim());
      const responses: StreamResponse[] = [];

      for (const line of lines) {
        try {
          const response = JSON.parse(line) as StreamResponse;
          responses.push(response);
        } catch (error) {
          devLog(`JSON 파싱 오류: ${getErrorMessage(error)} 원본: ${line}`);
        }
      }

      return responses;
    },
    []
  );

  /**
   * 스크래핑 시작
   */
  const startScraping = useCallback(
    async (request: ScrapeRequest): Promise<void> => {
      try {
        devLog('스크래핑 시작:', request);
        devLog('전송할 데이터:', JSON.stringify(request, null, 2));
        
        // 클라이언트 측에서도 URL 검증 테스트
        console.log('=== 클라이언트 측 URL 검증 테스트 ===');
        const urlPattern = /^https:\/\/brunch\.co\.kr\/@[a-zA-Z0-9_-]+(?:\/\d+)?$/;
        console.log('URL:', request.url);
        console.log('패턴 매치:', urlPattern.test(request.url));
        console.log('작가 ID 추출 테스트:', request.url.match(/@([a-zA-Z0-9_-]+)/)?.[1]);

        // 상태 초기화
        resetState();
        setState('running');

        // AbortController 생성
        abortControllerRef.current = new AbortController();

        // API 요청
        const response = await fetch('/api/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: abortControllerRef.current.signal,
        });

        // HTTP 오류 처리
        if (!response.ok) {
          devLog(`HTTP 오류 발생: ${response.status} ${response.statusText}`);
          
          if (response.status === 429) {
            throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
          }
          
          // JSON 에러 응답 시도
          try {
            const errorData = await response.json();
            devLog('서버 에러 응답:', errorData);
            console.log('=== 서버 에러 상세 정보 ===');
            console.log('에러 코드:', errorData.error);
            console.log('에러 메시지:', errorData.message);
            console.log('상세 내용:', errorData.details);
            console.log('필드 에러:', errorData.fieldErrors);
            
            if (errorData.fieldErrors && errorData.fieldErrors.length > 0) {
              console.log('=== 필드별 에러 분석 ===');
              errorData.fieldErrors.forEach((fieldError: any, index: number) => {
                console.log(`${index + 1}. 필드: ${fieldError.field}, 메시지: ${fieldError.message}`);
              });
            }
            
            throw new Error(errorData.message || `HTTP ${response.status} 오류`);
          } catch (parseError) {
            devLog('에러 응답 파싱 실패:', parseError);
            throw new Error(`HTTP ${response.status} 오류가 발생했습니다.`);
          }
        }

        // 스트리밍 응답이 아닌 경우 처리
        if (!response.body) {
          throw new Error('스트리밍 응답을 받을 수 없습니다.');
        }

        // 스트리밍 읽기
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // 남은 버퍼 처리
              if (buffer.trim()) {
                const responses = parseStreamChunk(buffer);
                responses.forEach(processStreamResponse);
              }
              break;
            }

            // 청크 디코딩 및 버퍼링
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // 완전한 줄들 처리
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 마지막 불완전한 줄은 버퍼에 유지

            if (lines.length > 0) {
              const completeData = lines.join('\n');
              const responses = parseStreamChunk(completeData);
              responses.forEach(processStreamResponse);
            }
          }
        } finally {
          reader.releaseLock();
        }

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          devLog('스크래핑이 취소되었습니다.');
          setState('idle');
          return;
        }

        const errorMessage = getErrorMessage(error);
        setError(errorMessage);
        setState('error');
        onError?.(errorMessage);
        devLog('스크래핑 오류:', errorMessage);
      } finally {
        abortControllerRef.current = null;
      }
    },
    [resetState, parseStreamChunk, processStreamResponse, onError]
  );

  // 계산된 값들
  const isLoading = state === 'running';

  return {
    // 상태
    state,
    progress,
    result,
    error,
    isLoading,
    
    // 액션
    startScraping,
    cancelScraping,
    resetState,
  };
}
