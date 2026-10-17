import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  AlertTriangle,
  BookOpen,
  Check,
  Copy,
  KeyRound,
  Plus,
  RefreshCw,
  ShieldCheck,
  TerminalSquare,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type SkillDraft = {
  name: string;
  description: string;
  instructions: string;
  enabled: boolean;
};

const blankSkill: SkillDraft = {
  name: "",
  description: "",
  instructions: "",
  enabled: false,
};

const interviewPracticeSkill: SkillDraft = {
  name: "Interview Practice Coach",
  description:
    "Private mock interviews and truthful, competency-based feedback. No covert live answer feeding.",
  instructions: `Use this Skill only for interview preparation and mock practice, or for disclosed accessibility support that the interviewer has permitted. Never generate or relay covert answers during a live hiring assessment, impersonate the candidate, or hide an assistance overlay.\n\nFor practice:\n1. Ask for the role and job description, then ask which real experience the user wants to practice discussing. Never invent achievements, qualifications, or employment history.\n2. Ask one realistic question at a time. Let the user answer before coaching.\n3. Give specific, kind feedback against job-related competencies; identify where the user's own example needs more detail.\n4. Ask a follow-up question and help the user make their own answer clearer without changing the underlying facts.\n5. End with a concise practice plan and clearly label model-generated suggestions.\n\nFor accessibility, provide captions, pacing suggestions, rephrasing of a question, or user-directed communication support only when the live assistance is permitted and appropriately disclosed. Do not make legal judgments about accommodations.`,
  enabled: false,
};

type PluginDraft = {
  name: string;
  description: string;
  baseUrl: string;
  path: string;
  apiKey: string;
  removeApiKey: boolean;
};

const blankPlugin: PluginDraft = {
  name: "",
  description: "",
  baseUrl: "",
  path: "/",
  apiKey: "",
  removeApiKey: false,
};

function StatusTag({ value, label }: { value: string; label?: string }) {
  const status = value.toLowerCase().replaceAll("_", "-");
  return (
    <span className={`status-pill status-${status}`}>
      <i /> {label ?? value.replaceAll("_", " ")}
    </span>
  );
}

