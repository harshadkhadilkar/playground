const boardElement = document.getElementById("board");
const statusText = document.getElementById("statusText");
const newGameButton = document.getElementById("newGame");
const modeSelect = document.getElementById("mode");
const sidePicker = document.getElementById("sidePicker");
const playerMarkSelect = document.getElementById("playerMark");

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

let boardState = Array(9).fill(null);
let currentPlayer = "X";
let isGameOver = false;
let isVsComputer = true;
let humanMark = "X";
let computerMark = "O";

function init() {
  boardElement.addEventListener("click", onCellClick);
  boardElement.addEventListener("keydown", onCellKeydown);
  newGameButton.addEventListener("click", () => startNewGame());
  modeSelect.addEventListener("change", onModeChange);
  playerMarkSelect.addEventListener("change", onPlayerMarkChange);

  restoreSettings();
  updateSidePickerVisibility();
  startNewGame();
}

function restoreSettings() {
  try {
    const savedMode = localStorage.getItem("ttt_mode");
    const savedMark = localStorage.getItem("ttt_mark");
    if (savedMode) modeSelect.value = savedMode;
    if (savedMark) playerMarkSelect.value = savedMark;
  } catch {}
  isVsComputer = modeSelect.value === "cpu";
  humanMark = playerMarkSelect.value;
  computerMark = humanMark === "X" ? "O" : "X";
}

function persistSettings() {
  try {
    localStorage.setItem("ttt_mode", modeSelect.value);
    localStorage.setItem("ttt_mark", playerMarkSelect.value);
  } catch {}
}

function onModeChange() {
  isVsComputer = modeSelect.value === "cpu";
  updateSidePickerVisibility();
  persistSettings();
  startNewGame();
}

function onPlayerMarkChange() {
  humanMark = playerMarkSelect.value;
  computerMark = humanMark === "X" ? "O" : "X";
  persistSettings();
  startNewGame();
}

function updateSidePickerVisibility() {
  sidePicker.style.display = modeSelect.value === "cpu" ? "flex" : "none";
}

function startNewGame() {
  boardState = Array(9).fill(null);
  currentPlayer = "X";
  isGameOver = false;
  renderBoard();
  updateStatus();
  if (isVsComputer && humanMark === "O") {
    window.setTimeout(computerTurn, 300);
  }
}

function renderBoard() {
  for (let i = 0; i < 9; i++) {
    const cell = boardElement.querySelector(`[data-index="${i}"]`);
    const value = boardState[i];
    cell.textContent = value ? value : "";
    cell.classList.toggle("x", value === "X");
    cell.classList.toggle("o", value === "O");
    cell.classList.remove("win");
    cell.disabled = Boolean(value) || isGameOver;
    cell.setAttribute("aria-label", `Cell ${i + 1}${value ? ", contains " + value : ""}`);
  }
}

function onCellClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  const index = Number(target.dataset.index);
  handlePlayerMove(index);
}

function onCellKeydown(event) {
  if (!(event.target instanceof HTMLButtonElement)) return;
  const index = Number(event.target.dataset.index);
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handlePlayerMove(index);
  }
}

function handlePlayerMove(index) {
  if (isGameOver) return;
  if (boardState[index]) return;
  if (isVsComputer && currentPlayer !== humanMark) return;

  placeMark(index, currentPlayer);
  const outcome = evaluateOutcome(boardState);
  if (outcome.finished) {
    finalizeGame(outcome);
    return;
  }

  switchTurn();
  if (isVsComputer) {
    window.setTimeout(computerTurn, 300);
  }
}

function computerTurn() {
  if (isGameOver) return;
  if (!isVsComputer) return;
  if (currentPlayer !== computerMark) return;

  const index = chooseBestMove(boardState, computerMark, humanMark);
  placeMark(index, currentPlayer);

  const outcome = evaluateOutcome(boardState);
  if (outcome.finished) {
    finalizeGame(outcome);
    return;
  }

  switchTurn();
}

function placeMark(index, mark) {
  boardState[index] = mark;
  renderBoard();
}

function switchTurn() {
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  updateStatus();
}

function updateStatus(messageOverride) {
  if (messageOverride) {
    statusText.textContent = messageOverride;
    return;
  }
  if (isGameOver) return;
  if (isVsComputer) {
    if (currentPlayer === humanMark) {
      statusText.textContent = `Your turn (${humanMark})`;
    } else {
      statusText.textContent = `Computer thinking (${computerMark})…`;
    }
  } else {
    statusText.textContent = `Player ${currentPlayer}’s turn`;
  }
}

function evaluateOutcome(state) {
  for (const [a, b, c] of WIN_LINES) {
    if (state[a] && state[a] === state[b] && state[a] === state[c]) {
      return { finished: true, winner: state[a], line: [a, b, c] };
    }
  }
  if (state.every(Boolean)) {
    return { finished: true, winner: null, line: null };
  }
  return { finished: false };
}

function finalizeGame(outcome) {
  isGameOver = true;
  if (outcome.line) {
    for (const i of outcome.line) {
      const cell = boardElement.querySelector(`[data-index="${i}"]`);
      cell.classList.add("win");
    }
  }
  for (let i = 0; i < 9; i++) {
    const cell = boardElement.querySelector(`[data-index="${i}"]`);
    cell.disabled = true;
  }

  if (outcome.winner) {
    if (isVsComputer) {
      if (outcome.winner === humanMark) {
        updateStatus("You win! 🎉");
      } else {
        updateStatus("Computer wins! 🤖");
      }
    } else {
      updateStatus(`Player ${outcome.winner} wins! 🎉`);
    }
  } else {
    updateStatus("It’s a draw.");
  }
}

function chooseBestMove(state, ai, human) {
  const available = getAvailableMoves(state);
  if (available.length === 9) return 0; // take a corner-ish fast path

  let bestScore = -Infinity;
  let bestIndex = available[0];
  for (const index of available) {
    state[index] = ai;
    const score = minimax(state, false, ai, human, -Infinity, Infinity);
    state[index] = null;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }
  return bestIndex;
}

function minimax(state, isMaximizing, ai, human, alpha, beta) {
  const outcome = evaluateOutcome(state);
  if (outcome.finished) {
    if (outcome.winner === ai) return 10;
    if (outcome.winner === human) return -10;
    return 0;
  }

  const available = getAvailableMoves(state);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const index of available) {
      state[index] = ai;
      const evalScore = minimax(state, false, ai, human, alpha, beta);
      state[index] = null;
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const index of available) {
      state[index] = human;
      const evalScore = minimax(state, true, ai, human, alpha, beta);
      state[index] = null;
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function getAvailableMoves(state) {
  const indices = [];
  for (let i = 0; i < state.length; i++) {
    if (!state[i]) indices.push(i);
  }
  return indices;
}

init();