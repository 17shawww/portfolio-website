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
