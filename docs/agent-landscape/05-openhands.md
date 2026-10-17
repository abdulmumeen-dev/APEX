# OpenHands: product-capability review for APEX

**Evidence cutoff: 2026-10-13.** This review covers exactly one product: **OpenHands**, including the current OpenHands Agent Canvas, Software Agent SDK, Agent Server, and Automation Service that the project documents as its platform components. It is a capability study, not a deployment or integration recommendation.

## Core job and product shape

OpenHands’ core job is to let a developer assign a software-engineering task to an agent that can inspect a workspace, use tools, edit files, run commands, and continue until the task is complete or needs human input. The product now describes itself as an **open-source platform for software-engineering agents**, with a GUI, CLI, SDK, and enterprise control plane rather than only a chat UI. [1] The repository positions Agent Canvas as a self-hosted control center for coding agents and automations, with the open-source OpenHands agent available alongside third-party agents. [2]

That focus matters for APEX. OpenHands is not presented as a general personal assistant or neutral agent operating system. Its abstractions—workspace, code tools, repository skills, agent server, coding-agent backends, and engineering automations—are optimized for software work. The SDK is nevertheless deliberately reusable: developers can embed its agent loop, typed tools, conversations, workspaces, events, and server APIs in their own applications. [3]

The current product is best understood as four cooperating layers:

- **Agent Canvas:** a browser control surface for interactive conversations, backend selection, model/agent settings, customization, and automations.
- **Software Agent SDK:** the typed Python core for agents, LLMs, conversations, tools, events, workspaces, skills, memory, and security policies.
- **Agent Server:** a FastAPI-based REST/WebSocket service that exposes conversations and tools to remote clients and sandboxes.
- **Automation Service:** a separate service for cron schedules, webhooks, run history, dispatch, and sandbox lifecycle orchestration. [2] [4]

## Actual capabilities

### Agent execution and software work

The standard loop is model-driven action selection followed by tool execution and observations. The built-in tool ecosystem includes terminal/bash work, file editing, grep/search-style operations, task tracking, and other SDK tools; the SDK also permits custom typed tools. The architecture documentation describes an `Agent` reasoning-action loop, `Conversation` lifecycle/state, provider-agnostic `LLM`, typed action/observation/tool/executor objects, workspaces, skills, condensers, and security controls. [3]

In practical terms, OpenHands supports one-off repository tasks, routine maintenance such as dependency updates, and larger refactors. The SDK README explicitly gives examples ranging from writing a README to multi-agent refactors and rewrites. [5] The independent Better Scientific Software (BSSw) review describes the broader coding-agent pattern used by OpenHands: code editing, terminal commands for builds/tests, and browser interaction through agent tools. It also records tasks that tend to work comparatively well, such as resolving merge conflicts, addressing pull-request feedback, minor bug fixes, infrastructure changes, migrations, test coverage, and small applications. [6]

### User-selected models and execution endpoints

OpenHands is substantially model-agnostic. Its documentation says it can connect to any model supported by LiteLLM, exposes provider/model/API-key/base-URL settings, and documents cloud APIs, OpenRouter, LiteLLM proxies, AWS Bedrock, Azure, Google, Groq, OpenAI, and local/self-hosted servers such as Ollama, LM Studio, vLLM, and SGLang. [7] The SDK uses the LiteLLM-style `provider/model` convention and supports a custom base URL, which is a useful match for APEX’s API/server/local-model requirement. [8]

Model choice is not limited to the built-in OpenHands agent. Through the Agent Client Protocol (ACP), Agent Canvas can launch Claude Code, Codex, Gemini CLI, Pi, OpenCode, or a custom stdio ACP server. In this mode, the external agent owns its own model, tools, and execution; Agent Server launches the subprocess and relays JSON-RPC turns while Canvas records and displays the conversation. [9]

### Tools, extensions, and agent composition

MCP is a first-class extension path. An agent can connect to local or remote MCP servers, discover their tools, filter tools with a regex, and use OAuth-protected servers. The SDK documentation includes examples for fetch, repository packaging, and Notion. OAuth tokens are stored and refreshed by the FastMCP client, but the initial OAuth flow requires a browser interaction. [8]

OpenHands also has skills and plugins. Skills are reusable prompt/context packages with trigger-based activation; plugins can package specialized tools or workflows. Canvas separates **Customize** (skills, plugins, MCP servers, and beta apps) from **Settings** (LLMs, secrets, condensers, verification, and behavior). Settings and customization are scoped to the selected backend. [10]

The SDK includes a Task Tool Set for delegation to registered sub-agents. Delegated tasks run synchronously, return a result to the parent, and can be resumed by task ID with their conversation context preserved. This is a useful form of multi-agent composition, but it is a task/delegation primitive rather than a general distributed agent marketplace. [11]

