# OWASP Top 10 for Agentic Applications - Vibe-Coding Mapping

Baseline version: OWASP Top 10 for Agentic Applications (genai.owasp.org), published 2025-12-09. Last verified: 2026-10-14.
Related: OWASP Agent Control Standard (ACS), v0.1 as of 2026 - treat as a design reference, not a deployable control.
Run the Freshness Protocol before relying on this file for a PRD.

Apply when the product includes agents that call tools, use MCP servers, act autonomously, keep memory, or coordinate with other agents.

## Guiding principles

- **Least agency** - only the autonomy, tools and permissions the task needs.
- **Retrieved content and memory are untrusted** - including the agent's own stored memory.
- **Per-agent, short-lived identity** - actions attributable and revocable.
- **Contain the blast radius** - isolate agents and environments.
- **Human in the loop for sensitive actions** - approval based on the raw action, not the agent's summary.
- **Monitor continuously** - inventory of tools / models / data, behavior baselines, a working kill switch.

---

| ID | Risk | In practice | Required controls |
|---|---|---|---|
| ASI01 | Agent Goal Hijack | Content the agent reads (email, doc, web page) redirects its objective | Isolate retrieved content from instructions; constrain allowed actions; human confirmation for sensitive actions |
| ASI02 | Tool Misuse & Exploitation | Legitimate tools used harmfully, or safe tools chained into unsafe sequences | Scope each tool to the minimum; validate parameters and check policy on every call |
| ASI03 | Identity & Privilege Abuse | Shared or long-lived broad credentials turn one hijack into a major breach | Own identity per agent; short-lived, task-scoped credentials; regular permission review |
| ASI04 | Agentic Supply Chain Vulnerabilities | Compromised frameworks, MCP servers, tools or prompts, including components loaded at runtime | Inventory of agent components; verified sources; advisory monitoring; no runtime installs without approval |
| ASI05 | Unexpected Code Execution | Natural language or untrusted strings reach interpreters or shells | Sandboxed execution with least privilege; no network by default; parameterized APIs instead of raw shell |
| ASI06 | Memory & Context Poisoning | False or malicious data written to memory steers later sessions | Validate memory writes; ephemeral context by default; memory scoped per user and task; ability to inspect and flush |
| ASI07 | Insecure Inter-Agent Communication | Spoofed, tampered or replayed messages between agents | Mutual authentication; signed messages; allowlisted delegation paths; monitored traffic |
| ASI08 | Cascading Failures | One error or compromise spreads through every workflow that trusts the agent | Isolation between agents and environments; circuit breakers; separate dev and prod access |
| ASI09 | Human-Agent Trust Exploitation | Persuasive agent summaries lead humans to approve unsafe actions | Show the raw action at confirmation; log what was shown vs what ran; neutral framing |
| ASI10 | Rogue Agents | Agent acts outside policy (compromise, misalignment, drift) while looking legitimate | Behavioral baselines and alerts; owner and expiry per agent; sandbox by default; tested kill switch |

---

## Proportionality for typical LetsAI-style products

- **Single assistant with read-only tools** (search, read DB): ASI01, ASI02, ASI06 mainly.
- **Assistant that writes, sends or pays**: add ASI03, ASI09 - confirmation step is mandatory.
- **Agents that run code or shell**: ASI05 is Critical without a sandbox.
- **Multi-agent systems**: add ASI07, ASI08, ASI10.

## Quick checklist (agent phases)

- [ ] List of every tool the agent can call, with permission scope
- [ ] Write / send / pay / delete actions require human confirmation showing the raw action
- [ ] Credentials scoped per agent and per task, short-lived where possible
- [ ] Retrieved content and memory treated as untrusted; memory scoped per user
- [ ] No code execution outside a sandbox
- [ ] MCP servers and plugins vetted and inventoried
- [ ] Logs of every tool call; kill switch defined
