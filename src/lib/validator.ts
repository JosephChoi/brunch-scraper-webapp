/**
 * 브런치 텍스트 수집기 - 입력값 검증 로직
 */

import {
  ScrapeRequest,
  ValidationResult,
  FieldError,
} from './types';
import {
  BRUNCH_URL_PATTERN,
  AUTHOR_ID_PATTERN,
  MAX_ARTICLES_LIMIT,
  MIN_ARTICLE_NUMBER,
  MAX_ARTICLE_NUMBER,
  ERROR_CODES,
  ERROR_MESSAGES,
} from './constants';
import {
  extractAuthorId,
  extractArticleNumber,
  isPositiveInteger,
  isNonEmptyString,
} from './utils';

// ===== URL 검증 함수들 =====

/**
 * 브런치 URL이 유효한지 검증합니다.
 * @param url 검증할 URL
 * @returns 검증 결과
 */
export function validateBrunchUrl(url: string): {
  isValid: boolean;
  error?: string;
  authorId?: string;
  articleNumber?: number;
} {
  // 빈 값 체크
  if (!isNonEmptyString(url)) {
    return {
      isValid: false,
      error: '브런치 URL을 입력해주세요.',
    };
  }

  const trimmedUrl = url.trim();

  // URL 형식 검증
  console.log('URL 패턴 테스트:', {
    url: trimmedUrl,
    pattern: BRUNCH_URL_PATTERN.toString(),
    matches: BRUNCH_URL_PATTERN.test(trimmedUrl)
  });
  
  if (!BRUNCH_URL_PATTERN.test(trimmedUrl)) {
    return {
      isValid: false,
      error: '올바른 브런치 URL 형식이 아닙니다.\n예: https://brunch.co.kr/@author/123',
    };
  }

  // 작가 ID 추출 및 검증
  const authorId = extractAuthorId(trimmedUrl);
  if (!authorId) {
    return {
      isValid: false,
      error: '작가 ID를 추출할 수 없습니다.',
    };
  }

  if (!AUTHOR_ID_PATTERN.test(authorId)) {
    return {
      isValid: false,
      error: '작가 ID 형식이 올바르지 않습니다.',
    };
  }

  // 글 번호 추출 및 검증 (선택적)
  const articleNumber = extractArticleNumber(trimmedUrl);
  
  // 글 번호가 있는 경우에만 검증
  if (articleNumber !== null) {
    if (!isPositiveInteger(articleNumber)) {
      return {
        isValid: false,
        error: '글 번호가 올바르지 않습니다.',
      };
    }

    if (articleNumber < MIN_ARTICLE_NUMBER || articleNumber > MAX_ARTICLE_NUMBER) {
      return {
        isValid: false,
        error: `글 번호는 ${MIN_ARTICLE_NUMBER}~${MAX_ARTICLE_NUMBER} 범위여야 합니다.`,
      };
    }
  }

  return {
    isValid: true,
    authorId,
    articleNumber: articleNumber || undefined,
  };
}

/**
 * URL에서 기본 정보를 추출합니다.
 * @param url 브런치 URL
 * @returns 추출된 정보
 */
export function extractUrlInfo(url: string): {
  authorId: string;
  baseUrl: string;
  articleNumber?: number;
} | null {
  const validation = validateBrunchUrl(url);
  
  if (!validation.isValid || !validation.authorId) {
    return null;
  }

  return {
    authorId: validation.authorId,
    baseUrl: `https://brunch.co.kr/@${validation.authorId}`,
    articleNumber: validation.articleNumber,
  };
}

// ===== 범위 검증 함수들 =====

/**
 * 글 번호 범위를 검증합니다.
 * @param startNum 시작 번호
 * @param endNum 종료 번호
 * @returns 검증 결과
 */
