# October 10: selected-city loading, Philadelphia arrivals and Studio reviews

This batch covers the three next steps agreed after the City Studio release. It adds no dependency and keeps the existing local trip format, optional account behavior and offline workflow.

## Loading and measured performance

Vite derives a small shared copy module and six city modules from the existing `content/city-guides.json`. Destination pages load only their matching city, alongside the selected state's details. Direct static city pages preload both modules; state and other destination pages preload no city. Studio previews still render their supplied draft rather than published city data. Generated static pages retain all six guides in five languages, and explicit offline saving includes all six city modules.

`PlacePractical` now requests the NPS snapshot only for profiles whose official visitor URL is on `www.nps.gov`. Switching profiles clears displayed snapshot/error state. A city visit no longer transfers the unrelated 135,613-byte snapshot; park pages retain their update and failure behavior.

`DestinationPage` decreased from 203.15 kB / 67.31 kB gzip to 48.02 kB / 15.77 kB gzip. The Philadelphia data module is approximately 33 kB / 12.7 kB gzip; the other five city modules are deferred. These are build sizes, separate from browser transfer totals.

Both measurements use three cold Chromium runs per page, at 390×844, DPR 3, reduced motion, service workers blocked, 4× CPU slowdown, 1.6 Mbps download, 750 Kbps upload and 150 ms latency. The recorded transfer total is the script's navigation observation window, not the whole scrolled visit.

| Page                    | Median LCP before | Median LCP after | Transfer before | Transfer after |
| ----------------------- | ----------------- | ---------------- | --------------- | -------------- |
| English home            | 4.480 s           | 2.460 s          | 614,015 B       | 615,533 B      |
| Thai Philadelphia guide | 3.652 s           | 3.308 s          | 677,418 B       | 504,618 B      |
| Thai planner            | 1.556 s           | 1.416 s          | 573,249 B       | 574,832 B      |

Philadelphia transferred 25.5% less data and its median LCP improved 9.4%. Its three LCP runs were 3.632/3.652/3.652 s before and 3.344/3.304/3.308 s after. It still exceeds 2.5 s in this lab profile. Guide CLS remained approximately 0.000155; the planner's after CLS was 0.00955. Home timings varied substantially before (4.480/4.776/3.252 s); the home speed difference is not attributed to this guide change. Its transfer grew slightly with the shared arrival labels/validation.

These measurements do not establish real-phone results, INP or field Core Web Vitals. Ignored reports are in `artifacts/2026-10-10-philadelphia/{before,after}/review.json`. Reproduce with a completed `npm run build`, then `node scripts/review-workspace.mjs --performance-only --all-pages --output=artifacts/your-review`, without concurrent builds or browser tests.

## Philadelphia's three arrival references

Official entrance directions were checked on October 10, 2026. Coordinates come separately from linked OpenStreetMap nodes, compared with the street/building entrances; they are map references, not on-site measurements, parking guarantees or a verified accessible route. Each point identifies the start of the suggested visit. A user choosing another attraction can remove the arrival without deleting the activity or notes.

| Day | Suggested arrival                                                              | Coordinate source                                                                                      | Visitor source                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Independence Hall security approach on 5th Street, between Chestnut and Walnut | [OSM gate 3590076334](https://www.openstreetmap.org/node/3590076334), 39.9486324, −75.1491843          | [NPS entrance and screening guidance](https://www.nps.gov/inde/planyourvisit/independencehall.htm)                                                                                                                                     |
| 2   | Reading Terminal Market entrance on 12th Street                                | [OSM entrance 14214794491](https://www.openstreetmap.org/node/14214794491), 39.9533467, −75.1594921    | [Market visitor FAQ](https://readingterminalmarket.org/frequently-asked-questions/) and [current entrance map](https://readingterminalmarket.org/wp-content/uploads/2026/04/6691-RTM-Spring-2026-Map-Directory-Updates-8.5x11_FNL.pdf) |
| 3   | Philadelphia Museum of Art West Entrance by the West Terrace                   | [OSM main entrance 3787857983](https://www.openstreetmap.org/node/3787857983), 39.9656330, −75.1810090 | [Museum Main Building visitor information](https://www.philamuseum.org/main-building)                                                                                                                                                  |

The Hall point approaches the southern screening area rather than using the building's Chestnut Street address. The market reference does not claim to pinpoint an automatic door: its note names Doors 6 and 9 from the official FAQ and asks visitors to check the map. The museum point is distinct from the Rocky Steps; visitors must check current admission and opening days. Existing optional visits/weather choices remain editable; meals and the other five city plans gain no unverified pins.

An optional activity `arrival` carries five-language labels/visitor notes, coordinates, entrance source, coordinate source, coordinate license and check date. It is validated at both content and trip boundaries; bad coordinates, unsafe/credentialed URLs, incomplete translations, false calendar dates and conflicting catalog/arrival references fail before import replaces a plan. Existing trips without arrivals remain valid. Current coordinate references support OSM node URLs under [ODbL](https://opendatacommons.org/licenses/odbl/1-0/), with © OpenStreetMap contributors attribution. This limited pilot is not an arbitrary pin editor.

Trip creation copies the reference into the trip. Daily maps and existing explicit driving calculations use it; opening a guide or creating a plan sends no routing request. JSON/text backups, library copies and print retain its sources and license. Printed references include link URLs. Arrival notes are public visitor guidance, separate from personal activity notes. Studio displays arrival references read-only; change the published JSON and source-check any coordinate correction. Main-guide language flags remain pending and food dates/flags are unchanged.

## Studio review queue

The queue lists city and food records independently, with filters for reviews due today/overdue, reviews due in the following seven UTC days, pending languages and all records. A malformed/missing deadline appears as needing a date rather than a completed review. Pending language names are displayed individually.

Opening a record selects the city, returns from preview to editing, scrolls to and focuses the corresponding city/food heading. Unsaved edits remain in memory. No queue operation stamps dates, checks language flags or publishes content. Existing draft validation, optimistic revision checks, local-only access and publication behavior remain in place.

## Validation and remaining checks

TypeScript, content validation, production build and formatting checks passed. The regular browser run passed 189 of 192 checks; the three failures were test selectors that assumed only one link per city day or tried to calculate before opening the mobile map tab. Those selectors were corrected and all four targeted desktop/mobile rechecks passed, completing coverage of all 192 distinct checks. The 15 production tests and local PGlite SQL checks passed. No remote database was contacted. Regression coverage includes all 90 city/language/duration combinations, arrival validation and JSON backups, explicit routing/removal/reload, printable source references, separate review deadlines, seven-day boundaries, section focus, unchanged review flags and pending-language filters. Production coverage includes selected-city preload isolation, park snapshot eligibility, arrival source/license links in all five static Philadelphia pages, all 30 static city supplements and all six city plans offline. Desktop/mobile production screenshots reported no runtime errors or horizontal overflow; the Philadelphia preview was also inspected at 320 px and 1440 px. Test preview servers were closed, leaving the owner’s existing port 4000 server running.

Physical phones, VoiceOver/TalkBack, fluent-language sign-off, entrance/coordinate checks on site and the published host remain unchecked. No deployment or database connection is part of this batch. More city points, photos and 3D redesign are deferred to their own reviewed scope.
