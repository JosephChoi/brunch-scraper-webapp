# API 명세서 (API Specification)
## Brunch Text Scraper

### 📋 개요

브런치 텍스트 수집기의 RESTful API 상세 명세서입니다.

---

## 🌐 기본 정보

- **Base URL**: `https://your-domain.vercel.app` (배포 후 결정)
- **API Version**: v1
- **Content-Type**: `application/json`
- **응답 형식**: JSON, Stream

---

## 🔗 엔드포인트 목록

### 1. 스크래핑 작업 시작
**POST** `/api/scrape`

브런치 블로그에서 지정된 범위의 글들을 수집합니다.

#### 요청 명세

**Headers**
```http
Content-Type: application/json
Accept: text/event-stream
```

**Request Body**
```json
{
  "url": "https://brunch.co.kr/@ssoojeenlee/294",
  "startNum": 1,
  "endNum": 10
}
```

**Request Body 필드 설명**

| 필드 | 타입 | 필수 | 설명 | 예시 |
|------|------|------|------|------|
| `url` | string | ✅ | 브런치 글 URL | `"https://brunch.co.kr/@authorid/123"` |
| `startNum` | number | ✅ | 시작 글 번호 (1 이상) | `1` |
| `endNum` | number | ✅ | 종료 글 번호 (startNum 이상) | `10` |

**유효성 검증 규칙**
- `url`: 브런치 URL 패턴 매칭 (`/^https:\/\/brunch\.co\.kr\/@[a-zA-Z0-9_-]+\/\d+$/`)
- `startNum`: 1 이상의 정수
- `endNum`: startNum 이상의 정수
- `endNum - startNum`: 100개 이하 (과도한 요청 방지)

#### 응답 명세

**성공 응답 (200 OK)**

스트리밍 응답으로 여러 개의 JSON 객체가 전송됩니다.

**1. 진행 상황 업데이트**
```json
{
  "type": "progress",
  "current": 3,
  "total": 10,
  "url": "https://brunch.co.kr/@ssoojeenlee/296",
  "title": "세 번째 글 제목",
  "timestamp": "2025-01-15T10:30:45.123Z"
}
```

**2. 완료 응답**
```json
{
  "type": "complete",
  "data": {
    "content": "첫 번째 글 제목\n\n첫 번째 글 내용...\n\n---\n\n두 번째 글 제목\n\n두 번째 글 내용...",
    "filename": "brunch_ssoojeenlee_1-10_20250115.txt",
    "metadata": {
      "totalArticles": 10,
      "successCount": 9,
      "skippedCount": 1,
      "skippedUrls": ["https://brunch.co.kr/@ssoojeenlee/295"],
      "generatedAt": "2025-01-15T10:35:12.456Z",
      "authorId": "ssoojeenlee",
      "range": "1-10"
    }
  },
  "timestamp": "2025-01-15T10:35:12.456Z"
}
```

**오류 응답**

**400 Bad Request - 잘못된 요청**
```json
{
  "type": "error",
  "error": "VALIDATION_ERROR",
  "message": "잘못된 요청입니다.",
  "details": [
    "URL이 올바른 브런치 형식이 아닙니다.",
    "시작 번호는 1 이상이어야 합니다."
  ],
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**500 Internal Server Error - 서버 오류**
```json
{
  "type": "error",
  "error": "SCRAPING_ERROR",
  "message": "스크래핑 중 오류가 발생했습니다.",
  "details": "브라우저 초기화에 실패했습니다.",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**429 Too Many Requests - 요청 제한**
```json
{
  "type": "error",
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
  "retryAfter": 60,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## 📊 응답 타입 상세

### ProgressResponse
진행 상황을 알려주는 응답입니다.

```typescript
interface ProgressResponse {
  type: "progress";
  current: number;        // 현재 처리 중인 글 번호
  total: number;          // 전체 처리할 글 개수
  url: string;           // 현재 처리 중인 URL
  title?: string;        // 현재 글 제목 (추출 성공 시)
  timestamp: string;     // ISO 8601 형식의 타임스탬프
}
```

### CompleteResponse
작업 완료 시의 응답입니다.

```typescript
interface CompleteResponse {
  type: "complete";
  data: {
    content: string;              // 통합된 텍스트 내용
    filename: string;             // 제안 파일명
    metadata: {
      totalArticles: number;      // 총 글 개수
      successCount: number;       // 성공적으로 수집된 글 개수
      skippedCount: number;       // 건너뛴 글 개수
      skippedUrls: string[];      // 건너뛴 URL 목록
      generatedAt: string;        // 생성 시간 (ISO 8601)
      authorId: string;           // 작가 ID
      range: string;              // 수집 범위 (예: "1-10")
    };
  };
  timestamp: string;
}
```

### ErrorResponse
오류 발생 시의 응답입니다.

```typescript
interface ErrorResponse {
  type: "error";
  error: string;           // 오류 코드
  message: string;         // 사용자 친화적 오류 메시지
  details?: string | string[]; // 상세 오류 정보
  retryAfter?: number;     // 재시도까지 대기 시간 (초)
  timestamp: string;       // ISO 8601 형식의 타임스탬프
}
```

---

## 🚨 오류 코드

### 클라이언트 오류 (4xx)

| 코드 | 오류명 | 설명 | 해결방법 |
|------|--------|------|----------|
| `VALIDATION_ERROR` | 유효성 검증 실패 | 요청 데이터가 유효하지 않음 | details 필드 확인 후 올바른 데이터 전송 |
| `INVALID_URL` | 잘못된 URL | 브런치 URL 형식이 아님 | 올바른 브런치 URL 형식 사용 |
| `INVALID_RANGE` | 잘못된 범위 | 글 번호 범위가 유효하지 않음 | 시작 번호 ≤ 종료 번호, 최대 100개 제한 |
| `RATE_LIMIT_EXCEEDED` | 요청 제한 초과 | 너무 많은 요청 전송 | retryAfter 시간 후 재시도 |

### 서버 오류 (5xx)

| 코드 | 오류명 | 설명 | 해결방법 |
|------|--------|------|----------|
| `SCRAPING_ERROR` | 스크래핑 오류 | 브라우저 또는 스크래핑 실패 | 잠시 후 재시도 |
| `NETWORK_ERROR` | 네트워크 오류 | 브런치 사이트 접근 실패 | 네트워크 상태 확인 후 재시도 |
| `PROCESSING_ERROR` | 처리 오류 | 텍스트 처리 중 오류 발생 | 잠시 후 재시도 |
| `INTERNAL_ERROR` | 내부 서버 오류 | 예상치 못한 서버 오류 | 관리자에게 문의 |

---

## 📝 사용 예시

### JavaScript/TypeScript 클라이언트

```typescript
async function scrapeBrunchArticles(
  url: string, 
  startNum: number, 
  endNum: number,
  onProgress?: (current: number, total: number) => void,
  onComplete?: (data: any) => void,
  onError?: (error: string) => void
) {
  try {
    const response = await fetch('/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ url, startNum, endNum }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader!.read();
      
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          
          switch (data.type) {
            case 'progress':
              onProgress?.(data.current, data.total);
              break;
            case 'complete':
              onComplete?.(data.data);
              break;
            case 'error':
              onError?.(data.message);
              break;
          }
        } catch (e) {
          console.warn('JSON 파싱 오류:', line);
        }
      }
    }
  } catch (error) {
    onError?.(error instanceof Error ? error.message : '알 수 없는 오류');
  }
}

