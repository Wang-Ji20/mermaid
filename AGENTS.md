# Working agreement for agents

Rules for any coding agent (Claude Code and others) working on this repo
They record what the maintainer and the agent have agreed on.

## Git workflow

- **Agents commit only to `dev`.** Never commit to `main`, merge into it,
  or rewrite its history. The maintainer reviews `dev` and merges it.
- **Agent commits are unsigned and made under the agent's own name:**

  ```
  git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit --no-gpg-sign
  ```

  The maintainer's GPG key signs only the maintainer's own commits and
  merges. An agent never uses it or triggers its passphrase prompt.
- **Every commit is atomic.** It holds one logical change, builds, and
  passes tests.
- **Keep commits small.** Size is counted as insertions plus deletions in
  `git diff --cached --shortstat`:
  - Aim for **at most 500 lines**, splitting larger work into a sequence
    of atomic commits.
  - Up to **1000 lines** is fine when the change isn't complicated.
  - Larger is allowed when the change truly can't be split. Say why in the
    commit message.
  - **No limit** for formatter runs or rule-based refactors,
    meaning mechanical changes such as renames applied uniformly. Keep
    them in commits of their own, separate from behaviour changes.
- Commit messages: an imperative summary line, then a body that says why.
  End with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` when
  Claude wrote the change.

## Code

- Write modern, readable, functional, modular code that follows
  clean-code principles: small focused functions, clear names, no
  god-functions. Breaking a rule is fine when there's a reason; say why in
  a comment or the commit message.
- Should prefer simple iterations, each verifiable. Not Waterfall model.
- After getting something to work, do a cleanup pass before calling it
  done.

## Self-contained repository

- The repo builds and tests without external projects. Nothing third-party
  is vendored.
- Outside code may be used as a **reference or test oracle only**. It
  lives inside the repo, by default in `./external-deps/`, but gitignored
  and every test that needs it skips cleanly when it's missing.

## Testing

- `npm test` must pass before every commit. It runs the type check, the
  unit tests and the fast-check property tests.
- Every bug fixed gets a regression test.

## Documentation

- **Every commit keeps the docs current.** If a commit changes behaviour,
  commands, interfaces or design, the same commit updates the affected
  docs: `docs/`, `README.md`, `PLAN.md`, `ROADMAP.md`.
- Documentation lives in `docs/`:
  - `README.md`: index and reading order
  - `glossary.md`: plain-language definitions of every technical term
  - `user-manual.md`: how to build, run and test
  - `architecture.md`: the big picture: components and how data flows
  - `design/`: one document per subsystem, explaining *why* it is built
    this way (decisions, alternatives, trade-offs), not just *what*
  - `perf/`: performance goals, method and results
- **Style:** clear, concise English. Short sentences and short
  paragraphs, not dense. Prefer a small example over an abstract
  explanation. Use ASCII diagrams inside Markdown.
- **Self-contained:** a reader with general computer knowledge can follow
  every document without prior expertise. Define terms on first
  use or link to the glossary. Outside sources are optional further
  reading, never required.

## Planning

- `PLAN.md` is the live checklist for current work. Update it as tasks
  land.
- `ROADMAP.md` holds the long-term plan. Mark items there as they are
  finished.

