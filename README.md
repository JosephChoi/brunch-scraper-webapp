# 브런치 텍스트 수집기 (Brunch Text Scraper)

브런치(brunch.co.kr)의 글을 수집하여 텍스트 파일로 다운로드할 수 있는 웹 애플리케이션입니다.

## 🌟 주요 기능

- ✅ **브런치 글 수집**: 지정된 범위의 글을 자동으로 수집
- ✅ **실시간 진행률**: 수집 과정을 실시간으로 확인
- ✅ **작성일 포함**: 각 글의 작성일을 함께 수집
- ✅ **텍스트 파일 다운로드**: 수집된 내용을 텍스트 파일로 저장
- ✅ **반응형 UI**: 모바일과 데스크톱에서 모두 사용 가능
- ✅ **다크 테마**: 눈에 편안한 어두운 테마

## 🚀 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Scraping**: Playwright
- **Deployment**: Vercel

## 📦 설치 및 실행

### 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/JosephChoi/brunch-scraper-webapp.git
cd brunch-scraper-webapp

# 의존성 설치
npm install

# Playwright 브라우저 설치
npm run playwright:install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 타입 체크
npm run type-check

# 린팅
npm run lint
```

## 🔧 사용 방법

1. **브런치 URL 입력**: `https://brunch.co.kr/@작가ID` 형태로 입력
2. **범위 설정**: 시작 글 번호와 종료 글 번호 입력 (최대 50개)
3. **수집 시작**: 조건이 맞으면 활성화되는 버튼 클릭
4. **진행률 확인**: 실시간으로 수집 진행 상황 확인
5. **파일 다운로드**: 수집 완료 후 텍스트 파일 다운로드

## ⚙️ Vercel 배포 가이드

### 1. Vercel 배포 준비

이 프로젝트는 Vercel 배포에 최적화되어 있습니다:

- `vercel.json`: Vercel 배포 설정
- `next.config.ts`: Next.js 최적화 설정
- `.vercelignore`: 배포 시 제외할 파일 설정

### 2. 배포 단계

1. **Vercel 계정 연결**
   ```bash
   npx vercel login
   ```

2. **프로젝트 배포**
   ```bash
   npx vercel
   ```

3. **환경 변수 설정** (필요시)
   - Vercel 대시보드에서 환경 변수 설정
   - `NODE_ENV=production` (자동 설정됨)

### 3. 배포 후 확인사항

- ✅ API 라우트 동작 확인 (`/api/scrape`)
- ✅ Playwright 브라우저 실행 확인
- ✅ 파일 다운로드 기능 확인
- ✅ 진행률 스트리밍 확인

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/scrape/        # 스크래핑 API
│   ├── globals.css        # 글로벌 스타일
│   ├── layout.tsx         # 레이아웃 컴포넌트
│   └── page.tsx           # 메인 페이지
├── components/            # React 컴포넌트
│   ├── ui/               # 재사용 가능한 UI 컴포넌트
│   ├── BrunchScraperApp.tsx
│   ├── ScrapeForm.tsx
│   └── ...
├── hooks/                # 커스텀 React 훅
├── lib/                  # 비즈니스 로직
│   ├── scraper.ts        # Playwright 스크래핑 엔진
│   ├── textProcessor.ts  # 텍스트 처리
│   ├── validator.ts      # 입력값 검증
│   └── ...
└── ...
```

## 🛡️ 주의사항

- **지적재산권**: 수집된 콘텐츠의 지적재산권은 원 작성자에게 있습니다
- **사용 책임**: 수집된 정보의 사용에 대한 모든 책임은 사용자에게 있습니다
- **수집 제한**: 최대 50개 글까지 수집 가능합니다
- **네트워크**: 안정적인 네트워크 환경에서 사용하세요

## 📝 라이선스

이 프로젝트는 개인 사용 목적으로 제작되었습니다.

## 🤝 기여하기

버그 리포트나 기능 제안은 GitHub Issues를 통해 제출해 주세요.

---

**⚠️ 법적 고지**: 이 도구는 교육 및 개인 사용 목적으로만 제작되었습니다. 수집된 콘텐츠의 사용은 해당 플랫폼의 이용약관과 저작권법을 준수해야 합니다.