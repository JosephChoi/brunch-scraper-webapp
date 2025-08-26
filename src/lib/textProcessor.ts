/**
 * 브런치 텍스트 수집기 - 텍스트 처리 엔진
 */

import {
  ArticleData,
  ProcessedText,
  FileGenerationOptions,
} from './types';
import {
  stripHtmlTags,
  normalizeWhitespace,
  generateFilename,
  getCurrentTimestamp,
  truncateString,
  devLog,
} from './utils';
import {
  ARTICLE_SEPARATOR,
  TITLE_CONTENT_SEPARATOR,
  MAX_TITLE_LENGTH,
  MAX_CONTENT_LENGTH_PER_ARTICLE,
  DEFAULT_METADATA,
} from './constants';

// ===== 기본 텍스트 정제 함수들 =====

/**
 * HTML 엔티티를 일반 문자로 변환합니다.
 * @param text HTML 엔티티가 포함된 텍스트
 * @returns 변환된 텍스트
 */
export function decodeHtmlEntities(text: string): string {
  const entityMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&hellip;': '…',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
  };

  return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
    return entityMap[entity] || entity;
  });
}

/**
 * 특수 문자와 이모지를 정리합니다.
 * @param text 원본 텍스트
 * @param preserveEmoji 이모지 보존 여부
 * @returns 정리된 텍스트
 */
export function normalizeSpecialCharacters(text: string, preserveEmoji: boolean = true): string {
  let result = text;

  // 유니코드 정규화
  result = result.normalize('NFKC');

  // 제어 문자 제거 (탭, 개행 제외)
  result = result.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');

  // 이모지 처리
  if (!preserveEmoji) {
    // 이모지 제거 (기본 이모지 범위)
    result = result.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '');
  }

  // 특수 공백 문자를 일반 공백으로 변환
  result = result.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ');

  // 특수 따옴표를 일반 따옴표로 변환
  result = result.replace(/[""]/g, '"');
  result = result.replace(/['']/g, "'");

  return result;
}

/**
 * 문장 구두점을 정규화합니다.
 * @param text 원본 텍스트
 * @returns 정규화된 텍스트
 */
export function normalizePunctuation(text: string): string {
  let result = text;

  // 연속된 물음표, 느낌표 제한 (최대 3개)
  result = result.replace(/[?]{4,}/g, '???');
  result = result.replace(/[!]{4,}/g, '!!!');

  // 연속된 마침표 처리 (생략 부호는 3개로 통일)
  result = result.replace(/\.{4,}/g, '...');

  // 쉼표 뒤 공백 정리
  result = result.replace(/,(\S)/g, ', $1');

  // 마침표 뒤 공백 정리 (문장 끝인 경우)
  result = result.replace(/\.([A-Z가-힣])/g, '. $1');

  return result;
}

/**
 * 브런치 특화 텍스트 정제를 수행합니다.
 * @param text 원본 텍스트
 * @returns 정제된 텍스트
 */
export function cleanBrunchText(text: string): string {
  let result = text;

  // HTML 태그 제거
  result = stripHtmlTags(result);

  // HTML 엔티티 디코딩
  result = decodeHtmlEntities(result);

  // 특수 문자 정규화
  result = normalizeSpecialCharacters(result, true);

  // 구두점 정규화
  result = normalizePunctuation(result);

  // 공백 정규화
  result = normalizeWhitespace(result);

  // 브런치 특화 불필요한 텍스트 제거
  result = removeBrunchMetadata(result);

  return result.trim();
}

/**
 * 브런치 특화 메타데이터나 불필요한 텍스트를 제거합니다.
 * @param text 원본 텍스트
 * @returns 정제된 텍스트
 */
export function removeBrunchMetadata(text: string): string {
  let result = text;

  // 브런치 관련 불필요한 텍스트 패턴들
  const unwantedPatterns = [
    /브런치\s*작가\s*되기/gi,
    /구독하기/gi,
    /좋아요\s*\d+/gi,
    /조회수\s*\d+/gi,
    /댓글\s*\d+/gi,
    /공유하기/gi,
    /카카오톡\s*공유/gi,
    /페이스북\s*공유/gi,
    /트위터\s*공유/gi,
    /링크\s*복사/gi,
    /브런치북\s*출간/gi,
    /매거진\s*구독/gi,
    /이전\s*글/gi,
    /다음\s*글/gi,
    /목록\s*보기/gi,
    /작가의\s*글\s*더보기/gi,
  ];

  unwantedPatterns.forEach(pattern => {
    result = result.replace(pattern, '');
  });

  // 연속된 개행 정리
  result = result.replace(/\n\s*\n\s*\n/g, '\n\n');

  return result;
}

