# 큐리오 "Hello, passengers!" 목소리 생성. 확정값: python3 tools/reel/voice.py 4.5 0.30 0.17 1.9 tools/reel/hello-passengers.wav 0.2
# 원본 음성: ffmpeg -f lavfi -i "flite=text='Hello, passengers!':voice=slt" -ar 48000 -ac 1 src.wav (같은 폴더에서 실행)
# 가이드(sound_design_analysis_and_direction.md) 반영:
# 밝은 여성/캐릭터 톤, 피치 +semi, 포먼트 +%, 템포 +%, 억양 살리고 끝음 올림,
# EQ(HPF 170Hz, 300Hz 딥, 2.5~5k 부스트, 10k 셸프), 2톤 차임(G5→C6), 짧은 브라이트 리버브(wet 15%)
import sys, numpy as np, wave, pyworld as pw
from scipy.signal import butter, sosfilt, lfilter
semi, formant, tempo, liveliness = [float(a) for a in sys.argv[1:5]]; out = sys.argv[5]
w = wave.open('src.wav'); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float64) / 32768
f0, t = pw.harvest(x, sr, f0_floor=80, f0_ceil=600, frame_period=5)
sp = pw.cheaptrick(x, f0, t, sr); ap = pw.d4c(x, f0, t, sr)
v = f0 > 0
# 억양: 평균에서 벗어난 정도를 키움(로그 기준) + 마지막 음절 끝을 올림
lf = np.log(np.where(v, f0, 1)); m = lf[v].mean()
lf = np.where(v, m + (lf - m) * liveliness, 0)
n = len(f0); idx = np.arange(n); last = idx[v][-1]
rise = np.clip((idx - (last - 60)) / 60, 0, 1) ** 1.5 * np.log(2 ** (8 / 12))   # 끝 300ms 동안 8반음 올림 (말끝 올리기)
# 음절별 높낮이 (반음): Hel 높게, lo 내려오고, pas 다시 위, sen 아래, gers 위로
acc = float(sys.argv[6]) if len(sys.argv) > 6 else 0
tt = idx * .005; sylb = [0, .44, .96, 1.24, 1.46]; sylv = [5, -2, 3, -3, 1]
ct = np.zeros(n)
for bb, vv in zip(sylb, sylv): ct[tt >= bb] = vv
g = 8; ct = np.convolve(np.pad(ct, (g, g), mode='edge'), np.ones(g) / g, 'same')[g:-g]
lf = np.where(v, lf + rise + np.log(2 ** ((semi + acc * ct) / 12)), 0)
f0n = np.where(v, np.exp(lf), 0)
# 포먼트: 스펙트럼 포락선 주파수 축 늘림
F = sp.shape[1]; src_bins = np.arange(F) / (1 + formant)
spn = np.array([np.interp(src_bins, np.arange(F), row) for row in sp])
apn = np.array([np.interp(src_bins, np.arange(F), row) for row in ap])
# 템포: 프레임을 촘촘히 재샘플
m2 = int(n / (1 + tempo)); pos = np.linspace(0, n - 1, m2)
def rs(a): return np.array([np.interp(pos, np.arange(n), a[:, k]) for k in range(a.shape[1])]).T
f0r = np.interp(pos, np.arange(n), f0n); f0r[np.interp(pos, np.arange(n), v.astype(float)) < .5] = 0
y = pw.synthesize(f0r, np.ascontiguousarray(rs(spn)), np.ascontiguousarray(rs(apn)), sr, 5)
# EQ
def peak(f, g, q):
    A = 10 ** (g / 40); w0 = 2 * np.pi * f / sr; al = np.sin(w0) / (2 * q)
    b = [1 + al * A, -2 * np.cos(w0), 1 - al * A]; a = [1 + al / A, -2 * np.cos(w0), 1 - al / A]; return np.array(b) / a[0], np.array(a) / a[0]
def shelf(f, g):
    A = 10 ** (g / 40); w0 = 2 * np.pi * f / sr; al = np.sin(w0) / 2 * np.sqrt(2); c = np.cos(w0); s = 2 * np.sqrt(A) * al
    b = [A * ((A + 1) + (A - 1) * c + s), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - s)]
    a = [(A + 1) - (A - 1) * c + s, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - s]; return np.array(b) / a[0], np.array(a) / a[0]
y = sosfilt(butter(3, 170, 'highpass', fs=sr, output='sos'), y)          # 18dB/oct
for b, a in (peak(300, -3, 2.5), peak(3500, 3, .7), shelf(10000, 2)): y = lfilter(b, a, y)
y = y / np.abs(y).max() * .85
# 차임: 글로켄슈필 2톤 G5 → C6
def bell(f, d):
    s = np.arange(int(sr * d)) / sr
    return sum(a * np.sin(2 * np.pi * f * r * s) * np.exp(-s * k) for r, a, k in ((1, 1, 4), (2.76, .35, 9), (5.4, .15, 16))) * np.minimum(1, s / .003)
ch = np.zeros(int(sr * 1.0)); g5 = bell(784, .9); c6 = bell(1046.5, .9)
ch[:len(g5)] += g5; o = int(sr * .22); ch[o:o + len(c6)] += c6[:len(ch) - o]
ch = ch / np.abs(ch).max() * .35
gap = int(sr * .38)                                               # 차임 시작 후 목소리
mix = np.zeros(max(len(ch), gap + len(y)) + int(sr * .6)); mix[:len(ch)] += ch; mix[gap:gap + len(y)] += y
# 짧은 브라이트 리버브 (decay < 0.5s), wet 15%
def comb(x, d, g): 
    yv = x.copy()
    for i in range(d, len(x)): yv[i] += g * yv[i - d]
    return yv
wet = sum(comb(mix, int(sr * dd), .55) for dd in (.0297, .0371, .0411, .0437)) / 4
for dd in (.005, .0017): 
    D = int(sr * dd); wet = lfilter(np.r_[-.7, np.zeros(D - 1), 1], np.r_[1, np.zeros(D - 1), -.7], wet)
wet = sosfilt(butter(1, 1500, 'highpass', fs=sr, output='sos'), wet)
mix = .85 * mix + .15 * wet / (np.abs(wet).max() + 1e-9) * np.abs(mix).max()
mix = mix / np.abs(mix).max() * .9
pcm = (np.repeat(mix[:, None], 2, 1) * 32767).astype('<i2')
o = wave.open(out, 'wb'); o.setnchannels(2); o.setsampwidth(2); o.setframerate(sr); o.writeframes(pcm.tobytes())
print(out, round(len(mix) / sr, 2))
