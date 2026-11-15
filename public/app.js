// @ts-check
// The page. It holds no game rules: it sends stories and sales to the
// server and shows what comes back. Plain JavaScript, so the browser can run it
// without a build step; the type check still covers it through JSDoc.

/** @typedef {import("../src/web/view.ts").GameView} GameView */
/** @typedef {import("../src/web/view.ts").StallRow} StallRow */
/** @typedef {import("../src/web/view.ts").TurnView} TurnView */
/** @typedef {import("../src/web/view.ts").GameResponse} GameResponse */
/** @typedef {import("../src/web/view.ts").StoryResponse} StoryResponse */
/** @typedef {import("../src/web/view.ts").SaleResponse} SaleResponse */
/** @typedef {import("../src/web/view.ts").BargainResponse} BargainResponse */
/** @typedef {import("../src/web/view.ts").BargainOffer} BargainOffer */

const GREETING =
  "I sold my voice to the sea witch. She will sell it back for coins, and my tears are pearls. " +
  "Will you tell me something sad?";
const WELCOME_BACK =
  "You came back. I kept my purse closed while you were away. Will you tell me another?";
const TALE_TOLD = "Our tale is told. Begin again, and I will listen as if for the first time.";
const BARGAIN_STRUCK =
  "She nods to the witch, and does not look at you for a while. More stories to tell, " +
  "and a heavier purse to fill.";
const LISTENING = "…";
/** Where the browser keeps the id of the game in play, so a reload can resume it. */
const GAME_ID_KEY = "mermaid-tears.game";
const LOG_PREVIEW_LENGTH = 120;
const PEARL_STAGGER_MS = 120;

/** The last page of the tale, one for each ending the server can name. */
const ENDINGS = {
  swift: {
    title: "A song before the moon is full",
    text:
      "The sea witch has barely settled into her cave when the purse lands in front of her. She " +
      "counts it twice and scowls: she had hoped to keep the voice a while. The little mermaid " +
      "sings the whole way home, and somewhere in the song are your stories, " +
      "every one of them.",
  },
  won: {
    title: "Her voice returns",
    text:
      "The sea witch counts the coins twice, then opens her hand. The little mermaid tries one " +
      "note, and it comes out as a song. “Thank you,” she says aloud, “for trusting me with " +
      "your sorrows.”",
  },
  bargain: {
    title: "A voice, on the witch's terms",
    text:
      "The sea witch takes the heavier purse and gives the voice back, all but one note, which " +
      "she keeps “for the waiting”. The little mermaid sings, and only she can hear what is " +
      "missing. “It is mine again,” she tells you. “Nearly all of it. Thank you.”",
  },
  near: {
    title: "Almost a song",
    text:
      "The purse is heavy, but not heavy enough, and the witch does not bargain. The pearl " +
      "merchant, packing up his stall, presses a shell into the little mermaid's hand. Held to " +
      "the ear it hums, faintly, like someone about to sing. She writes: “So close. I will " +
      "keep your stories, and the shell.”",
  },
  lost: {
    title: "The tide goes out",
    text:
      "The witch's offer ends with the moon, and the purse is still too light. The little " +
      "mermaid smooths the sand and writes one last line: “I will keep your stories. They " +
      "were worth more than the pearls.”",
  },
};

/**
 * Finds a page element that must exist.
 * @template {HTMLElement} T
 * @param {string} id
 * @param {new () => T} type
 * @returns {T}
 */
const element = (id, type) => {
  const found = document.getElementById(id);
  if (!(found instanceof type)) throw new Error(`The page is missing #${id}.`);
  return found;
};

