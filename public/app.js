// @ts-check
// The page. It holds no game rules: it sends stories to the server and
// shows what comes back. Plain JavaScript, so the browser can run it
// without a build step; the type check still covers it through JSDoc.

/** @typedef {import("../src/web/view.ts").GameView} GameView */
/** @typedef {import("../src/web/view.ts").TurnView} TurnView */
/** @typedef {import("../src/web/view.ts").NewGameResponse} NewGameResponse */
/** @typedef {import("../src/web/view.ts").StoryResponse} StoryResponse */

const GREETING =
  "I sold my voice to the sea witch. She will sell it back for coins, and my tears are pearls. " +
  "Will you tell me something sad?";
const LISTENING = "…";
const LOG_PREVIEW_LENGTH = 120;
const PEARL_STAGGER_MS = 120;

const ENDINGS = {
  won: {
    title: "Her voice returns",
    text:
      "The sea witch counts the coins twice, then opens her hand. The little mermaid tries one " +
      "note, and it comes out as a song. “Thank you,” she says aloud, “for trusting me with " +
      "your sorrows.”",
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

/** The current game's id and story length limit, set once a game starts. */
const session = { id: "", maxStoryLength: 0 };

/**
 * Sends JSON to the server and returns its JSON answer.
 * Rejects with the server's own message when the call fails.
 * @param {string} path
 * @param {unknown} body
 * @returns {Promise<any>}
 */
const post = async (path, body) => {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {
    throw new Error("The game server cannot be reached. Is it still running?");
  });
  const answer = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(answer.error ?? "Something went wrong.");
  return answer;
};

/** @param {number} count @param {string} noun */
const plural = (count, noun) => `${count} ${noun}${count === 1 ? "" : "s"}`;

/** @param {string | null} message */
const showNotice = (message) => {
  ui.notice.hidden = message === null;
  ui.notice.textContent = message ?? "";
};

/** @param {GameView} game */
const showGame = (game) => {
  ui.coins.textContent = String(game.coins);
  ui.goal.textContent = String(game.goal);
  ui.storiesLeft.textContent = String(game.storiesLeft);
  ui.progress.setAttribute("aria-valuemax", String(game.goal));
  ui.progress.setAttribute("aria-valuenow", String(Math.min(game.coins, game.goal)));
  ui.progressFill.style.width = `${Math.min(100, (100 * game.coins) / game.goal)}%`;

  const over = game.status !== "playing";
  ui.form.hidden = over;
  ui.ending.hidden = !over;
  if (game.status !== "playing") {
    ui.endingTitle.textContent = ENDINGS[game.status].title;
    ui.endingText.textContent = ENDINGS[game.status].text;
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
const earnedText = ({ pearls, coinsEarned }) =>
  pearls.count === 0
    ? "No tears this time."
    : `${plural(pearls.count, `${pearls.grade} pearl`)} · +${plural(coinsEarned, "coin")}`;

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

/** @param {boolean} listening */
const setListening = (listening) => {
  ui.tell.disabled = listening;
  ui.story.readOnly = listening;
  ui.mermaid.classList.toggle("listening", listening);
  if (listening) {
    ui.reply.textContent = LISTENING;
    clearTurn();
  }
};

const startGame = async () => {
  showNotice(null);
  try {
    /** @type {NewGameResponse} */
    const started = await post("/api/games", {});
    session.id = started.id;
    session.maxStoryLength = started.maxStoryLength;
    ui.judge.textContent = started.judge;
    ui.reply.textContent = GREETING;
    clearTurn();
    ui.log.replaceChildren();
    ui.logSection.hidden = true;
    ui.story.value = "";
    showCounter();
    showGame(started.game);
  } catch (error) {
    showNotice(error instanceof Error ? error.message : String(error));
  }
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

ui.form.addEventListener("submit", (event) => {
  event.preventDefault();
  void tellStory();
});
ui.story.addEventListener("input", showCounter);
ui.restart.addEventListener("click", () => void startGame());

void startGame();
