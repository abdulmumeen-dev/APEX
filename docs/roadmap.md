# APEX capability roadmap

This roadmap builds on the [agent landscape review](agent-landscape.md), the [desktop-agent review](desktop-agent-review.md), and the ongoing independent opportunity reports in [`product-ideas/`](product-ideas/). The research separates **documented behavior**, **evidence gaps**, and **APEX recommendations**; a limitation in one product is not assumed to apply to all. Product acceptance clauses live in [`../TODO.md`](../TODO.md).

## Product direction

APEX is an independent, provider-neutral, local-first **agent workstation**, not a chatbot shell or agent directory. It has its own task loop and native capabilities; the CLI, web workbench, and API share that engine, and a native desktop app is a stated product goal. APEX must work without other agent products or bridges. Optional verified peers can add capabilities under explicit consent and scoped authority, but they do not replace APEX's core. The user wants broad capability coverage inspired by Manus/Desktop/Cue, Kimi Work/Desktop, Hermes Desktop, OpenClaw, Meta Muse, OpenAI Dots, Grok agents, and others; those systems are references, not evidence of an APEX integration.

The principal product bet is **portable authority and verifiable execution**, not a larger list of tools. Model, runtime, tool, bridge, channel, and deployment are replaceable dimensions. One policy plane should mediate credentials, tools, data egress, approvals, execution budgets, and delegation. Users should be able to inspect, export, migrate, and delete their memory, artifacts, workflows, and traces.

## Delivery sequence for the broad workstation goal

1. **Local-first start:** make the existing CLI setup approachable with Ollama, a tool-capable local model, a truthful first-run status, and no provider API key or hosted APEX account. Add a local daemon that serves the dashboard/API against the user's local model and approved workspace without requiring the hosted server/database. APEX currently guides setup but does not install Ollama, start a local dashboard, or offer a packaged app.
2. **One engine across surfaces:** keep CLI, dashboard, and API on the same task/policy/trace contracts; make the Preview and setup language clearly distinguish existing functions from roadmap work.
3. **Desktop foundation:** build a thin cross-platform control surface around the same agent core—projects, sessions, artifacts, setup, permissions, and run timeline. Do not make the native desktop UI a second, divergent agent.
4. **Safe computer-use gate:** allow local browser/files/apps or an isolated cloud computer only after real isolation, scoped grants, bounded network/credential access, interruptibility, action-specific approval, and receipts are in place.
5. **Durable context and effects:** make memory, approvals, artifacts, and effect history portable and reviewable; accurately distinguish planned, attempted, completed, and verified effects.
6. **Always-on workflows and ecosystem:** add restart-safe scheduling, channels, connectors, peers, specialist Skills, and beneficial workflows only after the trust and recovery conditions described below.

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
- The initial CLI, web dashboard, and personal-token API now call the same APEX task engine. Next add streaming/resumable events and a full-screen TUI without splitting policy or state.
- Expand keyboard, screen-reader, reduced-motion, accessibility, and device hand-off support.
- Publish signed/reproducible releases, contribution governance, vulnerability response, and dependency/extension license inventories.
- Evaluate verified external-state success, false completion, recovery time, unsafe-action rate, latency, model cost, and user interventions.

## Current boundary

The current implementation has model profiles, a bounded server task loop, saved sessions/traces, private virtual workspace/memory, versioned instruction Skills, tested read-only GET API Plugins, remote CLI mode, a separate project-scoped local CLI loop, workflow drafts/manual execution, and an opt-in generic APEX Bridge v1 peer. The CLI now guides a no-key Ollama setup, but the user must install Ollama; a local dashboard daemon, packaged npm release, and native desktop app are not yet available. It **does not** yet include general browser/mouse/keyboard control, the complete effect ledger, typed approval/pause/resume, native named-agent adapters, durable scheduler/webhook worker, OS-isolated shell/browser/code execution, model failover/conformance, full TUI/streaming, or portable self-host authentication. See the [README](../README.md), [desktop-agent review](desktop-agent-review.md), and [threat model](threat-model.md) before using APEX operationally.
