# APEX CLI

The CLI is a client of the APEX agent, not a separate chat simulation. **Remote mode** calls the authenticated APEX server and shares its actual provider, policy, Skills, memory, workflow records, and run history. **Local mode** runs a compatible model loop on the machine where the CLI is invoked and can operate on an explicitly chosen project directory.

## From a source checkout

Requirements: Node.js 22, pnpm 10.18, and a configured compatible APEX server for remote mode.

```bash
pnpm install --frozen-lockfile
pnpm cli help
```

### Remote server mode

1. Sign into the APEX dashboard and open **CLI**.
2. Create a personal token. It is displayed once; copy it to a trusted terminal.
3. Run:

```bash
pnpm cli login --server=https://YOUR-APEX-SERVER
# Paste the token at the hidden prompt.
pnpm cli status
pnpm cli run "Summarize this project plan"
pnpm cli chat
pnpm cli history
pnpm cli skills
pnpm cli plugins
pnpm cli logout
```

- Tokens use the `apx_live_...` format. APEX stores only a SHA-256 hash, limits each owner to ten active tokens, records last-used time, and supports revocation from the dashboard.
- The token is entered interactively and is never accepted as a command-line argument. The CLI writes it into the current user's XDG config directory with `0700` directory and `0600` file permissions.
- Remote token requests use HTTPS. Loopback HTTP is accepted for local development. The CLI uses bearer-token authentication and the API applies a per-token in-memory rate limit.
- `apex run` runs a real task and returns its actual status/trace ID. It never fabricates provider outputs. `--delegate` and `--allow-plugins` are opt-in per command and authorize sending relevant task data outside APEX.
- The hosted preview currently needs a real tested model profile before remote tasks can complete. Without one, APEX reports that execution is blocked rather than substituting canned answers.

### Local project mode

Configure a compatible, tool-calling model endpoint through the process environment or an **untracked** `.env` file, then run:

```bash
APEX_MODEL_BASE_URL=http://localhost:11434/v1 \
APEX_MODEL_ID=your-tool-capable-model \
pnpm cli local --cwd ./my-project "Explain how authentication works"

pnpm cli doctor
```

Local mode provides real file listing, reading, literal search, and file writes scoped to `--cwd` (defaults to the current working directory). It excludes common secret paths and files, dependencies/build output, `.env`, and Git internals; it rejects symlink traversal. Review the exclusions in `bin/apex.mjs` before pointing it at a sensitive repository.

- File writes are shown and require confirmation unless the operator passes `--auto-write`.
- Shell is disabled by default. `--allow-shell` makes a shell tool available, but **each exact command still requires an interactive user confirmation**. When allowed, a command runs with the current OS user's permissions and inherited environment.
- These checks are not an OS sandbox. There is no isolated container, VM, seccomp profile, or separate low-privilege worker in this release. Do not process untrusted repositories or hostile model instructions with shell enabled. Do not place API keys/secrets in the selected project's environment.
- The selected model server must be reachable from the CLI machine; a hosted APEX Preview cannot reach the user's desktop `localhost`.

## API routes used by remote mode

The CLI uses the same personal-token-protected REST API as other terminal tools:

- `GET /api/v1/status`
- `GET /api/v1/runs`
- `GET /api/v1/skills`
- `GET /api/v1/plugins`
- `POST /api/v1/runs`

API requests are not a general administrative token. The current token is owner-scoped and can submit APEX tasks, read its own run list, and list its Skills/Plugins. Revoke it promptly if lost.

## Current limits

Remote execution depends on an operator-configured compatible provider; there is no default hosted model. Current local mode is a command-line client, not a full-screen TUI. Streaming, interrupt propagation through every model/tool side effect, durable scheduled jobs, OS-level sandboxing, self-host authentication independent of Manus OAuth, and signed extension bundles remain roadmap items.
