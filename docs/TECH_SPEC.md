# 기술 명세서 (Technical Specification)
## Brunch Text Scraper

### 📋 개요

브런치 블로그 텍스트 수집기의 상세 기술 구현 명세서입니다.

---

## 🏗️ 시스템 아키텍처

### 전체 구조
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │   Scraper       │
│   (Next.js)     │◄──►│   (Next.js)     │◄──►│   (Playwright)  │
│                 │    │                 │    │                 │
│ - React UI      │    │ - /api/scrape   │    │ - Chromium      │
│ - State Mgmt    │    │ - Validation    │    │ - Text Extract  │
│ - File Download │    │ - Stream resp   │    │ - Error Handle  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 데이터 플로우
```
User Input → Validation → Scraping → Text Processing → File Generation → Download
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
- **Playwright 1.55.0**: 웹 스크래핑
- **Node.js 내장 모듈**: 파일 처리

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
│   └── API_SPEC.md
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/
│   │   │   └── scrape/
│   │   │       └── route.ts # 스크래핑 API
│   │   ├── page.tsx         # 메인 페이지
│   │   ├── layout.tsx       # 공통 레이아웃
│   │   └── globals.css      # 전역 스타일
│   ├── components/          # 재사용 컴포넌트
│   │   ├── ui/              # 기본 UI 컴포넌트
│   │   ├── ScrapeForm.tsx   # 입력 폼
│   │   ├── ProgressBar.tsx  # 진행률 표시
│   │   └── DownloadButton.tsx # 다운로드 버튼
│   ├── lib/                 # 유틸리티 함수
│   │   ├── scraper.ts       # Playwright 스크래핑 로직
│   │   ├── textProcessor.ts # 텍스트 처리
│   │   ├── validator.ts     # 입력값 검증
│   │   └── types.ts         # TypeScript 타입 정의
│   └── hooks/               # React 커스텀 훅
│       └── useScraping.ts   # 스크래핑 상태 관리
├── public/                  # 정적 파일
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

---

## 🔍 핵심 모듈 상세

### 1. 스크래핑 엔진 (`lib/scraper.ts`)

```typescript
interface ScrapeConfig {
  baseUrl: string;      // 브런치 블로그 기본 URL
  startNum: number;     // 시작 글 번호
  endNum: number;       // 종료 글 번호
  onProgress?: (current: number, total: number) => void;
}

interface ScrapeResult {
  success: boolean;
  data?: {
    title: string;
    content: string;
    url: string;
    number: number;
  }[];
  error?: string;
  skippedUrls?: string[];
}
```

**주요 기능**:
- Playwright로 Chromium 브라우저 제어
- 동적 콘텐츠 로딩 대기
- 텍스트 추출 및 정제
- 에러 처리 및 재시도 로직

### 2. 텍스트 처리기 (`lib/textProcessor.ts`)

```typescript
interface ProcessedText {
  content: string;
  metadata: {
    totalArticles: number;
    successCount: number;
    skippedCount: number;
    generatedAt: Date;
  };
}
```

**주요 기능**:
- HTML 태그 제거
- 불필요한 공백/개행 정리
- 글 간 구분자 추가
- 메타데이터 생성

### 3. 입력값 검증기 (`lib/validator.ts`)

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  parsed?: {
    authorId: string;
    baseUrl: string;
    startNum: number;
    endNum: number;
  };
}
```

**검증 규칙**:
- 브런치 URL 형식 확인 (`https://brunch.co.kr/@작가ID/숫자`)
- 숫자 범위 유효성 (1 이상, 시작 ≤ 종료)
- 최대 수집 개수 제한 (100개)

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

**응답 (Streaming)**:
```typescript
// 진행 상황 업데이트
{
  "type": "progress",
  "current": 5,
  "total": 10,
  "url": "https://brunch.co.kr/@ssoojeenlee/295"
}

// 최종 결과
{
  "type": "complete",
  "data": {
    "content": "전체 텍스트 내용...",
    "filename": "brunch_ssoojeenlee_1-10_20250101.txt",
    "metadata": {
      "totalArticles": 10,
      "successCount": 9,
      "skippedCount": 1
    }
  }
}

// 에러 발생
{
  "type": "error",
  "error": "에러 메시지"
}
```

