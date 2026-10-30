(() => {
  const VOLS = window.CURIO_VOLS;
  const AREAS = window.CURIO_AREAS;
  const VISITED = new Set(window.CURIO_VISITED);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ───────── helpers ─────────
  const $ = (s) => document.querySelector(s);
  const fmtCoord = (lat, lon) => {
    const la = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}`;
    const lo = `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "W"}`;
    return `${la} · ${lo}`;
  };
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const fmtDate = (iso) => {
    if (!iso) return "—";
    const [d] = iso.split("T"); const [y, m, day] = d.split("-").map(Number);
    return `${MONTHS[m - 1]} ${day}, ${y}`;
  };
  const fmtTime = (iso) => (iso ? iso.split("T")[1] : "--:--");
  const wrapLon = (l) => ((l + 540) % 360) - 180;

  function fillCover(el, v) {
    el.classList.remove("has-img");
    el.innerHTML = `<span class="ph">vol-${v.vol}.jpg</span><span class="matte"></span>`;
    const img = new Image();
    img.alt = `${v.title} — VOL. ${v.vol} cover`;
    img.decoding = "async";
    img.onload = () => { if (el.dataset.vol === v.vol) { el.prepend(img); el.classList.add("has-img"); } };
    img.onerror = () => {};
    el.dataset.vol = v.vol;
    img.src = `assets/covers/vol-${v.vol}.jpg`;
  }

  // 같은 좌표의 VOL은 하나의 마커로 묶음
  const groups = [];
  VOLS.forEach((v) => {
    let g = groups.find((g) => g.lat === v.lat && g.lon === v.lon);
    if (!g) { g = { lat: v.lat, lon: v.lon, vols: [] }; groups.push(g); }
    g.vols.push(v);
  });
  const groupOf = (v) => groups.find((g) => g.vols.includes(v));

  // ───────── globe setup ─────────
  const svg = d3.select("#globe");
  const projection = d3.geoOrthographic().clipAngle(90).precision(0.4);
  const path = d3.geoPath(projection);

  const world = window.WORLD;
  const countries = topojson.feature(world, world.objects.countries).features;
  const landFC = { type: "FeatureCollection", features: countries.filter((f) => !VISITED.has(f.id)) };
  const visitedFC = { type: "FeatureCollection", features: countries.filter((f) => VISITED.has(f.id)) };
  const graticule = d3.geoGraticule10();

  // 여행 동선: 촬영 시각 순서
  const firstTime = (g) => g.vols.map((v) => v.takenAt).filter(Boolean).sort()[0] || "9";
  const route = groups.slice().sort((a, b) => firstTime(a).localeCompare(firstTime(b)));
  const routeLine = { type: "LineString", coordinates: route.map((g) => [g.lon, g.lat]) };

  const defs = svg.append("defs");
  // 구체 입체감: 좌상단 하이라이트 + 가장자리 어둡게
  const shade = defs.append("radialGradient").attr("id", "shade").attr("cx", "34%").attr("cy", "28%").attr("r", "78%");
  [[0, "#F5FFFE", .6], [.4, "#F5FFFE", .1], [1, "#F5FFFE", 0]]
    .forEach(([o, c, a]) => shade.append("stop").attr("offset", o).attr("stop-color", c).attr("stop-opacity", a));
  const drop = defs.append("filter").attr("id", "drop").attr("x", "-20%").attr("y", "-20%").attr("width", "140%").attr("height", "150%");
  drop.append("feDropShadow").attr("dx", 0).attr("dy", 24).attr("stdDeviation", 28).attr("flood-color", "#2C4A47").attr("flood-opacity", .16);
  const pillShadow = defs.append("filter").attr("id", "pill").attr("x", "-30%").attr("y", "-50%").attr("width", "160%").attr("height", "220%");
  pillShadow.append("feDropShadow").attr("dx", 0).attr("dy", 2).attr("stdDeviation", 3).attr("flood-color", "#2C4A47").attr("flood-opacity", .14);

  // 확대는 원형 렌즈 안에서만 — 지구본 외곽 크기는 고정
  const lensClip = defs.append("clipPath").attr("id", "lens").append("circle");
  const sphereBg = svg.append("circle").attr("class", "sphere");
  const lens = svg.append("g").attr("clip-path", "url(#lens)");
  const gratP = lens.append("path").attr("class", "graticule");
  const landP = lens.append("path").attr("class", "land");
  const visitedP = lens.append("path").attr("class", "land visited");
  const routeP = lens.append("path").attr("class", "route");
  const legP = lens.append("path").attr("class", "route-leg");
  const shadeC = svg.append("circle").attr("class", "shade").attr("fill", "url(#shade)");
  const markerLayer = svg.append("g");
  const labelLayer = svg.append("g");
  const pulseC = svg.append("circle").attr("class", "pulse").attr("r", 0).attr("opacity", 0);

  let pick = (g) => select(g.vols[g.vols.length - 1], true);
  const onKey = (e, g) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(g); } };

  const markers = markerLayer.selectAll("g.marker").data(groups).join("g")
    .attr("class", "marker")
    .attr("tabindex", 0)
    .attr("role", "button")
    .attr("aria-label", (g) => `${g.vols[0].title}, VOL. ${g.vols.map((v) => v.vol).join(", ")}`)
    .on("click", (e, g) => pick(g))
    .on("keydown", onKey);
  markers.append("circle").attr("class", "hit").attr("r", 18);
  markers.append("circle").attr("class", "dot");

  const volText = (g) => g.vols.length > 1 ? `${g.vols[0].vol}–${g.vols[g.vols.length - 1].vol}` : g.vols[0].vol;
  const labels = labelLayer.selectAll("g.label").data(groups).join("g")
    .attr("class", "label")
    .attr("aria-hidden", "true")
    .on("click", (e, g) => pick(g));
  labels.append("rect").attr("class", "pill").attr("filter", "url(#pill)");
  labels.append("text").attr("class", "pill-name").attr("x", 12).attr("y", 15).text((g) => g.vols[0].title);
  labels.each(function (g) {
    const el = d3.select(this);
    const w = el.select(".pill-name").node().getComputedTextLength();
    g._pw = 12 + w + 12;
    el.select(".pill").attr("width", g._pw).attr("height", 24).attr("rx", 12);
  });

  // ───────── state ─────────
  let size = 0, base = 0, k = 1;
  let rotate = [-127, -37, 0];           // 시작: 한국 쪽
  let selected = null;

  function resize() {
    const r = svg.node().getBoundingClientRect();
    size = r.width;
    base = size / 2 - 2;
    svg.attr("viewBox", `0 0 ${size} ${size}`);
    render();
  }

  function render() {
    projection.scale(base * k).translate([size / 2, size / 2]).rotate(rotate);
    gratP.attr("d", path(graticule));
    landP.attr("d", path(landFC));
    visitedP.attr("d", path(visitedFC));
    routeP.attr("d", path(routeLine));
    [lensClip, sphereBg, shadeC].forEach((c) => c.attr("cx", size / 2).attr("cy", size / 2).attr("r", base));

    const center = [-rotate[0], -rotate[1]];
    const selG = selected && groupOf(selected);

    // 선택한 곳으로 오기 직전 구간만 강조
    const i = selG ? route.indexOf(selG) : -1;
    legP.attr("d", i > 0 ? path({ type: "LineString", coordinates: [[route[i - 1].lon, route[i - 1].lat], [selG.lon, selG.lat]] }) : null);

    const pos = new Map();
    markers.each(function (g) {
      const el = d3.select(this);
      const [x, y] = projection([g.lon, g.lat]);
      const visible = d3.geoDistance([g.lon, g.lat], center) < Math.PI / 2 - 0.02
        && Math.hypot(x - size / 2, y - size / 2) < base - 6;
      if (!visible) { el.attr("display", "none"); return; }
      pos.set(g, [x, y]);
      el.attr("display", null).attr("transform", `translate(${x},${y})`);
      el.select(".dot").attr("r", g === selG ? 11 : 4.5);
      el.classed("is-selected", g === selG);
    });

    // 라벨: 선택된 곳 먼저, 겹치면 숨김
    const placed = [];
    const order = groups.slice().sort((a, b) => (b === selG) - (a === selG) || b.vols[0].vol.localeCompare(a.vols[0].vol));
    order.forEach((g) => {
      const el = labels.filter((d) => d === g);
      const p = pos.get(g);
      if (!p) { el.attr("display", "none"); return; }
      const off = g === selG ? 16 : 10;
      const box = { x: p[0] + off, y: p[1] - off - 24, w: g._pw, h: 24 };
      const hit = placed.some((b) => box.x < b.x + b.w + 4 && b.x < box.x + box.w + 4 && box.y < b.y + b.h + 4 && b.y < box.y + box.h + 4);
      if (hit) { el.attr("display", "none"); return; }
      placed.push(box);
      el.attr("display", null).attr("transform", `translate(${box.x},${box.y})`).classed("is-selected", g === selG);
    });

    if (selG && pos.get(selG)) pulseC.attr("cx", pos.get(selG)[0]).attr("cy", pos.get(selG)[1]);

    if (!selected) setCoord(-rotate[1], wrapLon(-rotate[0]));
    trackHeading([wrapLon(-rotate[0]), -rotate[1]]);
  }

  // 회전·줌 이동 (한 번만, 조용하게)
  function flyTo(lon, lat, toK = k, dur = 1200) {
    svg.interrupt("fly");
    const from = [-rotate[0], -rotate[1]];
    const geo = d3.geoInterpolate(from, [lon, lat]);
    const kInt = d3.interpolate(k, toK);
    if (reduceMotion) dur = 0;
    return new Promise((resolve) => {
      if (!dur) { rotate = [-lon, -lat, 0]; k = toK; render(); resolve(); return; }
      svg.transition("fly").duration(dur).ease(d3.easeCubicInOut).tween("fly", () => (t) => {
        const [lo, la] = geo(t);
        rotate = [-lo, -la, 0]; k = kInt(t); render();
      }).on("end", resolve).on("interrupt", resolve);
    });
  }

  function pulse() {
    if (reduceMotion) return;
    pulseC.interrupt().attr("r", 11).attr("opacity", 0.9)
      .transition().duration(900).ease(d3.easeCubicOut).attr("r", 40).attr("opacity", 0);
  }

  // ───────── left info / seal / right photo ─────────
  const TZ = { vietnam: "UTC+7", japan: "UTC+9", europe: "UTC+2" };
  const country = (v) => v.region.split(",").pop().trim();
  const coordParts = (lat, lon) => [
    `${Math.abs(lat).toFixed(4)} ${lat >= 0 ? "N" : "S"}`,
    `${Math.abs(lon).toFixed(4)} ${lon >= 0 ? "E" : "W"}`,
  ];
  function setCoord(lat, lon) {
    const [a, b] = coordParts(lat, lon);
    $("#coord-lat").textContent = a;
    $("#coord-lon").textContent = b;
  }

  // 좌표 씰: 바깥 링 텍스트 + 정사영 미니 글로브
  const landAll = { type: "FeatureCollection", features: countries };
  function drawSeal(v) {
    // Figma "coordinate seal" (263px) → viewBox 0..263
    const seal = d3.select("#seal");
    seal.selectAll("*").remove();
    const s = seal.append("svg").attr("viewBox", "0 0 263 263").attr("aria-hidden", "true");
    const id = `s${v.vol}`, C = 131.5;
    const d = s.append("defs");
    d.append("path").attr("id", `${id}-t`).attr("d", `M ${C - 100} ${C} A 100 100 0 0 1 ${C + 100} ${C}`);
    d.append("path").attr("id", `${id}-b`).attr("d", `M ${C - 113} ${C} A 113 113 0 0 0 ${C + 113} ${C}`);
    d.append("clipPath").attr("id", `${id}-c`).append("circle").attr("cx", C).attr("cy", C).attr("r", 79.5);
    s.append("circle").attr("class", "seal-outer").attr("cx", C).attr("cy", C).attr("r", 130.3);
    s.append("circle").attr("class", "seal-inner").attr("cx", C).attr("cy", C).attr("r", 95.5);
    const lat = `${Math.abs(v.lat).toFixed(4)}° ${v.lat >= 0 ? "N" : "S"}`;
    const lon = `${Math.abs(v.lon).toFixed(4)}° ${v.lon >= 0 ? "E" : "W"}`;
    s.append("text").attr("class", "seal-text").append("textPath").attr("href", `#${id}-t`).attr("startOffset", "50%").text(`${v.title} · ${country(v)}`);
    s.append("text").attr("class", "seal-text").append("textPath").attr("href", `#${id}-b`).attr("startOffset", "50%").text(`${lat} · ${lon}`);
    s.append("circle").attr("class", "seal-dot").attr("cx", 18.5).attr("cy", C).attr("r", 3.5);
    s.append("circle").attr("class", "seal-dot").attr("cx", 245.5).attr("cy", C).attr("r", 3.5);
    const pj = d3.geoOrthographic().scale(79.5).translate([C, C]).rotate([-v.lon, -v.lat]).clipAngle(90);
    const pp = d3.geoPath(pj);
    const gl = s.append("g").attr("clip-path", `url(#${id}-c)`);
    gl.append("circle").attr("class", "seal-sea").attr("cx", C).attr("cy", C).attr("r", 79.5);
    gl.append("path").attr("class", "seal-land").attr("d", pp(landAll));
    gl.append("path").attr("class", "seal-grat").attr("d", pp(d3.geoGraticule().step([20, 20])()));
    gl.append("path").attr("class", "seal-cross").attr("d", `M${C} ${C - 79.5}V${C + 79.5}M${C - 79.5} ${C}H${C + 79.5}`);
    s.append("circle").attr("class", "seal-globe").attr("cx", C).attr("cy", C).attr("r", 79.5);
    s.append("circle").attr("class", "seal-center").attr("cx", C).attr("cy", C).attr("r", 4);
  }

  // 미탐색 상태의 나침반 (Figma "compass", 263px)
  function drawCompass() {
    const C = 131.5;
    let ticks = "";
    for (let d = 0; d < 360; d += 5) {
      const major = d % 90 === 0, mid = d % 30 === 0;
      const r2 = major ? 64 : mid ? 70 : 74.5;
      const a = (d - 90) * Math.PI / 180;
      ticks += `<line x1="${(C + 79.5 * Math.cos(a)).toFixed(2)}" y1="${(C + 79.5 * Math.sin(a)).toFixed(2)}" x2="${(C + r2 * Math.cos(a)).toFixed(2)}" y2="${(C + r2 * Math.sin(a)).toFixed(2)}" class="cp-tick${major || mid ? "" : " minor"}" stroke-width="${major ? 1.8 : mid ? 1.4 : 1}"/>`;
    }
    const dir = [["N", 0], ["E", 90], ["S", 180], ["W", 270]].map(([l, d]) => {
      const a = (d - 90) * Math.PI / 180;
      return `<text class="cp-dir" x="${(C + 113 * Math.cos(a)).toFixed(2)}" y="${(C + 113 * Math.sin(a)).toFixed(2)}">${l}</text>`;
    }).join("");
    $("#seal").innerHTML = `<svg viewBox="0 0 263 263" aria-hidden="true">
      <circle class="seal-outer" cx="${C}" cy="${C}" r="130.3"/>
      <circle class="seal-inner" cx="${C}" cy="${C}" r="95.5"/>
      <circle class="seal-sea" cx="${C}" cy="${C}" r="79.5"/>
      <g id="cp-card" transform="rotate(${-cpHeading} ${C} ${C})">
      <path class="seal-cross" d="M${C} ${C - 79.5}V${C + 79.5}M${C - 79.5} ${C}H${C + 79.5}"/>
      ${ticks}
      <path class="cp-north" d="M${C} ${C - 58}L${C + 9} ${C}L${C - 9} ${C}Z"/>
      <path class="cp-south" d="M${C} ${C + 58}L${C + 9} ${C}L${C - 9} ${C}Z"/>
      ${dir}
      </g>
      <circle class="seal-globe" cx="${C}" cy="${C}" r="79.5"/>
      <circle class="seal-center" cx="${C}" cy="${C}" r="4"/>
    </svg>`;
  }

  // 나침반: 지구본을 돌리는 방향(진행 방위)으로 카드가 회전 — 바늘은 늘 북쪽
  let cpHeading = 0, cpTarget = 0, cpRaf = 0, lastCenter = null;
  function bearing([lon1, lat1], [lon2, lat2]) {
    const r = Math.PI / 180, f1 = lat1 * r, f2 = lat2 * r, dl = (lon2 - lon1) * r;
    const y = Math.sin(dl) * Math.cos(f2);
    const x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
    return (Math.atan2(y, x) / r + 360) % 360;
  }
  function cpApply() {
    const card = document.getElementById("cp-card");
    if (card) card.setAttribute("transform", `rotate(${-cpHeading} 131.5 131.5)`);
  }
  function cpTick() {
    const diff = ((cpTarget - cpHeading + 540) % 360) - 180;
    if (Math.abs(diff) < 0.1) { cpHeading = cpTarget; cpApply(); cpRaf = 0; return; }
    cpHeading = (cpHeading + diff * 0.12 + 360) % 360;
    cpApply();
    cpRaf = requestAnimationFrame(cpTick);
  }
  function trackHeading(center) {
    if (lastCenter && d3.geoDistance(lastCenter, center) > 0.0004) {
      cpTarget = bearing(lastCenter, center);
      if (reduceMotion) { cpHeading = cpTarget; cpApply(); }
      else if (!cpRaf) cpRaf = requestAnimationFrame(cpTick);
    }
    lastCenter = center;
  }

  // ───────── 출발 안내판 ─────────
  const css = getComputedStyle(document.documentElement);
  const INK_TEXT = css.getPropertyValue("--text").trim() || "#42645F";
  const ACCENT = css.getPropertyValue("--accent").trim() || "#C8735A";
  const OFF = "rgba(66, 100, 95, 0.09)";
  const stampDate = (iso) => { if (!iso) return "--.--.--"; const [y, m, d] = iso.split("T")[0].split("-"); return `${d}.${m}.${y.slice(2)}`; };
  const UPCOMING = window.CURIO_UPCOMING || [];
  const boardRows = [
    ...route.filter((g, i) => route.findIndex((h) => h.vols[0].title === g.vols[0].title) === i)
      .map((g) => ({ date: stampDate(firstTime(g) === "9" ? null : firstTime(g)), dest: g.vols[0].title })),
    ...UPCOMING.map((d) => ({ date: "--.--.--", dest: d, next: d === UPCOMING[0] })),
  ];
  const board = new DotBoard($("#board-canvas"), { rows: boardRows.length, lit: INK_TEXT, off: OFF });
  const volRow = new DotBoard($("#vol-row"), { rows: 1, lit: INK_TEXT, off: OFF });
  $("#board-list").innerHTML = boardRows.map((r) => `<li>${r.date} ${r.dest}</li>`).join("");
  let order = boardRows.slice(), boardTimer = 0;
  const paintBoard = (animate) => board.set(
    order.map((r) => DotBoard.fmt(r.date, r.dest)),
    order.map((r) => (r.next ? ACCENT : INK_TEXT)),
    animate
  );
  paintBoard(false);
  // 공항 전광판처럼: 맨 윗줄이 떠나고 나머지가 한 칸씩 올라감
  const BOARD_INTERVAL = 2200;
  const advance = () => { order.push(order.shift()); paintBoard(true); };
  function startBoard() {
    $("#board").hidden = false;
    board.resize();
    if (boardTimer) return;
    advance(); // 미탐색으로 바뀌는 즉시 한 번 넘김
    boardTimer = setInterval(() => { if (!document.hidden) advance(); }, BOARD_INTERVAL);
  }
  function stopBoard() {
    $("#board").hidden = true;
    clearInterval(boardTimer); boardTimer = 0;
  }

  function showIdle() {
    $("#place").textContent = "PREPARING TO EXPLORE";
    drawCompass();
    $("#seal").hidden = false;
    startBoard();
    $("#photo").hidden = true;
  }

  function showVol(v) {
    $("#place").textContent = `${v.title}, ${country(v)}`;
    setCoord(v.lat, v.lon);
    drawSeal(v);
    $("#seal").hidden = false;
    fillCover($("#photo-cover"), v);
    volRow.set([DotBoard.fmt(stampDate(v.takenAt), v.title)], [INK_TEXT], true);
    $("#vol-row").setAttribute("aria-label", `${fmtDate(v.takenAt)} ${v.title}`);
    stopBoard();
    $("#detail").href = `#vol-${v.vol}`;
    $("#detail").setAttribute("aria-label", `View detail of VOL. ${v.vol} ${v.title}`);
    $("#photo").hidden = false;
  }

  function select(v, fly) {
    const prevGroup = selected && groupOf(selected);
    selected = v;
    const g = groupOf(v);
    showVol(v);
    document.querySelectorAll(".areas button").forEach((b) => b.setAttribute("aria-pressed", "false"));
    render();
    if (fly && prevGroup !== g) {
      const zoomTo = Math.max(k, AREAS[v.area].zoom * 0.75);
      flyTo(g.lon, g.lat, zoomTo).then(pulse);
    }
  }

  function deselect() {
    if (!selected) return;
    selected = null;
    showIdle();
    render();
  }

  // 선택한 곳이 화면 중심에서 멀어지면 "탐험 준비 중" 상태로
  function checkDrift() {
    if (!selected) return;
    const g = groupOf(selected);
    const p = projection([g.lon, g.lat]);
    const center = [-rotate[0], -rotate[1]];
    const far = d3.geoDistance([g.lon, g.lat], center) > Math.PI / 2 - 0.05
      || Math.hypot(p[0] - size / 2, p[1] - size / 2) > base * 0.45;
    if (far) deselect();
  }

  // ───────── interaction ─────────
  svg.call(d3.drag()
    .on("start", () => { svg.interrupt("fly"); svg.classed("dragging", true); })
    .on("drag", (e) => {
      const deg = 180 / (Math.PI * base * k);   // 화면 1px당 각도
      rotate = [rotate[0] + e.dx * deg, Math.max(-89, Math.min(89, rotate[1] - e.dy * deg)), 0];
      render();
      checkDrift();
    })
    .on("end", () => svg.classed("dragging", false)));

  // Ctrl/⌘ + 휠로만 확대 (페이지 스크롤은 막지 않음)
  svg.on("wheel", (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    k = Math.max(1, Math.min(28, k * Math.exp(-e.deltaY * 0.002)));
    render();
  }, { passive: false });

  document.querySelectorAll("[data-zoom]").forEach((b) => b.addEventListener("click", () => {
    const next = Math.max(1, Math.min(28, b.dataset.zoom === "in" ? k * 1.6 : k / 1.6));
    flyTo(-rotate[0], -rotate[1], next, 300);
  }));

  document.querySelectorAll(".areas button").forEach((b) => b.addEventListener("click", () => {
    const key = b.dataset.area;
    deselect();
    document.querySelectorAll(".areas button").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    if (key === "world") flyTo(-rotate[0], 20, 1);
    else { const a = AREAS[key]; flyTo(a.center[0], a.center[1], a.zoom); }
  }));

  // ───────── Project: ARRIVAL COMPLETE 카드 ─────────
  const cards = $("#cards");
  VOLS.forEach((v) => {
    const li = document.createElement("li");
    li.id = `vol-${v.vol}`;
    li.innerHTML = `
      <button type="button" class="vcard" aria-label="VOL. ${v.vol} ${v.title}, ${fmtDate(v.takenAt)} — show on the globe">
        <figure class="cover"></figure>
        <canvas class="vcard-row" aria-hidden="true"></canvas>
      </button>`;
    fillCover(li.querySelector(".cover"), v);
    const row = new DotBoard(li.querySelector(".vcard-row"), { rows: 1, lit: INK_TEXT, off: OFF });
    row.set([DotBoard.fmt(stampDate(v.takenAt), v.title)], null, false);
    li.querySelector(".vcard").addEventListener("click", () => {
      pendingVol = v;
      location.hash = "#world";
    });
    cards.appendChild(li);
  });

  // ───────── 화면 전환 (World / Project / About) ─────────
  let pendingVol = null;
  function showView() {
    const key = (location.hash || "#world").slice(1);
    const view = ["project", "about"].includes(key) ? key : "world";
    document.querySelectorAll(".view").forEach((el) => { el.hidden = el.id !== view; });
    document.querySelectorAll(".nav a").forEach((a) => {
      if (a.dataset.view === view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    document.body.dataset.view = view;
    window.scrollTo(0, 0);
    if (view === "world") {
      resize();
      if (selected) showVol(selected); else showIdle();
      if (pendingVol) { const v = pendingVol; pendingVol = null; select(v, true); }
    } else {
      stopBoard();
    }
  }
  window.addEventListener("hashchange", showView);

  // ───────── start ─────────
  window.addEventListener("resize", () => { if (document.body.dataset.view === "world") resize(); });
  const latest = VOLS[VOLS.length - 1];
  showView();
  // 진입 연출: 한국에서 출발해 최신 VOL로 한 번 회전한 뒤 선택 (World 화면일 때만)
  if (document.body.dataset.view === "world") {
    setTimeout(() => flyTo(latest.lon, latest.lat, 1.4, 1800).then(() => { if (!selected) { select(latest, false); pulse(); } }), 300);
  }

})();
