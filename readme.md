# Mermaid Tears

I want to make a genAI little mermaid game where the little mermaid's tear is pearl. she wants to make money by that so the player should tell her sad stories.

## Status

Playable in the browser. Games are saved, so you can stop and come
back. See [PLAN.md](PLAN.md) for current work and
[ROADMAP.md](ROADMAP.md) for the long-term plan.

## Quick start

Needs Node.js 24 or newer.

```
npm install
npm test     # type check + unit tests + property tests
npm start    # then open http://127.0.0.1:3000
```

Without a key, a simple offline judge scores your stories. To let the
DeepSeek LLM judge them:

```
DEEPSEEK_API_KEY=sk-... npm start
```

## Documentation

Start at [docs/README.md](docs/README.md).