// ===== 글 포맷팅 함수들 =====

/**
 * 단일 글을 포맷팅합니다.
 * @param article 글 데이터
 * @param options 포맷팅 옵션
 * @returns 포맷팅된 텍스트
 */
export function formatSingleArticle(
  article: ArticleData,
  options: {
    includeTitle?: boolean;
    includeMetadata?: boolean;
    titleMaxLength?: number;
    contentMaxLength?: number;
  } = {}
): string {
  const {
    includeTitle = true,
    includeMetadata = false,
    titleMaxLength = MAX_TITLE_LENGTH,
    contentMaxLength = MAX_CONTENT_LENGTH_PER_ARTICLE,
  } = options;

  const parts: string[] = [];

  // 제목 추가
  if (includeTitle && article.title && article.title !== '(제목 없음)') {
    let title = cleanBrunchText(article.title);
    
    if (title.length > titleMaxLength) {
      title = truncateString(title, titleMaxLength, '...');
    }
    
    parts.push(title);
  }

  // 본문 추가
  if (article.content) {
    let content = cleanBrunchText(article.content);
    
    if (content.length > contentMaxLength) {
      content = truncateString(content, contentMaxLength, '\n\n(내용이 너무 길어 일부만 표시됩니다...)');
    }
    
    parts.push(content);
  }

  // 메타데이터 추가 (선택사항)
  if (includeMetadata) {
    const metadata = [];
    
    // 작성일만 표시
    if (article.publishedDate) {
      metadata.push(`작성일: ${article.publishedDate}`);
    }
    
    // 실패한 글인 경우에만 추가 정보 표시
    if (!article.success) {
      metadata.push('※ 이 글은 스크래핑에 실패했습니다.');
    }
    
    if (metadata.length > 0) {
      parts.push(`\n[${metadata.join(' | ')}]`);
    }
  }

  return parts.join(TITLE_CONTENT_SEPARATOR);
}

/**
 * 여러 글을 하나의 텍스트로 병합합니다.
 * @param articles 글 데이터 배열
 * @param options 포맷팅 옵션
 * @returns 병합된 텍스트
 */
export function mergeArticles(
  articles: ArticleData[],
  options: {
    includeIndex?: boolean;
    includeMetadata?: boolean;
    separateFailedArticles?: boolean;
    addHeader?: boolean;
    addFooter?: boolean;
  } = {}
): string {
  const {
    includeIndex = false,
    includeMetadata = false,
    separateFailedArticles = true,
    addHeader = true,
    addFooter = true,
  } = options;

  if (articles.length === 0) {
    return '수집된 글이 없습니다.';
  }

  const parts: string[] = [];

  // 헤더 추가
  if (addHeader) {
    const header = generateHeader(articles);
    parts.push(header);
    parts.push(ARTICLE_SEPARATOR);
  }

  // 성공한 글들과 실패한 글들 분리
  const successfulArticles = articles.filter(a => a.success);
  const failedArticles = articles.filter(a => !a.success);

  // 성공한 글들 처리
  successfulArticles.forEach((article, index) => {
    let formattedArticle = formatSingleArticle(article, {
      includeTitle: true,
      includeMetadata,
    });

    // 인덱스 추가
    if (includeIndex) {
      formattedArticle = `${index + 1}. ${formattedArticle}`;
    }

    parts.push(formattedArticle);

    // 마지막 글이 아니면 구분자 추가
    if (index < successfulArticles.length - 1) {
      parts.push(ARTICLE_SEPARATOR);
    }
  });

  // 실패한 글들 처리
  if (separateFailedArticles && failedArticles.length > 0) {
    parts.push(ARTICLE_SEPARATOR);
    parts.push('\n=== 스크래핑에 실패한 글들 ===\n');

    failedArticles.forEach((article, index) => {
      const failedInfo = [
        `글 번호: ${article.number}`,
        `URL: ${article.url}`,
        `오류: ${article.content}`,
      ].join('\n');

      parts.push(failedInfo);

      if (index < failedArticles.length - 1) {
        parts.push('\n---\n');
      }
    });
  }

  // 푸터 추가
  if (addFooter) {
    parts.push(ARTICLE_SEPARATOR);
    const footer = generateFooter(articles);
    parts.push(footer);
  }

  return parts.join('');
}

