# Architecture

## The game in one paragraph

The player types a sad story. The little mermaid reads it and reacts. If
it moves her, she cries, and her tears are pearls. She sells the pearls
for coins and saves toward a goal: buying her voice back from the sea
witch.

## Data flow

```
+-----------+  story   +-----------+  story   +-----------+
|   Page    | -------> |  Server   | -------> |   Judge   |
| (browser) |          | src/web/  | <------- | src/judge/|
+-----------+          +-----------+  verdict +-----------+
      ^                      |
      |                      | verdict + game state
      |                      v
      |                +-----------+
      |  reply, pearls,|   Core    |
      +--------------- | src/core/ |
         coins         +-----------+
```

1. The page sends the story to the server.
2. The server asks the judge for a verdict.
3. The core turns the verdict into pearls and coins.
4. The server sends the result back and the page shows it.

## Components

| Component | Folder | Job |
|-----------|--------|-----|
| Core | `src/core/` | The rules. Pure functions, no input or output. |
| Judge | `src/judge/` | Turns a story into a verdict. |
| Server | `src/web/` | Holds the games and offers them over HTTP. |
| Page | `public/` | What the player sees in the browser. |

`src/main.ts` wires them together: it picks a judge and starts the
server.

## Two rules that shape everything

1. **The core is pure.** It never reads the keyboard, the clock or the
   network. That makes every rule testable with random inputs.
2. **The LLM is not trusted.** It gives scores. Code turns scores into
   rewards. See [design/judge.md](design/judge.md).

## Files

Core, in `src/core/` ([design/core.md](design/core.md)):

| File | Holds |
|------|-------|
| `score.ts` | `clampScore`: any number to a whole score, 0 to 10 |
| `themes.ts` | the fixed list of story themes |
| `verdict.ts` | the `Verdict` type and `parseVerdict` |
| `numbness.ts` | her memory of recent themes |
| `pearls.ts` | pearl count, grade and price |
| `game.ts` | `GameState`, `playTurn`, win and lose |

Judges, in `src/judge/` ([design/judge.md](design/judge.md)):

| File | Holds |
|------|-------|
| `judge.ts` | the `Judge` interface and `JudgeError` |
| `offline.ts` | a judge that scores by word rules, no network |
| `deepseek.ts` | a judge that asks the DeepSeek LLM |
| `prompt.ts` | the mermaid persona and answer format |

Server, in `src/web/` ([design/web.md](design/web.md)):

| File | Holds |
|------|-------|
| `server.ts` | the routes: start a game, tell a story |
| `games.ts` | the in-memory store of running games |
| `http.ts` | reading and writing JSON over HTTP |
| `static.ts` | serving the page's files |
| `view.ts` | the shapes of the data sent to the page |

Page, in `public/` ([design/web.md](design/web.md)):

| File | Holds |
|------|-------|
| `index.html` | the layout and the mermaid drawing |
| `style.css` | the look |
| `app.js` | sends stories, shows results |
