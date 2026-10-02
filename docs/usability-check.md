# Mobile and language review protocol

This release has automated Chromium desktop/mobile, Firefox desktop and WebKit touch coverage. Browser emulation is not a physical iPhone/Android test. No recruited user study or native-speaker review has been performed.

On 2026-10-02, the local build, 140 browser checks and seven production-build checks passed. A separate 320 px Chromium check found no document-level horizontal overflow on the five homepages. The production checks use a test origin for canonical links and offline behavior; they do not verify a deployed website. Three throttled local mobile LCP runs were 2.456, 2.360 and 2.364 seconds (median 2.364 seconds), with zero measured layout shift. These are lab results, not field Core Web Vitals. The home logo now points to a real language-specific homepage, and comparison/printed-budget tables have accessible captions. The physical-device, screen-reader, first-time visitor and fluent-language reviews below are still pending.

On 2026-10-03, no live deployment URL was found in the repository or its GitHub metadata; GitHub Pages is disabled. The refreshed nine destination advisories passed a 320 px, five-language browser check. No physical phone, recruited-user or fluent-speaker result is claimed.

On 2026-09-28 an additional automated 320 px check confirmed that all six updated destination advisories, their official links and all five localized layouts remain usable without horizontal overflow. This is browser emulation; the physical-device, screen-reader and recruited-user items below are still pending.

The v3.4 touch checks also run with Pixel 7 and iPhone 13 profiles: five-language forms, a 390 × 360 constrained viewport, portrait/landscape changes, focused-field submission, persistence and dialog dismissal. A resized viewport does not emulate the OS keyboard. On 2026-09-28 no connected USB mobile device was detected; Android `adb` and Apple's `devicectl` were unavailable, so the physical checks below remain pending.

## Ten-minute task for 3–5 first-time visitors

Use a fresh browser profile in each participant's preferred supported language. Ask the participant to think aloud; do not point out controls unless they are stuck. Use sample travel details, not personal bookings.

1. Find a place suitable for the participant's chosen month and transport preference. Explain why it suits them, where the map pin takes them and whether there is a saved advisory.
2. Create a three-day trip, add an activity on day two, change its start time, and return to the map. On a phone, add another activity after scrolling down the schedule.
3. Enter a flight cost and a hotel deposit in the budget. Explain the group total, per-traveler amount, already-paid amount and remaining amount. Switch between daily and itemized estimates and explain the difference.
4. Save a place in a named collection and mark another visited. Create or archive a second trip.
5. Download the full backup, open its restoration preview, restore one trip as a copy and verify that the current trip remains. Explain what replacement would remove before using that mode.
6. Reload, find the same trip, then switch language. Confirm that personal notes and expenses are preserved.

Record completion (unassisted/assisted/failed), time, wrong turns, misunderstood wording and severity of each issue. Treat lost data, incorrect totals or inaccessible primary controls as release-blocking defects. Avoid interpreting a sample of 3–5 people as a statistically representative result.

## Physical-device checks still to perform

- Safari on a physical iPhone and Chrome on a physical Android phone: portrait/landscape, browser chrome expanded/collapsed, keyboard open, safe areas and 200% text size.
- Add-activity button while scrolling; text fields while the keyboard is visible; budget entry with decimal keypad; dismissing dialogs without losing focus.
- VoiceOver/TalkBack: navigation, expense row labels, backup selection, restore status and return focus. Keyboard-only desktop traversal of the same journey.
- Export/import through the device file picker, reload persistence, interrupted import and storage-full message. A backup contains private notes and expenses; use a sample file during the test.
- Reduced-motion and photo mode; unavailable WebGL fallback; stable layout and no hidden content at 320 px width.
- Slow connection and offline on the deployed HTTPS origin. Generated pages and download behavior should also be checked on the actual host.

## Language sign-off

Have a fluent/native reviewer inspect Thai, English, Simplified Chinese, Japanese and Korean destination text, access instructions and image captions in the rendered layout. In Studio, mark only the reviewed language. Editing its caption or destination text clears that sign-off. Confirm proper names, natural wording, line wrapping, currency context and historical-photo labels. All current review flags remain pending.
