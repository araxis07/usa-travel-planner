# Roam America · v3.5

An independent travel guide and itinerary planner for all 50 U.S. states, with English, Thai, Simplified Chinese, Japanese and Korean interfaces.

## Run locally

Use Node.js 22 or newer:

```sh
npm ci
npm run dev
```

Open Vite’s printed `Local` URL. The default is port 5173; an occupied port automatically falls back to the next available port. Stop your server with `Ctrl+C` when finished. Local planning needs no account or API key.

The first dev start generates responsive WebP photographs from the local originals. Later starts reuse unchanged variants. `npm run prepare:images` regenerates them explicitly; the production build also runs it. Generated files under `public/images/responsive/` do not belong in Git.

```sh
npm run build
npm run preview
```

Deploy the complete `dist/` directory at the domain root. The build generates 1,005 HTML pages: five homepages, 250 state guides and 750 place guides. Each language page includes readable content before JavaScript starts. Example: `/th/states/california/yosemite-national-park/`. Existing `?lang=th&state=california&place=yosemite-national-park` links still work. The language in a URL path takes precedence over the query, saved preference and browser language.

The repository has no hosting-specific deployment workflow. A Git push runs verification; your host must deploy the build separately.

## What is included

- **50 state guides, 150 place profiles and 450 local photographs.** Every place has three distinct photos with individual source and license links. Profiles include five-language highlights, planning duration, accommodation areas, access guidance, source dates and official links. Galleries support keyboard arrows, swipe, zoom and source captions.
- **Discovery and comparison.** Separate state and place views, multilingual search, combined region/season/interest/transport/indoor filters, list/map selection and comparison of up to three states or places. The three-step trip helper suggests three bases with reasons using month, interests, party and car preference, excluding places with saved travel advisories until editorial review clears them. Its editable starter plan leaves later days flexible.
- **Itemized travel budget.** Track up to 200 flights, accommodation, transport, food, activity and other expenses per trip. Enter group totals in USD, record payments and see the per-traveler estimate and remaining amount. Daily and itemized modes are alternatives, so costs are not counted twice. Expenses survive reload, undo, full backup, text export and printing.
- **Full workspace backup.** In **My trip library → Back up all my travel data**, export every trip (including archives), expenses, checklists, collections, visited places and saved states. Preview the file, select individual trips and data groups, then merge copies or replace those groups. Capacity checks and rollback protect existing data when storage writes fail. Photos and offline caches are not embedded in the JSON file.
- **A local trip library.** Keep up to 30 separate trips, switch, duplicate, archive, restore, delete with confirmation and export individual backups. Creating a trip from the helper or a template preserves the current one. Each trip has its own notes and checklist; storage failures are shown before switching.
- **Place collections.** Save individual places into named lists, mark visited destinations, and export/import collection backups with a replacement preview. Existing state favorites remain available.
- **Eight editable itineraries and six field guides.** Southwest, Pacific Coast, New England, New York, Boston, Chicago, Florida and Wyoming templates include daily activities, meals, rest and transfer blocks. Preview every day before creating a trip. Field guides now cover car-free cities, seasonal planning and comfortable travel as well as the original essentials.
- **Full-page daily planner.** Compact activity cards expand for editing. Set a start time and transfer/rest buffer, add a quick meal or break, move activities and undo changes. Overlapping times, midnight overruns and distant places on the same day are flagged. Distance warnings use straight-line reference coordinates, not driving estimates. Desktop shows the schedule alongside its map; mobile has list/map switching, day navigation, folded utility controls and an always-reachable add-activity button that brings the form into view. A per-trip checklist supports custom tasks and prints with the plan.
- **Interactive atlas and route map.** A local 2D/3D state atlas with zoom, reset, rotation, state/region focus, destination previews and a schematic state route. Native WebGL illustrations change with California (Golden Gate Bridge), New York (Liberty) and Arizona (Monument Valley). They pause when hidden, respect reduced motion and offer a remembered photo mode. Planned states have a distinct outline; other states show their credited cover photo. Driving estimates remain an explicit action on the daily route map.
- **Trip portability.** Automatic browser saving, validated JSON import with replacement confirmation, JSON/text export, and a print layout for every day and activity. The browser’s print dialog provides **Save as PDF**, including Thai and CJK text.
- **Offline reading.** On the published HTTPS site (or localhost preview), **Save for offline** downloads the selected states’ originals and responsive photos. A connection/download panel reports availability and removes selected-trip downloads after confirmation. The service worker stores the app, fonts and cached park facts. The current browser trip and downloaded photos can then reopen offline. Success is shown only after the download completes. Save again after adding other states. Browser storage limits, private browsing or clearing site data can remove downloaded content; keep a JSON backup for durable storage.
- **Optional accounts and sharing.** Supabase integration supports email/password signup, confirmation, reset, account copies, explicit loading, revision conflict detection and seven-day read-only snapshot links. Notes and personal checklists are excluded by default. Owners can include them explicitly and revoke links. Edits after sharing do not change that snapshot. Account activation requires the setup below.
- **Local Content Studio.** Edit and publish the catalog, all five translations, per-place coordinates and sources, photography and review dates together. Review queues highlight overdue content, approximate coordinates and translations awaiting human review.

