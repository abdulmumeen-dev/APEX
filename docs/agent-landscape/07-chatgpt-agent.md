# OpenAI ChatGPT agent — product capability study

**Evidence cutoff: 2026-10-13.** This review covers the product OpenAI launched as **ChatGPT agent** in July 2025, while making its current status explicit: OpenAI’s current Help Center now says that ChatGPT agent is **no longer available** and directs users to ChatGPT Work for longer, multi-step work and finished deliverables, and to Cloud browser for supported web workflows. The launch page itself is marked “outdated.” [1] [4]

## Product category and core job

**Category:** hosted, general-purpose web-and-tool agent embedded in ChatGPT.

**Core job:** turn a natural-language outcome into a multi-step research-and-action workflow. The agent combines reasoning, web research, browser interaction, code execution, connected data, and document production instead of making the user manually switch between a research assistant and a browser automation tool. OpenAI described it as a system that “thinks and acts” through its own computer, handling complex tasks from start to finish. [2]

The product’s distinctive promise was not simply “answer questions.” It was to move from finding information to doing bounded work: compare options, inspect authenticated sources, fill forms, analyze data, update a spreadsheet, create an editable presentation, or prepare a purchase or booking for user review. OpenAI’s examples included calendar briefing, shopping for a meal, competitor analysis, travel, expenses, spreadsheet updates, and scheduling. [2]

That promise is now best understood as a product lineage rather than a currently selectable product name. The current ChatGPT Work documentation describes Work as the agent for longer, multi-step work and finished deliverables, while Cloud browser supplies the remote browser workflow. [4] [5]

## What it actually did

### Unified tool loop

The launch architecture brought together three previously separate strengths: Deep Research’s multi-step investigation and synthesis, Operator’s visual web interaction, and ChatGPT’s conversational interface. The system card describes the concrete tool surface as a remote visual browser, a terminal with limited network access, and connectors to external data sources such as Google Drive. The launch post additionally describes a text browser and direct API access. [2] [3]

The agent could choose between a text browser for simpler retrieval, a graphical browser for pages designed for humans, a terminal for code and analysis, and connected apps for data access. A single virtual computer preserved task context as it moved between those tools—for example, downloading a file, manipulating it in the terminal, and viewing the result in the browser. [2]

### Research, analysis, and artifact production

The system was designed for web research that required both breadth and interaction. It could search public sites, navigate filters, use authenticated pages after a user takeover, analyze uploaded or downloaded material, and return source links or screenshots. It could create or edit spreadsheets and generate editable slide decks rather than only returning prose. [2] [1]

OpenAI reported strong results on its selected evaluations: 68.9% on BrowseComp, a 17.4-point advantage over Deep Research; 45.5% on its SpreadsheetBench setup compared with 20.0% for Copilot in Excel; and improvement over the prior Operator model on WebArena. These are useful indicators of intended capability, but they are vendor-reported benchmarks and should not be treated as a guarantee of reliable real-world execution. [2]

### Interactive delegation rather than unattended autonomy

The interaction model was deliberately collaborative. The agent could ask clarifying questions, be interrupted, receive new instructions, pause, provide a progress summary, stop with partial results, or resume after the user took control of the browser. OpenAI also described on-screen narration and mobile completion notifications. Consequential actions were supposed to trigger a confirmation request. [2]

This is an important design choice: the user delegates a goal, but retains intervention points. It is closer to supervised execution than to an unrestricted background bot.

### Connected information and recurring work

ChatGPT connectors allowed the agent to use services such as Gmail, GitHub, Google Drive, and calendar data, subject to authentication and connector permissions. The launch documentation distinguished reading through a connector from taking action on a site: actions could still require the user to take over the browser and sign in. [2]

The original product also allowed a completed task to recur, such as generating a weekly metrics report. The broader ChatGPT scheduling system documented at the cutoff supports one-time and recurring tasks, monitoring tasks, and—in Work—event-triggered workflows for supported Gmail, Slack, and GitHub activity. Tasks can be reviewed, paused, edited, resumed, deleted, and notified by push or email. [7]

Because the current scheduling article describes Work rather than the retired agent-mode surface, these newer triggers should be treated as successor-platform evidence, not as proof that every trigger was available in the original ChatGPT agent.

## Strongest design choices

