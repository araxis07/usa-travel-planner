# October 16: offline recovery, return navigation and source review

This batch implements the next recommended work: offline edge states, discovery-to-guide navigation, CI diagnostics and due content reviews. It does not activate accounts or connect a database.

## Offline status

An empty trip now explains how to start instead of showing 0/0. A cache read failure replaces the checking message with an error and an explicit retry. Checks run again when the window regains focus, the page becomes visible or the browser returns online. Results from older asynchronous reads cannot overwrite newer checks or a removal operation. Missing files or unreadable storage invalidate the previous download-success message.

During downloads the panel hides instructions to start another download. Removal explains that photos are shared by state across trips and that plans/expenses remain. Saving is disabled while removal runs. Cache coverage still counts original and responsive photo files, not distinct photos, and is not a guarantee against future browser storage eviction.

Production regressions cover empty and denied-storage states in five languages, retry recovery, cache changes from another tab, stale success after a missing file, interrupted download retry and retained trip data. Return-to-tab focus events are explicitly dispatched in the headless test; this is not a physical-device test.

## Navigation and startup

A regression reproduced a keyboard-focus loss when returning from a place guide to its filtered discovery results. Both the guide's return button and browser Back now restore focus to the initiating control, preserving the existing query, transport filter and scroll position. The home launchpad also derives its itinerary count from the catalog instead of displaying the outdated fixed count of eight.

The previous CI run's WebKit enlarged-hero test exceeded its default five-second heading wait once, then passed on retry. Five baseline repetitions passed locally with retries disabled; the original failure was not reproduced. The test now separates a bounded 15-second guide-startup allowance from the unchanged layout assertions and records per-language startup timings, runtime errors and failed requests. A cold development-module graph is a possible explanation, not an established root cause. Runtime errors still fail the test. CI uploads browser reports even when a retry makes the job green, retaining evidence for future diagnosis.

## Follow-up after GitHub CI

The first push passed all 21 production checks but failed three regular checks. Two advisory checks assumed every paragraph was the main notice; once a saved notice aged beyond seven days the legitimate freshness warning added a second paragraph. The test now fixes its clock beyond the latest advisory date and checks the main notice and freshness warning separately in all five languages. A boundary check verifies no warning at seven days and a warning at eight days.

The third failure was a real React recoverable render error in WebKit, exposed by the new runtime-error assertion. Repeating the hero test locally reproduced it. Its nested cause pointed to `updateWorkInProgressHook` during a suspended `DestinationPage` replay. The component interleaved suspending data reads with its UI state/effects. A separate repeat exposed an invalid city-plan error when a resolved state read was skipped and the city read occupied the earlier promise slot. Each resource now has its own component (`DestinationPage` for state details, `DestinationCity` for city details), followed by `DestinationContent` for the existing UI hooks. This prevents promise-slot reuse between resources and keeps suspended retries outside the UI hook lifecycle. The shared loaders, synchronous preloaded reads and module-error propagation remain intact; no dependency upgrade is needed.

The hero trace now records the nested error message and stack. A separate regression delays state and city module responses to exercise successive suspensions and verifies the guide renders without runtime errors. The before-fix repetition run failed one hero test; the same ten checks passed after the fix with retries disabled. The final code also passed all 21 production checks, including the no-empty-frame startup regression, and ten focused cases across desktop/mobile Chromium, WebKit and Android with retries disabled. This establishes the render-recovery fix, not the cause of the earlier isolated five-second heading timeout.

## Sources checked October 16

- [Crater Lake NPS conditions](https://www.nps.gov/crla/planyourvisit/conditions.htm), updated October 14, now explicitly lists gasoline as unavailable. The five-language access note replaces the prior unconfirmed-fuel wording with this dated status. Existing Cleetwood closure and East Rim construction advice remains. Review next: October 19. The [operator schedule](https://explorecraterlake.com/things-to-do/shopping-supplies/) still lists the October 13 cutoff. Conflicting lodging descriptions on the NPS page are not used to promise open accommodation.
- [JFK's disruption notice](https://www.jfkairport.com/alerts-advisories/airtrain-jfk-full-service-disruption) lists its final overnight window through October 16 at 06:00 New York time. The note explains that the scheduled end does not confirm restored service and retains official-status links and replacement-bus guidance. [AirTrain](https://www.jfkairport.com/transportation/airtrain), [JFK public transport](https://www.jfkairport.com/transportation/public-transport) and [MTA's JFK guide](https://www.mta.info/guides/airports/jfk) still support the listed $8.75 + $3 adult standard fare. Existing Midtown, Downtown Manhattan and DUMBO source pages were reopened; neighborhood grouping and editorial budget allowances are unchanged. Food and arrival-coordinate review dates remain independent. Review next: October 17, because the service advisory has reached its final listed window.
- The new queue exposed an overdue Denali review (October 15). [NPS conditions](https://www.nps.gov/dena/planyourvisit/conditions.htm) still gives October 15 as the end of weather-dependent private-vehicle access to mile 30. The advisory now states that the published window has ended and later access is unconfirmed; it does not invent a current closure point. Highway access remains supported by [NPS directions](https://www.nps.gov/dena/planyourvisit/directions.htm). Review next: October 19.

All edited copy has five language entries. Fluent-human sign-off flags remain pending.

## Editorial queue

`npm run review:content -- --date=2026-10-16 --days=3` lists review dates through October 19 across destination profiles, city guides, food sections and preparation guides. It distinguishes overdue, due-today and upcoming items, includes the last review date and exact JSON location, and sorts by due date. Without `--date`, it uses today's UTC date. It is read-only: it does not fetch sources, certify content or advance dates. The final October 16 report contains 28 upcoming sections and no overdue/due-today sections; the October 17 reviews still need to be done when due.

## Validation and remaining scope

The final build passed content validation and TypeScript checks and generated 1,005 pages. All 21 production checks passed, including the new offline cases. Thirty targeted regular checks passed across desktop/mobile Chromium, Firefox, WebKit and Android profiles. Five repetitions of the adjusted WebKit hero test passed with CI mode enabled and retries disabled, in addition to the five baseline repetitions. The return-focus regression failed before the fix and passed afterward.

Ten local production reviews (five languages × Chromium/WebKit) checked offline errors, recovery and shared-photo removal at 320px. Doubling panel text caused no horizontal overflow, and no runtime errors were recorded. Thai screenshots were visually inspected. The editorial queue was checked for today's empty due list, tomorrow's due items, invalid calendar dates and negative lookahead rejection. Formatting and diff checks passed. Local evidence is kept in ignored `artifacts/2026-10-16-usability/`.

The entry JavaScript is 113.22 kB gzip versus 112.41 kB in the prior batch. No new dependency, image or 3D asset is added. This batch makes no new performance or field Core Web Vitals claim. The complete regular suite, including the three new browser-profile cases, remains required on GitHub after the follow-up push.

This batch does not claim a visual audit of all 450 photos, add new city guides, certify native-speaker translations, test physical phones or publish a deployment. Those remain later phases of the roadmap. A real deployed URL is still needed for the published-host check. Existing 3D/photo modes and reduced-motion behavior are checked by the browser suite; no new 3D scene is added.
