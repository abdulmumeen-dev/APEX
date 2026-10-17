# xAI Grok Build (`xai-org/grok-build`): product-capability review

**Evidence cut-off: 2026-10-13.** This review covers exactly one product: Grok Build, the open-source `grok` terminal coding-agent harness and TUI. It evaluates the product as evidence for APEX, which is intended to be an independent open-source general-purpose agent with user-selected model providers, its own tools, memory, automation, approvals, and run history.

## Product identity and core job

Grok Build is a **coding-agent runtime and terminal user interface**, not a general-purpose model or model-weight release. Its job is to turn a developer's repository and a natural-language objective into an interactive or automated software-engineering loop: assemble context, ask a model, dispatch tools, modify files, run commands, inspect results, and continue until the work is done. The official repository describes a full-screen TUI that understands a codebase, edits files, executes shell commands, searches the web, and manages long-running tasks. It exposes the same harness interactively, headlessly for scripts and CI, or through the Agent Client Protocol (ACP) for editor embedding. [1]

The open-source release is unusually useful for a capability study because xAI says the published tree includes the agent loop, context assembly, model-response parsing, tool-call dispatch, tools, TUI, and extension loading. It is a periodically synced source tree from xAI's monorepo, rather than a history-rich community project. [1] [2]

## What it actually does

### Agent loop and coding tools

The baseline loop can read and search a repository, edit and write files, execute terminal commands, and use web search. The source layout separates the TUI (`xai-grok-pager`), runtime and headless/stdio entry points (`xai-grok-shell`), tools, and workspace/VCS/execution/checkpoint logic. [1] The user-facing docs add web fetching, optional LSP tools, a structured todo list, context inspection and compaction, and inline diff/plan review surfaces. [4] [13]

Project rules are a first-class context mechanism. Grok discovers `AGENTS.md` variants and compatible instruction files such as `CLAUDE.md`, scoped from the repository root to the working directory, and exposes `grok inspect` to show what it discovered. This makes repository-local conventions, test commands, and architecture notes persistent inputs rather than prompt boilerplate. [16]

### Three delivery surfaces

* **Interactive TUI:** a mouse-aware, full-screen terminal experience with slash commands, scrollback, a diff viewer, session controls, model switching, plan review, and an extensions modal. [1] [4]
* **Headless CLI:** `grok -p` accepts one prompt and can emit plain text, one final JSON object, or newline-delimited streaming JSON. Sessions can be named, resumed, or continued, making the CLI suitable for scripts, bots, and CI. [11]
* **ACP:** `grok agent stdio` speaks JSON-RPC over stdin/stdout for IDE or host-application integration. The official example shows initialize, authenticate, create a session, prompt, and consume streamed `session/update` events. [11]

This is a strong separation of presentation from the runtime: an operator can use the TUI, a pipeline can use structured output, and an editor can host the same agent without inventing a second implementation.

### Planning, parallelism, and long-running work

Plan mode lets the agent explore first and limits edits to the plan file until a human approves. The review remains mandatory even in auto or always-approve modes. Sessions can be resumed, forked, rewound to a prior prompt/file snapshot, compacted, exported, and run in isolated worktrees when branching. [14] [10]

Subagents are independent child sessions with their own context and a summary returned to the parent. Built-in types include full-capability `general-purpose`, read-only `explore`, and no-shell/no-edit `plan`; types and personas can be configured. [8]

The product also has a task layer beyond todos: background commands, subagents, and monitors continue while the conversation proceeds; `/loop` schedules a recurring prompt, with a documented minimum interval of 60 seconds, a seven-day expiry, and a maximum of 50 active scheduled tasks. Workflows fan out bounded subagents, verify results, and save runnable workflow files under the project or user profile. [15] [4] These are real automation primitives, not merely a “run this command” button.

### Memory and run history

Every conversation is saved automatically under `~/.grok/sessions/`, keyed by working directory; stored content includes prompts, responses, tool calls, and file snapshots. The product supports session search, export, deletion, resume, fork, rewind, and structured todos. [10] A separate optional memory subsystem can persist cross-session knowledge, inject relevant memories on the first turn, watch memory files, and use full-text retrieval or embeddings when configured. [13]

The important design distinction is between **session history** (automatic transcript/snapshot persistence) and **cross-session memory** (an explicit optional subsystem). APEX should preserve that distinction rather than treating all prior context as one undifferentiated memory store.

### Model choice and provider flexibility

Grok Build is not restricted to a single hard-coded inference endpoint. The current docs show user-defined models with a model ID, base URL, display name, API-key environment variable, protocol selection (`chat_completions`, `responses`, or `messages`), context-window size, sampling controls, retry/timeout settings, extra headers, and reasoning support. xAI explicitly describes custom-model support and says the source can be compiled and pointed at local inference. [3] [13] [2]

