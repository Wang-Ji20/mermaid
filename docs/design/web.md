# Design: the web server

The game runs as a small local web server (`src/web/`). The browser
shows the page; the server holds the games and talks to the judge.

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
```

## The API

Both calls send and receive JSON.

### Start a game: `POST /api/games`

Send `{}`. The answer:

```json
{
  "id": "0b1c...",
  "judge": "offline",
  "maxStoryLength": 2000,
  "game": { "coins": 0, "goal": 500, "storiesLeft": 12, "status": "playing" }
}
```

### Tell a story: `POST /api/games/<id>/stories`

Send `{ "story": "..." }`. The answer:

```json
{
  "game": { "coins": 75, "goal": 500, "storiesLeft": 11, "status": "playing" },
  "turn": {
    "reply": "My eyes sting...",
    "sadness": 7, "originality": 5, "themes": ["loss"],
    "feltSadness": 7, "numbness": 0, "echoed": [],
    "pearls": { "grade": "round", "count": 5 },
    "coinsEarned": 75
  }
}
```

### Errors

Every error is `{ "error": "a sentence the page can show" }`.

| Status | When |
|--------|------|
| 400 | empty story, story over 2000 characters, malformed JSON |
| 404 | unknown game or path |
| 409 | the game has ended, or a story is still being judged |
| 413 | request body over 16 KB |
| 415 | body not sent as JSON |
| 502 | the judge failed; the story did not count |

## Decisions

### The server holds the game state

The page only gets a *view*: coins, goal, stories left, status. It sends
stories, never state. So the page cannot edit its coins, and the
mermaid's memory of themes stays out of sight.

The alternative was to keep the state in the browser and send it with
each story. That needs no storage on the server, but anyone could then
send `coins: 499`.

### Games live in memory

A `Map` from game id to state (`src/web/games.ts`). Restarting the
server forgets all games. A game is twelve stories long, so this is
acceptable for now. Saving games is on the roadmap.

The map holds at most 1000 games. When it is full, the oldest game is
dropped. This stops the memory from growing without limit.

### One story at a time per game

Judging takes seconds. If the page sent two stories at once, both would
start from the same state and one result would overwrite the other. So
a game is locked while a story is judged, and a second story gets a 409.

### No web framework

The server uses Node's built-in `http` module. There are two routes;
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
