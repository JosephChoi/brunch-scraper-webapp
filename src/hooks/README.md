# Hooks

이 디렉토리는 React 커스텀 훅들을 포함합니다.

## 파일 목록

```
hooks/
├── useScraping.ts      # 스크래핑 상태 관리 훅
├── useDownload.ts      # 파일 다운로드 훅
└── useEventSource.ts   # Server-Sent Events 연결 훅
```

## 훅 설계 가이드라인

- `use` 접두사 사용
- 상태와 액션을 명확히 분리
- 타입 안정성 보장
- 재사용 가능한 로직 추상화
