# Manus Cue: product-capability review

**Evidence checked:** 2026-10-13
**Product in scope:** **Manus Cue**, the hosted general-purpose agent product from Manus. This review treats Cue as the product being evaluated, while using Manus-wide/API/Trust documentation only where it explicitly describes Cue’s shared infrastructure or the controls that govern Cue agents.

Cue is a **hosted personal-agent workspace** rather than a local agent framework. Its core job is to let a user delegate open-ended personal and work tasks to persistent agents, then give those agents enough identity, communications, payment, computing, integrations, and automation to carry work through while the user is away. Manus describes it as a standalone mobile/desktop app built on the same infrastructure as Manus; each agent has its own email, phone number, wallet, and computer. [1] [2] A credible independent launch report corroborates that positioning and the identity primitives. [3]

## Core job and operating model

Cue turns a chat instruction into an ongoing delegation relationship. A user defines an agent’s responsibility and context, connects services, sets review boundaries, and reviews work as it progresses. The product landing page presents examples that go beyond answering: arranging travel and repairs, calling a clinic, booking appointments, monitoring price or registration events, preparing research, and paying when permitted. [4]

The key design move is to make an agent a **first-class actor with durable identity**, not merely a chat session. Cue’s official FAQ says an agent can have its own email address, computer workspace, phone number, and wallet, with user-controlled access and approval requirements. [4] That lets the agent communicate as itself, retain a dedicated workspace, receive calls, send messages, and make payments within the user’s permissions. Manus’s launch post says agents can take calls and leave a summary in Cue, and can pay within a budget the user sets. [1]

Cue also supports a **team-of-agents** mode. Several agents can work in a shared group chat toward one goal and hand work to each other—for example, research venues, create a shortlist, and draft a deck. [1] [2] This is an orchestration pattern exposed as a product interaction rather than as a developer-only multi-agent API.

The product is therefore best categorized as a **hosted general-purpose personal/work agent with communications, payments, integrations, automation, and multi-agent collaboration**, not as an open-source runtime or a model-serving platform.

## Actual capabilities

### Agent identity and execution surfaces

Each Cue agent can have:

- **Phone:** make and take calls and send messages from its own number.
- **Mail:** send and receive from its own email address.
- **Wallet:** make payments subject to user-controlled permissions/budget.
- **Computer:** work in a dedicated workspace with the apps and tools it needs.

These are product claims documented on Cue’s landing page and repeated in Manus’s official launch/help material. [1] [2] [4] The launch material also describes scan-to-create flows in which a restaurant or other service QR code can create an agent that orders or holds a place in line. [1] [4]

### General-purpose work

Cue is designed for mixed personal and work execution: research, shopping and bookings, communication, administrative follow-up, money management, reminders, and creative/work tasks. Examples include drafting email, checking availability, arranging services, comparing options, calling a business, and adding confirmed details to a calendar. [4] These examples establish intended workflows, not a guarantee that every third-party site, jurisdiction, or transaction will work.

### Messaging and service integrations

Cue agents can connect multiple messaging platforms to the same agent and keep several enabled at once. The current official help article lists **iMessage, Telegram, LINE, and Slack**. [5] Cue’s product page separately highlights connected everyday services such as Trip.com, Oura, Gmail, and MyFitnessPal, and says “more apps” can be used for routines. [4]

The shared Manus connector layer is broader than Cue’s explicitly advertised consumer set. Official API documentation lists OAuth-authorized connectors including Gmail, Google Calendar, Google Drive, Notion, Slack, GitHub, Shopify-related services, Linear, Asana, monday.com, HubSpot, Stripe, Dropbox, Outlook, and many others, plus MCP-based and custom integration paths. [6] This is evidence of the platform’s integration substrate; it should not be read as proof that every listed connector is exposed identically in every Cue client or plan.

### Automation and monitoring

Cue can create a **scheduled automation by describing what should happen and when**. [2] Manus’s automation documentation describes schedules (one-time, daily, weekdays, weekly, monthly, custom patterns, or cron expressions), event-triggered work, webhook triggers, and advanced natural-language automations. [7]

