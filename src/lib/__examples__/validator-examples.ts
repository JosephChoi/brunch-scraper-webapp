/**
 * 검증 함수 사용 예제
 * 
 * 개발 중 validator 함수들을 테스트하기 위한 예제입니다.
 * 나중에 실제 테스트 프레임워크로 교체할 예정입니다.
 */

import {
  validateBrunchUrl,
  validateRange,
  validateScrapeRequest,
  sanitizeInput,
  extractUrlInfo,
  calculateArticleCount,
  formatValidationErrors,
} from '../validator';

// ===== 사용 예제 함수들 =====

/**
 * URL 검증 예제
 */
export function testUrlValidation() {
  console.log('=== URL 검증 테스트 ===');

  const testUrls = [
    'https://brunch.co.kr/@ssoojeenlee/294', // 유효한 URL
    'https://brunch.co.kr/@test-user_123/456', // 유효한 URL
    'https://naver.com', // 잘못된 도메인
    'https://brunch.co.kr/@author', // 글 번호 없음
    '', // 빈 문자열
    'not-a-url', // URL 형식 아님
  ];

  testUrls.forEach((url, index) => {
    console.log(`\n${index + 1}. 테스트 URL: ${url || '(빈 문자열)'}`);
    const result = validateBrunchUrl(url);
    
    if (result.isValid) {
      console.log(`   ✅ 유효함`);
      console.log(`   📝 작가: ${result.authorId}`);
      console.log(`   📄 글번호: ${result.articleNumber}`);
    } else {
      console.log(`   ❌ 유효하지 않음`);
      console.log(`   💬 오류: ${result.error}`);
    }
  });
}

/**
 * 범위 검증 예제
 */
export function testRangeValidation() {
  console.log('\n=== 범위 검증 테스트 ===');

  const testRanges = [
    [1, 10], // 유효한 범위
    [5, 5], // 단일 글
    [0, 10], // 잘못된 시작 번호
    [10, 5], // 종료 < 시작
    [1, 101], // 너무 많은 글
    [-1, 10], // 음수
    ['abc', 10], // 문자열
  ];

  testRanges.forEach((range, index) => {
    console.log(`\n${index + 1}. 테스트 범위: ${range[0]} ~ ${range[1]}`);
    const result = validateRange(range[0], range[1]);
    
    if (result.isValid) {
      console.log(`   ✅ 유효함`);
      console.log(`   📊 글 개수: ${calculateArticleCount(result.startNum!, result.endNum!)}`);
    } else {
      console.log(`   ❌ 유효하지 않음`);
      console.log(`   💬 오류들:`);
      result.errors.forEach(error => {
        console.log(`      - ${error}`);
      });
    }
  });
}

/**
 * 통합 검증 예제
 */
export function testScrapeRequestValidation() {
  console.log('\n=== 스크래핑 요청 검증 테스트 ===');

  const testRequests = [
    {
      name: '유효한 요청',
      request: {
        url: 'https://brunch.co.kr/@ssoojeenlee/294',
        startNum: 1,
        endNum: 10,
      },
    },
    {
      name: '잘못된 URL',
      request: {
        url: 'https://naver.com',
        startNum: 1,
        endNum: 10,
      },
    },
    {
      name: '잘못된 범위',
      request: {
        url: 'https://brunch.co.kr/@test/123',
        startNum: 10,
        endNum: 5,
      },
    },
    {
      name: '너무 많은 글',
      request: {
        url: 'https://brunch.co.kr/@test/123',
        startNum: 1,
        endNum: 101,
      },
    },
  ];

  testRequests.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}`);
    console.log(`   📥 요청: ${JSON.stringify(test.request)}`);
    
    const result = validateScrapeRequest(test.request);
    
    if (result.isValid) {
      console.log(`   ✅ 검증 통과`);
      console.log(`   📋 파싱된 데이터:`);
      console.log(`      - 작가: ${result.parsed?.authorId}`);
      console.log(`      - 기본 URL: ${result.parsed?.baseUrl}`);
      console.log(`      - 범위: ${result.parsed?.startNum} ~ ${result.parsed?.endNum}`);
    } else {
      console.log(`   ❌ 검증 실패`);
      console.log(`   💬 오류 메시지:`);
      const formattedErrors = formatValidationErrors(result.errors);
      console.log(`      ${formattedErrors.replace(/\n/g, '\n      ')}`);
    }
  });
}

/**
 * 보안 검증 예제
 */
export function testSecurityValidation() {
  console.log('\n=== 보안 검증 테스트 ===');

  const maliciousInputs = [
    '<script>alert("XSS")</script>',
    'javascript:alert("XSS")',
    '<img onerror="alert(1)" src="x">',
    'onclick="malicious()"',
    '정상적인 텍스트',
    'https://brunch.co.kr/@author/123',
  ];

  console.log('\n입력값 정제 테스트:');
  maliciousInputs.forEach((input, index) => {
    const sanitized = sanitizeInput(input);
    console.log(`${index + 1}. 원본: ${input}`);
    console.log(`   정제됨: ${sanitized}`);
    console.log(`   안전함: ${input === sanitized ? '변화없음' : '정제됨'}\n`);
  });
}

/**
 * URL 정보 추출 예제
 */
export function testUrlInfoExtraction() {
  console.log('\n=== URL 정보 추출 테스트 ===');

  const testUrls = [
    'https://brunch.co.kr/@ssoojeenlee/294',
    'https://brunch.co.kr/@test-user_123/1',
    'https://brunch.co.kr/@author/999999',
    'https://invalid-url.com',
  ];

  testUrls.forEach((url, index) => {
    console.log(`\n${index + 1}. URL: ${url}`);
    const info = extractUrlInfo(url);
    
    if (info) {
      console.log(`   ✅ 추출 성공`);
      console.log(`   👤 작가: ${info.authorId}`);
      console.log(`   🔗 기본 URL: ${info.baseUrl}`);
      console.log(`   📄 글 번호: ${info.articleNumber}`);
    } else {
      console.log(`   ❌ 추출 실패 - 유효하지 않은 URL`);
    }
  });
}

/**
 * 모든 예제 실행
 */
export function runAllExamples() {
  console.log('🧪 Validator 함수 테스트 시작\n');
  
  testUrlValidation();
  testRangeValidation();
  testScrapeRequestValidation();
  testSecurityValidation();
  testUrlInfoExtraction();
  
  console.log('\n✨ 모든 테스트 완료!');
}

// 개발 환경에서만 실행
if (process.env.NODE_ENV === 'development') {
  // 이 파일을 직접 실행할 때만 테스트 실행
  // runAllExamples();
}
