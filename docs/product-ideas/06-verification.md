# APEX opportunity: evidence-based research and task verification

APEX can address a central failure mode of autonomous agents: a fluent answer or a completed-looking action is not the same as a **verified result**. Users need to know what the agent actually did, which sources and tools it used, what changed, whether the result satisfies explicit acceptance criteria, and what remains uncertain. This is especially important for self-hosting, where the user—not a vendor—owns model choice, connectors, credentials, logs, and the execution boundary.

## Documented evidence

1. **Citations and links do not reliably prove support.** In a 2025 *Nature Communications* study, SourceCheckup evaluated seven LLMs on 800 medical questions and 58,000 statement–source pairs. Between 50% and 90% of responses were not fully supported by their cited sources; even GPT-4o with web search had about 30% unsupported individual statements and nearly half of responses not fully supported. This is a medical-domain study, not a universal error rate, but it directly documents the gap between “has a URL” and “the source entails the claim.” [1]

2. **Multi-step agents still fail on long-horizon reasoning and instruction following.** AgentBench (submitted 2023; published at ICLR 2024) evaluates LLM agents across eight interactive environments and reports that poor long-term reasoning, decision-making, and instruction following were major obstacles to usable agents. The benchmark is evidence that task completion needs environment-level evaluation, not only text-quality judging. [2]

3. **Real-world task completion is substantially harder than code generation.** SWE-bench (ICLR 2024; paper submitted October 10, 2023) uses 2,294 real GitHub issues across 12 Python repositories and tests agents by applying changes to a codebase. Its initial evaluation found the best reported model solved only 1.96% of issues. This result is benchmark- and version-specific, but it demonstrates why acceptance tests, replayable environments, and “not verified” outcomes matter. [3]

4. **Agent security creates a distinct verification problem.** NIST’s CAISI request for information (January 12, 2026) says agents can plan and take autonomous actions affecting real systems, and highlights indirect prompt injection, poisoned models, specification gaming or misaligned objectives, and the need to constrain and monitor agent access. These are reasons to verify the proposed action and execution context outside the model, rather than trusting the model’s own explanation. [4]

5. **Approval prompts are not sufficient authorization or isolation.** OWASP’s AI Agent Security Cheat Sheet documents prompt injection, tool abuse, data exfiltration, memory poisoning, excessive autonomy, approval manipulation, cascading failures, and sensitive-data exposure. It recommends least-privilege tools, validation outside the model, approval bound to the exact actor/tool/target/parameters, replay protection, fail-closed behavior, and security-relevant monitoring. Its companion prompt-injection guidance explicitly treats fetched pages, documents, email, and tool outputs as untrusted data. [5] [6]

6. **Interview assistance must separate accessibility from deception.** The U.S. DOJ’s ADA guidance (May 12, 2022) warns that hiring technology can screen out qualified people with disabilities and says employers must provide reasonable accommodations, including an accessible interview process. It recommends telling applicants what technology is used, explaining evaluation, and providing a clear accommodation request path. That supports disclosed assistive interfaces and mock coaching; it does not justify covertly feeding answers while representing them as the candidate’s unaided responses. [7]

## Recommended APEX product design

These are recommendations for APEX, not findings that the cited studies tested APEX.

1. **Verification-first task contracts.** Before execution, turn a natural-language task into a versioned contract containing the objective, scope, allowed sources/connectors, risk class, acceptance criteria, required evidence, stop conditions, and permitted side effects. Require the user to approve the contract—not merely a vague plan. Return `verified`, `partially verified`, `failed`, or `unverified`, never a binary success inferred from model confidence.

2. **Claim-level evidence packs.** For research and analysis, represent each material claim as an atomic record linked to source URL, page/document title, publication date, retrieval time, quoted passage or locator, source hash/snapshot where permitted, and an evidence status: supports, contradicts, context-only, or not checked. Run a separate citation/entailment pass and expose unsupported claims instead of laundering them into prose. APEX should preserve both the generated answer and the evidence map.

3. **Provenance and execution ledger.** Model task inputs, fetched documents, tool calls, outputs, approvals, and derived artifacts as a provenance graph. W3C PROV provides a useful vocabulary: entities, activities, agents, usage, generation, and derivation; its specification notes that explicit usage/generation paths aid analysis and reproducibility. [8] Use OpenTelemetry-compatible trace IDs, spans, timestamps, status, and events to correlate CLI/TUI, daemon/API, plugins, delegated agents, and sandbox activity. [9]

4. **Independent verifier and acceptance gates.** Separate planning from execution and verification. A verifier should check schema, source accessibility, claim support, arithmetic, file diffs, test results, policy compliance, and side effects using independent context where practical. For code or data tasks, require user-supplied tests or generated tests plus reproducible command output. Do not use the same model’s self-report as the only evidence of success; show the actual artifacts and failed checks.

5. **Replayable task bundles.** Offer an exportable, redacted bundle containing the task contract, model/provider identifiers, prompts or prompt hashes according to privacy settings, tool arguments and results, source snapshots or hashes, environment/package information, test commands, and final evidence graph. A replay command should rerun read-only steps and identify drift in sources, models, tools, or results. This makes “why did it say that?” and “can I reproduce it?” first-class workflows.

