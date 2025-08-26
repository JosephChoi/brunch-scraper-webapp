# 프로젝트 구조 (Project Structure)

## 📁 전체 디렉토리 구조

```
brunch-scraper-webapp/
├── docs/                           # 프로젝트 문서
│   ├── PRD.md                      # 제품 요구사항 명세서
│   ├── TECH_SPEC.md                # 기술 명세서
│   ├── API_SPEC.md                 # API 명세서
│   └── IMPLEMENTATION_ROADMAP.md   # 구현 로드맵
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/
│   │   │   └── scrape/
│   │   │       └── route.ts        # 스크래핑 API 엔드포인트
│   │   ├── favicon.ico
│   │   ├── globals.css             # 전역 스타일
│   │   ├── layout.tsx              # 공통 레이아웃
│   │   └── page.tsx                # 메인 페이지
│   ├── components/                 # React 컴포넌트
│   │   ├── ui/                     # 기본 UI 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Progress.tsx
│   │   │   └── Alert.tsx
│   │   ├── ScrapeForm.tsx          # 스크래핑 설정 폼
│   │   ├── ProgressBar.tsx         # 진행률 표시
│   │   └── DownloadButton.tsx      # 파일 다운로드 버튼
│   ├── lib/                        # 비즈니스 로직
│   │   ├── types.ts                # TypeScript 타입 정의
│   │   ├── scraper.ts              # Playwright 스크래핑 엔진
│   │   ├── textProcessor.ts        # 텍스트 처리 로직
│   │   ├── validator.ts            # 입력값 검증
│   │   └── utils.ts                # 유틸리티 함수
│   └── hooks/                      # React 커스텀 훅
│       ├── useScraping.ts          # 스크래핑 상태 관리
│       ├── useDownload.ts          # 파일 다운로드
│       └── useEventSource.ts       # Server-Sent Events
├── tests/                          # Playwright 테스트
├── public/                         # 정적 파일
├── package.json                    # 프로젝트 의존성
├── tsconfig.json                   # TypeScript 설정
├── tailwind.config.ts              # Tailwind CSS 설정
├── eslint.config.mjs               # ESLint 설정
├── playwright.config.ts            # Playwright 설정
├── next.config.ts                  # Next.js 설정
└── README.md                       # 프로젝트 개요
```

## 🎯 아키텍처 원칙

### Frontend (클라이언트)
- **React 19** + **Next.js 15**: 최신 React Server Components 활용
- **TypeScript**: 타입 안정성 보장
- **Tailwind CSS**: 유틸리티 퍼스트 스타일링
- **커스텀 훅**: 상태 관리 및 로직 재사용

### Backend (API Routes)
- **Next.js API Routes**: 서버리스 함수
- **Playwright**: 웹 스크래핑 엔진
- **Server-Sent Events**: 실시간 진행 상황 스트리밍

### 데이터 플로우
```
사용자 입력 → 검증 → API 요청 → 스크래핑 → 텍스트 처리 → 스트리밍 응답 → 파일 다운로드
```

## 📦 의존성 관리

### 운영 의존성 (dependencies)
- `next`: 15.5.0 - React 프레임워크
- `react`: 19.1.0 - UI 라이브러리
- `react-dom`: 19.1.0 - React DOM 렌더링
- `playwright`: ^1.55.0 - 웹 스크래핑

### 개발 의존성 (devDependencies)
- `typescript`: ^5 - 타입 시스템
- `tailwindcss`: ^4 - CSS 프레임워크
- `eslint`: ^9 - 코드 품질 도구
- `@playwright/test`: 테스트 프레임워크

## 🔧 개발 도구

### 코드 품질
- **ESLint**: 코드 스타일 및 품질 검사
- **TypeScript**: 정적 타입 검사
- **Prettier**: 코드 포맷팅 (필요시 추가)

### 테스트
- **Playwright**: E2E 테스트
- **Jest**: 단위 테스트 (필요시 추가)

### 빌드 및 배포
- **Next.js**: 빌드 시스템
- **Vercel**: 배포 플랫폼

## 📝 네이밍 컨벤션

### 파일명
- **컴포넌트**: PascalCase (예: `ScrapeForm.tsx`)
- **훅**: camelCase with 'use' prefix (예: `useScraping.ts`)
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
4. **테스트 실행**: `npm run test`
5. **빌드**: `npm run build`

---

*이 문서는 프로젝트 진행에 따라 지속적으로 업데이트됩니다.*
