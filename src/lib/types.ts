/**
 * 브런치 텍스트 수집기 - TypeScript 타입 정의
 */

// ===== 기본 타입 정의 =====

/**
 * 스크래핑 요청 인터페이스
 */
export interface ScrapeRequest {
  /** 브런치 글 URL */
  url: string;
  /** 시작 글 번호 (1 이상) */
  startNum: number;
  /** 종료 글 번호 (startNum 이상) */
  endNum: number;
  /** HTML 형식 보존 여부 (기본값: false) */
  preserveFormatting?: boolean;
}

/**
 * 스크래핑 설정 인터페이스
 */
export interface ScrapeConfig {
  /** 브런치 블로그 기본 URL */
  baseUrl: string;
  /** 작가 ID */
  authorId: string;
  /** 시작 글 번호 */
  startNum: number;
  /** 종료 글 번호 */
  endNum: number;
  /** Puppeteer용 시작 글 번호 */
  startNumber: number;
  /** Puppeteer용 종료 글 번호 */
  endNumber: number;
  /** HTML 형식 보존 여부 (기본값: false) */
  preserveFormatting?: boolean;
  /** 진행 상황 콜백 함수 */
  onProgress?: (current: number, total: number, url: string, title?: string) => void;
}

/**
 * 개별 글 데이터 인터페이스
 */
export interface ArticleData {
  /** 글 제목 */
  title: string;
  /** 글 본문 내용 */
  content: string;
  /** 글 URL */
  url: string;
  /** 글 번호 */
  number: number;
  /** 수집 성공 여부 */
  success: boolean;
  /** 글 작성일 (선택적) */
  publishedDate?: string;
}

/**
 * 스크래핑 결과 인터페이스
 */
export interface ScrapeResult {
  /** 전체 성공 여부 */
  success: boolean;
  /** 수집된 글 데이터 배열 */
  data?: ArticleData[];
  /** 에러 메시지 */
  error?: string;
  /** 건너뛴 URL 목록 */
  skippedUrls?: string[];
  /** 총 처리 시간 (밀리초) */
  processingTime?: number;
}

/**
 * Puppeteer 스크래핑 결과 타입 (Generator용)
 */
export type PuppeteerScrapeResult = 
  | {
      type: 'progress';
      data: {
        current: number;
        total: number;
        percentage: number;
        currentArticle: number;
        status: string;
      };
    }
  | {
      type: 'complete';
      data: {
        articles: ArticleData[];
        summary: {
          total: number;
          success: number;
          failed: number;
          errors: string[];
        };
      };
    }
  | {
      type: 'error';
      data: {
        message: string;
        code: string;
      };
    };

// ===== API 응답 타입 =====

/**
 * 진행 상황 응답 인터페이스
 */
export interface ProgressResponse {
  type: 'progress';
  /** 현재 처리 중인 글 번호 */
  current: number;
  /** 전체 처리할 글 개수 */
  total: number;
  /** 현재 처리 중인 URL */
  url: string;
  /** 현재 글 제목 (추출 성공 시) */
  title?: string;
  /** ISO 8601 형식의 타임스탬프 */
  timestamp: string;
}

/**
 * 완료 응답 인터페이스
 */
export interface CompleteResponse {
  type: 'complete';
  data: {
    /** 통합된 텍스트 내용 */
    content: string;
    /** 제안 파일명 */
    filename: string;
    /** 메타데이터 */
    metadata: {
      /** 총 글 개수 */
      totalArticles: number;
      /** 성공적으로 수집된 글 개수 */
      successCount: number;
      /** 건너뛴 글 개수 */
      skippedCount: number;
      /** 건너뛴 URL 목록 */
      skippedUrls: string[];
      /** 생성 시간 (ISO 8601) */
      generatedAt: string;
      /** 작가 ID */
      authorId: string;
      /** 수집 범위 (예: "1-10") */
      range: string;
    };
  };
  /** ISO 8601 형식의 타임스탬프 */
  timestamp: string;
}

/**
 * 에러 응답 인터페이스
 */
export interface ErrorResponse {
  type: 'error';
  /** 오류 코드 */
  error: string;
  /** 사용자 친화적 오류 메시지 */
  message: string;
  /** 상세 오류 정보 */
  details?: string | string[];
  /** 재시도까지 대기 시간 (초) */
  retryAfter?: number;
  /** ISO 8601 형식의 타임스탬프 */
  timestamp: string;
}

/**
 * 스트리밍 응답 유니온 타입
 */
export type StreamResponse = ProgressResponse | CompleteResponse | ErrorResponse;

// ===== 검증 관련 타입 =====

/**
 * 검증 결과 인터페이스
 */
export interface ValidationResult {
  /** 검증 성공 여부 */
  isValid: boolean;
  /** 에러 메시지 목록 */
  errors: string[];
  /** 필드별 에러 목록 */
  fieldErrors?: FieldError[];
  /** 파싱된 데이터 (검증 성공 시) */
  parsed?: {
    /** 작가 ID */
    authorId: string;
    /** 기본 URL */
    baseUrl: string;
    /** 시작 번호 */
    startNum: number;
    /** 종료 번호 */
    endNum: number;
  };
}

/**
 * 입력 필드 검증 에러 타입
 */
