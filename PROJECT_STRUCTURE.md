# 프로젝트 구조 (Project Structure)

## 📁 전체 디렉토리 구조

```
brunch-scraper-webapp/
├── docs/                           # 프로젝트 문서
│   ├── PRD.md                      # 제품 요구사항 명세서 (완료)
│   ├── TECH_SPEC.md                # 기술 명세서 (HTTP + Cheerio)
│   ├── API_SPEC.md                 # API 명세서 (SSE 스트리밍)
│   └── IMPLEMENTATION_ROADMAP.md   # 구현 로드맵 (완료)
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/
│   │   │   └── scrape/
│   │   │       └── route.ts        # 스크래핑 API 엔드포인트 (HTTP + Cheerio)
│   │   ├── favicon.ico
│   │   ├── globals.css             # 전역 스타일 (다크 테마)
│   │   ├── layout.tsx              # 공통 레이아웃 (메타데이터 포함)
│   │   ├── page.tsx                # 메인 페이지
│   │   ├── opengraph-image.tsx     # Open Graph 이미지 생성
│   │   └── twitter-image.tsx       # Twitter Card 이미지 생성
│   ├── components/                 # React 컴포넌트
│   │   ├── ui/                     # 기본 UI 컴포넌트
│   │   │   ├── Button.tsx          # 버튼 컴포넌트 (disabled 스타일 포함)
│   │   │   ├── Input.tsx           # 입력 컴포넌트 (다크 테마 최적화)
│   │   │   ├── Card.tsx            # 카드 컴포넌트 (진한 테두리)
│   │   │   └── Progress.tsx        # 진행률 바 (파란색 테마)
│   │   ├── ScrapeForm.tsx          # 스크래핑 설정 폼
│   │   └── BrunchScraperApp.tsx    # 메인 앱 컴포넌트
│   ├── lib/                        # 비즈니스 로직
│   │   ├── types.ts                # TypeScript 타입 정의
│   │   ├── scraper.ts              # HTTP + Cheerio 스크래핑 엔진
│   │   ├── textProcessor.ts        # 텍스트 처리 로직
│   │   ├── validator.ts            # 입력값 검증
│   │   ├── constants.ts            # 상수 정의 (CSS 셀렉터, 제한값 등)
│   │   └── utils.ts                # 유틸리티 함수
│   └── hooks/                      # React 커스텀 훅
│       └── useBrunchScraper.ts     # 스크래핑 상태 관리
├── public/                         # 정적 파일
│   ├── brunch logo.jpg             # 브런치 로고 (파비콘 및 브랜딩용)
│   ├── file.svg                    # 아이콘 파일
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── package.json                    # 프로젝트 의존성 (cheerio 기반)
├── tsconfig.json                   # TypeScript 설정
├── tailwind.config.ts              # Tailwind CSS 설정
├── eslint.config.mjs               # ESLint 설정
├── next.config.ts                  # Next.js 설정 (cheerio 최적화)
├── vercel.json                     # Vercel 배포 설정 (512MB 메모리)
├── PROJECT_STRUCTURE.md            # 이 파일
└── README.md                       # 프로젝트 개요
```

## 🎯 아키텍처 원칙

### Frontend (클라이언트)
- **React 19** + **Next.js 15.5.0**: 최신 React Server Components 활용
- **TypeScript 5.x**: 타입 안정성 보장
- **Tailwind CSS 4.x**: 유틸리티 퍼스트 스타일링 (다크 테마)
- **커스텀 훅**: 상태 관리 및 로직 재사용

### Backend (API Routes)
- **Next.js API Routes**: 서버리스 함수
- **HTTP + Cheerio**: 브라우저 없는 웹 스크래핑
- **Server-Sent Events**: 실시간 진행 상황 스트리밍
- **Googlebot User-Agent**: 브런치 로그인 우회

### 데이터 플로우
```
사용자 입력 → 검증 → API 요청 → HTTP 스크래핑 → HTML 파싱 → 텍스트 처리 → 스트리밍 응답 → 파일 다운로드
```

## 📦 의존성 관리

