const cell = document.createElement('button');
const gridContainer = document.getElementById('minesweeper-grid');
let isFlagged = false;
let isOpened = false;
let hasWon = false;
let hasLost = false;
let size = 9;
let numMines = 10;
const newGameButton = document.getElementById('new-game-button')
const difficultySelect = document.getElementById('difficulty-select')
const setDifficultyButton = document.getElementById('set-difficulty-button')

// Set initial CSS grid variables
document.documentElement.style.setProperty('--grid-cols', size);
document.documentElement.style.setProperty('--grid-rows', size);


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
    await renderGrid(size);
    await plantMines(numMines, size);
}

async function handleCellClick(row, col){
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