export function SkillsPanel() {
  const utils = trpc.useUtils();
  const skills = trpc.apex.skills.list.useQuery();
  const [draft, setDraft] = useState<SkillDraft>(blankSkill);
  const [editingId, setEditingId] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => utils.apex.skills.list.invalidate();
  const save = trpc.apex.skills.save.useMutation({
    onSuccess: async () => {
      toast.success(editingId ? "Skill version saved." : "Skill saved.");
      setDraft(blankSkill);
      setEditingId(undefined);
      await refresh();
    },
    onError: error => toast.error(error.message),
  });
  const toggle = trpc.apex.skills.setEnabled.useMutation({
    onSuccess: async () => {
      await refresh();
    },
    onError: error => toast.error(error.message),
  });
  const remove = trpc.apex.skills.delete.useMutation({
    onSuccess: async () => {
      toast.success("Skill deleted.");
      if (editingId) {
        setEditingId(undefined);
        setDraft(blankSkill);
      }
      await refresh();
    },
    onError: error => toast.error(error.message),
  });

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    save.mutate({ ...draft, ...(editingId ? { id: editingId } : {}) });
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    input.value = "";
    if (file.size > 24_000) {
      toast.error("Skill files must be 24 KB or smaller.");
      return;
    }
    try {
      const content = await file.text();
      const frontMatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
      const metadata = frontMatter?.[1] ?? "";
      const field = (key: string) =>
        metadata
          .match(new RegExp(`^${key}:\\s*(.*)$`, "mi"))?.[1]
          ?.trim()
          .replace(/^["']|["']$/g, "");
      const instructions = content.slice(frontMatter?.[0].length ?? 0).trim();
      const title =
        field("name") ??
        content.match(/^#\s+(.+)$/m)?.[1]?.trim() ??
        file.name.replace(/\.md$/i, "").replace(/[-_]/g, " ");
      if (!instructions || instructions.length > 24_000) {
        toast.error(
          "This Skill needs instruction text within the 24 KB limit."
        );
        return;
      }
      setEditingId(undefined);
      setDraft({
        name: title.slice(0, 120),
        description: (
          field("description") ?? "Imported from a Markdown Skill file."
        ).slice(0, 1_000),
        instructions,
        enabled: false,
      });
      toast.success("Skill imported. Review it before saving or enabling it.");
    } catch {
      toast.error("Could not read that Skill file.");
    }
  };

  return (
    <>
      <div className="notice">
        <BookOpen size={15} />
        <div>
          <b>Skills add instructions, not executable code</b>
          <span>
            Only enabled Skills are provided to the model. They cannot grant new
            tools or override APEX security rules; keep imported instructions
            untrusted and review changes before enabling them. Limit: eight
            enabled Skills per workspace.
          </span>
        </div>
      </div>

      <section className="panel form-panel">
        <div className="panel-title">
          <div>
            <div className="eyebrow">PORTABLE BEHAVIOR</div>
            <h2>{editingId ? "Edit Skill" : "Create a Skill"}</h2>
          </div>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <BookOpen size={14} /> Import SKILL.md
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,text/markdown"
            hidden
            onChange={handleImportFile}
          />
          {!editingId && (
            <button
              className="button button-secondary"
              type="button"
              onClick={() => setDraft(interviewPracticeSkill)}
            >
              <Plus size={14} /> Interview practice starter
            </button>
          )}
        </div>
        <form className="form-grid" onSubmit={handleSave}>
          <label>
            Name
            <input
              value={draft.name}
              onChange={event =>
                setDraft(current => ({ ...current, name: event.target.value }))
              }
              maxLength={120}
              required
              placeholder="e.g. Release-note writer"
            />
          </label>
          <label>
            Description
            <input
              value={draft.description}
              onChange={event =>
                setDraft(current => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              maxLength={1_000}
              placeholder="When should APEX use this?"
            />
          </label>
          <label>
            Instructions
            <textarea
              value={draft.instructions}
              onChange={event =>
                setDraft(current => ({
                  ...current,
                  instructions: event.target.value,
                }))
              }
              maxLength={24_000}
              required
              rows={7}
              placeholder="Write the reusable guidance APEX should follow. Skills are instructions only, not scripts."
            />
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={event =>
                setDraft(current => ({
                  ...current,
                  enabled: event.target.checked,
                }))
              }
            />
            Enable this Skill after saving
          </label>
          <div className="form-actions">
            {editingId && (
              <button
                className="button button-secondary"
                type="button"
                onClick={() => {
                  setEditingId(undefined);
                  setDraft(blankSkill);
                }}
              >
                Cancel
              </button>
            )}
            <button
              className="button button-primary"
              type="submit"
              disabled={save.isPending}
            >
              {save.isPending ? (
                <RefreshCw className="spin" size={14} />
              ) : (
                <Check size={14} />
              )}
              {editingId ? "Save new version" : "Save Skill"}
            </button>
          </div>
        </form>
      </section>

      <div className="record-list">
        {skills.data?.map(skill => (
          <article className="record-card panel" key={skill.id}>
            <span className="record-icon">
              <BookOpen size={16} />
            </span>
            <div className="record-main">
              <div className="record-title-row">
                <h3>{skill.name}</h3>
                <span className="version-chip">v{skill.version}</span>
                <StatusTag value={skill.enabled ? "enabled" : "draft"} />
              </div>
              <p className="record-subtitle">
                {skill.description || "No description provided."}
              </p>
              <details className="skill-details">
                <summary>Review instructions</summary>
                <pre>{skill.instructions}</pre>
              </details>
            </div>
            <div className="record-actions">
              <button
                className="button button-secondary"
                type="button"
                onClick={() => {
                  setEditingId(skill.id);
                  setDraft({
                    name: skill.name,
                    description: skill.description,
                    instructions: skill.instructions,
                    enabled: skill.enabled,
                  });
                }}
              >
                Edit
              </button>
              <button
                className="button button-secondary"
                type="button"
                disabled={toggle.isPending}
                onClick={() =>
                  toggle.mutate({ id: skill.id, enabled: !skill.enabled })
                }
              >
                {skill.enabled ? "Disable" : "Enable"}
              </button>
              <button
                className="button button-secondary danger-button"
                type="button"
                aria-label={`Delete ${skill.name}`}
                disabled={remove.isPending}
                onClick={() => remove.mutate({ id: skill.id })}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </article>
        ))}
        {!skills.isLoading && skills.data?.length === 0 && (
          <div className="panel empty-panel">
            <BookOpen size={18} />
            <b>No Skills saved</b>
            <span>
              Create a reusable instruction set or add the interview-practice
              starter.
            </span>
          </div>
        )}
        {skills.isLoading && (
          <div className="micro-empty">Loading saved Skills…</div>
        )}
      </div>
    </>
  );
}

export function PluginsPanel() {
  const utils = trpc.useUtils();
  const plugins = trpc.apex.plugins.list.useQuery();
  const modelSetup = trpc.apex.models.setupStatus.useQuery();
  const [draft, setDraft] = useState<PluginDraft>(blankPlugin);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [editingHasApiKey, setEditingHasApiKey] = useState(false);

  const refresh = async () => utils.apex.plugins.list.invalidate();
  const save = trpc.apex.plugins.save.useMutation({
    onSuccess: async () => {
      toast.success("API Plugin saved. Run a live check before enabling it.");
      setDraft(blankPlugin);
      setEditingId(undefined);
      setEditingHasApiKey(false);
      await refresh();
    },
    onError: error => toast.error(error.message),
  });
  const test = trpc.apex.plugins.test.useMutation({
    onSuccess: async result => {
      toast.success(result?.testDetail || "The live API check succeeded.");
      await refresh();
    },
    onError: error => toast.error(error.message),
  });
  const toggle = trpc.apex.plugins.setEnabled.useMutation({
    onSuccess: async () => refresh(),
    onError: error => toast.error(error.message),
  });
  const remove = trpc.apex.plugins.delete.useMutation({
    onSuccess: async () => {
      toast.success("API Plugin deleted.");
      await refresh();
    },
    onError: error => toast.error(error.message),
  });

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    const { removeApiKey, ...rest } = draft;
    save.mutate({
      ...rest,
      ...(editingId ? { id: editingId } : {}),
      ...(removeApiKey ? { removeApiKey: true } : {}),
      ...(rest.apiKey ? {} : { apiKey: undefined }),
    });
  };

  return (
    <>
      <div className="notice notice-warn">
        <AlertTriangle size={15} />
        <div>
          <b>Plugins are real external data calls</b>
          <span>
            APEX supports tested, read-only GET JSON endpoints. Each task needs
            a separate “Allow API Plugins” consent. Only the generated query is
            sent; endpoint responses are untrusted. Credentials require the
            operator encryption key, and private-network addresses are blocked
            on hosted Preview.
          </span>
        </div>
      </div>
      {!modelSetup.data?.encryptedCredentialStorageReady && (
        <div className="info-strip">
          <KeyRound size={14} />
          <span>
            Encrypted credential storage is not configured on this instance.
            Keyless public APIs can be tested; API-key storage will remain
            blocked until the operator sets <code>APEX_ENCRYPTION_KEY</code>.
          </span>
        </div>
      )}

      <section className="panel form-panel">
        <div className="panel-title">
          <div>
            <div className="eyebrow">READ-ONLY API CAPABILITIES</div>
            <h2>{editingId ? "Edit API Plugin" : "Add an API Plugin"}</h2>
          </div>
        </div>
        <form className="form-grid two-col" onSubmit={handleSave}>
          <label>
            Name
            <input
              value={draft.name}
              onChange={event =>
                setDraft(current => ({ ...current, name: event.target.value }))
              }
              maxLength={120}
              required
              placeholder="e.g. Public weather API"
            />
          </label>
          <label>
            Fixed base URL
            <input
              type="url"
              value={draft.baseUrl}
              onChange={event =>
                setDraft(current => ({
                  ...current,
                  baseUrl: event.target.value,
                }))
              }
              required
              placeholder="https://api.example.com"
            />
          </label>
          <label>
            Fixed GET path
            <input
              value={draft.path}
              onChange={event =>
                setDraft(current => ({ ...current, path: event.target.value }))
              }
              required
              placeholder="/v1/search"
            />
          </label>
          <label>
            API key (optional)
            <input
              type="password"
              value={draft.apiKey}
              onChange={event =>
                setDraft(current => ({
                  ...current,
                  apiKey: event.target.value,
                }))
              }
              autoComplete="new-password"
              placeholder={
                editingId
                  ? "Leave blank to keep stored key"
                  : "Leave blank for public APIs"
              }
            />
          </label>
          <label className="span-two">
            Description and appropriate use
            <textarea
              value={draft.description}
              onChange={event =>
                setDraft(current => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              maxLength={2_000}
              required
              rows={3}
              placeholder="Explain what this API returns and what data is appropriate to send."
            />
          </label>
          {editingId && editingHasApiKey && (
            <label className="checkbox-row span-two">
              <input
                type="checkbox"
                checked={draft.removeApiKey}
                onChange={event =>
                  setDraft(current => ({
                    ...current,
                    removeApiKey: event.target.checked,
                  }))
                }
              />
              Remove the previously stored key instead of replacing it
            </label>
          )}
          <div className="form-actions span-two">
            {editingId && (
              <button
                className="button button-secondary"
                type="button"
                onClick={() => {
                  setEditingId(undefined);
                  setDraft(blankPlugin);
                  setEditingHasApiKey(false);
                }}
              >
                Cancel
              </button>
            )}
            <button
              className="button button-primary"
              type="submit"
              disabled={save.isPending}
            >
              {save.isPending ? (
                <RefreshCw className="spin" size={14} />
              ) : (
                <Check size={14} />
              )}
              Save endpoint
            </button>
          </div>
        </form>
      </section>

      <div className="record-list">
        {plugins.data?.map(plugin => (
          <article className="record-card panel" key={plugin.id}>
            <span className="record-icon bridge-icon">
              <TerminalSquare size={16} />
            </span>
            <div className="record-main">
              <div className="record-title-row">
                <h3>{plugin.name}</h3>
                <StatusTag
                  value={plugin.enabled ? "enabled" : plugin.testStatus}
                />
              </div>
              <p className="record-subtitle">{plugin.description}</p>
              <code className="endpoint-label">
                {plugin.baseUrl}
                {plugin.path}
              </code>
              <div className="record-meta">
                <span>
                  {plugin.hasApiKey ? "Encrypted key stored" : "No API key"}
                </span>
                <span>{plugin.testDetail || "Not tested yet."}</span>
              </div>
            </div>
            <div className="record-actions">
              <button
                className="button button-secondary"
                type="button"
                disabled={test.isPending}
                onClick={() => test.mutate({ id: plugin.id })}
              >
                {test.isPending ? (
                  <RefreshCw className="spin" size={13} />
                ) : (
                  <RefreshCw size={13} />
                )}
                Test GET
              </button>
              <button
                className="button button-secondary"
                type="button"
                disabled={toggle.isPending || plugin.testStatus !== "connected"}
                onClick={() =>
                  toggle.mutate({ id: plugin.id, enabled: !plugin.enabled })
                }
              >
                {plugin.enabled ? "Disable" : "Enable"}
              </button>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => {
                  setEditingId(plugin.id);
                  setEditingHasApiKey(plugin.hasApiKey);
                  setDraft({
                    name: plugin.name,
                    description: plugin.description,
                    baseUrl: plugin.baseUrl,
                    path: plugin.path,
                    apiKey: "",
                    removeApiKey: false,
                  });
                }}
              >
                Edit
              </button>
              <button
                className="button button-secondary danger-button"
                type="button"
                aria-label={`Delete ${plugin.name}`}
                onClick={() => remove.mutate({ id: plugin.id })}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </article>
        ))}
        {!plugins.isLoading && plugins.data?.length === 0 && (
          <div className="panel empty-panel">
            <TerminalSquare size={18} />
            <b>No API Plugins configured</b>
            <span>
              Plugins only issue fixed-path GET requests after a successful live
              test.
            </span>
          </div>
        )}
        {plugins.isLoading && (
          <div className="micro-empty">Loading API Plugins…</div>
        )}
      </div>
    </>
  );
}

export function CliPanel() {
  const utils = trpc.useUtils();
  const tokens = trpc.apex.cliTokens.list.useQuery();
  const [name, setName] = useState("My CLI");
  const [oneTimeToken, setOneTimeToken] = useState("");
  const [copied, setCopied] = useState(false);
  const create = trpc.apex.cliTokens.create.useMutation({
    onSuccess: async result => {
      setOneTimeToken(result.token);
      setCopied(false);
      toast.success(
        "CLI token created. Copy it now; APEX cannot show it again."
      );
      await utils.apex.cliTokens.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const revoke = trpc.apex.cliTokens.revoke.useMutation({
    onSuccess: async () => {
      toast.success("CLI token revoked.");
      await utils.apex.cliTokens.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  return (
    <>
      <div className="notice">
        <TerminalSquare size={15} />
        <div>
          <b>One agent runtime, multiple surfaces</b>
          <span>
            The remote CLI uses the same authenticated APEX task engine, run
            history, Skills, and policy as the dashboard. Local mode works in a
            chosen project directory and uses a model endpoint configured on
            that machine.
          </span>
        </div>
      </div>
      <section className="panel form-panel">
        <div className="panel-title">
          <div>
            <div className="eyebrow">REMOTE CLI ACCESS</div>
            <h2>Create a personal token</h2>
          </div>
        </div>
        <form
          className="compact-form token-create-form"
          onSubmit={event => {
            event.preventDefault();
            create.mutate({ name });
          }}
        >
          <label>
            Token name
            <input
              value={name}
              onChange={event => setName(event.target.value)}
              maxLength={120}
              required
              placeholder="e.g. Work laptop"
            />
          </label>
          <button
            className="button button-primary"
            type="submit"
            disabled={create.isPending}
          >
            <KeyRound size={14} /> Create token
          </button>
        </form>
        {oneTimeToken && (
          <div className="one-time-token" role="status">
            <div>
              <b>Copy now — it will not be shown again</b>
              <code>{oneTimeToken}</code>
            </div>
            <div className="record-actions">
              <button
                className="button button-secondary"
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(oneTimeToken);
                    setCopied(true);
                    toast.success("Token copied to clipboard.");
                  } catch {
                    toast.error(
                      "Clipboard unavailable; select and copy the token manually."
                    );
                  }
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setOneTimeToken("")}
              >
                <X size={13} /> Hide
              </button>
            </div>
          </div>
        )}
      </section>
      <section className="panel form-panel">
        <div className="panel-title">
          <div>
            <div className="eyebrow">SOURCE CHECKOUT</div>
            <h2>Run the CLI from this project</h2>
          </div>
        </div>
        <pre className="command-block">{`pnpm install\npnpm cli help\npnpm cli login --server=https://YOUR-APEX-SERVER\npnpm cli status\npnpm cli run "Review this task"\npnpm cli local --cwd . "Summarize this project"`}</pre>
        <p className="form-note">
          <ShieldCheck size={13} /> Remote token input is hidden in the
          terminal. The CLI stores it in the current user config directory with
          owner-only permissions. Do not paste the token into a shared shell or
          commit its config file.
        </p>
      </section>
      <div className="record-list">
        {tokens.data?.map(token => (
          <article className="record-card panel" key={token.id}>
            <span className="record-icon">
              <KeyRound size={16} />
            </span>
            <div className="record-main">
              <div className="record-title-row">
                <h3>{token.name}</h3>
                <StatusTag value={token.revokedAt ? "revoked" : "active"} />
              </div>
              <p className="record-subtitle">Prefix {token.tokenPrefix}…</p>
              <div className="record-meta">
                <span>
                  Created {new Date(token.createdAt).toLocaleString()}
                </span>
                <span>
                  {token.lastUsedAt
                    ? `Last used ${new Date(token.lastUsedAt).toLocaleString()}`
                    : "Not used yet"}
                </span>
              </div>
            </div>
            {!token.revokedAt && (
              <div className="record-actions">
                <button
                  className="button button-secondary danger-button"
                  type="button"
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate({ id: token.id })}
                >
                  <X size={13} /> Revoke
                </button>
              </div>
            )}
          </article>
        ))}
        {!tokens.isLoading && tokens.data?.length === 0 && (
          <div className="panel empty-panel">
            <KeyRound size={18} />
            <b>No CLI tokens</b>
            <span>
              Create a token only for a device that you trust and control.
            </span>
          </div>
        )}
        {tokens.isLoading && (
          <div className="micro-empty">Loading token records…</div>
        )}
      </div>
    </>
  );
}

export function SandboxPanel() {
  return (
    <>
      <div className="notice notice-warn">
        <AlertTriangle size={15} />
        <div>
          <b>Approval is not a sandbox</b>
          <span>
            Do not run untrusted repositories or enable shell access as though a
            prompt alone isolates them. Strong containment requires an OS-level
            boundary, network policy, and limits on inherited secrets.
          </span>
        </div>
      </div>
      <section className="panel form-panel">
        <div className="panel-title">
          <div>
            <div className="eyebrow">CURRENT CAPABILITY BOUNDARIES</div>
            <h2>What APEX can and cannot isolate today</h2>
          </div>
        </div>
        <div className="security-grid">
          <article className="security-card">
            <StatusTag value="enabled" label="ACTIVE" />
            <h3>Authenticated dashboard and API</h3>
            <p>
              Owner-scoped APEX records, hashed remote CLI tokens, and request
              budgets.
            </p>
          </article>
          <article className="security-card">
            <StatusTag value="enabled" label="ACTIVE" />
            <h3>Read-only default controls</h3>
            <p>
              API Plugins are GET-only, tested before enabling, and separately
              allowed per run.
            </p>
          </article>
          <article className="security-card">
            <StatusTag value="off_by_default" label="OFF BY DEFAULT" />
            <h3>Local CLI shell</h3>
            <p>
              Shell access is opt-in; the CLI asks before each exact command.
              When enabled, a command still runs as the current OS user.
            </p>
          </article>
          <article className="security-card security-card-caution">
            <StatusTag value="needs_setup" label="NOT ISOLATED" />
            <h3>OS-level sandboxing</h3>
            <p>
              This Preview does not provide an APEX sandbox worker. The local
              CLI path checks scope and secrets but is not a VM/container
              security boundary. Do not expose it to untrusted multi-user work.
            </p>
          </article>
        </div>
        <div className="info-strip">
          <ShieldCheck size={14} />
          <span>
            Next security milestone: a separate, short-lived runner with an
            immutable policy broker, no host-home mount, blocked-by-default
            egress, resource limits, signed capability bundles, auditable event
            receipts, and an emergency stop. See{" "}
            <code>docs/threat-model.md</code>
            in the source project for the full boundary and deployment notes.
          </span>
        </div>
      </section>
    </>
  );
}
