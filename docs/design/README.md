# Home screen sketches

Owner rejected the deployed home shell (DESIGN_SYSTEM.md v1.2) as looking like a children's app and asked for a sketch-first process.

| Option | File | Status |
|---|---|---|
| 1 | `home-sketch-option-1.html` | Not chosen |
| 2 | `home-sketch-option-2.html` (`option-2-top.jpg`, `option-2-bottom.jpg`) | Not chosen |
| 3 | `home-sketch-option-3.html` (`option-3-top.jpg`, `option-3-bottom.jpg`) | **Approved by owner 2026-10-29** (revised same day) |

Side-by-side view: `home-sketches.html`.

## Approved direction (option 3)
- Canvas `#F2F3EF`, white cards, ink `#14201B` (secondary `#26342E`), accent lime `#C6F36B` (soft `#EEFBD6`), muted text `#707A75`, hairline `#E2E5DF`.
- Font: Rubik (unchanged; owner decision 2026-10-29 - do not replace the font).
- Top: date eyebrow, H1 "הרשימה של הבית" (single color, 30px / 800), round white search and settings buttons.
- Dark hero card (radius 28): lime progress ring "X/Y נאספו", "הקנייה הבאה" + item and area counts, "N נותרו לאסוף" line, sync line, full-width lime "יוצאים לקנות" button with dark arrow square.
- "המסלול בחנות": white card listing store areas in walking order with step number (done = ink square with lime check), item preview and per-area progress.
- "קיצורים": 3 white tiles (voice add, favorites, catalog).
- Floating white bottom nav (radius 24): בית, רשימה, center ink "+" with lime icon, מועדפים, הבית שלי.

Owner revisions 2026-10-29: keep Rubik; drop the "חדשים היום" and "בני בית" stats (the 3-stat strip is removed; remaining count moved into the hero text).

The sketch uses sample data and CDN fonts / icons for preview only. It is not application code.

# Phase 1 onboarding sketches

Screens: welcome, display name, create-or-join, create household, join with code (error / lockout), "הבית שלי" with one-time invite code. Built on DESIGN_SYSTEM.md v1.3.

| Option | File | Status |
|---|---|---|
| A | `onboarding-sketch-option-a.html` - dark welcome, light steps with progress bar, two choice cards | Not chosen |
| B | `onboarding-sketch-option-b.html` - all light, "step X of 3", radio cards, two-box code, lockout countdown | Not chosen |
| C | `onboarding-sketch-option-c.html` - persistent ink "household card" that fills in, two steps, ticket-style invite | **Approved by owner 2026-10-29** |

Index: `onboarding-sketches.html`. Sample data and CDN fonts / icons for preview only.
