# APEX — product and implementation plan

## Product direction

**APEX is a standalone, local-first agent workstation.** Its local edition runs on the user's computer and does not depend on Manus, an APEX-hosted service, another agent, or a managed database. The user can connect a cloud model API directly with their own credentials, or use a local model such as Ollama without an API key. Cloud model calls require network access and send the selected prompt/context to the chosen provider; local Ollama inference can work offline after the runtime and model are installed.

The product must be **downloadable and installable as a desktop application**, comparable in delivery form to Hermes Desktop—not merely a CLI or browser page. The first desktop packaging target will use a native application shell around APEX's local runtime; build configuration will target Windows, macOS, and Linux, with platform signing/notarization treated as release requirements rather than falsely implied. In addition, APEX will offer its CLI, local dashboard, and local API. It owns its agent loop and tools; it is not a chatbot shell, agent directory, or wrapper around another agent.

The owner wants broad capability coverage inspired by Manus and Manus Desktop/Cue, Kimi Work/Desktop, Hermes/Hermes Desktop, OpenClaw, Meta Muse, OpenAI Dots, Grok agents, and other systems, plus beneficial ideas of APEX's own. Translate this into independently real capabilities—coding, local files, browser/computer use, research, documents, app integrations, portable memory, automations, and specialist workflows. Do not claim literal parity or assume undocumented product APIs are available.

**Operating modes must be explicit:** standalone local APEX is the primary experience; the existing authenticated hosted dashboard is an optional separate deployment. Local Ollama does not need an API key. A cloud-model backend needs its provider's API key and internet, but does not need an APEX cloud account. The user chooses where inference happens and what data is sent.

Product names are distinct: **Muse is Meta's personal agent; OpenAI's announced always-on agent is Dots.** Product research informs UX and architecture; it does not create native integrations. The generic APEX Bridge v1 is a separate optional contract, not a native adapter for a named competitor.

**Brand:** APEX. Line: **“One agent. One engine. Every surface.”** Package/repository slug `apex-agent`. The owner selected the **MIT License**.

## First build milestone: downloadable local desktop and agent runtime

Deliver one coherent, installable local slice before attempting broad product parity:

1. Ship an Electron desktop shell that opens a native workspace-folder chooser, starts the APEX local runtime on a loopback-only ephemeral/fixed port, and opens the local React workbench in a hardened BrowserWindow (`contextIsolation`, no renderer Node access, same-origin local API). The app's default project root is the folder the owner selected in the native dialog; arbitrary browser requests cannot change it.
2. Add the `apex dashboard` service command for CLI-first use. It binds only to `127.0.0.1`, serves the same dashboard and same-origin local JSON API, and never starts Manus OAuth, managed MySQL, or a hosted APEX callback.
3. Refactor the existing local CLI agent loop into a callable local runtime so CLI and desktop/dashboard local runs use the same model/tool policy and run events rather than maintaining separate agent loops.
4. Store local preferences and run traces under the user's APEX config/data directory, using atomic writes and owner-only permissions. Persist model ID, endpoint, provider, and local mode. Encrypt a saved cloud API key with AES-256-GCM using a random 32-byte local key whose file and parent directory are owner-only. Never return the secret to the renderer after saving. Ollama needs no API key.
5. The local workbench displays the actual selected project root and configured model, lets the owner test/configure Ollama or an OpenAI-compatible cloud endpoint, submit a local task, inspect the resulting run and tool trace, and approve/reject each proposed file write with exact target path and full content visible. Do not enable shell from the desktop/browser in this milestone.
6. Configure reproducible Windows, macOS, and Linux desktop build targets; build a Linux installable artifact in the current environment where supported. Signed/notarized release assets require platform-specific credentials and public release infrastructure and must not be claimed until actually configured.
7. Keep the local HTTP surface restricted: no permissive CORS; validate local Host and same-origin requests; limit request bodies; do not bind to LAN/public interfaces. Cloud-provider endpoints are explicit user configuration. This is loopback isolation, not a sandbox; filesystem access is restricted to the selected project root in APEX's file tools, and no OS/container isolation is claimed.
8. Preserve the current hosted OAuth/MySQL application as a separate optional mode. A hosted Preview cannot reach the user's computer's localhost and must not pretend its local route is running when the local daemon is absent.
9. Organize the local desktop into separate work areas: **Agent**, **Code & Files**, **Create Game**, **Create Video**, **Browser & Computer**, **Research**, **Automations**, **Skills**, **Integrations**, **Models**, **Run History**, **Memory & Knowledge**, and **Assets & Files**. Give each section a truthful status (Available, Limited, CLI only, Hosted only, or Planned). Available sections must invoke real APEX behavior. Roadmap-only sections are informational, say what works now and what remains, and must not present fake buttons, model calls, integrations, or completed workflows.