### State, memory, and run history

The SDK persists conversations as a base state plus append-only event files. Persisted data includes message history, agent configuration, execution status, tool outputs, usage statistics, workspace context, activated skills, secrets, and custom agent state. The documentation says state changes are automatically saved and can be restored later; the event log is also usable for inspection or conversion to LLM-ready messages. [12]

OpenHands has opt-in persistent memory separate from conversation persistence. It stores plain Markdown indexes in a user tier (`~/.openhands/memory/`) and a project tier (`<workspace>/.openhands/memory/`), with daily logs available on demand. Only the curated indexes are automatically injected, with an approximately 6,000-character combined budget. The injected memory is explicitly marked as untrusted content, and the feature is off by default. [13]

At the product layer, Automation Service provides a durable operational run record: it owns automation definitions, cron scheduling, webhooks, dispatch, sandbox lifecycle, and run history. Each automation run starts a fresh sandbox and conversation, saves the conversation for later review, and can be manually triggered, enabled, or disabled. [4] [14]

### Automation and integrations

Automations can generate reports, monitor systems, synchronize data, maintain code, and send notifications. The documented examples include scheduled GitHub summaries, dependency checks, SSL monitoring, backup verification, analytics synchronization, code review, incident triage, QA testing, and vulnerability remediation. A run can use the configured LLM, stored secrets, terminal and file tools, MCP integrations, and automatically available GitHub/GitLab/Bitbucket credentials. Slack or another external service requires its corresponding MCP integration. [4]

The event-driven model supports webhooks such as GitHub events, while the open-source Automation Service README identifies API-key management, scheduled cron runs, event-driven triggers, dispatch, and status/result history as explicit service features. [14] The SDK also supports pause/resume of a running conversation without losing state. [15]

## Strongest design choices

**1. Clear separation between agent core, tools, workspaces, server, UI, and automation.** The four-package SDK makes the agent loop reusable while keeping optional Docker/remote execution and the multi-user server out of the minimum local install. Applications communicate through SDK or server APIs rather than copying agent logic. This is a strong foundation for APEX because it makes the model, tool set, execution boundary, and product surface independently replaceable. [3] [5]

**2. One mutable conversation state with typed, event-sourced history.** OpenHands V1 uses immutable, typed Pydantic components and treats interaction events as the durable source of truth. The design targets deterministic replay, crash recovery, persistence, inspection, and distributed execution. This is a better operational substrate than treating a conversation as an opaque transcript or relying on scattered mutable objects. [3] [12]

**3. Workspace abstraction with local-to-remote portability.** The same agent code can run in a local workspace, Docker workspace, or remote API workspace. Swapping the workspace changes where execution occurs without rewriting the agent. This makes local experimentation, server execution, containers, VMs, and Kubernetes-style deployments part of one model. [3]

**4. Genuine model and agent choice.** LiteLLM provider coverage, custom endpoints, local model servers, and ACP bridging all reinforce a user-controlled model boundary. OpenHands does not require the platform owner’s hosted model for every use case. ACP also lets the Canvas serve as a common control plane for agents that are not OpenHands itself. [7] [9]

**5. Operational features are part of the product, not an afterthought.** Scheduled/event-driven runs, per-backend configuration, secrets, run history, pause/resume, persistent conversations, and sandboxes move OpenHands beyond a demo coding loop. The automation service’s separation from the SDK is especially clean: it decides **when** work runs, while SDK/Agent Server decide **how** a conversation executes. [5] [14]

**6. Security is layered and configurable.** The SDK can analyze action risk, combine analyzers, and require confirmation above a selected threshold. The documentation makes the important distinction that analyzers classify risk and confirmation policies decide what happens. Docker/remote workspaces provide stronger isolation than direct local execution. [3] [16]

## Documented limitations and cautions

These are limitations or warnings stated by OpenHands sources, not conclusions drawn merely from the absence of a feature.

