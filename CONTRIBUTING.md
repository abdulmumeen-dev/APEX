# Contributing to APEX

Thank you for considering a contribution. APEX is an independent agent with an optional, explicitly governed bridge layer. Contributions should strengthen useful capabilities without weakening portability, user control, or truthful reporting.

## Before opening a pull request

1. Search existing issues and open a focused issue for substantial changes.
2. For security-sensitive work, read [`docs/threat-model.md`](docs/threat-model.md) and include the changed trust boundary, data flow, and residual risks.
3. For model providers, bridges, tools, or extensions, document credential handling, data sent, permissions, timeouts, result limits, cancellation, and failure modes.
4. Never commit API keys, cookies, database records, generated user files, or private prompt data.

## Local checks

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

Schema changes must use reviewed, additive Drizzle migrations. Never test destructive migrations against an environment that may contain user data.

## Pull-request expectations

- Keep features modular and type-safe; add deterministic tests for parsing, authorization, owner scoping, and error paths.
- Do not label a provider/bridge connected until an actual health/handshake check passes.
- Do not use canned responses as substitutes for real API calls. Clearly label any test fixture.
- Place consequential side effects behind an explicit permission and approval design.
- Treat model output, retrieved content, files, memories, and peer output as untrusted.
- Update README, roadmap, bridge/protocol documentation, and the threat model when behavior or trust boundaries change.
- Include a brief migration and rollback note when changing durable records or runtime configuration.
- Preserve attribution and check the license of new code, packages, model weights, and protocol SDKs. APEX itself is MIT-licensed; this does not relicense third-party components.

## Project decisions

The repository owner maintains scope, release, licensing, and governance decisions. Until a formal governance document is adopted, open a discussion issue for substantial product or compatibility proposals.
