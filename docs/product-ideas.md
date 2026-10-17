# APEX product-opportunity design brief

## Product thesis

APEX should be a **provider-neutral, self-hostable agent runtime whose differentiator is trustworthy execution**: one policy boundary across CLI/TUI, API/daemon, dashboard, Skills, connectors, and delegated agents; durable runs that can recover; and evidence that separates proposed, authorized, attempted, completed, and independently verified work. This is a product recommendation, not a claim of market prevalence. The research supports the risks and design constraints below, while prioritization still requires APEX user research and product experiments.

## Ranked opportunities

| Rank | Opportunity | User value | Build priority | Evidence-supported product decision |
|---|---|---:|---:|---|
| 1 | **Shared policy, approval, and effect ledger** | Very high | **Phase 1 / P0** | Route every surface and delegate through one broker. Bind approval to actor, exact normalized arguments, target, expiry, and one-time nonce outside the model; record policy decisions, tool calls, side effects, and outcomes. OWASP recommends external authorization and least privilege because prompt injection can trigger disclosure or unauthorized actions [5]. |
| 2 | **Verification-first durable runs** | Very high | **Phase 1 / P0** | Give each run a contract (scope, acceptance criteria, evidence, stop conditions), stable ID, event history, checkpoints, pause/resume/cancel, bounded retries, idempotency class, and explicit verified/partial/failed/unverified status. Durable workflow systems and retry guidance support persistent state, bounded retries, backoff, and fallback paths [9]; citation benchmarks show that fluent answers can contain materially unsupported claims [11]. |
| 3 | **Truthful security boundary** | Very high | **Phase 1 policy; runner in P0/P1** | Default-deny filesystem, network, secrets, subprocess, and delegation capabilities. Make “approval” visibly distinct from isolation. Arbitrary code, hostile plugins, browser automation, and high-risk connectors require an actual restricted runner (OS sandbox, microVM, or separate worker), not ordinary app code or a prompt. Containers share a kernel and are weaker than VMs [6]; independent review documents path, hook, configuration, and approval-bypass classes [7]. |
| 4 | **Privacy, provider, and cost controls** | High | **Phase 1 / P0** | Add sensitivity labels, local-first/dry-run routing, provider manifests with retention/training/ZDR/region/price expiry, redaction, per-run spend/token/tool/retry limits, egress previews, and kill switches. Hosted-model and connector retention policies differ by feature and provider [13]; self-hosting does not erase downstream processor obligations. |
| 5 | **Accessible multi-surface operation** | High | **Phase 1 / P0** | Ship keyboard-first controls, screen-reader names and status regions, no-redraw line mode, visible focus/escape paths, reduced motion, optional color, and identical run state across CLI/TUI/API/dashboard. CLI redraws and unstructured output are documented barriers [12]. Treat accessibility as configurable compatibility, not one universal mode. |
| 6 | **User-owned continuity and memory** | High | **Phase 1 basic controls; P1 differentiator** | Separate event-sourced continuity from semantic memory. Provide scope (session/project/workspace/global), provenance, confidence, TTL, inspect/edit/delete/export, derivative lineage, local encryption, and a no-memory mode. Exploratory research finds incomplete mental models of agent memory [10]; deletion must address summaries, embeddings, caches, checkpoints, delegated capsules, and provider copies. |
| 7 | **Interview Coach with an explicit integrity boundary** | High for the target user, unvalidated demand | **Phase 1 practice; P1 disclosed assistance** | Build role/job-analysis practice, timed questions, follow-up probes, competency rubrics, feedback, provenance labels, and post-round reflection. Structured interviews use job analysis, competencies, probes, anchored scales, and documentation [2]. Do not invent accomplishments or silently generate live answers. |
| 8 | **Portable, signed capability bundles** | Medium-high | **P1/P2** | Start with versioned, non-executable Skills and read-only/fixed-endpoint connectors. Later add canonical manifests, dependency digests, signatures, transparency logs, revocation, capability grants, and isolated executable plugins. Agent Skills and MCP improve interoperability but do not define a complete secure packaging/runtime contract [8]. |
| 9 | **Task capsules, replay, and evaluation** | Medium-high | **P1/P2** | Export redacted, replayable contracts, traces, artifacts, model/provider IDs, tests, source metadata, and human decisions without replaying external effects. Use this to measure verified success, unsupported-claim rate, recovery time, intervention, and cost—not marketing “autonomy.” |
| 10 | **Employer-facing structured assessment toolkit** | Medium | **P2, consented** | Offer job-related question banks, probes, anchored ratings, notice, retention/access controls, human review, and appeal paths. Keep it separate from candidate assistance; do not infer legal eligibility or automate rejection from weak behavioral signals. |

## MVP versus later differentiation

### Phase 1 MVP: make the core runtime honest and operable

