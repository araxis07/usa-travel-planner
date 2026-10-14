# October 14: download feedback and city-guide review

This batch adds visible offline download progress and per-trip photo coverage, fixes the announcement strip when text grows, reviews the six detailed city galleries, and checks the due Crater Lake guidance. It keeps the existing local planner, cache and five-language copy system. No dependency or database connection is added.

## Offline downloads

The worker reports completed/total application and photo files while saving. Progress is opt-in on the existing message protocol so already-open older clients still receive their expected final success/failure response. The client keeps the 90-second timeout as an inactivity timeout, resetting it after valid progress. Cached images are reused when retrying an interrupted save.

The download panel checks originals and responsive variants for the current trip and names states with missing files. Photo coverage is not presented as proof that every application module is cached. The success message appears only after the worker completes the save; changing the selected states or removing downloads clears that success for the current selection. Failed attempts refresh coverage and keep a visible retry explanation. Deleting photos leaves saved plans and expenses intact. Live maps and external links still require internet.

The shared photo-path helper is used for saving, checking and removal. No new cache format or persistent trip schema is needed. Storage eviction and interrupted connections remain possible; full JSON backups remain the durable export option.

## Content and images

On October 14, [NPS conditions](https://www.nps.gov/crla/planyourvisit/conditions.htm) and the [Mazama operator schedule](https://explorecraterlake.com/things-to-do/shopping-supplies/) still list fuel through October 13. NPS's overview still lists gas pumps as open. The five-language access note therefore says the published schedule has ended and later service is unconfirmed, and recommends outside-park fuel plus operator confirmation. Trail/road advice remains supported. Review dates move to October 14 with an October 16 follow-up; no real-time closure or reopening is asserted. JFK's existing October 16 follow-up is unchanged.

All 18 gallery photos for San Francisco, New York, Las Vegas, Boston, Chicago and Philadelphia were visually reviewed against their catalog descriptions. [The Las Vegas night photograph](https://commons.wikimedia.org/wiki/File:Las_Vegas_at_Night.JPG) is an ISS image from 2010; captions now identify that viewpoint and year in all five languages. The Philadelphia cover is aligned toward its taller buildings on narrow screens, and the New York cover keeps the Empire State Building spire inside the desktop crop. Both static and interactive guides use the same image-specific rules. Existing credits/licenses are preserved. No higher-resolution replacement was necessary for this targeted gallery review, and this is not a visual certification of the entire 450-photo catalog.

The announcement now grows around enlarged text rather than clipping it in a fixed-height strip. Static-page tests check that its message fits vertically, alongside the existing wider-font language-navigation test. Existing hero, gallery, keyboard, reduced-motion and sticky-navigation patterns are retained.

New offline messages were checked for equivalent meaning in English, Thai, Chinese, Japanese and Korean. Automated checks cover translated status/coverage text and preservation of notes and exact expense values while switching languages. Fluent-human translation flags remain pending. See the existing [device and language review protocol](usability-check.md) for checks requiring people and physical devices.

## Verification

The final production build generated 1,005 pages and passed content validation and TypeScript checks. All 19 production tests passed, including interrupted downloads, cached retries, five-language offline navigation, changed-trip coverage and photo removal without expense loss. Another 28 targeted browser tests passed for enlarged text, touch planning, backups, budgets and motion controls. Formatting and diff checks passed.

The visual review covered all 18 gallery images, the six Thai city covers on mobile and desktop, and 60 city/language/browser combinations (six cities, five languages, Chromium and WebKit). Arrival sections were checked at 390px and 320px with doubled text; no horizontal overflow or page errors were found. Final screenshots confirm the two cover crops and the actual Thai download-progress/completion states. Evidence is saved locally under `artifacts/2026-10-14-trip-readiness/` (ignored by Git).

Nine isolated cold-load measurements used the final production build, a 390px viewport, 4× CPU slowdown, 1.6 Mbps download and 150 ms latency. Service workers were blocked. Median LCP compared with the October 13 baseline:

| Page                    | Previous |    Final | Maximum final CLS |
| ----------------------- | -------: | -------: | ----------------: |
| English home            | 2,512 ms | 2,480 ms |                 0 |
| Thai Philadelphia guide | 2,436 ms | 2,420 ms |           0.00045 |
| Thai planner            | 1,420 ms | 1,472 ms |           0.00956 |

No run overflowed horizontally. These small timing differences are not evidence of a speed improvement or regression. The entry bundle is 112.41 kB gzip, up from 111.39 kB; transferred bytes rose by approximately 1.1–1.6 kB across these pages. No additional performance rewrite was justified by this measurement. These are local lab results, not field Core Web Vitals.

GitHub now runs production tests before the longer regular browser suite, so static-page, service-worker and offline failures are reported earlier without removing any checks. The complete regular suite remains a required CI check after push.

Physical phones, VoiceOver/TalkBack, fluent-human sign-off and a deployed-host review remain outside the available local/browser checks. No public deployment is claimed.
