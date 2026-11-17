"""Publish portfolio pages and branding from an explicit allowlist."""
from pathlib import Path
import hashlib
import shutil

root = Path(__file__).resolve().parents[1]
out = root / "dist"
pages = ["index.html", "about.html", "work.html", "wuhan-marine-machinery.html"]
case_images = ["workbench.png", "messages.png", "statistics.png", "management.png",
               "all-business.png", "safety-form.png", "exploration-01.png",
               "exploration-04.png", "foundations.png", "components.png",
               "original-workbench.jpg", "original-safety.jpg",
               "message-list.png", "message-detail.png", "validation-error.png", "discard-confirm.png", "process-record.png", "hazard-form.png", "notification-settings.png", "statistics-detail.png", "exploration-02.png", "exploration-03.png", "exploration-05.png", "exploration-06.png", "component-status-badge.png", "component-button.png", "component-text-field.png", "component-toggle.png", "prototype-workbench-2026-08-11.png"]
assets = ["robots.txt", "sitemap.xml", "styles.css", "site.js", "wmmp-case.css", "wmmp-case.js", "assets/portfolio/yp-monogram.png", "signature-motion.css", "signature-motion.js", "project-transitions.css", "project-transitions.js", "immersive-case.css", "immersive-case.js"]
assets += ["assets/wmmp/" + name for name in case_images]
for name in pages + assets:
    if not (root / name).is_file():
        raise FileNotFoundError(name)
versions = {name: hashlib.sha256((root / name).read_bytes()).hexdigest()[:12]
            for name in ["styles.css", "site.js", "wmmp-case.css", "wmmp-case.js", "signature-motion.css", "signature-motion.js", "project-transitions.css", "project-transitions.js", "immersive-case.css", "immersive-case.js"]}
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
print("Portfolio static website ready in", out)