---

## 🎯 성능 최적화

### 스크래핑 최적화
- **요청 간격**: 2-3초 딜레이로 서버 부하 최소화
- **재사용**: 브라우저 인스턴스 재사용으로 오버헤드 감소
- **타임아웃**: 각 페이지별 30초 타임아웃 설정

### 메모리 최적화
- **스트리밍**: 대용량 텍스트 스트리밍 처리
- **가비지 컬렉션**: 사용 완료된 리소스 즉시 해제
- **제한**: 최대 100개 글로 메모리 사용량 제한

### UI 최적화
- **비동기 처리**: 스크래핑 중 UI 블로킹 방지
- **실시간 업데이트**: Server-Sent Events로 진행 상황 실시간 표시
- **에러 바운더리**: React Error Boundary로 안정성 확보

---

## 🔒 보안 고려사항

### 입력값 보안
- **XSS 방지**: 모든 입력값 이스케이프 처리
- **SQL 인젝션**: 외부 DB 미사용으로 해당 없음
- **CSRF**: Next.js 내장 보호 기능 활용

### 스크래핑 보안
- **User-Agent**: 일반 브라우저로 위장
- **헤더 설정**: 정상적인 HTTP 헤더 전송
- **쿠키 관리**: 세션 정보 적절히 관리

### 서버 보안
- **요청 제한**: Rate Limiting으로 남용 방지
- **입력 검증**: 철저한 서버사이드 검증
- **로그 관리**: 민감 정보 로그 제외

---

## 🧪 테스트 전략

### 단위 테스트
- **유틸리티 함수**: validator, textProcessor 함수 테스트
- **컴포넌트**: React 컴포넌트 렌더링 테스트
- **API**: API Route 로직 테스트

### 통합 테스트
- **스크래핑 플로우**: 전체 스크래핑 과정 테스트
- **에러 시나리오**: 네트워크 오류, 잘못된 URL 등
- **성능 테스트**: 대량 데이터 처리 성능 검증

### E2E 테스트
- **사용자 플로우**: 입력부터 다운로드까지 전체 과정
- **브라우저 호환성**: 주요 브라우저별 동작 확인
- **모바일 반응형**: 모바일 기기에서의 사용성 테스트

---

## 📊 모니터링 및 로깅

### 로그 레벨
- **ERROR**: 스크래핑 실패, API 오류
- **WARN**: 일부 글 수집 실패, 느린 응답
- **INFO**: 작업 시작/완료, 성공 통계
- **DEBUG**: 상세 스크래핑 과정 (개발 환경만)

### 메트릭 수집
- **성공률**: 전체 대비 성공한 스크래핑 비율
- **응답 시간**: 평균 처리 시간
- **에러 빈도**: 에러 타입별 발생 빈도
- **사용 패턴**: 인기 있는 브런치 작가, 수집 범위 등

---

## 🚀 배포 및 운영

### 배포 환경
- **플랫폼**: Vercel (서버리스)
- **도메인**: Vercel 제공 도메인 또는 커스텀 도메인
- **환경 변수**: 필요 시 브라우저 설정 등

### CI/CD 파이프라인
- **자동 배포**: Git push 시 자동 빌드/배포
- **테스트 자동화**: 배포 전 자동 테스트 실행
- **롤백**: 문제 발생 시 이전 버전으로 즉시 롤백

### 운영 모니터링
- **Vercel Analytics**: 성능 및 사용량 모니터링
- **에러 트래킹**: 실시간 에러 모니터링
- **업타임 체크**: 서비스 가용성 모니터링

---

## 🔮 향후 확장 계획

### Phase 2 기능
- **다양한 사이트 지원**: 네이버 블로그, 티스토리 등
- **출력 형식 확장**: PDF, EPUB, DOCX 지원
- **일괄 처리**: 여러 작가의 글 동시 수집

### Phase 3 기능
- **사용자 계정**: 수집 히스토리 저장
- **스케줄링**: 정기적 자동 수집
- **API 제공**: 외부 서비스 연동용 API

---

*이 문서는 구현 과정에서 지속적으로 업데이트됩니다.*
