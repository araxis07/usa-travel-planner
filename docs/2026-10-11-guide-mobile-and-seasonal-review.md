# October 11: lighter city visits, readable mobile heroes and seasonal guidance

This batch covers the three agreed priorities: review information approaching its October 12–13 deadlines, reduce guide loading, and check the mobile planning journey. No dependency, database connection or travel-data format was added.

## Guide loading

The baseline trace showed `PlacePractical` importing `ParkBooking` even for cities where it rendered nothing. That dependency brought the full preparation content into the city visit. A separate diagnostic recorded the static cover at 2.488 s, replacement with the app loading state at 3.010 s, and the interactive guide at 3.311 s. The final cover paint, not a second image download, became the largest-contentful paint.

`PlacePractical` now loads the booking supplement only for IDs derived from the existing editorial file. There is no second manually maintained park list. A local Suspense boundary keeps the rest of the guide available while it loads. Generated park pages preload the supplement and its dependencies; city and state pages do not request it. Preparation dialogs and explicit offline downloads retain their existing content.

The full preparation chunk is about 27.68 kB gzip and is now deferred on city visits. The photo-lightbox chunk is about 1.48 kB gzip after preparation content moves out. No image, language, guide section or credit was removed.

Both sets below used three cold Chromium runs per page: 390 × 844, DPR 3, reduced motion, service workers blocked, 4× CPU slowdown, 1.6 Mbps download / 750 Kbps upload, 150 ms latency. No builds or browser tests ran during either set. Transfer totals cover the script's navigation window, not a full scrolled visit.

| Page              | Median LCP before | After   | Transfer before | After     | CLS after |
| ----------------- | ----------------- | ------- | --------------- | --------- | --------- |
| English home      | 2.460 s           | 2.428 s | 615,533 B       | 615,605 B | 0         |
| Thai Philadelphia | 3.308 s           | 3.184 s | 504,610 B       | 477,449 B | 0.000155  |
| Thai planner      | 1.396 s           | 1.404 s | 574,827 B       | 574,894 B | 0.009553  |

The guide transferred 27,161 fewer bytes (5.4%); its median LCP decreased 124 ms (3.7%). Before runs were 3.340 / 3.304 / 3.308 s; after runs were 3.212 / 3.180 / 3.184 s. Home/planner differences do not demonstrate a speed gain or regression. CLS was unchanged.

The guide still exceeds the 2.5-second lab target. The shared entry/catalog payload and static-to-interactive replacement remain. These are not INP, field Core Web Vitals or physical-phone results.

Reproduce after `npm run build`:

```sh
node scripts/review-workspace.mjs --performance-only --all-pages --output=artifacts/your-review
```

Raw baseline/candidate reports, the diagnostic trace and logs are under ignored `artifacts/2026-10-11-guide-mobile/`.

## Mobile hero and planning journey

At 320 × 360 with doubled hero text, the fixed-height hero clipped the place title and region in all five languages. The absolute gallery button overlapped the title or primary action. Chromium and WebKit both reproduced it; the old hero stayed only 234 px tall.

The hero now has a minimum height and grows with its content. The gallery button stays in the layout above the title/actions, and long headings wrap within their container. Enlarged text can make the section taller than one screen; every control remains reachable by scrolling.

The regression covers all five languages at 320 × 360 and 844 × 320, doubled text, clipping/overlap, touch activation and closing of the gallery, and opening the add-to-plan dialog. The existing enlarged-caption gallery test separately checks keyboard activation and focus restoration. A WebKit event trace confirmed that tapping blurs even a programmatically focused button before its click handler; a touch test must not assume a keyboard focus origin. This is a layout stress test, not OS text sizing or an OS keyboard test.

Separate scripted production journeys in Chromium and WebKit used fresh browsers to search for Philadelphia, open its guide, preview/create a two-day plan, add a day-two activity, enter a hotel expense/deposit, download a full backup, open its restoration preview, switch to Thai and reload. Activity edits, two arrival references and expenses survived unchanged. Both journeys reported no page errors or document-level horizontal overflow. This is automated interaction, not a recruited user study.