const ui = {
  coins: element("coins", HTMLElement),
  goal: element("goal", HTMLElement),
  storiesLeft: element("stories-left", HTMLElement),
  progress: element("progress", HTMLElement),
  progressFill: element("progress-fill", HTMLElement),
  market: element("market", HTMLElement),
  stall: element("stall", HTMLUListElement),
  sale: element("sale", HTMLElement),
  witch: element("witch", HTMLElement),
  witchOffer: element("witch-offer", HTMLElement),
  bargain: element("bargain", HTMLButtonElement),
  mermaid: element("mermaid", HTMLElement),
  reply: element("reply", HTMLElement),
  pearls: element("pearls", HTMLElement),
  earned: element("earned", HTMLElement),
  scores: element("scores", HTMLElement),
  numbness: element("numbness", HTMLElement),
  form: element("story-form", HTMLFormElement),
  story: element("story", HTMLTextAreaElement),
  counter: element("counter", HTMLElement),
  tell: element("tell", HTMLButtonElement),
  ending: element("ending", HTMLElement),
  endingTitle: element("ending-title", HTMLElement),
  endingText: element("ending-text", HTMLElement),
  notice: element("notice", HTMLElement),
  logSection: element("log-section", HTMLElement),
  log: element("log", HTMLOListElement),
  judge: element("judge", HTMLElement),
  restart: element("restart", HTMLButtonElement),
};

/**
 * The current game's id and story length limit, set once a game starts.
 * `busy` is true while the server is working on a story or a sale.
 */
const session = { id: "", maxStoryLength: 0, busy: false };

/**
 * Calls the server and returns its JSON answer.
 * Rejects with the server's own message when the call fails.
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
const call = async (path, options) => {
  const response = await fetch(path, options).catch(() => {
    throw new Error("The game server cannot be reached. Is it still running?");
  });
  const answer = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(answer.error ?? "Something went wrong.");
  return answer;
};

/**
 * Sends JSON to the server and returns its JSON answer.
 * @param {string} path
 * @param {unknown} body
 */
const post = (path, body) =>
  call(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

// Browser storage can be switched off or full. The game then still plays;
// it just cannot be resumed after a reload.

/** @param {string} id */
const rememberGame = (id) => {
  try {
    localStorage.setItem(GAME_ID_KEY, id);
  } catch {
    // Nothing to do: see above.
  }
};

/** @returns {string | null} */
const rememberedGame = () => {
  try {
    return localStorage.getItem(GAME_ID_KEY);
  } catch {
    return null;
  }
};

/** @param {number} count @param {string} noun */
const plural = (count, noun) => `${count} ${noun}${count === 1 ? "" : "s"}`;

/** @param {string | null} message */
const showNotice = (message) => {
  ui.notice.hidden = message === null;
  ui.notice.textContent = message ?? "";
};

/** @param {StallRow} row */
const priceText = ({ price, standingPrice }) => {
  if (price === standingPrice) return `${plural(price, "coin")} each, the usual price`;
  const direction = price > standingPrice ? "above" : "below";
  return `${plural(price, "coin")} each, ${direction} the usual ${standingPrice}`;
};

/** @param {StallRow} row */
const sellButton = ({ grade, price, held }) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "sell";
  // An empty row stays disabled even when the page is no longer busy.
  button.dataset.empty = String(held === 0);
  button.disabled = held === 0 || session.busy;
  button.textContent = held === 0 ? "Nothing to sell" : `Sell ${held} for ${held * price}`;
  button.addEventListener("click", () => void sellGrade(grade));
  return button;
};

/** @param {StallRow} row */
const stallRow = (row) => {
  const pearl = document.createElement("span");
  pearl.className = `pearl still ${row.grade}`;
  const name = document.createElement("span");
  name.className = "stall-name";
  name.textContent = `${row.grade} pearls`;
  const price = document.createElement("span");
  price.className = "stall-price";
  price.classList.toggle("high", row.price > row.standingPrice);
  price.classList.toggle("low", row.price < row.standingPrice);
  price.textContent = priceText(row);
  const item = document.createElement("li");
  item.append(pearl, name, price, sellButton(row));
  return item;
};