### 운영 의존성 (dependencies)
- `next`: 15.5.0 - React 프레임워크
- `react`: 19.1.0 - UI 라이브러리
- `react-dom`: 19.1.0 - React DOM 렌더링
- `cheerio`: ^1.1.2 - HTML 파싱 및 DOM 조작
- `@types/cheerio`: ^0.22.35 - Cheerio TypeScript 타입

### 개발 의존성 (devDependencies)
- `typescript`: ^5 - 타입 시스템
- `tailwindcss`: ^4 - CSS 프레임워크
- `eslint`: ^9 - 코드 품질 도구
- `eslint-config-next`: 15.5.0 - Next.js ESLint 설정
- `@types/node`: ^20 - Node.js 타입
- `@types/react`: ^19 - React 타입
- `@types/react-dom`: ^19 - React DOM 타입

## 🔧 개발 도구

### 코드 품질
- **ESLint**: 코드 스타일 및 품질 검사
- **TypeScript**: 정적 타입 검사
- **Next.js 내장 최적화**: 자동 코드 분할, 이미지 최적화

### 빌드 및 배포
- **Next.js**: 빌드 시스템 (`standalone` 출력)
- **Vercel**: 배포 플랫폼 (서버리스)
- **Cheerio 최적화**: 서버 전용 패키지로 클라이언트 번들 제외

## 📝 네이밍 컨벤션

### 파일명
- **컴포넌트**: PascalCase (예: `ScrapeForm.tsx`)
- **훅**: camelCase with 'use' prefix (예: `useBrunchScraper.ts`)
- **유틸리티**: camelCase (예: `validator.ts`)
- **타입**: camelCase (예: `types.ts`)

### 코드
- **변수/함수**: camelCase
- **컴포넌트**: PascalCase  
- **상수**: UPPER_SNAKE_CASE
- **타입/인터페이스**: PascalCase

## 🚀 개발 워크플로

1. **개발 서버 시작**: `npm run dev`
2. **타입 검사**: `npm run type-check`
3. **린트 검사**: `npm run lint`
4. **린트 자동 수정**: `npm run lint:fix`
5. **빌드**: `npm run build`
6. **프로덕션 서버**: `npm run start`

## 🏗️ 핵심 모듈 상세

### 1. 스크래핑 엔진 (`src/lib/scraper.ts`)
```typescript
export class BrunchScraper {
  // HTTP 요청 기반 스크래퍼
  // Googlebot User-Agent 사용
  // Cheerio로 HTML 파싱
}

export async function scrapeMultipleArticles(config: ScrapeConfig): Promise<ScrapeResult>
```

**특징**:
- 브라우저 의존성 없음
- 브런치 로그인 우회
- 실시간 진행 상황 콜백
- 안정적 에러 처리

### 2. API 라우트 (`src/app/api/scrape/route.ts`)
```typescript
export async function POST(request: NextRequest): Promise<NextResponse>
```

**특징**:
- Server-Sent Events 스트리밍
- 실시간 진행 상황 전송
- 입력값 검증
- 오류 처리 및 응답

### 3. 텍스트 처리 (`src/lib/textProcessor.ts`)
```typescript
export function processArticlesForDownload(articles: ArticleData[], config: ProcessingConfig): ProcessedText
```

**특징**:
- HTML 태그 제거
- 메타데이터 포맷팅 (작성일 포함)
- 파일명 생성 (타임스탬프 포함)
- 글 간 구분자 추가

### 4. 상태 관리 (`src/hooks/useBrunchScraper.ts`)
```typescript
export function useBrunchScraper(): {
  startScraping: (config: ScrapingConfig) => Promise<void>;
  isLoading: boolean;
  progress: ScrapingProgress | null;
  state: ScrapingState;
  result: ScrapingResult | null;
  error: string | null;
}
```

**특징**:
- SSE 스트림 처리
- 실시간 상태 업데이트
- 에러 처리
- 파일 다운로드 관리

## ⚙️ 설정 파일 상세

### Next.js 설정 (`next.config.ts`)
```typescript
{
  output: 'standalone',                    // Vercel 최적화
  serverExternalPackages: ['cheerio'],     // 서버 전용 패키지
  webpack: (config, { isServer }) => {    // 클라이언트에서 cheerio 제외
    if (!isServer) {
      config.resolve.fallback = { cheerio: false };
    }
    return config;
  },
}
```

