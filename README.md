# Yixiao Peng — UX & Product Designer portfolio

Rutgers Module 10 portfolio, continuing the existing local project and its approved Editorial × Hybrid design. Native HTML, CSS and a small accessible navigation script; no frontend framework or package installation.

## Structure

- `index.html` — Home, with a Selected Work / Coming soon placeholder.
- `about.html` — completed background, approach/skills, experience, goals and interests; no case-study links.
- `work.html` — Wuhan Marine Machinery project entry; other projects remain unchanged.
- `wuhan-marine-machinery.html` — visual six-section UX case study; real Figma screens, original-product comparisons, architecture, system and reflection.
- `wmmp-case.css`, `wmmp-case.js`, `assets/wmmp/` — scoped case styles, accessible image detail dialog, section navigation and verified source exports.
- `archive/module10-project-pages/` and unrelated images remain private source material, excluded from the build.
- `styles.css`, `site.js` — shared design and navigation, unchanged.
- `scripts/build_site.py` — creates a clean `dist/` from a strict allowlist: four pages, shared/scoped styles and scripts, YP logo and the explicit Wuhan image list.
- `scripts/check_site.py` — validates references and the deployment allowlist.
- `vercel.json` — existing Vercel static-site settings, unchanged.

This is a temporary Module 10 presentation decision. Build into `dist/`; never publish the repository root. Unrelated historical project paths remain excluded. The Wuhan path is enabled in the new local build; this work has not been deployed.

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

## Wuhan case study — local review (2026-11-16)

Preview `dist/` only: `python3 -m http.server 8790 --bind 127.0.0.1 --directory dist`. Work links to `wuhan-marine-machinery.html`. Home, About, shared CSS/JS and the existing cursor are unchanged. No commit, push or deployment was performed for this case study.

The narrative uses the current marine-machine page database, August 10 r6 delivery, original screenshots, archived research/IA/wireframe strategy, August 7 form comparison and August 11 QA/retrospective. Screens were exported from the actual Figma file `2umwD8QTLUKjvSTZDQNPOR`; see ASSET-SOURCES.md for node mapping. Some Figma views precede later implementation refinements. Document analysis and design goals are explicitly distinguished from employee research and measured outcomes.

### Visual revision — 2026-11-16

The case study now emphasizes a source-derived 37-page map, research inventory pipeline, four-destination architecture, hierarchy comparison, all six Figma explorations and screen flows. Main-content text is reduced from 1,815 to 952 words/tokens under a consistent HTML-text count (including captions and collapsed evidence notes; this is an editorial count, not reading-time data). Four accessible tabs group Messages, Safety & Forms, Interaction States and Statistics; all panels remain readable without JavaScript. Additional real screen/state exports and four offline Figma component specimens are published through the explicit image list. The earlier text-heavy version is preserved in the task backup. Work/Home/About and shared styles/cursor are unchanged by this revision.