Documented trigger sources include Gmail, Outlook Mail, Mail Manus, Google Calendar, Outlook Calendar, GitHub, Shopify, Slack, Notion, Google Workspace, Meta Ads, Google Ads, Instagram, RSS, and webhooks. [7] Runs appear in an Updates view. Users can test before enabling, require confirmation for work that sends or publishes, pause/edit/delete automations, inspect failed runs, and ask Manus to explain or fix a failed run. [7]

A useful run-continuity choice is documented: each run can reuse the **same task**—retaining earlier messages, files, and results—or start a **new task**; a Project can supply shared instructions and skills. [7] Manus’s API exposes asynchronous task status, event history, task listing, stopping, deletion, artifacts, and webhooks. [6] [8]

### Human-in-the-loop controls

The API’s task lifecycle makes approval a real state rather than a vague UI promise. A task can enter `waiting` for a user question or an action confirmation. For supported actions, the caller must inspect the pending event and its `confirm_input_schema` before confirming. Unrecognized waiting types must not be auto-approved; an ordinary message can skip a pending action. [8] The confirmation API explicitly warns that successful submission of a confirmation does not mean the external operation completed successfully. [9]

Cue’s consumer-facing control is simpler: the user sets review boundaries and the agent brings work back when a decision needs the user. [4] The automation UI offers “Approval required” versus “No approval needed” for work that sends or publishes. [7]

## Strongest design choices

1. **Identity is an execution primitive.** Giving every agent a phone, email, wallet, and computer creates a clean boundary for responsibility, permissions, and auditability. It also makes “delegate this” more natural than “run this prompt.” [1] [4]

2. **Persistence is tied to a workspace and task history.** The dedicated computer and same-task automation option let work continue after the user logs off, without forcing every request into a stateless chat. [1] [2] [7]

3. **Human approval is placed at consequential edges.** Confirmation before sending/publishing, budgets for payments, test runs, and explicit connector authorization are practical controls that preserve autonomy without requiring approval for every low-risk step. [4] [7] [8]

4. **Multi-agent collaboration is user-visible.** Group chat plus handoffs makes specialized-agent decomposition legible to users and supports a division of labor without requiring them to build an orchestration graph. [1] [2]

5. **Automation has an operational loop, not just a trigger.** Testing, Updates, per-run history, failure explanation/fixing, pause/edit, and same-task versus new-task semantics address the maintenance problem that many agent demos omit. [7]

6. **The connector layer is broad and replaceable.** OAuth connectors, MCP, webhooks, API access, and integrations allow the agent to operate in existing systems instead of requiring every capability to be built into the core. [6] [8]

7. **Security messaging is concrete.** Manus publishes a Trust Center, certifications, controls, subprocessors, and feature-specific privacy FAQs rather than relying only on generic marketing. [10] [11]

## Documented limitations and constraints

These are limits or constraints stated by official sources, not assumptions from missing documentation:

- **Early access and invite requirement:** Cue is described as early access and currently requires an invitation code. The launch page says it is free with an invite code for a limited number of early users; the help article also says an invitation is currently required. [1] [2]
- **Platform availability is transitional:** The launch announcement says Cue is available on web, desktop, and mobile, with iOS coming after App Store review. [1] Availability can change; this is a dated launch statement.
- **Messaging coverage is bounded:** The official Cue help article currently names four Messenger integrations—iMessage, Telegram, LINE, and Slack. Other integrations in the broader Manus connector catalog are platform-level evidence, not a claim that Cue exposes all of them. [5] [6]
- **Connector access requires prior authorization:** API use requires authorizing a connector in the Manus web app. Connectors use OAuth and access only explicitly authorized sources; users can revoke them. [6] [11]
- **Automation timing has a floor:** Scheduled automations use a minimum interval of five minutes, and schedules require a time zone and optional end. [7]
- **Automation approvals are action-dependent:** The API only supports confirmation for documented pending action types and schemas. Unknown waiting types must not be auto-approved; ordinary messages skip an action rather than confirm it. [8] [9]
- **Sandbox retention differs by plan and feature:** The Trust FAQ states browser sandbox data is automatically deleted after 7 days for Free and 21 days for Paid; the same retention periods are stated for scheduled-task sandbox data. [11]
- **Shared account/data deletion:** Manus’s help center says Cue and Manus share the same account and data; deleting the account affects both, and a Cue-only account deletion is not currently available. [12]
- **Model choice is abstracted away:** Manus says it is LLM-agnostic and selects the right foundational model for each use case so users do not have to. This describes a managed model-selection policy, not user-selected model routing. [11]

