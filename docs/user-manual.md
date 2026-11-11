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
2. The mermaid answers. If the story moved her, pearls fall and are
   sold for coins.
3. Reach 500 coins within 12 stories to buy back her voice.

Tips:

- Sadder stories give more pearls.
- Specific, personal stories give finer pearls, which sell for more.
- She grows numb to themes she has heard in her last three stories.
  Vary what you tell her.

The exact rules are in [design/core.md](design/core.md).

## Settings

Settings are environment variables.

| Variable | Meaning | Default |
|----------|---------|---------|
| `DEEPSEEK_API_KEY` | your DeepSeek key; without it the offline judge is used | none |
| `DEEPSEEK_MODEL` | DeepSeek model name | `deepseek-chat` |
| `DEEPSEEK_BASE_URL` | DeepSeek API address | `https://api.deepseek.com` |
| `PORT` | port the server listens on | `3000` |
| `HOST` | address the server listens on | `127.0.0.1` |

Example:

```
DEEPSEEK_API_KEY=sk-... npm start
```