1. **One policy kernel:** shared manifests and broker across CLI/TUI, API/daemon, dashboard, Skills, connectors, and delegates; default-deny grants; exact-action approval; stable run IDs.
2. **Run ledger and recovery:** event-sourced timeline, action journal, waiting reason, pause/cancel/resume, bounded retries, timeout/cancellation, unknown-outcome reconciliation, and exportable redacted receipts.
3. **Verification contract:** acceptance criteria, source/claim links where relevant, tests/diffs/policy checks, and no “success” state based solely on model self-report.
4. **Privacy and spend baseline:** local/remote data-flow labels, provider capability/retention manifest, secret broker, redaction, TTL/deletion, egress preview, budgets, and hard stop.
5. **Accessible surfaces:** static textual progress, keyboard and screen-reader operation, predictable errors, and cross-surface continuity.
6. **Interview practice only:** mock coach, user-supplied facts versus model-generated drafts clearly labeled, no fabricated experience, consented notes, and policy reminder.

### Later differentiators (after the baseline is reliable)

- **Secure runner and isolation ladder:** disposable OS sandbox → stronger microVM/remote worker for hostile or multi-tenant work; read-only mounts, dropped capabilities, no host socket, default-deny egress, resource limits, and scoped short-lived credentials.
- **Signed Skills/Plugins plane:** canonical manifests, recursive dependency hashes, private mirrors, transparency log, revocation, quarantine, progressive discovery, and conformance/golden-trace tests.
- **Portable task capsules and evaluation harness:** replay without effects, branch/fork with edits, drift detection, and configuration-specific security/quality results.
- **Scoped memory capsules:** signed, expiring delegation context rather than whole-store access; source-to-derivative purge status.
- **Durable automation and delegation:** schedules/webhooks, depth/time/token/retry/tool/spend budgets, circuit breakers, dead-letter handling, and inherited capabilities that only narrow.
- **Consented employer toolkit and disclosed accessibility profile:** captions, speech-to-text/text-to-speech, translation, pacing, repeat/clarify, larger text, structured notes, and optional disclosure card; employer-side recording/scoring only with purpose, notice, retention, access, human review, and appeal.

## Specific interview-coach recommendation

**Support practice and transparent/disclosed assistance; do not covertly impersonate a candidate or secretly feed answers in a live interview.** Ship three explicit modes with identical policy enforcement on every surface:

1. **Practice:** mock interviewer, job analysis, timed rounds, follow-up probes, rubric-based feedback, and post-round coaching.
2. **Disclosed support:** user-directed captions, transcription, translation, pacing, repeat/clarify, alternative input/output, and notes; optionally generate a user-visible disclosure card for employer approval.
3. **Live answer-feeding:** disabled/refused by default as a stealth feature—no hidden overlays, earpiece scripts, screen scraping, impersonation, arbitrary browsing/search, remote delegation, or invented accomplishments.

This boundary protects assessment validity: one controlled asynchronous experiment found higher content ratings but lower honesty and procedural-justice ratings for ChatGPT-assisted responses [1]. It also follows accessibility guidance that supports advance explanation, reasonable accommodations, and the same job-related standards [3]. A candidate-visible dialog is only UX; authorization and tool restrictions must be enforced by the execution layer.

## What needs a secure runner?

| Feature | Ordinary application code is sufficient for the first version | Actual secure runner required before enabling arbitrary autonomy |
|---|---|---|
| Run ledger, contracts, verification UI, budgets, retention/deletion, provider manifests | Yes, with server-side policy checks and encrypted storage | No |
| Keyboard/screen-reader UI, mock coaching, disclosed captions/STT/TTS, notes | Yes; keep audio/transcripts local or ephemeral where possible | No, unless invoking untrusted plugins or external tools |
| Read-only fixed-endpoint connector with narrow broker operation | Broker and allowlist can be app code; no ambient credentials | Runner/isolated worker for untrusted connector implementation |
| Shell, arbitrary code, browser automation, file writes, plugins, Skills with scripts | No: approval dialog/model guardrail is not containment | Yes: OS-enforced sandbox; microVM/separate worker for hostile, high-risk, or multi-tenant workloads |
| Delegated agents and remote MCP/A2A tools | Policy/budget model can be app code | Isolate executor, network, credentials, and inherited capabilities; treat remote server as untrusted |

## Recommended roadmap changes

1. **Reframe the core launch promise** from “autonomous agent” to **verifiable, policy-enforced runs across three surfaces**; make effect receipts and uncertainty first-class UI.
2. **Move security foundations ahead of broad autonomy:** ship broker, policy manifests, secret isolation, egress controls, fail-closed capability detection, and self-tests before exposing shell/browser/plugin automation.
3. **Make provider portability concrete:** signed/expiring model contracts, sensitivity-aware routing, local-first mode, visible retention, and cost ceilings; never imply local inference protects data sent to connectors.
4. **Build the coach as a trust-positive workflow:** practice first, disclosed support second, and explicit refusal of covert live answer-feeding. Validate usability with disabled users and employers rather than claiming legal eligibility or demand.
5. **Invest in evidence as the durable differentiator:** claim-level provenance, acceptance tests, replay, reconciliation, and redacted task capsules. Report false-verification and unsupported-claim rates in product evaluation.
6. **Gate P1/P2 packaging and federation on isolation and revocation:** interoperability alone is not authorization or containment [8].

