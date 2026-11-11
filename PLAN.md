# Plan

The live checklist for current work. Long-term items live in
[ROADMAP.md](ROADMAP.md).

## Decisions

- Language: TypeScript on Node.js 24, run directly without a build step.
- Interface: terminal first, web later.
- LLM: DeepSeek API. Tests never call it.
- Tone: bittersweet fairy tale.

## Step 1: scaffold

- [x] Git repository on `dev`
- [x] TypeScript project, type check, vitest and fast-check
- [x] First tested function: `clampScore`
- [x] `docs/` skeleton, `PLAN.md`, `ROADMAP.md`

## Step 2: pure core

- [ ] `Verdict` type: sadness, originality, themes, reply
- [ ] `GameState` type: coins, pearls, goal
- [ ] `mintPearls`: verdict to pearls
- [ ] `sellPearls`: pearls to coins
- [ ] Properties: coins never go negative; a sadder story never yields
      fewer pearls

## Step 3: offline CLI

- [ ] `Judge` interface and a scripted fake judge
- [ ] Read-story, judge, mint, sell loop in the terminal
- [ ] Playable without an API key

## Step 4: DeepSeek judge

- [ ] DeepSeek client, API key from `DEEPSEEK_API_KEY`
- [ ] Mermaid persona prompt
- [ ] Parse and clamp the JSON verdict
- [ ] Recorded-response fixtures for tests

## Step 5: depth

- [ ] Numbness to repeated themes
- [ ] Pearl grades
- [ ] Market prices
- [ ] Goal and ending

## Step 6: polish

- [ ] Save and load
- [ ] Cleanup pass
- [ ] Docs complete
