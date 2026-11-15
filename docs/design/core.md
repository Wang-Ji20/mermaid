# Design: the game rules

The rules live in `src/core/`. Every function there is pure: same input,
same output, nothing else touched.

## One turn

```
verdict { sadness 7, originality 5, themes [loss] }
   |
   |  minus numbness (familiar themes)
   v
felt sadness 7  -->  pearl count 5
originality 5   -->  pearl grade "round" (15 coins each)
   |
   v
5 x 15 = 75 coins
```

## Pearl count

She does not cry below a felt sadness of 3. At 3 she cries one pearl,
and one more for each point above.

| Felt sadness | 0-2 | 3 | 5 | 7 | 10 |
|--------------|-----|---|---|---|----|
| Pearls       | 0   | 1 | 3 | 5 | 8  |

## Pearl grade

Fresh, personal stories make finer pearls.

| Originality | Grade | Coins each |
|-------------|-------|------------|
| 0-3 | seed | 5 |
| 4-7 | round | 15 |
| 8-10 | black | 40 |

## Numbness

Without this rule the best strategy is to tell the same story twelve
times. So she grows numb to what she has just heard.

She remembers the themes of the last 3 stories. Each remembered story
that shares a theme with the new one takes 2 points off its sadness.

```
story 1: [loss]         felt = 7
story 2: [loss, war]    felt = 7 - 2 = 5    (story 1 shares "loss")
story 3: [loss]         felt = 7 - 4 = 3    (stories 1 and 2 share it)
story 4: [animal]       felt = 7            (nothing shared)
```

The theme `other` never counts as shared. It means "none of the listed
themes", so two such stories have nothing in common.

## Goal and ending

The sea witch sells the mermaid's voice back for 500 coins. The player
has 12 stories.

- Reach 500 coins: **won**.
- Use all 12 stories first: **lost**.

A solid story earns about 75 coins, so 7 good, varied stories win.
The limit gives each story weight.

## Why pearls are sold at once

There is no pearl inventory and no market yet. Each story's pearls turn
into coins in the same turn. This keeps the first version small. A
market with changing prices is on the [roadmap](../../ROADMAP.md).

## The pearl market

The price model lives in `market.ts`. It is not yet part of a turn:
wiring it in is the next step in [PLAN.md](../../PLAN.md).

Each grade has a **standing price** (the table above). The merchant's
price for the day is a percentage of it, between 60% and 150%. Day one
is 100% for every grade.

Each new day, every grade moves on its own:

```
tomorrow = today
         + a quarter of the way back to 100%
         + a chance swing of -20 to +20 points
```

Example, round pearls (standing price 15):

```
day      1     2     3     4     5
percent  100   92    80    102   101
coins    15    14    12    15    15
```

Why this shape:

- **The pull back to 100%** makes prices readable. A low price will
  probably rise, a high one will probably fall. Waiting is a real
  choice, not a coin flip.
- **The bounds** keep a finer grade from ever being cheaper than a
  plainer one: seed pearls cost at most 8 coins, round pearls 9 to 23,
  black pearls at least 24.
- **Each grade moves alone**, so "sell the seed pearls, keep the black
  ones" can be the right call.

### Chance without impurity

The core may not call `Math.random`: its functions must give the same
output for the same input. So the market carries a **seed**, a number
that decides every future price. `random.ts` scrambles the seed into a
swing and steps it forward. The same seed always replays the same
prices, which is what lets the tests check them.

## Properties the tests check

- Coins never go down, and each turn uses exactly one story.
- A sadder story never gives fewer pearls.
- A more original story never pays less.
- Every game ends within 12 stories.
- Market prices stay within 60% to 150%, and a finer grade is never
  cheaper than a plainer one.
- The same seed always gives the same prices.
