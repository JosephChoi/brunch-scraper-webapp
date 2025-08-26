# Library

이 디렉토리는 비즈니스 로직과 유틸리티 함수들을 포함합니다.

## 파일 목록

```
lib/
├── types.ts            # TypeScript 타입 정의 ✅
├── constants.ts        # 애플리케이션 상수 정의 ✅
├── utils.ts           # 유틸리티 함수 ✅
├── scraper.ts          # Playwright 스크래핑 엔진
├── textProcessor.ts    # 텍스트 추출 및 정제
└── validator.ts        # 입력값 검증 로직
```

## 설계 원칙

- 순수 함수 우선 (side effect 최소화)
- 명확한 타입 정의
- 에러 처리 포함
- 테스트 가능한 구조
