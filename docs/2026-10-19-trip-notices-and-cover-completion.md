# Trip notices and completion of the state-cover review — October 19, 2026

## Whole-trip notices

The existing **Check your plan** disclosure now counts places with saved advisories across the trip. Opening it shows each linked place once, its dated advisory, the official source and buttons for every relevant trip day. Two activities at the same place on the same day produce one day button; visits on different days remain reachable. Buttons use the existing day navigation and keyboard-focus behavior.

The panel reads the current catalog and recalculates after activity edits, removal and Undo. It does not write trip data, infer places from custom activity titles or request routes. The five-language explanation distinguishes saved, dated notices from live opening information and says custom activities are not checked. No matching advisory is not a statement that a place is open. Existing daily advisories remain available.

The browser regression checks all five languages, repeated visits within/across days, global trip-day numbering, keyboard focus, empty notices, removal and Undo, unchanged saved notes/expenses and no automatic routing requests. The production offline/print scenario now includes a linked Big Sur visit and verifies that its source, checked date and day navigation remain available after disconnecting and reloading in all five languages.

## Fifty state covers reviewed

The remaining 35 cover originals and their rendered cards were inspected: HI, CO, AL, AK, AR, CT, DE, GA, ID, IN, IA, KS, KY, LA, MD, MI, MN, MS, MO, MT, NE, NJ, NM, NC, ND, OH, OK, RI, SC, SD, TN, TX, VA, WV and WI. Together with the [previous 15-cover review](2026-10-19-covers-locations-and-booking.md), this completes the first visual pass over all 50 state covers.

Changes from the review:

- At widths up to 480px, discovery and saved-state cards use one column with landscape images. Long English names such as Washington and Massachusetts no longer split inside words. Responsive image sizing now requests enough detail for the wider card; the existing high-density mobile test expects the 960px variant.
- Connecticut, Oklahoma and West Virginia use a right-aligned crop to retain the harbor, tower and river view. Ohio uses a left-aligned crop to retain its tallest skyline building. The previous Washington and Pennsylvania crops remain.
- Arkansas uses the existing sharper Bathhouse Row exterior photo (`/images/places/ar-0-2.jpg`) instead of the soft aerial cover. Its source, license and caption are unchanged; the aerial remains in the gallery. The shared cover selection also reaches the state guide and metadata.

All 50 rendered covers were captured and visually inspected at 320px, 390px and 1440px after the layout/crop changes. Arkansas was then checked again with its replacement cover in the final production build, including its state guide. The narrow-name regression checks all 50 discovery cards and three saved cards at 320px and 390px; existing five-language contrast and enlarged-text tests remain in place.

This is a cover/composition review, not a new audit of all 450 gallery photos, photo licensing or caption translations. No assets were downloaded or generated, and no editorial/native-language review flags were changed.

## Editorial queue

`npm run review:content -- --date=2026-10-19 --days=0` reports **0 due/overdue sections** after the previous Rocky Mountain review. No further source review was due in this batch, so existing checked dates were retained. Saved advisories remain dated information. The next scheduled batch starts October 21; this queue check does not fetch sources or establish live travel conditions.

## Verification and limits

Content validation, TypeScript, formatting and the production build passed (1,005 pages). The final local regression passed all 75 selected checks across accessibility, planning review, travel flows and mobile journeys; the final production suite passed all 21 checks. The long-name test first reproduced the split-word problem before the CSS fix. The full registered browser suite now contains 229 checks and will run on GitHub for the pushed commit.

A production-browser inspection exercised notices in all five languages at 320px, 390px and 1440px, with no horizontal overflow or runtime errors. Thai panel screenshots were visually checked. Evidence and logs are in the ignored `artifacts/2026-10-19-notices/` directory.

Physical devices, native-speaker sign-off and the deployed host were not checked. No database activation, deployment, new city guide, new dependency or additional 3D scene is included. Existing local user data and storage schemas are unchanged.
