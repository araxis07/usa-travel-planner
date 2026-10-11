# October 12: guide startup, editable arrivals and Boston

This batch implements the three agreed development tasks and the Rocky Mountain review due October 12. It adds no dependencies, database connection, photos or 3D scenes. Existing saved trips are not rewritten when published city guidance changes.

## Readable guide startup

On a direct visit to a generated guide, the entry now starts the destination component, selected state details and selected city data together, before replacing the published page. The component and resolved data are reused synchronously for that first render. Home, planner and shared-trip startup retain their existing loading paths; navigation from discovery still loads guide code on demand.

This removes the intermediate empty/loading view. It is not React hydration: the current generated HTML and interactive tree differ, so the page still changes to the interactive layout. The static heading, image, source links and language links remain available while modules load. If preparation fails, the published guide stays readable with a localized retry button that reloads the page. The app's interactive buttons become available after its modules are ready.

Regression coverage deliberately holds the city module, then either releases or fails the request. The successful case checks animation frames for a missing heading; the failure case checks that the original heading and official links survive, then uses retry to reopen the interactive guide even when the URL includes a section fragment. Existing direct-guide preload isolation and deferred planner coverage remain in place.

## Arrival editing in Studio

In **คู่มือเมืองและอาหาร**, expand a day and use **จุดเริ่มเที่ยว**. Add, edit or remove a reference using five-language labels and visitor notes, latitude/longitude, an official visitor source, an OpenStreetMap node source and the date actually checked. The coordinate license remains ODbL with OpenStreetMap attribution. The current node-only source format is retained.

New references start with empty text/date and two blank coordinates. Incomplete references can be saved to the existing city draft and restored after reload. Published content, previews and generated trips still require complete references. The shared validator has an explicit draft mode that permits blanks; it continues to reject non-finite/out-of-range coordinates, unsafe or credentialed links, malformed nonempty dates and unsupported coordinate sources/licenses. Traveler imports use strict validation. Blank coordinates never become zero automatically.

The editor reuses city draft/publication, revision conflicts, dirty-state protection and language review controls. A localized text edit clears that language's city flag; coordinate/source/date changes or adding/removing a reference clear all five city flags. Food flags/dates and whole-city check dates remain independent. No action automatically certifies a source or language review. Publishing changes future city plans; previously saved activities retain their copied references.

## Boston's three daily starts

Visitor information and coordinate sources were checked on October 12, 2026. These are suggested starting references, not on-site measurements, parking guarantees or a surveyed accessible route. The first point identifies an information office; the second is an outdoor landmark rather than a hall entrance.

