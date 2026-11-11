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
- [ ] Pearls: count and grade
- [ ] Numbness to repeated themes
- [ ] `GameState`, `playTurn`, goal and story limit
- [ ] Properties: coins never drop; a sadder story never yields fewer
      pearls

## Step 3: judges

- [ ] `Judge` interface
- [ ] Offline judge that scores by simple word rules
- [ ] DeepSeek judge, API key from `DEEPSEEK_API_KEY`
- [ ] Mermaid persona prompt

## Step 4: web game

- [ ] HTTP API: start a game, tell a story
- [ ] Web page: story box, mermaid reply, pearls, coins, ending
- [ ] Playable without an API key

## Step 5: polish

- [ ] Cleanup pass
- [ ] Docs complete
