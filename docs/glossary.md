# Glossary

**Closing sale.** The sale of everything left in the purse after the
last story, at that day's prices.

**Clamp.** To force a number into a range. Clamping 1000 to the range
0 to 10 gives 10.

**Content security policy.** A rule the server sends with a page. It
tells the browser where scripts and styles may come from.

**Core.** The part of the game that holds the rules: pearls, coins and
state. It does no input or output.

**DeepSeek.** The company whose LLM the game calls over the internet.

**Ending.** The last page of the tale. Which one the player reads
depends on how the game was won or lost.

**Felt sadness.** A story's sadness score after numbness is taken off.
It decides how many pearls she cries.

**Day.** One step of the market. A new day starts each time a story is
told.

**Grade.** The quality of a pearl: seed, round or black. Finer grades
sell for more.

**HTTP API.** The set of web addresses a program can call on a server,
and what each one expects and answers.

**JSDoc.** Comments in JavaScript that describe types, so a type checker
can check plain JavaScript.

**JSON.** A common text format for data, such as `{ "coins": 75 }`.

**Judge.** The component that reads a story and returns a verdict. The
real judge asks an LLM.

**localStorage.** A place in the browser where a page may keep small
pieces of text between visits. The page keeps its game's id there.

**LLM (large language model).** A program that reads text and writes
text. Here it reads the player's story and writes the mermaid's reaction.

**Numbness.** Sadness points a story loses because the mermaid has
recently heard the same theme.

**Market.** The pearl merchant's stall. Its prices change from day to
day around each grade's standing price.

**Offline judge.** A judge that scores by simple word rules without
calling an LLM. Used when no API key is set.

**Originality.** A score for how fresh and personal a story is. It
decides the pearl grade.

**Property test.** A test that checks a rule on many random inputs, for
example "the score is always between 0 and 10". We use the fast-check
library for these.

**Purse.** The pearls the mermaid has cried but not yet sold.

**Pure function.** A function whose result depends only on its inputs
and that changes nothing else. Easy to test.

**Save file.** The file the server writes its games to, so they survive
a restart.

**Score.** A whole number from 0 (unmoved) to 10 (heartbroken).

**Seed (random).** A number that decides a whole sequence of "random"
numbers. The same seed always gives the same sequence. Not to be
confused with a *seed pearl*, the smallest grade.

**Standing price.** The usual price of a pearl grade. The market price
moves around it.

**Theme.** A label for what a story is about, such as `loss` or `war`.
Themes come from a fixed list.

**Verdict.** What the judge returns for one story: scores, themes and
the mermaid's reply.
