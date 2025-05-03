<project plan>
Phantom: The Lightning-Fast, Modern Git GUI

---

## 1. Overview & Vision

*Phantom* is a cross-platform desktop Git client (macOS, Windows, Linux) offering a sleek, no-friction experience for interacting with Git and hosting services (GitHub, GitLab, Bitbucket) without sacrificing power:

* **Instant repository scanning** and branch switching (<100 ms) via native bindings
* **Zero-clutter UI**: minimal chrome, command-palette driven, distraction-free
* **Deep integration**: built-in diff/merge editor, visual history, stash management
* **Service connectors**: seamless OAuth workflows for GitHub/GitLab/Bitbucket APIs
* **Extensibility**: plugin system for custom workflows, CI/CD triggers, code reviews

> **Elevator pitch:** Phantom puts Git at your fingertips—fast, clean, and hackable—so you never fight your tools again.

---

## 2. Core Features

| Category                 | Feature                                                               |
| ------------------------ | --------------------------------------------------------------------- |
| **Repository Ops**       | Clone, open, init, delete, submodule management                       |
| **Branching**            | Instant branch switch, branch search, delete, rename                  |
| **Commits**              | Staging hunk/line, amend, squash, interactive rebase                  |
| **History**              | Graph view, filter by author, date, message, file                     |
| **Diff & Merge**         | Inline & side-by-side diff, conflict resolver UI                      |
| **Stash & Reflog**       | Stash create/apply/pop, reflog viewer                                 |
| **Remotes & Push**       | Add/remove remotes, push/pull/fetch, force push UI                    |
| **Service Integrations** | OAuth for GitHub/GitLab/Bitbucket, issue linking, PR list/view/create |
| **Search & Commands**    | Command palette (⌘P) for every action; fuzzy find                     |
| **Settings**             | Theme (light/dark), keyboard shortcuts, plugins                       |
| **Extensions**           | Plugin API (Node.js) for custom panels & commands                     |

---

## 3. Tech Stack

* **Shell**: Electron (Node.js + Chromium)
* **UI**: React + Vite + TailwindCSS or Radix UI
* **Git Binding**: `nodegit` (libgit2) or `isomorphic-git` (WASM) for core operations
* **OAuth**: `electron-oauth2` with secure Keychain/Credential Manager storage
* **Diff/Merge**: `diff2html`, Monaco Editor for inline merge editor
* **State Management**: Zustand or Redux Toolkit
* **IPC**: Electron IPC between main (native operations) and renderer (UI)
* **Persistence**: SQLite via `better-sqlite3` for repo metadata, recent list, plugin data
* **Plugins**: Node.js modules loaded at runtime, sandboxed via `vm2`
* **Auto-update**: Electron Updater (Squirrel/NSIS/AppImage)

---

## 4. High-Level Architecture

```
┌───────────────┐      ┌───────────────┐      ┌──────────────┐
│    Renderer   │◀────│    IPC Layer  │────▶│     Main     │
│ (React UI)    │      │ (electron)    │      │ (Node / Git) │
└───────────────┘      └───────────────┘      └──────────────┘
        │                                            │
        ▼                                            ▼
   OAuth Manager                                Git Operations
   • Launch OAuth flow                          • Clone, fetch, push
   • Token storage                              • Branch, commit, stash
   • API calls (PRs, issues)                    • Diff, merge, rebase
        ▲                                            ▲
        │                                            │
   Service APIs                               Plugin Host
   (GitHub, etc)                                  • Hooks into commands
                                                • Custom UI panels
```

---

## 5. Module Breakdown

### 5.1 Renderer (UI)

* **Command Palette**: global fuzzy search for commands, files, branches
* **Sidebar**: repo list, branch list, remotes, stash
* **Main View**: dynamic panels (History, Diff, Merge, Settings, Plugins)
* **Panels**:

  * **History**: interactive graph (e.g. D3 or Canvas), filters
  * **Diff/Merge**: Monaco Editor + `diff2html`
  * **PR Browser**: authenticated list of PRs/MRs with comments
* **Settings**: theme, shortcuts, plugin management

### 5.2 Main (Backend)

* **GitClient** class wrapping `nodegit` or `isomorphic-git` calls
* **OAuthService**: launch OAuth windows, retrieve tokens, refresh
* **APIService**: abstract GitHub/GitLab API calls for PR/issues
* **StorageService**: manage SQLite DB for recents, plugin configs
* **PluginEngine**: load JS plugins, provide API to UI & GitClient

### 5.3 Shared

* **IPC Protocol**: typed channels (`invoke`, `on`) for commands & events
* **Types**: `Repository`, `Branch`, `Commit`, `Diff`, `PullRequest`
* **Models**: TS interfaces, zod schemas for validation

---

## 6. User Experience & Flow

1. **Open Phantom** → quick scan of `~/.gitconfig` & recent repos → Sidebar populated
2. **Command palette (⌘P)** to open a new repo, clone via URL, or jump to any view
3. **Git operations** (fetch, checkout, commit) run in background; UI shows native notifications
4. **Branch switch** → diff panel auto-refreshes to show working tree status
5. **Conflict** → open Merge Editor with inline tools; highlight conflicts, accept/skip
6. **Pull Requests** → click PR in sidebar → view diff & comments; `Checkout PR` button to create local branch
7. **Plugins** → install via Settings; plugin can add menu items or panels (e.g., CI status, code review helpers)

---

## 7. Week-by-Week Roadmap

| Week | Deliverable                                                                |
| ---- | -------------------------------------------------------------------------- |
| 1    | Scaffold Electron app, basic UI shell, command palette, repo open/scan     |
| 2    | Integrate `nodegit` for clone/open/status; display working tree diff in UI |
| 3    | Branch management (list, create, switch, rename); PR list via GitHub API   |
| 4    | Commit staging UI (hunk/line staging), interactive rebase flow             |
| 5    | Merge conflict editor (Monaco), stash & reflog viewer, settings panel      |
| 6    | OAuth flows for GitHub/GitLab/Bitbucket; plugin system bootstrap           |
| 7    | Packaging (macOS DMG, Windows NSIS, Linux AppImage); auto-update           |

---

## 8. Performance & Size Targets

* **Cold start**: <300 ms to show empty UI
* **Repo scan**: <100 ms for 1,000-commit repo
* **Bundle size**: \~60–80 MB after asar packing & pruning

---

## 9. Future Extensions

* **CLI Companion**: `phantom-cli` for headless scripting
* **Live collaboration**: share branch/diff sessions via WebRTC
* **AI Assist**: integrate code-review suggestions (GPT plugins)
* **CI/CD Triggers**: configure and launch workflows directly

---

*Phantom*—the Git GUI you wished existed: fast, focused, and infinitely extensible.

</project plan>