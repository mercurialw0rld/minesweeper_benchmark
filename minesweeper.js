import { aiPlay } from './aiplayer.js';

const cell = document.createElement('button');
const gridContainer = document.getElementById('minesweeper-grid');
let isFlagged = false;
let isOpened = false;
let hasWon = false;
let hasLost = false;
let aiAutoplayActive = false;
const AI_MOVE_DELAY_MS = 500;
let size = 9;
let numMines = 10;
const aiPlayButton = document.getElementById('ai-play-button')
const newGameButton = document.getElementById('new-game-button')
const difficultySelect = document.getElementById('difficulty-select')
const setDifficultyButton = document.getElementById('set-difficulty-button')
const aiButtonDefaultLabel = 'AI Play'
const timerDisplay = document.getElementById('timer-display')
const statsRows = document.getElementById('stats-rows')
const statsKey = 'minesweeperStats'
const difficulties = ['easy', 'medium', 'hard']
let timerStart = 0;
let timerIntervalId = null;
let timerRunning = false;
let lastElapsedMs = 0;
let currentPlayer = 'user';
let stats = loadStats();

// Set initial CSS grid variables
document.documentElement.style.setProperty('--grid-cols', size);
document.documentElement.style.setProperty('--grid-rows', size);

aiPlayButton.addEventListener('click', () => startAiAutoplay());

setDifficultyButton.addEventListener('click', () => {
    const difficulty = difficultySelect.value;
    if (difficulty === 'easy') {
        size = 8;
        numMines = 10;
    } else if (difficulty === 'medium') {
        size = 16;
        numMines = 40;
    } else if (difficulty === 'hard') {
        size = 24;
        numMines = 99;
    }
    // Update CSS grid variables
    document.documentElement.style.setProperty('--grid-cols', size);
    document.documentElement.style.setProperty('--grid-rows', size);
    newGame();
})

newGameButton.addEventListener('click', () => newGame())

async function renderGrid(size) {
    gridContainer.innerHTML = '';
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            const cell = document.createElement('button');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.dataset.opened = 'false';
            cell.dataset.flagged = 'false';
            cell.dataset.hasMine = 'false';
            cell.addEventListener('click', () => handleCellClick(row, col));
            cell.addEventListener('contextmenu', (event) => handleCellRightClick(row, col, event));
            gridContainer.appendChild(cell);
        }
    }
}

async function plantMines(numMines, size) {
    const minePositions = new Set();
    while (minePositions.size < numMines) {
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);
        minePositions.add(`${row},${col}`);
    }
    const cells = gridContainer.querySelectorAll('.cell')
    cells.forEach(cell => {
        const cellRow = parseInt(cell.dataset.row)
        const cellColumn = parseInt(cell.dataset.col)
        if (minePositions.has(`${cellRow},${cellColumn}`)){
            cell.dataset.hasMine = 'true'
        }

    })
}

async function newGame() {
    isFlagged = false;
    isOpened = false;
    hasWon = false;
    hasLost = false;
    aiAutoplayActive = false;
    setAiThinking(false);
    currentPlayer = 'user';
    stopTimer(true);
    await renderGrid(size);
    await plantMines(numMines, size);
}

async function handleCellClick(row, col){
    if (!timerRunning) startTimer();
    if (!aiAutoplayActive) currentPlayer = 'user';
    const cell = gridContainer.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;
    console.log(`Click en celda ${row}${col}`)
    await openCell(row, col);
    if (cell.dataset.hasMine === 'true') {
        await openEverything();
        setTimeout(() => {
            alert('Game Over! You hit a mine.');
        }, 100);
        hasLost = true;
        finalizeGame('loss');
        return;
    }
    await checkWinCondition();
}

async function handleCellRightClick(row, col, event) {
    event.preventDefault();
    const cell = gridContainer.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (!cell || cell.dataset.opened === 'true') return;
    
    if (cell.dataset.flagged === 'true') {
        cell.dataset.flagged = 'false';
        cell.classList.remove('flagged');
    } else {
        cell.dataset.flagged = 'true';
        cell.classList.add('flagged');
    }
}