## Evidence confidence and limits

Confidence is **high** for the documented integrity, privacy, accessibility, reliability, and isolation constraints; **medium** for prioritization and market value. The evidence is heterogeneous guidance, benchmarks, one controlled interview experiment, exploratory memory research, and vendor documentation. It does not establish broad demand, prevalence of covert tools, detector reliability, or that any APEX control prevents all attacks. Recording, accommodation, employment, and privacy duties vary by jurisdiction and employer; APEX should provide controls and disclosure workflows, not legal conclusions.

## References

[1] **“ChatGPT, can you take my job interview?”** Wiley/International Journal of Selection and Assessment, preregistered asynchronous interview experiment (N=245, 2024): https://onlinelibrary.wiley.com/doi/10.1111/ijsa.12491

[2] **U.S. OPM, “Structured Interviews.”** Government guidance on job analysis, competencies, probes, anchored rating scales, reliability, and documentation: https://www.opm.gov/policy-data-oversight/assessment-and-selection/other-assessment-methods/structured-interviews/

[3] **U.S. DOL ODEP, “Focus on Ability: Interviewing Applicants with Disabilities,” and DOJ “Algorithms, AI, and Disability Discrimination in Hiring.”** Advance explanation, reasonable accommodations, accessible technology, job-related questions, and same standards: https://www.dol.gov/agencies/odep/publications/fact-sheets/focus-on-ability-interviewing-applicants-with-disabilities and https://www.ada.gov/resources/ai-guidance/

[4] **UK ICO, “Shortlisting, testing and interviewing candidates.”** Data minimization, DPIA consideration, retention periods, secure deletion, and anonymization for recruitment data: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/employment/recruitment-and-selection/shortlisting-testing-and-interviewing-candidates/

[5] **OWASP, “AI Agent Security Cheat Sheet” and “LLM01:2025 Prompt Injection.”** Prompt injection, tool abuse, data exfiltration, excessive autonomy, external authorization, least privilege, and bounded execution: https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html and https://genai.owasp.org/llmrisk/llm01-prompt-injection/

[6] **NIST SP 800-190, “Application Container Security Guide.”** Container threat model, kernel sharing, capabilities, mounts, runtime, image, and network controls; containers are not an unconditional VM boundary: https://csrc.nist.gov/pubs/sp/800/190/final

[7] **NCC Group, “An Introduction to AI Coding Agent Security,” v2.0.** Independent documentation of sandbox escape, path/symlink, hooks/configuration, permission-prompt, and parser-differential vulnerability classes: https://www.nccgroup.com/media/jtepwx1t/nccgroup_codingagentswhitepaper.pdf

[8] **Agent Skills Specification; Model Context Protocol Specification; Skills Over MCP Working Group Charter.** Portable skill format and interoperability, with documented gaps around executable packaging, authorization, lifecycle, and isolation: https://agentskills.io/specification ; https://modelcontextprotocol.io/specification/2026-07-28 ; https://modelcontextprotocol.io/community/working-groups/skills-over-mcp

[9] **Temporal, LangGraph, Google Cloud Workflows, and AWS Step Functions documentation.** Durable state, checkpoints, retry predicates, backoff/jitter, bounded attempts, cancellation, and fallback handling: https://docs.temporal.io/workflow-execution and https://docs.temporal.io/encyclopedia/retry-policies

[10] **“Users’ Expectations and Practices with Agent Memory” (CHI EA 2025); OpenAI “Memory in ChatGPT”; Anthropic “Memory tool.”** Exploratory memory expectations, deletion/derivative concerns, client-side storage, and path-scope controls: https://dl.acm.org/doi/10.1145/3706599.3720158 ; https://help.openai.com/en/articles/8590148-memory-faq ; https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/memory-tool

[11] **“An automated framework for assessing how well LLMs cite relevant medical references” (Nature Communications, 2025); AgentBench; SWE-bench.** Unsupported citation statements and limits of current long-horizon/real-world task performance: https://www.nature.com/articles/s41467-025-58551-6 ; https://arxiv.org/abs/2308.03688 ; https://arxiv.org/abs/2310.06770

[12] **Google Research “Accessibility of Command Line Interfaces”; GitHub “Building a more accessible GitHub CLI”; WCAG 2.2.** Screen-reader, redraw, focus, status-message, keyboard, and contrast requirements: https://research.google/pubs/accessibility-of-command-line-interfaces/ ; https://github.blog/engineering/user-experience/building-a-more-accessible-github-cli/ ; https://www.w3.org/TR/WCAG22/

[13] **OpenAI “Data controls in the OpenAI platform” and Anthropic “API and data retention.”** Provider- and feature-specific retention, training-use, ZDR, third-party, batch, and cache differences: https://developers.openai.com/api/docs/guides/your-data and https://platform.claude.com/docs/en/manage-claude/api-and-data-retention
