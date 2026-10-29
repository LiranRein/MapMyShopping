# Phase Prompt Template (Claude Code build session)

English. Short (15-40 lines). Scoped to one phase. The repo holds the documents, so the prompt points to them instead of repeating them. The first line must be exactly `# Shraga Phase Prompt - Phase <N>`: that is how `CLAUDE.md` recognizes a build session.

---

## Phase prompt

```
# Shraga Phase Prompt - Phase <N>: <name>

You are a build session in the Shraga harness. Follow the "Build session rules" in CLAUDE.md.

Context: read shraga/PHASE.md (must be PHASE=<N>), shraga/Plan.md, shraga/project-arch-plan.md[, shraga/DESIGN_SYSTEM.md][, shraga/phase-<N>-plan.md] before doing anything.

Task: implement Phase <N> - <name> exactly as defined in <shraga/Plan.md | shraga/phase-<N>-plan.md>.

Scope:
- <3-6 bullets: what to build>

Do NOT:
- build anything from later phases
- change the stack, data model or folder structure beyond what the plan defines
- edit CLAUDE.md or anything in shraga/ except your report
If the plan cannot be followed as written, stop and ask me before continuing.

Security requirements for this phase:
- <3-5 lines from shraga-security snippets>

Testing requirements for this phase:
- <3-5 lines from shraga-qa snippets>

When done:
1. Run the full test suite and lint.
2. Write shraga/reports/phase-<N>-report.md using .claude/skills/shraga/assets/phase-report-template.md.
3. Run /shraga-review. If Rejected, fix only what it lists, update the report and run it again (max 2 rounds).
4. Tell me in Hebrew what the verdict was and what to do next.
```

Phase 0 additionally includes in Scope: "Create .claude/rules/project.md with the stack, the exact run / test / lint commands and code conventions."

---

## Correction prompt (after 2 rejected rounds or a plan change)

Save as `shraga/prompts/phase-<N>-fix-<K>.md`.

```
# Shraga Phase Prompt - Phase <N>: corrections <K>

You are a build session in the Shraga harness. Follow the "Build session rules" in CLAUDE.md.

Read shraga/reviews/phase-<N>-review.md[ and the updated shraga/<doc>].

Fix exactly these items, nothing else:
1. <imperative correction>
2. <imperative correction>

Then run the tests and lint, update shraga/reports/phase-<N>-report.md, and run /shraga-review.
```

---

## One Shot (max 50 lines)

```
# Shraga Phase Prompt - One Shot

Build <app> - <one-line description> - for <users>.
Stack: <...>
Core features: <5-8 bullets>
Data model: <entities + access rule per entity>
Design: <visual direction + 5 key tokens>
Security (mandatory): secrets server-side only; access control on every table; server-side validation; AI calls via server function with rate limits
Quality: empty / loading / error states; input validation; tests for the core flow; run them and show the output
Out of scope: <list>
When done, write shraga/reports/phase-0-report.md using .claude/skills/shraga/assets/phase-report-template.md and run /shraga-review.
```

Tell the user in Hebrew: One Shot is fast for a demo, risky for anything with real users - offer to continue with phases from here.

---

## Paste instructions (Hebrew, after every prompt)

- Phase prompt: "העתיקו את הפרומפט ← פתחו סשן חדש של Claude Code באותה תיקייה ← הדביקו. כשהבודק מאשר - חזרו לסשן הזה וכתבו 'סיימתי'."
- Correction prompt: "העתיקו והדביקו בסשן הבנייה של פאזה <N> (או בסשן חדש). כשהבודק מאשר - חזרו לכאן וכתבו 'סיימתי'."
