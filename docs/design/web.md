# Design: the web server and page

The game runs as a small local web server (`src/web/`). The browser
shows the page (`public/`); the server holds the games and talks to the
judge.

```
browser                     server                      judge
   |  POST /api/games         |                           |
   | -----------------------> |  create game              |
   | <----------------------- |                           |
   |  { id, game }            |                           |
   |                          |                           |
   |  POST .../stories        |                           |
   | -----------------------> |  story ------------------>|
   |                          |  <---------------- verdict|
   |                          |  playTurn (core)          |
   | <----------------------- |                           |
   |  { game, turn }          |                           |
   |                          |                           |
   |  POST .../sales          |                           |
   | -----------------------> |  sellPearls (core)        |
   | <----------------------- |                           |
   |  { game, sale }          |                           |
   |                          |                           |
   |  GET /api/games/<id>     |    (after a reload)       |
   | -----------------------> |  look the game up         |
   | <----------------------- |                           |
   |  { id, game }            |                           |
```

## The API

All calls send and receive JSON.

### Start a game: `POST /api/games`

Send `{}`. The answer:

```json
{
  "id": "0b1c...",
  "judge": "offline",
  "maxStoryLength": 2000,
  "game": {
    "coins": 0, "goal": 500, "storiesLeft": 12, "status": "playing",
    "ending": null, "bargain": { "stories": 3, "price": 150 },
    "stall": [
      { "grade": "seed", "price": 5, "standingPrice": 5, "held": 0 },
      { "grade": "round", "price": 15, "standingPrice": 15, "held": 0 },
      { "grade": "black", "price": 40, "standingPrice": 40, "held": 0 }
    ]
  }
}
```