// 사용 예시
scrapeBrunchArticles(
  'https://brunch.co.kr/@ssoojeenlee/294',
  1,
  10,
  (current, total) => console.log(`진행률: ${current}/${total}`),
  (data) => {
    // 텍스트 파일 다운로드
    const blob = new Blob([data.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.filename;
    a.click();
    URL.revokeObjectURL(url);
  },
  (error) => console.error('오류:', error)
);
```

### cURL 예시

```bash
# 스크래핑 요청
curl -X POST "https://your-domain.vercel.app/api/scrape" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "url": "https://brunch.co.kr/@ssoojeenlee/294",
    "startNum": 1,
    "endNum": 5
  }' \
  --no-buffer
```

---

## 🔒 보안 고려사항

### Rate Limiting
- **제한**: 사용자당 분당 3회 요청
- **구현**: IP 기반 제한
- **응답**: 429 상태 코드 + `retryAfter` 필드

### 입력 검증
- **URL 검증**: 브런치 도메인만 허용
- **범위 제한**: 최대 100개 글까지만 수집
- **XSS 방지**: 모든 입력값 이스케이프 처리

### 데이터 보안
- **민감 정보**: 로그에 URL이나 사용자 정보 기록 안함
- **임시 데이터**: 메모리상 데이터만 사용, 서버 저장 안함
- **HTTPS**: 모든 통신 암호화

---

## 📊 성능 특성

### 응답 시간
- **첫 진행 상황**: 3-5초 이내
- **글당 처리 시간**: 평균 2-3초
- **전체 완료 시간**: 글 개수 × 2.5초 (평균)

### 동시성
- **제한**: 동시 요청 처리 안함 (순차 처리)
- **이유**: 브런치 서버 부하 최소화
- **대안**: 클라이언트에서 순차 요청 권장

### 메모리 사용량
- **글당 메모리**: 평균 10-50KB
- **최대 사용량**: ~5MB (100개 글 기준)
- **가비지 컬렉션**: 작업 완료 후 자동 해제

---

## 🧪 테스트 시나리오

### 정상 케이스
1. **단일 글 수집**: startNum = endNum
2. **다중 글 수집**: 정상 범위 (1-10)
3. **최대 범위 수집**: 100개 글 수집

### 예외 케이스
1. **잘못된 URL**: 브런치가 아닌 URL
2. **존재하지 않는 글**: 404 응답
3. **네트워크 오류**: 타임아웃, 연결 실패
4. **서버 오류**: 브런치 서버 5xx 응답

---

## 📈 모니터링 메트릭

### API 메트릭
- **요청 수**: 시간별/일별 총 요청 수
- **성공률**: 200 응답 비율
- **응답 시간**: 평균/중앙값/95퍼센타일
- **오류율**: 4xx/5xx 응답 비율

### 비즈니스 메트릭
- **수집 성공률**: 요청된 글 대비 성공 수집률
- **인기 작가**: 가장 많이 요청되는 브런치 작가
- **수집 패턴**: 주로 요청되는 글 개수 범위

---

*이 API 명세서는 개발 진행에 따라 업데이트됩니다.*
