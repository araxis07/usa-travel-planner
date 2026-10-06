# City plans, guide navigation and loading stability — October 7

This round adds a Philadelphia 1–3 day trip preview, current-section guide navigation and suggested-start labels. It reuses the existing city text, starter-plan generation, trip library, schedule editor, printing and offline saving. The catalog remains six detailed cities, nine route templates, 150 destinations, 450 photographs and 1,005 generated pages. No dependency or database connection was added.

## Philadelphia guide to trip

The native preview disclosure in the Philadelphia guide lets travelers select one, two or three days before creating a new trip. Each day pairs local travel, the published visit, that day's meal stop and rest. Visit notes retain the weather alternative. The local-travel block uses an editable 30-minute planning allowance, not a researched travel time. All start times are unset; the planner derives suggestions until travelers set their actual start times and durations.

Individual venues and restaurants remain custom, unmapped activities until their entrances are source-checked. The published guide still supplies official and Maps search links. Existing source/review dates and pending language-review flags remain unchanged. City budget examples are not entered into the new expense ledger. Creating a plan preserves the previous trip and expenses through the existing library and its capacity/storage-error handling. Other cities retain their current guides; this first creation flow is deliberately limited to Philadelphia.

## Navigation and time labels

All destination pages now keep a sticky contents bar below the measured header. The current section has `aria-current="location"` and an underline; narrow screens use a native horizontally scrollable row. Header and contents resizing update the anchor spacing. Scroll reads are limited to one animation frame, and listeners/observers are removed when leaving the guide. Native links retain keyboard and history behavior.

The shared timeline records whether a start was derived. The planner, printed itinerary and read-only trip rendering show the same five-language suggested-start label. Setting a start time removes the label for that activity; duration and travel buffers remain editable planning values.

## Before/after lab measurements

Three cold Chromium runs per page used 390 × 844 CSS pixels, DPR 3, reduced motion, service workers blocked, 4× CPU slowdown, 1.6 Mbps download, 750 Kbps upload and 150 ms latency. Builds and browser test suites were finished before each measurement. The planner used the same saved three-day sample with one unset-start activity in both runs. Initial source code was commit `6aef809`; the measurement script extension does not change the application.

| Page                    | Median LCP before | Median LCP after | CLS before | CLS after |
| ----------------------- | ----------------- | ---------------- | ---------- | --------- |
| English home            | 2.404 s           | 2.464 s          | 0          | 0         |
| Thai Philadelphia guide | 3.988 s           | 4.000 s          | 0.5130     | 0.0002    |
| Thai daily planner      | 1.364 s           | 1.352 s          | 0.5226     | 0.0096    |

The large shift came from the footer appearing near the top while a deferred page was loading, then moving below the finished page. The shared loading main now reserves the viewport height below the header, so the footer stays below the fold during loading. A production regression holds both deferred modules and checks this layout before allowing them to complete. The measured guide and planner shifts dropped in all three runs; none of the nine before or after page runs had horizontal overflow.

There is no claimed LCP improvement. These small timing changes from three runs are not evidence of a speed gain; the guide remains around four seconds on this slow profile and still needs loading optimization. These are local lab observations, not field Core Web Vitals, INP measurements or physical-phone acceptance. Raw reports are ignored artifacts under `artifacts/2026-10-07-guides-before/` and `artifacts/2026-10-07-guides-after/`. Reproduce after a build with:

```sh
node scripts/review-workspace.mjs --performance-only --all-pages --output=artifacts/your-review
```

## Validation

TypeScript, content validation, the production build, formatting, whitespace checks and local PGlite compatibility checks passed. The full regular suite passed **168 tests** across its Chromium desktop/mobile and targeted Firefox, WebKit and Android profiles. The production suite passed **14 tests**, including held-module loading stability and offline Philadelphia preview, creation, reload and printing. New checks validate all fifteen city-plan duration/language combinations, original-trip and expense preservation, weather/food notes, manual-start label removal and five-language contents navigation with enlarged text. Account compatibility checks use mocked requests; no remote database or real email action was used.

Thai screenshots were reviewed at 1,440 and 320 pixels for the city preview, active food section and planner time labels; both journeys had no page errors or horizontal overflow. Fluent-language, physical-device and deployed-host reviews remain pending.