/**
 * 헤더 텍스트를 생성합니다.
 * @param articles 글 데이터 배열
 * @returns 헤더 텍스트
 */
export function generateHeader(articles: ArticleData[]): string {
  if (articles.length === 0) {
    return '';
  }

  const firstArticle = articles[0];
  const lastArticle = articles[articles.length - 1];
  const successCount = articles.filter(a => a.success).length;
  const totalCount = articles.length;

  // URL에서 작가 정보 추출
  let authorInfo = '';
  if (firstArticle.url) {
    const match = firstArticle.url.match(/@([a-zA-Z0-9_-]+)/);
    if (match) {
      authorInfo = `@${match[1]}`;
    }
  }

  const headerParts = [
    '브런치 텍스트 모음집',
    '',
    `작가: ${authorInfo}`,
    `수집 범위: ${firstArticle.number}번 ~ ${lastArticle.number}번 글`,
    `수집 결과: ${successCount}/${totalCount}개 성공`,
    `생성 일시: ${new Date().toLocaleString('ko-KR')}`,
    '',
    '※ 이 문서는 브런치 텍스트 수집기로 생성되었습니다.',
    '※ 수집된 콘텐츠의 저작권은 원작자에게 있습니다.',
    '',
  ];

  return headerParts.join('\n');
}

/**
 * 푸터 텍스트를 생성합니다.
 * @param articles 글 데이터 배열
 * @returns 푸터 텍스트
 */
export function generateFooter(articles: ArticleData[]): string {
  const successCount = articles.filter(a => a.success).length;
  const totalCount = articles.length;
  const skippedCount = totalCount - successCount;

  const footerParts = [
    '',
    '=== 수집 완료 ===',
    '',
    `총 ${totalCount}개 글 중 ${successCount}개 수집 성공`,
  ];

  if (skippedCount > 0) {
    footerParts.push(`${skippedCount}개 글 수집 실패`);
  }

  footerParts.push('');
  footerParts.push(`생성 도구: ${DEFAULT_METADATA.GENERATED_BY} v${DEFAULT_METADATA.VERSION}`);
  footerParts.push(`웹사이트: ${DEFAULT_METADATA.WEBSITE}`);
  footerParts.push('');

  return footerParts.join('\n');
}

// ===== 파일 생성 함수들 =====

/**
 * 수집된 글들을 처리하여 최종 결과를 생성합니다.
 * @param articles 글 데이터 배열
 * @param authorId 작가 ID
 * @param startNum 시작 번호
 * @param endNum 종료 번호
 * @returns 처리된 텍스트 결과
 */
export function processArticlesForDownload(
  articles: ArticleData[],
  authorId: string,
  startNum: number,
  endNum: number
): ProcessedText {
  const processingStartTime = Date.now();

  // 텍스트 병합
  const content = mergeArticles(articles, {
    includeIndex: false,
    includeMetadata: true, // 작성일 포함
    separateFailedArticles: true,
    addHeader: true,
    addFooter: true,
  });

  // 메타데이터 생성
  const successCount = articles.filter(a => a.success).length;
  const skippedCount = articles.length - successCount;
  const processingTime = Date.now() - processingStartTime;

  return {
    content,
    metadata: {
      totalArticles: articles.length,
      successCount,
      skippedCount,
      generatedAt: new Date(),
      processingTime,
    },
  };
}

/**
 * 파일명을 생성합니다.
 * @param authorId 작가 ID
 * @param startNum 시작 번호
 * @param endNum 종료 번호
 * @param date 생성 날짜
 * @returns 생성된 파일명
 */
export function generateTextFilename(
  authorId: string,
  startNum: number,
  endNum: number,
  date: Date = new Date()
): string {
  const options: FileGenerationOptions = {
    authorId,
    startNum,
    endNum,
    date,
    extension: 'txt',
  };

  return generateFilename(options);
}