This first desktop release is a foundation, not a clone of every competitor: it does not yet include general browser/computer-use control, unattended scheduling, a hardened shell sandbox, or all product integrations.

## Capability map and product gaps

Maintain [`docs/capability-gap-register.md`](docs/capability-gap-register.md) as the truthful inventory of what APEX has, what is incomplete, and what is planned. It covers desktop/window/workspace UX, CLI/TUI, file/terminal/code tools, browser and computer control, web research, documents and multimodal inputs, cloud/local model APIs, app/connectors/MCP/extensions/assets, persistent memory/context, durable automations, approvals/effect ledger, isolation/security, deployment/update/release, observability/recovery, and beneficial specialist workflows. Each capability must be implemented and individually described before it is advertised as available. Product research is inspiration, not evidence of APEX feature parity.

## Research-backed differentiation and product ideas

The product landscape in [`docs/agent-landscape.md`](docs/agent-landscape.md), the [desktop-agent review](docs/desktop-agent-review.md), the commissioned [`docs/product-ideas/`](docs/product-ideas/), and the [cloud provider compatibility review](docs/cloud-provider-compatibility-review.md) inform priorities rather than serve as marketing claims. The main design bet is **portable authority and verifiable execution**:

1. CLI, local dashboard, and desktop share one local runtime and policy contract; hosted mode is an explicit separate deployment.
2. A provider-neutral kernel exposes effective capabilities and visible routing rather than silently assuming tool support, privacy, cost, or cancellation.
3. Every attempt, permission, external data transfer, approval, result, and verification can become a portable event/effect record—not just transcript text.
4. Users can inspect, edit, export, and delete durable memory, artifacts, Skills, workflows, and traces; secrets remain excluded and require reauthorization on import.
5. Automation is restart-safe and idempotent, with retry/backoff, missed-run policy, cancellation, approvals, deadlines, and dead-letter recovery.
6. Optional agent bridges are scoped peers, with per-run egress consent, provenance, revocation, and inherited policy—not a way around APEX controls.
7. Filesystem/shell/browser actions are separated by capabilities and run inside a real OS/container boundary before they are offered to untrusted or multi-user jobs.
8. High-benefit vertical Skills include interview preparation: realistic mock practice and truthful, role-specific feedback; permitted/disclosed accessibility help; never covert answer delivery or fabricated work history.
9. Reliability tools include run replay, model/provider conformance checks, budgets, recovery/takeover, and measured success against verified state.
10. The UI is accessible and practical: terminal-first work, keyboard operation, reduced motion, screen-reader semantics, and clear setup/errors.

These are recommendations and roadmap items; they are not claims that the present preview is production grade.

## Experience and design

- **Movement:** technical editorial meets a disciplined CLI/workbench; deliberate typography, clear task hierarchy, and precise instrumentation—not a generic chatbot page or invented metrics dashboard.
- **Principles:** APEX is an agent in its own right; user-owned model/tools/data; observable real execution; human authority over external effects.
- **Color:** warm chalk and graphite support sustained reading; APEX acid-lime `#C9FA61` identifies focus and verified progress; amber/coral indicate pending approval or error and never carry meaning alone.
- **Layout:** a labeled workspace rail separates Agent, Create Game, Create Video and other capabilities; central task canvas; adjacent run trace and policy/approval context. Each capability shows an honest status. Terminal and dashboard routes share identifiers. Mobile collapses secondary context into drawers.
- **Motifs:** a converging-lanes `A` mark, real run/step identifiers, and distinct badges for model provider / APEX native tool / optional bridge / user-approved API Plugin.
- **Interaction:** submit a goal, review available capabilities, make per-run egress/delegation choices, watch only real provider/tool steps. Consequential effects require policy-backed approval. Missing provider/runtime stays explicitly unconfigured.
- **Motion:** 140–200 ms transitions; animate only genuine streaming or execution; respect reduced motion.
- **Typography:** Space Grotesk wordmark/headings, DM Sans interface, DM Mono IDs and traces.
- **Brand essence:** “An open, local-first agent workstation: your model, your machine, and clear evidence of what APEX did.” Personality: capable, candid, exact. Voice: “What should APEX take care of?” / “No local model is ready yet. Set up Ollama or choose a backend.”
- **Logo:** uppercase APEX and an asymmetric `A` made from converging execution lanes; not a default-font-only wordmark.

