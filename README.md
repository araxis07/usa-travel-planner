# Roam America

An independent travel guide and itinerary planner for all 50 U.S. states, available in English, Thai, Simplified Chinese, Japanese and Korean.

## Run the website

Node.js 22 or newer:

```sh
npm ci
npm run dev
```

Open the `Local` URL printed by Vite (normally `http://127.0.0.1:5173`). If that port is already in use, `npm run dev` automatically selects the next available port. Stop a dev server with `Ctrl+C` in its terminal when finished. No API keys or accounts are required. Build with `npm run build`, then deploy `dist/` to a static host at the domain root. Photography, fonts, the state atlas and the Leaflet library are bundled locally. Interactive destination maps load OpenStreetMap tiles only when opened; driving calculations contact the routing service only when requested.

## Destination pages and daily itineraries

- **50 full state guides and 150 destination pages:** direct links such as `/?lang=th&state=california&place=yosemite-national-park`, native sharing with copy-link fallback, back/forward navigation, localized titles, credited photography, planning facts, nearby guides and official tourism references. Query-based URLs work on static hosts without rewrite rules. Cards retain quick previews and include a full-guide link.
- **Fullscreen galleries:** keyboard arrows, swipe navigation, zoom, individual source/license links, image failure handling and focus restoration back to the opening control.
- **Daily planner:** state/day selectors, morning/afternoon/evening activities, a place selector for all 150 destinations, custom activities, editable duration and notes. Drag to reorder or move between periods; buttons and selectors provide keyboard/touch equivalents. Date labels follow the trip start date and state order. Occupied last days cannot be removed until their activities are moved or deleted.
- **Maps and driving estimates:** up to 10 mapped activities per day, numbered pins, calculated route geometry, distance, driving time and total planned minutes. Plans exceeding 12 hours prompt a suggestion to move activities. Directions links are available for each leg. Custom activities are retained in the itinerary but excluded from routing.
- **Mobile bottom navigation:** Discover, Map, Saved and My trip, with counts and safe-area spacing. All new controls are translated into the same five languages.

Adding a destination from its guide creates a two-hour activity on the first morning of that state's stay. This is an editable planning default, not a verified visit duration. Plans support up to 200 activities. JSON backups now use `version: 2`; the importer also accepts existing `version: 1` backups. Existing local trips migrate without losing notes, dates, budget settings or stops. Imports are validated and previewed before replacement, with a 1 MB file limit. Text exports include the daily schedule in the selected language.

## Version 2

- **150 local destination photographs:** three credited photographs for each of the 50 states, with selectable galleries, destination names, photographer/source links and individual license details. Each state has a real photographic cover.
- **Five languages throughout:** navigation, state descriptions, food, travel tips, 150 place names, route collections, guide articles, planner controls, notifications, accessibility labels and text exports. Original English place names remain available in the guide for map searches.
- **Search across languages:** a Japanese place name can find a state while the interface is English. Filters combine experience, season and region, with localized name sorting.
- **Language continuity:** `?lang=en|th|zh|ja|ko` takes precedence over the saved preference, then browser language. Switching language preserves filters, the open dialog, selected gallery photo, favorites and trip notes. A language selector is available inside dialogs.
- **Local Content Studio:** edit state translations and travel facts, manage gallery uploads, select covers, maintain attribution, preview, save durable drafts, export/import content backups and publish validated content to project files.
- The existing interactive 2D/3D atlas, animation controls, saved states, trip planning, route templates, budget calculations, JSON trip backups and responsive design remain available.

## Content Studio — สำหรับเจ้าของเว็บไซต์

```sh
npm run studio
```

เปิด **http://127.0.0.1:5174/studio** แล้วทำงานตามลำดับนี้:

