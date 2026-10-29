# Shraga Phase Prompt - Phase 0: corrections 1

You are a build session in the Shraga harness. Follow the "Build session rules" in CLAUDE.md.

Read shraga/PHASE.md (must be PHASE=0), shraga/reviews/phase-0-review.md, .claude/rules/project.md and the updated shraga/DESIGN_SYSTEM.md (v1.2, Foodnoms direction - read its "Reference mapping" and change log). The owner rejected the look of the Phase 0 shell; v1.2 replaces the visual system.

Fix exactly these items, nothing else:
1. Update src/presentation/styles/tokens.css to every token in DESIGN_SYSTEM.md v1.2 (all --color-* and --tint-* incl. the six --color-area-* pairs, --space-5, radius 14 / 26 / 32 / full, the single dialog shadow, type scale). Remove tokens that v1.2 no longer defines.
2. Rebuild the home shell per v1.2: white top bar with the two-tone H1 "הרשימה של הבית" (brand orange on "הבית") and round search / settings icon buttons (disabled); Fog summary card (placeholder count 0, progress ring hidden, primary graphite "לרשימה" button disabled); 2x2 Fog navigation cards with area-colored icon squares; bottom navigation with 4 items (בית active, others disabled placeholders). Flat surfaces, no shadows. All strings in src/locale/he.js.
3. Import only the Hebrew and Latin Rubik subsets (closes review V6).
4. Redeploy to Vercel production the same way as fix round 1 and verify the served page.

Do NOT build any screen, data or behavior behind the placeholders; no Supabase calls. Do not edit anything in shraga/ except your report.

Testing:
- Keep the token parity test passing against v1.2; add unit tests that the two-tone title, summary card, 4 grid cards and a `<nav>` with 4 items and `aria-current="page"` on בית render.
- Run lint, format check, tests and build; record output and a mobile-viewport (375x812) screenshot description in the report.

Then update shraga/reports/phase-0-report.md (add fix round 2 with evidence) and run /shraga-review.
