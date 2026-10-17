# APEX — product and implementation plan

## Product direction

**APEX is an open-source, local-first agent workstation.** It is its own agent—not a chatbot shell or directory—and aims for one portable execution and policy contract across its CLI, dashboard, API, and future desktop app. A native desktop app and permissioned computer/browser operation are part of the goal, but are not yet delivered.

The owner wants APEX to bring together useful workflows associated with Manus and Manus Desktop/Cue, Kimi Work/Desktop, Hermes/Hermes Desktop, OpenClaw, Meta Muse, OpenAI Dots, Grok agents, and other systems, plus beneficial ideas of APEX's own. Translate that broad ambition into capabilities—coding, local files, research, browser/computer use, documents, app integrations, portable memory, automations, and specialist workflows. Do not claim literal parity, rely on undocumented interfaces, or describe roadmap work as already implemented.

APEX starts locally. `apex setup` guides the user through Ollama and a tool-capable model without an APEX server, hosted-model account, or provider API key. Current setup asks before a multi-gigabyte model download and does not install Ollama itself. Hosted APIs and compatible private/server backends remain optional; the user controls the model, execution location, tools, and data destinations. APEX should remain useful without agent bridges.

Product names are distinct: **Muse is Meta's personal agent; OpenAI's announced always-on agent is Dots.** The official Kimi Work, Hermes Desktop, Manus Desktop, Meta Muse, and OpenAI Dots pages inform UX and architecture decisions; they do not document a stable third-party control API for APEX to invoke. The generic APEX Bridge v1 is a separate contract, not a native adapter for any named product.

**Brand:** APEX. Line: **“One agent. One engine. Every surface.”** Package/repository slug `apex-agent`. The owner selected the **MIT License**.

## Research-backed differentiation and product ideas

The product landscape in [`docs/agent-landscape.md`](docs/agent-landscape.md), the new [desktop-agent review](docs/desktop-agent-review.md), and the opportunity reports in [`docs/product-ideas/`](docs/product-ideas/) are used to improve APEX, not merely list competitors. The most important design bet is **portable authority and verifiable execution**:

1. The CLI, dashboard, and API share the same policy and run engine; local mode is clearly separated from remote mode.
2. A provider-neutral kernel exposes effective capabilities and visible routing rather than silently assuming tool support, privacy, cost, or cancellation.
3. Every attempt, permission, external data transfer, approval, result, and verification can become a portable event/effect record—not just transcript text.
4. Users can inspect, edit, export, and delete durable memory, artifacts, Skills, workflows, and traces; secrets remain excluded and require reauthorization on import.
5. Automation is restart-safe and idempotent, with retry/backoff, missed-run policy, cancellation, approvals, deadlines, and dead-letter recovery.
6. Optional agent bridges are scoped peers, with per-run egress consent, provenance, revocation, and inherited policy—not a way around APEX controls.
7. Filesystem/shell/browser actions are separated by capabilities and run inside a real OS/container boundary before they are offered to untrusted or multi-user jobs.
8. High-benefit vertical Skills include interview preparation: realistic mock practice and truthful, role-specific feedback; permitted/disclosed accessibility help; never covert answer delivery or fabricated work history.
9. Reliability tools include run replay, model/provider conformance checks, budgets, recovery/takeover, and measured success against verified state.
10. The UI is accessible and practical: terminal-first work, keyboard operation, reduced motion, screen-reader semantics, and clear setup/errors.

These are recommendations and roadmap items; they are not claims that the present preview is already production grade. See [`docs/product-ideas.md`](docs/product-ideas.md), [`docs/desktop-agent-review.md`](docs/desktop-agent-review.md), and [`docs/roadmap.md`](docs/roadmap.md).

## Experience and design

- **Movement:** technical editorial meets a disciplined CLI/workbench; deliberate typography, clear task hierarchy, and precise instrumentation—not a generic chatbot page or invented metrics dashboard.
- **Principles:** APEX is an agent in its own right; user-owned model/tools/data; observable real execution; human authority over external effects.
- **Color:** warm chalk and graphite support sustained reading; APEX acid-lime `#C9FA61` identifies focus and verified progress; amber/coral indicate pending approval or error and never carry meaning alone.
- **Layout:** compact workspace rail; central task/chat canvas; adjacent run trace and policy/approval context. Terminal and dashboard routes share identifiers. Mobile collapses secondary context into drawers.
- **Motifs:** a converging-lanes `A` mark, real run/step identifiers, and distinct badges for model provider / APEX native tool / optional bridge / user-approved API Plugin.
- **Interaction:** submit a goal, review available capabilities, make per-run egress/delegation choices, watch only real provider/tool steps. Consequential effects require policy-backed approval. Missing provider/runtime stays explicitly unconfigured.
- **Motion:** 140–200 ms transitions; animate only genuine streaming or execution; respect reduced motion.
- **Typography:** Space Grotesk wordmark/headings, DM Sans interface, DM Mono IDs and traces.
- **Brand essence:** “An open, local-first agent workstation: your model, your machine, and clear evidence of what APEX did.” Personality: capable, candid, exact. Voice: “What should APEX take care of?” / “No local model is ready yet. Set up Ollama or choose a backend.”
- **Logo:** uppercase APEX and an asymmetric `A` made from converging execution lanes; not a default-font-only wordmark.

