#!/usr/bin/env python3
"""SEO build step for alphalearn.ai (GitHub Pages, no bundler).

Run from the repo root before every commit/deploy:

    python3 scripts/seo_build.py

What it does (idempotent):
1. Writes de|en/partials/header.html, footer.html and logo-banner.html
   statically into every page under de/ and en/ (between
   <!-- partial:NAME:start --> and <!-- partial:NAME:end --> markers),
   so Google sees navigation and footer links in the raw HTML.
   layout.js no longer needs to fetch them (it only falls back to fetch
   if a container is empty).
2. Rebuilds the <lastmod> of every URL in sitemap.xml from the date of the
   last git commit that touched the file (or today, if the file has
   uncommitted changes).

After editing a partial, simply run the script again.
"""
import datetime
import os
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
GIT_ENV = {**os.environ, "GIT_OPTIONAL_LOCKS": "0"}  # read-only git calls, never leave index.lock behind
LANGS = ("de", "en")
CONTAINERS = {
    "header": "site-header",
    "footer": "site-footer",
    "logo-banner": "logo-banner",
}
LOGO_FETCH_RE = re.compile(
    r'\s*<script>\s*fetch\("partials/logo-banner\.html"\)\s*\.then\(r => r\.text\(\)\)\s*'
    r'\.then\(html => \{ document\.getElementById\("logo-banner"\)\.innerHTML = html; \}\);\s*</script>',
    re.S,
)


def is_stub(html: str) -> bool:
    return 'http-equiv="refresh"' in html


def block(name: str, content: str) -> str:
    return f"<!-- partial:{name}:start -->\n{content.strip()}\n<!-- partial:{name}:end -->"


def inline_partials() -> int:
    changed = 0
    for lang in LANGS:
        partials = {
            name: (ROOT / lang / "partials" / f"{name}.html").read_text(encoding="utf-8")
            for name in CONTAINERS
        }
        for page in sorted((ROOT / lang).glob("*.html")):
            html = page.read_text(encoding="utf-8")
            if is_stub(html):
                continue
            orig = html
            for name, cid in CONTAINERS.items():
                if f'id="{cid}"' not in html:
                    continue
                marked = re.compile(
                    rf'(<div id="{cid}"[^>]*>)\s*<!-- partial:{name}:start -->.*?<!-- partial:{name}:end -->\s*(</div>)',
                    re.S,
                )
                if marked.search(html):
                    html = marked.sub(lambda m: m.group(1) + block(name, partials[name]) + m.group(2), html, count=1)
                    continue
                # First run: container is empty or holds a hidden fallback <nav> (no nested divs).
                plain = re.compile(rf'(<div id="{cid}"[^>]*>)((?:(?!<div\b).)*?)(</div>)', re.S)
                m = plain.search(html)
                if not m:
                    print(f"  ! {page.relative_to(ROOT)}: could not locate #{cid}", file=sys.stderr)
                    continue
                html = html[: m.start()] + m.group(1) + block(name, partials[name]) + m.group(3) + html[m.end():]
            html = LOGO_FETCH_RE.sub("", html)
            if html != orig:
                page.write_text(html, encoding="utf-8")
                changed += 1
    return changed


def git_date(rel: str) -> str:
    today = datetime.date.today().isoformat()
    try:
        dirty = subprocess.run(["git", "status", "--porcelain", "--", rel], cwd=ROOT, env=GIT_ENV,
                               capture_output=True, text=True).stdout.strip()
        if dirty:
            return today
        out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", rel], cwd=ROOT, env=GIT_ENV,
                             capture_output=True, text=True).stdout.strip()
        return out or today
    except Exception:
        return today


def update_sitemap() -> int:
    sm = ROOT / "sitemap.xml"
    xml = sm.read_text(encoding="utf-8")
    count = 0

    def repl(m):
        nonlocal count
        loc = m.group(2)
        path = re.sub(r"^https://alphalearn\.ai/", "", loc)
        rel = path + "index.html" if (path == "" or path.endswith("/")) else path
        if not (ROOT / rel).exists():
            print(f"  ! sitemap URL without file: {loc}", file=sys.stderr)
            return m.group(0)
        count += 1
        block_ = m.group(0)
        new = f"<lastmod>{git_date(rel)}</lastmod>"
        if "<lastmod>" in block_:
            return re.sub(r"<lastmod>[^<]*</lastmod>", new, block_)
        return block_.replace("</loc>", "</loc>\n    " + new, 1)

    xml2 = re.sub(r"(<url>\s*<loc>([^<]+)</loc>.*?</url>)", repl, xml, flags=re.S)
    if xml2 != xml:
        sm.write_text(xml2, encoding="utf-8")
    return count


if __name__ == "__main__":
    n = inline_partials()
    print(f"partials inlined/refreshed in {n} page(s)")
    if "--no-sitemap" not in sys.argv:
        print(f"sitemap lastmod set for {update_sitemap()} URL(s)")
