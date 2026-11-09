// PROJECT CURIO — Volume data
// 포스터는 assets/vol/VOLNN_cover.jpg · _review · _stamp 이름 규칙으로 자동 연결됩니다 (목록 불필요).
// warn: true 는 브랜드 가이드에서 ⚠(확인 필요) 표시된 항목입니다.

window.CURIO_AREAS = {
  vietnam:  { label: "VIETNAM",  center: [103.7749, 22.3033], zoom: 5 },
  japan:    { label: "JAPAN",    center: [138.5, 38.5],       zoom: 4.2 },
  europe:   { label: "EUROPE",   center: [10.5, 49.8],        zoom: 4.2 },
};

// 방문한 국가 (world-atlas ISO numeric id)
window.CURIO_VISITED = ["704", "392", "276", "040", "528"];

window.CURIO_VOLS = [
  { vol: "01", title: "SA PA", region: "LAO CAI, VIETNAM", area: "vietnam",
    place: "FANSIPAN SUMMIT", lat: 22.3033, lon: 103.7749, takenAt: "2024-12-24T11:33", transport: "cable car" },
  { vol: "02", title: "SA PA", region: "LAO CAI, VIETNAM", area: "vietnam",
    place: "FANSIPAN SUMMIT", lat: 22.3033, lon: 103.7749, takenAt: "2024-12-24T11:55", transport: "cable car" },
  { vol: "03", title: "SA PA", region: "LAO CAI, VIETNAM", area: "vietnam",
    place: "FANSIPAN SUMMIT", lat: 22.3033, lon: 103.7749, takenAt: "2024-12-24T12:41", transport: "cable car" },
  { vol: "04", title: "SAPPORO", region: "HOKKAIDO, JAPAN", area: "japan",
    place: "ODORI PARK / SAPPORO TV TOWER", lat: 43.0611, lon: 141.3564, takenAt: "2025-07-01T14:46", transport: "subway" },
  { vol: "05", title: "SAPPORO", region: "HOKKAIDO, JAPAN", area: "japan",
    place: "ODORI PARK / SAPPORO TV TOWER", lat: 43.0611, lon: 141.3564, takenAt: "2025-07-01T14:46", transport: "subway", warn: true },
  { vol: "06", title: "NAKAFURANO", region: "HOKKAIDO, JAPAN", area: "japan",
    place: "FARM TOMITA, NAKAFURANO", lat: 43.4392, lon: 142.4642, takenAt: "2025-06-30T11:40", transport: "bus", warn: true },
  { vol: "07", title: "OTARU", region: "HOKKAIDO, JAPAN", area: "japan",
    place: "OTARU CANAL / IRONAI 2-CHOME", lat: 43.1997, lon: 141.0038, takenAt: "2025-06-29T15:46", transport: "train" },
  { vol: "08", title: "OTARU", region: "HOKKAIDO, JAPAN", area: "japan",
    place: "OTARU BACKSTREET", lat: 43.1907, lon: 141.0021, takenAt: "2025-06-29T17:11", transport: "train", warn: true },
  { vol: "09", title: "BIEI", region: "HOKKAIDO, JAPAN", area: "japan",
    place: "SHIROGANE BLUE POND", lat: 43.4938, lon: 142.6307, takenAt: "2025-06-30T14:09", transport: "bus" },
  { vol: "10", title: "FRANKFURT", region: "HESSE, GERMANY", area: "europe",
    place: "FRANKFURT AIRPORT LONG-DISTANCE STATION", lat: 50.0533, lon: 8.5706, takenAt: "2024-06-20T19:03", transport: "plane" },
  { vol: "11", title: "OSNABRÜCK", region: "LOWER SAXONY, GERMANY", area: "europe",
    place: "EN ROUTE TO OSNABRÜCK HBF", lat: 52.2799, lon: 8.0472, takenAt: "2024-06-22T07:58", transport: "train" },
  { vol: "12", title: "HALLSTATT", region: "UPPER AUSTRIA, AUSTRIA", area: "europe",
    place: "HALLSTATT MARKTPLATZ", lat: 47.5622, lon: 13.6493, takenAt: "2024-07-05T13:44", transport: "train" },
  { vol: "13", title: "HALLSTATT", region: "UPPER AUSTRIA, AUSTRIA", area: "europe",
    place: "SEESTRASSE PENSION HALLBERG", lat: 47.5622, lon: 13.6493, takenAt: "2024-07-05T13:51", transport: "ferry" },
  { vol: "14", title: "ZAANSE SCHANS", region: "NORTH HOLLAND, NETHERLANDS", area: "europe",
    place: "DE HAAL, ZAANSE SCHANS", lat: 52.4741, lon: 4.8167, takenAt: "2024-06-23T13:39", transport: "train" },
  { vol: "15", title: "AMSTERDAM", region: "NORTH HOLLAND, NETHERLANDS", area: "europe",
    place: "JORDAAN DISTRICT, AMSTERDAM", lat: 52.3765, lon: 4.8830, takenAt: "2024-06-22T15:26", transport: "tram" },
  { vol: "16", title: "AMSTERDAM", region: "NORTH HOLLAND, NETHERLANDS", area: "europe",
    place: "DAM SQUARE, AMSTERDAM", lat: 52.3733, lon: 4.8928, takenAt: "2024-06-23T11:13", transport: "tram" },
  { vol: "17", title: "SA PA", region: "LAO CAI, VIETNAM", area: "vietnam",
    place: "CAT CAT VILLAGE, SA PA", lat: 22.3305, lon: 103.8248, takenAt: "2024-12-23T16:27", transport: "motorbike", warn: true },
];

// 다음 목적지 (안내판에 "--.--.--"로 표시). 비워 두면 표시하지 않음
window.CURIO_UPCOMING = [];

// 여정 묶음 (Project 화면) — 순서대로 표시
window.CURIO_TRIPS = [
  { key: "EUROPE",  sub: "GERMANY, NETHERLANDS, AUSTRIA", when: "20.06 — 05.07.2024", vols: ["10", "11", "15", "16", "14", "12", "13"] },
  { key: "VIETNAM", sub: "CAT CAT VILLAGE, FANSIPAN PEAK", when: "23.12 — 24.12.2024", vols: ["17", "01", "02", "03"] },
  { key: "JAPAN",   sub: "HOKKAIDO",          when: "29.06 — 01.07.2025", vols: ["07", "08", "06", "09", "04", "05"] },
];

// 여권 스탬프 하단 지명 (피그마 스탬프와 동일)
window.CURIO_STAMP_CITY = {
  "01": "FANSIPAN/SA PA", "02": "FANSIPAN/SA PA", "03": "FANSIPAN/SA PA",
  "04": "SAPPORO/HOKKAIDO", "05": "SAPPORO/HOKKAIDO", "06": "NAKAFURANO/HKD",
  "07": "OTARU/HOKKAIDO", "08": "OTARU/HOKKAIDO", "09": "BIEI/SHIROGANE",
  "10": "FRANKFURT/MAIN", "11": "OSNABRÜCK HBF", "12": "HALLSTATT/AUSTRIA", "13": "HALLSTATT/AUSTRIA", "14": "ZAANSE SCHANS/NL",
  "15": "AMSTERDAM/JORDAAN", "16": "AMSTERDAM/DAM", "17": "CAT CAT/SA PA",
};

// 캐시 값 — tools/release.py가 이미지 변경을 감지해 자동 갱신
window.CURIO_IMG_V = "202611091302";
