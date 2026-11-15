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

- [x] HTTP API: start a game, tell a story
- [x] Web page: story box, mermaid reply, pearls, coins, ending
- [x] Playable without an API key

## Step 5: polish

- [x] Cleanup pass
- [x] Docs complete

## Step 6: pearl market

The first item of the "Later" list in the roadmap.

- [x] Price model: seeded, each grade drifts around its standing price
- [ ] Purse: pearls are kept until sold; selling by grade
- [ ] HTTP API: sell pearls
- [ ] Web page: the merchant's prices, the purse, sell buttons

## Open

- [ ] Try the DeepSeek judge with a real key. Its request and parsing
      are tested against canned responses only.
