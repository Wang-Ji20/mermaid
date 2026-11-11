# Architecture

This is the target design. Parts marked *(planned)* are not written yet.

## The game in one paragraph

The player types a sad story. The little mermaid reads it and reacts. If
it moves her, she cries, and her tears are pearls. She sells the pearls
for coins and saves toward a goal.

## Data flow

```
player story
     |
     v
+-----------+     verdict: sadness, originality,
|   Judge   | --> themes, reply
+-----------+
     |
     v
+-----------+     pearls, coins,
|   Core    | --> new game state
+-----------+
     |
     v
+-----------+
|    CLI    | --> text on the terminal
+-----------+
```

## Components

| Component | Folder | Job |
|-----------|--------|-----|
| Core | `src/core/` | The rules. Pure functions, no input or output. |
| Judge *(planned)* | `src/judge/` | Turns a story into a verdict. |
| CLI *(planned)* | `src/cli/` | Reads stories, prints results. |

## Two rules that shape everything

1. **The core is pure.** It never reads the keyboard, the clock or the
   network. That makes every rule testable with random inputs.
2. **The LLM is not trusted.** It gives scores. Code turns scores into
   rewards. See [design/judge.md](design/judge.md).

## What exists today

The core is complete. Its files, in `src/core/`:

| File | Holds |
|------|-------|
| `score.ts` | `clampScore`: any number to a whole score, 0 to 10 |
| `themes.ts` | the fixed list of story themes |
| `verdict.ts` | the `Verdict` type and `parseVerdict` |
| `numbness.ts` | her memory of recent themes |
| `pearls.ts` | pearl count, grade and price |
| `game.ts` | `GameState`, `playTurn`, win and lose |

The rules are explained in [design/core.md](design/core.md).

`src/main.ts` is still a placeholder entry point.
