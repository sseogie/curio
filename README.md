# PROJECT. CURIO. CITY.

지구본 랜딩 페이지 (GitHub Pages용 정적 사이트)

## 배포
이 폴더 전체를 저장소에 올리고 Settings → Pages → Branch: main / root 로 설정하면 끝.
빌드 과정 없음. index.html을 더블클릭해도 바로 열림.

## 커버 이미지 넣기
`assets/covers/vol-01.jpg` ~ `vol-12.jpg` 이름으로 넣으면 자동 교체 (4:5 비율 권장).

## VOL 추가·수정
`js/data.js`의 `CURIO_VOLS`에 항목 추가. 같은 좌표의 VOL은 마커 하나로 묶임.
새 나라를 방문하면 `CURIO_VISITED`에 국가 ISO 숫자 코드 추가 (예: 한국 410).

## 파일
- index.html / css/style.css / js/main.js — 페이지
- js/data.js — VOL 데이터
- vendor/ — d3, topojson, 세계지도(Natural Earth 50m)