// ===== 텍스트 분석 함수들 =====

/**
 * 텍스트 통계를 생성합니다.
 * @param text 분석할 텍스트
 * @returns 텍스트 통계
 */
export function analyzeText(text: string): {
  charCount: number;
  wordCount: number;
  lineCount: number;
  paragraphCount: number;
  estimatedReadingTime: number; // 분 단위
} {
  const charCount = text.length;
  const lineCount = text.split('\n').length;
  
  // 문단 수 (빈 줄로 구분)
  const paragraphCount = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
  
  // 단어 수 (한글/영문 혼재 고려)
  const koreanWords = (text.match(/[가-힣]+/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  const wordCount = koreanWords + englishWords;
  
  // 예상 읽기 시간 (한국어 기준 분당 300-400자)
  const estimatedReadingTime = Math.ceil(charCount / 350);

  return {
    charCount,
    wordCount,
    lineCount,
    paragraphCount,
    estimatedReadingTime,
  };
}

/**
 * 글 품질을 평가합니다.
 * @param article 글 데이터
 * @returns 품질 점수 및 분석 결과
 */
export function evaluateArticleQuality(article: ArticleData): {
  score: number; // 0-100 점수
  issues: string[]; // 발견된 문제점들
  suggestions: string[]; // 개선 제안들
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // 기본 검증
  if (!article.success) {
    score = 0;
    issues.push('스크래핑 실패');
    return { score, issues, suggestions };
  }

  // 제목 검증
  if (!article.title || article.title === '(제목 없음)' || article.title.trim().length < 5) {
    score -= 20;
    issues.push('제목이 없거나 너무 짧음');
  }

  // 본문 검증
  if (!article.content || article.content.trim().length < 100) {
    score -= 30;
    issues.push('본문이 없거나 너무 짧음');
  }

  // 본문 품질 검증
  if (article.content) {
    const cleanContent = cleanBrunchText(article.content);
    
    // 반복 문자 검사
    if (/(.)\1{10,}/.test(cleanContent)) {
      score -= 10;
      issues.push('반복 문자 발견');
      suggestions.push('반복된 문자를 정리하세요');
    }

    // 의미 있는 내용 비율 검사
    const meaningfulChars = cleanContent.replace(/[^가-힣a-zA-Z0-9]/g, '').length;
    const meaningfulRatio = meaningfulChars / cleanContent.length;
    
    if (meaningfulRatio < 0.7) {
      score -= 15;
      issues.push('의미 있는 내용 비율이 낮음');
      suggestions.push('특수문자나 공백을 정리하세요');
    }
  }

  return {
    score: Math.max(0, score),
    issues,
    suggestions,
  };
}

// ===== 내보내기 함수들 =====

/**
 * 다양한 형식으로 텍스트를 내보냅니다.
 * @param content 텍스트 내용
 * @param format 출력 형식
 * @returns 형식화된 텍스트
 */
export function exportText(
  content: string,
  format: 'txt' | 'md' | 'json' = 'txt'
): string {
  switch (format) {
    case 'md':
      return convertToMarkdown(content);
    case 'json':
      return JSON.stringify({ content, generatedAt: getCurrentTimestamp() }, null, 2);
    case 'txt':
    default:
      return content;
  }
}

/**
 * 텍스트를 마크다운 형식으로 변환합니다.
 * @param content 원본 텍스트
 * @returns 마크다운 텍스트
 */
function convertToMarkdown(content: string): string {
  let result = content;

  // 제목을 마크다운 헤더로 변환 (간단한 휴리스틱)
  const lines = result.split('\n');
  const processedLines = lines.map(line => {
    const trimmedLine = line.trim();
    
    // 짧고 의미있는 줄을 제목으로 간주
    if (trimmedLine.length > 5 && 
        trimmedLine.length < 100 && 
        !trimmedLine.includes('.') && 
        !trimmedLine.startsWith('-') &&
        !trimmedLine.startsWith('*')) {
      return `## ${trimmedLine}`;
    }
    
    return line;
  });

  result = processedLines.join('\n');

  // 구분자를 마크다운 수평선으로 변환
  result = result.replace(/^---$/gm, '---');

  return result;
}