That is materially aligned with APEX's user-chosen API, server, or local model requirement. The practical boundary is that the documented adapters are OpenAI-compatible or Anthropic Messages-style endpoints; a provider outside those protocols needs an adapter or gateway. This is a **documented interface constraint**, not evidence that arbitrary model backends are impossible.

### Extension and compatibility surface

Grok has a layered extension system:

* **Skills** are reusable folders containing Markdown instructions, scripts, and resources, discovered from project, user, plugin, or configured paths.
* **Plugins** can add skills, agents, hooks, MCP servers, and LSP servers.
* **Hooks** run shell commands or HTTP endpoints on lifecycle events.
* **MCP servers** expose external tools, locally over stdio or remotely over HTTP, with environment-variable expansion, OAuth, headers, timeouts, and project scope.
* **Marketplaces** browse and install plugins from configured sources.

[5] [6] [7]

Compatibility is a deliberate adoption strategy. Grok reads Claude Code marketplaces, plugins, skills, MCPs, agents, hooks, and instruction files, plus the `AGENTS.md` family and user-level agent skills/commands. It also scans Cursor MCP, rules, skills, agents, and hooks, with configuration switches to disable those scanners. [5] [13]

## Strongest design choices

1. **One runtime, three integration modes.** TUI, structured headless CLI, and ACP share the same agent core. That avoids the common failure mode where the interactive product is powerful but the automation API is an afterthought. [1] [11]
2. **A real approval boundary.** Permissions and sandboxing are explicitly separate: permissions decide whether a tool call may run, while the sandbox limits what an approved call can read, write, or reach. Ask, auto, and always-approve modes, allow/deny patterns, plan-mode gates, and a noninteractive `dontAsk` mode compose into an understandable control model. [9] [8]
3. **Planning is a product surface, not just a prompt.** The plan file, review UI, comments, approval, rewind, and worktree options make proposed change review visible and reversible. Plan review is not silently bypassed by auto-approval. [14] [10]
4. **Extensibility at the right seams.** Skills handle repeatable instructions, plugins package capabilities, MCP handles external tools, hooks handle lifecycle policy, and subagents handle parallel context windows. This gives users multiple extension scopes instead of forcing every integration into a monolithic tool registry. [5] [6] [7]
5. **Repository-native context.** Hierarchical rules, `grok inspect`, git-aware workspace handling, todos, snapshots, and context compaction make the working tree a durable operating context. [16] [10]
6. **BYOK/local-inference path.** A configurable endpoint and environment-backed credentials make the harness separable from xAI's model service. The source release also makes the agent loop and tool dispatch inspectable. [2] [3] [13]
7. **Enterprise policy hooks exist at the configuration layer.** Managed config and high-priority `requirements.toml` can pin sandbox, tools, feature flags, and permission controls so user config cannot override compliance-critical settings. Enterprise OIDC, device auth, external token brokers, TLS controls, proxy support, and team-level ZDR are documented. [12]

## Documented limitations and caveats

These are limitations stated by the product's own current documentation or repository, not assumptions based on missing search results.

* **Safety defaults are permissive:** the sandbox is off by default. In the built-in `read-only` and `strict` profiles, child-network enforcement is Linux-only and is a no-op on macOS. The sandbox does not permanently protect paths such as `~/.ssh` unless the operator adds a custom deny list, leaves `~/.grok/` writable for persistence, and does not block the model API or web tools' in-process network. [8]
* **Plan mode is not a full process sandbox:** it limits edit tools, but Bash can still write through shell redirection. Subagents are not edit-gated by the parent's plan mode. [14]
* **Hooks fail open on operational failure:** only an explicit `deny` response or exit code 2 blocks a `PreToolUse` call. Timeouts, crashes, malformed output, and other failures are recorded but the tool proceeds. [7]
* **Platform support is uneven:** official binaries target macOS, Linux, and Windows, but the source README says macOS/Linux are supported build hosts and Windows builds are best-effort and not currently tested from the tree. [1]
* **Local sessions are durable by default:** prompts, responses, tool calls, and file snapshots are written to `~/.grok/sessions/`. This is useful for recovery but creates a local sensitive-data store that must be protected and governed. [10]
* **Automation is bounded:** `/loop` jobs expire after seven days and at most 50 scheduled tasks may be active. That is appropriate for developer loops, not a complete durable scheduler or event-trigger platform. [15]
* **Project trust is selective:** project hooks require explicit trust; that trust also covers project MCP and LSP servers. Remote MCP OAuth tokens are stored under `~/.grok/mcp_credentials.json`. [6] [7]
* **Openness is source transparency, not open governance:** the repository is Apache-2.0, but its contribution policy explicitly rejects external pull requests and unsolicited patches. [1] [18]