### Vercel 배포 설정 (`vercel.json`)
```json
{
  "functions": {
    "src/app/api/scrape/route.ts": {
      "maxDuration": 300,                  // 5분 최대 실행 시간
      "memory": 512                        // 512MB 메모리 (HTTP 스크래핑 최적화)
    }
  },
  "regions": ["icn1"]                      // 서울 리전
}
```

### 패키지 설정 (`package.json`)
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "type-check": "tsc --noEmit"
  }
}
```

## 🎨 UI/UX 구조

### 컴포넌트 계층
```
BrunchScraperApp (메인)
├── Header (로고 + 제목)
├── ScrapeForm (입력 폼)
│   ├── Input (URL 입력)
│   ├── Input (시작 번호)
│   ├── Input (종료 번호)
│   └── Button (수집 시작)
├── ProgressCard (진행 상황)
│   ├── Progress (진행률 바)
│   └── StatusText (현재 상태)
├── ResultCard (결과)
│   ├── ProgressBar (100% 완료)
│   └── Button (다운로드)
└── Footer (법적 고지)
```

### 스타일링 시스템
- **색상**: 다크 테마 (#161F2F 배경)
- **테두리**: 진한 테두리 (border-2)
- **버튼**: 동적 색상 변경 (조건부 활성화)
- **텍스트**: 가독성 최적화 (흰색/회색 조합)

## 📊 성능 최적화

### 번들 최적화
- **서버 전용 패키지**: cheerio는 클라이언트 번들에서 제외
- **코드 분할**: Next.js 자동 코드 분할
- **이미지 최적화**: Next.js Image 컴포넌트 활용

### 메모리 최적화
- **스트리밍**: 대용량 데이터 스트리밍 처리
- **가비지 컬렉션**: 각 글 처리 후 즉시 메모리 해제
- **제한**: 최대 50개 글로 메모리 사용량 제한

### 네트워크 최적화
- **HTTP 직접 요청**: 브라우저 오버헤드 없음
- **요청 간격**: 2.5초 딜레이로 서버 부하 최소화
- **타임아웃**: 적절한 타임아웃 설정

## 🔒 보안 구조

### 입력 검증
- **클라이언트**: 실시간 URL 패턴 검증
- **서버**: 이중 검증 및 sanitization
- **XSS 방지**: 모든 입력값 이스케이프 처리

### 스크래핑 보안
- **User-Agent**: Googlebot으로 로그인 우회
- **Rate Limiting**: 요청 간격 제어
- **에러 처리**: 안전한 실패 처리

## 📈 모니터링 포인트

### 개발 환경
- **TypeScript**: 컴파일 타임 타입 체크
- **ESLint**: 코드 품질 실시간 검사
- **Next.js Dev**: Hot Reload 및 오류 표시

### 프로덕션 환경
- **Vercel Analytics**: 성능 및 사용량 모니터링
- **로그**: 스크래핑 성공/실패 통계
- **에러 트래킹**: 실시간 오류 모니터링

## 🔄 배포 파이프라인

### 자동 배포 (Vercel)
1. **GitHub Push** → 자동 배포 트리거
2. **빌드 검증** → TypeScript, ESLint 통과 확인
3. **배포 실행** → Vercel 서버리스 환경 배포
4. **상태 확인** → 배포 성공/실패 알림

### 환경 관리
- **개발**: `npm run dev` (localhost:3000)
- **프로덕션**: Vercel 도메인 (서버리스)
- **설정**: 환경별 최적화된 설정 적용

---

## 🎯 프로젝트 현황

### ✅ **완료된 기능**
- HTTP + Cheerio 기반 스크래핑 엔진
- 실시간 진행 상황 스트리밍 (SSE)
- 다크 테마 UI/UX
- 브런치 브랜딩 적용
- Vercel 서버리스 배포
- 법적 고지사항 포함
- 모바일 반응형 지원

### 📊 **기술적 성과**
- **성능**: 글당 1-2초 처리 (HTTP 최적화)
- **안정성**: 512MB 메모리로 50개 글 안정 처리
- **호환성**: 브라우저 의존성 완전 제거
- **확장성**: 서버리스 아키텍처로 자동 스케일링

---

*이 문서는 프로젝트 완료에 따라 최종 업데이트되었습니다.*