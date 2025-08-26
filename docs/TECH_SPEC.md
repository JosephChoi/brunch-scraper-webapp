# 기술 명세서 (Technical Specification)
## Brunch Text Scraper

### 📋 개요

브런치 블로그 텍스트 수집기의 상세 기술 구현 명세서입니다. HTTP + Cheerio 기반의 웹 스크래핑으로 브런치 글을 안정적으로 수집합니다.

---

## 🏗️ 시스템 아키텍처

### 전체 구조
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │   Scraper       │
│   (Next.js)     │◄──►│   (Next.js)     │◄──►│   (HTTP+Cheerio)│
│                 │    │                 │    │                 │
│ - React UI      │    │ - /api/scrape   │    │ - HTTP Requests │
│ - State Mgmt    │    │ - Validation    │    │ - HTML Parsing  │
│ - File Download │    │ - Stream resp   │    │ - Error Handle  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 데이터 플로우
```
User Input → Validation → HTTP Scraping → HTML Parsing → Text Processing → File Generation → Download
```

---

## 🔧 기술 스택 상세

### 프론트엔드
- **Next.js 15.5.0**: App Router 사용
- **React 19.1.0**: 컴포넌트 기반 UI
- **TypeScript 5.x**: 타입 안정성
- **Tailwind CSS 4.x**: 유틸리티 퍼스트 스타일링

### 백엔드
- **Next.js API Routes**: 서버리스 함수
- **Cheerio 1.1.2**: HTML 파싱 및 DOM 조작
- **Node.js Fetch API**: HTTP 요청 처리
- **Server-Sent Events**: 실시간 진행 상황 스트리밍

### 개발 도구
- **ESLint**: 코드 품질 관리
- **TypeScript**: 정적 타입 검사

---

## 📁 프로젝트 구조

```
brunch-scraper-webapp/
├── docs/                    # 문서
│   ├── PRD.md
│   ├── TECH_SPEC.md
│   ├── API_SPEC.md
│   └── IMPLEMENTATION_ROADMAP.md
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/
│   │   │   └── scrape/
│   │   │       └── route.ts # 스크래핑 API
│   │   ├── page.tsx         # 메인 페이지
│   │   ├── layout.tsx       # 공통 레이아웃
│   │   ├── globals.css      # 전역 스타일
│   │   ├── opengraph-image.tsx # OG 이미지
│   │   └── twitter-image.tsx   # Twitter 이미지
│   ├── components/          # 재사용 컴포넌트
│   │   ├── ui/              # 기본 UI 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Progress.tsx
│   │   ├── ScrapeForm.tsx   # 입력 폼
│   │   └── BrunchScraperApp.tsx # 메인 앱 컴포넌트
│   ├── lib/                 # 유틸리티 함수
│   │   ├── scraper.ts       # HTTP + Cheerio 스크래핑 로직
│   │   ├── textProcessor.ts # 텍스트 처리
│   │   ├── validator.ts     # 입력값 검증
│   │   ├── constants.ts     # 상수 정의
│   │   ├── utils.ts         # 유틸리티 함수
│   │   └── types.ts         # TypeScript 타입 정의
│   └── hooks/               # React 커스텀 훅
│       └── useBrunchScraper.ts # 스크래핑 상태 관리
├── public/                  # 정적 파일
│   └── brunch logo.jpg      # 브런치 로고
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── vercel.json              # Vercel 배포 설정
```

---

## 🔍 핵심 모듈 상세

### 1. 스크래핑 엔진 (`lib/scraper.ts`)

```typescript
interface ScrapeConfig {
  baseUrl: string;      // 브런치 블로그 기본 URL
  startNum: number;     // 시작 글 번호
  endNum: number;       // 종료 글 번호
  onProgress?: (current: number, total: number, url: string, title: string) => void;
}

interface ScrapeResult {
  success: boolean;
  data?: ArticleData[];
  error?: string;
  skippedUrls?: string[];
  processingTime?: number;
}

interface ArticleData {
  title: string;
  content: string;
  url: string;
  number: number;
  success: boolean;
  publishedDate?: string;
}
```

