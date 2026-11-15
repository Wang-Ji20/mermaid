# Documentation

Read in this order:

1. [glossary.md](glossary.md): plain-language definitions of every term
2. [user-manual.md](user-manual.md): how to build, run and test
3. [architecture.md](architecture.md): the components and how data flows
4. [design/](design/): one document per subsystem, explaining why
   - [core.md](design/core.md): the game rules and why they are shaped
     this way
   - [judge.md](design/judge.md): why the LLM only scores and never
     decides rewards
   - [web.md](design/web.md): the HTTP API, the page and why the server
     holds the state
5. [perf/](perf/README.md): performance goals, method and results
