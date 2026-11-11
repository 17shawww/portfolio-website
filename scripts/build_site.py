"""Build the existing static site, with versioned CSS/JS for reliable refreshes."""
from pathlib import Path
import hashlib
import shutil

root = Path(__file__).resolve().parents[1]
out = root / "dist"
pages = ["index.html", "about.html", "work.html", "wuhan-marine-machinery.html"]
assets = ["styles.css", "site.js"]
for name in pages + assets:
    if not (root / name).is_file():
        raise FileNotFoundError(name)
versions = {name: hashlib.sha256((root / name).read_bytes()).hexdigest()[:12] for name in assets}
out.mkdir(exist_ok=True)
for name in pages:
    html = (root / name).read_text(encoding="utf-8")
    for asset, version in versions.items():
        html = html.replace(f'"{asset}"', f'"{asset}?v={version}"')
    (out / name).write_text(html, encoding="utf-8")
for name in assets:
    shutil.copy2(root / name, out / name)
shutil.copytree(root / "assets/portfolio", out / "assets/portfolio", dirs_exist_ok=True)
print("Static website ready in", out)