async function openCell(row, col) {
    const cell = gridContainer.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (!cell || cell.dataset.opened === 'true' || cell.dataset.flagged === 'true') return;
    cell.dataset.opened = 'true';

    if (cell.dataset.hasMine === 'true') {
        cell.classList.add('mine-opened');
    } else {
        const adjacentMines = await countAdjacentMines(row, col);
        cell.textContent = adjacentMines > 0 ? adjacentMines : '';
        cell.dataset.adjacent = adjacentMines;
        cell.classList.add('opened');
        if (adjacentMines === 0) {
            await openAdjacents(row, col);
        }
    }
}


async function countAdjacentMines(row, col) {
    let mineCount = 0;
    for (let adjrow = row - 1; adjrow <= row + 1; adjrow++) {
        for (let adjcolumn = col - 1; adjcolumn <= col + 1; adjcolumn++) {
            const adjacentCell = gridContainer.querySelector(`.cell[data-row="${adjrow}"][data-col="${adjcolumn}"]`);
            if (adjacentCell && adjacentCell.dataset.hasMine === 'true') {
                mineCount += 1;
            }
        }
    }
    return mineCount;
}

async function openAdjacents(row, col) {
    const cells = gridContainer.querySelectorAll('.cell');
    for (let adjrow = row - 1; adjrow <= row + 1; adjrow++) {
        for (let adjcol = col - 1; adjcol <= col + 1; adjcol++) {
            if (adjrow === row && adjcol === col) continue;
            if (adjrow >= 0 && adjrow < size && adjcol >= 0 && adjcol < size) {
                await openCell(adjrow, adjcol);
            }
        }
    }
}

async function checkWinCondition() {
    const cells = gridContainer.querySelectorAll('.cell');
    let openedCells = 0;
    cells.forEach(cell => {
        if ((cell.dataset.opened === 'true' && (cell.dataset.hasMine === 'false' || cell.dataset.flagged === 'true'))) {
            openedCells += 1;
        }
    });
    if (openedCells === size * size - numMines) {
        hasWon = true;
        alert('You Win!');
        openEverything();
        finalizeGame('win');
    }
}


async function openEverything() {
    const cells = gridContainer.querySelectorAll('.cell');
    cells.forEach(cell => {
        if (cell.dataset.hasMine === 'true') {
            cell.classList.add('mine-opened');
        }
        cell.dataset.opened = 'true';
        cell.classList.add('opened');
    });
}

async function getBoardState() {
    const boardState = [];
    for (let row = 0; row < size; row++) {
        const rowState = [];
        for (let col = 0; col < size; col++) {
            const cell = gridContainer.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            if (cell.dataset.flagged === 'true') {
                rowState.push('F');
            } else if (cell.dataset.opened === 'false') {
                rowState.push('E');
            } else if (cell.dataset.opened  === 'true' && cell.dataset.hasMine === 'false') {
                const adjacent = parseInt(cell.dataset.adjacent);
                rowState.push(adjacent === 0 ? 'O' : adjacent);
            } else {
                rowState.push('E');
            }
        }
        boardState.push(rowState);
    }
    return boardState;
}

async function aiMakeMove() {
    if (hasWon || hasLost) return false;
    if (!timerRunning) startTimer();
    const boardState = await getBoardState();
    const move = await aiPlay(boardState);
    if (move.decision === 'O') {
        await handleCellClick(move.row, move.col);
    } else if (move.decision === 'F') {
        await handleCellRightClick(move.row, move.col, new MouseEvent('contextmenu'));
    }
    return true;
}

function startAiAutoplay() {
    if (aiAutoplayActive) return;
    aiAutoplayActive = true;
    currentPlayer = 'ai';
    const tick = async () => {
        if (!aiAutoplayActive || hasWon || hasLost) {
            aiAutoplayActive = false;
            setAiThinking(false);
            return;
        }
        try {
            setAiThinking(true);
            await aiMakeMove();
        } catch (err) {
            console.error('AI autoplay stopped due to error:', err);
            aiAutoplayActive = false;
            setAiThinking(false);
            return;
        }
        setAiThinking(false);
        setTimeout(tick, AI_MOVE_DELAY_MS);
    };
    setTimeout(tick, AI_MOVE_DELAY_MS);
}

function setAiThinking(isThinking) {
    if (isThinking) {
        aiPlayButton.textContent = 'Thinking...';
    } else if (aiAutoplayActive) {
        aiPlayButton.textContent = 'AI Playing';
    } else {
        aiPlayButton.textContent = aiButtonDefaultLabel;
    }
}

