# Design System - MapMyShopping

Version: 1.3
Last updated: 2026-10-29
Status: Approved by owner 2026-10-29 (home sketch option 3, revised same day)

Source of truth for the look: `docs/design/home-sketch-option-3.html` with `docs/design/option-3-top.jpg` and `option-3-bottom.jpg`, and the decisions in `docs/design/README.md`. Where this file and the sketch differ, this file wins (it adds contrast fixes and states for later screens). Rejected: sketch options 1 and 2, and v1.0-v1.2 of this file. The sketch loads fonts and icons from CDNs for preview only; the app self-hosts Rubik and bundles `lucide-preact`.

Process rule: every phase with UI work needs an owner-approved visual sketch in `docs/design/` before its implementation prompt is written (see Plan.md rules).

## 1. Design Goal
A calm, grown-up household tool: warm off-white canvas, white cards, one dark ink hero that answers "what is left to buy", and a single lime accent for progress and the main action. The home screen reads in walking order - next shop, store route, shortcuts - and the list is always one tap away.

## 2. Visual Language
Attributes: Calm, Confident, Utilitarian, High-contrast, Rounded
Personality: A well-organised kitchen notebook - ink on paper with one highlighter.
Do:
- Off-white canvas, white cards without borders, generous radius.
- Ink (dark green-black) for headings, the hero card and primary buttons; lime only for progress, "done" and the main call to action.
- Strong type hierarchy from size and weight (800 for titles and numbers), not from color.
- Numbers first: counts and progress are the largest thing on a card.
Don't:
- No multiple accent colors, pastels, gradients or playful illustration (owner: must not look like a children's app).
- No lime text on white or canvas (contrast); lime is used on ink or as a fill behind ink text.
- No product photos, prices or promotions.
- No color-only status; no new colors or fonts outside this file.

## 3. Color System

| Role | Token | HEX | Usage |
|---|---|---|---|
| Ink | --color-ink | #14201B | Hero card background, primary button fill, center add button, done step square, active nav item, headings |
| Ink 2 | --color-ink-2 | #26342E | Progress-ring track on ink, pressed state of ink surfaces |
| Accent | --color-accent | #C6F36B | Progress-ring fill, main CTA fill (ink text), lime icons and text on ink, done check |
| Accent hover | --color-accent-hover | #B4E651 | Pressed state of the lime CTA |
| Accent soft | --color-accent-soft | #EEFBD6 | Pending step-number square, selected chip, positive banners |
| Background | --color-bg | #F2F3EF | Page canvas; icon squares inside white tiles; ring around the center add button |
| Surface | --color-surface | #FFFFFF | Cards, route card, tiles, round top-bar buttons, bottom nav, sheets |
| Text | --color-text | #14201B | Primary text |
| Text on ink | --color-text-on-ink | #FFFFFF | Text on the hero card and ink buttons (secondary lines at 70-85% opacity) |
| Muted text | --color-text-muted | #646E69 | Secondary text at body sizes: item previews, eyebrow, nav labels, counts (AA on white 5.3:1, on canvas 4.8:1) |
| Subtle | --color-text-subtle | #707A75 | Sketch muted tone; only for text >= 18px bold, icons and done-step names (AA large / UI 3:1) |
| Border | --color-border | #E2E5DF | Hairline dividers between route stops and inside sheets; input borders |
| Success | --color-success | #2B6E2F | Saved / synced text and icons on white or canvas |
| Warning | --color-warning | #8A5300 | Pending sync, expiring draft, lockout countdown |
| Error | --color-error | #B42318 | Errors and destructive actions |
| Info | --color-info | #1E5FA8 | Neutral notices |
| Collected | --color-collected | #646E69 | Text of collected rows (with strikethrough + check) |

On ink, status text uses the accent (synced) or white with an icon (pending / failed); never the semantic colors above, which are tuned for light backgrounds.

Dark mode: Later phase (not in MVP).
Contrast: all text / background pairs meet WCAG AA (4.5:1 body, 3:1 large text and UI components). The sketch's `#707A75` at 14px fails AA, so body-size muted text uses --color-text-muted.
Print: pure black on white; no fills.

## 4. Typography

Font: Rubik (unchanged, owner decision 2026-10-29), self-hosted variable font, Hebrew + Latin subsets only; fallback `system-ui, -apple-system, "Segoe UI", Arial, sans-serif`.

| Style | Size | Weight | Line height | Usage |
|---|---|---|---|---|
| H1 | 30px / 1.875rem | 800 | 1.15, tracking -0.3px | Screen title ("הרשימה של הבית") |
| Hero number | 24px / 1.5rem | 800 | 1.2 | Hero headline ("12 פריטים ב-4 אזורים") |
| Ring number | 26px / 1.625rem | 800 | 1.05 | Count inside the progress ring ("5/12") |
| H2 | 21px / 1.3125rem | 800 | 1.3 | Section title ("המסלול בחנות", "קיצורים") |
| Button | 17px / 1.0625rem | 800 | 1.2 | Main CTA label |
| Body strong | 17px / 1.0625rem | 700 | 1.35 | Route stop name, list item name |
| Body | 15px / 0.9375rem | 600 | 1.4 | Eyebrow, tile labels, hero "N נותרו לאסוף", links |
| Meta | 14px / 0.875rem | 400-700 | 1.4 | Item previews (400), per-area counts (700), hero label |
| Caption | 13px / 0.8125rem | 400 | 1.3 | Sync line, helper text |
| Micro | 12px / 0.75rem | 600 (800 active) | 1.2 | Nav labels, ring caption |

Rules: one family; numbers use tabular figures; no sizes outside this scale.

## 5. Spacing & Layout

Base unit: 4px.

| Token | Value |
|---|---|
| --space-1 | 4px |
| --space-2 | 8px |
| --space-3 | 12px |
| --space-4 | 16px |
| --space-5 | 20px |
| --space-6 | 24px |
| --space-8 | 32px |
| --space-12 | 48px |

Layout: single column, max content width 430px, centered. Page padding 24px top, 20px inline gutter, 124px bottom (clears the floating nav plus safe-area inset). Gap between sections 26px; section title to card 12px; between tiles 10px.

## 6. Radius & Elevation

| Token | Value | Usage |
|---|---|---|
| --radius-sm | 12px | Step-number squares, icon squares, arrow square inside the CTA |
| --radius-md | 18px | Buttons (main CTA), inputs, chips, list rows |
| --radius-lg | 20px | Shortcut tiles, small cards |
| --radius-xl | 24px | Route card, bottom nav, bottom sheets |
| --radius-2xl | 28px | Hero card, dialogs |
| --radius-full | 9999px | Round icon buttons, center add button, badges, progress bar |

Elevation: flat cards on the canvas. One shadow only, for the floating bottom nav and dialogs: `0 10px 30px rgba(20,32,27,.12)`.

## 7. Components

### Top bar (home)
- Start side: date eyebrow (Body, --color-text-muted, e.g. "יום חמישי · 29 באוק׳", formatted with `Intl` for he-IL from the device clock) above the H1 title, single color.
- End side: two 46px round white buttons (search, settings), 21px icons in ink, 8px gap.
- Other screens: same top bar with screen title, back chevron (mirrored for RTL) instead of the eyebrow.

### Hero card (home)
- Ink card, --radius-2xl, padding 22px, text --color-text-on-ink.
- Row: 96px progress ring (stroke 10, track --color-ink-2, fill --color-accent, round cap, starts at 12 o'clock) with Ring number "X/Y" and Micro "נאספו" in the center; beside it: Meta label "הקנייה הבאה" (70% opacity), Hero number "N פריטים / ב-M אזורים", Body "K נותרו לאסוף" (85% opacity), Caption sync line with icon in --color-accent ("מסונכרן עם כל הבית"; pending / failed in white with icon).
- Full-width main CTA "יוצאים לקנות": height 54px, --radius-md, lime fill, ink Button label, 40px ink arrow square (--radius-sm) with lime arrow icon at the inline-end side (arrow points left in RTL).
- Ring has a text equivalent (`role="img"` + aria-label "X מתוך Y נאספו").
- Empty list: ring hidden, headline "הרשימה ריקה", CTA becomes "הוספת פריטים".

### Store route card ("המסלול בחנות")
- Section header: H2 at the start, "עריכת סדר" link (Body 700, ink at 60% opacity, mirrored chevron) at the end.
- White card, --radius-xl, padding 6px 16px; stops separated by --color-border hairlines; each stop padding 14px block.
- Stop: 36px step square (--radius-sm, --color-accent-soft, number in 800) | area name (Body strong) over item preview (Meta 400, --color-text-muted, comma-separated, truncated to one line) | count "collected/total" (Meta 700, --color-text-muted) at the inline-end.
- Done stop: ink square with lime check, area name in --color-text-subtle.
- Areas in walking order; empty areas hidden; "לא משויך" last.

### Shortcut tiles ("קיצורים")
- 3-column grid, gap 10px. White tile, --radius-lg, padding 14px, 18px gap: 40px icon square (--radius-sm, --color-bg, 20px ink icon) above Body 700 label.
- Tiles: הוספה קולית (mic), מועדפים (star), קטלוג (layout-grid).

### Floating bottom navigation
- Fixed, 16px above the bottom edge (plus safe-area inset), width min(100% - 32px, 398px), height 70px, white, --radius-xl, nav shadow.
- Five slots `1fr 1fr 76px 1fr 1fr`: בית (home), רשימה (list-checks), center add, מועדפים (star), הבית שלי (user-round).
- Items: 22px icon over Micro label, --color-text-muted; active: ink, weight 800, `aria-current="page"`.
- Center add: 60px ink circle with 28px lime "+" icon, 5px --color-bg ring, raised 26px above the bar; Hebrew aria-label "הוספת פריט".
- Settings is not in the nav; it stays in the top bar.
- Hidden in shopping mode and print view.

### List rows (list / shopping mode / catalog)
- White row, --radius-md, min height 64px, padding 14px 16px, 8px gap.
- Start: 36px square (--radius-sm, --color-accent-soft) with category icon; middle: name (Body strong) over quantity + unit (Meta, muted); end by context: collect toggle (36px circle, empty = 2px --color-border ring, collected = ink fill with lime check), "+" round button (catalog, favorites), chevron (edit).
- Collected: check + strikethrough + --color-collected; row stays in place.
- Pending-sync rows: small clock icon with screen-reader label.

### Store-area section header (list, shopping mode)
- Step square with the area's walking-order number + H2 area name + Meta count; empty areas hidden; "לא משויך" last.

### Progress (shopping mode)
- Compact ink bar under the top bar: 48px lime ring + "X מתוך Y נאספו" in white.

### Buttons
- Primary: ink fill, white label. Main CTA: lime fill, ink label (one per screen, the action that moves the user forward). Secondary: white fill, ink label. Ghost: ink text at 60%. Destructive: --color-error fill, white label. Round icon: 46px white / 60px ink.
- Heights: 40px (sm), 48px (md), 54px (lg / CTA); --radius-md.
- States: pressed (ink-2 / accent-hover), focus ring, disabled (40% opacity), loading (spinner, label kept).

### Quantity stepper
- Two 40px --color-bg squares (--radius-sm) with minus / plus, value between (Body strong, tabular); 44px hit area; unit chip beside.

### Chips
- White chip, --radius-md, Body label; selected = --color-accent-soft fill with ink label and check icon.

### Radio cards
- White card, --radius-lg; selected = 2px ink border and ink radio. Used for duplicate resolution and unit choice.

### Inputs & Forms
- White field, 1px --color-border, --radius-md, 52px high; label above (Body), helper below (Caption muted), error below in --color-error with icon; focus = 2px ink ring.
- Validation on blur and on submit; messages specific, in Hebrew.
- Add-item field: white input, mic round button at the inline-end, ink "+" round button beside it.

### Search & suggestions
- Type-ahead list under the field (max 8) as compact white rows; aliases matched; matched text 700.

### Bottom sheets & Dialogs
- Sheet: white, --radius-xl top corners, drag handle; for edit, duplicate resolution and voice review.
- Confirm dialog for every destructive action: --radius-2xl, title states the action and its scope ("Clear the whole list? Catalog and favorites are kept."), destructive + secondary buttons.
- Household deletion: full-screen confirm with the list of what will be deleted and a typed confirmation.

### Notifications
- Toast above the bottom nav (3s): ink pill, white text, lime icon; undo where applicable.
- Inline banner for offline / pending / failed: white card with semantic icon and text.

### Empty States
- 64px --color-bg icon square + H2 line + Body muted line + one primary or CTA button.

## 8. Iconography
Library: Lucide (`lucide-preact`). Outline, stroke 2, sizes 15 / 18 / 20 / 21 / 22 / 28 as in the sketch.
RTL: mirror directional icons (arrows, chevrons); do not mirror check, mic, plus, search, settings, star, home.

## 9. Motion
150ms presses and nav state; 250ms sheets and dialogs; 400ms ring fill. Ease-out. Respect `prefers-reduced-motion`.

## 10. Responsive Behavior

| Breakpoint | Width | Behavior |
|---|---|---|
| Mobile | < 640px | Primary target; floating nav full width minus 32px |
| Tablet / Desktop | >= 640px | Content column max 430px centered; nav max 398px centered; sheets become centered dialogs on desktop |

## 11. Accessibility
- WCAG AA contrast (see section 3).
- Focus ring: 2px ink outline, 2px offset (lime outline on ink surfaces).
- Every input has a visible label; icon-only buttons have Hebrew `aria-label`.
- Bottom nav is a `<nav aria-label="ניווט ראשי">` with `aria-current="page"`; hero is a labelled `<section>`; ring has a text equivalent.
- Status never by color alone; errors announced via `aria-live`.
- Minimum touch target 44x44px.

## 12. RTL & Localization
- `<html lang="he" dir="rtl">`; logical CSS properties only.
- Mixed Hebrew / Latin / numbers wrapped with `<bdi>` or `unicode-bidi: isolate` (e.g. "5/12", "חלב 3%").
- Numbers and dates via `Intl` for he-IL. All UI copy in `src/locale/he.js`.

## 13. UX Principles
- One main action per screen.
- Never commit uncertain input silently - review before commit (voice, bulk add).
- Every destructive action states its scope and asks for confirmation.
- Always show whether a change is saved locally, synced, or failed.
- Stay in context after adding: field clears, counter updates, no navigation.
- Personal state (collected) must never look like shared state.

## 14. UI States
| Screen / Component | Empty | Loading | Success | Error |
|---|---|---|---|---|
| Home hero | "הרשימה ריקה" + "הוספת פריטים" CTA, ring hidden | Ink skeleton block | Full lime ring + "הכול נאסף" | Sync line "לא סונכרן" with icon + retry |
| Route card | "עוד לא הוגדר מסלול" + "הגדרת מסלול" link | Skeleton stops | - | Inline banner |
| Shopping list | "The list is empty" + Add items | Skeleton rows | - | Load failed banner + retry; offline banner with cached data |
| Shopping mode | "Nothing to collect" | Skeleton rows | "All collected" message | As list |
| Add items | Field focused, counter 0 | Spinner on add button | Toast "נוסף", counter +1 | Inline error; saved-locally notice when offline |
| Voice | Mic prompt | Listening indicator | Review sheet | Unsupported / mic denied message + manual entry |
| Catalog search | "No match" + add to catalog | Suggestion skeleton | - | Inline error |
| Favorites | "No favorites yet" + how to add | Skeleton tiles | Toast with count added | Inline error; draft kept |
| Recovery code entry | - | Spinner | Success screen | Wrong code with attempts left; lockout countdown |
| Invite join | - | Spinner | Joined -> recovery code step | Expired / used / invalid code message |

## 15. Open Questions
- App name and icon for the installed PWA.

## Change Log
| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-10-28 | Initial system from two grocery-app references |
| 1.1 | 2026-10-28 | Three-phone grocery reference. Rejected by owner before implementation |
| 1.2 | 2026-10-28 | Foodnoms direction. Implemented in Phase 0 fix round 2; rejected by owner ("looks like a children's app") |
| 1.3 | 2026-10-29 | Owner-approved home sketch option 3 (revised): canvas #F2F3EF, ink #14201B / #26342E, lime #C6F36B / #EEFBD6, muted #707A75 (kept as subtle; body-size muted text #646E69 for AA), border #E2E5DF; semantic colors retuned for AA on light backgrounds; Rubik unchanged; radius 12-28; dark hero card with lime ring and "N נותרו לאסוף" (stats "חדשים היום" / "בני בית" dropped); store route card; shortcut tiles; floating bottom nav with center add and "הבית שלי"; date eyebrow; sketch-first rule for UI phases |
