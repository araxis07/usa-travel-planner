# Roam America

An independent travel guide and itinerary planner for all 50 U.S. states, available in English, Thai, Simplified Chinese, Japanese and Korean.

## Run the website

Node.js 22 or newer:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. No API keys or accounts are required. Build with `npm run build`, then deploy `dist/` to a static host at the domain root. Production includes local images and fonts and makes no third-party asset requests.

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

Routes are sequences of **states**, not driving directions. Travelers choose their towns, accommodation and transport. The planner does not calculate driving distance or travel time. The budget is `days × travelers × the traveler’s daily amount`; USD 150 is an editable default, not a verified destination cost. Flights, car rental and one-off expenses are separate.

Favorites, language and trips use browser local storage (`roam.saved.v1`, `roam.language`, `roam.trip.v1`). There are no accounts, cloud sync, analytics or tracking. Clearing browser data removes personal saved plans; JSON exports let travelers back up or move their trip. Text exports use the currently selected language. Content Studio drafts use disk files independently of traveler storage.

## Structure

- `App.tsx`, `components/` — discovery, atlas, galleries, guides, dialogs and trip planner.
- `content/states.json` — published state content, all five translations, images and references.
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

With both dev servers running, `node scripts/capture-v2.mjs` captures five-language desktop/mobile previews, galleries, the editor and a photo contact sheet into ignored `artifacts/v2/`. `node scripts/capture.mjs` captures the original broader page flows. Automated checks supplement manual visual review.

GitHub Actions checks formatting and content, builds the site, and runs the tests on pushes to `main` and pull requests. No hosting-specific deployment configuration is assumed.

## Sources and licenses

See [`public/credits.txt`](public/credits.txt) for every photograph’s source, photographer and license. The state galleries use Wikimedia Commons photographs with individual CC BY, CC BY-SA, CC0, public-domain or Free Art License terms; source metadata is stored with each image. Local images are resized and may be cropped by the layout. Hero/route photography also uses Unsplash. Source and license links remain beside the selected gallery image. `npm run build` regenerates the credit list from published content.

State geometry is from the ISC-licensed [US Atlas](https://github.com/topojson/us-atlas). Alaska and Hawaii appear in separate insets; D.C. and territories are outside the 50-state count. DM Sans, DM Serif Display and Noto Sans Thai are self-hosted under the bundled SIL Open Font Licenses. Chinese, Japanese and Korean use the device’s native font fallbacks.

```sh
python3 scripts/prepare-map.py /path/to/states-albers-10m.json
```
