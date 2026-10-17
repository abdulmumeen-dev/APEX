# APEX product opportunity: interview assistance and integrity

## User problem

Job candidates need practice, feedback, and sometimes disclosed accessibility support, but a live system that secretly listens and feeds answers can misrepresent a candidate’s knowledge and undermine the employer’s assessment. The same runtime that makes APEX useful—model access, audio/transcript input, memory, connectors, delegation, and tools—could also become an invisible answer channel or a privacy/security liability. APEX should therefore make **practice**, **disclosed accessibility assistance**, and **covert answer-feeding** separate product modes, with the last one refused rather than optimized.

## Documented evidence

The evidence below is distinct from the product recommendations that follow.

1. **Generative AI can inflate asynchronous-interview scores.** In a preregistered experiment published 24 June 2024, 245 participants completed asynchronous video interviews with no ChatGPT, verbatim ChatGPT, or personalized ChatGPT conditions. The two ChatGPT conditions received considerably higher overall and content ratings, but lower honesty ratings; they also rated the procedure as less fair. The authors conclude that AI use can threaten AVI validity. This is one experiment, not an estimate of how common cheating is or proof that detection generalizes to live interviews. [1]

2. **Covert live answer-feeding is a documented commercial product category.** LockedIn AI advertises an assistant that listens to interviews, supplies real-time answers and code solutions, and provides feedback “only you can see.” Its site also advertises a stealth background mode and a remote helper who stays outside the interview call and is invisible to the interviewer. These are vendor claims about functionality, not independently verified user counts or effectiveness. [2]

3. **Assessment quality improves with structure rather than improvisation.** The U.S. Office of Personnel Management (OPM) says higher-structure interviews show higher validity, rater reliability, rater agreement, and less adverse impact. Its September 2008 practical guide recommends job analysis, job-related competencies, rating scales, probes, pilot testing, interviewer guidance, and documentation. [3] [4]

4. **Accessibility support should enable participation without lowering job-related standards.** The U.S. Department of Labor’s Office of Disability Employment Policy says employers should explain the process in advance, make reasonable accommodations such as interpreters or alternate test formats, ask job-related questions, and hold applicants with disabilities to the same standards. [5] This supports disclosed captions, transcription, communication support, pacing, and other user-controlled aids; it does not establish that an undisclosed answer generator is an accommodation.

5. **Interview data is sensitive and should be minimized.** The UK Information Commissioner’s Office (ICO) says recruiters should not collect excessive interview information; video recording is not usually necessary, candidates may make subject-access requests for interview notes, and remote interviews may require a data-protection impact assessment. It also recommends clear retention periods, secure deletion, and anonymisation where information is retained only for statistics. [6] [7]

6. **A UI approval prompt is not an isolation boundary.** NIST’s September 2017 Application Container Security Guide states that containers share a kernel and do not provide as clear or concrete a security boundary as a VM; careless capabilities, privileges, or host-volume mounts can let a container interact with the host. APEX must not describe a confirmation dialog as sandboxing. [8]

## Product design recommendations for APEX

These are recommendations, not documented market findings.

1. **Ship explicit interview modes with a hard policy boundary.** Provide (a) **Practice**: private mock interviews, generated follow-up questions, rubric-based feedback, and post-session coaching; (b) **Disclosed support**: captions, transcript, translation, note-taking, user-controlled pacing, and communication aids, with an on-screen disclosure template; and (c) **Live answer-feeding**: disabled by default and not offered as a stealth/overlay/remote-helper feature. The CLI/TUI, API, and dashboard should expose the same mode and policy state so a user cannot switch interfaces to bypass it.

2. **Make practice an integrity-preserving coach, not an answer vending machine.** Use OPM-style job analysis and competency rubrics: let a candidate supply a job description and their own experience, run a timed mock interview, probe vague claims, and provide feedback after each round. Label suggestions as “draft,” “from your supplied experience,” or “model-generated”; require the candidate to confirm facts; and never invent accomplishments. Store practice artifacts locally or in an explicitly selected provider, with a one-click export/delete.

3. **Create a disclosed accessibility profile.** Let users choose captions, speech-to-text, text-to-speech, translation, larger text, extra response time, repeat/clarify prompts, structured note cards, or a communication board. Produce a plain-language disclosure card the user can share with the interviewer or recruiter. Keep the support assistive and user-directed: it may clarify or render communication, but must not silently compose substantive answers during a live assessment. Do not imply that APEX determines whether an accommodation is legally required.

4. **Add an employer-compatible “integrity contract” rather than surveillance.** A candidate can generate a signed session manifest stating the selected mode, model/provider, tools enabled, recording status, and retention deadline. In disclosed-support mode, a visible banner and optional periodic reminder remain on the candidate’s screen. The manifest is evidence of configuration, not proof that a person did or did not cheat; do not build biometric, gaze, keystroke, or “AI accent” detection into APEX.