export interface FieldError {
  /** 필드명 */
  field: string;
  /** 에러 메시지 */
  message: string;
}

// ===== 텍스트 처리 관련 타입 =====

/**
 * 처리된 텍스트 인터페이스
 */
export interface ProcessedText {
  /** 처리된 텍스트 내용 */
  content: string;
  /** 메타데이터 */
  metadata: {
    /** 총 글 개수 */
    totalArticles: number;
    /** 성공 개수 */
    successCount: number;
    /** 건너뛴 개수 */
    skippedCount: number;
    /** 생성 시간 */
    generatedAt: Date;
    /** 처리 시간 (밀리초) */
    processingTime: number;
  };
}

/**
 * 파일 생성 옵션 인터페이스
 */
export interface FileGenerationOptions {
  /** 작가 ID */
  authorId: string;
  /** 시작 번호 */
  startNum: number;
  /** 종료 번호 */
  endNum: number;
  /** 생성 날짜 */
  date?: Date;
  /** 파일 확장자 */
  extension?: string;
}

// ===== UI 상태 관련 타입 =====

/**
 * 스크래핑 상태 타입
 */
export type ScrapeStatus = 'idle' | 'validating' | 'scraping' | 'processing' | 'complete' | 'error';

/**
 * 스크래핑 상태 인터페이스
 */
export interface ScrapeState {
  /** 현재 상태 */
  status: ScrapeStatus;
  /** 진행률 (0-100) */
  progress: number;
  /** 현재 처리 중인 항목 */
  current: number;
  /** 전체 항목 개수 */
  total: number;
  /** 현재 URL */
  currentUrl?: string;
  /** 현재 제목 */
  currentTitle?: string;
  /** 최종 결과 */
  result?: CompleteResponse['data'];
  /** 에러 정보 */
  error?: string;
  /** 에러 상세 정보 */
  errorDetails?: string | string[];
}

// ===== 이벤트 관련 타입 =====

/**
 * EventSource 연결 상태 타입
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * EventSource 상태 인터페이스
 */
export interface EventSourceState {
  /** 연결 상태 */
  status: ConnectionStatus;
  /** 에러 메시지 */
  error?: string;
  /** 재연결 시도 횟수 */
  retryCount: number;
}

// ===== 에러 코드 타입 =====

/**
 * 클라이언트 에러 코드
 */
export type ClientErrorCode = 
  | 'VALIDATION_ERROR'
  | 'INVALID_URL'
  | 'INVALID_RANGE'
  | 'RATE_LIMIT_EXCEEDED';

/**
 * 서버 에러 코드
 */
export type ServerErrorCode = 
  | 'SCRAPING_ERROR'
  | 'NETWORK_ERROR'
  | 'PROCESSING_ERROR'
  | 'INTERNAL_ERROR';

/**
 * 전체 에러 코드 타입
 */
export type ErrorCode = ClientErrorCode | ServerErrorCode;

// ===== 설정 관련 타입 =====

/**
 * 스크래핑 설정 인터페이스
 */
export interface ScrapingSettings {
  /** 요청 간격 (밀리초) */
  requestDelay: number;
  /** 타임아웃 (밀리초) */
  timeout: number;
  /** 최대 재시도 횟수 */
  maxRetries: number;
  /** User-Agent 문자열 */
  userAgent: string;
  /** 요청 간격 (백워드 호환) */
  delayBetweenRequests: number;
  /** 페이지 대기 시간 */
  waitTimeout: number;
  /** 헤드리스 모드 */
  headless: boolean;
}

/**
 * 기본 스크래핑 설정
 */
export const DEFAULT_SCRAPING_SETTINGS: ScrapingSettings = {
  requestDelay: 2500, // 2.5초
  timeout: 30000, // 30초
  maxRetries: 3,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  delayBetweenRequests: 2500,
  waitTimeout: 10000,
  headless: true,
};

// ===== 유틸리티 타입 =====

/**
 * 부분적으로 선택적인 타입 생성
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 필수 필드만 남기는 타입
 */
export type RequiredOnly<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

/**
 * API 응답 래퍼 타입
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// ===== 프론트엔드 상태 관리 타입들 =====

/**
 * 스크래핑 상태 타입
 */
export type ScrapingState = 'idle' | 'running' | 'completed' | 'error';

/**
 * 스크래핑 진행 상황 인터페이스
 */
export interface ScrapingProgress {
  /** 현재 진행된 글 수 */
  current: number;
  /** 전체 글 수 */
  total: number;
  /** 진행률 (0-100) */
  percentage: number;
  /** 현재 처리 중인 URL */
  currentUrl?: string;
  /** 현재 처리 중인 글 제목 */
  currentTitle?: string;
}

/**
 * 스크래핑 결과 인터페이스
 */
export interface ScrapingResult {
  /** 텍스트 내용 */
  content: string;
  /** 파일명 */
  filename: string;
  /** 메타데이터 */
  metadata: {
    /** 전체 글 수 */
    totalArticles: number;
    /** 성공한 글 수 */
    successCount: number;
    /** 실패한 글 수 */
    skippedCount: number;
    /** 실패한 URL 목록 */
    skippedUrls: string[];
    /** 생성 시간 */
    generatedAt: string;
    /** 작가 ID */
    authorId: string;
    /** 범위 */
    range: string;
  };
}