- **Model quality is a real dependency.** The model guide says OpenHands requires a powerful model, warns that it issues many prompts that can cost money, and notes that local/open-weight models vary widely in tool-use reliability. It specifically calls out long waits, poor responses, and malformed JSON as reasons to use a stronger model, increase context, or switch to a frontier cloud model. [7]
- **Direct host execution is dangerous.** The current quickstart warns that a no-sandbox installation gives the agent full filesystem access. The self-hosting guide says the agent can read/write the machine filesystem, execute shell commands, and reach the network; anyone who can reach the agent server can do the same. It requires firewalling, API-key protection, and careful TLS/public-mode setup. [2] [17]
- **Optional sandboxing is a tradeoff, not a universal default.** V1 deliberately makes isolation opt-in to preserve local/MCP compatibility. The design is flexible, but a user who chooses local execution has accepted a materially larger trust boundary. [18]
- **The SDK security analyzer is not a complete security boundary.** Official security documentation says it is not a full prompt-injection solution, shell parser, sandbox replacement, or guarantee against novel threats. There is no hard deny at the analyzer boundary; direct `execute_tool()` bypasses analyzer and confirmation checks; homoglyphs and model thinking blocks are not fully covered; and content beyond a 30,000-character scan budget can be invisible. [16]
- **MCP OAuth is not suitable for fully headless workflows by default.** The initial browser-based authentication requires user interaction. A provider API key is the documented alternative for headless use. [8]
- **ACP capability depends on backend and provider.** Pi and OpenCode are documented as local/self-hosted-backend options, while OpenHands Cloud exposes Claude Code, Codex, and Gemini CLI. Custom ACP servers require the user to supply a launch command and any needed environment secrets. [9]
- **Automation is currently beta.** The Automation Service README says its APIs and features may change without notice. [14]
- **Multi-tenant security is not presented as finished.** The SDK technical report describes process/container isolation and per-conversation secrets as foundations, but says a comprehensive multi-tenant security audit remains future work. [19]
- **Human review remains necessary.** The independent BSSw review recommends small, clear tasks, restarting when an agent gets stuck, and always reviewing generated code because agents can hallucinate, duplicate code, or misinterpret instructions. [6]

## Security, trust, and deployment model

OpenHands supports three materially different trust postures. A developer can run the SDK and tools in one local process. They can run the agent directly on a host through Canvas, which is convenient but grants host filesystem, command, and network access. Or they can use Docker/remote workspaces and Agent Server so agent execution occurs in an ephemeral or separately managed environment. The server exposes REST/WebSocket APIs, per-session authentication, health checks, and OpenAI-compatible chat/responses endpoints. [3]

The self-hosting guide is unusually explicit about threat modeling. It recommends network firewalls, loopback-bound services, a strong `LOCAL_BACKEND_API_KEY`, public mode that does not embed the key in frontend HTML, and TLS through a reverse proxy for internet access. It also warns that the bundled editor shares the browser origin and that browser-origin compromise can expose backend session keys stored in local storage. [17]

At the action layer, users can attach a security analyzer and confirmation policy. The recommended baseline confirms high-risk actions and unknown risk, while stricter thresholds can require approval for medium-risk actions. The analyzer is additive: it should be paired with Docker isolation, least-privilege credentials, workspace boundaries, and ordinary code review rather than treated as an enforcement wall. [16]

Secrets are stored per backend and passed to model providers, MCP servers, or ACP subprocesses as configured. Git provider credentials can be inherited when the user has logged in; other integrations require explicit stored secrets or MCP authentication. The backend-scoped design reduces accidental cross-backend sharing but means configuration portability must be managed deliberately. [4] [9] [10]

## Openness, licensing, and deployment economics

The main OpenHands repository and the Software Agent SDK repository are publicly developed and marked **MIT licensed**. The MIT text permits use, copying, modification, sublicensing, distribution, and sale, subject to notice, with the usual “as is” warranty disclaimer. The Automation Service repository is also marked MIT. [5] [20] [14]

The open-source surface includes the Canvas application, SDK packages, tools, workspace implementations, Agent Server, TypeScript client, examples, tests, and automation service. OpenHands offers local self-hosting, Docker sandboxes, remote VMs, managed Cloud, and Enterprise infrastructure. “Open source” should not be read as saying that every hosted service, operational control plane, model, or third-party ACP provider is itself under the OpenHands MIT license; those are separate deployment or dependency choices. [1] [2] [3]

The design is therefore attractive to an APEX project that wants user-controlled models and self-hosting, but it also reveals the operational cost of openness: users must choose and maintain isolation, credentials, proxying, model budgets, provider reliability, and upgrades. OpenHands exposes these choices rather than hiding them behind a single hosted endpoint.

## Inferred gaps for APEX (clearly labeled)

The following are **design inferences and opportunities**, not claims that OpenHands lacks a feature. The evidence shows where OpenHands concentrates; it does not prove absence elsewhere.

