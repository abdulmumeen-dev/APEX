# Security policy

## Reporting

Please **do not** file public issues containing exploit details, credentials, or private data. Use GitHub's private vulnerability reporting feature if it is enabled for this repository; otherwise contact the repository owner privately through GitHub.

Include the affected version/commit, impact, prerequisites, and a minimal reproduction. Do not include live API keys, OAuth cookies, database dumps, or third-party user data. A maintainer may request a safe reproduction or additional context.

## Scope

Reports involving authentication, cross-user data access, credential handling, endpoint validation/SSRF, tool authorization, bridge delegation, or unsafe automation are especially relevant. A model being persuaded to produce harmful text is not by itself a software vulnerability; a reproducible path to unauthorized data access or side effects is.

## Current security posture

APEX's initial threat boundaries and implemented safeguards are documented in [`docs/threat-model.md`](docs/threat-model.md). The project is early-stage and is not yet suitable for unrestricted public access or unattended consequential actions. Please review the threat model before deploying it with sensitive data.
