# October 13: offline trips and six-city readiness

This batch closes the remaining daily-start coverage for the six detailed city guides, removes unrelated image preloads from offline navigation, reviews the October 13 content queue, corrects image dimensions and preserves the visitor's animation pause. It uses the existing content schema, planner, local storage and image tooling. No dependency, database connection or deployment was added.

## Offline navigation

The old navigation fallback was the generated English homepage. Its head preloaded a homepage hero even when the requested URL opened the planner; the photograph was not part of the selected trip's offline download. WebKit reported the failed resource although the saved trip remained intact.

The build now emits `offline.html` from the existing application template, removing the two homepage image preloads and adding `noindex`. The service worker stores it with the shell and uses it only when an online navigation fails. The requested URL still selects the language and planner; normal published pages keep their content, imagery and SEO. Saved trips, photo downloads and the existing worker-upgrade behavior remain unchanged. Map tiles and third-party responses are still excluded from offline storage.

The regression uses separate localhost origins for Chromium and WebKit, saves a trip explicitly, then closes incoming origin connections. It checks five language URLs, absence of image preloads/home-hero requests, an offline note edit, preservation of arrival references and budget cents, and return to online operation. This tests origin unavailability without relying on WebKit's browser-offline emulation. Physical Safari remains a separate check.

## Nine additional daily references

All six city guides now have three arrival references: New York, Boston, Philadelphia, San Francisco, Las Vegas and Chicago. New plans copy the sources, translated notes and ODbL attribution into saved/exported/printed data. Existing traveler plans are not rewritten.

Visitor pages and OpenStreetMap API records were checked October 13, 2026. OSM map responses and a compact node/way evidence list are kept under ignored `artifacts/2026-10-13-readiness/`. An outline node identifies a landmark, not a visitor entrance: those distinctions are explicit in all five languages. No claim of an on-site survey, parking availability or a continuous accessible route is made.