5. **Build privacy defaults around candidate control.** Default to no recording, no camera capture, no persistent memory, no third-party delegation, and no upload of raw audio. Use local transcription where available; otherwise show the provider, data regions/terms where known, and what is sent. Redact resumes, contact details, and health/disability information before telemetry; give per-session expiry and secure deletion; and make logs exportable without exposing other interview participants. Align retention settings with the employer’s stated notice and applicable law rather than promising universal compliance.

6. **Treat the live-interview boundary as a security boundary.** During live sessions, disable arbitrary shell, browser automation, external search, remote delegation, hidden overlays, and tools that can send messages or alter files. Enforce least privilege outside the model: per-tool allowlists, read-only mounts, network egress policy, credential isolation, resource/time limits, and atomic parameter-bound approval for any high-impact action. Use a hardened VM or equivalent stronger isolation for untrusted skills; containers alone are not sufficient. Log tool calls and policy decisions with sensitive-data redaction, and run adversarial tests for prompt injection, memory poisoning, exfiltration, approval bypass, and multi-agent escalation. OWASP’s agent-security guidance specifically recommends scoped tools, authorization middleware outside the model, session/memory isolation, structured audit logs, and repeatable adversarial testing. [9]

7. **Offer an employer-side structured-interview kit only as a separate, consented workflow.** APEX can help a recruiter draft job-related questions, probes, anchored rating scales, and a consistent interview guide, then require human review. Candidate responses should be scored against declared competencies, not inferred personality, disability, gaze, or emotion. If recording or automated scoring is enabled, the workflow must present a notice, purpose, retention period, appeal/contact path, and access controls. This turns integrity into better assessment design instead of an arms race of surveillance.

## Cautions and open questions

- The study in [1] demonstrates score inflation in an asynchronous experiment; it does **not** establish prevalence, broad effectiveness, or the reliability of any cheating detector in live interviews.
- The existence and marketing claims in [2] document a capability category; the vendor’s “1M+ users,” ratings, and performance claims are not treated here as verified market evidence.
- Accessibility law varies by jurisdiction and job context. APEX should support a user’s request and disclosure, not decide eligibility or provide legal advice. Employers still need to assess whether a requested aid is reasonable and whether the process measures essential, job-related functions.
- Transcripts, resumes, voice, video, health/disability disclosures, and interviewer speech can be personal or sensitive data. Self-hosting reduces third-party exposure but does not remove consent, access, retention, breach, or employment-law obligations.
- A candidate-visible approval prompt is only a UX control. It cannot stop a malicious skill or model from using an over-privileged connector; enforce policy in the execution layer and use real OS/VM isolation where the threat model requires it.
- “Integrity” should not become blanket monitoring. Avoid covert screen capture, webcam proctoring, biometric inference, emotion recognition, or automated rejection based on weak behavioral signals. Validate any employer-facing workflow with legal, accessibility, and industrial-organisational expertise.

**Confidence:** High confidence in the documented distinctions and security/privacy constraints; medium confidence in the prioritization of the proposed APEX features because no APEX user research or controlled product experiment was supplied.

## References

[1]: https://onlinelibrary.wiley.com/doi/10.1111/ijsa.12491 "ChatGPT, can you take my job interview? Examining artificial intelligence cheating in the asynchronous video interview" (first published 24 June 2024)
[2]: https://www.lockedinai.com/ "LockedIn AI — AI interview assistant and live coaching product page" (publication date not stated; vendor marketing)
[3]: https://www.opm.gov/policy-data-oversight/assessment-and-selection/other-assessment-methods/structured-interviews/ "U.S. OPM: Structured Interviews" (publication date not stated)
[4]: https://www.opm.gov/policy-data-oversight/assessment-and-selection/structured-interviews/guide.pdf "U.S. OPM: Structured Interviews: A Practical Guide" (September 2008)
[5]: https://www.dol.gov/agencies/odep/publications/fact-sheets/focus-on-ability-interviewing-applicants-with-disabilities "U.S. Department of Labor ODEP: Focus on Ability: Interviewing Applicants with Disabilities" (publication date not stated)
[6]: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/employment/recruitment-and-selection/shortlisting-testing-and-interviewing-candidates/ "UK ICO: Employment practices and data protection — shortlisting, testing and interviewing candidates" (guidance page; publication date not stated)
[7]: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/employment/recruitment-and-selection/keeping-recruitment-records/ "UK ICO: Employment practices and data protection — keeping recruitment records" (guidance page; publication date not stated)
[8]: https://csrc.nist.gov/pubs/sp/800/190/final "NIST SP 800-190: Application Container Security Guide" (published September 2017)
[9]: https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html "OWASP: AI Agent Security Cheat Sheet" (publication date not stated)
