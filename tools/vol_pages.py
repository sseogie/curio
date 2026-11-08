"""이전 이름 호환용. 이제는 `python3 tools/release.py`를 쓴다 (검사·공유 페이지·캐시 값 갱신을 한 번에)."""
import os, runpy, sys
sys.argv = [sys.argv[0]]
runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "release.py"), run_name="__main__")
