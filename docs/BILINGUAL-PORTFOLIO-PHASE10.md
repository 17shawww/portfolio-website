# Phase 10 — Bilingual portfolio & Coming Soon

Status: local implementation reviewed; user authorized removing regional email labels and pushing the current site on 2026-11-16. Deployment evidence is recorded separately in the project log.

## What changed

The real Wuhan Marine Machinery case remains the featured Work project. A secondary, generic Work-in-progress composition now uses the existing YP mark, editorial type and frosted layers. Fine-pointer input opens a feathered reveal; a real button opens “In the making.” Reset and Escape return focus to the trigger. Touch uses the same disclosure. Reduced motion disables pointer movement; JavaScript-off visitors receive a static message. There are no invented projects, clients, screenshots, delivery dates or results.

All four pages now have English and reviewed Simplified Chinese output. Navigation, footer, project facts, captions, alt text, accessible labels, controls, statuses, error messages and metadata are included. Proper names, tool names, color values, technical tokens and the original screenshot pixels are preserved where appropriate. The contact email remains pengyixiaoshaw@gmail.com.

## Shared architecture

- The four existing English HTML files remain the content and semantic structure source. No second set of independently maintained source pages.
- `locales/catalog.json` contains 643 reviewed entries: 615 translated pairs and 28 deliberately preserved tokens. Keys are the first 12 SHA-256 characters of the normalized English string. Unchanged copy keeps its key; editing English requires reviewing its paired translation.
- `scripts/localize_site.py` uses Python's standard HTML parser. The build emits eight complete static pages, localized titles/descriptions/Open Graph text, reciprocal en/zh-Hans/x-default links, canonical URLs and an eight-URL sitemap. The historical root sitemap is preserved; the public sitemap is generated into `dist/`.
- Explicit Chinese Home route: `/zh/index.html`. Other Chinese routes: `/zh/work.html`, `/zh/about.html`, `/zh/wuhan-marine-machinery.html`. Existing English URLs retain their paths and Home's `/` canonical. File paths avoid introducing a directory-slash canonical conflict with the existing `trailingSlash:false`, `cleanUrls:false` Vercel settings. Configuration is unchanged.
- Assets and internal page links are root-absolute. Switching a route in place therefore cannot change image or script resolution.
- The build creates `i18n-data.js` from the catalog; do not edit that generated file. Its current payload is 69,483 bytes, approximately 20,244 bytes when gzip-compressed locally. This is a size measurement, not a production transfer benchmark.
- `i18n.js` enhances real language links. It updates existing text nodes and attributes, keeps original node references in WeakMaps, and observes controller-generated content. Known numeric statuses and composed caption grammars are localized without rerunning controllers. Unknown runtime strings remain readable in English and appear in `portfolioI18n.missing`; missing source strings fail the build.
- Language changes retain selected directions, pair values, tabs, workflow steps and open dialogs. A visible reading anchor compensates for text reflow. The selected language is stored locally; storage failure does not prevent switching. History state/hash are retained with `replaceState`. Back/Forward and persisted-page restoration retain a coherent locale.
- Chinese output has `lang="zh-Hans"`; system CJK fallbacks require no font download. The mobile switch occupies its own menu row, and Chinese About hero type has a small-width adjustment to avoid an isolated final word.

