"""공통 파일 복사본이 원본과 같은지 확인한다.

    python3 tools/check_shared.py

원본은 카드 저장소의 shared/ 다. 여기 있는 css/tokens.css ·
css/shell.css · js/shell.js 는 그 복사본이고, 머리말에 원본 경로와
sha256 이 박혀 있다.

복사본을 직접 고치면 조용히 갈라진다 — 실제로 한 번 그렇게 됐다.
이 스크립트가 CI 에서 돌면서 막는다.

고치는 법: 카드 저장소에서 shared/ 를 고치고
`python tools/sync_shared.py` 를 돌린 뒤 양쪽을 커밋한다.
"""
import sys
import urllib.request

RAW = "https://raw.githubusercontent.com/tutoryoujin/korean-cards/main/shared/"
FILES = {
    "tokens.css": "css/tokens.css",
    "shell.css": "css/shell.css",
    "shell.js": "js/shell.js",
}
UA = {"User-Agent": "calendar-practice-shared-check/1.0"}


def body_of(text):
    """머리말(복사본 배너)을 떼고 본문만 남긴다."""
    marker = " */\n"
    if text.startswith("/* ─") and marker in text:
        return text.split(marker, 1)[1]
    return text


def main():
    bad = []
    for name, local in FILES.items():
        try:
            req = urllib.request.Request(RAW + name, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                upstream = r.read().decode("utf-8")
        except Exception as e:
            print("원본을 못 받음: %s (%s)" % (name, e))
            sys.exit(2)          # 네트워크 문제는 실패와 구분한다
        with open(local, encoding="utf-8") as f:
            mine = body_of(f.read())
        if mine == upstream:
            print("OK   %s" % local)
        else:
            print("DIFF %s  <- korean-cards/shared/%s 와 다름" % (local, name))
            bad.append(local)

    if bad:
        print("\n카드 저장소에서 shared/ 를 고치고 tools/sync_shared.py 를 돌린 뒤")
        print("양쪽을 커밋하세요. 복사본을 직접 고치면 안 됩니다.")
        sys.exit(1)
    print("\n공통 파일 동기 상태 OK")


main()
