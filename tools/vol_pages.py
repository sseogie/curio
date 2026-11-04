"""VOL별 공유 페이지(vol/NN/index.html)와 미리보기 이미지(assets/og/vol-NN.jpg)를 만든다.
새 VOL을 data.js에 넣고 이미지를 assets/vol/에 넣은 뒤, 사이트 폴더에서 `python3 tools/vol_pages.py` 실행."""
import re, os, html
from PIL import Image
d = open('js/data.js').read()
vols = re.findall(r'\{ vol: "(\d+)", title: "([^"]+)", region: "([^"]+)".*?takenAt: "([^"]+)"', d, re.S)
imgs = {k: (a, c) for k, a, b, c in re.findall(r'"(\d+)": \["([^"]+)", "([^"]+)", "([^"]+)"\]', d)}
os.makedirs('assets/og', exist_ok=True)
base = 'https://sseogie.github.io/curio/'
for vol, title, region, taken in vols:
    cov, st = imgs[vol]
    bg = Image.new('RGB', (1200, 630), (245, 255, 254))
    H = 574; W = round(H * 0.8)
    a = Image.open(f'assets/vol/{cov}.jpg').convert('RGB').resize((W, H), Image.LANCZOS)
    b = Image.open(f'assets/vol/{st}.jpg').convert('RGB').resize((W, H), Image.LANCZOS)
    gap = 28; x0 = (1200 - 2 * W - gap) // 2; y0 = (630 - H) // 2
    bg.paste(a, (x0, y0)); bg.paste(b, (x0 + W + gap, y0))
    bg.save(f'assets/og/vol-{vol}.jpg', quality=84, optimize=True)
    y, m, dd = taken[:10].split('-')
    t = html.escape(f'{title} · VOL. {vol} — PROJECT. CURIO. CITY.')
    desc = html.escape(f'{region.title()}, {dd}.{m}.{y}. Field data turned into one fixed visual system.')
    img = f'{base}assets/og/vol-{vol}.jpg'
    os.makedirs(f'vol/{vol}', exist_ok=True)
    open(f'vol/{vol}/index.html', 'w').write(f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{t}</title>
<meta name="description" content="{desc}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="PROJECT CURIO">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{base}vol/{vol}/">
<meta property="og:image" content="{img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{t}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{img}">
<link rel="canonical" href="{base}#vol-{vol}">
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
<meta http-equiv="refresh" content="0; url=../../#vol-{vol}">
<script>location.replace("../../" + location.search + "#vol-{vol}");</script>
<style>body{{margin:0;background:#F5FFFE;color:#42645F;font:16px system-ui,sans-serif;display:grid;place-items:center;height:100vh}}a{{color:inherit}}</style>
</head>
<body><a href="../../#vol-{vol}">{html.escape(title)} · VOL. {vol}</a></body>
</html>
''')
print(f'{len(vols)} VOL pages written')
