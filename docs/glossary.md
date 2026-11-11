# Glossary

**Clamp.** To force a number into a range. Clamping 1000 to the range
0 to 10 gives 10.

**Content security policy.** A rule the server sends with a page. It
tells the browser where scripts and styles may come from.

**Core.** The part of the game that holds the rules: pearls, coins and
state. It does no input or output.

**DeepSeek.** The company whose LLM the game calls over the internet.

**Felt sadness.** A story's sadness score after numbness is taken off.
It decides how many pearls she cries.

**Grade.** The quality of a pearl: seed, round or black. Finer grades
sell for more.

**HTTP API.** The set of web addresses a program can call on a server,
and what each one expects and answers.

**JSDoc.** Comments in JavaScript that describe types, so a type checker
can check plain JavaScript.

**JSON.** A common text format for data, such as `{ "coins": 75 }`.

**Judge.** The component that reads a story and returns a verdict. The
real judge asks an LLM.

**LLM (large language model).** A program that reads text and writes
text. Here it reads the player's story and writes the mermaid's reaction.

**Numbness.** Sadness points a story loses because the mermaid has
recently heard the same theme.

**Offline judge.** A judge that scores by simple word rules without
calling an LLM. Used when no API key is set.

**Originality.** A score for how fresh and personal a story is. It
decides the pearl grade.

**Property test.** A test that checks a rule on many random inputs, for
example "the score is always between 0 and 10". We use the fast-check
library for these.

**Pure function.** A function whose result depends only on its inputs
and that changes nothing else. Easy to test.

**Score.** A whole number from 0 (unmoved) to 10 (heartbroken).

**Theme.** A label for what a story is about, such as `loss` or `war`.
Themes come from a fixed list.

**Verdict.** What the judge returns for one story: scores, themes and
the mermaid's reply.