**1. One planner over heterogeneous tools.** The most consequential product decision was to train one agent to select among text browsing, visual browsing, terminal work, and connected data. This reduces the user’s need to know which subsystem is appropriate and avoids the old split in which Operator could act on pages but struggled with long-form synthesis, while Deep Research could analyze but could not interact deeply with authenticated or highly visual sites. [2] [9]

**2. A stateful virtual computer.** Keeping browser, files, terminal output, and visual state in one remote environment makes multi-step tasks coherent. It also creates a clear security boundary: the agent operates a disposable or managed remote session rather than silently controlling the user’s personal browser. The trade-off is that the remote session can be confusing when the user expects results to appear in their own browser. [2] [10]

**3. Human checkpoints at consequential boundaries.** Confirmation before purchases, messages, bookings, account changes, or other state-changing actions is a practical control against both model mistakes and prompt injection. The product paired this with browser takeover so the user could personally enter credentials or take over a stuck step. [2] [3] [5]

**4. Tool-specific safety controls.** OpenAI did not rely only on a generic refusal policy. The system card describes prompt-injection training, automated monitors and filters, Watch Mode for sensitive visual-browser sessions, terminal network restrictions, and disabling ChatGPT memory at launch. This layered approach recognizes that web content is untrusted input and that the action surface changes the risk profile. [3]

**5. Deliverables, not just conversation.** Editable spreadsheets and slide decks, with citations and intermediate visibility, make the agent useful in professional workflows. The design targets a completed artifact that can be inspected and edited, not merely a text answer that leaves the user to perform the operational work. [1] [2]

## Documented limitations

The following are limitations or constraints documented by OpenAI, not inferences from silence:

- **The product is retired as a separate ChatGPT feature at the cutoff.** The current agent Help Center overview says ChatGPT agent is no longer available and directs users to Work and Cloud browser. Later sections of that same legacy article still describe agent-mode plans and limits, so the explicit retirement notice and the newer Work/Cloud-browser documentation should take precedence over those legacy details. [1] [4] [5]
- **Availability and usage were plan-gated.** At launch, agent mode was for paid plans rather than Free. The legacy article listed monthly invocation limits of 40 for Plus, 400 for Pro, and 40 for Business/Enterprise, plus reasonable rate and concurrency limits. Those figures describe the legacy agent surface and should not be read as current Work pricing. [1] [2]
- **Website compatibility is not guaranteed.** Current Cloud browser documentation says a website may block automated-browser traffic even when it works in a normal browser. Support varies by site, user access, and the exact action; some transactions require the user to complete the final step. This is the successor documentation, but it directly describes the same remote-browser deployment constraint. [5]
- **Authentication is an explicit handoff.** In the legacy agent, login required browser takeover. The current Cloud browser uses a secure sign-in flow and pauses for sign-in, two-factor authentication, or confirmation. The remote browser has its own cookies and sessions; it does not inherit the user’s open tabs, saved passwords, or personal-browser logins. [1] [5]
- **Consequential actions remain gated.** The system was designed to request confirmation before actions that affect the external world, such as completing a purchase or sending an email. Some actions can be blocked rather than offered for approval, and Watch Mode may require supervision in sensitive contexts. [1] [3] [5]
- **Prompt injection is a material residual risk.** OpenAI explicitly says that malicious instructions embedded in web pages can induce data exfiltration or unintended actions. The system card reports visual-browser results of 95% for ignoring irrelevant instructions, 78% for in-context data-exfiltration attempts, and 67% for active data-exfiltration attempts; it also reports 91% confirmation recall. These are evaluation results, not a claim that the attacks are solved. [3]
- **The original terminal was deliberately constrained.** At launch, terminal network requests were restricted, including a limitation to GET requests for certain downloads and datasets. The system card also states that memory was disabled at launch as a prompt-injection mitigation. [3]
- **Data and screenshots were part of the hosted service.** The legacy help article says chats, agent browsing history, and screenshots remained in conversation history until deletion; deleting a chat deleted associated screenshots, with deletion from systems within 90 days. It also says authorized OpenAI personnel and trusted providers could access content under controlled conditions for abuse/security investigation, support, legal matters, or—unless opted out—model improvement. [1]
- **Privacy controls differ by plan.** The legacy article says Business, Enterprise, and Edu data is not used for training by default, while Plus and Pro data follows the consumer privacy policy and can be excluded from model improvement through Data Controls. More generally, OpenAI documents separate controls for training, temporary chats, memory, retention, exports, and managed-workspace policy. [1] [8]
- **Custom MCP action support was not universal.** Current MCP documentation says full MCP support, including write/modify actions, is beta for Business, Enterprise, and Edu; Pro users can connect MCPs with read/fetch permissions. It also states that ChatGPT agent mode will not use custom apps, while Deep Research supports only read/fetch actions through them. [6]

