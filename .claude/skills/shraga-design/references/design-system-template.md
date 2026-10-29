# shraga/DESIGN_SYSTEM.md - Template

Use this structure when generating `DESIGN_SYSTEM.md`. Fill every section with concrete, implementable values. Remove sections that are irrelevant to the product (e.g. Tables for a product with no tabular data). Mark any value that was not confirmed by the user as `(proposed)`.

---

```markdown
# Design System - <Product Name>

Version: 1.0
Last updated: <date>
Status: <Draft / Approved>

## 1. Design Goal
<2-3 sentences: the experience the interface should create and for whom.>

## 2. Visual Language
Attributes: <3-6 attributes, e.g. Minimal, Professional, Data-driven>
Personality: <1-2 sentences describing the overall feel>
Do: <3-4 short rules>
Don't: <3-4 short rules>

## 3. Color System

| Role | Token | HEX | Usage |
|---|---|---|---|
| Primary | --color-primary | #...... | Main CTAs, active states, key highlights |
| Primary hover | --color-primary-hover | #...... | Hover / pressed state of primary |
| Secondary | --color-secondary | #...... | Secondary actions, supporting accents |
| Accent (optional) | --color-accent | #...... | Rare emphasis only |
| Background | --color-bg | #...... | Page background |
| Surface | --color-surface | #...... | Cards, panels, modals |
| Text | --color-text | #...... | Primary text |
| Muted text | --color-text-muted | #...... | Secondary / helper text |
| Border | --color-border | #...... | Dividers, input borders |
| Success | --color-success | #...... | Confirmations, positive status |
| Warning | --color-warning | #...... | Caution, non-blocking issues |
| Error | --color-error | #...... | Errors, destructive actions |
| Info | --color-info | #...... | Neutral notices |

Dark mode: <Yes / No / Later phase>. If yes, provide a second table with the same tokens.
Contrast: all text / background pairs must meet WCAG AA (4.5:1 body, 3:1 large text and UI components).

## 4. Typography

Font families:
- Headings: <font>, fallback <stack>
- Body: <font>, fallback <stack>
- Hebrew (if relevant): <font supporting Hebrew, e.g. Heebo / Assistant / Rubik>
- Monospace (if relevant): <font>

| Style | Size (px / rem) | Weight | Line height | Usage |
|---|---|---|---|---|
| Display | | | | Hero headlines only |
| H1 | | | | Page title |
| H2 | | | | Section title |
| H3 | | | | Card / subsection title |
| Body L | | | | Lead paragraphs |
| Body | | | | Default text |
| Small | | | | Helper text, captions |
| Label | | | | Form labels, buttons |

Rules: max 2 font families; weight usage <e.g. 400 body, 500 labels, 700 headings>; max line length ~70 characters for body text.

## 5. Spacing & Layout

Base unit: 4px (or 8px).

| Token | Value |
|---|---|
| --space-1 | 4px |
| --space-2 | 8px |
| --space-3 | 12px |
| --space-4 | 16px |
| --space-6 | 24px |
| --space-8 | 32px |
| --space-12 | 48px |
| --space-16 | 64px |

Grid: <e.g. 12 columns desktop, 4 mobile>, max content width <e.g. 1200px>, page gutters <desktop / mobile>.

## 6. Radius & Elevation

| Token | Value | Usage |
|---|---|---|
| --radius-sm | | Inputs, tags |
| --radius-md | | Buttons, cards |
| --radius-lg | | Modals, large panels |
| --radius-full | 9999px | Pills, avatars |

Shadows: <define 2-3 levels max, e.g. sm for cards, md for dropdowns, lg for modals>.

## 7. Components

For each component define: variants, sizes, states (default, hover, focus, active, disabled, loading), and usage rules.

### Buttons
- Variants: Primary, Secondary, Ghost, Destructive
- Sizes: sm / md / lg with heights
- Rule: one primary button per view

### Inputs & Forms
- Label position, helper text, error message placement
- Validation: inline, on blur, with clear message text
- Required field indication

### Cards
### Tables (if relevant)
### Modals & Dialogs
### Dropdowns & Selects
### Tabs
### Navigation (top bar / sidebar / bottom nav on mobile)
### Notifications (toasts, banners, inline alerts)
### Tooltips
### Empty States
- Illustration or icon + one-line explanation + one primary action

## 8. Iconography
Library: <e.g. Lucide>. Style: <outline / filled>, stroke <width>, sizes <16 / 20 / 24>.
RTL: mirror directional icons (back, forward, chevrons); do not mirror logos, checkmarks, media controls.

## 9. Motion
Durations: <e.g. 150ms micro-interactions, 250ms panels>. Easing: <e.g. ease-out>.
Respect `prefers-reduced-motion`.

## 10. Responsive Behavior

| Breakpoint | Width | Behavior |
|---|---|---|
| Mobile | < 640px | |
| Tablet | 640-1024px | |
| Desktop | > 1024px | |

Specify: what stacks, collapses, hides, becomes scrollable, and how navigation changes.

## 11. Accessibility
- WCAG AA contrast
- Full keyboard navigation, visible focus ring (<spec>)
- Every input has a visible label
- Status never communicated by color alone
- Error messages are specific and announced to screen readers
- Minimum touch target 44x44px

## 12. RTL & Localization (if relevant)
- `dir="rtl"` at root; use logical CSS properties (margin-inline-start, etc.)
- Text alignment right by default
- Mixed Hebrew / English text handled with proper bidi isolation
- Numbers, dates and currency formatted per locale

## 13. UX Principles
<4-8 product-specific principles, each one line, e.g. "One clear primary action per screen".>

## 14. UI States
| Screen / Component | Empty | Loading | Success | Error |
|---|---|---|---|---|

## 15. Open Questions
<Only unresolved issues that materially affect the product.>
```
