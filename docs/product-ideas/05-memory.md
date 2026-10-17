# APEX opportunity: user-controlled agent memory and continuity

**User problem.** A long-running self-hosted agent is valuable only if it can resume work without forcing the user to restate context. Yet people cannot reliably predict what an AI remembers, why it recalls a fact, which project or connector can see it, or whether “forget” actually removes every copy. Continuity also creates a persistent attack surface: an untrusted document, plugin, delegated agent, or prior run can plant instructions that influence later actions. APEX can differentiate by making memory a user-owned, inspectable, scoped, portable subsystem rather than an opaque chatbot feature.

## What is documented

### Users need a mental model, not just a memory toggle

A 2025 CHI Extended Abstracts study interviewed six regular memory-tool users and analyzed 54 public discussion threads. It found incomplete mental models of what agents store, how they decide what is important, and how stored memories change behavior. Participants wanted memories organized by categories and access controlled according to task needs. The sample is exploratory and does **not** establish population prevalence, but it is directly relevant to an APEX design brief. [1]

Current product documentation illustrates the gap. OpenAI says users can review, correct, or delete memories, but also documents that saved memories are separate from chats and that deleting a chat alone does not necessarily delete its derived memory; deletion can take time to propagate and logs may remain for up to 30 days for safety and debugging. [2] This is a concrete continuity failure mode: users need source-to-derived-memory lineage and deletion status, not a single “forget” command.

Anthropic’s Memory Tool takes a more portable approach: memory files are stored client-side, the application controls the directory and retention, and the handler must restrict operations to the memory root to prevent path traversal. [3] That is a useful precedent for APEX because one runtime may use hosted APIs, compatible servers, or local models while keeping the durable memory boundary in the user’s infrastructure.

### Long context is an engineering constraint, while persistence changes the threat model

MemGPT (arXiv v2, February 12, 2024) describes hierarchical “virtual context” that pages information between an active context and external archival/recall storage. It reports that this architecture supports multi-session agents that remember, reflect, and evolve, but also makes memory management an explicit system function. [4] APEX should therefore distinguish **working context**, **session transcript**, **durable memory**, and **run artifacts**. A summary silently replacing the source transcript is not equivalent to continuity; it is a lossy, potentially incorrect derivative.

Security guidance treats persistent memory as an attack surface. OWASP’s AI Agent Security Cheat Sheet (accessed 2026) recommends validating and sanitizing memory before storage, isolating memory between users/sessions, enforcing expiration and size limits, auditing for sensitive data, and using integrity checks. It also says authorization must be enforced outside the model: a `user_confirmed` flag is insufficient unless the executor verifies the actor, exact tool call, expiry, and one-time use. [5] NIST’s Generative AI Profile (July 26, 2024) describes indirect prompt injection through retrieved data and recommends provenance, red-teaming, and verification of security measures. [6]

AgentPoison (NeurIPS 2024) gives a concrete research demonstration: an attacker with partial access to a retrieval database can inject a small number of malicious key-value instances so triggered queries retrieve poisoned examples and produce a target action while clean queries remain benign. This is a tested RAG-agent threat model, not evidence that every deployment is vulnerable, but it means APEX must not treat “it came from memory” as trusted. [7]

### Privacy and isolation require technical boundaries

The GDPR (Regulation (EU) 2016/679, 2016) states purpose limitation, data minimization, accuracy, storage limitation, integrity/confidentiality, access, rectification, and erasure principles. Its recitals specifically call for time limits for erasure or periodic review and reasonable steps to rectify or delete inaccurate data. [8] NIST’s Privacy Framework is a voluntary enterprise-risk tool for improving privacy while protecting individuals. [9] These are design requirements for a memory product: purpose, retention, provenance, correction, export, and deletion should be first-class metadata and operations.

A visual approval dialog is not a sandbox. NIST SP 800-190 (September 2017) explains that containers share the host kernel and provide a weaker security boundary than VMs; careless configuration can expose the host or other containers, and runtime compromise can attack all containers on a host. [10] APEX should report UI approval, tool authorization, process/container isolation, filesystem permissions, network egress, and VM/host boundary as separate controls. Approval answers “did a person authorize this exact action?” Isolation answers “what can a compromised process reach?”

