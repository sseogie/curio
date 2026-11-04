# 릴스 효과음 합성 (외부 음원 없음 → 저작권 걱정 없음)
# 사용: python3 tools/reel/sfx.py out.wav   (타이밍은 reel.html 타임라인과 같음)
import sys, numpy as np, wave
from scipy.signal import butter, sosfilt
SR, DUR = 48000, 9.0
t = np.arange(int(SR * DUR)) / SR
mix = np.zeros_like(t)
rng = np.random.default_rng(7)

def add(sig, at):
    i = int(at * SR); n = min(len(sig), len(mix) - i); mix[i:i + n] += sig[:n]

def env(n, a, d):  # 어택, 감쇠(초)
    x = np.arange(n) / SR
    return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / d)

def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)

# 1) 비행: 바람 스치는 소리 (1.1 → 3.6s), 가운데서 커졌다 잦아듦
n = int(2.6 * SR); x = np.arange(n) / n
noise = rng.standard_normal(n)
sweep = np.concatenate([bp(noise[i:i + 4800], 300 + 1400 * (i / n), 900 + 2600 * (i / n)) for i in range(0, n, 4800)])[:n]
add(sweep * np.sin(np.pi * x) ** 1.6 * 0.22, 1.1)

# 2) 도착: 맑은 벨 (3.65s)
n = int(1.6 * SR); s = np.arange(n) / SR
bell = (np.sin(2 * np.pi * 1318.5 * s) + .45 * np.sin(2 * np.pi * 1975.5 * s) + .2 * np.sin(2 * np.pi * 2637 * s)) * env(n, .004, .45)
add(bell * 0.16, 3.65)

# 3) 큐리오 착지: 짧은 톡 (4.35s)
n = int(.12 * SR); s = np.arange(n) / SR
f = 700 * np.exp(-s * 18) + 250
add(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .002, .035) * 0.18, 4.35)

# 4) 도장: 쿵 + 종이 탁 (4.25s)
n = int(.5 * SR); s = np.arange(n) / SR
thump = np.sin(2 * np.pi * np.cumsum(140 * np.exp(-s * 9) + 55) / SR) * env(n, .002, .09)
click = bp(rng.standard_normal(n), 1500, 6000) * env(n, .0005, .012)
add(thump * 0.55 + click * 0.35, 4.25)

# 5) 포스터: 종이 스윽 (5.2 → 6.0s)
n = int(.8 * SR); x = np.arange(n) / n
add(bp(rng.standard_normal(n), 2500, 7000) * np.sin(np.pi * x) ** 2 * 0.07, 5.2)

# 6) 마무리: 낮은 화음 한 번 (6.1s)
n = int(2.6 * SR); s = np.arange(n) / SR
pad = sum(np.sin(2 * np.pi * f0 * s) for f0 in (523.25, 659.25, 783.99)) / 3 * env(n, .25, 1.1)
add(pad * 0.10, 6.1)

# 끝 부분 페이드아웃, 노멀라이즈
mix[-int(.4 * SR):] *= np.linspace(1, 0, int(.4 * SR))
mix = mix / max(1e-9, np.abs(mix).max()) * 0.85
pcm = (np.repeat(mix[:, None], 2, 1) * 32767).astype("<i2")
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(sys.argv[1])