**주요 기능**:
- **HTTP 요청**: Node.js Fetch API로 HTML 직접 다운로드
- **브런치 로그인 우회**: Googlebot User-Agent 사용으로 카카오 로그인 리다이렉트 우회
- **HTML 파싱**: Cheerio로 DOM 조작 및 데이터 추출
- **에러 처리**: 타임아웃, 네트워크 오류, 존재하지 않는 글 처리
- **날짜 추출**: JSON-LD 구조화 데이터 및 CSS 셀렉터 활용

### 2. 텍스트 처리기 (`lib/textProcessor.ts`)

```typescript
interface ProcessedText {
  content: string;
  metadata: {
    totalArticles: number;
    successCount: number;
    skippedCount: number;
    generatedAt: string;
    authorId: string;
    range: string;
  };
}
```

**주요 기능**:
- HTML 태그 제거 및 텍스트 정제
- 글 간 구분자 추가
- 메타데이터 (제목, 작성일) 포맷팅
- 파일명 생성 (예: `brunch_ssoojeenlee_1-10_20250101_123456.txt`)

### 3. 입력값 검증기 (`lib/validator.ts`)

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors?: FieldError[];
  parsed?: {
    authorId: string;
    baseUrl: string;
    startNum: number;
    endNum: number;
  };
}
```

**검증 규칙**:
- 브런치 URL 형식 확인 (`https://brunch.co.kr/@작가ID` 또는 `https://brunch.co.kr/@작가ID/숫자`)
- 숫자 범위 유효성 (1 이상, 시작 ≤ 종료)
- 최대 수집 개수 제한 (50개)
- XSS 방지를 위한 입력값 sanitization

---

## 🌐 API 명세

### POST `/api/scrape`

**요청 본문**:
```json
{
  "url": "https://brunch.co.kr/@ssoojeenlee/294",
  "startNum": 1,
  "endNum": 10
}
```

**응답 (Server-Sent Events Streaming)**:
```typescript
// 진행 상황 업데이트
{
  "type": "progress",
  "current": 5,
  "total": 10,
  "percentage": 50,
  "currentUrl": "https://brunch.co.kr/@ssoojeenlee/5",
  "currentTitle": "글 제목"
}

// 최종 결과
{
  "type": "complete",
  "content": "전체 텍스트 내용...",
  "filename": "brunch_ssoojeenlee_1-10_20250101_123456.txt",
  "metadata": {
    "totalArticles": 10,
    "successCount": 9,
    "skippedCount": 1,
    "generatedAt": "2025-01-01T12:34:56.789Z",
    "authorId": "ssoojeenlee",
    "range": "1-10"
  }
}

// 에러 발생
{
  "type": "error",
  "error": "NETWORK_ERROR",
  "message": "브런치 사이트에 접근할 수 없습니다.",
  "timestamp": "2025-01-01T12:34:56.789Z"
}
```

---

## 🎯 성능 최적화

### HTTP 스크래핑 최적화
- **요청 간격**: 2.5초 딜레이로 서버 부하 최소화
- **User-Agent 최적화**: Googlebot User-Agent로 로그인 우회
- **타임아웃**: 각 요청별 적절한 타임아웃 설정
- **메모리 효율**: 브라우저 오버헤드 없이 가벼운 HTML 파싱

### Vercel 서버리스 최적화
- **메모리 사용량**: 512MB로 충분한 HTTP 스크래핑
- **Cold Start**: 브라우저 초기화 없이 빠른 시작
- **번들 사이즈**: cheerio만 사용으로 작은 번들 크기
- **함수 지속시간**: 최대 300초 (5분) 설정

### UI 최적화
- **비동기 처리**: 스크래핑 중 UI 블로킹 방지
- **실시간 업데이트**: Server-Sent Events로 진행 상황 실시간 표시
- **상태 관리**: React Hook 기반 효율적 상태 관리
- **프로그레시브 UI**: 스크래핑 완료 시 즉시 다운로드 가능

---

## 🔒 보안 고려사항

### 입력값 보안
- **XSS 방지**: 모든 입력값 이스케이프 처리
- **CSRF**: Next.js 내장 보호 기능 활용
- **입력 검증**: 클라이언트/서버 양쪽에서 철저한 검증

