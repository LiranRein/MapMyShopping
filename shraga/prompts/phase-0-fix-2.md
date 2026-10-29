# Shraga Phase Prompt - Phase 0: corrections 2

You are a build session in the Shraga harness. Follow the "Build session rules" in CLAUDE.md.

Read shraga/PHASE.md (must be PHASE=0), shraga/reviews/phase-0-review.md, .claude/rules/project.md, shraga/DESIGN_SYSTEM.md v1.3 (change log row 1.3), docs/design/README.md and docs/design/home-sketch-option-3.html with option-3-top.jpg / option-3-bottom.jpg. The owner rejected the v1.2 shell and approved sketch option 3; v1.3 is the baseline. Where the sketch and DESIGN_SYSTEM.md differ, DESIGN_SYSTEM.md wins (e.g. body-size muted text uses --color-text-muted #646E69).

Fix exactly these items, nothing else:
1. Rewrite src/presentation/styles/tokens.css to every token in DESIGN_SYSTEM.md v1.3 (all --color-* rows, --space-*, radius 12 / 18 / 20 / 24 / 28 / full, the single nav shadow, type scale). Remove tokens v1.3 no longer defines.
2. Rebuild the home shell to match the sketch with static placeholder data only: date eyebrow (static string) + H1 "הרשימה של הבית" + round search / settings buttons; ink hero card with lime progress ring "5/12 נאספו", "הקנייה הבאה", "12 פריטים ב-4 אזורים", "7 נותרו לאסוף", sync line and the lime "יוצאים לקנות" CTA with arrow square; "המסלול בחנות" card with 4 sample stops (first done) and "עריכת סדר" link; "קיצורים" with 3 tiles (הוספה קולית, מועדפים, קטלוג); floating bottom nav (בית active, רשימה, center add, מועדפים, הבית שלי). Every button, link and nav item other than בית is disabled or inert. No "חדשים היום" / "בני בית" stats. Placeholder data lives in one clearly named module; all strings in src/locale/he.js. Icons from lucide-preact (no CDN).
3. Keep Rubik (no font change), self-hosted, Hebrew + Latin subsets only.
4. Redeploy to Vercel production the same way as fix round 1 and verify the served page.

Do NOT add data loading, Supabase calls, routing or any behavior behind the placeholders. Do not edit anything in shraga/ or docs/design/ except your report.

Testing:
- Keep the token parity test passing against v1.3.
- Update the home unit tests: title, hero section with ring text equivalent ("5 מתוך 12 נאספו") and "7 נותרו לאסוף", 4 route stops, 3 shortcut tiles, `<nav aria-label="ניווט ראשי">` with בית `aria-current="page"` and a center button labelled "הוספת פריט"; assert the dropped stats are absent.
- Run lint, format check, tests and build; record output and a side-by-side comparison of the deployed page (375x812) against option-3-top.jpg / option-3-bottom.jpg in the report, listing any visible differences.

Then update shraga/reports/phase-0-report.md (add fix round 3 with evidence) and run /shraga-review.