### Interview assistance has a clear integrity boundary

Pennsylvania’s official job-seeker guidance (page accessed 2026) permits AI for employer research and interview practice, but prohibits using it to answer live interview questions, recording/transcribing without affirmative consent, or replacing the candidate’s own responses. [11] Canada’s Public Service Commission guidance (page dated June 1, 2026) says employers may allow or prohibit AI, but should give clear rules, consequences, and disclosure requirements; it also warns that unsupervised assessments increase the risk of unauthorized resources and recommends multiple assessment methods. [12]

The U.S. DOJ’s ADA guidance (May 12, 2022) says hiring technology can unlawfully screen out qualified applicants with disabilities and requires reasonable accommodations; examples include accessible interview software and assistive equipment. [13] Therefore APEX should distinguish three modes: **mock coaching** (safe preparation), **disclosed accessibility support** (only with the employer’s rules/consent and focused on access rather than fabricating competence), and **covert answer-feeding** (hidden live answers or impersonation). The first is user-beneficial, the second can be legitimate when disclosed and scoped, and the third creates integrity, deception, consent, privacy, and potential employment-law risks. APEX should not ship covert interview-answer functionality.

## Actionable APEX product designs

1. **Memory ledger with provenance and confidence.** Store each memory as a typed record: `explicit_user_fact`, `task_decision`, `preference`, `derived_summary`, `external_observation`, or `agent_hypothesis`. Attach source run/message/file, creator, timestamp, scope, retention policy, confidence, and last verification. In the dashboard, show “why this was recalled” and let the user correct, demote, pin, or reject it. Never present a derived inference as an explicit user fact.

2. **Scopes and capability-based recall.** Make `global`, `project`, `workspace`, `connector`, `session`, and `delegated-agent` scopes explicit. Default to the narrowest scope; require an opt-in to promote a fact upward. Enforce scope in the retrieval/execution layer, not with prompt instructions. A connector should receive only the memory fields needed for its task, and delegation should use a signed, expiring memory capsule rather than access to the entire store.

3. **Memory write gate and quarantine.** Do not write retrieved web pages, email, tool output, plugin text, or delegated-agent output directly into durable memory. Stage them as untrusted observations, scan for secrets and injection-like instructions, require user approval for sensitive or cross-scope writes, and preserve the original source. Add integrity hashes, schema validation, size/TTL limits, and a “memory quarantine” view for suspicious records. Retrieval should return trust labels and provenance to the executor.

4. **True inspect/edit/delete/export.** Provide a searchable memory browser plus CLI/TUI commands such as `memory why <id>`, `memory sources <id>`, `memory correct`, `memory forget`, `memory export`, and `memory purge --scope`. A purge job must traverse canonical records, summaries, embeddings, caches, checkpoints, delegated capsules, and provider-side files where applicable; display pending/complete/failed status and keep only the minimum audit evidence needed to prove the operation. Support portable, encrypted JSONL/SQLite export so users can migrate or restore continuity.

5. **Continuity as an event-sourced run ledger.** Persist resumable checkpoints separately from semantic memory: plan version, tool calls, outputs, approvals, policy decisions, artifacts, and model/provider identifiers. Let the user resume, fork, roll back, or discard a run. Summaries link to source ranges and are versioned; context compaction never destroys the underlying transcript unless the retention policy says so. This improves recovery and makes “what happened while I was away?” auditable.

6. **Privacy-preserving storage and routing.** Default to local encrypted-at-rest memory with OS keychain or user-supplied keys. Add per-provider data-flow labels (local, self-hosted, hosted API, third-party connector), redaction before model calls, ephemeral mode, per-record TTL, and a “no durable memory” task profile. Make the dashboard show exactly which bytes leave the machine and which provider retention policy applies; do not imply self-hosting protects data sent to a hosted model or connector.