function startTimer() {
    timerStart = performance.now();
    timerRunning = true;
    timerIntervalId = setInterval(updateTimerDisplay, 200);
}

function stopTimer(resetDisplay = false) {
    if (timerIntervalId) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
    if (timerRunning) {
        lastElapsedMs = performance.now() - timerStart;
    }
    timerRunning = false;
    if (resetDisplay) {
        timerDisplay.textContent = '00:00';
    } else {
        updateTimerDisplay(true);
    }
}

function updateTimerDisplay(force = false) {
    if (!timerRunning && !force) return;
    const elapsed = timerRunning ? performance.now() - timerStart : lastElapsedMs;
    const minutes = Math.floor(elapsed / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
    timerDisplay.textContent = `${minutes}:${seconds}`;
}

function finalizeGame(outcome) {
    stopTimer();
    aiAutoplayActive = false;
    setAiThinking(false);
    const elapsed = lastElapsedMs;
    recordResult(currentPlayer, difficultySelect.value, outcome, elapsed);
}

function defaultStats() {
    const base = {};
    difficulties.forEach(d => {
        base[d] = { wins: 0, losses: 0, games: 0, totalTimeMs: 0 };
    });
    return { user: JSON.parse(JSON.stringify(base)), ai: JSON.parse(JSON.stringify(base)) };
}

function loadStats() {
    try {
        const raw = localStorage.getItem(statsKey);
        if (!raw) return defaultStats();
        const parsed = JSON.parse(raw);
        return parsed;
    } catch (err) {
        console.error('Failed to load stats, resetting.', err);
        return defaultStats();
    }
}

function saveStats() {
    try {
        localStorage.setItem(statsKey, JSON.stringify(stats));
    } catch (err) {
        console.error('Failed to save stats.', err);
    }
}

function recordResult(actor, difficulty, outcome, elapsedMs) {
    const bucket = stats[actor][difficulty];
    if (outcome === 'win') bucket.wins += 1; else bucket.losses += 1;
    bucket.games += 1;
    bucket.totalTimeMs += elapsedMs;
    saveStats();
    updateStatsUI();
}

function averageTime(bucket) {
    if (bucket.games === 0) return 0;
    return bucket.totalTimeMs / bucket.games;
}

function updateStatsUI() {
    const rows = [];
    difficulties.forEach(difficulty => {
        const user = stats.user[difficulty];
        const ai = stats.ai[difficulty];
        const userTotal = user.wins + user.losses;
        const aiTotal = ai.wins + ai.losses;
        const maxTotal = Math.max(userTotal, aiTotal, 1);
        const userWinWidth = userTotal ? (user.wins / maxTotal) * 100 : 0;
        const userLossWidth = userTotal ? (user.losses / maxTotal) * 100 : 0;
        const aiWinWidth = aiTotal ? (ai.wins / maxTotal) * 100 : 0;
        const aiLossWidth = aiTotal ? (ai.losses / maxTotal) * 100 : 0;
        const userAvg = averageTime(user);
        const aiAvg = averageTime(ai);
        rows.push(`
            <div class="stats-row">
                <div class="stats-difficulty">${difficulty}</div>
                <div class="stats-bars">
                    <div class="bar-track">
                        <div class="bar-fill user-win" style="width:${userWinWidth}%;">W ${user.wins}</div>
                        <div class="bar-fill user-loss" style="left:${userWinWidth}%; width:${userLossWidth}%;">L ${user.losses}</div>
                    </div>
                    <div class="bar-track">
                        <div class="bar-fill ai-win" style="width:${aiWinWidth}%;">W ${ai.wins}</div>
                        <div class="bar-fill ai-loss" style="left:${aiWinWidth}%; width:${aiLossWidth}%;">L ${ai.losses}</div>
                    </div>
                </div>
                <div class="stats-meta">
                    <span>User avg: ${formatMs(userAvg)}</span>
                    <span>AI avg: ${formatMs(aiAvg)}</span>
                </div>
            </div>
        `);
    });
    statsRows.innerHTML = rows.join('');
}

function formatMs(ms) {
    if (!ms) return '00:00';
    const minutes = Math.floor(ms / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}

updateStatsUI();