- **General-purpose scope:** Because the official product, SDK examples, tools, and automations center on repositories and engineering workflows, APEX could make domain-neutral tasks, non-code workspaces, and arbitrary user-defined state first-class instead of treating them as adaptations of a coding agent.
- **Hard policy enforcement:** OpenHands documents advisory risk analysis, confirmation policies, and explicit bypasses. APEX could add a separate deterministic policy engine with deny/allow rules, capability budgets, credential scopes, network/file boundaries, and non-bypassable approval gates, while retaining model-based risk analysis as a signal.
- **Richer memory governance:** OpenHands’ two-tier Markdown memory is legible, portable, and user-editable. APEX could extend that model with typed memories, provenance, confidence, retention/expiry, conflict resolution, per-agent visibility, and explicit approval before memory promotion—without making memory opaque or silently authoritative.
- **Durable workflow semantics:** OpenHands automations run fresh conversations and provide schedules, webhooks, dispatch, and run history. APEX could distinguish a single run from a durable workflow with idempotency keys, retries/backoff, checkpoints, compensation, human approval states, timeouts, and observable dependencies across steps.
- **Unified run ledger:** OpenHands has event-sourced conversation state and a separate automation run service. APEX could expose one cross-backend ledger for prompts, model calls, tool calls, approvals, costs, artifacts, secrets references, and external-agent turns, with redaction and export controls.
- **Agent-bridge governance:** ACP is an effective interoperability path, but the bridged agent owns its own tools and execution. APEX could require every bridged agent to publish a capability manifest and route all external-agent actions through the same approval, budget, audit, and cancellation contract as native agents.
- **Model routing as a policy layer:** OpenHands supports many providers and custom endpoints, but the user still manages model suitability and cost. APEX could make routing declarative: select models by task class, privacy tier, latency/cost budget, context needs, or local-only policy, with automatic fallback and a recorded reason for each switch.
- **Portable configuration:** Settings, MCP servers, secrets, and automations are scoped to a backend. APEX could offer a signed, redacted, portable “agent environment” bundle that moves safely between laptop, server, local model, and cloud execution without copying secrets or silently changing policy.

## Bottom line for APEX

OpenHands is strongest as a **software-engineering agent platform with a credible production substrate**: typed and composable agent components, explicit workspace boundaries, event-sourced conversations, broad model choice, MCP/ACP extension paths, optional sandboxing, and real scheduling/run-history infrastructure. Its most instructive lesson is architectural separation: the agent loop should not be welded to the UI, a specific model, a specific workspace, or the scheduler.

APEX should not simply clone OpenHands. It can borrow the event/state model, workspace abstraction, typed tool boundary, backend separation, and transparent deployment choices while differentiating around general-purpose scope, deterministic policy enforcement, richer memory governance, unified workflow/run semantics, and cross-agent trust. OpenHands demonstrates how far an open agent platform can go when it treats execution and operations as first-class; APEX’s opportunity is to make those same primitives model-neutral, domain-neutral, and policy-governed from the start.

## References

[1]: https://www.openhands.dev/ "OpenHands — Open Source AI Coding Agent Platform"
[2]: https://github.com/OpenHands/openhands "OpenHands/openhands — Agent Canvas and OpenHands source repository"
[3]: https://docs.openhands.dev/sdk/arch/overview "OpenHands Software Agent SDK — Architecture Overview"
[4]: https://docs.openhands.dev/openhands/usage/automations/overview "OpenHands Documentation — Automations Overview"
[5]: https://github.com/OpenHands/software-agent-sdk "OpenHands Software Agent SDK — source repository and README"
[6]: https://bssw.io/items/ai-coding-agents-what-works-and-what-doesn-t "AI Coding Agents: What Works and What Doesn't — Better Scientific Software"
[7]: https://docs.openhands.dev/openhands/usage/llms/llms "OpenHands Documentation — LLMs and Model Providers"
[8]: https://docs.openhands.dev/sdk/guides/mcp "OpenHands Software Agent SDK — Model Context Protocol"
[9]: https://docs.openhands.dev/openhands/usage/agent-canvas/acp-agents "OpenHands Documentation — ACP Agents"
[10]: https://docs.openhands.dev/openhands/usage/agent-canvas/customize-and-settings "OpenHands Documentation — Customize and Settings"
[11]: https://docs.openhands.dev/sdk/guides/task-tool-set "OpenHands Software Agent SDK — Task Tool Set"
[12]: https://docs.openhands.dev/sdk/guides/convo-persistence "OpenHands Software Agent SDK — Persistence"
[13]: https://docs.openhands.dev/sdk/guides/persistent-memory "OpenHands Software Agent SDK — Persistent Memory"
[14]: https://github.com/OpenHands/automation "OpenHands Automation Service — source repository and README"
[15]: https://docs.openhands.dev/sdk/guides/convo-pause-and-resume "OpenHands Software Agent SDK — Pause and Resume"
[16]: https://docs.openhands.dev/sdk/guides/security "OpenHands Software Agent SDK — Security Guide"
[17]: https://github.com/OpenHands/openhands/blob/main/docs/SELF_HOSTING.md "OpenHands — Self-Hosting Agent Canvas on a Virtual Machine"
[18]: https://docs.openhands.dev/sdk/arch/design "OpenHands Software Agent SDK — Design Principles"
[19]: https://arxiv.org/html/2511.03690v2 "The OpenHands Software Agent SDK: A Composable and Extensible Foundation for Production Agents"
[20]: https://github.com/OpenHands/openhands/blob/main/LICENSE "OpenHands — MIT License"
