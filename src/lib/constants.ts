/**
 * 브런치 텍스트 수집기 - 상수 정의
 */

// ===== URL 관련 상수 =====

/**
 * 브런치 기본 도메인
 */
export const BRUNCH_DOMAIN = 'brunch.co.kr';

/**
 * 브런치 기본 URL
 */
export const BRUNCH_BASE_URL = 'https://brunch.co.kr';

/**
 * 브런치 URL 정규식 패턴 (숫자 부분 선택적)
 */
export const BRUNCH_URL_PATTERN = /^https:\/\/brunch\.co\.kr\/@[a-zA-Z0-9_-]+(?:\/\d+)?$/;

/**
 * 작가 ID 정규식 패턴
 */
export const AUTHOR_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

// ===== 제한값 상수 =====

/**
 * 최대 수집 가능한 글 개수
 */
export const MAX_ARTICLES_LIMIT = 50;

/**
 * 최소 글 번호
 */
export const MIN_ARTICLE_NUMBER = 1;

/**
 * 최대 글 번호 (이론적 제한)
 */
export const MAX_ARTICLE_NUMBER = 999999;

/**
 * 요청 간격 (밀리초) - 브런치 서버 부하 최소화
 */
export const REQUEST_DELAY_MS = 2500;

/**
 * 요청 타임아웃 (밀리초)
 */
export const REQUEST_TIMEOUT_MS = 30000;

/**
 * 최대 재시도 횟수
 */
export const MAX_RETRY_COUNT = 3;

// ===== Rate Limiting 상수 =====

/**
 * 분당 최대 요청 수
 */
export const RATE_LIMIT_PER_MINUTE = 3;

/**
 * Rate Limit 윈도우 크기 (밀리초)
 */
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1분

/**
 * Rate Limit 초과 시 대기 시간 (초)
 */
export const RATE_LIMIT_RETRY_AFTER = 60;

// ===== HTTP 상태 코드 =====

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// ===== 에러 코드 상수 =====

export const ERROR_CODES = {
  // 클라이언트 에러
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_URL: 'INVALID_URL',
  INVALID_RANGE: 'INVALID_RANGE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // 서버 에러
  SCRAPING_ERROR: 'SCRAPING_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// ===== 에러 메시지 상수 =====

export const ERROR_MESSAGES = {
  [ERROR_CODES.VALIDATION_ERROR]: '입력값이 올바르지 않습니다.',
  [ERROR_CODES.INVALID_URL]: '올바른 브런치 URL을 입력해주세요.',
  [ERROR_CODES.INVALID_RANGE]: '글 번호 범위가 올바르지 않습니다.',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  [ERROR_CODES.SCRAPING_ERROR]: '글 수집 중 오류가 발생했습니다.',
  [ERROR_CODES.NETWORK_ERROR]: '네트워크 오류가 발생했습니다.',
  [ERROR_CODES.PROCESSING_ERROR]: '텍스트 처리 중 오류가 발생했습니다.',
  [ERROR_CODES.INTERNAL_ERROR]: '서버 내부 오류가 발생했습니다.',
} as const;

// ===== 파일 관련 상수 =====

/**
 * 기본 파일 확장자
 */
export const DEFAULT_FILE_EXTENSION = 'txt';

/**
 * 지원하는 파일 확장자
 */
export const SUPPORTED_FILE_EXTENSIONS = ['txt', 'md'] as const;

/**
 * 파일 MIME 타입
 */
export const FILE_MIME_TYPES = {
  txt: 'text/plain;charset=utf-8',
  md: 'text/markdown;charset=utf-8',
} as const;

/**
 * 최대 파일 크기 (바이트) - 10MB
 */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// ===== UI 관련 상수 =====

/**
 * 스크래핑 상태
 */
export const SCRAPE_STATUS = {
  IDLE: 'idle',
  VALIDATING: 'validating',
  SCRAPING: 'scraping',
  PROCESSING: 'processing',
  COMPLETE: 'complete',
  ERROR: 'error',
} as const;

/**
 * EventSource 연결 상태
 */
export const CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
} as const;

/**
 * 진행률 업데이트 간격 (밀리초)
 */
export const PROGRESS_UPDATE_INTERVAL = 100;

// ===== 브라우저 설정 상수 =====

/**
 * 기본 User-Agent
 */
export const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * 추가 HTTP 헤더
 */
export const DEFAULT_HEADERS = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
} as const;

// ===== 스크래핑 설정 상수 =====

/**
 * CSS 셀렉터
 */
