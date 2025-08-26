/**
 * 검증 함수 테스트
 * 
 * 실제 테스트 프레임워크 설치 전까지는 주석 처리된 상태로 두고,
 * 나중에 Jest나 Vitest 설치 후 활성화할 예정입니다.
 */

/* 
import {
  validateBrunchUrl,
  validateRange,
  validateScrapeRequest,
  sanitizeInput,
  isSafeFromSqlInjection,
  isSafeFilename,
  extractUrlInfo,
  calculateArticleCount,
} from '../validator';

// ===== URL 검증 테스트 =====

describe('validateBrunchUrl', () => {
  test('유효한 브런치 URL을 올바르게 검증한다', () => {
    const validUrls = [
      'https://brunch.co.kr/@author123/456',
      'https://brunch.co.kr/@test-user/1',
      'https://brunch.co.kr/@user_name/999999',
    ];

    validUrls.forEach(url => {
      const result = validateBrunchUrl(url);
      expect(result.isValid).toBe(true);
      expect(result.authorId).toBeDefined();
      expect(result.articleNumber).toBeDefined();
    });
  });

  test('잘못된 브런치 URL을 거부한다', () => {
    const invalidUrls = [
      '',
      'not-a-url',
      'https://naver.com',
      'https://brunch.co.kr/invalid',
      'https://brunch.co.kr/@author',
      'https://brunch.co.kr/@/123',
      'https://brunch.co.kr/@author/abc',
      'https://brunch.co.kr/@author/-1',
    ];

    invalidUrls.forEach(url => {
      const result = validateBrunchUrl(url);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

// ===== 범위 검증 테스트 =====

describe('validateRange', () => {
  test('유효한 범위를 올바르게 검증한다', () => {
    const validRanges = [
      [1, 10],
      [5, 5],
      [100, 200],
    ];

    validRanges.forEach(([start, end]) => {
      const result = validateRange(start, end);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.startNum).toBe(start);
      expect(result.endNum).toBe(end);
    });
  });

  test('잘못된 범위를 거부한다', () => {
    const invalidRanges = [
      [0, 10], // 시작 번호 0
      [-1, 10], // 음수 시작
      [10, 5], // 종료 < 시작
      [1, 101], // 너무 많은 글
      ['abc', 10], // 문자열
      [1, 'def'], // 문자열
    ];

    invalidRanges.forEach(([start, end]) => {
      const result = validateRange(start, end);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

// ===== 통합 검증 테스트 =====

describe('validateScrapeRequest', () => {
  test('유효한 요청을 올바르게 검증한다', () => {
    const validRequest = {
      url: 'https://brunch.co.kr/@testuser/123',
      startNum: 1,
      endNum: 10,
    };

    const result = validateScrapeRequest(validRequest);
    expect(result.isValid).toBe(true);
    expect(result.parsed).toBeDefined();
    expect(result.parsed?.authorId).toBe('testuser');
  });

  test('잘못된 요청을 거부한다', () => {
    const invalidRequest = {
      url: 'invalid-url',
      startNum: -1,
      endNum: 200,
    };

    const result = validateScrapeRequest(invalidRequest);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ===== 보안 검증 테스트 =====

describe('sanitizeInput', () => {
  test('XSS 공격을 제거한다', () => {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img onerror="alert(1)" src="x">',
      'onclick="alert(1)"',
    ];

    maliciousInputs.forEach(input => {
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('onclick=');
    });
  });
});

describe('isSafeFromSqlInjection', () => {
  test('SQL 인젝션 시도를 감지한다', () => {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      'SELECT * FROM users',
      'UNION SELECT password FROM accounts',
    ];

    maliciousInputs.forEach(input => {
      const result = isSafeFromSqlInjection(input);
      expect(result).toBe(false);
    });
  });

  test('안전한 입력을 통과시킨다', () => {
    const safeInputs = [
      'https://brunch.co.kr/@author/123',
      'testuser',
      '일반적인 한글 텍스트',
    ];

    safeInputs.forEach(input => {
      const result = isSafeFromSqlInjection(input);
      expect(result).toBe(true);
    });
  });
});

// ===== 유틸리티 함수 테스트 =====

describe('extractUrlInfo', () => {
  test('URL에서 정보를 올바르게 추출한다', () => {
    const url = 'https://brunch.co.kr/@testuser/123';
    const result = extractUrlInfo(url);
    
    expect(result).not.toBeNull();
    expect(result?.authorId).toBe('testuser');
    expect(result?.articleNumber).toBe(123);
    expect(result?.baseUrl).toBe('https://brunch.co.kr/@testuser');
  });
});

describe('calculateArticleCount', () => {
  test('글 개수를 올바르게 계산한다', () => {
    expect(calculateArticleCount(1, 10)).toBe(10);
    expect(calculateArticleCount(5, 5)).toBe(1);
    expect(calculateArticleCount(10, 5)).toBe(0); // 잘못된 범위
  });
});
*/

export {}; // 모듈로 인식시키기 위한 export
