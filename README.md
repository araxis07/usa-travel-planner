# Roam America

A complete redesign of USA Travel Planner: an independent, bilingual travel guide and itinerary planner for all 50 U.S. states.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Open the localhost URL printed by Vite. No API keys, accounts, or backend are required.

```sh
npm run build       # strict TypeScript check + production build
npm run preview     # serve the production build
npm run typecheck
npx playwright install chromium
npm test            # desktop and mobile browser tests
npm run format      # format maintained source files
```

Deploy the contents of `dist/` to a static host. The application currently assumes hosting at the domain root. All images, map paths, and fonts are bundled; loading the application does not require third-party asset requests.

## Features

- English and Thai interface and guides, with a remembered language preference.
- 50 state guides, 150 destination starting points, suggested seasons and durations, gateway airports, regional food, practical tips, and official tourism links.
- Search by state, city, landmark, or keyword in English or Thai; combine experience, region, and season filters; sort alphabetically.
- A geographically accurate interactive SVG atlas with optional CSS 3D depth and movement, regional highlighting, keyboard controls, and a direct state selector. Alaska and Hawaii use insets.
- Favorite states saved locally, with an editable saved-places collection.
- A trip planner with state stops, day counts, ordering, notes, departure date, travelers, and a customizable daily USD budget. Automatic local saving; text itinerary download; validated JSON backup import/export.
- Three editable regional route collections. Adding a route preserves existing stops and notes and avoids duplicates.
- Three substantial travel field notes with links to official resources.
- A responsive editorial design, locally hosted travel photographs and fonts, animated travel stationery, native accessible dialogs, and a global animation switch that respects reduced-motion preferences.

## Data and planning assumptions

Travel guides are editorial starting points, not live booking information. Suggested seasons and durations are not guarantees. Each guide links to Visit The USA; park, entry, and road-trip notes link to the relevant official sources. Check access, fees, weather, reservations, opening hours, and road conditions before travel.

Routes describe a sequence of **states**, not turn-by-turn directions. Travelers choose specific towns, overnight bases, and transport. The planner does not calculate driving distances or travel time.

The budget is `days × travelers × the daily amount entered by the traveler`. The default USD 150 is an editable planning input, not a verified state travel cost. Flights, car rental, and one-off costs must be budgeted separately.

## Saving and privacy

The application stores `roam.trip.v1`, `roam.saved.v1`, and `roam.language` in browser local storage. There is no cloud synchronization or account system. Clearing site data removes saved information. Export a JSON backup to move a trip between devices. Imports are validated and require confirmation before replacing an existing trip. If local storage is unavailable, the planner offers a visible export reminder.

No analytics or tracking integrations are included. External map and official-information links open on their respective websites.

## Structure

- `App.tsx` — application state, filtering, persistence, and the discovery page.
- `data/travel.ts` — bilingual state guides, region and interest definitions, itineraries, and field notes.
- `data/map-paths.json` — bundled Albers-projected state outlines.
- `components/Atlas.tsx` — interactive 2D/3D state map and state silhouettes.
- `components/TravelDialog.tsx` — state, route, article, saved-place, and planner dialogs.
- `components/TripPlanner.tsx` — trip editing, budget, notes, and portable exports.
- `lib/storage.ts` — safe local loading, validation, and download helpers.
- `styles.css` — visual system, layouts, responsive rules, and motion.
- `public/` — self-hosted images, fonts, licenses, and credits.
- `tests/` — browser flows, data integrity, backup validation, and automated accessibility checks.

The original random-image cards, placeholder blog posts, unused components, CDN Tailwind setup, and client-side API-key definitions have been removed.

## Verification

Playwright runs the key flows in desktop Chromium and a mobile Chromium viewport, including Thai rendering, image loading, filter intersections, all-state coverage, keyboard map controls, focus management, favorites, trip edits, budget arithmetic, downloads, imports, corrupt-storage recovery, and reduced motion. Automated axe checks cover the landing page and the populated planner. These checks supplement manual visual inspection; they do not constitute a complete accessibility certification.

```sh
npm test
node scripts/capture.mjs   # with the dev server running on 127.0.0.1:5173
```

Screenshots and reports go into ignored local directories. GitHub Actions builds and tests changes on pushes to `main` and pull requests.

## Sources and licenses

See [`public/credits.txt`](public/credits.txt). Photography is sourced from Unsplash. State geometry comes from the ISC-licensed [US Atlas](https://github.com/topojson/us-atlas). Fonts are distributed under their included SIL Open Font Licenses.

To regenerate map geometry from the original downloaded topology:

```sh
python3 scripts/prepare-map.py /path/to/states-albers-10m.json
```
