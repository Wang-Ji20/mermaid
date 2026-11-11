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

For now this prints a placeholder line. The game loop arrives in step 3
of [PLAN.md](../PLAN.md).