## Current implementation

Keep the initialized TypeScript stack: React/Vite, authenticated Express+tRPC, Drizzle, and MySQL. The hosted web Preview still uses the Manus OAuth/session starter. The server task loop accepts a persisted user task, selects a live-tested model profile, calls an OpenAI-compatible chat-completions backend, validates tool requests, applies per-run consent, executes real APEX tools or optional bridge/API Plugin, returns real results, and persists run/step records or explicit blocked/error state.

Current source includes user-owned model profiles, AES-256-GCM credential helpers, DNS-pinned bounded outbound JSON, owner-scoped conversations/run history/memory/versioned virtual files, workflow drafts and real manual `Run once`, a generic authenticated APEX Bridge v1, read-only tested GET API Plugins, and versioned instruction-only Skills. The remote CLI uses one-time personal tokens stored hashed server-side; the local CLI has project-root file tools, secret exclusions and symlink rejection, write confirmation, and opt-in per-command shell confirmation. The UI includes an Interview Practice Coach starter, plus a security panel that explicitly states shell is not sandboxed.

The local CLI first-run setup detects Ollama and an installed compatible model; if no suitable model is present it recommends `qwen3.5:4b`, discloses the approximate download size, and asks before pulling it. It does not require a provider key or hosted APEX login. The current tool loop is bounded; file writes require confirmation by default; shell is opt-in but executes with the operating-system user's permissions and is not an OS sandbox. A standalone npm package and native desktop installer are not yet available.

The hosted dashboard, API, and remote CLI currently share the server agent loop. The local CLI runs a distinct standalone bounded loop with its own local-tool surface. A local daemon that serves the dashboard/API against Ollama without the hosted database/login is not yet implemented. Treat converging these execution paths on a common policy, capability, approval, and trace contract as foundational workstation work; do not imply full runtime parity yet.

For API-key storage, the operator must set a 32-byte `APEX_ENCRYPTION_KEY`. Private/local endpoints are blocked by default and require explicit trusted-self-host opt-in. A cloud Preview cannot reach the owner's desktop `localhost`. User prompts and selected history are sent to the configured model provider; the operator remains responsible for provider retention/training terms and endpoint trust.

## Not yet delivered — do not overclaim

This first cut is not a full desktop or unattended computer operator. It lacks a local dashboard daemon, native desktop packaging, general browser/mouse/keyboard control, a hardened isolated runner for shell/browser/code execution, durable schedule/webhook workers, complete typed approval and pause/resume, an append-only effect ledger, cancellation across in-flight effects, provider conformance/fallbacks, provider-independent cost accounting, native named-product adapters, signed extension bundles, and portable hosted authentication independent of the Manus OAuth starter. The APEX Bridge v1 connects only to a peer implementing its generic contract. The official Meta Muse and OpenAI Dots pages do not document a stable public control API for APEX to use.

## Project structure

- `client/src/pages/` — authenticated task workbench, model/bridge setup, Skills, Plugins, CLI token settings, automations, runs, workspace, approvals, and settings.
- `client/src/components/` — shared UI plus CLI, Skill, Plugin, and security panels.
- `client/src/lib/` — typed tRPC client and browser-safe helpers; no provider credentials or direct model calls.
- `server/providers/` — user-chosen model profiles, OpenAI-compatible inference, cryptography, DNS-pinned safe HTTP.
- `server/bridges/` — optional APEX Bridge v1 peer health and scoped delegation.
- `server/agent/` — own model/tool loop, native tools, APIs, Skills, read-only Plugins, workflow and user data services.
- `bin/apex.mjs` — terminal client for remote shared-engine and local project-scoped work.
- `drizzle/` — owner-scoped MySQL tables and additive migrations.
- `docs/` — product landscape and desktop-agent review, opportunity research, strategy, roadmap, threat model, CLI, bridge, contribution, and security guides.

## Open-source/GitHub handoff

The MIT License is selected and recorded in `LICENSE`. The owner requested a public GitHub project. That public source release has not been completed; do not present this local workspace, hosted Preview, or a private remote as public open-source publication. Preserve the intended source and accepted project history for the eventual public handoff. Keep source-code publication separate from website deployment.
