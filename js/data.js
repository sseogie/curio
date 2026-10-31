// PROJECT CURIO — Volume data
// 커버 이미지는 assets/covers/vol-NN.jpg 로 넣으면 자동으로 표시됩니다.
// warn: true 는 브랜드 가이드에서 ⚠(확인 필요) 표시된 항목입니다.

window.CURIO_AREAS = {
  vietnam:  { label: "VIETNAM",  center: [103.7749, 22.3033], zoom: 5 },
  japan:    { label: "JAPAN",    center: [138.5, 38.5],       zoom: 4.2 },
  europe:   { label: "EUROPE",   center: [10.5, 49.8],        zoom: 4.2 },
};

// 방문한 국가 (world-atlas ISO numeric id)
window.CURIO_VISITED = ["704", "392", "276", "040"];

window.CURIO_VOLS = [
  { vol: "01", title: "FANSIPAN", region: "FANSIPAN PEAK, VIETNAM", area: "vietnam",
    place: "FANSIPAN SUMMIT", lat: 22.3033, lon: 103.7749, takenAt: "2024-12-24T11:33", transport: "cable car" },
  { vol: "02", title: "FANSIPAN", region: "FANSIPAN PEAK, VIETNAM", area: "vietnam",
    place: "FANSIPAN SUMMIT", lat: 22.3033, lon: 103.7749, takenAt: "2024-12-24T11:55", transport: "cable car" },
  { vol: "03", title: "FANSIPAN", region: "FANSIPAN PEAK, VIETNAM", area: "vietnam",
    place: "FANSIPAN SUMMIT", lat: 22.3033, lon: 103.7749, takenAt: "2024-12-24T12:41", transport: "cable car" },
  { vol: "04", title: "SAPPORO", region: "HOKKAIDO, JAPAN", area: "japan",
    place: "ODORI PARK / SAPPORO TV TOWER", lat: 43.0611, lon: 141.3564, takenAt: "2025-07-01T14:46", transport: "subway" },
  { vol: "05", title: "SAPPORO", region: "HOKKAIDO, JAPAN", area: "japan",
    place: "ODORI PARK / SAPPORO TV TOWER", lat: 43.0611, lon: 141.3564, takenAt: "2025-07-01T14:46", transport: "subway", warn: true },
  { vol: "06", title: "BIEI TOWN", region: "HOKKAIDO, JAPAN", area: "japan",
    place: "FARM TOMITA, NAKAFURANO", lat: 43.4392, lon: 142.4642, takenAt: "2025-06-30T11:40", transport: "bus", warn: true },
  { vol: "07", title: "OTARU", region: "HOKKAIDO, JAPAN", area: "japan",
    place: "OTARU CANAL / IRONAI 2-CHOME", lat: 43.1997, lon: 141.0038, takenAt: "2025-06-29T15:46", transport: "train" },
  { vol: "08", title: "OTARU", region: "HOKKAIDO, JAPAN", area: "japan",
    place: "OTARU BACKSTREET", lat: 43.1907, lon: 141.0021, takenAt: "2025-06-29T17:11", transport: "train", warn: true },
  { vol: "09", title: "BLUE POND", region: "HOKKAIDO, JAPAN", area: "japan",
    place: "SHIROGANE BLUE POND", lat: 43.4938, lon: 142.6307, takenAt: "2025-06-30T14:09", transport: "bus" },
  { vol: "10", title: "FRANKFURT", region: "HESSE, GERMANY", area: "europe",
    place: "FRANKFURT AIRPORT LONG-DISTANCE STATION", lat: 50.0533, lon: 8.5706, takenAt: "2024-06-20T19:03", transport: "plane" },
  { vol: "11", title: "OSNABRÜCK", region: "LOWER SAXONY, GERMANY", area: "europe",
    place: "EN ROUTE TO OSNABRÜCK HBF", lat: 52.2799, lon: 8.0472, takenAt: "2024-06-22T07:58", transport: "train" },
  { vol: "12", title: "HALLSTATT", region: "UPPER AUSTRIA, AUSTRIA", area: "europe",
    place: "HALLSTATT MARKTPLATZ", lat: 47.5622, lon: 13.6493, takenAt: "2024-07-05T13:44", transport: "train" },
  { vol: "13", title: "HALLSTATT", region: "UPPER AUSTRIA, AUSTRIA", area: "europe",
    place: "SEESTRASSE PENSION HALLBERG", lat: 47.5622, lon: 13.6493, takenAt: "2024-07-05T13:51", transport: "ferry" },
];