/** @param {BargainOffer} offer */
const offerText = ({ stories, price }) =>
  `“Short of time, little one? I can wait ${stories} stories longer. ` +
  `But waiting costs: my price rises by ${plural(price, "coin")}. I offer this once.”`;

/** @param {GameView} game */
const showGame = (game) => {
  ui.stall.replaceChildren(...game.stall.map(stallRow));
  ui.witch.hidden = game.bargain === null;
  if (game.bargain !== null) ui.witchOffer.textContent = offerText(game.bargain);
  ui.coins.textContent = String(game.coins);
  ui.goal.textContent = String(game.goal);
  ui.storiesLeft.textContent = String(game.storiesLeft);
  ui.progress.setAttribute("aria-valuemax", String(game.goal));
  ui.progress.setAttribute("aria-valuenow", String(Math.min(game.coins, game.goal)));
  ui.progressFill.style.width = `${Math.min(100, (100 * game.coins) / game.goal)}%`;

  const over = game.status !== "playing";
  ui.form.hidden = over;
  ui.market.hidden = over;
  ui.ending.hidden = !over;
  if (game.ending !== null) {
    ui.endingTitle.textContent = ENDINGS[game.ending].title;
    ui.endingText.textContent = ENDINGS[game.ending].text;
  }
};

/** @param {TurnView["pearls"]} pearls */
const showPearls = ({ grade, count }) => {
  const drops = Array.from({ length: count }, (_, index) => {
    const pearl = document.createElement("span");
    pearl.className = `pearl ${grade}`;
    pearl.style.animationDelay = `${index * PEARL_STAGGER_MS}ms`;
    return pearl;
  });
  ui.pearls.replaceChildren(...drops);
};

/** @param {TurnView} turn */
const earnedText = ({ pearls, closingSale }) => {
  const tears =
    pearls.count === 0
      ? "No tears this time."
      : `${plural(pearls.count, `${pearls.grade} pearl`)} for her purse.`;
  return closingSale === 0
    ? tears
    : `${tears} The merchant took all she had left for ${plural(closingSale, "coin")}.`;
};

/** @param {SaleResponse["sale"]} sale */
const saleText = ({ grade, count, price, coins }) =>
  `Sold ${plural(count, `${grade} pearl`)} at ${price} each: +${plural(coins, "coin")}.`;

/** @param {TurnView} turn */
const numbnessText = ({ numbness, echoed }) =>
  numbness === 0
    ? ""
    : `She has heard of ${echoed.join(" and ")} lately: ${numbness} sadness lost to numbness.`;

/** @param {TurnView} turn */
const showTurn = (turn) => {
  ui.reply.textContent = turn.reply;
  showPearls(turn.pearls);
  ui.earned.textContent = earnedText(turn);
  ui.scores.textContent =
    `Sadness ${turn.sadness}/10 · Originality ${turn.originality}/10 · ` +
    `Themes: ${turn.themes.join(", ")}`;
  ui.numbness.textContent = numbnessText(turn);
};

const clearTurn = () => {
  ui.pearls.replaceChildren();
  for (const line of [ui.earned, ui.scores, ui.numbness]) line.textContent = "";
};

/** @param {string} story @param {TurnView} turn */
const addToLog = (story, turn) => {
  const preview =
    story.length > LOG_PREVIEW_LENGTH ? `${story.slice(0, LOG_PREVIEW_LENGTH)}…` : story;
  const result = document.createElement("span");
  result.className = "result";
  result.textContent = earnedText(turn);
  const item = document.createElement("li");
  item.append(preview, result);
  ui.log.append(item);
  ui.logSection.hidden = false;
};

const showCounter = () => {
  const length = ui.story.value.trim().length;
  ui.counter.textContent = `${length} / ${session.maxStoryLength}`;
  ui.counter.classList.toggle("over", length > session.maxStoryLength);
};

/**
 * Locks the story box, the sell buttons and the bargain while the server works.
 * @param {boolean} busy
 */
