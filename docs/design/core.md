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
originality 5   -->  pearl grade "round"
   |
   v
5 round pearls go into her purse
the market moves on to a new day
```

The pearls become coins only when the player sells them. See
[Selling](#selling).

## Pearl count

She does not cry below a felt sadness of 3. At 3 she cries one pearl,
and one more for each point above.

| Felt sadness | 0-2 | 3 | 5 | 7 | 10 |
|--------------|-----|---|---|---|----|
| Pearls       | 0   | 1 | 3 | 5 | 8  |

## Pearl grade

Fresh, personal stories make finer pearls.

| Originality | Grade | Standing price |
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

A solid story is worth about 75 coins at standing prices, so 7 good,
varied stories win. A good eye for the market needs fewer; selling on
bad days needs more. The limit gives each story weight.

## The pearl market

The price model lives in `market.ts`. A **day** is one story: prices
change each time a story is told, and at no other time.

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

## Selling

Pearls wait in the **purse** (`purse.ts`), counted by grade. Between
stories the player may sell all pearls of one grade at today's price.

```
purse   seed 4   round 5   black 1        coins 120
sell round at 17 coins each
purse   seed 4   round 0   black 1        coins 205
```

Selling costs no story and does not move the market. Selling can win
the game on the spot.

Decisions:

- **A whole grade at a time.** Selling half a grade would add a number
  box to the page for little gain. Three buttons are enough to make
  "sell these, keep those" possible.
- **Prices move only when a story is told.** If time moved them, the
  core would need a clock and would stop being pure. It also means the
  player is never rushed.
- **The closing sale.** After the last story there is no later day to
  wait for. So `playTurn` sells the whole purse at that day's price.
  Without this, a player could lose with a full purse, or the page would
  need a pointless extra click.
- **Coins are counted, not pearls.** A purse worth 600 coins has not won
  yet. The game is won when the coins are in hand.

The alternative was to keep selling automatic and only vary the price.
Then the market would be noise: the player could not act on it.

## Saved games

A `GameState` is plain data: numbers, lists and small records. Saving a
game is writing that data as JSON. Nothing has to be converted.

Reading it back is the careful part. A save file can be cut short,
edited by hand or left over from an older version. So `parseGameState`
(`save.ts`) checks every field before a saved game is played again:

```
{ "coins": 75, "storiesLeft": 9, ... }   -->  the game, as it was
{ "coins": -1, ... }                     -->  nothing
{ "coins": 75 }   (fields missing)       -->  nothing
```

Decisions:

- **Refuse, never repair.** `parseVerdict` fixes bad data by lowering
  it, because a judge's mistake should only cost a story. A save is
  different: any guess at a missing field could hand out coins or
  change tomorrow's prices. A damaged game is dropped whole.
- **The goal must match.** A save with another goal comes from other
  rules. It is refused like any other damage.
- **Extra fields are dropped.** Only the known fields are copied, so
  nothing unknown rides along into the game.

Where the save file lives is the server's business: see
[web.md](web.md).

## Properties the tests check

- Coins never go down, and each turn uses exactly one story.
- A sadder story never gives fewer pearls.
- A more original story never gives less valuable pearls.
- Every pearl stays in the purse until it is sold.
- A sale swaps pearls for exactly their worth: coins plus purse value
  stays the same.
- When the stories run out, nothing is left unsold.
- Every game ends within 12 stories.
- Market prices stay within 60% to 150%, and a finer grade is never
  cheaper than a plainer one.
- The same seed always gives the same prices.
- A saved game reads back exactly as it was. Damaged data never crashes
  the parser.
