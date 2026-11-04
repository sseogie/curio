# PROJECT. CURIO. CITY. 사이트 작업 지침

정적 사이트(GitHub Pages, main 자동 배포, 빌드 없음). 한국어로만, 간결하게 답한다. 이 저장소는 공개이므로 전략·가격 등 비공개 내용은 넣지 않는다.

## 구조
- `index.html` · `css/style.css` · `js/main.js`(화면·지구본) · `js/board.js`(전광판) · `js/data.js`(VOL 데이터)
- `assets/vol/` 포스터(1080×1350 JPG), `assets/stamp/` 교통 아이콘, `assets/about/`, `assets/og/` 미리보기
- `vol/NN/` VOL 공유 페이지 — `tools/vol_pages.py`가 생성 (직접 수정 금지)
- `tools/reel/` 릴스 렌더 도구

## 새 VOL 배포 순서
1. 3x JPG(3240×4050)를 1080×1350으로 줄여 `assets/vol/`에 프레임 이름 그대로 저장 (커버·`_review`·`_stamp`)
2. `js/data.js` 수정: `CURIO_VOLS`(vol, title, region, area, place, lat, lon, takenAt, transport, 불확실하면 `warn: true`) · `CURIO_IMAGES` · `CURIO_TRIPS`(여정 순서) · `CURIO_STAMP_CITY` · 새 나라면 `CURIO_VISITED`(ISO 숫자 코드)
3. `python3 tools/vol_pages.py` 실행 (공유 페이지·og 이미지 생성)
4. 캐시 값 갱신: 이미지가 바뀌면 `CURIO_IMG_V`, CSS·JS가 바뀌면 `index.html`의 `?v=` — 형식 `YYYYMMDDHHMM`
5. 로컬 서버로 `#vol-NN` 확인 → main에 push

## 규칙
- 이미지는 민석이 피그마에서 직접 내보내 채팅에 올린다. 좌표·촬영 시각은 원본 사진의 EXIF·GPS에서 읽는다.
- 지구본·좌표 팝업·캔버스 인터랙션은 훼손하지 않는다. 카피 수정은 텍스트·라벨 위주로.
- 카피 톤: 감상적 어조를 피하고 객관적·시스템 중심으로. "AI가 생성했다" 대신 "AI 파이프라인을 직접 디렉팅했다". 사진은 직접 촬영한 것임을 밝힌다.
- 사이트 문구는 영어, 대화는 한국어.
- 디자인 변경은 피그마(`baV4YcBj3ASgLRv9oDGbda`)에서 먼저 시안 → 확인 후 사이트에 반영. 민석이 피그마에서 고친 값(크기·색·줄바꿈)은 그대로 옮긴다.
- 자간은 폰트 기본값에서 +3%를 넘기지 않는다 (CSS `letter-spacing` ≤ .03em, 피그마 ≤ 3%). 여권 도장 SVG 내부 값은 예외.
- 나열은 가운데 점(·) 대신 쉼표로. 단계 번호는 점 없이 `01 GROUND DATA LOGGING`.
- 여러 세션이 같은 저장소에 push한다. push 전 항상 `git pull --rebase`, 충돌 시 남의 변경을 덮어쓰지 않는다.
- 미리보기 아티팩트·zip은 만들지 않는다. 배포는 push만.

## 토큰 아끼기
- `js/data.js`·`main.js`는 통째로 읽지 말고 grep으로 필요한 줄만 본다.
- 확인은 필요한 화면만 스크린샷(전체 페이지 캡처 금지), 변경은 `git diff --stat`로 점검한다.
- 포스터 제작 규칙·성장 전략이 필요할 때만 프로젝트 문서(`curio-작업방식`, `curio-성장-전략서`)를 읽는다. 현재 상태는 `curio-작업-인계`만 먼저 읽는다.
