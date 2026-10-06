# Philadelphia and Northeast rail template — October 6

Philadelphia (`PA-0`) now has the same neighborhood, three-day, airport, budget and food coverage as the other five detailed cities, in EN/TH/ZH/JA/KO. The existing destination and three credited photographs are reused. The catalog remains 150 destinations, 450 photos and 1,005 generated pages. No dependency or database connection was added.

## Sources and budget

The three bases use Visit Philadelphia’s [Old City](https://www.visitphilly.com/areas/philadelphia-neighborhoods/old-city/), [Center City](https://www.visitphilly.com/areas/philadelphia-neighborhoods/center-city/) and [Fairmount](https://www.visitphilly.com/areas/philadelphia-neighborhoods/fairmount/) guides. Days pair the historic district with a short walk, [Reading Terminal Market](https://readingterminalmarket.org/) with Center City, and one Parkway museum with a slower afternoon. [NPS Independence Hall guidance](https://www.nps.gov/inde/planyourvisit/independencehall.htm) distinguishes ticketed sessions and screening; no fixed daily ticket window is embedded. The [Philadelphia Museum of Art visitor page](https://www.philamuseum.org/know-before-you-go) supplies current entry rules. Weather alternatives are editorial suggestions, conditional on actual opening hours and tickets.

[PHL Airport public transportation](https://www.phl.org/getting-around/public-transportation) supports the terminal Airport Regional Rail connections and the Center City stops. Check the [SEPTA Airport Line](https://www.septa.org/schedules/rail/airport/) for the actual date; no fixed fare or journey time is quoted. PHL also identifies [Amtrak’s 30th Street Station](https://www.amtrak.com/stations/phl), so the guide distinguishes airport and station names before navigation.

Example group totals are **$630 / $1,140 / $1,880** for two adults, three days and two nights sharing a room. All rows are editorial allowances, including an airport-return transport allowance and a separate tax/fee/tip reserve. Rail arrivals should replace airport transfers with actual local travel; intercity tickets remain additional. Three meal ranges of $15–$30 are per adult for one casual meal, with drinks/tax/tips extra, and belong inside the food row. No quoted restaurant/hotel prices, dietary guarantees or certified entrances are implied.

City and food source dates are October 6 with review due October 13. Ten new language-review flags remain false. Existing city, food, park and rail source dates remain unchanged.

## Nine-day rail plan

The ninth itinerary uses existing library creation and schedule editing: Boston days 1–3; rail/arrival in New York on day 4; New York days 5–7; rail/arrival in Philadelphia on day 8; Old City on day 9. Each city keeps its local day indices for editing, while preview headings display global days 1–9.

All departure times are unset. Each initial rail-and-arrival block reserves **six hours for planning**, not a researched train duration. Travelers must set their booked departure and replace the allowance with actual door-to-door time. Hotel luggage/check-in, a meal and rest follow each transfer. The planner’s derived clock labels are estimates until edited. Notes repeat the station/buffer checks from the dated rail guide; all venues and services require checking for the actual date. Creating a trip keeps the old trip and expenses in its library entry; sample city budgets are not inserted into the new expense ledger.

The rail field note opens the preview directly, and the new route card also opens it. The existing create action, capacity checks, storage-error handling, export, print and offline mechanisms are reused.

## Guide navigation

The home section initially shows first-trip preparation, parks and Northeast rail. A native disclosure exposes the remaining notes. Five topic buttons filter all/preparation/cities/parks-and-seasons/intercity notes and announce the result count. The chosen topic is an optional validated browser preference; storage failure leaves the controls usable. All strings ship in five languages, buttons wrap on narrow screens and existing navy/cream colors provide selected-state contrast. Route cards and previews now show their travel mode.

## Validation

TypeScript, content validation, the production build, local PGlite checks, formatting and whitespace checks passed. The full browser suite passed **162 tests**, and the production suite passed **12 tests**. City and food checks cover all thirty city/language combinations. The rail journey tests cover five-language creation, original-trip and expense preservation, schedule editing and reload. Production checks verify the explicitly saved nine-day trip, Philadelphia photographs and food, and the rail preview while offline; no real account or remote database is used.

Thai screenshots at 1,440 and 320 CSS pixels were reviewed for the city, airport and food sections, featured/topic-filtered guides, rail preview and arrival-day planner. The five-language guide controls also pass narrow-screen text enlargement and keyboard/focus checks. These are browser and source checks, not physical-device, fluent-language or deployed-host acceptance; the translation-review flags remain false.
