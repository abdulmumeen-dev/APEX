# APEX

**One agent. Your model. Your machine.**

APEX is an open-source, standalone, local-first agent workstation. Its local CLI and desktop dashboard use a local execution loop and need neither an APEX-hosted service nor an APEX account. Choose local Ollama (no provider key) or configure a cloud model API directly with your own provider key. The hosted dashboard and remote CLI remain a separate optional deployment with their existing server-side loop.

Start locally with Ollama and a compatible model; local CLI use needs no APEX server, hosted-model account, or API key. Hosted APIs and compatible servers are optional. Optional agent bridges are separate from model providers, and APEX works without bridges.

## What is implemented in this first cut

- A real authenticated task loop: save a user task, call a tested model profile, validate tool calls, run bounded APEX tools, persist the actual run and step trace, and return the provider's result or an honest blocked/error state.
- A React workbench for the agent, model setup, optional bridges, Skills, read-only API Plugins, CLI tokens, workflows, run history, private memory/files, approvals, and security boundaries.
- User-selected OpenAI-compatible model API, server, and local endpoint profiles. A model becomes the default only after a live model-list check succeeds.
- AES-256-GCM encryption for saved model/bridge/plugin API keys. The server never returns stored plaintext keys; key storage requires the instance operator's `APEX_ENCRYPTION_KEY`.
- A real APEX terminal client (`bin/apex.mjs`) with remote login, status, run, persistent chat, history, Skills, Plugins, token logout, and a local project mode.
- Local project tools to list/read/search/write text files inside an explicitly selected root. Secret and dependency paths are excluded and symlinks are rejected. File writes are confirmed one by one unless the user explicitly selects `--auto-write`.
- An **opt-in** local shell tool. It is disabled by default; after it is enabled, every exact command still requires user confirmation. It runs as the current operating-system user and is **not a sandbox**.
- User-authored, versioned Skills. Skills are instruction packs, not executable code; at most eight can be enabled. A starter **Interview Practice Coach** supports mock practice and disclosed accessibility help. It does not provide covert live answers, impersonate a candidate, or invent experience.
- User-configured, read-only JSON API Plugins. The endpoint is fixed and live-tested before enabling; use is separately authorized for each task; private-network addresses and redirects are blocked by default.
- Real memory and versioned virtual workspace-file tools, workflow drafts, and manual **Run once** for a saved workflow.
- Optional, generic authenticated APEX Bridge v1 peers. Delegation is off by default and task context is shared only for an explicitly permitted run.
- A standalone loopback local dashboard and Electron shell. Local CLI and desktop runs share one local task loop, with model setup, run traces, exact file-write approvals, and labeled work areas. A Linux AppImage has been generated and smoke-opened through its workspace chooser and main window under Xvfb; it remains an unsigned development artifact.

The project also includes a source-backed [agent landscape review](docs/agent-landscape.md), [desktop-agent review](docs/desktop-agent-review.md), [product opportunity reports](docs/product-ideas/), [capability-gap register](docs/capability-gap-register.md), [cloud provider compatibility review](docs/cloud-provider-compatibility-review.md), [capability roadmap](docs/roadmap.md), [threat model](docs/threat-model.md), [CLI guide](docs/cli.md), and [bridge protocol](docs/apex-bridge-v1.md).

## Not production-complete yet

Do not use this first cut as an unattended production computer operator. An Electron desktop shell and Linux AppImage have been built; the AppImage smoke-opened under Xvfb through the native workspace chooser and main window, but is unsigned, not tested on a real user machine, and not a published release. Windows/macOS targets have not been built or tested here. The local dashboard has clearly labeled work areas. **Create Game**, **Create Video**, browser/computer control, general web research, durable local automations, local MCP/app integrations, richer memory, a complete effect ledger, cancellation across side effects, provider failover/capability negotiation, and OS/container isolation remain unimplemented or incomplete. A section tab is not proof that its feature works. The desktop and CLI do not magically turn an ordinary host into a sandbox. Self-host authentication beyond the Manus OAuth starter also remains to be delivered.

Muse is Meta's personal agent; OpenAI's announced always-on agent is Dots. The product pages reviewed do not document a stable third-party control API for either, and APEX does not claim a direct integration. APEX Bridge v1 works only with a peer that implements [the published contract](docs/apex-bridge-v1.md).

## Start the local agent (no API key)

The local CLI and desktop workbench run without the hosted APEX server or database. From an APEX source checkout, install dependencies and launch the guided setup:

```bash
pnpm install --frozen-lockfile
pnpm cli setup
pnpm cli skills starter interview-practice-coach
pnpm cli local --cwd ./your-project "Summarize this project"
```

APEX checks for Ollama on this computer. If it is missing, setup prints the official download page and asks you to install it; APEX does not silently install software. Setup uses a compatible model already installed when possible, or offers `qwen3.5:4b` and asks before pulling it. The model download is roughly 3.3–4.0 GB. Local model requests go to Ollama on this computer; no provider API key or hosted APEX account is needed. A published npm package is not available yet, so these commands run from the source checkout.

Local file tools stay inside `--cwd` (or the current directory), exclude common secret/dependency/build paths, and reject symlinks. File writes require confirmation by default. Shell is disabled unless you add `--allow-shell`; every exact command still needs approval and runs with the current OS user's permissions. This is a confirmation guardrail, not a sandbox. Do not enable shell on an untrusted repository.

The optional built-in Interview Practice Coach Skill helps with mock interviews and truthful feedback grounded in the user's own experience. It does not provide covert live answers, candidate impersonation, or fabricated credentials.

### Open the local dashboard or desktop

