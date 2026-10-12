# October 12: New York arrivals, readable startup and Studio issue navigation

This batch implements the agreed next four tasks: an early New York/Crater Lake source review, lighter and more consistent guide startup, actionable Studio errors, and New York's three daily arrival references. Existing local trip storage, draft/publication boundaries and independent food/language reviews remain. No dependency or database connection was added.

## Guide startup and loading

Generated state/place pages now use the existing guide cover, gradient, typography, original-language title and responsive sizing. The static header offers real language/home links; the cover links to the original photograph and readable guide content. Source credits are visible before JavaScript loads. The shared styles preserve the cover's position and dimensions when the interactive guide replaces it. This is still replacement, not hydration, and the static links differ from the interactive planning controls.

The guide restores a `#guide-…` target after mounting, below the header and contents navigation. This also works after the failed-module retry. The existing static-content retention and retry behavior remain.

Long source URLs wrap in the static guide body. A 320-pixel, doubled-text check exposed a subway-source link wider than the viewport; the fix preserves the full link and all content instead of hiding overflow. This is a layout stress check, not an emulation of OS text settings.

The comparison and add-place dialogs load on demand behind the existing loading treatment. Comparison validation moved to the shared destination module unchanged, so checking saved comparison IDs does not pull in a dialog. Production coverage checks that these dialogs are absent from initial home requests and the initial service-worker shell. Explicit offline saving still includes the app's deferred functionality.

The final entry decreased from 343.59 kB / 113.30 kB gzip to 336.45 kB / 111.35 kB gzip. The shared catalog is still substantial; this does not remove all startup work.

## Cold mobile lab results

Three cold Chromium runs per page used the existing script at 390 × 844 / DPR 3, 4× CPU slowdown, 1.6 Mbps download, 750 Kbps upload and 150 ms latency. Service workers were blocked and reduced motion enabled. No builds or browser tests overlapped the measurement batches. The after column uses the final build, remeasured after the static URL wrapping fix. The earlier candidate batch is retained under `artifacts/2026-10-12-new-york-studio/after/`; its home/guide/planner medians were 2552/2424/1424 ms. Final raw samples are under `final-performance/`.

| Page              | Before LCP samples (ms) | After LCP samples (ms) | Median before → after | Resource bytes before → after |
| ----------------- | ----------------------- | ---------------------- | --------------------- | ----------------------------- |
| English home      | 2648 / 3480 / 2648      | 2572 / 2464 / 2484     | 2648 → 2484 ms        | 616,992 → 615,146             |
| Thai Philadelphia | 3128 / 3460 / 3024      | 2420 / 2424 / 2428     | 3128 → 2424 ms        | 477,767 → 475,983             |
| Thai planner      | 1540 / 1404 / 1432      | 1516 / 1416 / 1420     | 1432 → 1420 ms        | 576,269 → 574,449             |

The guide median improved by 704 ms (22.5%) and all three final guide samples were below the 2.5-second lab target. Home improved by 164 ms to a median just below that target, but one final home run remained above it. Planner changed by 12 ms. The full samples, including the slower baseline outliers, are retained; three samples do not establish a field performance guarantee.

Home CLS stayed zero. Guide CLS increased slightly from 0.000155 to at most 0.000443; planner's maximum remained 0.009553. No horizontal overflow was recorded. Resource totals exclude the HTML document and are not whole-site transfer sizes; the richer static guide adds markup. These measurements are not INP, field Core Web Vitals, CDN or physical-phone results.

## Studio issue navigation

City issues now identify the city, day/section, field and relevant language in readable Thai. Activating an issue selects the city and language, opens the containing disclosure and focuses the field. Text/number/date/source fields have associated inline descriptions and invalid state. Drafts and other cities' unsaved changes survive navigation. The issue panel explains why preview/publication is disabled while draft saving remains available.

Dates, individual budget values and missing/out-of-range coordinates report their specific field. A reversed meal allowance focuses its upper bound. The shared validator still rejects incomplete publication, unsafe URLs and malformed data. Shared `copy` entries remain file-only; their issues explicitly say where to edit them instead of offering a dead jump link. Editing or focusing a field does not certify a language or advance a review date.

## New York's three daily starts

Visitor sources and OSM records were checked October 12, 2026. The first two are landmark references, not entrances; the third is an OSM-tagged pavilion entrance. These are not surveyed walking routes, ferry boarding points, parking spaces or guarantees of step-free access.