## Independent evidence on practical gaps

Two independent hands-on reports temper the launch claims. **Understanding AI** found the agent much better than Operator at a grocery-cart task, but it still missed one item and encountered a login/security block until the reviewer explicitly clarified the intended login. The reviewer concluded that the product was not yet reliable enough for important tasks. [9]

**The Verge** reported that the agent was very slow, claimed to have added items to an Etsy cart that was not visible in the reviewer’s own browser, and behaved inconsistently around purchases and account actions. In the test, it could be useful for comparing options and writing recommendations but struggled with the final operational steps. [10]

These reports are not official product limits, and they are point-in-time tests. They do, however, expose a general operational risk: a remote agent can produce a plausible completion narrative even when the resulting external state is ambiguous or inaccessible to the user. The appropriate product response is verification-oriented run state and evidence, not simply more fluent narration.

## Security, trust, and deployment model

The deployment model is **hosted and remote by default**. The original agent ran on its own virtual computer with a visual browser, terminal, and connectors. The current Cloud browser documentation makes the boundary explicit: Work receives a separate browser on a remote computer in the cloud, can continue after the user leaves, pauses when it needs input, and keeps its own cookies and signed-in sessions. [2] [3] [5]

Trust is enforced through several layers:

1. **Model and policy behavior:** safety training, refusal behavior, and prompt-injection robustness training.
2. **Runtime monitors:** automated prompt-injection monitoring and filters that can block suspicious navigation or data movement.
3. **Permission boundaries:** connector permissions, website-access permissions, terminal network restrictions, and secure sign-in flows.
4. **Human approval:** confirmation before consequential actions, user takeover for credentials or stuck workflows, and Watch Mode in sensitive contexts.
5. **Organizational controls:** workspace admins, RBAC, app vetting, and compliance access in managed plans. [3] [5] [6]

The model cannot make these controls perfect. OpenAI’s own system card frames prompt injection as adversarial and reports non-zero failure rates. The current Cloud browser guide likewise says safeguards do not eliminate every risk and tells users to inspect URLs, sign-in previews, screenshots, and confirmation requests. [3] [5]

## Integrations and automation

The integration pattern is connector- and app-centric. First-party connectors provide access to information in services such as Gmail, GitHub, Google Drive, and calendar systems. Newer ChatGPT Apps/MCP support can combine multiple apps in one prompt, and vetted custom MCP apps can perform write or modify actions in eligible managed workspaces. Admins can review app permissions, publish approved apps, and use RBAC. [2] [6]

Automation has two layers. The original agent offered recurring completed tasks. The current scheduling system adds a managed task registry, notifications, monitoring, and event triggers for supported Gmail, Slack, and GitHub events in Work. It also exposes practical controls that matter for an agent platform: trigger/condition/prompt review, pause/resume, approval pauses, active-task limits, and an explanation when a task stops responding. [7]

The integration model is strong for SaaS workflows but is not the same as an open agent network. MCP provides a tool/app protocol, while the product’s documented controls focus on trusted connectors and workspace administration. The sources do not establish a general first-party protocol for delegating work to arbitrary peer agents; that distinction matters for APEX’s optional agent-bridging goal.

## Openness, licensing, and portability

ChatGPT agent is a **proprietary hosted product capability**, not an open-source distribution. OpenAI’s product documentation describes a ChatGPT plan feature backed by OpenAI’s hosted model and managed virtual computer; it does not publish the agent runtime, policy stack, browser sandbox, model weights, or a product source license. The current MCP documentation exposes an extension surface, but extensibility is not the same as releasing the agent implementation. [1] [2] [3] [6]

This conclusion is deliberately scoped: no official ChatGPT-agent source repository or license is identified in the product sources reviewed, which is evidence about the published product surface, not proof that no internal or adjacent component is open source. The user’s APEX goal—user-chosen API, server, or local model plus an independently controlled core—therefore occupies a different governance and portability position.

## Lessons and opportunities for APEX

These are design lessons, not a recommendation to clone ChatGPT agent:

- **Make the model a replaceable dependency.** Preserve the useful unified tool loop, but put model selection behind a stable capability interface. APEX should be able to route a task to a hosted API, a self-hosted server, or a local model while keeping tool contracts, approvals, memory, and run history stable.
- **Treat the execution environment as a first-class object.** Expose whether a run is local, self-hosted, or provider-hosted; what data it can see; what network egress it has; and which browser/session it controls. The ChatGPT agent experience shows why users must not confuse a remote browser cart or login with state in their personal browser.
- **Build evidence-backed completion, not only narration.** Store tool calls, URLs, screenshots or DOM evidence where permitted, changed files, external transaction IDs, and a final state check. The independent cart and order tests show that “I did it” is not enough when the user cannot verify the resulting state.
- **Separate intent, planning, execution, and approval.** Use typed action plans with risk classes and explicit approval checkpoints. Allow approval policies to be scoped by tool, domain, data class, amount, reversibility, and user role. Make it possible to deny a write capability without disabling read/search capability.
- **Make prompt-injection defense inspectable and replaceable.** Layer content labeling, tool-argument validation, destination allowlists, secret/data-flow rules, sandboxing, and human approval. Publish red-team scenarios and measured failure rates. OpenAI’s system card is useful as a baseline, but APEX can make the policy and monitor components auditable by operators.
- **Design memory as user-owned infrastructure.** The launch system card disabled memory for safety, while agent history and screenshots had retention implications. APEX can offer explicit, versioned memory stores with provenance, per-run scopes, retention/deletion controls, and a visible “what the agent knows” view rather than treating conversation history as an implicit memory layer.
- **Make automation durable and debuggable.** Provide a task registry with schedules, event triggers, conditions, retries, approval waits, leases, notifications, idempotency keys, and run-by-run replay. A paused task should explain exactly whether it needs authorization, a human decision, a connector refresh, or a tool retry.
- **Use adapters instead of vendor lock-in.** Support browser automation, local tools, remote tools, MCP, and ordinary HTTP/API tools through a common permissioned adapter model. Keep connector credentials and execution policies outside model prompts.
- **Treat agent-to-agent bridging as a separate trust boundary.** If APEX delegates to another agent, record the peer identity, delegated scope, budget, data entitlements, return contract, and approval chain. Do not assume that an app/tool protocol alone provides safe peer-agent delegation.
- **Offer deployment choices explicitly.** APEX can differentiate itself with reproducible local and self-hosted deployments, while still allowing a managed runner for users who want convenience. Make provider-hosted execution an explicit choice with data-residency, retention, network, and cost disclosures.
- **Measure real task reliability.** Pair benchmark scores with task-specific success criteria: external-state verification, recovery after auth, latency, cost, partial completion quality, and rate of unsafe or unauthorized actions. Report both success and false-completion rates.

## References

[1]: https://help.openai.com/en/articles/11752874-chatgpt-agent "ChatGPT agent — OpenAI Help Center"
[2]: https://openai.com/index/introducing-chatgpt-agent/ "Introducing ChatGPT agent: bridging research and action — OpenAI"
[3]: https://cdn.openai.com/pdf/839e66fc-602c-48bf-81d3-b21eacc3459d/chatgpt_agent_system_card.pdf "ChatGPT agent System Card — OpenAI"
[4]: https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex "ChatGPT Work and Codex — OpenAI Help Center"
[5]: https://help.openai.com/en/articles/20001280-using-cloud-browser-in-chatgpt "Using cloud browser in ChatGPT — OpenAI Help Center"
[6]: https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt "Developer mode and MCP apps in ChatGPT — OpenAI Help Center"
[7]: https://help.openai.com/en/articles/10291617-scheduled-tasks-in-chatgpt "Scheduled tasks in ChatGPT — OpenAI Help Center"
[8]: https://help.openai.com/en/articles/7730893-data-controls-in-chatgpt "Data controls in ChatGPT — OpenAI Help Center"
[9]: https://www.understandingai.org/p/chatgpt-agent-a-big-improvement-but "ChatGPT Agent: a big improvement but still not very useful — Understanding AI"
[10]: https://www.theverge.com/ai-artificial-intelligence/710020/openai-review-test-new-release-chatgpt-agent-operator-deep-research-pro-200-subscription "I sent ChatGPT Agent out to shop for me — The Verge"
[11]: https://help.openai.com/en/articles/11794368-chatgpt-agent-release-notes "ChatGPT agent — release notes — OpenAI Help Center"