1. เลือกรัฐจากด้านซ้าย เลือกภาษา แล้วแก้ชื่อ คำอธิบาย อาหาร ข้อแนะนำ และชื่อสถานที่
2. เปลี่ยนวันแนะนำ สนามบิน ฤดูกาล รูปภาพปก ภาพแกลเลอรี และลิงก์แหล่งข้อมูล
3. ภาพใหม่รองรับ JPEG, PNG และ WebP ไม่เกิน 5 MB ต้องระบุผู้ถ่าย แหล่งที่มา ชื่อสิทธิ์ใช้งาน และลิงก์เงื่อนไข
4. กด **บันทึกฉบับร่าง** เพื่อเก็บลง `.studio/draft.json` ปิดเบราว์เซอร์หรือหยุดเซิร์ฟเวอร์แล้วกลับมาทำต่อได้
5. ใช้ **ดูตัวอย่าง** และตรวจรายการที่ยังขาด กด **เผยแพร่เข้าโปรเจกต์** เมื่อพร้อม ระบบตรวจครบ 50 รัฐ คำแปล 5 ภาษา รูปอย่างน้อย 3 รูปต่อรัฐ ครบทั้งสามสถานที่ เครดิต แหล่งข้อมูล และไฟล์ภาพจริง
6. ตรวจการเปลี่ยนแปลงด้วย Git แล้ว build, commit และ push ตามขั้นตอนของโปรเจกต์ เว็บไซต์ออนไลน์เปลี่ยนเมื่อโฮสต์ deploy สำเร็จ

Studio เปิดเฉพาะบนเครื่องเจ้าของที่ localhost และมีเฉพาะโหมด `studio`; production build ไม่มีหน้าแก้ไขหรือ API เขียนไฟล์ โดยไม่ต้องตั้งค่าบัญชีหรือฐานข้อมูลบนคลาวด์ ฉบับร่างไม่ถูกนำเข้า Git ส่วนภาพอัปโหลดอยู่ใน `public/images/library/` การเปลี่ยนภาพจะล้างเครดิตเดิมเพื่อให้ใส่ข้อมูลของภาพใหม่อย่างถูกต้อง

หากเปิดหลายหน้าต่าง ระบบตรวจรุ่นข้อมูลก่อนบันทึกเพื่อป้องกันการเขียนทับงานที่เพิ่งเปลี่ยน กดโหลดล่าสุดเมื่อเกิดความขัดแย้ง การนำเข้าข้อมูลสำรองเป็นการนำเข้ามาแก้ไขก่อนและยังไม่เผยแพร่ทันที

`content/states.json` is the published source of truth. Canonical state codes and English state identities are fixed to preserve map and trip references. The editor manages the existing 50 state guides and three place slots per state; it is not a remote multi-user CMS. Article and interface copy are maintained in `data/travel.ts` and `content/translations.json`.

## Planning and storage

State guides are editorial starting points, with suggested seasons, durations, food, gateway airports and official tourism links. They are not live booking inventory. Verify destination access, opening hours, weather and reservations with official sources before travel.

Route templates are sequences of **states**. The daily planner separately calculates driving routes between mapped activities. Travelers still choose their accommodation and transport. The budget is `days × travelers × the traveler’s daily amount`; USD 150 is an editable default, not a verified destination cost. Flights, car rental and one-off expenses are separate.

`content/places.json` contains 150 reference coordinates with source links and verification dates. Pins locate destination areas, not exact visitor entrances or parking. Some cover a large region (for example a park or coastline), and the reference title identifies the sampled point. Driving estimates use OSRM/FOSSGIS, can snap to nearby roads within 5 km, and exclude live traffic, breaks and seasonal closures. Islands, remote regions and disconnected roads can return no route; the UI preserves the plan and offers retry and external directions. Verify access with the destination before travel.

