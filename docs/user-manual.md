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

This starts the game server on `http://127.0.0.1:3000`. For now it
offers only the HTTP API described in [design/web.md](design/web.md).
The page arrives next.

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