### Security and privacy history

The deployment model deserves special caution because a serious privacy event occurred early in the product's life. Independent wire-level research on Grok Build 0.2.93 reported a separate background Git-bundle upload containing tracked repository content and full Git history, including a canary file the agent had not read; the researcher also reported that disabling “Improve the model” did not stop that transmission. The research explicitly distinguishes proven transmission/server acceptance from unproven model training, employee access, or identical behavior for every account. [21]

The Register reported that xAI later disabled the behavior server-side, promised deletion of previously stored data, and said retention was turned off by default from July 12, 2026. It also reported the open-source release as a trust response. [20] Simon Willison's independent code review noted that upload-related code remained in the released tree, but appeared disabled, and that the initial public repository had only a single commit with no development history. [22]

The current official enterprise documentation describes a more controlled lifecycle: prompts and assembled file content travel over TLS to the inference proxy, tool execution occurs locally, and team-level ZDR avoids inference-layer persistence for ZDR organizations; local session history still lives under `~/.grok/`. [12] That is the **current documented model**, not proof that the historical incident never occurred. For APEX, the key lesson is that “training opt-out,” “retention,” “session sync,” and “repository transmission” must be separate, inspectable controls.

## Integrations, automation, security, and deployment model

Grok Build is primarily a local CLI process with local tool execution and remote or user-selected inference. Authentication can be browser OIDC, device code, an external auth-provider command, or an API key. Enterprise deployment supports standard HTTPS proxy variables, TLS 1.2/1.3 via `rustls`, enterprise OIDC, managed config, system-level policy pins, and API-key or custom endpoint credentials supplied through environment variables. [12] [13]

For integrations, ACP is the clean host protocol; headless JSON/streaming-JSON is the clean scripting interface; MCP is the external-tool protocol; hooks are the lifecycle-policy/notification interface; plugins and marketplaces are packaging/distribution; and Claude/Cursor compatibility reduces migration cost. The agent can also run background commands, monitors, recurring prompts, saved workflows, and parallel subagents. [11] [5] [6] [7] [15]

The security model is layered but not automatically safe: permission rules and explicit approvals gate actions; sandbox profiles constrain approved child processes; hooks can block pre-tool actions; project extensions require trust; and enterprise requirements can lock down bypass permissions. The default-off sandbox and fail-open hook behavior mean that a security-sensitive deployment must deliberately choose a strict profile, narrow allow rules, deny dangerous patterns, restrict egress, and use managed pins. [8] [9] [7] [12]

## Openness and licensing

The first-party repository code is Apache License 2.0, including the normal copyright, redistribution, modification-notice, and patent-license terms. Third-party and vendored components remain under their original licenses and are enumerated in notices. [1] [19] This is permissive enough for APEX to study, fork, embed, or adapt code subject to license and attribution obligations.

The practical openness is narrower than the license alone suggests. The repository is periodically synced from an internal monorepo, the root workspace manifest is generated and should be treated as read-only, external contributions are not accepted, and there is no public development history to audit. [1] [18] The result is **auditable and locally buildable source**, but not a community-governed project with an open roadmap or contribution loop. It also does not open-source xAI's model weights or make the hosted inference service independent of xAI; local inference is a configurable deployment option, not the product's only mode. [2] [3]

## Carefully labeled gap inferences for APEX

The following are hypotheses for APEX design, not claims that Grok Build definitively lacks these features.

* **General-purpose scope:** the documented center of gravity is repository work. APEX can make domain-neutral task orchestration a first-class layer, with coding as one tool/skill pack rather than the product's identity.
* **Provider-neutral contract:** Grok's custom-model support is strong, but its documented protocols are OpenAI-compatible and Anthropic Messages. APEX can define a stable internal model/tool/event contract and isolate provider quirks behind adapters, so local, server, and API models behave consistently without requiring a gateway.
* **Durable automation:** Grok's loops, workflows, monitors, and background tasks are useful but developer-session oriented. APEX can offer a durable scheduler/event trigger plane with explicit run leases, retries, cancellation, budgets, time zones, and durable state rather than expiring in-process loops.
* **First-class run ledger:** Grok has excellent transcript/session persistence, snapshots, export, and resume. APEX can go further with a provider-neutral, append-only run ledger that records model identity, effective policy, approvals, tool inputs/outputs, artifacts, costs, hashes, and data-egress decisions for replay and audit. This is an opportunity inferred from the reviewed docs; it is not a finding that Grok's internal history is inadequate.
* **Policy as data boundary:** the historical upload incident shows why approval of a tool call is not the same as approval for data leaving the machine. APEX can make every egress path explicit: per-model endpoint, web search, MCP server, plugin, telemetry, retention, and artifact upload, with preflight summaries and independently testable deny rules.
* **Fail-closed safety:** Grok's hook contract is powerful but fail-open on hook failure. APEX can offer fail-closed mode for security-critical hooks, separate from a compatibility mode that mirrors Grok behavior, and make the choice visible per deployment.
* **Capability-scoped extensions:** plugins, MCP servers, skills, and hooks are composable, but each can expand the trust surface. APEX can attach signed manifests, declared capabilities, per-extension filesystem/network scopes, secret leases, provenance, and revocation to every extension rather than relying mainly on project trust and broad process sandboxing.
* **Portable memory:** Grok separates sessions from optional memory, which is a good baseline. APEX can make memory stores provider-independent, inspectable, exportable, deletable, and policy-filtered, with clear provenance and per-memory retention rather than only file-oriented configuration.
* **Open governance:** Apache-2.0 reuse is valuable, but the no-external-contributions model leaves an opportunity for APEX to pair permissive licensing with public tests, threat models, reproducible builds, transparent release history, and a real maintainer/contributor process.
* **Approval ergonomics for non-code work:** Grok's plan/diff workflow is optimized for software changes. APEX can generalize approval objects to emails, purchases, data mutations, external-agent delegation, and scheduled actions, showing intended side effects and rollback options before execution.

