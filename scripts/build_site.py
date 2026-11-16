"""Publish portfolio pages, branding, and Digital Ink from an explicit allowlist."""
from pathlib import Path
import hashlib
import shutil

root = Path(__file__).resolve().parents[1]
out = root / "dist"
pages = ["index.html", "about.html", "work.html", "ink.html"]
assets = ["styles.css", "site.js", "assets/portfolio/yp-monogram.png", "ink.css", "ink.js"]
for name in pages + assets:
    if not (root / name).is_file():
        raise FileNotFoundError(name)
versions = {name: hashlib.sha256((root / name).read_bytes()).hexdigest()[:12]
            for name in ["styles.css", "site.js"]}
# Rebuild generated output so an older case study/image cannot survive locally
# or in a restored build cache. Source files outside dist are never removed.
if out.is_symlink():
    raise ValueError("Refusing to replace a symlinked output directory")
if out.exists():
    shutil.rmtree(out)
out.mkdir()
for name in pages:
    html = (root / name).read_text(encoding="utf-8")
    for asset, version in versions.items():
        html = html.replace(f'"{asset}"', f'"{asset}?v={version}"')
    (out / name).write_text(html, encoding="utf-8")
for name in assets:
    destination = out / name
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(root / name, destination)
print("Module 10 static website ready in", out)
