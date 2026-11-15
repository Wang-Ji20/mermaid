# User manual

## Requirements

- Node.js 24 or newer. It runs TypeScript files directly, so there is no
  build step.

## Install

```
npm install
```

This downloads the development tools into `node_modules/`, which is not
committed.

## Test

```
npm test
```

This runs three things in order:

1. the type check (`tsc --noEmit`)
2. the unit tests
3. the property tests

Tests never use the network.

## Run

```
npm start
```

Then open `http://127.0.0.1:3000` in a browser.

Without a DeepSeek key the **offline judge** listens. It scores by
simple word rules and its replies are canned. It is enough to try the
game. Set `DEEPSEEK_API_KEY` (see Settings) to let the LLM judge.

## How to play

1. Type a sad story and press **Tell her**.
2. The mermaid answers. If the story moved her, pearls fall into her
   purse.
3. Sell pearls to the pearl merchant with the **Sell** buttons. His
   prices change after every story, so you may sell now or wait.
4. Reach 500 coins within 12 stories to buy back her voice.
5. Running short? The sea witch offers a bargain, once: 3 more stories,
   but her price rises by 150 coins. It cannot be undone, and it must
   be taken before your last story.

Tips:

- Sadder stories give more pearls.
- Specific, personal stories give finer pearls, which sell for more.
- She grows numb to themes she has heard in her last three stories.
  Vary what you tell her.
- Prices drift back toward the usual price. A low price will probably
  rise; a high one will probably fall.
- After the last story everything left is sold at that day's price,
  good or bad.

The tale has more than one ending. How quickly you win, how close you
come, and whether you dealt with the witch decide which one you read.

The exact rules are in [design/core.md](design/core.md).

## Saved games

The server saves every game after each story and each sale, in
`saves/games.json`. Stop the server and start it again: the games are
still there.

Your browser remembers which game is yours. Reload the page or come
back another day and it shows the same game: coins, purse, prices and
stories left. Only the "Stories told" list starts empty, because your
stories are not stored anywhere.

**Begin again** leaves the old game and starts a new one.

To throw all games away, stop the server and delete that file.

## Settings

Settings are environment variables.

| Variable | Meaning | Default |
|----------|---------|---------|
| `DEEPSEEK_API_KEY` | your DeepSeek key; without it the offline judge is used | none |
| `DEEPSEEK_MODEL` | DeepSeek model name | `deepseek-chat` |
| `DEEPSEEK_BASE_URL` | DeepSeek API address | `https://api.deepseek.com` |
| `PORT` | port the server listens on | `3000` |
| `HOST` | address the server listens on | `127.0.0.1` |
| `SAVE_FILE` | file the games are saved in; set it to nothing (`SAVE_FILE=`) to turn saving off | `saves/games.json` in the project folder |

Example:

```
DEEPSEEK_API_KEY=sk-... npm start
```
