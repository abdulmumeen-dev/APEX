# Desktop and always-on agent review for APEX

**Checked:** 14 October 2026. This supplement reads the official product pages and documentation for five products the APEX owner named or referred to: Manus Desktop, Kimi Work, Hermes Desktop, Meta Muse, and OpenAI Dots. These sources document product behavior, not independent security audits. The pages reviewed describe user-facing products; they do not document a stable public control API for APEX to invoke.

## What the official pages document

**Manus Desktop** brings Manus to the user's computer. Its My Computer feature can work with local files, applications, and development tools through the local command line. Users select a folder, grant operating-system access, and approve commands individually (“Allow Once”) or for recurring trusted work (“Always Allow”). The product documentation also describes projects using local files and scheduled local jobs. [1]

**Kimi Work** is a desktop agent for knowledge work. Its page describes working with permitted local folders, using a browser extension for research and multi-step browser tasks, scheduling work to run in the background, coordinating specialized agents, and exporting work to office formats. Its FAQ says users can choose “Ask before acting” so Kimi asks before changing/overwriting files or running code in local folders. The download page lists Mac and Windows versions. [2]

**Hermes Desktop** is a native interface to the same Hermes Agent core used by its CLI and gateway. Its documentation says the app shares configuration, API keys, sessions, Skills, and memory with those other interfaces. It lists macOS, Windows, and Linux support and describes multiple conversations/projects, messaging setup, artifacts, project-folder navigation, an embedded browser/preview, a persistent terminal, profiles, scheduled jobs, and subagents. This is an example of surface parity through shared state rather than a second agent implementation. [3]

**Meta Muse** is a personal agent hosted in a dedicated cloud VM with its own browser. Meta describes a separate Sentinel process that approves outbound internet access, user-selected app permissions, an audit trail, user confirmation for sensitive actions such as sending email or purchasing, and a way to forget remembered details. People interact through the Muse app or WhatsApp. [4]

**OpenAI Dots** are described as always-on agents with their own cloud computer and browser, app integrations, and task context accessible in ChatGPT, Slack, or Teams. OpenAI says idle “proactive research” uses read-only tools; user-defined rules govern what may be allowed, approved, or blocked; and sensitive actions receive review/approval. The page also says a user may separately authorize a dot to connect to their laptop. [5]

> **Name clarification:** Muse is Meta's personal agent. OpenAI's official agent announcement is titled **Introducing dots**. In APEX planning, keep these products distinct.

## Patterns worth translating into APEX

The products are not all the same kind of system. Kimi Work and Manus Desktop emphasize work on the user's actual computer and local files. Hermes Desktop emphasizes a common runtime and shared sessions across desktop, CLI, and gateway. Muse and Dots emphasize long-running work on a dedicated cloud computer, with app connections and approval controls. These are useful architecture patterns, not proof that APEX can integrate directly with those products.

APEX should therefore make **execution location** an explicit choice. The same APEX task/policy contract should eventually run either in a permissioned local workspace or in an isolated remote worker. Before a task starts, the UI should say which machine/model/provider receives its data. Local file grants, browser access, outbound network destinations, credentials, shell/process execution, and side-effect permissions are separate capabilities—not one vague “computer access” toggle.

A desktop interface should be another front end for APEX's runtime, not a separate agent with divergent permissions, memory, or task history. Today the hosted dashboard/API and remote CLI share the server agent loop, while local CLI mode is a separate bounded loop and there is no local dashboard daemon. A local service and a common policy/run/trace contract are prerequisites for true local surface parity. A user should eventually be able to start in the CLI, inspect the same run in the dashboard/desktop app, pause or redirect it, and export an evidence-backed result.

## Recommended APEX build order

1. **Make the current local CLI genuinely approachable.** Keep Ollama setup key-free, explain the one-time local model download, verify the endpoint, and start with tightly scoped project files. A published installer/package is still required before calling it one-click software.
2. **Unify dashboard, API, and CLI state.** Preserve stable run IDs, permission decisions, Skills, artifacts, memory, and trace semantics across surfaces; harmonize the currently separate local and server execution loops through shared contracts.
3. **Build a thin desktop control surface around that same engine.** Add multi-project navigation, setup, run timeline, file/artifact review, and notifications without copying the model/tool loop.
4. **Add computer/browser control only after isolation is real.** Use OS-level folder authorization, a disposable or separately constrained executor, blocked-by-default network egress, short-lived secrets, visible action plans, interruptibility, and action-specific approval. A dialog alone is not a sandbox.
5. **Make long-running work durable before offering always-on behavior.** Persist leases, idempotency, deadlines, retry/backoff, approval waits, cancellation, missed-run policy, and receipts.
6. **Add app/channel adapters only where a documented protocol exists.** Where a vendor only publishes an end-user product, treat it as a product reference, not an integration target.

APEX's additional advantage should be a user-owned, exportable record of what was planned, what data went to which model/service, what permissions were used, which effects were attempted, and what was independently verified. Its interview-coaching use case should remain beneficial and transparent: realistic practice, truthful feedback, and disclosed accessibility support—not covert live answer delivery or impersonation.

## References

[1]: https://manus.im/docs/features/desktop "Desktop - Manus Documentation"
[2]: https://www.kimi.com/en/products/kimi-work "Kimi Work: Next-Gen Desktop AI Agent for Knowledge Workers"
[3]: https://hermes-agent.nousresearch.com/docs/user-guide/desktop "Hermes Desktop | Hermes Agent"
[4]: https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/ "Introducing Muse: The World's First Personal AI Agent Built for Everyone"
[5]: https://openai.com/index/introducing-dots/ "Introducing dots | OpenAI"
