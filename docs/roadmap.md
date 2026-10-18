# APEX capability roadmap

This roadmap builds on the [agent landscape review](agent-landscape.md), the [desktop-agent review](desktop-agent-review.md), the [capability-gap register](capability-gap-register.md), and the ongoing independent opportunity reports in [`product-ideas/`](product-ideas/). The research separates **documented behavior**, **evidence gaps**, and **APEX recommendations**; a limitation in one product is not assumed to apply to all. Product acceptance clauses live in [`../TODO.md`](../TODO.md).

## Product direction

APEX is an independent, provider-neutral, local-first **agent workstation**, not a chatbot shell or agent directory. It has its own task loop and native capabilities. The product must be downloadable and installable as a desktop app (Windows, macOS, Linux targets) as well as usable through CLI, local dashboard, and API; a browser-only Preview is not the delivery goal. APEX must work without other agent products, an APEX-hosted service, or bridges. Optional verified peers can add capabilities under explicit consent and scoped authority, but they do not replace APEX's core. The user wants broad capability coverage inspired by Manus/Desktop/Cue, Kimi Work/Desktop, Hermes Desktop, OpenClaw, Meta Muse, OpenAI Dots, Grok agents, and others; those systems are references, not evidence of an APEX integration.

The principal product bet is **portable authority and verifiable execution**, not a larger list of tools. Model, runtime, tool, bridge, channel, and deployment are replaceable dimensions. One policy plane should mediate credentials, tools, data egress, approvals, execution budgets, and delegation. Users should be able to inspect, export, migrate, and delete their memory, artifacts, workflows, and traces.

## Delivery sequence for the broad workstation goal

1. **Downloadable desktop foundation:** package APEX Desktop with a native workspace-folder chooser and local app window. Launch its local runtime on loopback; do not require an APEX account, hosted DB, or other agent. Configure reproducible Windows/macOS/Linux builds; add signing/notarization and public release automation before calling downloads official releases.
2. **Local-first start and one local engine:** make Ollama onboarding usable from CLI and desktop with no model key or hosted APEX service; permit direct user-selected cloud API keys when requested. Share local task/policy/approval/trace logic across CLI and desktop/dashboard. Keep hosted mode clearly separate.
3. **Workstation and tool coverage:** use the [capability-gap register](capability-gap-register.md) to build project/session tabs, durable local context, files, terminal/code execution, browser/computer use, research, document/multimodal tools, integrations/MCP, and reviewed extensions. Give the desktop distinct **Agent**, **Code & Files**, **Create Game**, **Create Video**, **Browser & Computer**, **Research**, **Automations**, **Skills**, **Integrations**, **Models**, **Run History**, **Memory & Knowledge**, and **Assets & Files** work areas. Keep status visible and implement each function behind its section; never treat a tab or mock panel as feature completion.
4. **Safe computer-use gate:** allow local browser/files/apps or an isolated cloud computer only after real isolation, scoped grants, bounded network/credential access, interruptibility, action-specific approval, and receipts are in place.
5. **Durable context, automation, and effects:** make memory, workflows, approvals, artifacts, and effect history portable and reviewable; accurately distinguish planned, attempted, completed, and verified effects. Add restart-safe scheduling, retries, channels, and connectors only after recovery conditions are met.
6. **Open releases and reliability:** publish reproducible, signed/checksummed desktop installers, CLI distribution, update paths, diagnostics, and accessible operation through user-controlled project releases; measure recovery, false completion, and verified task success.

The current priority sections describe the engineering foundations for that sequence. They are not a claim that APEX already contains the target feature set.

## Priority 0 — Trust and portable contracts

- Publish and maintain a threat model with explicit trust boundaries and residual risks.
- Version model, tool, run-event, policy, approval, memory, artifact, workflow, extension, CLI, and bridge contracts.
- Keep stable run IDs and typed traces consistent across CLI, dashboard, API, manual workflow, scheduled and delegated surfaces.
- Keep secrets encrypted at rest; exclude their values from prompts, traces, exports, and client responses.
- Add provider conformance checks for actual tool calling, streaming, vision, structured output, cancellation, and reported usage rather than assuming support.

**Exit condition:** an operator can inspect a run from request through chosen model, tools, policy decisions, outputs, and final state.

## Priority 1 — Durable runs and controlled effects

- Evolve the current trace into an append-only effect ledger with parent/child IDs, retry/fallback facts, provider/model, data destinations, artifact hashes, approvals, budgets, and receipts.
- Distinguish attempted, confirmed, and independently verified results. Never report external success solely from model text.
- Add typed approvals bound to exact action arguments, user, policy version, expiry, and expected side effect; support real pause/resume and reject-stop behavior.
- Make “what tool can run” separate from “what data may leave.” Per-run consent must reset after the run.
- Add deterministic dry runs, explainable allow/deny outcomes, expiring credentials, cancellation, and an emergency stop.

