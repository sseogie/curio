"""CURIO 배포 도구 — 검사, 이미지 가져오기, 공유 페이지 생성, 캐시 값 갱신을 한 번에.

사이트 폴더에서 실행:
  python3 tools/release.py                    # 검사 → 공유 페이지 → 캐시 값 갱신
  python3 tools/release.py --import ~/Downloads/export   # 3x JPG(VOLNN_*.jpg)를 1080×1350으로 줄여 넣은 뒤 위 과정
  python3 tools/release.py --check            # 검사만 (파일을 바꾸지 않음, GitHub Actions용)

끝나면 `git diff --stat` 확인 → `git pull --rebase` → push.
"""
import argparse, glob, hashlib, html, json, os, re, subprocess, sys
from datetime import datetime, timezone, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
KINDS = ("cover", "review", "stamp")
SIZE = (1080, 1350)
BASE = "https://sseogie.github.io/curio/"
MANIFEST = "tools/release_manifest.json"
KST = timezone(timedelta(hours=9))


def load_data():
    """data.js를 실제 JS로 실행해 값을 읽는다 (정규식 파싱보다 안전)."""
    js = "const window={};" + open("js/data.js", encoding="utf-8").read() + \
         ";console.log(JSON.stringify(window))"
    out = subprocess.run(["node", "-e", js], capture_output=True, text=True)
    if out.returncode:
        sys.exit("data.js 문법 오류:\n" + out.stderr)
    return json.loads(out.stdout)


def img_name(d, vol, kind):
    over = (d.get("CURIO_IMAGES") or {}).get(vol)
    return over[KINDS.index(kind)] if over else f"VOL{vol}_{kind}"


# ---------- 검사 ----------
def check(d):
    from PIL import Image
    err, warn = [], []
    vols = d.get("CURIO_VOLS", [])
    ids = [v.get("vol") for v in vols]
    for x in {i for i in ids if ids.count(i) > 1}:
        err.append(f"VOL {x} 중복")
    areas = d.get("CURIO_AREAS", {})
    icons = {os.path.splitext(f)[0] for f in os.listdir("assets/stamp")}
    tmap = {"cable car": "cable"}
    used = set()
    for v in vols:
        n = v.get("vol", "?")
        for k in ("vol", "title", "region", "area", "place", "lat", "lon", "takenAt", "transport"):
            if v.get(k) in (None, ""):
                err.append(f"VOL {n}: {k} 없음")
        if not re.fullmatch(r"\d\d", str(n)):
            err.append(f"VOL {n}: 번호는 두 자리 문자열")
        if v.get("area") not in areas:
            err.append(f"VOL {n}: area '{v.get('area')}'가 CURIO_AREAS에 없음")
        if not (-90 <= float(v.get("lat", 0)) <= 90 and -180 <= float(v.get("lon", 0)) <= 180):
            err.append(f"VOL {n}: 좌표 범위 오류")
        if not re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d", str(v.get("takenAt", ""))):
            err.append(f"VOL {n}: takenAt 형식은 YYYY-MM-DDTHH:MM")
        t = v.get("transport", "")
        if tmap.get(t, t) not in icons:
            err.append(f"VOL {n}: 교통 아이콘 assets/stamp/{tmap.get(t, t)}.svg 없음")
        if n not in (d.get("CURIO_STAMP_CITY") or {}):
            err.append(f"VOL {n}: CURIO_STAMP_CITY 없음")
        for kind in KINDS:
            f = f"assets/vol/{img_name(d, n, kind)}.jpg"
            used.add(f)
            if not os.path.exists(f):
                err.append(f"VOL {n}: {f} 없음")
                continue
            s = Image.open(f).size
            if s != SIZE:
                warn.append(f"{f} 크기 {s[0]}×{s[1]} (기준 1080×1350)")
        if not os.path.exists(f"vol/{n}/index.html"):
            warn.append(f"VOL {n}: 공유 페이지 없음 (release.py 실행 필요)")
    # 여정: 모든 VOL이 정확히 한 번씩
    in_trips = [x for t in d.get("CURIO_TRIPS", []) for x in t.get("vols", [])]
    for x in sorted(set(ids) - set(in_trips)):
        err.append(f"VOL {x}: CURIO_TRIPS 어느 여정에도 없음")
    for x in sorted(set(in_trips) - set(ids)):
        err.append(f"CURIO_TRIPS에 없는 VOL {x}")
    for x in sorted({i for i in in_trips if in_trips.count(i) > 1}):
        err.append(f"VOL {x}: 여정에 두 번 들어감")
    # 쓰이지 않는 포스터
    for f in sorted(glob.glob("assets/vol/*.jpg")):
        if f not in used:
            warn.append(f"쓰이지 않는 이미지 {f}")
    # index.html이 가리키는 로컬 파일
    page = open("index.html", encoding="utf-8").read()
    for ref in re.findall(r'(?:src|href)="(?!https?:|#|mailto:|data:)([^"?#]+)', page):
        if ref and not os.path.exists(ref):
            err.append(f"index.html: {ref} 없음")
    return err, warn


# ---------- 이미지 가져오기 ----------
def import_images(src):
    from PIL import Image
    files = sorted(glob.glob(os.path.join(os.path.expanduser(src), "VOL[0-9][0-9]_*.jpg")))
    files = [f for f in files if re.fullmatch(r"VOL\d\d_(cover|review|stamp)\.jpg", os.path.basename(f))]
    if not files:
        sys.exit(f"{src}에 VOLNN_cover/review/stamp.jpg 파일이 없음")
    for f in files:
        im = Image.open(f).convert("RGB")
        if im.size != SIZE:
            im = im.resize(SIZE, Image.LANCZOS)
        im.save(f"assets/vol/{os.path.basename(f)}", quality=88, optimize=True, progressive=True)
        print("  가져옴", os.path.basename(f))
    return len(files)