export const CSS_SELECTORS = {
  TITLE: 'h1.cover_title',
  CONTENT: '.wrap_body',
  ARTICLE_BODY: 'div.wrap_body',
  COVER_IMAGE: '.cover_image',
  DATE: '.cover_info .f_l, .cover_info .date, time, .byline time, .article-meta time, [class*="date"], [class*="time"]',
} as const;

/**
 * 페이지 로딩 대기 시간 (밀리초)
 */
export const PAGE_LOAD_TIMEOUT = 10000;

/**
 * 네트워크 대기 시간 (밀리초)
 */
export const NETWORK_IDLE_TIMEOUT = 2000;

// ===== 스크래핑 설정 객체 =====

/**
 * 기본 스크래핑 설정
 */
export const SCRAPING_SETTINGS = {
  requestDelay: REQUEST_DELAY_MS,
  timeout: REQUEST_TIMEOUT_MS,
  maxRetries: MAX_RETRY_COUNT,
  userAgent: DEFAULT_USER_AGENT,
  delayBetweenRequests: REQUEST_DELAY_MS,
  waitTimeout: PAGE_LOAD_TIMEOUT,
  headless: true,
} as const;

/**
 * 네트워크 설정
 */
export const NETWORK_SETTINGS = {
  BROWSER_TIMEOUT: 60000,
  PAGE_TIMEOUT: 30000,
  NAVIGATION_TIMEOUT: 30000,
} as const;

// ===== API 관련 상수 =====

/**
 * API 엔드포인트
 */
export const API_ENDPOINTS = {
  SCRAPE: '/api/scrape',
} as const;

/**
 * Server-Sent Events 설정
 */
export const SSE_CONFIG = {
  RETRY_DELAY: 1000, // 재연결 대기 시간 (밀리초)
  MAX_RETRIES: 5, // 최대 재연결 시도 횟수
  TIMEOUT: 300000, // 5분 타임아웃
} as const;

// ===== 메타데이터 상수 =====

/**
 * 애플리케이션 정보
 */
export const APP_INFO = {
  NAME: '브런치 텍스트 수집기',
  VERSION: '1.0.0',
  DESCRIPTION: '브런치 블로그에서 연속된 글들을 자동으로 수집하여 텍스트 파일로 제공하는 웹 애플리케이션',
  AUTHOR: 'Joseph',
  REPOSITORY: 'https://github.com/user/brunch-scraper-webapp',
} as const;

/**
 * 기본 메타데이터
 */
export const DEFAULT_METADATA = {
  GENERATED_BY: APP_INFO.NAME,
  VERSION: APP_INFO.VERSION,
  WEBSITE: 'https://your-domain.vercel.app',
} as const;

// ===== 텍스트 처리 상수 =====

/**
 * 글 구분자
 */
export const ARTICLE_SEPARATOR = '\n\n---\n\n';

/**
 * 제목과 본문 사이 구분자
 */
export const TITLE_CONTENT_SEPARATOR = '\n\n';

/**
 * 최대 제목 길이
 */
export const MAX_TITLE_LENGTH = 200;

/**
 * 최대 본문 길이 (단일 글)
 */
export const MAX_CONTENT_LENGTH_PER_ARTICLE = 100000; // 100KB

// ===== 색상 상수 (Tailwind CSS 클래스) =====

export const COLORS = {
  PRIMARY: 'text-primary-500',
  SUCCESS: 'text-green-500',
  ERROR: 'text-red-500',
  WARNING: 'text-yellow-500',
  INFO: 'text-blue-500',
  GRAY: 'text-gray-500',
} as const;

export const BG_COLORS = {
  PRIMARY: 'bg-primary-500',
  SUCCESS: 'bg-green-500',
  ERROR: 'bg-red-500',
  WARNING: 'bg-yellow-500',
  INFO: 'bg-blue-500',
  GRAY: 'bg-gray-500',
} as const;

// ===== 환경 변수 키 =====

export const ENV_KEYS = {
  NODE_ENV: 'NODE_ENV',
  VERCEL_URL: 'VERCEL_URL',
  NEXT_PUBLIC_APP_URL: 'NEXT_PUBLIC_APP_URL',
} as const;

// ===== 로컬 스토리지 키 =====

export const STORAGE_KEYS = {
  RECENT_URLS: 'brunch_scraper_recent_urls',
  USER_PREFERENCES: 'brunch_scraper_preferences',
  DOWNLOAD_HISTORY: 'brunch_scraper_download_history',
} as const;
