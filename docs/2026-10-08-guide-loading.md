# Direct guide loading — October 8

Direct state and place pages now start loading the guide and the selected state's photo credits and practical details from their generated HTML. A cold Thai Philadelphia guide's median LCP dropped from **4.032 s to 3.480 s** in the same local slow-network profile, with measured resource transfer down **15.6%**. The six-city catalog, editorial text, source/review dates and pending human-language review flags are unchanged. No dependency or database connection was added.

## Loading changes

The existing Vite catalog plugin derives fifty state-detail modules from the single editorial source, `content/states.json`. Each contains that state's nine credited photos and three complete place profiles. Its generated import map loads only the requested state. A cached import promise is read by React's `use` inside the existing Suspense boundary, retaining the reserved loading height while the module arrives. Switching language reuses the same state details.

The destination page and fullscreen gallery consume those complete records. The quick-view dialog still resolves its photo records with the existing helper; atlas/landmark previews retain their deferred shared photo-credit module. The now-unused whole-catalog practical-details helper and build view were removed.

The page generator reads Vite's manifest and follows static imports for the guide, plus the selected state's detail module. It excludes modules already declared in the HTML and does not follow other dynamic imports. The homepages retain their existing deferred discovery/atlas behavior. These hints apply to generated state/place paths; legacy query links continue to load their guide on demand. This uses [Vite's manifest and dependency metadata](https://vite.dev/guide/backend-integration) and native [modulepreload](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/modulepreload).

Explicit offline saving still downloads every application module, including all fifty detail modules, so previously available offline guide data is preserved. The generated worker's existing module list and update behavior handle the new chunks. Separately compressed state records overlap with the shared quick-view photo credits and make the total offline module set larger; this round claims a smaller cold-guide download, not a faster or smaller full offline download. The fifty state modules together are about 291 kB gzipped; the Philadelphia module is about 5.7 kB gzipped.

## Before/after measurements

Both builds used three cold Chromium runs per page at 390 × 844 CSS pixels, DPR 3, reduced motion, service workers blocked, 4× CPU slowdown, 1.6 Mbps download / 750 Kbps upload and 150 ms latency. The planner used the same saved three-day sample with one unset-start activity. No build or browser test suite ran during either measurement set. Baseline code was commit `847cc3b`.

| Page                    | Median LCP before | Median LCP after | CLS before | CLS after | Resource transfer before | Resource transfer after |
| ----------------------- | ----------------- | ---------------- | ---------- | --------- | ------------------------ | ----------------------- |
| English home            | 2.480 s           | 2.428 s          | 0          | 0         | 612,226 B                | 612,216 B               |
| Thai Philadelphia guide | 4.032 s           | 3.480 s          | 0.00015    | 0.00015   | 798,234 B                | 673,886 B               |
| Thai daily planner      | 1.376 s           | 1.352 s          | 0.00955    | 0.00955   | 570,716 B                | 570,706 B               |

The guide's three before LCP readings were 4.112 / 4.032 / 3.996 s; final readings were 3.500 / 3.480 / 3.456 s. Its median decreased by 552 ms (13.7%). The final guide loaded only the Pennsylvania detail module and neither whole-catalog photo credits nor the former practical-details chunk. No horizontal overflow appeared in any of the nine final runs. The small home/planner changes are not evidence of a speed gain.

Preloading the previous whole-catalog modules alone was also tried. Its guide median was 3.868 s and resource transfer stayed at 798,234 B: starting requests earlier left the large payload intact. The final implementation combines earlier discovery with per-state records.

These are local lab observations, not field Core Web Vitals, INP, real-host or physical-phone acceptance. The city guide remains above 2.5 seconds on this profile; further work should investigate the remaining main/guide payload and the replacement of generated content during app startup using fresh measurements.

Reproduce after `npm run build`:

```sh
node scripts/review-workspace.mjs --performance-only --all-pages --output=artifacts/your-review
```

The script now records `stateDetailsLoaded` alongside the previous whole-catalog flags. Ignored raw reports are in `artifacts/2026-10-08-guide-speed-{before,preload,final}/`; the initial per-state measurements and screenshots are in `artifacts/2026-10-08-guide-speed-after/`.

## Validation

The build generated all 1,005 localized pages and passed content validation and TypeScript checking. All **168 regular browser checks** and **15 production checks** passed, along with local PGlite compatibility, formatting and whitespace checks. Production checks cover early detail requests while the entry module is held, readable generated city/park/state content before the app starts, one selected-state module, unique preload hints, deferred home modules, photo credits and galleries, five-language practical guidance, worker updates, explicit offline saves/reloads and printing. The loading-height regression additionally holds the selected state's detail module independently of the guide component. Account requests remain mocked; no remote database or real email action was used.

English desktop and Thai mobile screenshots were captured for guides, practical notes, atlas scenes, budgets, backup and planning. Their journeys reported no page errors or horizontal overflow. Physical-device, fluent-language and deployed-host reviews remain pending.
