# Reused assets and factual sources

- Design structure: existing Home V2 — Editorial × Hybrid Final, Work V1, About V1, Portfolio Sitemap and Wuhan Ship Case Study V2 exports in Desktop/作品集/Portfolio-制作记录与导出.
- `yp-monogram.png`: personal logo embedded in the current Portfolio Development DOCX, Figure 1.
- `workbench.jpg`, `task-inbox.jpg`, `form.jpg`: demonstration screens embedded in the same DOCX; not production data.
- `capso-flow.png`: CAPSO camera-to-caption concept flow, Figure 8 of the same DOCX.
- `lexflow-preview.png`: copied from the existing assets/lexflow/physical-evidence-hero-generated-final-v4.png. It is an AI-generated design exploration, not documentary field research.
- `original-workbench.jpg`: existing Wuhan Marine Machinery source material at Desktop/marine machine/design/raw-data/工作台.jpg.
- Identity, education, contact: existing English CV, Desktop/作品集/Yixiao_Peng_CV.pdf. Graduation dates omitted because source CV versions differ.
- Narrative and limits: current Portfolio Development DOCX and the user's confirmed Module 10 brief. No launch, adoption, quantified improvement or unverified responsibility claims added.

The original assets, old exports and source documents are preserved. No Figma or Google Docs file was modified.

## Wuhan case-study evidence — 2026-11-16

