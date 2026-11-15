# Architecture

## The game in one paragraph

The player types a sad story. The little mermaid reads it and reacts. If
it moves her, she cries, and her tears are pearls. She keeps them in a
purse and sells them to the pearl merchant, whose prices change after
every story. The coins go toward a goal: buying her voice back from the
sea witch.

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
         prices        +-----------+
```

1. The page sends the story to the server.
2. The server asks the judge for a verdict.
3. The core turns the verdict into pearls, puts them in the purse and
   moves the market to a new day.
4. The server sends the result back and the page shows it.

Selling is a shorter trip: page, server, core and back. The judge is not
involved.

## Components

| Component | Folder | Job |
|-----------|--------|-----|
| Core | `src/core/` | The rules. Pure functions, no input or output. |
| Judge | `src/judge/` | Turns a story into a verdict. |
| Server | `src/web/` | Holds the games, saves them to a file and offers them over HTTP. |
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
| `pearls.ts` | pearl count, grade and standing price |
| `random.ts` | seeded random numbers, so chance stays pure |
| `market.ts` | the merchant's prices, changing day by day |
| `purse.ts` | the pearls she holds and what they are worth |
| `game.ts` | `GameState`, `playTurn`, `sellPearls`, win and lose |
| `save.ts` | `parseGameState`: a saved game checked before it is played |
| `record.ts` | `isRecord`, a helper for reading untrusted data |

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
| `server.ts` | the routes: start a game, tell a story, sell pearls |
| `games.ts` | the store of running games |
| `saves.ts` | the save file that keeps games between runs |
| `http.ts` | reading and writing JSON over HTTP |
| `static.ts` | serving the page's files |
| `view.ts` | the shapes of the data sent to the page |

Page, in `public/` ([design/web.md](design/web.md)):

| File | Holds |
|------|-------|
| `index.html` | the layout and the mermaid drawing |
| `style.css` | the look |
| `app.js` | sends stories and sales, shows results |
