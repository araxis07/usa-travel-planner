# Readability maintenance — 2026-10-01

Quick-view fact labels measured 3.91:1 against the paper background, and the place-list fine print measured 4.48:1. Both now use the existing muted text color, which measures 5.62:1 against that background. Fact labels, supporting notes and photo credits use 12 px text; fact values use 14 px. Removed smaller responsive overrides so those sizes remain consistent on phones.

State-card names and quick-view cover headings now have a navy backing independent of the photograph. State codes no longer use faded text. Long names can wrap within their backing, including Korean names on narrow cards. Removed the separate mobile image-link aspect ratio so the photo fills its frame; very narrow screens reserve enough image height to separate the region badge from long names. The trip-helper and gallery buttons use solid navy backgrounds. The state-card keyboard focus ring is drawn inside its clipped image frame, with white and navy edges.

## Verification

- Expanded contrast coverage across all five languages for home, quick view, place discovery, state and place guides, photo lightbox, trip overview, daily plan and itemized budget. Mobile checks use a 320 px viewport and check page reflow; the seeded plan includes an activity and an expense.
- A separate contrast check substitutes white image backgrounds and removes decorative gradients. It checks all 50 state cards in all five languages, including name wrapping and separation from region badges. Card labels and quick-view cover text have no reported contrast violations or unresolved contrast checks in any language. The card keyboard focus ring remains visible inside its frame.
- Reviewed production screenshots of Thai and Korean cards at 320 px, Thai quick view, and existing English desktop / Thai mobile guide, planning, budget, backup and scene journeys. The screenshot journeys reported no page errors or horizontal page overflow.
- The regular browser suite passed all 138 checks. After the final card-layout correction, 24 focused readability and UX checks passed, followed by all seven production browser checks. Content validation, TypeScript, production build, formatting and local cloud SQL compatibility checks passed.

The final local throttled mobile production profile recorded LCP values of 2.544, 2.396 and 2.372 seconds (median 2.396 seconds), with CLS 0 and no horizontal page overflow in all three runs. The median is below the 2.5-second lab target, while one run is slightly above it. These variable lab timings do not establish a performance improvement or field Core Web Vitals. No new runtime dependency or data connection was introduced.

Physical iPhone/Android testing, OS text enlargement and screen-reader sessions, recruited visitor testing and fluent/native language sign-off remain pending under [the existing protocol](usability-check.md). Browser emulation and automated contrast checks do not complete those reviews. The September 30 travel-data review still has its October 7 review deadline under [the maintenance note](2026-09-30-maintenance.md).