## Security, trust, deployment, integrations, and automation

### Security and trust model

Cue is a **cloud-hosted, vendor-operated service**. The Trust Center describes Manus as an autonomous agent platform that executes complex tasks independently. Its published compliance list includes **SOC 2 Type II, SOC 2 Type I, ISO 27001, and ISO 27701**. It lists controls such as unique production database authentication, restricted encryption-key access, data encryption, penetration testing, retention procedures, and customer-data deletion on departure. [10]

The Trust FAQ states that data is stored in the **United States and Singapore**, with EU Standard Contractual Clauses and other safeguards for international transfers. It says Manus does not sell personal data, but does share data for specified purposes under its privacy policy. It says third-party model providers have formal agreements not to use customer data for training. [11]

For browser and integration access, the documented model is least-privilege by user authorization rather than self-hosting: OAuth connectors are explicitly authorized and revocable; Browser Operator requires one-time permission per task, logs actions visibly, keeps credentials in the local browser, and executes in the browser context. [11] For cloud browser sessions, Manus documents encryption on device, in transit, and in the cloud, per-user isolation, and plan-dependent sandbox deletion. [11]

This is a strong **managed trust boundary**, but it also means users must trust Manus, its subprocessors, its model providers, its account controls, and its cloud execution environment. Team owners/admins can see member session data, inputs, outputs, and task history according to the Trust FAQ. [11]

### Deployment model

Cue runs as a managed web/desktop/mobile application. Its agents get a hosted computer/workspace and can continue work after logoff. Manus also offers cloud computers for always-on workloads, and the broader platform exposes a hosted API, webhooks, connectors, artifacts, and task lifecycle endpoints. [1] [6] [8]

The official materials reviewed do not document a self-hosted Cue server, local-first Cue runtime, customer-managed model endpoint, or air-gapped deployment. That statement is intentionally scoped: it is a **gap in the reviewed public documentation**, not a claim that no private or future offering exists.

### Integrations and automation

Cue’s direct consumer story is connected services plus messaging, while Manus’s integration platform provides a much larger OAuth/MCP/API surface. Automation can start on time, on an app event, or through a webhook; runs can be tested, approved, reviewed, paused, repaired, and resumed. [5] [6] [7]

## Openness and licensing

Cue is presented as a proprietary hosted product. Its official product, help, Trust Center, and API documentation describe a service and API; they do not publish Cue’s agent runtime, orchestration core, model-routing implementation, or a Cue source license. Manus’s official GitHub organization lists MCP servers, package/third-party archives, and other repositories, but not the Cue product or its core runtime. [13]

The presence of open or publicly documented interfaces is therefore not equivalent to open-source core code. Cue’s public extensibility is through API, OAuth connectors, MCP, webhooks, and skills/integration surfaces, while the product itself remains vendor-operated. The independent report also describes Cue as a standalone app, not an open-source distribution. [3] OpenManus is a separate community project and should not be conflated with Manus Cue.

## Carefully labeled gap inferences for APEX

The following are **inferences from the documented product boundaries**, not claims that Cue lacks these features:

- Because Manus explicitly selects foundational models for users, Cue likely optimizes for convenience and managed quality rather than portable user-owned model choice. Public material does not establish arbitrary API/server/local model selection inside Cue.
- Because identity, computers, connectors, and wallets are hosted services, portability of an agent’s memory, skills, credentials, task state, and identity is not demonstrated by the reviewed sources.
- Because the approval API is action-schema-specific, extending the approval surface to arbitrary third-party tools likely requires platform support or careful fallback behavior rather than a universal policy language.
- Because the product uses a shared account and cloud data plane, offline operation, air-gapped operation, and independent per-agent tenancy are not demonstrated.
- Because the product exposes rich task history and automation runs but does not publicly describe a portable event-log format, export/replay/debugging across installations is an opportunity for APEX rather than a confirmed Cue capability.
- Because Cue’s public messaging integration list is finite and platform-mediated, an open adapter protocol for any messaging surface could be a differentiator, subject to the security and abuse risks of agent identity.

