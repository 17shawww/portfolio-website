# Yixiao Peng — UX & Product Designer portfolio

Rutgers Module 10 portfolio, continuing the existing local project and its approved Editorial × Hybrid design. Native HTML, CSS and a small accessible navigation script; no frontend framework or package installation.

## Structure

- `index.html` — Home and featured work.
- `about.html` — background, approach/skills, relevant experience, future interests and personal interests.
- `work.html` — six established projects, with accurate previews and ongoing labels.
- `wuhan-marine-machinery.html` — main case study.
- `styles.css`, `site.js` — shared design and navigation.
- `assets/portfolio/` — selected website assets; provenance in `ASSET-SOURCES.md`.
- `scripts/build_site.py` — builds the website into `dist/`.
- `scripts/check_site.py` — validates pages, references, anchors and image alternative text.
- `vercel.json` — Vercel static-site settings.

## Build and preview

```sh
python3 scripts/build_site.py
python3 scripts/check_site.py
python3 -m http.server 8766 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:8766 . Direct `.html` URLs are intentional and work without SPA rewrites.

## GitHub + Vercel

Use the private `portfolio-website` repository, production branch `main`.
In Vercel, import that GitHub repository into a Hobby project, preferably named `yixiao-peng-portfolio`:

- Framework preset: **Other**
- Root directory: repository root
- Build command: `python3 scripts/build_site.py`
- Output directory: `dist`
- Install command: empty (no dependencies)
- Production branch: `main`

The source-controlled `vercel.json` supplies the build/output settings. After the GitHub integration is connected, pushes to `main` should deploy production; supported pull requests/other branches should get previews. Verify the integration and actual public URL in Vercel before claiming deployment success.

Only the website source and selected assets are tracked. Historic recordings, design exports, local account settings, credentials, `dist/` and `.vercel/` stay local. Do not deploy the project root as a static folder.

## Future updates through Codex

1. Edit the existing source; preserve confirmed content and design direction.
2. Run build and reference checks, then inspect desktop/mobile previews.
3. Review `git diff`, commit the intended files, and push to `main`.
4. Check Vercel's deployment for that commit and verify the public pages.
5. Update the project task log and assignment screenshots in the user's local records folder.

The custom domain `yixiaopeng.com` has not been purchased; use the assigned Vercel subdomain. No domain purchase, DNS change or paid service is part of this task.

## Content boundaries

Wuhan Marine Machinery is a Summer 2026 UX/UI internship project: a submitted prototype, not a confirmed production launch. MindAware is a UX Practicum project; Chakra Solutions is an MBS Externship project. Neither is described as traditional employment. Other full case studies are still in preparation. Three project image placeholders and the optional personal photograph remain incomplete.

Contact email and LinkedIn were verified against the existing CV. Source photographs/screens and conceptual visuals are distinguished in `ASSET-SOURCES.md` and their captions/alt text. No research outcomes, launch status or capabilities were invented.

Official references: [Vercel build configuration](https://vercel.com/docs/builds/configure-a-build), [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github).
