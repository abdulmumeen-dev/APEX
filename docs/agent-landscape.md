# APEX Agent Product Landscape

## Executive summary

APEX’s target is a local-first, open-source agent workstation with its own engine across CLI, dashboard, and API, and a planned native desktop surface. The original eight-product review compares three neighboring product families:

1. **Coding-agent harnesses**: Grok Build, OpenHands, and Claude Code demonstrate excellent repository context, tool loops, approvals, recovery, and developer workflow integration.
2. **Persistent agent runtimes/gateways**: OpenClaw and Hermes demonstrate provider/model separation, self-hosting, messaging surfaces, memory, automation, and extensibility.
3. **Hosted action/workflow products**: Cue, AutoGPT Platform, and ChatGPT agent demonstrate broad integrations, human checkpoints, visual or operational workflow controls, and end-to-end task execution—but with more vendor, hosting, or licensing dependence.

The companion [desktop-agent review](desktop-agent-review.md) extends this landscape with official product pages for Manus Desktop, Kimi Work, Hermes Desktop, Meta Muse, and OpenAI Dots. It distinguishes work on a user's local machine from a dedicated cloud computer, and shared agent-core desktop apps from independent wrappers.

The clearest market pattern is that **the agent loop is no longer the main differentiator**. Leading products already combine model inference, tool dispatch, sessions, extension systems, automation, and approvals. APEX can differentiate by making the underlying contracts more portable and auditable:

- **Provider-neutral execution** across hosted APIs, private servers, and local models, with explicit capability negotiation and recorded fallback decisions.
- **A durable, provider-neutral run/effect ledger** for interactive, scheduled, delegated, and bridged work—not merely a transcript or task-history view.
- **One policy plane** covering tools, data egress, credentials, environments, budgets, approvals, identities, and external-agent delegation.
- **Portable, inspectable state**: sessions, memory, artifacts, approvals, skills, and policies should be exportable, deletable, provenance-aware, and migratable.
- **Open agent bridges** with typed envelopes, scoped authority, deadlines, cancellation, budgets, artifact exchange, and provenance.
- **Security and governance as product features**: fail-closed options, reproducible releases, signed extensions, public threat models, and an OSI-licensed core.

These are **design opportunities inferred from the reviewed evidence**, not claims that APEX already implements them. Similarly, a documented limitation below applies only to the named product and should not be generalized to every agent.

## Scope and method

This report synthesizes the original eight product reviews. “Documented” means stated in the cited product documentation, repository, policy, or independent source included in the review. “Opportunity” means a proposed APEX differentiator inferred from a documented boundary, friction, or cross-product contrast. The five official desktop/always-on product pages are treated separately in the companion review linked above.

The review set is:

- [Grok Build](https://github.com/xai-org/grok-build)
- [Manus Cue](https://cue.im/)
- [OpenClaw](https://openclaw.ai/)
- [Hermes Agent](https://hermes-agent.nousresearch.com/)
- [OpenHands](https://www.openhands.dev/)
- [AutoGPT Platform](https://github.com/Significant-Gravitas/AutoGPT)
- [OpenAI ChatGPT agent](https://openai.com/index/introducing-chatgpt-agent/)
- [Anthropic Claude Code](https://docs.anthropic.com/en/docs/claude-code)

## Landscape at a glance

| Product | Product center | Model/deployment posture | Strongest evidence for APEX | Material documented boundary |
|---|---|---|---|---|
| Grok Build | Open-source terminal coding harness/TUI | Custom OpenAI-compatible or Anthropic-style endpoints; local-inference documentation; local tool execution | Separation of model, harness, permissions, sandbox, sessions, skills/plugins/MCP, and ACP | Sandbox off by default; hooks fail open on non-explicit-deny failures; recurring loops expire after seven days; Apache-2.0 source but no external contributions; an independent analysis reported a historical repository-upload event ([sandbox](https://docs.x.ai/build/features/sandbox), [hooks](https://docs.x.ai/build/features/hooks), [Hive Security](https://hivesecurity.gitlab.io/blog/grok-build-repository-upload-2026/)) |
| Cue | Hosted general-purpose personal/work agent | Vendor-selected foundational models in public documentation; hosted workspace/computer | Identity primitives, approvals, automations, multi-agent handoffs, and managed trust documentation | Early access; no public self-hosted runtime or user-selected local/server model path established; retention and account deletion are vendor/account-bound ([Cue](https://cue.im/), [Trust FAQ](https://trust.manus.im/faq)) |
| OpenClaw | Self-hosted agent gateway/control plane | Broad hosted, custom, and local runtimes; operator-owned state | Provider/model/runtime/channel separation, local state, messaging reach, automation, A2A | Gateway assumes a trusted boundary; workspace is not a sandbox; A2A lacks several durability/streaming/cancellation features; operations remain with the operator ([security](https://docs.openclaw.ai/gateway/security), [A2A](https://docs.openclaw.ai/channels/a2a)) |
| Hermes | Self-hosted general-purpose runtime | Hosted APIs, custom OpenAI-compatible endpoints, Ollama/vLLM and other local/server options | Model/runtime separation, skills/MCP, memory/session composition, cron/webhooks, profiles/Bots | Profiles are not sandboxes; approvals and scanners are heuristics; memory has hard bounds and session-snapshot behavior; OS isolation is the real boundary ([security](https://hermes-agent.nousresearch.com/docs/user-guide/security), [memory](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/memory.md)) |
| OpenHands | Open-source software-engineering agent platform | LiteLLM-compatible APIs, proxies, local/self-hosted servers, Docker/remote/cloud workspaces | Event-sourced state, typed tools, workspace abstraction, Agent Server, automations, ACP | Direct execution can expose host filesystem/network; security analyzer has explicit bypass/non-goal limitations; Automation Service is beta; multi-tenant audit remains future work ([security guide](https://docs.openhands.dev/sdk/guides/security), [self-hosting](https://github.com/OpenHands/openhands/blob/main/docs/SELF_HOSTING.md)) |
| AutoGPT Platform | Visual/low-code agent workflow runtime | Major providers; documented Ollama path is self-host-only and registry-driven | Typed block graphs, explicit error pins, human-in-the-loop blocks, marketplace, schedules/webhooks | Custom Ollama model may require source edits/rebuild; error propagation/retry must be wired; public run links can expose outputs; Platform is Polyform Shield, not conventional OSI licensing ([Ollama](https://agpt.co/docs/platform/using-the-platform/using-ai-services/ollama.md), [license](https://github.com/Significant-Gravitas/AutoGPT/blob/master/LICENSE)) |
| ChatGPT agent | Legacy hosted research-and-action feature; distinct from OpenAI Dots | OpenAI-hosted models and managed remote computer | Unified planner over browser, terminal, connectors, artifacts, confirmation and takeover | The legacy feature is explicitly no longer available; Dots is a separate product, covered in the [desktop-agent review](desktop-agent-review.md). Hosted/self-hosted portability is not established ([help](https://help.openai.com/en/articles/11752874-chatgpt-agent), [system card](https://cdn.openai.com/pdf/839e66fc-602c-48bf-81d3-b21eacc3459d/chatgpt_agent_system_card.pdf)) |
| Claude Code | Vendor-controlled coding harness | Claude-centric direct/cloud/provider deployments; explicit docs say non-Claude gateway routing is unsupported | Extension layering, permissions, sandboxing, local/cloud continuum, CI/MCP/Git workflows | Core is public but all-rights-reserved under Commercial Terms; sandbox is not complete isolation; routines/channels are previews with operational limits ([gateway](https://code.claude.com/docs/en/llm-gateway), [license](https://raw.githubusercontent.com/anthropics/claude-code/main/LICENSE.md), [sandbox](https://code.claude.com/docs/en/sandboxing)) |

## Repeated strengths to adopt

### 1. A single loop with multiple execution surfaces

The strongest products do not expose only a chat interface. Grok Build has TUI, headless JSON/streaming JSON, and ACP; OpenHands has GUI, CLI, SDK, and Agent Server; Claude Code spans terminal, IDE, cloud, CI, SDK, and integrations; OpenClaw and Hermes expose gateways, messaging, CLI/UI, and automation. Cue and ChatGPT agent hide heterogeneous tools behind a unified task experience, while AutoGPT makes execution visible as a typed graph.

**APEX implication:** define one core run contract and expose it through CLI/TUI, API, event triggers, and bridge protocols. UI surfaces should be clients of the run system, not separate implementations with separate histories.

### 2. Model/runtime separation is valuable—and unevenly realized

OpenClaw, Hermes, OpenHands, and Grok Build provide the clearest evidence that provider/model/runtime separation reduces lock-in. They support combinations of direct APIs, compatible endpoints, local inference, proxies, and native harnesses. By contrast, Cue publicly describes managed model selection; Claude Code is explicitly Claude-centric; ChatGPT agent is OpenAI-hosted; AutoGPT’s local-model extensibility is registry-driven and can require code changes.

**APEX implication:** model selection must be a replaceable dependency, not a product identity. APEX should support API, private server, and local backends through adapters with capability profiles for tool calling, streaming, structured output, vision, context size, reasoning, cancellation, and cost reporting. Routing and fallback decisions should be policy-controlled and recorded.

### 3. Durable context and recovery are now table stakes

Grok Build sessions persist prompts, responses, tool calls, snapshots, and todos and support resume/fork/rewind/compaction. OpenHands uses event-sourced conversation state and recovery. Hermes has transcripts, session search, lineage, export, and bounded curated memory. OpenClaw has local state and automation history. Claude Code offers sessions, memory, rules, skills, and cloud/local continuity. Cue offers persistent hosted workspaces and same-task automation semantics.

**APEX implication:** persistence should be a first-class substrate, not a chat transcript bolted onto the loop. The important distinction is between session history, task state, durable memory, artifacts, approvals, and effects; each needs its own schema and lifecycle.

### 4. Extension seams are mature and composable

Skills, plugins, hooks, MCP, ACP, LSP, custom tools, subagents, and marketplaces recur across the coding products. OpenClaw and Hermes extend this to channels, providers, memory engines, profiles, and device nodes. AutoGPT uses typed blocks and a marketplace. Cue and ChatGPT use connectors/MCP. This demonstrates a broad consensus that agents need a capability ecosystem rather than a fixed tool list.

**APEX implication:** use explicit extension boundaries. A skill should not implicitly gain plugin-level filesystem or network authority. An extension manifest should declare capabilities, data classes, network destinations, subprocess use, state writes, dependencies, and required secrets.

### 5. Human approval is most useful at the effect boundary

Grok’s plan review, Cue’s typed confirmations and send/publish approvals, AutoGPT’s human-in-the-loop block, ChatGPT’s confirmation/takeover model, and Claude Code’s permission modes all place people near consequential actions. OpenHands and Hermes also provide confirmation and risk controls, while OpenClaw documents operator-mediated approvals for A2A.

**APEX implication:** approvals should be typed, resumable, and bound to exact arguments, capability, actor, data scope, policy version, expiry, expected side effect, and result receipt. A natural-language “yes” should not become an unscoped grant.

### 6. Automation is moving from demo feature to operating system

The reviewed products support schedules, recurring prompts, webhooks, event triggers, cron, monitoring, background jobs, routines, CI, and delegated subagents. OpenHands, Hermes, OpenClaw, Cue, AutoGPT, and Claude Code document operational controls such as run history, delivery, pause/edit/resume, validation, or failure repair.

**APEX implication:** automation needs durable workflow semantics: time zones, leases, retries/backoff, cancellation, idempotency keys, missed-run policy, deadlines, budgets, approval waits, dead-letter handling, and same-run versus fresh-run behavior. A scheduler that merely re-prompts an agent is insufficient for unattended work.

## Repeated friction and gaps evidenced across sources

The following are recurring evidence-backed themes. They are not universal claims; each is grounded in specific documented product boundaries.

### A. Security controls are layered, but often not a complete boundary

- Grok documents that sandboxing is off by default, that plan mode does not prevent every write path, and that hooks fail open except for explicit denial ([sandbox](https://docs.x.ai/build/features/sandbox), [permissions](https://docs.x.ai/build/features/permissions), [hooks](https://docs.x.ai/build/features/hooks)).
- OpenClaw says a workspace is not a sandbox, assumes a trusted Gateway boundary, and warns that skills/plugins are an attack surface ([security](https://docs.openclaw.ai/gateway/security)).
- Hermes explicitly says approvals, scanners, and redaction are heuristics and that OS-level isolation is the real boundary ([security policy](https://github.com/NousResearch/hermes-agent/blob/main/SECURITY.md)).
- OpenHands documents analyzer bypasses, no hard deny at the analyzer boundary, and the risk of direct host execution ([security guide](https://docs.openhands.dev/sdk/guides/security)).
- Claude Code documents incomplete sandbox isolation, network and socket caveats, and continuing prompt-injection risk ([sandbox](https://code.claude.com/docs/en/sandboxing), [security](https://code.claude.com/docs/en/security)).
- Independent security research on OpenClaw and Claude Code similarly frames these as defense-in-depth systems, not magic containment ([Microsoft](https://www.microsoft.com/en-us/security/blog/2026/02/19/running-openclaw-safely-identity-isolation-runtime-risk/), [Checkmarx](https://checkmarx.com/learn/ai-security/claude-code-security-top-6-risks-controls-and-best-practices/)).

**APEX opportunity:** separate deterministic enforcement from model-based risk scoring. Provide fail-closed mode for security-critical hooks, deny-by-default capability grants, per-run isolation profiles, network/data-egress policy, short-lived secret leases, and explicit residual-risk indicators. Do not present approval prompts as a substitute for OS or container isolation.

### B. Data egress is not the same decision as tool execution

The Grok review identifies a material historical case: an independent wire analysis reported that version 0.2.93 uploaded tracked repository content and full Git history, including content not read by the agent; current enterprise documentation later described controls and ZDR, but the event remains a versioned trust caveat ([Hive Security](https://hivesecurity.gitlab.io/blog/grok-build-repository-upload-2026/), [enterprise docs](https://docs.x.ai/build/enterprise)). Other products also expose different retention, training, connector, browser, screenshot, telemetry, and managed-workspace policies: Cue publishes provider/connector/browser retention details ([Trust FAQ](https://trust.manus.im/faq)); OpenClaw documents update checks and opt-in statistics ([telemetry](https://docs.openclaw.ai/gateway/telemetry)); Claude Code documents account-dependent training and retention ([data usage](https://code.claude.com/docs/en/data-usage)); ChatGPT documents plan-dependent data controls ([data controls](https://help.openai.com/en/articles/7730893-data-controls)).

**APEX opportunity:** make destination, data class, endpoint, retention, telemetry, training/usage, and artifact-upload consent separate policy objects. A tool may be approved while a particular data class or destination is denied. Every egress decision should be visible in the run ledger.

### C. Automation durability and state semantics vary

Several products impose explicit bounds or split automation across surfaces:

- Grok `/loop` has a 60-second minimum, seven-day expiry, and active-task cap ([modes and commands](https://docs.x.ai/build/modes-and-commands)).
- Cue schedules have a minimum interval and account/plan retention semantics ([automations](https://manus.im/features/automations), [Trust FAQ](https://trust.manus.im/faq)).
- OpenClaw A2A tasks are in-memory with bounded retention, events are not replayed, and restart loses task state ([A2A](https://docs.openclaw.ai/channels/a2a)).
- Claude Code’s `/loop` ends with the session, has limited catch-up, and recurring tasks expire; durable work uses separate routines or CI ([scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks), [routines](https://code.claude.com/docs/en/routines)).
- AutoGPT requires graph authors to wire error paths and retry behavior ([data flow](https://agpt.co/docs/platform/using-the-platform/data-flow-and-execution.md)).
- OpenHands Automation Service is explicitly beta ([repository](https://github.com/OpenHands/automation)).

**APEX opportunity:** one durable event bus and scheduler should cover interactive, scheduled, webhook, CI, and bridge-triggered work. Persist leases, retries, checkpoints, cancellation, deadlines, and delivery receipts.

### D. Memory is useful but not automatically governed or portable

Hermes imposes hard limits on curated memory and freezes the system-prompt snapshot until a new session ([memory](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/memory.md)). OpenClaw says only explicitly saved state is remembered and warns about truncation and skipped flushes ([memory](https://docs.openclaw.ai/concepts/memory)). OpenHands offers portable Markdown memory but describes it as opt-in and best-effort ([persistent memory](https://docs.openhands.dev/sdk/guides/persistent-memory)). Claude Code provides auto memory and project context but does not frame these as a complete governed memory taxonomy ([overview](https://docs.anthropic.com/en/docs/claude-code)). Cue’s public materials do not establish exportable memory or state portability.

**APEX opportunity:** define separate episodic, semantic, preference, and task-state stores with source, author, confidence, timestamp, audience, expiry, supersession, review, deletion, and retention metadata. Make memory inspectable and exportable, and require explicit promotion from untrusted external content into durable memory.

### E. Inter-agent interoperability is promising but incomplete

Grok supports ACP; OpenHands can spawn ACP agents; OpenClaw provides A2A; Hermes offers profiles, Bot Mode, peer messaging, and delegation; Cue provides visible multi-agent handoffs; Claude Code has subagents, channels, and cross-session messaging. Yet the documented interfaces do not consistently provide all of durable artifacts, streaming, cancellation, deadlines, capability negotiation, delegation chains, and result provenance. OpenClaw’s A2A documentation explicitly lists omissions including files/raw binary parts, streaming/SSE, push notifications, cancellation, task listing, and durable restart behavior ([A2A](https://docs.openclaw.ai/channels/a2a)).

**APEX opportunity:** publish a narrow open bridge protocol with authenticated peer identity, capability discovery, scoped grants, budgets, deadlines, cancellation, typed results, artifact references, delegation-chain provenance, and approval inheritance. Preserve a plain-text compatibility mode, but never treat text compatibility as authorization.

### F. Portability includes state and policy, not just source code

Open source and self-hosting are not identical to component portability. Grok is Apache-2.0 but has a generated/synced source tree and no external contribution path. OpenClaw and Hermes are permissively licensed and self-hosted, but require substantial operator configuration. OpenHands supports several workspaces and backends, but settings, secrets, and provider configuration remain environment-dependent. AutoGPT exports JSON while credentials, providers, blocks, and versions remain external; its Platform is Polyform Shield. Claude Code’s core is public but all rights reserved under Commercial Terms. Cue and ChatGPT agent are proprietary hosted products.

**APEX opportunity:** export signed, redacted bundles for runs, skills, policies, model capability locks, environment requirements, memory, and secret references. A migration should explain what is portable, what must be reauthorized, and what behavior may change under a new backend.

## Clear APEX capability differentiators

These are the most defensible differentiators for the stated product goal.

### 1. A provider-neutral execution kernel

APEX should define stable internal contracts for:

- model requests/responses and streaming;
- tool schemas and typed results;
- event envelopes and lifecycle state;
- approvals and policy decisions;
- memory and artifact references;
- external-agent calls;
- cost, usage, and capability reporting.

Adapters should cover hosted APIs, OpenAI/Anthropic-compatible servers, local runtimes, and native providers. Capability negotiation should prevent silently enabling vision, tool calling, structured output, or cancellation that a backend cannot reliably provide.

### 2. The run/effect ledger as the primary object

A transcript records conversation. A ledger records what happened and what could happen next. For each run, record:

- immutable event IDs and parent/child relationships;
- model/provider/runtime and capability profile;
- effective policy and approval snapshots;
- prompts and tool arguments, with sensitive values referenced rather than copied;
- artifact hashes, file changes, URLs, transaction IDs, and delivery receipts where available;
- retries, fallbacks, budgets, leases, cancellations, and human decisions;
- data-egress destinations and policy outcomes;
- delegated-agent turns and provenance;
- replay/simulation metadata and completion verification.

This is an opportunity inferred from the products’ differing session, automation, and bridge histories; it is not a claim that existing products lack useful history.

### 3. A unified policy plane

Compose policy across five dimensions:

1. **Principal**: user, agent, extension, external peer, scheduler, or service account.
2. **Capability**: tool, model, connector, browser identity, filesystem, subprocess, or bridge.
3. **Data**: sensitivity, ownership, provenance, retention, and allowed destinations.
4. **Effect**: read, write, send, purchase, deploy, delegate, schedule, or delete.
5. **Context**: run, workspace, time window, budget, network, environment, and approval state.

The policy engine should support dry runs, policy tests, explainable decisions, explicit expiration, and fail-closed behavior where configured.

### 4. Portable governed state

APEX should make sessions, memories, artifacts, skills, workflows, approvals, and policies independently exportable, inspectable, deletable, and versioned. State should carry provenance and retention rules. A user should be able to migrate from a local laptop to a private server without losing audit history or silently widening authority.

### 5. Durable automation and eventing

Unify cron, webhooks, filesystem events, CI, messaging, external-agent requests, and manual runs. Include leases, idempotency, retry classes, backoff, time zones, missed-event policy, approval waits, dead letters, and compensation/rollback hooks. Support no-model deterministic jobs when the task does not need inference.

### 6. Open, permissioned agent bridges

A2A/ACP/MCP-style interoperability should be an APEX core concern, not an afterthought. Require peer authentication, agent cards/manifests, scoped delegation, budgets, deadlines, cancellation, typed artifacts, and result verification. A bridge should expose exactly what authority was delegated and what data crossed the boundary.

### 7. Trustworthy extension supply chain

Require signed or pinned extension artifacts, declared capabilities, dependency and secret references, capability diffs on update, provenance, revocation, static checks, disposable-environment tests, and operator-visible risk labels. Compatibility with existing skills/MCP/plugins is useful, but imported extensions should enter a quarantine or explicitly trusted state.

## Phased priority list

### Phase 0 — Contract and threat-model foundation

**Priority: must have before broad ecosystem growth.**

- Publish APEX’s threat model, trust boundaries, abuse cases, and residual-risk statement.
- Define versioned schemas for runs/events, tools, models, capabilities, approvals, memory, artifacts, extensions, schedules, and bridges.
- Implement the local-first core loop with a small, deterministic tool registry and a provider adapter interface.
- Add a structured policy decision format and audit events, even before every policy type is implemented.
- Establish signed releases, reproducible-build targets, vulnerability reporting, contribution governance, and an OSI-approved core license.

**Exit criterion:** a local run can be inspected end-to-end with stable identifiers and an explicit effective policy.

### Phase 1 — Provider-neutral local agent

**Priority: first usable product.**

- Support at least one hosted API, one OpenAI-compatible server, and one local runtime.
- Add capability negotiation, model fallback rules, timeouts, retries, cancellation, and cost/usage accounting.
- Provide CLI/TUI plus JSON/streaming output and session resume.
- Implement a minimal capability-scoped tool loop with filesystem, shell/process, and HTTP/web tools behind policy.
- Add per-run workspace isolation profiles and short-lived secret injection where feasible.

**Exit criterion:** the same task can run locally, against a private server, or against a hosted API without changing the tool/history contract.

### Phase 2 — Durable state and approvals

**Priority: differentiating core.**

- Ship the append-only run/effect ledger with artifact hashes, policy snapshots, approvals, costs, and replay/debug views.
- Add typed approval objects for writes, network egress, messages, purchases, data changes, delegation, and schedules.
- Add portable memory stores with provenance, retention, export, deletion, review, and conflict handling.
- Provide evidence-backed completion checks and explicit “attempted,” “confirmed,” and “verified” states.

**Exit criterion:** a user can explain, replay, revoke, export, or delete a consequential run without relying on provider-specific logs.

### Phase 3 — Durable automation and extension ecosystem

**Priority: operational readiness.**

- Add cron, webhooks, event subscriptions, leases, idempotency, retry/backoff, dead letters, deadlines, and missed-run policy.
- Support no-model deterministic jobs and model escalation policies.
- Ship signed extension manifests, capability diffs, revocation, sandboxed vetting, and a registry with transparent provenance.
- Add adapters for MCP, HTTP, CLI, browser, and common connector patterns while preserving policy mediation.

**Exit criterion:** unattended runs are resumable, auditable, cancellable, and safe to retry.

### Phase 4 — Agent bridges and deployment profiles

**Priority: ecosystem and enterprise differentiation.**

- Implement the APEX bridge protocol with typed envelopes, authenticated peers, scoped authority, budgets, artifacts, deadlines, cancellation, and provenance.
- Add local trusted, isolated-container, private-server, hybrid, and air-gapped deployment profiles with compiled policy templates.
- Provide migration bundles for state, policies, model capability locks, extension manifests, and secret references.
- Add organization controls: signed policy pins, allowlists, audit export, retention enforcement, and delegated administration.

**Exit criterion:** another agent can be connected without granting it implicit host authority or losing the run’s audit trail.

### Phase 5 — General-purpose surfaces and ecosystem scale

**Priority: after the kernel is trustworthy.**

- Add messaging, desktop, mobile, collaborative workspaces, browser/device nodes, and higher-level workflow authoring.
- Offer a marketplace only after provenance, signing, revocation, and review workflows are mature.
- Publish conformance suites for model adapters, providers, extensions, bridges, and deployment profiles.
- Measure external-state success, false-completion rate, unsafe-action rate, recovery rate, latency, cost, and user override frequency.

**Exit criterion:** breadth is earned without weakening portability, security, or auditability.

## Security, licensing, and self-hosting trade-offs

### Security and operational ownership

**Local/self-hosted advantages:** user-controlled data residency, direct local-model use, private endpoints, inspectable state, and the ability to operate without a vendor middle layer. OpenClaw and Hermes make this posture explicit; OpenHands and AutoGPT provide local/container/remote options.

**Local/self-hosted costs:** the operator owns patching, credential protection, backups, network exposure, isolation, updates, availability, extension review, and incident response. OpenClaw’s security guidance recommends treating an unguarded runtime as untrusted code execution; Hermes says OS-level isolation is the meaningful boundary; OpenHands warns that direct execution can expose the host ([OpenClaw security](https://docs.openclaw.ai/gateway/security), [Hermes security](https://hermes-agent.nousresearch.com/docs/user-guide/security), [OpenHands self-hosting](https://github.com/OpenHands/openhands/blob/main/docs/SELF_HOSTING.md)).

**Hosted advantages:** managed identity, patching, scaling, browser/device infrastructure, compliance programs, and centralized connectors. Cue documents SOC 2/ISO controls and data-residency/retention policies; ChatGPT and Claude provide managed cloud execution and organizational controls ([Cue Trust Center](https://trust.manus.im/), [Claude cloud](https://code.claude.com/docs/en/claude-code-on-the-web)).

**Hosted costs:** provider trust, account dependency, data residency and retention constraints, vendor model routing, plan limits, service changes, and less ability to inspect or reproduce the runtime. Cue and ChatGPT do not establish public self-hosted runtimes; Claude Code’s core is public but not conventionally open-source; ChatGPT’s separate agent feature is now retired.

APEX should offer both local-first and managed-private profiles, but make the trust domain explicit. “Open source” should not imply that every provider, model, connector, or hosted execution service is open or privacy-equivalent.

### Licensing and governance

The reviewed products span materially different licenses:

- **Permissive/open-source:** OpenClaw and Hermes are MIT; OpenHands is MIT; Grok Build is Apache-2.0. These licenses support reuse, modification, and self-hosting, subject to included third-party licenses and operational obligations ([OpenClaw repository](https://github.com/openclaw/openclaw), [Hermes repository](https://github.com/NousResearch/hermes-agent), [OpenHands license](https://github.com/OpenHands/openhands/blob/main/LICENSE), [Grok repository](https://github.com/xai-org/grok-build)).
- **Source-visible but restricted:** AutoGPT Platform uses Polyform Shield for the Platform directory, including a restriction on providing a competing product/service; other directories retain different licensing ([license](https://github.com/Significant-Gravitas/AutoGPT/blob/master/LICENSE), [PolyForm Shield](https://polyformproject.org/licenses/shield/1.0.0)).
- **Public but vendor-controlled:** Claude Code’s core LICENSE.md is all rights reserved under Anthropic Commercial Terms, despite a public repository; its GitHub Action is separately MIT-licensed ([core license](https://raw.githubusercontent.com/anthropics/claude-code/main/LICENSE.md), [action](https://github.com/anthropics/claude-code-action)).
- **Proprietary hosted:** Cue and ChatGPT agent expose product/API/documentation surfaces but not an open runtime license or self-hosted core.

APEX should use an OSI-approved license for the core if independent reuse is a strategic goal. It should separately document licenses for bundled dependencies, extension packages, model weights, connector SDKs, and hosted services. Licensing alone does not establish healthy governance: Grok’s repository review describes no external contribution path, while OpenClaw presents a foundation/community stewardship model. APEX should publish contributor rules, release provenance, security response, decision rights, and funding/conflict policies.

### Data, privacy, and retention

A user-selected model endpoint is valuable only if data routing is visible. APEX should expose, per run and per tool:

- which model/provider saw which data;
- whether content crossed a network boundary;
- retention and deletion behavior at the endpoint;
- whether telemetry or usage data was sent;
- whether artifacts, logs, screenshots, or memory were persisted;
- whether training/model-improvement use is contractually or technically excluded;
- what data an extension, bridge, or connector can access.

This directly addresses the different trust models documented by Cue, OpenClaw, Claude Code, ChatGPT, and the Grok repository-upload analysis. APEX must not promise provider privacy beyond what the selected endpoint and contract actually support.

## Practical recommendation

Build APEX as a **local-first execution kernel plus durable control plane**, not as a broad marketplace or hosted assistant on day one. The first release should prove three things:

1. the same tool loop starts with a local Ollama model without a provider API key, while hosted APIs and private model servers remain optional;
2. every consequential operation has a durable, exportable, policy-linked record; and
3. state, memory, approvals, and policies survive backend replacement and remain coherent across CLI, dashboard/API, and a later desktop app.

Only after these are reliable should APEX add unattended automations, broad channels, device actions, payment/identity adapters, or a community extension marketplace. APEX should implement useful capabilities rather than imply private vendor integrations. The landscape suggests that breadth is achievable; **portable authority, verifiable effects, and durable provenance are the harder and more defensible product.**

## References

### Product and architecture

- [GitHub — xai-org/grok-build repository](https://github.com/xai-org/grok-build)
- [Grok Build is Now Open Source — xAI](https://x.ai/news/grok-build-open-source)
- [Grok Build — xAI developer documentation overview](https://docs.x.ai/build/overview)
- [Cue — Your personal agents, on Cue](https://cue.im/)
- [Introducing Manus 2.0](https://manus.im/blog/introducing-manus-2-0)
- [OpenClaw — Open-Source AI Assistant](https://openclaw.ai/)
- [OpenClaw Documentation](https://docs.openclaw.ai/)
- [openclaw/openclaw GitHub Repository](https://github.com/openclaw/openclaw)
- [Hermes Agent — official product site](https://hermes-agent.nousresearch.com/)
- [Hermes Agent Documentation — official overview](https://hermes-agent.nousresearch.com/docs/)
- [NousResearch/hermes-agent — official GitHub repository](https://github.com/NousResearch/hermes-agent)
- [OpenHands — Open Source AI Coding Agent Platform](https://www.openhands.dev/)
- [OpenHands/openhands — Agent Canvas and OpenHands source repository](https://github.com/OpenHands/openhands)
- [OpenHands Software Agent SDK: A Composable and Extensible Foundation for Production Agents](https://arxiv.org/html/2511.03690v2)
- [What is the AutoGPT Platform? — AutoGPT Documentation](https://agpt.co/docs/platform/what-is-autogpt-platform.md)
- [Significant-Gravitas/AutoGPT — official repository README](https://github.com/Significant-Gravitas/AutoGPT)
- [Introducing ChatGPT agent: bridging research and action — OpenAI](https://openai.com/index/introducing-chatgpt-agent/)
- [ChatGPT agent — OpenAI Help Center](https://help.openai.com/en/articles/11752874-chatgpt-agent)
- [Overview — Claude Code Docs](https://docs.anthropic.com/en/docs/claude-code)
- [anthropics/claude-code — GitHub repository](https://github.com/anthropics/claude-code)

### Security, privacy, automation, and interoperability

- [Modes and Commands — xAI Grok Build documentation](https://docs.x.ai/build/modes-and-commands)
- [Sandbox — xAI Grok Build documentation](https://docs.x.ai/build/features/sandbox)
- [Hooks — xAI Grok Build documentation](https://docs.x.ai/build/features/hooks)
- [Enterprise Deployments — xAI Grok Build documentation](https://docs.x.ai/build/enterprise)
- [Grok Build Uploaded Entire Git Repositories: What the Wire Capture Proved — Hive Security](https://hivesecurity.gitlab.io/blog/grok-build-repository-upload-2026/)
- [Manus Trust Center](https://trust.manus.im/)
- [Manus Trust Center FAQ](https://trust.manus.im/faq)
- [Automations — Manus](https://manus.im/features/automations)
- [OpenClaw Security: Trust Model, Safe Defaults, and Hardening](https://docs.openclaw.ai/gateway/security)
- [OpenClaw A2A Channel: Agent2Agent 1.0 Integration](https://docs.openclaw.ai/channels/a2a)
- [OpenClaw Memory Overview](https://docs.openclaw.ai/concepts/memory)
- [OpenClaw Usage Telemetry and Update Checks](https://docs.openclaw.ai/gateway/telemetry)
- [Running OpenClaw Safely: Identity, Isolation, and Runtime Risk — Microsoft](https://www.microsoft.com/en-us/security/blog/2026/02/19/running-openclaw-safely-identity-isolation-runtime-risk/)
- [Security — Hermes Agent documentation](https://hermes-agent.nousresearch.com/docs/user-guide/security)
- [Persistent Memory — Hermes Agent documentation source](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/memory.md)
- [Security Guide — OpenHands Software Agent SDK](https://docs.openhands.dev/sdk/guides/security)
- [Self-Hosting Agent Canvas on a Virtual Machine — OpenHands](https://github.com/OpenHands/openhands/blob/main/docs/SELF_HOSTING.md)
- [OpenHands Documentation — Automations Overview](https://docs.openhands.dev/openhands/usage/automations/overview)
- [Data Flow & Execution — AutoGPT Documentation](https://agpt.co/docs/platform/using-the-platform/data-flow-and-execution.md)
- [Scheduling & Triggers — AutoGPT Documentation](https://agpt.co/docs/platform/using-the-platform/scheduling-and-triggers.md)
- [Using Ollama — AutoGPT Documentation](https://agpt.co/docs/platform/using-ai-services/ollama.md)
- [AutoGPT Security Policy](https://github.com/Significant-Gravitas/AutoGPT/blob/master/SECURITY.md)
- [ChatGPT agent System Card — OpenAI](https://cdn.openai.com/pdf/839e66fc-602c-48bf-81d3-b21eacc3459d/chatgpt_agent_system_card.pdf)
- [Data controls in ChatGPT — OpenAI Help Center](https://help.openai.com/en/articles/7730893-data-controls)
- [Configure permissions — Claude Code Docs](https://docs.anthropic.com/en/docs/claude-code/permissions)
- [Configure the sandboxed Bash tool — Claude Code Docs](https://code.claude.com/docs/en/sandboxing)
- [Security — Claude Code Docs](https://code.claude.com/docs/en/security)
- [Data usage — Claude Code Docs](https://code.claude.com/docs/en/data-usage)
- [Run prompts on a schedule — Claude Code Docs](https://code.claude.com/docs/en/scheduled-tasks)
- [Automate work with routines — Claude Code Docs](https://code.claude.com/docs/en/routines)
- [Claude Code Security: 6 Risks, Controls & Best Practices — Checkmarx](https://checkmarx.com/learn/ai-security/claude-code-security-top-6-risks-controls-and-best-practices/)

### Licensing and governance

- [OpenClaw Foundation](https://openclaw.org/)
- [OpenHands — MIT License](https://github.com/OpenHands/openhands/blob/main/LICENSE)
- [PolyForm Shield License 1.0.0](https://polyformproject.org/licenses/shield/1.0.0)
- [AutoGPT LICENSE — Polyform Shield and MIT license split](https://github.com/Significant-Gravitas/AutoGPT/blob/master/LICENSE)
- [Claude Code LICENSE.md — GitHub](https://raw.githubusercontent.com/anthropics/claude-code/main/LICENSE.md)
- [anthropics/claude-code-action — GitHub repository](https://github.com/anthropics/claude-code-action)