## Bottom line

Grok Build is best understood as a **large, polished, extensible coding-agent harness** whose strongest ideas are its shared TUI/headless/ACP runtime, configurable model endpoints, repository-native context, plan-and-approval surface, local session recovery, MCP/plugin/hook seams, and managed deployment controls. It is a strong reference for APEX's execution kernel and host interfaces, but it is not a blueprint for a vendor-neutral general-purpose agent by itself.

APEX should borrow the separations that make Grok Build legible—model versus harness, permission versus sandbox, session history versus memory, skill versus plugin versus MCP, interactive versus headless—but improve the trust boundary and generality. The clearest opportunities are explicit egress consent, durable and auditable runs, fail-closed policy options, capability-scoped extensions, portable memory, and open governance. Those differences would make APEX an independent system rather than a clone.

## References

[1]: https://github.com/xai-org/grok-build "GitHub — xai-org/grok-build repository"
[2]: https://x.ai/news/grok-build-open-source "Grok Build is Now Open Source — xAI"
[3]: https://docs.x.ai/build/overview "Grok Build — xAI developer documentation overview"
[4]: https://docs.x.ai/build/modes-and-commands "Modes and Commands — xAI Grok Build documentation"
[5]: https://docs.x.ai/build/features/skills-plugins-marketplaces "Skills, Plugins & Marketplaces — xAI Grok Build documentation"
[6]: https://docs.x.ai/build/features/mcp-servers "MCP Servers — xAI Grok Build documentation"
[7]: https://docs.x.ai/build/features/hooks "Hooks — xAI Grok Build documentation"
[8]: https://docs.x.ai/build/features/sandbox "Sandbox — xAI Grok Build documentation"
[9]: https://docs.x.ai/build/features/permissions "Permissions — xAI Grok Build documentation"
[10]: https://docs.x.ai/build/features/sessions "Sessions — xAI Grok Build documentation"
[11]: https://docs.x.ai/build/cli/headless-scripting "Headless & Scripting — xAI Grok Build documentation"
[12]: https://docs.x.ai/build/enterprise "Enterprise Deployments — xAI Grok Build documentation"
[13]: https://docs.x.ai/build/settings/reference "Settings Reference — xAI Grok Build documentation"
[14]: https://docs.x.ai/build/features/plan-mode "Plan Mode — xAI Grok Build documentation"
[15]: https://docs.x.ai/build/features/background-tasks "Background Tasks — xAI Grok Build documentation"
[16]: https://docs.x.ai/build/features/project-rules "AGENTS.md / Project Rules — xAI Grok Build documentation"
[17]: https://github.com/xai-org/grok-build/blob/main/SECURITY.md "Security Policy — xai-org/grok-build"
[18]: https://github.com/xai-org/grok-build/blob/main/CONTRIBUTING.md "Contributing — xai-org/grok-build"
[19]: https://github.com/xai-org/grok-build/blob/main/LICENSE "Apache License 2.0 — xai-org/grok-build"
[20]: https://www.theregister.com/ai-and-ml/2026/07/16/spacex-open-sources-grok-build-after-data-retention-furore/5272333 "SpaceX open sources Grok Build in same week company was found beaming users' repos to the cloud — The Register"
[21]: https://hivesecurity.gitlab.io/blog/grok-build-repository-upload-2026/ "Grok Build Uploaded Entire Git Repositories: What the Wire Capture Proved — Hive Security"
[22]: https://simonwillison.net/2026/Jul/15/grok-build/ "xai-org/grok-build, now open source — Simon Willison's Weblog"
