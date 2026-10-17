import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Code2,
  Database,
  GitBranch,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

const capabilities = [
  {
    icon: Sparkles,
    title: "One independent agent",
    detail:
      "APEX works on its own; real model calls, tool results, and run traces stay distinguishable.",
  },
  {
    icon: Code2,
    title: "Local-first CLI",
    detail:
      "Start with Ollama on this computer. Local CLI use needs no provider API key or hosted APEX server.",
  },
  {
    icon: Database,
    title: "Dashboard + API",
    detail:
      "Use the same APEX engine through the workbench or a programmatic client.",
  },
  {
    icon: BookOpen,
    title: "Skills and bounded plugins",
    detail:
      "Reusable instructions and read-only data sources do not silently add permissions.",
  },
  {
    icon: Workflow,
    title: "Workflows, built carefully",
    detail:
      "Workflow drafts and manual Run once work today; durable unattended schedules are not active yet.",
  },
  {
    icon: GitBranch,
    title: "Optional bridges",
    detail:
      "Delegate only to a real configured peer, after you opt in for that run.",
  },
  {
    icon: LockKeyhole,
    title: "Desktop control on the roadmap",
    detail:
      "Full browser and computer-use features require an isolated runner and are not enabled in this preview.",
  },
];

export default function Preview() {
  return (
    <main className="public-preview">
      <header className="public-preview-header">
        <a className="preview-brand" href="/" aria-label="APEX sign in">
          <span className="apex-glyph" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            <b>APEX</b>
            <small>AGENT WORKBENCH</small>
          </span>
        </a>
        <a className="button button-secondary" href="/">
          Sign in <ArrowUpRight size={15} />
        </a>
      </header>

      <section className="preview-hero">
        <div>
          <div className="eyebrow">LOCAL-FIRST AGENT WORKSTATION</div>
          <h1>
            Your agent.
            <br />
            <em>Your control.</em>
          </h1>
          <p>
            APEX is an open-source agent with a local-first CLI. Its hosted
            dashboard, API, and remote CLI share a server engine; local CLI mode
            currently runs a separate bounded loop. Start with Ollama; choose a
            hosted backend only if you want one. Native desktop and full
            computer-use controls are still roadmap work, not hidden features in
            this preview.
          </p>
          <a className="button button-primary button-large" href="/">
            Open the private workspace <ArrowRight size={16} />
          </a>
          <div className="preview-hero-note">
            <LockKeyhole size={13} /> This public page loads no account data or
            provider credentials.
          </div>
        </div>
        <div
          className="preview-surface"
          aria-label="Read-only workspace preview"
        >
          <div className="preview-surface-bar">
            <span className="apex-mini-mark">
              <i />
              <i />
              <i />
            </span>
            <span>APEX / AGENT</span>
            <span className="preview-readonly">
              <ShieldCheck size={12} /> READ-ONLY
            </span>
          </div>
          <div className="preview-surface-body">
            <aside className="preview-rail" aria-hidden="true">
              <span className="preview-rail-active">
                <Sparkles size={15} /> Agent
              </span>
              <span>
                <Database size={15} /> Workspace
              </span>
              <span>
                <Workflow size={15} /> Automations
              </span>
              <span>
                <GitBranch size={15} /> Bridges
              </span>
            </aside>
            <div className="preview-workspace">
              <div className="eyebrow">AGENT WORKSPACE</div>
              <h2>What should APEX work on?</h2>
              <p>
                Describe a goal. APEX will use only the model and tools you
                configure.
              </p>
              <div className="preview-empty-composer">
                <span>
                  Set up Ollama or choose a model to start a private run…
                </span>
                <span className="preview-send" aria-hidden="true">
                  <ArrowRight size={15} />
                </span>
              </div>
              <div className="preview-state-row">
                <span>
                  <i /> No account data loaded
                </span>
                <span>
                  <i /> No example runs shown
                </span>
              </div>
              <div className="preview-live-boundary">
                <Check size={15} />
                <span>
                  <b>Honest by default.</b> This interface tour contains no
                  fabricated agents, metrics, or connection states.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="preview-capabilities">
        <div className="preview-section-heading">
          <div className="eyebrow">WHAT APEX BRINGS TOGETHER</div>
          <h2>One agent. Several ways to use it.</h2>
          <p>
            Start locally with Ollama. Add a hosted model or a real peer only
            when you choose; desktop control and unattended scheduling are still
            being built.
          </p>
        </div>
        <div className="preview-capability-list">
          {capabilities.map(({ icon: Icon, title, detail }) => (
            <article className="preview-capability" key={title}>
              <span className="preview-capability-icon">
                <Icon size={17} />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="public-preview-footer">
        <span>APEX · MIT-licensed agent workstation</span>
        <a href="/">
          Sign in to manage your own workspace <ArrowRight size={14} />
        </a>
      </footer>
    </main>
  );
}