| City/day        | Reference                            | OSM node / containing way when applicable                                 | Visitor source                                                                                   |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| San Francisco 1 | Ferry Building mapped entrance       | [10805597212](https://www.openstreetmap.org/node/10805597212) / 558731934 | [Marketplace visitor information](https://www.ferrybuildingmarketplace.com/visit/)               |
| San Francisco 2 | Dragon Gate, Grant/Bush              | [65328703](https://www.openstreetmap.org/node/65328703)                   | [San Francisco Travel](https://www.sftravel.com/neighborhoods/visit-chinatown)                   |
| San Francisco 3 | Golden Gate Bandshell                | [343511438](https://www.openstreetmap.org/node/343511438) / 30896932      | [SF Recreation and Parks](https://www.sfrecpark.org/1570/Golden-Gate-Bandshell-Concerts)         |
| Las Vegas 1     | Fountains of Bellagio lake outline   | [2142354688](https://www.openstreetmap.org/node/2142354688) / 22971030    | [Bellagio](https://bellagio.mgmresorts.com/en/entertainment/fountains-of-bellagio.html)          |
| Las Vegas 2     | Hacienda Horse and Rider public sign | [5250961022](https://www.openstreetmap.org/node/5250961022)               | [The Neon Museum](https://neonmuseum.org/about-us/)                                              |
| Las Vegas 3     | Arts Factory building corner         | [1941783475](https://www.openstreetmap.org/node/1941783475) / 208084753   | [Visit Las Vegas](https://www.visitlasvegas.com/experience/post/las-vegas-art-and-culture/)      |
| Chicago 1       | Cloud Gate sculpture outline         | [1503537582](https://www.openstreetmap.org/node/1503537582) / 137060274   | [Choose Chicago](https://www.choosechicago.com/articles/tours-and-attractions/the-bean-chicago/) |
| Chicago 2       | McCormick Bridgehouse                | [3572913469](https://www.openstreetmap.org/node/3572913469)               | [Museum operator](https://www.bridgehousemuseum.org/)                                            |
| Chicago 3       | Field Museum East Entrance           | [4931353914](https://www.openstreetmap.org/node/4931353914) / 24825537    | [Museum accessibility information](https://www.fieldmuseum.org/page/visit/accessibility)         |

The Field Museum identifies its East Entrance as wheelchair-accessible; the note attributes that statement and asks visitors to verify current arrangements. The Hacienda sign is not the Neon Museum entrance. The Bellagio reference is on the lake outline; its note directs people to public paths outside the water/barriers. Ferry gates, cruise boarding, museum tickets and event restrictions are separate from these reference points.

## Due source checks

The [JFK notice](https://www.jfkairport.com/alerts-advisories/airtrain-jfk-full-service-disruption) still lists the October 13–15 overnight closures ending October 16 morning, with ground-level replacement buses and the Lot 66 transfer. Existing five-language guidance remains consistent. The next New York check moves to October 16; the whole-city checked date and independent food dates do not advance on the strength of an airport-only review.

[NPS Crater Lake conditions](https://www.nps.gov/crla/planyourvisit/conditions.htm) and the [concessioner's service-station schedule](https://explorecraterlake.com/things-to-do/shopping-supplies/) both list fuel through October 13. Existing advice to plan outside-park fuel for later visits is retained. Cleetwood Cove closure and East Rim traffic-control advice are still supported. Profile/advisory checked dates move to October 13 and the next check to October 14, after the listed fuel cutoff. Conflicting NPS summaries about other facilities do not justify new lodging/restaurant promises. Coordinate dates and language-review flags remain unchanged.

## Images, language and motion

Metadata was read from all 450 catalog images. Six files had dimensions overstated in the catalog: Arkansas, Connecticut, Illinois, Minnesota, New Hampshire and South Carolina state images. The catalog now records their real dimensions, so responsive-image descriptors reflect actual files. `check:content` rejects future mismatches using the already-installed Sharp dependency. Fifteen source images are narrower than 960 pixels, including portraits; this correction does not manufacture higher-resolution originals or certify the subject of every photograph.

Nine San Francisco, Las Vegas and Chicago photographs were visually inspected. The [Chicago-00 source description](https://commons.wikimedia.org/wiki/File:Chicago-00.jpg) identifies a view from Willis Tower; its misleading aerial-view labels are corrected in all five languages to describe the Chicago skyline from the tower. Credits and review flags are preserved. This is a targeted subject check, not a visual certification of all 450 photographs.

New notes were reviewed for equivalent intent across five languages, including the distinction between a physical entrance and a landmark. Fluent-human review flags remain false. No automatic proofreading is presented as human approval.

Manual animation pause is now stored safely and survives reloads and system-preference changes. A system request for reduced motion still pauses animation. If storage is unavailable the control continues to work for the current page. Existing 3D scenes already stop their animation loops when hidden and offer photo mode; those mechanisms are reused. Coverage also checks the photo/credit fallback after WebGL context loss. No extra scene or animation library is introduced.

## Validation

- `npm test`: **213 passed**, including the six-city arrival exports/print, persisted motion preference, context-loss photo fallback, mobile navigation, enlarged text, five languages and Studio checks.
- `npm run test:production`: **19 passed**, including both new mobile origin-failure regressions, existing service-worker upgrades, saved photos, PDFs and all six city plans offline.
- `npm run test:cloud`: local PGlite ownership, anonymous access, immutable revisions, stale saves, shares, revocation and expiry passed; no remote database was contacted.
- `npm run build`: content validation, image preparation, TypeScript and production build passed; **1,005 localized pages** plus the offline fallback were generated. `npm run format:check` and `git diff --check` passed.
- Additional production checks covered **30 city/language/engine combinations** (San Francisco, Las Vegas and Chicago × five languages × Chromium/WebKit), opening all three daily references. No page errors or document overflow occurred at 390 pixels, or at 320 pixels with the arrival-reference text doubled. Selected Thai hero/reference screenshots were visually inspected for readable labels, spacing and image crops.
- A mobile San Francisco journey passed in both engines: search → guide → two-day preview → create → add an activity → itemized budget → download full backup → preview restore → switch to Thai → offline reload. The saved plan, two sourced starts, custom activity and exact planned/paid values survived. Chromium used browser-offline mode; WebKit used a stopped origin server. Neither emitted a page error. Restore preview is not claimed as an actual restore; the regular suite covers restoration separately.

Logs, screenshots, image/source audits and additional journey scripts are retained locally under ignored `artifacts/2026-10-13-readiness/`.

## Performance

Nine cold production runs used the existing harness: Chromium at 390 × 844, 4× CPU slowdown, 1.6 Mbps down / 750 Kbps up, 150 ms latency, service workers blocked. No other browser suite ran during these measurements. Comparison is to the October 12 final report on this machine; these are small lab samples, not field Core Web Vitals.

| Page                            | October 12 median LCP | October 13 three runs   | October 13 median LCP | Resource transfer |
| ------------------------------- | --------------------- | ----------------------- | --------------------- | ----------------- |
| English home                    | 2.484 s               | 2.604 / 2.512 / 2.496 s | 2.512 s               | 615,220 bytes     |
| Thai Philadelphia guide         | 2.424 s               | 2.436 / 2.412 / 2.476 s | 2.436 s               | 476,056 bytes     |
| Thai planner, same saved sample | 1.420 s               | 1.592 / 1.420 / 1.404 s | 1.420 s               | 574,537 bytes     |

Home LCP is just over the 2.5-second target in this sample; the guide remains below it. Changes of 28/12/0 ms do not establish a performance improvement or a meaningful regression. Transfer increased by only 74/73/88 bytes for those routes. Maximum observed CLS was 0.0096 and no measured page overflowed. The application entry is 336.61 kB (111.39 kB gzip). Existing deferred photo/guide loading is retained; these measurements do not justify another catalog rewrite in this batch. The performance work is measurement and the verified image-dimension correction, without claiming a new speed gain.

External checks still needed: physical iOS/Android keyboards, VoiceOver/TalkBack, fluent-language review, on-site access and the deployed host.