7. **Continuity and poisoning evaluation suite.** Ship fixtures and metrics for recall precision, stale-fact correction, contradictory memories, deletion propagation, cross-project leakage, prompt injection in retrieved content, replayed approvals, and poisoned-memory triggers. Test the policy/executor boundary with instrumented tools. Report measured results for the selected model/configuration, not a universal safety claim.

8. **Safe interview-prep mode, not a covert copilot.** Offer a memory-backed practice coach that stores the user’s resume, target role, feedback, and prior practice answers in a dedicated job-search scope, then generates mock questions, rubric-based feedback, and spaced practice. Provide an accessibility adapter that is visibly labeled, records consent/rules, supports screen-reader/transcription aids where authorized, and never invents content. Block or watermark live answer generation during an interview session and surface a reminder to check the employer’s policy. A disclosed “AI allowed” mode can help the candidate critique or cite AI-generated work only when the assessment rules permit it.

## Cautions and product decisions

- Memory improves continuity but can amplify stale, wrong, sensitive, or attacker-planted context. Optimize for **user agency and recoverability**, not maximum retention.
- “Delete” must cover semantic derivatives and caches, not only the visible note. Provider-side retention and legal holds may impose limits; show those limits plainly.
- A user approval button is an authorization signal, not OS isolation. Use least-privilege tools, policy checks outside the model, process/container controls, network egress restrictions, and—when the threat model warrants it—a VM or separate host.
- Do not market covert interview-answer feeding as productivity. It can misrepresent competence and violate employer rules or consent. Invest in mock coaching and disclosed accessibility support instead.
- Self-hostable does not mean risk-free: plugins, connectors, model servers, images, and delegated agents remain supply-chain and exfiltration risks. Default-deny new capabilities and make every trust boundary inspectable.
- The ACM study and AgentPoison paper provide useful evidence and threat models, not proof of market-wide prevalence or guaranteed attack success. Validate APEX designs with consented usability and security testing before making effectiveness claims.

## References

[1]: https://dl.acm.org/doi/10.1145/3706599.3720158 "Users’ Expectations and Practices with Agent Memory (ACM CHI EA 2025)"
[2]: https://help.openai.com/en/articles/8590148-memory-faq "Memory in ChatGPT (OpenAI Help; page accessed 2026)"
[3]: https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/memory-tool "Memory tool (Anthropic documentation; page accessed 2026)"
[4]: https://arxiv.org/html/2310.08560 "MemGPT: Towards LLMs as Operating Systems (arXiv v2, February 12, 2024)"
[5]: https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html "AI Agent Security Cheat Sheet (OWASP; page accessed 2026)"
[6]: https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf "Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile (NIST AI 600-1, July 26, 2024)"
[7]: https://proceedings.neurips.cc/paper_files/paper/2024/file/eb113910e9c3f6242541c1652e30dfd6-Paper-Conference.pdf "AgentPoison: Red-teaming LLM Agents via Poisoning Memory or Knowledge Bases (NeurIPS 2024)"
[8]: https://eur-lex.europa.eu/eli/reg/2016/679/oj "Regulation (EU) 2016/679 (General Data Protection Regulation; adopted April 27, 2016)"
[9]: https://www.nist.gov/privacy-framework "NIST Privacy Framework (NIST; page accessed 2026)"
[10]: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-190.pdf "Application Container Security Guide (NIST SP 800-190, September 2017)"
[11]: https://www.pa.gov/agencies/hrmoa/resources/generative-ai-hiring-guidance "Guidance for Generative AI Tools & Job Seekers (Commonwealth of Pennsylvania; page accessed 2026)"
[12]: https://www.canada.ca/en/public-service-commission/services/appointment-framework/guides-tools-appointment-framework/ai-hiring-process.html "Artificial intelligence in the hiring process (Public Service Commission of Canada; page dated June 1, 2026)"
[13]: https://www.ada.gov/resources/ai-guidance/ "Algorithms, Artificial Intelligence, and Disability Discrimination in Hiring (U.S. DOJ ADA.gov, May 12, 2022)"
