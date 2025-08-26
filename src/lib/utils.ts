/**
 * 브런치 텍스트 수집기 - 유틸리티 함수
 */

import { FileGenerationOptions } from './types';

// ===== 클래스 네임 유틸리티 =====

/**
 * 조건부 클래스명을 병합합니다. (clsx 대체)
 * @param inputs 클래스명 입력값들
 * @returns 병합된 클래스명 문자열
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

// ===== URL 관련 유틸리티 =====

/**
 * 브런치 URL에서 작가 ID를 추출합니다.
 * @param url 브런치 URL
 * @returns 작가 ID 또는 null
 */
export function extractAuthorId(url: string): string | null {
  try {
    const match = url.match(/https:\/\/brunch\.co\.kr\/@([a-zA-Z0-9_-]+)(?:\/\d+)?/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * 브런치 URL에서 글 번호를 추출합니다.
 * @param url 브런치 URL
 * @returns 글 번호 또는 null
 */
export function extractArticleNumber(url: string): number | null {
  try {
    const match = url.match(/https:\/\/brunch\.co\.kr\/@[a-zA-Z0-9_-]+\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}

/**
 * 작가 ID와 글 번호로 브런치 URL을 생성합니다.
 * @param authorId 작가 ID
 * @param articleNum 글 번호
 * @returns 브런치 URL
 */
export function buildBrunchUrl(authorId: string, articleNum: number): string {
  return `https://brunch.co.kr/@${authorId}/${articleNum}`;
}

/**
 * 브런치 URL 패턴이 유효한지 확인합니다.
 * @param url 검증할 URL
 * @returns 유효성 여부
 */
export function isValidBrunchUrl(url: string): boolean {
  const pattern = /^https:\/\/brunch\.co\.kr\/@[a-zA-Z0-9_-]+(?:\/\d+)?$/;
  return pattern.test(url);
}

// ===== 파일 관련 유틸리티 =====

/**
 * 파일명을 생성합니다.
 * @param options 파일 생성 옵션
 * @returns 생성된 파일명
 */
export function generateFilename(options: FileGenerationOptions): string {
  const { authorId, startNum, endNum, date = new Date(), extension = 'txt' } = options;
  
  const formattedDate = formatDateForFilename(date);
  const range = startNum === endNum ? `${startNum}` : `${startNum}-${endNum}`;
  
  return `brunch_${authorId}_${range}_${formattedDate}.${extension}`;
}

/**
 * 파일명에 사용할 날짜 형식으로 변환합니다.
 * @param date 날짜 객체
 * @returns YYYYMMDD 형식의 문자열
 */
export function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}${month}${day}`;
}

/**
 * 파일명에서 특수문자를 제거합니다.
 * @param filename 원본 파일명
 * @returns 정제된 파일명
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // Windows 예약 문자 제거
    .replace(/\s+/g, '_') // 공백을 언더스코어로 변경
    .replace(/_+/g, '_') // 연속된 언더스코어 제거
    .trim();
}

// ===== 텍스트 처리 유틸리티 =====

/**
 * HTML 태그를 제거합니다.
 * @param html HTML 문자열
 * @returns 순수 텍스트
 */
export function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // HTML 태그 제거
    .replace(/&nbsp;/g, ' ') // non-breaking space 변경
    .replace(/&lt;/g, '<') // HTML 엔티티 디코딩
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * 불필요한 공백과 개행을 정리합니다.
 * @param text 원본 텍스트
 * @returns 정리된 텍스트
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Windows 개행 문자 통일
    .replace(/\r/g, '\n') // Mac 개행 문자 통일
    .replace(/ +/g, ' ') // 연속된 공백 제거
    .replace(/\n\s*\n\s*\n/g, '\n\n') // 3개 이상 연속 개행을 2개로 제한
    .trim();
}

/**
 * 여러 글을 하나의 텍스트로 병합합니다.
 * @param articles 글 데이터 배열
 * @returns 병합된 텍스트
 */
export function mergeArticles(articles: Array<{ title: string; content: string }>): string {
  return articles
    .map((article, index) => {
      const title = article.title.trim();
      const content = normalizeWhitespace(stripHtmlTags(article.content));
      
      const separator = index === 0 ? '' : '\n\n---\n\n';
      return `${separator}${title}\n\n${content}`;
    })
    .join('');
}

// ===== 시간 관련 유틸리티 =====

/**
 * 현재 시간을 ISO 8601 형식으로 반환합니다.
 * @returns ISO 8601 형식의 타임스탬프
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * 밀리초를 읽기 쉬운 형식으로 변환합니다.
 * @param ms 밀리초
 * @returns 읽기 쉬운 시간 문자열
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}시간 ${minutes % 60}분 ${seconds % 60}초`;
  } else if (minutes > 0) {
    return `${minutes}분 ${seconds % 60}초`;
  } else {
    return `${seconds}초`;
  }
}

/**
 * 지연 함수 (Promise 기반)
 * @param ms 지연 시간 (밀리초)
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== 숫자 관련 유틸리티 =====

/**
 * 진행률을 계산합니다.
 * @param current 현재 값
 * @param total 전체 값
 * @returns 진행률 (0-100)
 */
export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.max((current / total) * 100, 0), 100);
}

/**
 * 숫자가 유효한 범위 내에 있는지 확인합니다.
 * @param value 검사할 값
 * @param min 최소값
 * @param max 최대값
 * @returns 유효성 여부
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * 양의 정수인지 확인합니다.
 * @param value 검사할 값
 * @returns 양의 정수 여부
 */
export function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && 
         Number.isInteger(value) && 
         value > 0;
}

// ===== 문자열 유틸리티 =====

/**
 * 문자열이 비어있지 않은지 확인합니다.
 * @param str 검사할 문자열
 * @returns 비어있지 않으면 true
 */
export function isNonEmptyString(str: unknown): str is string {
  return typeof str === 'string' && str.trim().length > 0;
}

/**
 * 문자열을 안전하게 자릅니다.
 * @param str 원본 문자열
 * @param maxLength 최대 길이
 * @param suffix 말줄임표 (기본값: '...')
 * @returns 잘린 문자열
 */
export function truncateString(str: string, maxLength: number, suffix = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

// ===== 에러 처리 유틸리티 =====

/**
 * 에러 객체를 안전하게 문자열로 변환합니다.
 * @param error 에러 객체
 * @returns 에러 메시지 문자열
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '알 수 없는 오류가 발생했습니다.';
}

/**
 * 안전한 JSON 파싱
 * @param jsonString JSON 문자열
 * @returns 파싱된 객체 또는 null
 */
export function safeJsonParse<T = unknown>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

// ===== 브라우저 관련 유틸리티 =====

/**
 * 파일 다운로드를 트리거합니다.
 * @param content 파일 내용
 * @param filename 파일명
 * @param mimeType MIME 타입
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType = 'text/plain;charset=utf-8'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 메모리 정리
  URL.revokeObjectURL(url);
}

/**
 * 클립보드에 텍스트를 복사합니다.
 * @param text 복사할 텍스트
 * @returns 성공 여부
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 폴백: execCommand 사용
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch {
    return false;
  }
}

// ===== 디버깅 유틸리티 =====

/**
 * 개발 환경에서만 로그를 출력합니다.
 * @param message 로그 메시지
 * @param data 추가 데이터
 */
export function devLog(message: string, data?: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] ${message}`, data);
  }
}

/**
 * 객체를 읽기 쉬운 형태로 문자열화합니다.
 * @param obj 객체
 * @returns 문자열
 */
export function stringifyObject(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}