## Official-source review on October 11

The deadlines remain in the future. An early check does not certify conditions on the travel date, so October 12–13 follow-ups remain scheduled.

| Record                            | Result                                                                                                                                                                                                                                    | Review metadata                                                                                               |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Rocky Mountain booking supplement | Clarified that during October 13–18, Bear Lake Road+ still requires reservations in its specified hours although general timed entry ends October 12. Admission stays separate.                                                           | Checked October 11; next check October 12.                                                                    |
| Crater Lake profile               | Named Mazama Village's listed October 13 fuel deadline and advised an outside-park fuel plan for later visits. Retained Highway 62/seasonal north-entrance guidance and rechecked the Cleetwood Cove / East Rim Drive notice.             | Profile and advisory checked October 11; next profile check October 13. Coordinate-review date unchanged.     |
| New York airport passage          | Added the dated Port Authority source and clarified the nights of October 13, 14 and 15, ending the morning of October 16. Replacement buses connect stations/terminals, subject to the work notice. LIRR also connects through AirTrain. | Airport-only review: whole-city check remains October 10 and next review October 13; food metadata unchanged. |

Primary sources:

- Rocky Mountain [timed entry](https://www.nps.gov/romo/planyourvisit/timed-entry-permit-system.htm), [admission/passes](https://www.nps.gov/romo/planyourvisit/fees.htm), [wilderness permits](https://www.nps.gov/romo/planyourvisit/wild_guide.htm), and [campground entry conditions](https://www.nps.gov/romo/planyourvisit/camping.htm).
- Crater Lake [directions](https://www.nps.gov/crla/planyourvisit/directions.htm) and [conditions](https://www.nps.gov/crla/planyourvisit/conditions.htm). The latter has conflicting seasonal summaries for some concession facilities; this review makes no new claim about current lodging, restaurant or visitor-center hours.
- [Port Authority's October 9–15 advisory](https://www.panynj.gov/port-authority/en/press-room/press-release-archives/2026-press-releases/weekly-travel-advisory-for-oct--9-to-15-.html), [JFK AirTrain](https://www.jfkairport.com/transportation/airtrain), [JFK public transport](https://www.jfkairport.com/transportation/public-transport), and [MTA JFK connections](https://www.mta.info/guides/airports/jfk). The redesigned AirTrain page no longer exposed the old work passage in retrieved text; the official Port Authority advisory confirms it. Direct JFK HTTP requests were blocked, so readable official web results were used. Work windows are New York local time and need rechecking before travel.

All edits include English, Thai, simplified Chinese, Japanese and Korean. Fluent-language flags remain pending. Other advisories, the NPS snapshot and saved personal trips were not rewritten.

## Validation

- Content validation, TypeScript, formatting and the production build passed; the build generated 1,005 localized pages.
- The full regular browser run passed 194 of 195 checks. Its only failure was the new touch test's incorrect focus assumption described above. After correcting that assertion, all six focused hero/gallery checks passed across mobile Chromium, WebKit and Android profiles, covering the remaining case and keyboard restoration.
- The full production suite passed 14 of 15 checks. The 30-page, no-JavaScript city check exceeded its original 30-second test budget during concurrent suite execution. Its budget is now 60 seconds; the targeted rerun passed in 14.3 seconds, including every airport note and source link in all five languages. The other production checks, including park preloads, city deferral and offline coverage, had passed.
- Local PGlite cloud SQL checks passed. No remote database was connected or changed.
- Both scripted production journeys and the before/after performance runs completed as described above. No app code changed after those runs; the final edits corrected test assertions, the test time budget and documentation.

## Remaining external checks

Physical iPhone/Android devices, VoiceOver/TalkBack, recruited users, fluent-language sign-off and the deployed host remain untested. Coordinates have not been checked on site. No deployment was performed. Boston points and Studio arrival editing are outside this three-task batch.