const setBusy = (busy) => {
  session.busy = busy;
  ui.tell.disabled = busy;
  ui.story.readOnly = busy;
  ui.bargain.disabled = busy;
  for (const button of ui.stall.querySelectorAll("button")) {
    button.disabled = busy || button.dataset.empty === "true";
  }
};

/** @param {boolean} listening */
const setListening = (listening) => {
  setBusy(listening);
  ui.mermaid.classList.toggle("listening", listening);
  if (listening) {
    ui.reply.textContent = LISTENING;
    ui.sale.textContent = "";
    clearTurn();
  }
};

/**
 * Shows a game from its beginning or from where it was left.
 * @param {GameResponse} entered
 * @param {string} greeting
 */
const enterGame = ({ id, judge, maxStoryLength, game }, greeting) => {
  session.id = id;
  session.maxStoryLength = maxStoryLength;
  rememberGame(id);
  ui.judge.textContent = judge;
  ui.reply.textContent = greeting;
  clearTurn();
  ui.sale.textContent = "";
  ui.log.replaceChildren();
  ui.logSection.hidden = true;
  ui.story.value = "";
  showCounter();
  showGame(game);
};

const startGame = async () => {
  showNotice(null);
  try {
    enterGame(await post("/api/games", {}), GREETING);
  } catch (error) {
    showNotice(error instanceof Error ? error.message : String(error));
  }
};

/**
 * Picks up the game this browser played last, if the server still has it.
 * @returns {Promise<boolean>} whether a game was resumed
 */
const resumeGame = async () => {
  const id = rememberedGame();
  if (id === null) return false;
  try {
    /** @type {GameResponse} */
    const resumed = await call(`/api/games/${encodeURIComponent(id)}`);
    enterGame(resumed, resumed.game.status === "playing" ? WELCOME_BACK : TALE_TOLD);
    return true;
  } catch {
    // The game is gone or the server is down. Starting afresh reports the latter.
    return false;
  }
};

const openPage = async () => {
  if (!(await resumeGame())) await startGame();
};

const tellStory = async () => {
  const story = ui.story.value.trim();
  if (story === "" || ui.tell.disabled) return;
  const before = ui.reply.textContent;
  showNotice(null);
  setListening(true);
  try {
    /** @type {StoryResponse} */
    const { game, turn } = await post(`/api/games/${session.id}/stories`, { story });
    showTurn(turn);
    addToLog(story, turn);
    ui.story.value = "";
    showCounter();
    showGame(game);
  } catch (error) {
    ui.reply.textContent = before;
    showNotice(error instanceof Error ? error.message : String(error));
  } finally {
    setListening(false);
  }
};

/** @param {StallRow["grade"]} grade */
const sellGrade = async (grade) => {
  if (session.busy) return;
  showNotice(null);
  setBusy(true);
  try {
    /** @type {SaleResponse} */
    const { game, sale } = await post(`/api/games/${session.id}/sales`, { grade });
    ui.sale.textContent = saleText(sale);
    showGame(game);
  } catch (error) {
    showNotice(error instanceof Error ? error.message : String(error));
  } finally {
    setBusy(false);
  }
};

const takeBargain = async () => {
  if (session.busy) return;
  showNotice(null);
  setBusy(true);
  try {
    /** @type {BargainResponse} */
    const { game } = await post(`/api/games/${session.id}/bargain`, {});
    ui.reply.textContent = BARGAIN_STRUCK;
    clearTurn();
    showGame(game);
  } catch (error) {
    showNotice(error instanceof Error ? error.message : String(error));
  } finally {
    setBusy(false);
  }
};

ui.form.addEventListener("submit", (event) => {
  event.preventDefault();
  void tellStory();
});
ui.story.addEventListener("input", showCounter);
ui.bargain.addEventListener("click", () => void takeBargain());
ui.restart.addEventListener("click", () => void startGame());

void openPage();