## Current implementation and constraints

Keep the initialized TypeScript stack for the hosted product: React/Vite, authenticated Express+tRPC, Drizzle, and MySQL. The hosted Preview still uses the Manus OAuth/session starter. Current hosted features include user-owned model profiles, AES-256-GCM credential helpers, DNS-pinned bounded outbound JSON, owner-scoped conversations/run history/memory/versioned virtual files, workflow drafts and manual Run once, a generic authenticated APEX Bridge v1, read-only tested GET API Plugins, and versioned instruction-only Skills. The hosted server task loop persists real model/tool traces and explicit blocked/error states.

`bin/apex.mjs` provides the local CLI/model setup and exports a callable local task loop; `bin/apex-dashboard.mjs` is a loopback-only daemon that uses that same loop for the local workbench and persists local traces/approvals. The Electron shell uses a native workspace chooser and loads the local workbench without hosted authentication. The dashboard exposes the Agent, model configuration, run history, exact file-write approvals, and 13 work-area sections, each labeled available/limited/CLI-only/hosted-only/planned. A Linux x64 AppImage was generated and smoke-opened under Xvfb through the native chooser and main window; it is unsigned, not tested on a real user machine, and unpublished. Windows/macOS build targets and a manual/tag-triggered GitHub Actions artifact workflow are present but those platform artifacts are not built here. Local CLI also supports owner-only Markdown Skills, including the interview practice starter. Its optional shell runs with the OS user's full permissions and is not sandboxed.

The new desktop/local daemon will use Electron, Node.js/Express, the existing React/Vite build, and Node built-ins. It adds no mandatory cloud service or local DB. Its local JSON store is a single-user convenience store, not a multi-user database or a transactional scheduler. Hosted mode keeps its own existing persistence and authentication. Model-provider API calls are made directly from the user's local runtime; provider retention/network terms remain the user's responsibility.

## Project structure

- `client/src/pages/` — hosted workbench, public Preview, and distinct local workbench page served by the standalone daemon/desktop shell.
- `client/src/lib/` — browser clients for the hosted tRPC API and local same-origin API; never keep provider secrets in renderer state after submit.
- `client/src/components/` — shared UI and Skills/Plugin/security panels.
- `desktop/` — Electron main process, secure preload, native folder chooser, app menu, and BrowserWindow policy.
- `bin/apex.mjs` — CLI entry point, local setup/project tools, and shared local agent loop exported for local daemon/desktop.
- `bin/apex-dashboard.mjs` — loopback-only local HTTP daemon, local configuration/secret storage, run/approval API, and built-asset serving.
- `server/agent/` and `server/providers/` — hosted/database-backed engine, tools, provider profiles, encryption, and safe HTTP; do not import hosted DB/auth into standalone mode.
- `drizzle/` — optional hosted-mode MySQL schema and additive migrations only.
- `docs/` — product landscape, desktop review, provider contract review, capability gaps, roadmap, threat model, local workstation, CLI, bridge, contribution, and security guides.

## Delivery phases

1. **Downloadable desktop foundation:** shared local runtime; local model configuration and optional encrypted cloud key; local dashboard/run/trace/write approvals; hardened Electron shell and native folder picker; Linux AppImage and reproducible Windows/macOS/Linux build targets. Build and launch-test all OS artifacts before calling the downloads release-ready.
2. **Local workstation completeness:** persistent local sessions/history, local Skills management, provider capability/conformance tests, workspace tabs/project switching, update/signing/release automation, and installation that does not require a source checkout.
3. **Capability expansion:** approval-backed browser and computer-use tools, real isolated runner, audited extensions/assets/MCP ecosystem, app integrations, robust automations, pause/resume/cancel/replay, multimodal inputs, and portable export/backup.
4. **Broader operation:** accessible CLI/TUI, signed native installers and update channels, OS-specific permission grants, optional self-hosted/team deployments, and integration adapters only for documented stable public contracts.

The public GitHub repository is still a separate requested handoff. Do not label the current private/Manus project remote, the local Preview, or an unrecorded source state as a public GitHub release. Follow the supported user-controlled repository flow; do not bypass a declined connector request.