## Lessons and opportunities for APEX

APEX should not clone Cue’s hosted product. It can take the underlying product lessons while choosing a different trust and ownership model:

1. **Make agent identity explicit and composable.** Define an agent manifest containing identity, tools, memory namespaces, budgets, policies, communication endpoints, and a durable workspace. Let users run the same manifest with a local model, API model, or server model.
2. **Separate model selection from the agent core.** Provide a model-provider interface with per-task routing, fallback, capability declarations, and cost/latency policy. Preserve user control over API, self-hosted, and local models rather than hiding routing behind a managed service.
3. **Treat approvals as a typed policy engine.** Use action schemas, risk classes, spending limits, destination allowlists, data-sensitivity rules, and time-bounded approvals. Record both the proposed action and the user’s decision, and make “skip,” “deny,” and “approve with edits” unambiguous.
4. **Build a durable, exportable run ledger.** Store event history, tool calls, inputs/outputs, artifacts, model/provider, approvals, retries, and background jobs in a portable format. Make runs searchable, replayable in a sandbox, and exportable for audit or migration.
5. **Make automation maintainable.** Combine schedules, event triggers, webhooks, test runs, dry runs, failure explanations, pause/edit/resume, same-thread versus fresh-run behavior, and explicit idempotency controls.
6. **Use an adapter boundary for tools and agents.** Support MCP and ordinary HTTP/CLI/local tools, but wrap every tool in capability declarations, secret scoping, provenance, rate limits, and revocation. Agent-to-agent bridges should be explicit, authenticated, permissioned, and observable rather than implicit delegation.
7. **Offer deployment profiles.** APEX can distinguish local-only, private server, managed cloud, and hybrid execution. Memory and credentials should remain in the operator’s chosen trust domain, with connectors that can be revoked independently.
8. **Design for identity portability and least privilege.** Let an agent’s email/phone/payment identity be replaceable adapters, not hard-coded vendor resources. Keep budgets, payment approvals, and contact permissions separate from the model and exportable with clear audit history.
9. **Document the boundaries plainly.** Publish supported tools, retention, model data-use terms, limitations, security controls, and failure behavior. Cue’s strongest trust lesson is that these details are product features, not afterthoughts.

## References

[1]: https://manus.im/blog/introducing-manus-2-0 "Introducing Manus 2.0"
[2]: https://help.manus.im/en/articles/17190150-what-is-new-in-manus-2-0 "What is new in Manus 2.0?"
[3]: https://thenextweb.com/news/manus-2-0-cue-ai-agents-email-phone-wallet "Manus 2.0 and Cue give AI agents their own email, phone and wallet"
[4]: https://cue.im/ "Cue — Your personal agents, on Cue"
[5]: https://help.manus.im/en/articles/14178640-can-i-connect-multiple-messaging-agents-at-once-in-cue "Can I connect multiple messaging platforms at once in Cue?"
[6]: https://open.manus.ai/docs/v2/connectors.md "Connectors — Manus API v2"
[7]: https://manus.im/features/automations "Automations — Manus"
[8]: https://open.manus.ai/docs/v2/task-lifecycle.md "Task Lifecycle — Manus API v2"
[9]: https://open.manus.ai/docs/v2/task.confirmAction.md "task.confirmAction — Manus API v2"
[10]: https://trust.manus.im/ "Manus Trust Center"
[11]: https://trust.manus.im/faq "Manus Trust Center FAQ"
[12]: https://help.manus.im/en/articles/11711969-how-can-i-delete-my-account "How can I delete my account?"
[13]: https://github.com/manus-ai "Manus AI — GitHub organization"