// 다음 목적지 (안내판에 시간 "--:--"으로 표시, 첫 번째가 강조)
window.CURIO_UPCOMING = ["TOKYO", "OSAKA", "KYOTO"];
// 다음 목적지 좌표 [경도, 위도] — 지구본에 점선 빈 핀으로 표시
window.CURIO_UPCOMING_AT = { TOKYO: [139.6917, 35.6895], OSAKA: [135.5023, 34.6937], KYOTO: [135.7681, 35.0116] };

// VOL별 이미지 (피그마 프레임 이름 그대로 내보낸 JPG → assets/vol/ 폴더)
// 순서: [커버, 리뷰, 스탬프 지도]
window.CURIO_IMAGES = {
  "01": ["FANSIPAN_1", "FANSIPAN_1_REVIEW", "FANSIPAN_1_stamp"],
  "02": ["FANSIPAN_2", "FANSIPAN_2_REVIEW", "FANSIPAN_2_stamp"],
  "03": ["fansipan_3", "fansipan_3_review", "fansipan_3_stamp"],
  "04": ["SAPPORO_1", "SAPPORO_1_REVIEW", "SAPPORO_1_stamp"],
  "05": ["SAPPORO_2", "SAPPORO_2_REVIEW", "SAPPORO_2_stamp"],
  "06": ["BIEI TOWN_1", "BIEI TOWN_1_REVIEW", "BIEI TOWN_1_stamp"],
  "07": ["OTARU_1", "OTARU_1_REVIEW", "OTARU_1_stamp"],
  "08": ["sapporo_4", "sapporo_4_review", "sapporo_4_stamp"],
  "09": ["blue1", "blue2", "blue1_stamp"],
  "10": ["frankfurt_1", "frankfurt_1_review", "frankfurt_stamp"],
  "11": ["osnabruck_1", "osnabruck_1_review", "osnabruck_1_stamp"],
  "12": ["HALLSTATT_1", "HALLSTATT_1_review", "HALLSTATT_1_stamp"],
  "13": ["HALLSTATT_2", "HALLSTATT_2_review", "HALLSTATT_2_stamp"],
};

// 여정 묶음 (Project 화면) — 순서대로 표시
window.CURIO_TRIPS = [
  { key: "EUROPE",  sub: "GERMANY · AUSTRIA", when: "20.06 — 05.07.2024", vols: ["10", "11", "12", "13"] },
  { key: "VIETNAM", sub: "FANSIPAN PEAK",     when: "24.12.2024",         vols: ["01", "02", "03"] },
  { key: "JAPAN",   sub: "HOKKAIDO",          when: "29.06 — 01.07.2025", vols: ["07", "08", "06", "09", "04", "05"] },
];

// 여권 스탬프 하단 지명 (피그마 스탬프와 동일)
window.CURIO_STAMP_CITY = {
  "01": "FANSIPAN/SA PA", "02": "FANSIPAN/SA PA", "03": "FANSIPAN/SA PA",
  "04": "SAPPORO/HOKKAIDO", "05": "SAPPORO/HOKKAIDO", "06": "NAKAFURANO/HKD",
  "07": "OTARU/HOKKAIDO", "08": "OTARU/HOKKAIDO", "09": "BIEI/SHIROGANE",
  "10": "FRANKFURT/MAIN", "11": "OSNABRÜCK HBF", "12": "HALLSTATT/AUSTRIA", "13": "HALLSTATT/AUSTRIA",
};