`ending` is `null` while the game is in play. Afterwards it names the
ending: `swift`, `won`, `bargain`, `near` or `lost`
([core.md](core.md#goal-and-ending)).

`bargain` is the sea witch's offer. It is `null` once the offer is taken
or the game is over.

`stall` has one row per pearl grade: today's price, the usual price and
how many pearls of that grade she holds. Every `game` in every answer
has this shape; the examples below shorten it.

### Fetch a game: `GET /api/games/<id>`

Sends nothing and changes nothing. The answer has the same shape as
"start a game", with the game as it stands now. A game that has ended
is still returned, so the page can show its ending.

The page calls this after a reload to pick its game up again.

### Tell a story: `POST /api/games/<id>/stories`

Send `{ "story": "..." }`. The answer:

```json
{
  "game": { "coins": 0, "goal": 500, "storiesLeft": 11, "status": "playing", "stall": [...] },
  "turn": {
    "reply": "My eyes sting...",
    "sadness": 7, "originality": 5, "themes": ["loss"],
    "feltSadness": 7, "numbness": 0, "echoed": [],
    "pearls": { "grade": "round", "count": 5 },
    "closingSale": 0
  }
}
```

The pearls are now in the purse and `stall` shows the new day's prices.
`closingSale` is 0 except after the last story, when it holds the coins
paid for everything left in the purse.

### Sell pearls: `POST /api/games/<id>/sales`

Send `{ "grade": "round" }`. All pearls of that grade are sold at
today's price. The answer:

```json
{
  "game": { "coins": 85, "goal": 500, "storiesLeft": 11, "status": "playing", "stall": [...] },
  "sale": { "grade": "round", "count": 5, "price": 17, "coins": 85 }
}
```

### Take the witch's bargain: `POST /api/games/<id>/bargain`

Send `{}`. The answer is `{ "game": ... }` with more stories left, a
higher goal and `bargain: null`
([core.md](core.md#the-sea-witchs-bargain)).

### Errors

Every error is `{ "error": "a sentence the page can show" }`.

| Status | When |
|--------|------|
| 400 | empty story, story over 2000 characters, unknown grade, malformed JSON |
| 404 | unknown game or path |
| 409 | the game has ended, a story is still being judged, she holds no pearls of the grade to sell, or the bargain was already taken |
| 413 | request body over 16 KB |
| 415 | body not sent as JSON |
| 502 | the judge failed; the story did not count |

## The page

```
+------------------------------------------+
|              Mermaid Tears               |
|  200 / 500 coins          8 stories left |
|  [==========--------------]              |
|                                          |
|  The pearl merchant                      |
|  o Seed pearls   4 each, below 5  [Sell] |
|  O Round pearls  17 each, above 15 [Sell]|
|  * Black pearls  40 each, usual   [Sell] |
|  Sold 5 round pearls at 17 each: +85     |
|                                          |
|  The sea witch                           |
|  "I can wait 3 stories longer. My price  |
|  rises by 150 coins."  [Take her bargain]|
|                                          |
|  (mermaid)  She writes in the wet sand:  |
|             "My eyes sting..."           |
|             o o o o                      |
|             4 round pearls for her purse |
|             Sadness 7/10 ...             |
|                                          |
|  Your story                              |
|  [                                    ]  |
|  0 / 2000                    [Tell her]  |
|                                          |
|  Stories told                            |
|  1. My grandmother...   8 round pearls   |
+------------------------------------------+
```

The page shows the scores and any numbness after each story. The player
can then see *why* a story earned what it did and learn to vary themes.

Each sell button says what it would pay, such as "Sell 5 for 85". The
price line says whether today is above or below the usual price, in
words and not only in colour.

The sea witch's box shows her offer in her own words, with the numbers
from the server. It disappears once the bargain is taken. One click
takes it and there is no "are you sure?": the offer says plainly what
it costs and that it comes once.

When the game ends, the story box and the merchant give way to the
ending text. The page has one title and one text for each ending the
server can name.
"Begin again" starts a new game at any time.

After a reload, or when the browser is opened again later, the page
shows the same game: coins, purse, prices and stories left. The list of
stories told starts empty again. See
[The page remembers only the game's id](#the-page-remembers-only-the-games-id).

## Decisions

### The page holds no rules

`public/app.js` only sends stories and shows answers. Every number on
screen comes from the server. The rules exist once, in the core.

### The page is plain JavaScript

Browsers cannot run TypeScript, and the project has no build step. So
the page is one plain JavaScript file. It is still type-checked: it
describes its types in comments (JSDoc) and imports the answer shapes
from `src/web/view.ts`. If the server's answers change shape, `npm test`
fails until the page follows.

### Text from the judge is shown as text

The mermaid's reply comes from an LLM, and the story log repeats what
the player typed. Both are placed on the page as plain text, never as
HTML. A reply containing `<script>` shows as those characters and does
not run.

A content security policy (a rule the server sends with the page) adds
a second guard: the browser runs scripts only from this server.

### The server hands out a fixed list of files

`src/web/static.ts` knows three files: the page, its style and its
script. A request path is looked up in that list and never turned into
a file path. So no request can read other files on the machine.

### The server holds the game state

The page only gets a *view*: coins, goal, stories left, status and the
merchant's stall. It sends stories and sales, never state. So the page
cannot edit its coins, and the mermaid's memory of themes stays out of
sight.

The market's seed stays on the server too. With it, a player could work
out tomorrow's prices and the market would be no gamble at all.

The alternative was to keep the state in the browser and send it with
each story. That needs no storage on the server, but anyone could then
send `coins: 499`.

### The page remembers only the game's id

The browser keeps one small thing in its own storage (`localStorage`,
a place where a page may keep text between visits): the id of the game
in play. On opening, the page asks the server for that game. If the
server no longer has it, the page starts a new one.

```
open page --> id remembered? --no--> start a new game
                   | yes
                   v
              GET /api/games/<id> --404--> start a new game
                   | 200
                   v
              show the game where it was left
```

The state itself stays on the server, for the reason above: a state
kept in the browser could be edited. An id cannot be turned into coins.

The stories and the mermaid's replies are not kept anywhere. The server
never stores what the player wrote, and sad stories are personal: the
page does not leave them behind in the browser either. The price is
that the "Stories told" list is empty after a reload.

If the browser's storage is switched off, the game plays as before. It
just cannot be resumed.

### Each game gets a random market seed

The core cannot roll dice, so the server does it once, when a game
starts (`randomSeed` in `games.ts`). Tests hand the store a fixed seed
and so know every price in advance.

### Games are saved in one file

While the server runs, the games are a `Map` from game id to state
(`src/web/games.ts`). After every change the whole map is also written
to a **save file**, `saves/games.json` by default. At start the server
reads the file back, so a restart loses nothing.

```
{ "version": 1,
  "games": [ { "id": "0b1c...", "state": { "coins": 75, ... } }, ... ] }
```

- **The whole file each time.** A game is a few hundred bytes and the
  store holds at most 1000, so one write is small. Writing only the
  changed game would need a database or a file per game: more parts
  than a local game needs.
- **Written beside, then swapped.** The server writes `games.json.tmp`
  and renames it over the old file. A crash in the middle leaves the
  old file whole, never half a file.
- **Nothing in the file is trusted.** Every game goes through
  `parseGameState` ([core.md](core.md#saved-games)). A damaged game is
  left out; the others still load. A file with another `version`
  number, or one that is not JSON, counts as empty.
- **A failed save does not stop the game.** The error is logged and
  play goes on in memory. By then the judge has already been paid for
  the story; losing the turn too would be worse than losing the save.
- **`Saves` is a small interface** (`src/web/saves.ts`): `load` and
  `save`. The store does not know about files, so its tests run
  without touching the disk.

The store holds at most 1000 games. When it is full, the oldest game is
dropped, from memory and from the file. This stops both from growing
without limit. Finished games wait there until they are the oldest.

The save file holds every market seed. Anyone who can read it can work
out tomorrow's prices. It sits on the player's own machine, so this
only spoils their own game.

### One story at a time per game

Judging takes seconds. If the page sent two stories at once, both would
start from the same state and one result would overwrite the other. So
a game is locked while a story is judged, and a second story gets a 409.

A sale or a bargain during that wait gets a 409 too. It could win the game while the
story is still with the judge, and the story would come back to a game
that is already over.

### No web framework

The server uses Node's built-in `http` module. There are five routes;
a framework would be more code to learn than it saves.

### Only JSON bodies are accepted

The server listens on the local machine, but any web page open in the
same browser can send requests to it. A page on another site could
quietly post stories and spend the player's DeepSeek credit.

Browsers let other sites send plain form or text bodies freely. For a
JSON body they first ask the server for permission. This server never
grants it. So requiring `content-type: application/json` shuts other
sites out.

### Local only by default

The server binds to `127.0.0.1`, so other machines cannot reach it.
It has no accounts and no rate limit; it is not ready to be put on the
internet. `HOST` can override the address for those who know the risk.