Online source: [武汉船机移动综合管理平台 UI 优化原型库 V0.1](https://www.figma.com/design/2umwD8QTLUKjvSTZDQNPOR). Accessed read-only; 30-page structure, current screen groups, Main Flow reaction targets and library organization inspected. All exports below are untouched PNGs from actual Figma nodes, including their existing presentation shells/shadows. No generated or invented screens are used.

| Asset in assets/wmmp/ | Node / provenance | Evidence class |
| --- | --- | --- |
| workbench.png | 949:2 | Core Flow design |
| messages.png | 949:265 | Core Flow design |
| statistics.png | 949:443 | Core Flow design |
| management.png | 949:590 | Core Flow design |
| all-business.png | 949:726 | Core Flow design |
| safety-form.png | 953:546 | Forms & States proposed safety form |
| exploration-01.png | 867:7 | Direction 01 exploration |
| exploration-04.png | 867:4 | Direction 04 exploration |
| foundations.png | 907:10 | Figma foundations specification |
| components.png | 909:3 | Directory; distinguishes built families from proposals |
| original-workbench.jpg | marine machine/design/raw-data/工作台.jpg | Existing application reference, copied unchanged |
| original-safety.jpg | marine machine/design/raw-data/安全生产管理.jpg | Existing application reference, copied unchanged |

Screens show illustrative prototype records. Core Flow exports may precede later August frontend changes; do not claim pixel identity with the frozen implementation. Safety form is not a one-to-one replacement for the original Safety hub. Architecture and message-path diagrams are editorial HTML summaries of source structure, not historical Figma artifacts.

Narrative sources: archived Phase 2 UX Problem Analysis; Phase 3 Navigation Structure V2; Phase 4 Wireframe Strategy and Design Principles; current pages.md/pages.json and raw-data-coverage.md; HomePage.js/businessTokens.js; August 7 original form comparison; August 10 current baseline and r6 handoff; August 11 interaction review and retrospective. The user confirms role, contribution, year and company submission. No employee interviews, usability metrics, launch, adoption or business impact is claimed.

## Visual case-study revision — additional source exports

Same Figma file, read-only downloads, unchanged PNGs:

| Asset | Figma node |
| --- | --- |
| message-list.png | 962:10 |
| message-detail.png | 962:41 |
| validation-error.png | 975:145 |
| discard-confirm.png | 975:165 |
| process-record.png | 953:1194 |
| hazard-form.png | 953:1302 |
| notification-settings.png | 952:279 |
| statistics-detail.png | 962:66 |
| exploration-02.png | 867:8 |
| exploration-03.png | 867:5 |
| exploration-05.png | 867:6 |
| exploration-06.png | 867:3 |

`component-button.png`, `component-status-badge.png`, `component-text-field.png`, `component-toggle.png` are copied unchanged from `marine machine/deliverables/WMMP正式交付包-2026-08-10-r6/设计与研究/Figma库导出/核心组件/`. They are actual offline Figma exports, not newly fabricated component screenshots.

The 37-cell visual page map is generated from the actual current `docs/page-database/pages.json`, grouped as 5 core entries, 27 business pages, 2 task/detail pages, 2 analytics pages and 1 settings page. It is a portfolio visualization of the inventory, not an original research workshop artifact. The pipeline's 121 screenshots / 18 forms / 199 fields come from raw-data-coverage and the current baseline/handoff. IA, hierarchy and handoff diagrams are newly authored editorial explanations of documented work. No additional participants, findings, validation or outcomes are implied.

The palette uses actual later `businessTokens.js` accents, labeled separately from earlier Figma UI: production #1660D4, safety #08A56D, maintenance #079B91, training #5A55C8, exceptions #E02B2B. Tabs switch displayed source sequences; they do not simulate live industrial workflow execution.

## Phase 3 — interactive reasoning and artifact trail

No external research or Figma writes. Original source imagery is unchanged. New visual diagrams and green emphasis boxes are portfolio editorial reconstructions, not historical research artifacts or annotations embedded in the originals.

- **Architecture:** route examples checked against `marine machine/apps/wmmp-mobile-vue2/docs/page-database/pages.json`, `HomePage.js`, `FeatureRoutePage.js`, `MessagePage.js`, `StatisticsPage.js`, and `ProfilePage.js`. The inventory is flat; parent/child examples additionally require route handlers. L1–L3 are depth in the illustrated route, not claims that every inventory entry has a validated global level. System choice, status filters, editing, breakdown/export entry and toggles remain labeled states. No separate Statistics/Management L3 page is inferred.
- **Five vs four:** archived `Phase 3 UX策略与信息架构/Future Page Tree V2.0` and `Navigation Structure V2.0` propose five destinations. Current inventory, code and August 11 retrospective document four. The reason/timing of the change is not presented as a recorded approval decision.
- **Audit connections:** existing three heuristic observations retained. Entry-priority response is supported by the retrospective §4.2/4.4 and current Figma Workbench. Distinct service/message roles are grounded in archived UX Problem Analysis IA-02, the retrospective and message-route code. Form-field constraints are supported by `docs/qa/原始表单对照修订-2026-08-07.md`; the Figma validation frame illustrates feedback only, not full field alignment or user-test results. Green outlines are normalized editorial emphasis on the displayed image bounds.
- **Evolution:** an artifact reading path, not an exact dated approval chain. Early audit/IA/visual dates are not asserted. `docs/qa/Figma库长屏复刻与视觉QA记录-2026-07-02.md` explicitly records reconstructing editable Figma pages from frontend renders, so design and implementation are described as iterative. `docs/qa/最终测试验收-2026-08-10-r6.md` records the frozen package; the August 11 retrospective and interaction review record the later local walkthrough and period-label limitation. No production release or company acceptance is inferred from QA.
- **New copied asset:** `prototype-workbench-2026-08-11.png` is byte-identical to `marine machine/docs/qa/evidence/2026-08-11-interaction-validation/05-final-workbench.png` (404×772). It is a local mock-data frontend screenshot after the August 10 handoff, not an r6 screenshot or a Figma frame. Existing user-confirmed AI-assisted contribution is stated separately; the image itself is not evidence of how code was authored.

### Wuhan Marine Machinery five-chapter case study

- `assets/wmmp/r6-workbench-task-overview.png` is a browser capture of the expanded task overview in the August 10, 2026 r6 mock-data build.
- `assets/wmmp/figma-library-overview.png` is the original library overview export from the r6 Figma handoff.
- `assets/wmmp/demo/` contains the five unchanged static files from the r6 mock-data handoff build. It demonstrates the project UI and basic interactions without a production backend.

### About photo edit

The following WebP derivatives are cropped and compressed from the local `myphpto/` archive. The exports omit original camera metadata. No source image or video is copied into the build.

| Derivative | Source | Placement |
|---|---|---|
| portrait.webp, portrait-small.webp | IMG_20260718_150341.jpg | Mountain portrait |
| model.webp | IMG_7687.HEIC | Physical model |
| climb.webp | acf7ccc196334128b8e95c1a072e020b.mov, frame at approximately 76% | Indoor bouldering |
| detail.webp | IMG_20260728_212138.jpg | Hand detail |
| guitar.webp | IMG_6913.HEIC | Electric guitar |
| sim.webp | IMG_7698.HEIC | Racing simulator |
| snow.webp | 07000f340d8a5a5ffd2fd2d3d7fd1efd.JPG | Snow outing |
| cat.webp | IMG_0908.HEIC | Cat portrait |
| steam-cs2.webp, steam-apex.webp, steam-wukong.webp, steam-elden-ring.webp | IMG_2408.PNG | Cover crops from the Xiaoheihe Steam library record. May 2026 playtime is transcribed as bilingual page text. |

### About design-process excerpts

- `assets/about/footwear-sketch.webp` is cropped from the original embedded sketch image in Figma P3 (`GuYfShMFNR1hMUyR0JHdhx`), node `1:4` within the Sketch section. The export crops blank space from the source layer.
- `sensory-garden-sketch.webp` uses the original embedded garden drawing from Figma P2 (`jCSMKpd72Wx8nkYRDtVoSX`), node `260:198`, with outer margins cropped.

## LexFlow · local case study

The website uses five isolated PNG exports from the editable [LexFlow Figma file](https://www.figma.com/design/Vm6nqNKn5vQAlvqUbWG39i/p4). LawPath screens are concept UI. The professional identity and details in the recommendation are illustrative. The two physical-prototype card designs belong to the fictional Missing Works of Art scenario.

| Web asset | Figma source |
| --- | --- |
| `assets/lexflow/web/home.png` | [Final LawPath Home](https://www.figma.com/design/Vm6nqNKn5vQAlvqUbWG39i/p4?node-id=2268-909) |
| `assets/lexflow/web/intake.png` | [Final Case Intake](https://www.figma.com/design/Vm6nqNKn5vQAlvqUbWG39i/p4?node-id=2268-910) |
| `assets/lexflow/web/recommendation.png` | [Signature Recommendation](https://www.figma.com/design/Vm6nqNKn5vQAlvqUbWG39i/p4?node-id=2268-911) |
| `assets/lexflow/web/clue.png` | [Original Clue / Lost surveillance](https://www.figma.com/design/Vm6nqNKn5vQAlvqUbWG39i/p4?node-id=2321-2492) |
| `assets/lexflow/web/evidence.png` | [Original Evidence / Transition agreement](https://www.figma.com/design/Vm6nqNKn5vQAlvqUbWG39i/p4?node-id=2321-2552) |

The website layout adapts the [web asset boards](https://www.figma.com/design/Vm6nqNKn5vQAlvqUbWG39i/p4?node-id=2518-906) into responsive HTML text, source images and captions. Research is paraphrased from the original boards and the case-study research synthesis. The consultation flow follows `2213:861`, the simulation sequence follows `2402:678`, and prototype feedback is summarized from `185:536` and `217:75`. The case-study route contains no research participant photographs.


## Navigate360

The case covers the Rutgers MBS Contextual Design team’s advising booking prototype. The four desktop and two mobile interface images were exported from Figma. The research affinity notes, User Environment Design diagram and confirmation sketch are excerpts from the team’s Week 13 submission. The confirmation detail is a crop of the desktop export. All source documents stay in the local records.