# ---------- 공유 페이지 ----------
def build_pages(d):
    from PIL import Image
    os.makedirs("assets/og", exist_ok=True)
    for v in d["CURIO_VOLS"]:
        vol, title, region, taken = v["vol"], v["title"], v["region"], v["takenAt"]
        bg = Image.new("RGB", (1200, 630), (245, 255, 254))
        H = 574; W = round(H * 0.8)
        a = Image.open(f"assets/vol/{img_name(d, vol, 'cover')}.jpg").convert("RGB").resize((W, H), Image.LANCZOS)
        b = Image.open(f"assets/vol/{img_name(d, vol, 'stamp')}.jpg").convert("RGB").resize((W, H), Image.LANCZOS)
        gap = 28; x0 = (1200 - 2 * W - gap) // 2; y0 = (630 - H) // 2
        bg.paste(a, (x0, y0)); bg.paste(b, (x0 + W + gap, y0))
        og = f"assets/og/vol-{vol}.jpg"
        bg.save(og + ".tmp.jpg", quality=84, optimize=True)
        # 내용이 같으면 파일을 바꾸지 않아 불필요한 커밋을 막는다
        if os.path.exists(og) and open(og, "rb").read() == open(og + ".tmp.jpg", "rb").read():
            os.remove(og + ".tmp.jpg")
        else:
            os.replace(og + ".tmp.jpg", og)
        y, m, dd = taken[:10].split("-")
        t = html.escape(f"{title} · VOL. {vol} — PROJECT. CURIO. CITY.")
        desc = html.escape(f"{region.title()}, {dd}.{m}.{y}. Field data turned into one fixed visual system.")
        img = f"{BASE}assets/og/vol-{vol}.jpg"
        os.makedirs(f"vol/{vol}", exist_ok=True)
        open(f"vol/{vol}/index.html", "w", encoding="utf-8").write(f'''<!doctype html>
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
<meta property="og:url" content="{BASE}vol/{vol}/">
<meta property="og:image" content="{img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{t}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{img}">
<link rel="canonical" href="{BASE}#vol-{vol}">
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
<meta http-equiv="refresh" content="0; url=../../#vol-{vol}">
<script>location.replace("../../" + location.search + "#vol-{vol}");</script>
<style>body{{margin:0;background:#F5FFFE;color:#42645F;font:16px system-ui,sans-serif;display:grid;place-items:center;height:100vh}}a{{color:inherit}}</style>
</head>
<body><a href="../../#vol-{vol}">{html.escape(title)} · VOL. {vol}</a></body>
</html>
''')
    print(f"  공유 페이지 {len(d['CURIO_VOLS'])}개")


# ---------- 캐시 값 ----------
def digest(paths, strip=None):
    h = hashlib.sha1()
    for p in sorted(paths):
        b = open(p, "rb").read()
        if strip:
            b = re.sub(strip, b"", b)
        h.update(p.encode() + b)
    return h.hexdigest()


def bump():
    """이미지·CSS·JS 내용이 지난번 배포와 달라졌을 때만 캐시 값을 지금 시각으로 바꾼다."""
    now = datetime.now(KST).strftime("%Y%m%d%H%M")
    old = json.load(open(MANIFEST)) if os.path.exists(MANIFEST) else {}
    new = {
        "images": digest(glob.glob("assets/vol/*.jpg")),
        # data.js의 CURIO_IMG_V 줄은 제외 (캐시 값 자체가 바뀌어 다시 감지되는 것을 막음)
        "code": digest(glob.glob("css/*.css") + glob.glob("js/*.js"), rb'window\.CURIO_IMG_V = "\d+";'),
    }
    changed = []
    if old.get("images") != new["images"]:
        p = "js/data.js"; s = open(p, encoding="utf-8").read()
        open(p, "w", encoding="utf-8").write(re.sub(r'(CURIO_IMG_V = ")\d+(")', rf"\g<1>{now}\2", s))
        p = "index.html"; s = open(p, encoding="utf-8").read()
        s = re.sub(r'(assets/vol/VOL\d\d_\w+\.jpg)(\?v=\d+)?"', rf'\1?v={now}"', s)
        open(p, "w", encoding="utf-8").write(s)
        changed.append("이미지")
    if old.get("code") != new["code"]:
        p = "index.html"; s = open(p, encoding="utf-8").read()
        s = re.sub(r'((?:css|js)/[\w.-]+\.(?:css|js))\?v=\d+', rf"\1?v={now}", s)
        open(p, "w", encoding="utf-8").write(s)
        changed.append("CSS·JS")
    json.dump(new, open(MANIFEST, "w"), indent=2)
    print(f"  캐시 값 {now} 갱신: {', '.join(changed)}" if changed else "  캐시 값 그대로 (변경 없음)")


def report(err, warn):
    for w in warn:
        print("  주의", w)
    for e in err:
        print("  오류", e)
    print(f"  검사: 오류 {len(err)}, 주의 {len(warn)}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="검사만")
    ap.add_argument("--import", dest="src", help="3x JPG가 있는 폴더")
    a = ap.parse_args()
    d = load_data()
    if a.check:
        err, warn = check(d); report(err, warn)
        sys.exit(1 if err else 0)
    if a.src:
        print("1. 이미지 가져오기"); import_images(a.src)
    print("2. 검사")
    err, warn = check(d); report(err, warn)
    if err:
        sys.exit("오류를 고친 뒤 다시 실행")
    print("3. 공유 페이지"); build_pages(d)
    print("4. 캐시 값"); bump()
    print("완료 → git diff --stat 확인, 로컬 서버로 #vol-NN 확인, git pull --rebase 후 push")


if __name__ == "__main__":
    main()