The browser queues routing requests with a minimum 1.1-second gap, a 12-second timeout and an in-memory cache of 30 routes. It aborts obsolete requests when destinations change. Maps use standard HTTP tile caching and have no offline downloads or tile prefetching. Visible attribution links to OpenStreetMap, OSRM/FOSSGIS, the map correction page and the routing service privacy policy. Coordinates are sent to the routing service; opening a map sends tile requests. See the [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/) and [public routing service policy](https://map.project-osrm.org/about.html). Public services are best-effort: choose a dedicated provider and configure the URLs in `components/RouteMap.tsx` and `lib/routing.ts` before a high-traffic rollout. Browser tests mock tile/routing requests and never crawl the public tile service.

Favorites, language and trips use browser local storage (`roam.saved.v1`, `roam.language`, `roam.trip.v1`). There are no accounts, cloud sync, analytics or tracking. Clearing browser data removes personal saved plans; JSON exports let travelers back up or move their trip. Text exports use the currently selected language. Content Studio drafts use disk files independently of traveler storage.

## Structure

- `App.tsx`, `components/` — discovery, atlas, galleries, guides, dialogs and trip planner.
- `content/states.json` — published state content, all five translations, images and references.
- `content/places.json`, `lib/destinations.ts` — sourced reference coordinates, stable activity IDs, destination URL handling and localized activity names. When replacing one of the three place slots in Content Studio, update the matching coordinate record too; existing activities refer to the slot ID (`CA-0`, for example).
- `components/DestinationPage.tsx`, `components/PhotoLightbox.tsx`, `journey.css` — full destination pages, fullscreen galleries and the new responsive layouts.
- `components/DailyPlanner.tsx`, `components/RouteMap.tsx`, `lib/routing.ts` — daily schedules, on-demand maps, cancellation, timeout and cached driving requests.
- `content/translations.json`, `lib/i18n.ts` — Chinese, Japanese and Korean interface/article translations and locale handling; English/Thai source strings remain alongside UI copy.
- `data/travel.ts` — types, state data accessors, taxonomies, routes and articles.
- `lib/content.ts` — content structure, image path validation and completeness checks.
- `studio/Studio.tsx`, `studio/server.ts` — owner editor and local file-backed draft, upload and publish endpoints.
- `data/map-paths.json`, `components/Atlas.tsx` — local Albers-projected SVG map with 2D/3D interaction.
- `lib/storage.ts` — trip validation, persistence and portable downloads.
- `public/` — bundled media, fonts, source credits and licenses.
- `tests/` — browser flows, accessibility, multilingual content and isolated Studio persistence/security tests.

## Verification

```sh
npm run check:content  # five-language completeness, credit metadata, asset files, UI dictionary coverage
npm run typecheck
npm run build         # validates content, regenerates photo credits, checks types, builds the static site
npx playwright install chromium
npm test              # desktop and mobile Chromium
npm run format:check
```

Tests cover all 50 image covers, translated gallery/itinerary flows, cross-language searches, persistence, exports, map keyboard controls, reduced motion, filters, favorites, corrupt backups and axe accessibility checks in the new languages. Studio tests use temporary content directories: draft saving/reloading, preview, publication, missing-data rejection, upload validation, cross-origin rejection and stale revision conflicts.

`tests/journey.spec.ts` adds deep-link/history/sharing checks, fullscreen gallery keyboard/swipe/focus checks, daily schedule persistence and version 2 round trips, malformed activity rejection, accessible reorder and cross-period drag, occupied-day protection, mocked routing failure/retry/invalidation, five-language narrow layouts and automated accessibility checks.

`node scripts/capture-journey.mjs` starts its own temporary server on port 5299, captures destination pages, galleries and daily planners into `artifacts/journey/`, then closes the browser and server. With both dev servers running, `node scripts/capture-v2.mjs` captures five-language desktop/mobile previews, galleries, the editor and a photo contact sheet into ignored `artifacts/v2/`. `node scripts/capture.mjs` captures the original broader page flows. Automated checks supplement manual visual review.

GitHub Actions checks formatting and content, builds the site, and runs the tests on pushes to `main` and pull requests. No hosting-specific deployment configuration is assumed.

## Sources and licenses

See [`public/credits.txt`](public/credits.txt) for every photograph’s source, photographer and license. The state galleries use Wikimedia Commons photographs with individual CC BY, CC BY-SA, CC0, public-domain or Free Art License terms; source metadata is stored with each image. Local images are resized and may be cropped by the layout. Hero/route photography also uses Unsplash. Source and license links remain beside the selected gallery image. `npm run build` regenerates the credit list from published content.

State geometry is from the ISC-licensed [US Atlas](https://github.com/topojson/us-atlas). Alaska and Hawaii appear in separate insets; D.C. and territories are outside the 50-state count. DM Sans, DM Serif Display and Noto Sans Thai are self-hosted under the bundled SIL Open Font Licenses. Chinese, Japanese and Korean use the device’s native font fallbacks.

```sh
python3 scripts/prepare-map.py /path/to/states-albers-10m.json
```
