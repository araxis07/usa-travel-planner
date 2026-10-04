# Park bookings and predeparture guide — 2026-10-04

Added to the existing destination pages and first-trip field note in English, Thai, Chinese, Japanese and Korean. No database connection or new dependency is needed.

## Content and source scope

`content/travel-preparation.json` contains the shared app/generated-HTML text, source URLs, source-check dates, review deadlines and translation-review flags. All new source checks are dated October 4, 2026; review is due October 11. This is saved editorial guidance, not live availability or immigration eligibility advice.

The five park guides distinguish admission/pass coverage, timed entry, activity permits and overnight bookings:

- Yosemite (`CA-1`): NPS entrance requirements, Half Dome, campground reservations and wilderness permits; Recreation.gov Half Dome application.
- Zion (`UT-0`): NPS entrance/shuttle rules, Angels Landing and camping; Recreation.gov seasonal permit and Watchman booking pages. The fall permit page also lists no permits during October 5–8 maintenance; that dated notice has its own source link.
- Grand Canyon South Rim (`AZ-0`): NPS entrance/payment rules, backcountry permits, current lodging suspension and camping. Existing water restrictions remain visible. South Rim guidance does not imply North Rim access.
- Rocky Mountain (`CO-0`): NPS 2026 timed-entry windows, wilderness/campground rules and Recreation.gov booking. General entry and Bear Lake Road+ are explicitly distinct. The processing charge is separate from entrance fees.
- Yellowstone (`WY-0`): NPS entrance, activity-permit, road, campground and lodging guidance. The seasonal Mammoth first-come exception is preserved; booking operators differ by campground.

The existing first-trip guide now has nine topics: realistic regional planning, passport/visa/ESTA/EVUS checks, arrival documents/customs declarations, phone connectivity, payment preparation, taxes/tips, plugs/voltage, time/measurement units and saving essentials before departure. References are linked to the State Department, CBP, Apple, Visa, Visit The USA, IRS, NIST and Electrical Safety First. Carrier/model compatibility is checked individually; site language does not decide entry eligibility. Tipping percentages are a customary guide, not a compulsory national rate. Manufacturer instructions take precedence for appliances.

## Maintenance and delivery

- Update the JSON manually, confirm the linked primary sources and revise both review dates together. Studio still edits the existing state catalog.
- New language review flags remain false. Automated translation/layout checks do not replace a fluent reviewer.
- Full content is deferred with existing destination/dialog views. Native disclosure controls expose activities and overnight rules without extra libraries. The first two booking sections are initially open.
- Generated pages include all 25 park/language combinations plus predeparture content on the five localized home pages. Existing Save for offline includes the application content; external booking sites, maps and current status updates need a connection.
- Verification covers narrow layouts, enlarged text, keyboard controls, accessibility, review-deadline warnings, generated HTML without JavaScript and a saved Yosemite guide offline. Browser emulation does not constitute physical-device or native-language review.

## Verification results

- Production build, content validation, TypeScript, formatting and whitespace checks passed; the build still generates 1,005 localized pages.
- The regular suite contains 154 tests. The initial run passed 150 and had four desktop timeouts in existing search/notice/city/atlas flows. All four passed when rerun with two workers; no application change was needed for those timeouts. The new park/first-trip checks also passed on desktop/mobile. After the final guide spacing correction, 12 relevant contrast/guide checks passed again.
- All 11 production tests passed, including park/home content without JavaScript and both Yosemite booking guidance and the Thai predeparture guide reopening offline after Save for offline.
- Existing local SQL checks passed in PGlite; no real Supabase/database service was connected.
- Thai mobile and desktop views were inspected. Enlarged text no longer overflows the field-note title, section numbers have sufficient contrast, and the category label clears the dialog language control. Local screenshots/logs are under ignored `artifacts/travel-preparation/`.
