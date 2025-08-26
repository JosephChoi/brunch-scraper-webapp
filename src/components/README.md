# Components

이 디렉토리는 React 컴포넌트들을 포함합니다.

## 구조

```
components/
├── ui/                    # 기본 UI 컴포넌트 ✅
│   ├── Button.tsx         # 재사용 버튼 컴포넌트 ✅
│   ├── Input.tsx          # 입력 필드 컴포넌트 ✅
│   ├── Card.tsx           # 카드 레이아웃 컴포넌트 ✅
│   ├── Progress.tsx       # 진행률 바 컴포넌트 ✅
│   ├── Alert.tsx          # 알림 메시지 컴포넌트 ✅
│   └── index.ts          # UI 컴포넌트 통합 export ✅
├── ScrapeForm.tsx         # 스크래핑 설정 폼 ✅
├── ProgressBar.tsx        # 진행률 표시 컴포넌트 ✅
├── DownloadButton.tsx     # 파일 다운로드 버튼 ✅
└── index.ts              # 컴포넌트 통합 export ✅
```

## 컴포넌트 가이드라인

- 모든 컴포넌트는 TypeScript로 작성
- Props 인터페이스를 명확하게 정의
- 재사용 가능한 UI 컴포넌트는 `ui/` 폴더에 배치
- 비즈니스 로직이 포함된 컴포넌트는 루트에 배치
