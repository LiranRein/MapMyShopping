# ADR 0009 - Hebrew speech recognition

Status: Unvalidated - decision recorded; Hebrew recognition quality and availability on target devices need the owner's manual device check (see `docs/speech-feasibility.md`).
PRD question: 13.7 Risks: R5

## Context

Voice dictation is a Phase 5 feature. It depends on the browser's Web Speech API, which is not Baseline and is processed differently per browser.

## Options

- Browser Web Speech API with feature detection and manual fallback. No cost, no keys; availability and privacy depend on the browser vendor.
- Server-side speech-to-text (cloud API via Edge Function). Consistent quality; adds cost, an API key, audio upload and a PRD change (no AI / third-party processing in MVP). Rejected for MVP.
- On-device only (`processLocally = true`). Only desktop Chrome / Edge 139+ support it (not Chrome Android, not Safari). Cannot be the main path on mobile.

## Decision

- Use `window.SpeechRecognition || window.webkitSpeechRecognition` with feature detection; `lang = 'he-IL'`, `interimResults = true`, `continuous = false`.
- Treat the API as possibly cloud-processed on every browser: show a one-time privacy notice before the first mic use ("speech is processed by your browser's provider"), require explicit mic permission.
- Where `SpeechRecognition.available` exists, check `he-IL` availability first; do not force `processLocally`.
- Always offer manual entry; on `not-allowed`, `service-not-allowed`, `language-not-supported`, `network` errors show the "voice unavailable" state (DESIGN_SYSTEM section 14) and keep the typed path.
- Recognized text always goes to the review screen; nothing is committed without confirmation (PRD 10.1, success criterion "0 voice items added without confirmation").

## Consequences

- Voice is an enhancement, never a dependency.
- `vercel.json` sets `Permissions-Policy: microphone=(self)`.