After configuring a model, start the loopback-only dashboard daemon with `pnpm cli dashboard`; open the printed `http://127.0.0.1:…/local` URL. It is single-user and local to this machine, not an OS sandbox. Or start the Electron app with `pnpm desktop:dev`, which opens a native workspace-folder chooser. The desktop rail includes **Agent**, **Code & Files**, **Create Game**, **Create Video**, **Browser & Computer**, **Research**, **Automations**, **Skills**, **Integrations**, **Models**, **Run History**, **Memory & Knowledge**, and **Assets & Files**. Each section shows whether it is available, limited, CLI-only, hosted-only, or planned; planned sections are informational and do not start fake work.

On Linux, build a portable AppImage with `pnpm desktop:linux`; the current unsigned artifact is written to `dist/installers/`. Windows and macOS build targets are configured for their respective operating systems. A multi-OS GitHub Actions workflow uploads build artifacts but does not publish a release. No signed/notarized public download is available yet.

## Run the dashboard and API

The optional hosted workbench requires Node.js 22, pnpm 10.18, and a MySQL-compatible database. It currently uses the Manus OAuth/session starter by default; standalone hosted authentication remains incomplete. This is separate from `pnpm cli dashboard`, which uses the local daemon and no database.

```bash
cp .env.example .env
# Configure the database and current login/session settings in .env.
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm dev
```

Open `http://localhost:3000`. Development and published application instances share the configured database; use additive migrations and do not test destructive changes against user data.

### Connect a model

1. Sign in and open **Models**.
2. Add a compatible API/server/local endpoint, model identifier, and (for a hosted model API) key.
3. Test the connection. APEX won't mark it connected or make it the default until the actual model-list request succeeds.
4. API-key storage requires `APEX_ENCRYPTION_KEY` in the server environment: 32 random bytes represented as 64 hex characters or Base64.

On a trusted self-host only, set `APEX_ALLOW_PRIVATE_ENDPOINTS=true` if APEX should reach private-network or local model endpoints. Keep it `false` on a public/hosted service. A cloud Preview cannot reach `localhost` on your computer; the model and APEX server need a network path between them.

### Use the CLI

Run from the source checkout:

```bash
pnpm cli help
pnpm cli login --server=https://YOUR-APEX-SERVER
pnpm cli status
pnpm cli run "Review this task"
pnpm cli chat
pnpm cli history
pnpm cli dashboard
```

Create a personal token in **CLI** in the dashboard. Enter it at the terminal's hidden prompt, never as a shell argument. The server stores only a SHA-256 hash; the token is shown once. Remote runs share the web agent engine and owner-scoped data.

Local mode points APEX at a project on the computer where the CLI is running:

```bash
pnpm cli setup
pnpm cli local --cwd ./your-project "Summarize the code structure"
pnpm cli doctor
```

To use a different compatible endpoint, set `APEX_MODEL_BASE_URL` and `APEX_MODEL_ID`; `APEX_MODEL_API_KEY` is optional and only needed by a backend that requires it. The model must support compatible tool calling. Local CLI mode does not yet provide browser/mouse/keyboard computer control; that remains roadmap work requiring an isolated executor.

## Environment reference

Copy `.env.example` to `.env`. The hosted environment provides some values; local operators supply what their deployment requires.

| Variable                         | Purpose                                                                |
| -------------------------------- | ---------------------------------------------------------------------- |
| `PORT`                           | HTTP listener (defaults to `3000`)                                     |
| `DATABASE_URL`                   | MySQL connection string                                                |
| `MANUS_PROJECT_ID`               | Current Manus OAuth application identity                               |
| `MANUS_JWT_SECRET`               | Signs and verifies application sessions                                |
| `MANUS_OAUTH_API_URL`            | Manus OAuth API endpoint                                               |
| `OWNER_OPEN_ID`                  | Optional starter owner-role hint                                       |
| `MANUS_API_URL`, `MANUS_API_KEY` | Optional Manus platform services                                       |
| `APEX_ENCRYPTION_KEY`            | 32-byte AES-256-GCM key for user-supplied model/bridge/plugin secrets  |
| `APEX_ALLOW_PRIVATE_ENDPOINTS`   | Explicit self-host opt-in for private/local endpoints; default `false` |

Never commit `.env`, OAuth/session secrets, API keys, encryption keys, CLI tokens, or database credentials.

## Development

```bash
pnpm check
pnpm test
pnpm build
```

Migrations live in `drizzle/`. `pnpm db:migrate` applies checked-in migrations; `pnpm db:push` generates and applies schema changes. Managed development and published environments may share data: avoid destructive migrations and never test against user records.

## Project structure

- `client/` — authenticated hosted workbench, public Preview, and the local Agent/work-area dashboard.
- `server/agent/` — APEX run loop, native tools, memory/workspace, Skills, API Plugins, tokens, and workflows.
- `server/providers/` — user-selected model profiles, compatible chat API, encryption, and endpoint safety.
- `server/bridges/` — optional authenticated APEX Bridge v1 service.
- `bin/apex.mjs` — CLI, Ollama onboarding, local Skills, and the callable local agent loop.
- `bin/apex-dashboard.mjs` — loopback-only local API/dashboard daemon, encrypted local model config, runs, and file approvals.
- `desktop/` — Electron shell, native workspace chooser, app icon, and local BrowserWindow policy.
- `.github/workflows/desktop-build.yml` — separate Linux/Windows/macOS build jobs that upload unsigned artifacts only.
- `drizzle/` — MySQL schema and additive migrations.
- `docs/` — product research, capability gaps, roadmap, threat model, CLI, and bridge protocol.

## Open-source governance

APEX uses the **MIT License**. See [LICENSE](LICENSE), [CONTRIBUTING.md](CONTRIBUTING.md), and [SECURITY.md](SECURITY.md). Future model weights, extensions, and third-party dependencies retain their own license terms.