6. **Policy enforcement outside the model.** Put connector permissions, path/network allowlists, credential scoping, rate/compute budgets, and high-impact-action authorization in a policy/execution layer. Bind approval to the exact normalized action, target, parameters, actor, expiry, and one-time use; changing parameters requires fresh approval. Keep a tamper-evident audit trail and provide a kill switch. This follows OWASP’s warning that a model-visible `user_confirmed` flag is not enough. [5]

7. **Honest sandbox profiles, not “approval theater.”** Label the actual isolation mode and its limits. Docker documents namespaces and cgroups but also warns that the daemon may require root and that host-directory sharing can give a container unrestricted host access. [10] For higher-risk untrusted work, support a stronger boundary such as gVisor or a VM, with network egress disabled or allowlisted, no host sockets, ephemeral credentials, read-only mounts, resource limits, and adversarial escape tests. gVisor describes a userspace application kernel that mediates system calls, while also noting compatibility and overhead tradeoffs. [11] A dashboard approval button should never be described as OS/container isolation.

8. **Interview-safe modes.** Provide a mock-interview coach that asks questions, gives feedback, cites study material, and practices accessibility preferences before the interview. Provide an explicitly disclosed accessibility mode—such as captions, speech-to-text, screen-reader-compatible prompts, extra time, or user-controlled note organization—only with the user’s permission and subject to the employer/platform’s policy. Do not ship a covert answer-feeding mode or stealth overlay intended to make generated answers appear to be the candidate’s unaided responses. For formal interviews, default to a visible “assistance policy” checklist and a pause/disable control; retain minimal local logs and let the user delete them.

## Cautions and open validation work

- The cited benchmark numbers are not market prevalence and do not predict APEX’s performance. Build an APEX evaluation set across research, browsing, file editing, coding, and connector actions; report task-level pass rates, evidence precision/recall, false-verification rate, unsupported-claim rate, latency, and cost by model/provider.
- Provenance proves what APEX recorded, not that a source is true, that a website was uncompromised, or that an agent’s hidden reasoning was correct. Preserve uncertainty and source quality; do not equate a complete trace with correctness.
- URLs, snippets, prompts, credentials, interview transcripts, and accessibility data can contain personal or confidential information. Default to redaction, encryption, retention limits, local-only storage, per-user/session isolation, and explicit export controls. Never put secrets in model-visible evidence or ordinary logs.
- Human approval mitigates some consequential actions but can be manipulated, habituated, or granted to the wrong target. Bind approval cryptographically or transactionally in the execution service and test replay, race, parameter-substitution, and prompt-injection cases.
- Containers are not automatically a security boundary. A self-hosted user may misconfigure mounts, privileges, daemon/API access, network egress, or credentials. APEX must state its threat model and verify the selected isolation profile at runtime.
- Interview assistance has an integrity and privacy boundary: coaching and disclosed accommodations can benefit users; covert answer-feeding can misrepresent competence, disadvantage other candidates, expose sensitive interview content, and violate employer/platform rules. APEX should support users without helping them deceive.
- Confidence: **medium-high for the existence of the verification/security/accessibility problems; medium for product-market demand and the expected effectiveness of any particular APEX control**. The evidence is strong but heterogeneous, and several sources are benchmarks or guidance rather than field trials of self-hosted autonomous agents.

## References

[1]: https://www.nature.com/articles/s41467-025-58551-6 "An automated framework for assessing how well LLMs cite relevant medical references" (Nature Communications, 2025)
[2]: https://arxiv.org/abs/2308.03688 "AgentBench: Evaluating LLMs as Agents" (ICLR 2024; submitted August 7, 2023)
[3]: https://arxiv.org/abs/2310.06770 "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?" (ICLR 2024; submitted October 10, 2023)
[4]: https://www.nist.gov/news-events/news/2026/01/caisi-issues-request-information-about-securing-ai-agent-systems "CAISI Issues Request for Information About Securing AI Agent Systems" (NIST, January 12, 2026)
[5]: https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html "AI Agent Security Cheat Sheet" (OWASP; page publication date not shown)
[6]: https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html "LLM Prompt Injection Prevention Cheat Sheet" (OWASP; page publication date not shown)
[7]: https://www.ada.gov/resources/ai-guidance/ "Algorithms, Artificial Intelligence, and Disability Discrimination in Hiring" (U.S. Department of Justice, May 12, 2022)
[8]: https://www.w3.org/TR/prov-dm/ "PROV-DM: The PROV Data Model" (W3C Recommendation, April 30, 2013)
[9]: https://opentelemetry.io/docs/concepts/signals/traces/ "Traces" (OpenTelemetry documentation; page publication date not shown)
[10]: https://docs.docker.com/engine/security/ "Docker Engine security" (Docker documentation; page publication date not shown)
[11]: https://gvisor.dev/docs/ "What is gVisor?" (gVisor documentation; page publication date not shown)