| Day | Reference                                                                           | Coordinate source                                                                             | Visitor source                                                                                                                                                                      |
| --- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Boston Common visitor center, 139 Tremont Street                                    | [OSM node 3995359862](https://www.openstreetmap.org/node/3995359862), 42.3554005, −71.0637636 | [Meet Boston visitor center](https://www.meetboston.com/plan/visitor-center/)                                                                                                       |
| 2   | Samuel Adams statue outside Faneuil Hall, start for a short Downtown–North End walk | [OSM node 4776867029](https://www.openstreetmap.org/node/4776867029), 42.3599824, −71.0567717 | [NPS Dock Square](https://www.nps.gov/places/dock-square.htm), corroborated by [NPS's Samuel Adams account](https://www.nps.gov/articles/000/samuel-adams-boston-revolutionary.htm) |
| 3   | MFA Huntington Avenue entrance                                                      | [OSM node 11541163339](https://www.openstreetmap.org/node/11541163339), 42.339, −71.0951092   | [MFA entrances and accessibility](https://www.mfa.org/visit/accessibility)                                                                                                          |

MFA's current guidance names Huntington Avenue as the main entrance, closes Fenway to the public and directs visitors needing a level entrance to Linde Family Wing on Museum Road. The note retains those distinctions and asks visitors to check admission/opening days. The coordinate node connects to the Huntington-side approach and the building way in [MFA relation 63938](https://www.openstreetmap.org/relation/63938); no physical accessibility inspection is claimed. The general Getting Here page returned a 403, so the readable official accessibility page supplied the visitor guidance.

The three references include all five languages and appear in city previews, new 1–3 day plans, daily maps, JSON/text exports and print. Driving calculation remains an explicit user action and is not a measured walking route. Boston's whole-city/food dates and language flags are unchanged: this was an arrival-only review. Their next review remains October 17. Philadelphia's existing references and the other four cities' area guidance are retained.

Source retrieval records are under ignored `artifacts/2026-10-12-boston-studio/`. Some Overpass endpoints/queries returned errors; the successful query and the OSM API building-way/relation responses were used to verify the selected nodes.

## Rocky Mountain review

The [NPS timed-entry page](https://www.nps.gov/romo/planyourvisit/timed-entry-permit-system.htm) still gives general reservations through October 12, 09:00–14:00, and Bear Lake Road+ through October 18, 05:00–18:00, in local Mountain Time. The existing five-language text already distinguishes October 13–18 and the separate reservation/admission charges, so it was retained. This review does not assume the October 12 window has already ended in Colorado.

The [fees/pass page](https://www.nps.gov/romo/planyourvisit/fees.htm), [wilderness permit guide](https://www.nps.gov/romo/planyourvisit/wild_guide.htm), and [campground entry conditions](https://www.nps.gov/romo/planyourvisit/camping.htm) support the other existing sections. The supplement's checked date is now October 12 and its next check October 18, at the next listed reservation-season boundary. This does not assert future road access or campground availability. Crater Lake and New York remain scheduled for October 13; their records were not marked reviewed by this batch.

## Cold mobile lab measurements

The same local production script ran three cold Chromium samples per page before and after, at 390 × 844 / DPR 3, 4× CPU slowdown, 1.6 Mbps download, 750 Kbps upload and 150 ms latency, with reduced motion and service workers blocked. The final candidate run had no concurrent build or browser tests. These are small-sample lab observations, not field Core Web Vitals, INP or physical-device results.

| Page              | Before LCP samples (ms) | Final LCP samples (ms) | Median before → final | Resource transfer before → final | CLS before and final |
| ----------------- | ----------------------- | ---------------------- | --------------------- | -------------------------------- | -------------------- |
| English home      | 2536 / 2424 / 2536      | 2656 / 2780 / 2556     | 2536 → 2656 ms        | 615,605 → 616,992 B              | 0                    |
| Thai Philadelphia | 3400 / 3236 / 3184      | 3056 / 3160 / 2964     | 3236 → 3056 ms        | 477,449 → 477,767 B              | 0.000155             |
| Thai planner      | 1416 / 1464 / 1424      | 1436 / 1432 / 1420     | 1424 → 1432 ms        | 574,894 → 576,269 B              | 0.009553             |

The guide median improved by 180 ms (5.6%), while the home median was 120 ms slower (4.7%) and the planner 8 ms slower in this final run. The bootstrap adds a small payload cost; this is not a site-wide speed improvement claim. An earlier candidate measured a 2496 ms home median, so further repeated measurements are needed before attributing the home timing difference to this change. Final guide and home LCP remain above the 2.5-second target. No horizontal overflow was recorded. The primary confirmed startup improvement is retained readable content with zero missing-heading frames during the tested transition.

Raw before/final samples are in the ignored batch artifact directory. Transfer totals are the script's resource-entry totals, not full document transfer or a hosting/CDN measurement.

## Validation

- The regular suite exercised 201 checks: 196 passed in the full four-worker run; five existing mobile international checks hit their total timeouts. All five passed unchanged with one worker (23.3, 25.5, 19.1, 6.7 and 6.4 seconds). No timeouts were increased and no application change was needed for these reruns.
- New arrival coverage checks draft/publish API boundaries, unsafe values, five-language editing, blank-coordinate persistence, independent review flags, removal, retained personal trips, accessibility and mobile overflow. Boston and Philadelphia checks cover explicit routing, JSON/text exports, print and persisted removal.
- All 16 production cases are covered by passing results: 15 passed in the full run, including failed-module recovery with a section fragment. The remaining offline/print case passed after correcting the new assertion to inspect both the source link and its CSS-generated printed URL (including that URL in the accessible link name). This was a test correction, not an application defect.
- The final build passed content validation and TypeScript, and generated 1,005 localized pages. The final entry is 343.59 kB / 113.30 kB gzip.
- Boston was rendered at 390 × 844 in all five languages in Chromium and WebKit, with no page JavaScript errors or horizontal overflow. Representative Thai/Japanese arrival cards and the Thai Studio arrival form were visually inspected. Studio review used a disposable content copy; the owner's unpublished content and existing port 4000 server were left alone.
- The local PGlite SQL suite passed; it did not connect to a remote database. Production account checks intercept network requests and do not send email.

## Remaining checks

Physical iPhone/Android devices, VoiceOver/TalkBack, recruited users, fluent-language sign-off, on-site coordinate checks and the deployed host remain unchecked. No deployment was performed. The guide's shared catalog/entry payload and static-to-interactive layout change remain candidates for further measured work.
