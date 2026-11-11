# Plan

The live checklist for current work. Long-term items live in
[ROADMAP.md](ROADMAP.md).

## Decisions

- Language: TypeScript on Node.js 24, run directly without a build step.
- Interface: a web page served by a small local server. The terminal
  version first planned was dropped: the web page plus the offline judge
  covers the same need.
- LLM: DeepSeek API. Tests never call it.
- Tone: bittersweet fairy tale.

## Step 1: scaffold

- [x] Git repository on `dev`
- [x] TypeScript project, type check, vitest and fast-check
- [x] First tested function: `clampScore`
- [x] `docs/` skeleton, `PLAN.md`, `ROADMAP.md`

## Step 2: pure core

- [x] `Verdict` type and `parseVerdict` for untrusted data
- [x] Fixed theme list
- [x] Pearls: count and grade
- [x] Numbness to repeated themes
- [x] `GameState`, `playTurn`, goal and story limit
- [x] Properties: coins never drop; a sadder story never yields fewer
      pearls

## Step 3: judges

- [x] `Judge` interface
- [x] Offline judge that scores by simple word rules
- [x] DeepSeek judge, API key from `DEEPSEEK_API_KEY`
- [x] Mermaid persona prompt

## Step 4: web game

- [ ] HTTP API: start a game, tell a story
- [ ] Web page: story box, mermaid reply, pearls, coins, ending
- [ ] Playable without an API key

## Step 5: polish

- [ ] Cleanup pass
- [ ] Docs complete