The route/indexing approach follows [Google's localized-version guidance](https://developers.google.com/search/docs/specialty/international/localized-versions); in-place URL changes use [History.replaceState](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState). File-based Home routing was checked against [Vercel's trailingSlash configuration](https://vercel.com/docs/project-configuration/vercel-json#trailingslash).

## Translation coverage

Counts are unique normalized strings containing Latin characters, per source page, including relevant metadata and accessible/source-gallery labels. Repeated shared text is counted once within each page. Original Chinese UI terms and punctuation-only nodes do not need a Chinese translation.

| Source page | Reviewed source strings | Translated | Intentionally preserved | Missing |
|---|---:|---:|---:|---:|
| Home | 40 | 34 | 6 | 0 |
| Work | 49 | 44 | 5 | 0 |
| About | 87 | 78 | 9 | 0 |
| Wuhan case | 496 | 477 | 19 | 0 |

Preserved strings are enumerated in `translation-coverage.json` in the review folder. They include Yixiao Peng, LinkedIn, MindAware, Chakra Solutions, Figma/Notion, ChatGPT/Codex, WMMP, UI/IA/QA, font names, hexadecimal values and pixel units. The source screenshots retain their real Chinese interface content in both language versions; translating their pixels would alter the evidence.

Dynamic coverage was tested separately: two 51-observation controller runs (Chinese direct load and English-to-Chinese switching), six composed exploration descriptions, two failed-image scenarios, navigation, Coming Soon, viewer controls and reduced-motion/touch alternatives. No missing runtime translations were reported in these exercised states. This is verified coverage of the source inventory and observed states, not a claim that every future string or browser condition has been exhaustively tested.

Terminology: Workbench = 工作台; Messages = 消息; Statistics = 统计; Management = 管理; information architecture = 信息架构; heuristic analysis = 启发式分析. Product audit is not described as employee testing. Summer 2026 internship, research/IA/UI, AI-assisted local prototyping and company submission remain distinct from unconfirmed launch, approval, adoption and business impact.

## Validation

Run from the repository root:

```sh
python3 scripts/build_site.py
python3 scripts/check_site.py
python3 scripts/check_localization.py
python3 -m http.server 8790 --bind 127.0.0.1 --directory dist
```

Only serve/publish `dist/`.

Completed local Chrome checks:

- Eight built pages, 416 local references, explicit output allowlist, metadata, language attributes and reciprocal alternate links: no validation errors.
- Four pages × two languages × 320/390/768/1024/1440px: 40 layout checks, no horizontal overflow or normal-load JavaScript/console errors.
- Direct links, no-JavaScript language anchors, local preference, cross-page navigation, refresh and Back/Forward; storage-blocked fallback.
- Coming Soon pointer/reset, native keyboard activation, Escape, focus return, touch and reduced-motion static treatment.
- Six directions, pair comparison, before/after choices, three storytelling groups, all four workflow tabs and their documented steps, grouped viewer and language switching during active state.
- Loaded and failed images; translated fallback text retains the original-file escape route.
- Signature ink formation/reformation and kinetic title; original Work-to-case/return transitions, interruption/reduced-motion cancellation and missing-API/no-JS fallbacks.
- Chinese Work-to-case and browser Back: five named native transition snapshots and completion cleanup.
- Scroll-driven gallery depth/settling/fast reversal, screenshot sharpness, ripple restoration, magnetic hit-area stability, idle frame cancellation and mobile static fallback.
- Approved cursor-ink code compared byte-for-byte against the baseline: unchanged. Other signature, project-transition and immersive source modules and all source images are unchanged.

Visual review found and fixed Chinese mobile headline wrapping and the mobile menu's compressed navigation labels. Desktop and phone captures include both languages, six case sections, selected direction, viewer, workflow and Coming Soon states. Long case screenshots are stitched from overlapping real viewport captures; Chrome's oversized full-page compositor repeated pixels, so those raw captures are not the final review evidence.

## Exact source files changed

Existing: `.gitignore`, `work.html`, `site.js`, `scripts/build_site.py`, `scripts/check_site.py`.

New: `locales/catalog.json`, `scripts/localize_site.py`, `scripts/check_localization.py`, `i18n.js`, `localization.css`, `coming-soon.js`, `docs/BILINGUAL-PORTFOLIO-PHASE10.md`.

The only change in `site.js` prevents a language-link activation from closing the mobile menu and hiding its focused link. Cursor code and controller initialization remain intact. Existing Home/About/case source copy, imagery, professional destinations and footer email were not rewritten.

## Dependencies, limits and deployment

No new package, font service, translation service, third-party animation code or copied visual asset. The new code uses native browser APIs and Python standard libraries. Existing asset attribution is unchanged; no additional third-party license obligation was introduced.

Safari/iOS hardware, Android hardware and screen-reader testing remain unverified. CSS mask/backdrop-filter support and CJK system fonts can vary; the button/static text fallback remains usable. Existing image payload sizes are unchanged. A stored preference on an English direct URL is applied during deferred initialization; explicit Chinese URLs are already translated before JavaScript. Runtime templates added later need a reviewed grammar/pair and a browser regression; a dictionary is not an automatic translation engine.

Read-only Vercel verification confirmed existing project `yixiao-peng-portfolio`, ID `prj_EFoJgOAuAdWw8jFuzjrtV6ezTAni`, Production Ready deployment `dpl_3LWQqwuThAWBB9N8ZdjvqSjcSq4y`, source `17shawww/portfolio-website` main at `dc4463a3b35cc80bf0dc00ccf13da6bd493762fb`. That live baseline was not changed. The Chinese routes exist only locally until a separately approved deployment. Real Vercel routing, headers, caching and post-deployment checks must be verified after approval; local Python serving does not prove those platform behaviors.

Review the local visual experience and Chinese voice before authorizing a commit, push or replacement of the existing production deployment. No new Vercel project is needed.

## Final contact update

The shared footer now offers Gmail and 1277113023@qq.com as aligned mailto links, without regional captions, as requested. This adds the four source footer edits and a small styles.css rule to the Phase 10 file list above. User authorization to push the current version supersedes the local-only review gate; production evidence belongs in the dated project release report.