Suggested visit times, accommodation areas, months, transport/walking classifications and budgets are editorial planning starting points. Month tags initially follow state seasons and are editable per place in Studio; they are not live forecasts. Transit-friendly labels identify city bases, not every attraction. Walking labels do not certify wheelchair access; use the linked operator or park guidance. Eight popular-place access guides were reviewed against official sources on 2026-09-14. Human translation review and 108 approximate-area coordinate reviews remain in the Studio queue. The budget is `days × travelers × the traveler’s daily amount`; flights, car rental and one-off costs are separate. No live inventory, reservations or destination-specific price promises are generated.

## Configure the public site and accounts

Copy `.env.example` to `.env.local`, then fill the values you actually use:

| Variable                        | Purpose                                                                                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SITE_URL`                      | The real absolute public origin, such as your HTTPS domain, without a subpath. Adds canonical URLs, reciprocal `hreflang`, social image URLs and `sitemap.xml` at build time. |
| `VITE_SUPABASE_URL`             | URL of the Supabase project selected for Roam America.                                                                                                                        |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Its public publishable key (or legacy `anon` key). Secret and service-role keys are rejected by the client.                                                                   |
| `NPS_API_KEY`                   | Optional server-side environment value for refreshing the public park snapshot. Never bundled in the browser.                                                                 |

Without a public origin, the build still generates all language pages but omits absolute canonical/social URLs and the sitemap. Without Supabase configuration, the account entry is hidden and all local features work. This release does not activate accounts or connect a database.

To activate accounts on the intended Supabase project:

1. Initialize the CLI configuration if this is the first setup: `npx supabase init`.
2. Run `npx supabase login`, then `npx supabase link --project-ref YOUR_PROJECT_REF`.
3. Inspect `npx supabase db push --dry-run`, then apply `npx supabase db push` to that project. The migration is in `supabase/migrations/20260909193429_roam_cloud_trips.sql`.
4. Enable email/password authentication. Set the Auth Site URL to the deployed origin and allow the exact redirect URLs used by the application: `/?lang=en&view=planner&account=1`, with equivalents for `th`, `zh`, `ja` and `ko`. Add localhost equivalents for development if needed. Configure an email provider for production confirmation and reset emails.
5. Set the public URL/key above and rebuild. Verify signup confirmation, reset, saving and loading using your own test account on the actual deployed site.

The migration uses owner-based row-level policies, explicit column permissions and immutable revisions. Account updates use the loaded revision; a conflict offers loading the latest copy or saving a new one. Loading a cloud trip explicitly replaces the browser trip. Signing out keeps the local trip on that device. The anonymous API can read one unexpired shared snapshot by its random token; it cannot list private trips or shares. Keep `roam_private` out of exposed API schemas. Snapshot expiry is checked by PostgreSQL even if old rows have not been deleted.

No project has been provisioned or linked by this repository. Hosted authentication, delivery of emails and production database activation depend on the owner’s project configuration. See the official [Supabase password auth guide](https://supabase.com/docs/guides/auth/passwords) and [row-level security guide](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Park facts, coordinates and maps

`public/data/parks.json` is a dated snapshot for 42 NPS destinations: operating hours, fee descriptions and conditions, official alerts and visitor-center records. The UI labels the original English data, shows its retrieval date, flags snapshots older than seven days and links to the park for current conditions. A missing alert does not imply that every area is open. Nonresident fee conditions remain visible with the source description.

Refresh the snapshot explicitly with:

```sh
npm run refresh:parks
```

Provide `NPS_API_KEY` in the process environment for normal use; the script falls back to the rate-limited public `DEMO_KEY`. It queries parks, alerts and visitor centers, validates completeness and atomically replaces the cache only after successful responses. Refreshing does not alter the editor’s selected coordinates or mark editorial reviews complete. Review the diff and publish a new build to update visitor-facing facts. [NPS API documentation](https://www.nps.gov/subjects/developer/get-started.htm).

The canonical coordinates are in each profile in `content/states.json`; 42 profiles identify an NPS visitor center. Other profiles identify an approximate area. A reference point does not guarantee vehicle access or parking. `content/places.json` is the original research archive and is no longer read by the app. Preserve stable place slot IDs (`CA-0`, for example) when editing existing destinations.

Opening a map requests OpenStreetMap tiles. Driving calculation sends 2–10 mapped activity coordinates to OSRM/FOSSGIS; custom activities remain in the plan but are excluded. Routes may snap to nearby roads within 5 km and exclude live traffic, breaks and seasonal closures. Requests are queued at least 1.1 seconds apart, cancel when obsolete, time out after 12 seconds and use a 30-route in-memory cache. Disconnected islands or roads can return no route; the UI preserves the plan and offers retry and directions links.

**Map tiles and third-party API responses are never saved by the offline service worker.** Live maps, routing, accounts and shared-link retrieval need a connection. Photos are downloaded only after the user requests offline saving. See the [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/) and [routing service policy](https://map.project-osrm.org/about.html). Configure a dedicated provider in `components/RouteMap.tsx` and `lib/routing.ts` before a high-traffic rollout.

## Content Studio — สำหรับเจ้าของเว็บไซต์

```sh
npm run studio
```

เปิด **http://127.0.0.1:5174/studio**:

1. เลือกรัฐและภาษา แก้คำอธิบาย อาหาร ข้อแนะนำ ฤดูกาล และสนามบิน
2. เปิดรายละเอียดรายสถานที่เพื่อแก้เรื่องราว เวลาเที่ยว บริเวณที่พัก การเข้าถึง ประเภทหมุด พิกัด ลิงก์อ้างอิง วันตรวจสอบ และข้อมูลเดือนท่องเที่ยว การเดินทาง การเดิน และกิจกรรมในร่ม/กลางแจ้ง
3. จัดการภาพ JPEG/PNG/WebP ขนาดไม่เกิน 5 MB ใส่ผู้ถ่าย แหล่งที่มา และสิทธิ์ใช้งานให้ครบ ทุกสถานที่ต้องมีอย่างน้อย 3 ภาพ
4. ใช้คิวตรวจทานเพื่อดูข้อมูลที่ถึงกำหนด พิกัดที่ยังเป็นพื้นที่โดยประมาณ และภาษาที่ยังไม่ได้ตรวจ แก้ข้อความแล้วสถานะตรวจทานภาษานั้นจะถูกล้าง
5. บันทึกฉบับร่าง ดูตัวอย่าง และตรวจข้อมูลก่อนกด **เผยแพร่เข้าโปรเจกต์** จากนั้น build, commit และ push เพื่อส่งต่อให้โฮสต์ deploy

เนื้อหา คำแปล ภาพ และพิกัดบันทึกใน catalog เดียว ป้องกันการเขียนทับงานจากหน้าต่างอื่นด้วย revision; เมื่อขัดแย้งให้โหลดล่าสุด ฉบับร่างอยู่ที่ `.studio/draft.json` และไม่เข้า Git ภาพอัปโหลดอยู่ใน `public/images/library/` ข้อมูลสำรองรุ่นเดิมจะเติมรายละเอียดสถานที่จากชุดปัจจุบันได้เมื่อชื่อสถานที่ตรงกันเท่านั้น

Studio เปิดเฉพาะ localhost ในโหมด `studio`; production ไม่มี API เขียนไฟล์ คำแปลที่เพิ่มเข้ามายังอยู่ในคิวรอการตรวจทานโดยเจ้าของภาษา ไม่ได้ถูกทำเครื่องหมายว่าผ่านการตรวจโดยคนแล้ว

`content/states.json` is the published source of truth for all 50 states and their three destination slots. Original interface/article translations are maintained in `content/translations.json`, with English/Thai strings alongside the UI. New experience copy, itineraries and field notes keep five languages together in `data/experience-copy.ts`, `data/itineraries.ts` and `data/fieldNotes.ts`. Photos have concise localized place/photo labels; the full original source caption and NPS excerpts retain their source language.

## Storage and privacy

Browser storage holds language, favorites, comparison choices, place collections, visited places and the trip library. `roam.trip.v1` remains the current-trip compatibility record; `roam.library.v1` stores up to 30 trips and `roam.collections.v1` stores up to 20 collections. These do not sync across devices. Export a trip or collections backup to transfer it. JSON backups use version 2 and accept version 1 imports; old trips preserve notes, dates, stops and budget settings. Trips support up to 200 activities and imports are limited to 1 MB. Cloud storage is used only through the explicit account actions. Shared snapshots omit personal notes and checklists unless selected; anyone with the link can view the included trip details until expiry or revocation. Downloaded copies cannot be recalled.

The application has no analytics or advertising trackers. Gallery images, fonts and atlas geometry are local assets. Studio drafts are disk files independent of traveler storage. Clearing browser data removes local plans and offline copies; account copies remain until removed from the account database.

## Verification and project structure

```sh
npm run check:content
npm run typecheck
npm run build
npx playwright install chromium
npm test
npm run test:cloud
npm run test:production
npm run format:check
```

The 86-test regular Chromium suite covers multi-trip switching, collections import/export, templates, the trip helper, editable timelines and the existing desktop/mobile flows, five languages, galleries, imports, history, comparisons, undo, routing failures, occupied-day protection, accessibility and isolated Studio persistence/security checks. `test:cloud` runs the migration against PGlite PostgreSQL and checks ownership, anonymous access, revision permissions, stale saves, sharing, revocation and expiry.

`test:production` builds to ignored `artifacts/production/`, serves port 5198, checks static SEO without JavaScript, client metadata, offline reloads, all saved photos and PDFs in five languages. Account tests intercept Supabase HTTP requests to exercise the real browser client without sending emails or changing a remote database. Reports and PDFs are in `artifacts/production-results/` and `artifacts/production-report/`. Tests close their servers when finished. GitHub Actions runs all three suites.

| Location                                                                                 | Responsibility                                                             |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `App.tsx`, `components/`, `expedition.css`, `experience.css`                             | Discovery, comparison, guides, daily planning, print, accounts and sharing |
| `content/states.json`, `data/travel.ts`                                                  | Published multilingual profiles, images, coordinates and types             |
| `lib/content.ts`, `studio/`                                                              | Validation, migration, review queues and local editor                      |
| `lib/storage.ts`, `lib/useTripHistory.ts`, `lib/journeyLibrary.ts`, `lib/collections.ts` | Trip validation, browser persistence and undo                              |
| `lib/cloud.ts`, `supabase/migrations/`                                                   | Optional authentication, scoped cloud storage and sharing                  |
| `scripts/build-pages.mjs`, `lib/pageMetadata.ts`, `lib/offline.ts`                       | Static pages, SEO metadata and offline downloading                         |
| `scripts/refresh-parks.mjs`, `public/data/parks.json`                                    | Official dated park snapshot                                               |
| `scripts/review-v3.mjs`                                                                  | Local contact sheets of the published photos in `artifacts/v3/`            |

## Sources and licenses

[`public/credits.txt`](public/credits.txt) lists each photograph’s source, author and license, regenerated at build time. Wikimedia Commons images retain individual CC BY, CC BY-SA, CC0, public-domain or Free Art License terms. NPS images use the credits and public-domain status supplied for the selected images. Photos are locally resized and may be cropped by the layout. Hero/route photographs also use Unsplash.

Destination summaries now use concise editorial highlights rather than encyclopedia introductions. Earlier research remains in the source archive. Each profile includes its language-specific source link and CC BY-SA 4.0 attribution. Preserve those references when editing or reusing the summaries. Hours, fees and alerts come from the National Park Service; they are snapshots, not live guarantees.

State geometry comes from the ISC-licensed [US Atlas](https://github.com/topojson/us-atlas), with Alaska and Hawaii in separate insets. D.C. and territories are outside the 50-state count. DM Sans, DM Serif Display and Noto Sans Thai are self-hosted under bundled SIL Open Font Licenses. Chinese, Japanese and Korean use the device’s installed font fallbacks.

## v3.5 destination guides and photo review

The remaining 126 destinations now have source-checked arrival routes, named base areas and specific official links in five languages. All 450 photos have descriptive captions; two Mississippi images were replaced with photographs from the correct park section. Arrival and accommodation guidance stays visible, with secondary map references and state planning details expandable. See [the content review and source inventory](docs/v3.5-content-review.md) and [release checks](docs/v3.5-release.md).

## v3.4 mobile performance and usability

The initial catalog now omits practical guide details until a guide opens, while search, trip suggestions, map coordinates and access advisories remain available immediately. Responsive photos include a 640 px option for small cards, also covered by offline downloads. Touch form controls use at least 16 px text, and the day toolbar scrolls normally on short mobile viewports. See [release measurements and checks](docs/v3.4-release.md).

## v3.3 UX and performance

Search and the trip helper now sit inside the opening hero, with an early shortcut to resume a saved trip. State-card images open full guides; Quick view is a separate action. Returning to discovery preserves filters and scroll position. Guides put practical highlights, access notices and save/add actions near the cover.

The mobile planner brings activities forward, keeps day selection and Add activity together in a sticky toolbar, and turns empty time slots into compact add buttons. Header controls fit all five languages. Landmark rotation reuses its WebGL scene; optional motion respects system preferences. Mobile cover crops, responsive preloads, deferred atlas loading and separate gallery metadata reduce startup work. The editorial source remains `content/states.json`; Vite derives both catalog views without duplicating editable content. See [release checks and measured limits](docs/v3.3-release.md).

## v3.2 content review

The first 24 destination access guides and 72 photo captions were reviewed and rewritten across five languages. Big Sur now uses a sourced visitor-information pin; broad areas retain clearly labeled area references. Saved advisories show their check dates and official sources, including on pages without JavaScript and in affected daily plans. Studio includes per-language photo-caption editing and review flags. Native-speaker sign-off remains pending. See [content review](docs/v3.2-content-review.md), [device and usability protocol](docs/usability-check.md), and [release checks](docs/v3.2-release.md).

Install test browsers with `npx playwright install chromium firefox webkit`. `npm test` runs the complete Chromium desktop/mobile suite plus critical workspace journeys on Firefox and WebKit, with targeted touch journeys on Android Chromium and iPhone WebKit emulation. `npm run test:production` covers generated pages, deferred guide details and photo credits, local offline/PDF behavior and mocked optional account compatibility. No tests connect to a real database. After `npm run build`, `node scripts/review-workspace.mjs` records three throttled production measurements and desktop/mobile screenshots under ignored `artifacts/v3.5/`. Use `--performance-only` for measurements or `--screens-only` to refresh screenshots while retaining measurements.
