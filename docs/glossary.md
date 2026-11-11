# Glossary

**Clamp.** To force a number into a range. Clamping 1000 to the range
0 to 10 gives 10.

**Core.** The part of the game that holds the rules: pearls, coins and
state. It does no input or output.

**DeepSeek.** The company whose LLM the game calls over the internet.

**Fake judge.** A judge that returns scripted verdicts without calling an
LLM. Used in tests and for offline play.

**Judge.** The component that reads a story and returns a verdict. The
real judge asks an LLM.

**LLM (large language model).** A program that reads text and writes
text. Here it reads the player's story and writes the mermaid's reaction.

**Property test.** A test that checks a rule on many random inputs, for
example "the score is always between 0 and 10". We use the fast-check
library for these.

**Pure function.** A function whose result depends only on its inputs
and that changes nothing else. Easy to test.

**Score.** A whole number from 0 (unmoved) to 10 (heartbroken).

**Verdict.** What the judge returns for one story: scores, themes and
the mermaid's reply.
