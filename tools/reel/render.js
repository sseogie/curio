// 사용: node tools/reel/render.js 15 [fps]  → tools/reel/out/curio-vol-15.mp4
// 저장소 루트에서 실행 (정적 서버를 직접 띄움)
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "../..");
const vol = process.argv[2] || "15", fps = +(process.argv[3] || 30);
const shots = process.argv.slice(4).map(Number); // 지정하면 해당 시각(초) 스틸만 저장
const types = { ".html": "text/html", ".js": "text/javascript", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { "Content-Type": types[path.extname(p)] || "application/octet-stream" }); res.end(b); });
}).listen(0);
(async () => {
  const port = server.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(`http://localhost:${port}/tools/reel/reel.html?vol=${vol}&render`);
  await page.waitForFunction(() => window.REEL_READY);
  const out = path.join(__dirname, "out"); fs.mkdirSync(out, { recursive: true });
  const el = await page.$("#frame");
  if (shots.length) {
    for (const t of shots) { await page.evaluate((t) => REEL.frame(t), t); await el.screenshot({ path: path.join(out, `still-${vol}-${t}.png`) }); }
  } else {
    const dir = fs.mkdtempSync(path.join(out, "f-"));
    const dur = await page.evaluate(() => REEL.DUR), n = Math.round(dur * fps);
    for (let i = 0; i < n; i++) {
      await page.evaluate((t) => REEL.frame(t), i / fps);
      await el.screenshot({ path: path.join(dir, `${String(i).padStart(4, "0")}.png`) });
    }
    const mp4 = path.join(out, `curio-vol-${vol}.mp4`);
    // 큐리오 목소리(hello-passengers.wav)를 0.2초에 넣음
    const voice = path.join(__dirname, "hello-passengers.wav");
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", path.join(dir, "%04d.png"),
      "-i", voice, "-filter_complex", "[1:a]adelay=200|200,apad[a]", "-map", "0:v", "-map", "[a]", "-shortest",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", mp4]);
    fs.rmSync(dir, { recursive: true });
    console.log(mp4);
  }
  await browser.close(); server.close();
})();