| Day | Reference                                                     | Coordinate source                                                                               | Visitor source                                                     |
| --- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | Josephine Shaw Lowell Fountain, Bryant Park's western terrace | [OSM node 1289222389](https://www.openstreetmap.org/node/1289222389), 40.7539846, −73.9840908   | [Bryant Park grounds](https://bryantpark.org/the-park/the-grounds) |
| 2   | Charging Bull, north end of Bowling Green                     | [OSM node 373069793](https://www.openstreetmap.org/node/373069793), 40.7055641, −74.0134462     | [NPS Bowling Green](https://www.nps.gov/places/bowling-green.htm)  |
| 3   | Jane's Carousel pavilion entrance                             | [OSM node 11687024852](https://www.openstreetmap.org/node/11687024852), 40.7043363, −73.9924978 | [Operator directions](https://janescarousel.com/directions/)       |

The fountain note directs visitors beside the fountain rather than treating its center as a walkable entrance or drinking-water point. The sculpture note distinguishes it from a ferry terminal and asks visitors to use pedestrian crossings. The carousel note retains the operator's Dock Street/Main Street approaches and separates a waterfront walk from optional carousel tickets/hours. OSM's [pavilion way 223183095](https://www.openstreetmap.org/way/223183095) contains the selected entrance node. All three references preserve ODbL attribution and five-language notes in previews, new trips, maps, exports and print. Existing saved trips are not rewritten.

Overpass requests returned HTTP 406/429; source IDs were discovered through indexed results and then checked against the primary OSM API node and full-way responses. The successful records are retained under ignored `artifacts/2026-10-12-new-york-studio/`.

## October 13 review queue: early check, deadline retained

The [JFK disruption notice](https://www.jfkairport.com/alerts-advisories/airtrain-jfk-full-service-disruption) and [AirTrain page](https://www.jfkairport.com/transportation/airtrain) confirm the overnight October 13–15 windows, ending the morning of October 16 in New York local time. The note now adds the official ground-level bus pickup guidance and Lot 66 transfer for Jamaica-to-terminal passengers, with the direct disruption link. [MTA's JFK guide](https://www.mta.info/guides/airports/jfk) supports the existing separate fares and rail connections. No LIRR bypass of the AirTrain disruption is implied. Only airport guidance and arrivals changed; whole-city/food review dates were not advanced. New York remains due October 13.

[Crater Lake conditions](https://www.nps.gov/crla/planyourvisit/conditions.htm) still list October 13 for Mazama Village fuel, Cleetwood Cove closure and traffic control on open East Rim Drive. [Directions](https://www.nps.gov/crla/planyourvisit/directions.htm) support the existing entrance guidance. Existing translated guidance remains accurate to those retrieved pages, so its wording was retained and the profile/advisory checked dates advanced to October 12. The October 13 follow-up and coordinate-review date were retained. NPS's facilities summaries remain inconsistent, so this review makes no new promise about lodging or restaurant availability.

## Validation and external checks

Focused checks passed for Studio navigation/drafts/validation and delayed/failed guide loading, cover geometry across five mobile languages, fragment restoration and initial dialog deferral. The regular suite now uses two workers locally as well as in CI to reduce contention seen with four workers; no timeout was increased.

The full regular run finished with 203 passes and two Studio failures. Those exposed an old raw-path expectation and a real missing root-level language match (`intro.3`). The mapper was corrected and the issue-navigation regression now explicitly opens the Japanese introduction. Both affected cases and the expanded navigation case passed on desktop and mobile (four focused passes). The already-passing regular cases were not rerun.

The first full production run had 16 passes and one obsolete direct-child advisory selector after the static body wrapper changed. The selector now targets the new body, retaining checks of every advisory's text, source and date. The same case also checks five static New York pages at 320 pixels with doubled text. The final full production run passed all 17 cases in 32.2 seconds.

Chromium and WebKit visual checks covered all five New York languages, the new arrival card and static doubled text; Studio's issue panel and invalid fields were inspected at mobile width. No horizontal overflow remained. The scripted Chromium journey passed discovery → two-day preview → creation → day-two activity → itemized budget → backup preview → Thai language → offline reload, with exact saved-trip equality. WebKit passed the editing/backup sequence, but its browser-offline reload reported an internal error. With the origin server stopped instead, the planner rendered and saved-trip equality passed; a missing uncached homepage hero image still produced WebKit resource errors, so the zero-error WebKit offline check did not pass. This remains a follow-up for real Safari testing, not a claimed clean offline result.

Local PGlite cloud regression checks passed without connecting a database or sending mail. The existing development server on port 4000 was preserved.

The final production build generated 1,005 localized pages. TypeScript, content validation, repository-wide Prettier checks and `git diff --check` passed. Source review dates remain October 12; the October 13 checks are still due and are not implicitly renewed by the commit date.

Physical devices, OS keyboards, VoiceOver/TalkBack, fluent-speaker sign-off, on-site coordinates and the deployed host still require separate checks. No deployment was performed. San Francisco, Las Vegas and Chicago arrival references remain outside this batch.
