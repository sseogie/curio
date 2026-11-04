// 피그마용 SVG 내보내기: node tools/reel/export-svg.js 15 → tools/reel/out/figma/
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const vol = process.argv[2] || "15";
const server = http.createServer((req, res) => {
  fs.readFile(path.join(ROOT, decodeURIComponent(req.url.split("?")[0])), (e, b) => { if (e) { res.writeHead(404); return res.end(); } res.end(b); });
}).listen(0);
(async () => {
  const b = await chromium.launch(), page = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(`http://localhost:${server.address().port}/tools/reel/reel.html?vol=${vol}&render&clip&lite`);
  await page.waitForFunction(() => window.REEL_READY);
  const out = path.join(__dirname, "out/figma"); fs.mkdirSync(out, { recursive: true });
  const inner = (f) => fs.readFileSync(path.join(ROOT, f), "utf8").replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  for (const t of [2.4, 4.8]) {
    const svg = await page.evaluate((t) => {
      REEL.frame(t);
      const s = document.getElementById("globe").cloneNode(true);
      // 계산된 스타일을 속성으로 굳힘 (CSS 클래스는 피그마에서 안 읽힘)
      const src = document.getElementById("globe").querySelectorAll("*"), dst = s.querySelectorAll("*");
      src.forEach((n, i) => { const c = getComputedStyle(n);
        ["fill", "stroke", "stroke-width", "stroke-opacity", "stroke-dasharray", "stroke-linecap", "fill-opacity", "font-family", "font-size", "font-weight", "letter-spacing"].forEach((p) => {
          const v = c.getPropertyValue(p); if (v && !dst[i].hasAttribute(p) && n.tagName !== "stop" && n.tagName !== "defs") dst[i].setAttribute(p, v); });
        dst[i].removeAttribute("class"); });
      s.setAttribute("xmlns", "http://www.w3.org/2000/svg"); s.setAttribute("width", 1080); s.setAttribute("height", 1920);
      s.removeAttribute("id");
      return s.outerHTML;
    }, t);
    fs.writeFileSync(path.join(out, `globe-${vol}-${t}.svg`), svg);
  }
  const v = await page.evaluate(() => { const x = CURIO_VOLS.find((v) => v.vol === REEL.vol); return { ...x, city: CURIO_STAMP_CITY[x.vol] }; });
  const T = { "cable car": "cable" }[v.transport] || v.transport;
  const [y, m, d] = v.takenAt.split("T")[0].split("-");
  fs.writeFileSync(path.join(out, `stamp-${vol}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="220" viewBox="0 0 340 220" fill="none">
<rect x="7" y="7" width="326" height="206" rx="16" fill="#F5FFFE" fill-opacity=".9"/>${inner("assets/stamp/base.svg")}${inner(`assets/stamp/${T}.svg`)}
<g font-family="Roboto Mono" font-weight="500"><text x="56" y="118" font-size="34" letter-spacing="2.04" fill="#C8735A">${d}.${m}.${y.slice(2)}</text>
<text x="262" y="118" font-size="34" letter-spacing="2.04" fill="#C8735A" fill-opacity=".82">${v.vol}</text>
<text x="127" y="171" font-size="17" letter-spacing="1.7" fill="#2C4A47" fill-opacity=".9">${v.city}</text>
<text x="148" y="194" font-size="13" letter-spacing="1.82" fill="#2C4A47" fill-opacity=".7">PROJECT CURIO</text></g></svg>`);
  console.log(fs.readdirSync(out).map((f) => f + " " + fs.statSync(path.join(out, f)).size).join("\n"));
  await b.close(); server.close();
})();