**Exit condition:** the user can see why an action was allowed, what crossed which boundary, and how to revoke or verify the effect.

## Priority 2 — Portable, user-governed context

- Keep conversation, task state, durable memory, Skills, artifacts, approvals, and effects as distinct data categories.
- Record memory provenance, author, confidence, scope, expiry, supersession, review, and retention; require explicit promotion of external content into durable memory.
- Support owner inspection, correction, export, delete, and migration for memories, runs, files, policies, and artifacts.
- Add redacted “task capsule” export/import that preserves context and policy but marks credentials requiring reauthorization.

**Exit condition:** changing provider, server, device, or CLI/dashboard surface preserves user-approved state without widening permissions.

## Priority 3 — Reliable automations

- Build schedule and webhook workers with leases, idempotency, retry classes/backoff, timezone handling, missed-run policy, deadlines, approval waits, cancellation, and dead-letter recovery.
- Persist trigger deliveries and receipts; let the owner choose resume-current-run versus create-new-run.
- Allow deterministic no-model jobs where inference is unnecessary.
- Add compensation hooks and post-run external-state verification before marking automation successful.

**Exit condition:** runs survive restarts and can be safely retried, canceled, reviewed, and recovered.

## Priority 4 — Safe capabilities and extension ecosystem

- Evolve current instruction-only Skills into inspectable manifests with preconditions, expected artifacts, test cases, provenance, and risk. Do not turn Skills into executable code without isolation.
- Evolve read-only Plugins into capability-scoped extensions with fixed network targets, data classes, and user review.
- Expand APEX Bridge v1 with capability discovery, budgets, deadlines, cancellation, typed artifacts, provenance, approval inheritance, and revocation.
- Build native adapters only from verified upstream protocols; never mark a candidate as connected without a real check. The product pages reviewed for Meta Muse and OpenAI Dots do not document a stable external-control API for APEX; do not claim native adapters.
- Add extension signatures/pinning, capability-diff review, static checks, disposable testing, and quarantine for untrusted bundles; mediate MCP/ACP/A2A through the APEX policy plane.

**Exit condition:** a peer or extension connects without implicit host access or lost provenance.

## Priority 5 — Isolated computer-use and human workflows

- Add a short-lived OS/container-isolated runner with resource bounds, host-home exclusion, no inherited credentials, blocked-by-default network egress, and auditable receipts before enabling arbitrary shell, browser, code, or untrusted-repository work.
- Add browser automation only with user-visible plans, exact-domain/network limits, and explicit confirmation for important external changes.
- Grow interview assistance as a practice coach: realistic role-specific mock interviews, truthful feedback based on the user's real experience, pacing, and disclosed/accessibility support when permitted. Do not build covert answer feeding or impersonation.
- Measure outcomes through repeatable practice and verified task completion, not unsupported accuracy claims.

**Exit condition:** user-authorized computer tasks are isolated, inspectable, interruptible, and recoverable.

## Priority 6 — Open operation and broader surfaces

- Offer documented local, private-server, hybrid, isolated-container, and (where safe) air-gapped deployment profiles with clear operator responsibilities.
- The hosted dashboard, personal-token API, and remote CLI use the hosted server loop. The standalone local CLI and local dashboard share a separate callable local loop; hosted and local deployment loops are still distinct. Next normalize policy/event contracts, add streaming/resumable events, and build a full-screen TUI without duplicating local behavior.
- Expand keyboard, screen-reader, reduced-motion, accessibility, and device hand-off support.
- Publish signed/reproducible releases, contribution governance, vulnerability response, and dependency/extension license inventories.
- Evaluate verified external-state success, false completion, recovery time, unsafe-action rate, latency, model cost, and user interventions.

## Current boundary

The current implementation has a bounded hosted server loop, remote CLI, and optional hosted OAuth/MySQL product; the local CLI and local loopback dashboard share a callable, separate local task loop. The local desktop shell, native project picker, model controls, local traces, exact write approvals, and labeled work-area navigation are present in source. A Linux AppImage was generated and smoke-opened under Xvfb through the workspace chooser and main window; it is unsigned, not tested on a real user machine, and not a public release. Windows/macOS targets need their own build/test and release process. The user still must install Ollama, and a published npm package is not ready. **Game/video creation, general browser/mouse/keyboard control, autonomous research tools, durable local scheduling, the complete effect ledger, typed pause/resume, broad local app/MCP integrations, OS-isolated execution, model failover/conformance, full TUI/streaming, and portable self-host authentication remain gaps.** See the [README](../README.md), [desktop-agent review](desktop-agent-review.md), [capability-gap register](capability-gap-register.md), and [threat model](threat-model.md) before using APEX operationally.