export function validateRange(
  startNum: unknown,
  endNum: unknown
): {
  isValid: boolean;
  errors: string[];
  startNum?: number;
  endNum?: number;
} {
  const errors: string[] = [];
  let validStartNum: number | undefined;
  let validEndNum: number | undefined;

  // 시작 번호 검증
  if (!isPositiveInteger(startNum)) {
    errors.push('시작 번호는 1 이상의 정수여야 합니다.');
  } else {
    validStartNum = startNum as number;
    
    if (validStartNum < MIN_ARTICLE_NUMBER) {
      errors.push(`시작 번호는 ${MIN_ARTICLE_NUMBER} 이상이어야 합니다.`);
    } else if (validStartNum > MAX_ARTICLE_NUMBER) {
      errors.push(`시작 번호는 ${MAX_ARTICLE_NUMBER} 이하여야 합니다.`);
    }
  }

  // 종료 번호 검증
  if (!isPositiveInteger(endNum)) {
    errors.push('종료 번호는 1 이상의 정수여야 합니다.');
  } else {
    validEndNum = endNum as number;
    
    if (validEndNum < MIN_ARTICLE_NUMBER) {
      errors.push(`종료 번호는 ${MIN_ARTICLE_NUMBER} 이상이어야 합니다.`);
    } else if (validEndNum > MAX_ARTICLE_NUMBER) {
      errors.push(`종료 번호는 ${MAX_ARTICLE_NUMBER} 이하여야 합니다.`);
    }
  }

  // 범위 관계 검증
  if (validStartNum && validEndNum) {
    if (validEndNum < validStartNum) {
      errors.push('종료 번호는 시작 번호보다 크거나 같아야 합니다.');
    }

    const articleCount = validEndNum - validStartNum + 1;
    if (articleCount > MAX_ARTICLES_LIMIT) {
      errors.push(`한 번에 최대 ${MAX_ARTICLES_LIMIT}개의 글만 수집할 수 있습니다.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    startNum: validStartNum,
    endNum: validEndNum,
  };
}

/**
 * 수집할 글 개수를 계산합니다.
 * @param startNum 시작 번호
 * @param endNum 종료 번호
 * @returns 글 개수
 */
export function calculateArticleCount(startNum: number, endNum: number): number {
  return Math.max(0, endNum - startNum + 1);
}

// ===== 통합 검증 함수 =====

/**
 * 스크래핑 요청 전체를 검증합니다.
 * @param request 스크래핑 요청 데이터
 * @returns 검증 결과
 */
export function validateScrapeRequest(request: ScrapeRequest): ValidationResult {
  const errors: string[] = [];
  const fieldErrors: FieldError[] = [];

  // URL 검증
  const urlValidation = validateBrunchUrl(request.url);
  console.log('URL 검증 결과:', urlValidation);
  
  if (!urlValidation.isValid) {
    errors.push(urlValidation.error || 'URL이 유효하지 않습니다.');
    fieldErrors.push({
      field: 'url',
      message: urlValidation.error || 'URL이 유효하지 않습니다.',
    });
  }

  // 범위 검증
  const rangeValidation = validateRange(request.startNum, request.endNum);
  console.log('범위 검증 결과:', rangeValidation);
  
  if (!rangeValidation.isValid) {
    errors.push(...rangeValidation.errors);
    
    // 시작 번호 에러
    const startNumErrors = rangeValidation.errors.filter(error => 
      error.includes('시작 번호')
    );
    if (startNumErrors.length > 0) {
      fieldErrors.push({
        field: 'startNum',
        message: startNumErrors[0],
      });
    }

    // 종료 번호 에러
    const endNumErrors = rangeValidation.errors.filter(error => 
      error.includes('종료 번호') || error.includes('최대')
    );
    if (endNumErrors.length > 0) {
      fieldErrors.push({
        field: 'endNum',
        message: endNumErrors[0],
      });
    }

    // 범위 관계 에러
    const rangeErrors = rangeValidation.errors.filter(error => 
      !error.includes('시작 번호') && 
      !error.includes('종료 번호') && 
      !error.includes('최대')
    );
    if (rangeErrors.length > 0) {
      fieldErrors.push({
        field: 'endNum',
        message: rangeErrors[0],
      });
    }
  }

  // 성공한 경우 파싱된 데이터 반환
  console.log('최종 검증 상태:', {
    errorsLength: errors.length,
    authorId: urlValidation.authorId,
    urlInfo: extractUrlInfo(request.url),
    rangeStartNum: rangeValidation.startNum,
    rangeEndNum: rangeValidation.endNum
  });
  
  if (errors.length === 0 && urlValidation.authorId) {
    const urlInfo = extractUrlInfo(request.url);
    
    if (urlInfo && rangeValidation.startNum && rangeValidation.endNum) {
      return {
        isValid: true,
        errors: [],
        parsed: {
          authorId: urlInfo.authorId,
          baseUrl: urlInfo.baseUrl,
          startNum: rangeValidation.startNum,
          endNum: rangeValidation.endNum,
        },
      };
    }
  }

  return {
    isValid: false,
    errors,
    fieldErrors,
  };
}

// ===== 보안 검증 함수들 =====

/**
 * XSS 공격을 방지하기 위해 입력값을 정제합니다.
 * @param input 사용자 입력값
 * @returns 정제된 입력값
 */
export function sanitizeInput(input: string): string {
  if (!isNonEmptyString(input)) {
    return '';
  }

  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // script 태그 제거
    .replace(/javascript:/gi, '') // javascript: 프로토콜 제거
    .replace(/on\w+\s*=/gi, '') // 이벤트 핸들러 제거
    .replace(/[<>'"]/g, ''); // 특수 문자 제거
}

/**
 * SQL 인젝션을 방지하기 위해 입력값을 검증합니다.
 * (현재 프로젝트에서는 DB를 사용하지 않지만 확장성을 위해 구현)
 * @param input 사용자 입력값
 * @returns 안전 여부
 */
export function isSafeFromSqlInjection(input: string): boolean {
  if (!isNonEmptyString(input)) {
    return true;
  }

  const sqlKeywords = [
    'select', 'insert', 'update', 'delete', 'drop', 'create',
    'alter', 'exec', 'execute', 'union', 'script', 'expression'
  ];

  const lowercaseInput = input.toLowerCase();
  
  return !sqlKeywords.some(keyword => 
    lowercaseInput.includes(keyword)
  );
}

/**
 * 파일 경로 트래버설 공격을 방지합니다.
 * @param filename 파일명
 * @returns 안전 여부
 */
export function isSafeFilename(filename: string): boolean {
  if (!isNonEmptyString(filename)) {
    return false;
  }

  // 위험한 문자들 검사
  const dangerousPatterns = [
    /\.\./g, // 상위 디렉토리 참조
    /[<>:"/\\|?*]/g, // Windows 예약 문자
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i, // Windows 예약 이름
  ];

  return !dangerousPatterns.some(pattern => pattern.test(filename));
}

// ===== 유틸리티 검증 함수들 =====

/**
 * 이메일 주소가 유효한지 검증합니다.
 * @param email 이메일 주소
 * @returns 유효성 여부
 */
export function isValidEmail(email: string): boolean {
  if (!isNonEmptyString(email)) {
    return false;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email.trim());
}

/**
 * IP 주소가 유효한지 검증합니다.
 * @param ip IP 주소
 * @returns 유효성 여부
 */
export function isValidIpAddress(ip: string): boolean {
  if (!isNonEmptyString(ip)) {
    return false;
  }

  const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

/**
 * 안전한 정수 파싱
 * @param value 파싱할 값
 * @param defaultValue 기본값
 * @returns 파싱된 정수
 */
export function safeParseInt(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = parseInt(value.trim(), 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }

  return defaultValue;
}

/**
 * 안전한 부동소수점 파싱
 * @param value 파싱할 값
 * @param defaultValue 기본값
 * @returns 파싱된 부동소수점
 */
export function safeParseFloat(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value.trim());
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }

  return defaultValue;
}

// ===== 에러 헬퍼 함수들 =====

/**
 * 검증 에러를 사용자 친화적 메시지로 변환합니다.
 * @param errors 에러 목록
 * @returns 사용자 친화적 메시지
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) {
    return '';
  }

  if (errors.length === 1) {
    return errors[0];
  }

  return errors
    .map((error, index) => `${index + 1}. ${error}`)
    .join('\n');
}

/**
 * 필드별 에러를 그룹화합니다.
 * @param fieldErrors 필드 에러 목록
 * @returns 필드별 그룹화된 에러
 */
export function groupFieldErrors(fieldErrors: FieldError[]): Record<string, string[]> {
  return fieldErrors.reduce((acc, error) => {
    if (!acc[error.field]) {
      acc[error.field] = [];
    }
    acc[error.field].push(error.message);
    return acc;
  }, {} as Record<string, string[]>);
}

/**
 * 검증 결과를 HTTP 응답용 형태로 변환합니다.
 * @param validation 검증 결과
 * @returns HTTP 응답 데이터
 */
export function toValidationResponse(validation: ValidationResult) {
  if (validation.isValid) {
    return {
      success: true,
      data: validation.parsed,
    };
  }

  return {
    success: false,
    error: ERROR_CODES.VALIDATION_ERROR,
    message: ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
    details: validation.errors,
    fieldErrors: validation.fieldErrors,
  };
}
