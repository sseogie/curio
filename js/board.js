// PROJECT CURIO — 도트 매트릭스 출발 안내판 (canvas)
// 한 줄 = 20칸 (날짜 8 + 공백 2 + 목적지 10), 한 칸 = 5×7 도트 + 1열 간격
(() => {
  const F = {A:'01110,10001,10001,11111,10001,10001,10001',B:'11110,10001,10001,11110,10001,10001,11110',C:'01110,10001,10000,10000,10000,10001,01110',D:'11110,10001,10001,10001,10001,10001,11110',E:'11111,10000,10000,11110,10000,10000,11111',F:'11111,10000,10000,11110,10000,10000,10000',G:'01110,10001,10000,10111,10001,10001,01111',H:'10001,10001,10001,11111,10001,10001,10001',I:'01110,00100,00100,00100,00100,00100,01110',J:'00111,00010,00010,00010,00010,10010,01100',K:'10001,10010,10100,11000,10100,10010,10001',L:'10000,10000,10000,10000,10000,10000,11111',M:'10001,11011,10101,10101,10001,10001,10001',N:'10001,10001,11001,10101,10011,10001,10001',O:'01110,10001,10001,10001,10001,10001,01110',P:'11110,10001,10001,11110,10000,10000,10000',Q:'01110,10001,10001,10001,10101,10010,01101',R:'11110,10001,10001,11110,10100,10010,10001',S:'01111,10000,10000,01110,00001,00001,11110',T:'11111,00100,00100,00100,00100,00100,00100',U:'10001,10001,10001,10001,10001,10001,01110',V:'10001,10001,10001,10001,10001,01010,00100',W:'10001,10001,10001,10101,10101,10101,01010',X:'10001,10001,01010,00100,01010,10001,10001',Y:'10001,10001,01010,00100,00100,00100,00100',Z:'11111,00001,00010,00100,01000,10000,11111','0':'01110,10001,10011,10101,11001,10001,01110','1':'00100,01100,00100,00100,00100,00100,01110','2':'01110,10001,00001,00010,00100,01000,11111','3':'11111,00010,00100,00010,00001,10001,01110','4':'00010,00110,01010,10010,11111,00010,00010','5':'11111,10000,11110,00001,00001,10001,01110','6':'00110,01000,10000,11110,10001,10001,01110','7':'11111,00001,00010,00100,01000,01000,01000','8':'01110,10001,10001,01110,10001,10001,01110','9':'01110,10001,10001,01111,00001,00010,01100',':':'00000,01100,01100,00000,01100,01100,00000','.':'00000,00000,00000,00000,00000,01100,01100','-':'00000,00000,00000,11111,00000,00000,00000',' ':'00000,00000,00000,00000,00000,00000,00000'};
  const G = {};
  for (const [k, v] of Object.entries(F)) G[k] = v.split(",").map((r) => [...r].map((c) => c === "1"));
  const norm = (ch) => { const c = ch.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); return G[c] ? c : " "; };
  const FLIP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  class DotBoard {
    // opts: { rows, lit, off, accent, rowGap (줄 간격 / 줄 높이) }
    constructor(canvas, opts) {
      this.c = canvas; this.ctx = canvas.getContext("2d");
      this.o = Object.assign({ rows: 1, cols: 23, rowGap: 23.4 / 36, radius: 0.36 }, opts);
      this.COLS = this.o.cols;
      this.cells = Array.from({ length: this.o.rows }, () => Array.from({ length: this.COLS }, () => ({ cur: " ", target: " ", left: 0, next: 0 })));
      this.colors = Array(this.o.rows).fill(this.o.lit);
      this.raf = 0;
      this.hl = -1;
      this.resize();
      new ResizeObserver(() => this.resize()).observe(canvas);
    }
    static fmt(date, dest) { return (date.padEnd(8).slice(0, 8) + "  " + dest.padEnd(13).slice(0, 13)); }
    resize() {
      const w = this.c.clientWidth; if (!w) return;
      const pitch = w / (this.COLS * 6 - 1), rowH = pitch * 7, gap = rowH * this.o.rowGap;
      const h = this.o.rows * rowH + (this.o.rows - 1) * gap;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      this.c.style.height = h + "px";
      this.c.width = Math.round(w * dpr); this.c.height = Math.round(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      Object.assign(this, { pitch, rowH, gap, w, h });
      this.draw();
    }
    // texts: 줄별 문자열, colors: 줄별 색, animate: 도트가 바뀌는 연출 여부
    set(texts, colors, animate = true) {
      const now = performance.now();
      texts.forEach((t, r) => {
        if (r >= this.o.rows) return;
        if (colors) this.colors[r] = colors[r] || this.o.lit;
        [...t.padEnd(this.COLS).slice(0, this.COLS)].forEach((ch, i) => {
          const cell = this.cells[r][i], target = norm(ch);
          if (cell.target === target && cell.left === 0 && cell.cur === target) return;
          cell.target = target;
          if (!animate) { cell.cur = target; cell.left = 0; return; }
          cell.left = target === " " && cell.cur === " " ? 0 : 3 + Math.floor(Math.random() * 4);
          cell.next = now + r * 55 + i * 22;
          if (!cell.left) cell.cur = target;
        });
      });
      this.loop();
    }
    // 줄 번호 (캔버스 안의 y 좌표 → 몇 번째 줄인지)
    rowAt(y) { const i = Math.floor((y + this.gap / 2) / (this.rowH + this.gap)); return i >= 0 && i < this.o.rows ? i : -1; }
    setHl(i) { if (this.hl !== i) { this.hl = i; this.draw(); } }
    loop() {
      if (this.raf) return;
      const step = (t) => {
        let busy = false;
        for (const row of this.cells) for (const cell of row) {
          if (!cell.left) continue;
          busy = true;
          if (t >= cell.next) {
            cell.left -= 1;
            cell.cur = cell.left ? FLIP_CHARS[Math.floor(Math.random() * FLIP_CHARS.length)] : cell.target;
            cell.next = t + 55;
          }
        }
        this.draw();
        this.raf = busy ? requestAnimationFrame(step) : 0;
      };
      this.raf = requestAnimationFrame(step);
    }
    draw() {
      const { ctx, pitch, rowH, gap, w, h } = this; if (!pitch) return;
      ctx.clearRect(0, 0, w, h);
      const r = pitch * this.o.radius;
      // 마우스를 올린 줄 배경
      if (this.hl >= 0 && this.o.hlBg) {
        ctx.fillStyle = this.o.hlBg;
        ctx.fillRect(0, this.hl * (rowH + gap) - gap * 0.4, w, rowH + gap * 0.8);
      }
      this.cells.forEach((row, ri) => {
        const y0 = ri * (rowH + gap);
        // 꺼진 도트
        ctx.fillStyle = this.o.off; ctx.beginPath();
        for (let ci = 0; ci < this.COLS * 6 - 1; ci++) for (let rr = 0; rr < 7; rr++) {
          const k = Math.floor(ci / 6), cc = ci % 6;
          if (cc < 5 && G[row[k].cur][rr][cc]) continue;
          ctx.moveTo(ci * pitch + pitch / 2 + r, y0 + rr * pitch + pitch / 2);
          ctx.arc(ci * pitch + pitch / 2, y0 + rr * pitch + pitch / 2, r, 0, Math.PI * 2);
        }
        ctx.fill();
        // 켜진 도트
        ctx.fillStyle = this.colors[ri]; ctx.beginPath();
        row.forEach((cell, k) => {
          const g = G[cell.cur];
          for (let rr = 0; rr < 7; rr++) for (let cc = 0; cc < 5; cc++) if (g[rr][cc]) {
            const x = (k * 6 + cc) * pitch + pitch / 2, y = y0 + rr * pitch + pitch / 2;
            ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2);
          }
        });
        ctx.fill();
      });
    }
  }
  window.DotBoard = DotBoard;
})();
