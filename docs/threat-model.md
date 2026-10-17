# APEX threat model (current first implementation)

**Status:** initial implementation baseline; not a certification or assurance claim. Update this document as tools, adapters, and deployment modes change.

## Assets

- User conversations and task prompts.
- Model API credentials and optional bridge tokens.
- Workspace file contents and saved memories.
- Run/step records, workflow definitions, and approval/delegation intent.
- The application database and operator encryption key.

## Trust boundaries

1. **Browser to APEX server:** Browser requests are authenticated with the current Manus OAuth/session flow. User-owned records must be scoped by authenticated user ID.
2. **APEX server to configured model endpoint:** Task content, system instructions, tool schemas, and selected conversation context are sent to the operator-selected model endpoint. APEX cannot guarantee that a third-party model provider does not retain or train on that data; consult the selected provider's terms.
3. **APEX server to optional bridge peer:** When the user explicitly enables delegation for a run, APEX sends the bounded delegation payload to the selected, tested APEX Bridge v1 peer. That peer receives the submitted context and may return untrusted content.
4. **Server to endpoint addresses:** User-configured model and bridge URLs cross a network boundary. Redirects are rejected and DNS is pinned for the connection. Private/reserved addresses are blocked unless the operator explicitly enables `APEX_ALLOW_PRIVATE_ENDPOINTS=true` on a trusted self-hosted installation.
5. **Database and encrypted credentials:** API keys and bridge tokens are encrypted using AES-256-GCM with the operator's `APEX_ENCRYPTION_KEY`. Losing or changing that key makes stored credentials undecryptable; back up and rotate it deliberately.

## Implemented safeguards

- API-key and bridge-token values are not returned in profile APIs; credentials are encrypted at rest when configured.
- Model/bridge endpoint requests use bounded, redirect-free, DNS-pinned HTTP transport with conservative private/reserved-address checks.
- Agent tool calls are bounded by a fixed number of model rounds and tool calls.
- Persistent operations are authenticated and user-scoped.
- External bridge use is disabled per run unless the user explicitly allows it; peer results and stored memories are treated as untrusted input to the model.
- APEX does not expose a general-purpose shell, host filesystem, unrestricted browser, or arbitrary external side-effect tool in this first implementation.
- Runs and tool steps are persisted, but this is not yet a complete append-only or tamper-evident effect ledger.

## Known gaps and residual risk

- Prompt-injection instructions are mitigated by system policy and bounded tools, not eliminated. Model-driven checks are not a security boundary.
- The preview's identity/session and database setup use the Manus web starter; portable self-host authentication is not yet provided.
- Model requests cross the network to the selected endpoint; data-egress policy, per-data-class consent, provider-retention metadata, and model fallback audit are roadmap items.
- The generic bridge is not a sandbox. A connected peer may act with its own authority outside APEX, and APEX cannot independently verify all external effects.
- Automatic schedules, webhook callbacks, typed approval/resume for consequential operations, OS/container isolation, shell execution, and browser execution are not implemented.
- Hosted Preview cannot reach a user's local `localhost`; private endpoints require a deliberately configured trusted self-host deployment.
- Development and published environments may share the managed database. Avoid destructive migrations and test data in user records.

## Operator guidance

- Use HTTPS outside local development. Keep the encryption key, provider keys, bridge tokens, and database URL out of the repository and logs.
- Keep `APEX_ALLOW_PRIVATE_ENDPOINTS=false` on public or multi-user deployments. Enabling it can grant the server access to internal network services; only a trusted operator should opt in.
- Use a dedicated, least-privilege model key and bridge account; rotate/revoke them through the provider if exposed.
- Review the selected model endpoint's retention, training, region, and telemetry terms before sending sensitive data.
- Do not enable public users or unattended automations until authentication, isolation, approvals, rate limits, backups, and operational monitoring are suitable for that deployment.
- Treat retrieved pages, files, model output, memories, and bridge responses as untrusted data.

## Reporting a vulnerability

Do not publish exploit details in a public issue. Use the repository's private vulnerability-reporting channel when it is enabled, or contact the maintainers privately through the repository owner. Include affected commit/version, impact, and a minimal reproduction. Avoid sending real keys, personal data, or third-party customer data.