### 스크래핑 보안
- **User-Agent**: Googlebot으로 위장하여 로그인 우회
- **요청 헤더**: 정상적인 HTTP 헤더 전송
- **Rate Limiting**: 2.5초 간격으로 서버 부하 최소화
- **에러 처리**: 스크래핑 실패 시 안전한 복구

### 서버 보안
- **환경 분리**: 개발/프로덕션 환경 설정 분리
- **로그 관리**: 민감 정보 로그 제외
- **함수 권한**: Vercel 서버리스 환경의 최소 권한 원칙

---

## 🧪 테스트 전략

### 단위 테스트
- **유틸리티 함수**: validator, textProcessor, utils 함수 테스트
- **HTTP 스크래핑**: cheerio 파싱 로직 테스트
- **API Routes**: 엔드포인트 로직 테스트

### 통합 테스트
- **스크래핑 플로우**: HTTP 요청부터 텍스트 추출까지 전체 과정
- **에러 시나리오**: 네트워크 오류, 잘못된 URL, 존재하지 않는 글
- **성능 테스트**: 대량 데이터 처리 성능 검증

### E2E 테스트
- **사용자 플로우**: 입력부터 다운로드까지 전체 과정
- **브라우저 호환성**: 주요 브라우저별 동작 확인
- **모바일 반응형**: 모바일 기기에서의 사용성 테스트

---

## 📊 모니터링 및 로깅

### 로그 레벨
- **ERROR**: 스크래핑 실패, API 오류, 네트워크 오류
- **WARN**: 일부 글 수집 실패, 느린 응답
- **INFO**: 작업 시작/완료, 성공 통계
- **DEBUG**: 상세 HTTP 요청/응답 과정 (개발 환경만)

### 메트릭 수집
- **성공률**: 전체 대비 성공한 스크래핑 비율
- **응답 시간**: 평균 HTTP 요청 처리 시간
- **에러 빈도**: 에러 타입별 발생 빈도
- **사용 패턴**: 인기 있는 브런치 작가, 수집 범위 등

---

## 🚀 배포 및 운영

### 배포 환경
- **플랫폼**: Vercel (서버리스)
- **도메인**: Vercel 제공 도메인 또는 커스텀 도메인
- **지역**: ICN1 (Seoul) 리전
- **메모리**: 512MB (HTTP 스크래핑에 최적화)

### 배포 설정
```json
// vercel.json
{
  "functions": {
    "src/app/api/scrape/route.ts": {
      "maxDuration": 300,
      "memory": 512
    }
  },
  "regions": ["icn1"]
}
```

### Next.js 최적화
```typescript
// next.config.ts
{
  output: 'standalone',
  serverExternalPackages: ['cheerio'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        cheerio: false,
      };
    }
    return config;
  },
}
```

### CI/CD 파이프라인
- **자동 배포**: GitHub push 시 자동 빌드/배포
- **테스트 자동화**: 배포 전 자동 빌드 검증
- **롤백**: 문제 발생 시 이전 버전으로 즉시 롤백

---

## 🔮 향후 확장 계획

### Phase 2 기능
- **다양한 사이트 지원**: 네이버 블로그, 티스토리 등
- **출력 형식 확장**: PDF, EPUB, DOCX 지원
- **일괄 처리**: 여러 작가의 글 동시 수집
- **스케줄링**: 정기적 자동 수집

### Phase 3 기능
- **사용자 계정**: 수집 히스토리 저장
- **클라우드 저장**: Google Drive, Dropbox 연동
- **API 제공**: 외부 서비스 연동용 REST API
- **AI 분석**: 수집된 텍스트의 감정 분석, 키워드 추출

### 기술적 개선사항
- **캐싱**: Redis를 활용한 스크래핑 결과 캐싱
- **큐 시스템**: 대용량 작업을 위한 작업 큐 도입
- **데이터베이스**: 사용자 데이터 및 통계 저장용 DB
- **CDN**: 정적 자산 전송 최적화

---

*이 문서는 구현 과정에서 지속적으로 업데이트됩니다.*