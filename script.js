const puzzleTable = document.getElementById("puzzle");
const currentMoveText = document.getElementById("current-move");
const moveCounter = document.getElementById("move-count");
const levelSelect = document.getElementById("level-select");

let puzzle;
let selectedCell = null;
let mergeEffectData = null;
let previousMergeEffect = null;
let undoStack = [];

function hsl2rgb(h,s,l) { // https://stackoverflow.com/a/64090995
   let a=s*Math.min(l,1-l);
   let f= (n,k=(n+h/30)%12) => l - a*Math.max(Math.min(k-3,9-k,1),-1);
   return [f(0),f(8),f(4)];
}

function isLight(r, g, b) { // https://stackoverflow.com/a/3943023
    let components = [r, g, b];
    let [rp, gp, bp] = components.map(x => {
        if (x <= 0.04045) x = x / 12.92;
        else x = ((x + 0.055) / 1.055) ** 2.4;
        return x;
    });
    let l = 0.2126 * rp + 0.7152 * gp + 0.0722 * bp;
    return l > 0.179;
}

function mapHue(p) {
    return (p + 0.3) % 1;
}

function saveState() {
    undoStack.push(JSON.parse(JSON.stringify({
        puzzle,
        previousMergeEffect
    })));
}

function undo() {
    if (!undoStack.length) return;
    ({puzzle, previousMergeEffect} = undoStack.pop());
    selectedCell = null;
    mergeEffectData = null;
    updateGraphics();
}

function restart() {
    while (undoStack.length) undo();
}

function addBorder(tableCell, color) {
    tableCell.style.borderColor = color || (tableCell.style.color === "rgb(0, 0, 0)" ? "#888" : tableCell.style.color);
}

function updateGraphics() {
    while (puzzleTable.firstChild) puzzleTable.removeChild(puzzleTable.firstChild);
    for (let r = 0; r < puzzle.length; r++) {
        let row = puzzle[r];
        let tableRow = document.createElement("tr");
        if (!row.length) {
            let dummy = document.createElement("td");
            dummy.classList.add("cell");
            tableRow.appendChild(dummy);
        }
        for (let c = 0; c < row.length; c++) {
            let cell = row[c];
            let tableCell = document.createElement("td");
            tableCell.setAttribute("row", r);
            tableCell.setAttribute("col", c);
            tableRow.appendChild(tableCell);
            tableCell.classList.add("cell");
            if (cell === null) continue;
            let hsl;
            if (cell === 0) {
                hsl = [0, 1, 1];
            } else {
                tableCell.appendChild(document.createTextNode("" + cell));
                hsl = [mapHue((cell - 1) / 9) * 360, 1, 0.5];
            }
            let rgb = hsl2rgb(...hsl);
            tableCell.style.backgroundColor = `hsl(${hsl[0]}, ${hsl[1] * 100}%, ${hsl[2] * 100}%)`;
            tableCell.style.color = isLight(...rgb) ? "#000" : "#fff";
            if (selectedCell && r === selectedCell[0] && c === selectedCell[1])
                addBorder(tableCell);
        }
        puzzleTable.appendChild(tableRow);
    }
    puzzleTable.querySelectorAll(".cell").forEach(cell => {
        cell.addEventListener("mousedown", mouseDownEvent);
        cell.addEventListener("touchstart", mouseDownEvent);
    });
    if (puzzle.every(x => x.every(y => y === null)) && !mergeEffectData)
        puzzleTable.classList.add("solved");
    else
        puzzleTable.classList.remove("solved");
    currentMoveText.innerText = getCurrentMoveText();
    moveCounter.innerText = "" + (undoStack.length - (mergeEffectData || selectedCell ? 1 : 0));
    if (mergeEffectData) {
        switch (mergeEffectData.number) {
            case 1:
                if (mergeEffectData.first)
                    addBorder(getTableCell(...mergeEffectData.first), "#0f0");
                break;
            case 6:
                if (mergeEffectData.selected) {
                    let selectedCell = getTableCell(...mergeEffectData.selected);
                    addBorder(selectedCell);
                }
                break;
        }
    }
}

function loadFromString(str) {
    selectedCell = null;
    mergeEffectData = null;
    previousMergeEffect = null;
    undoStack = [];
    str = str.replaceAll("\r", "");
    let lines = str.split("\n");
    puzzle = [];
    for (let line of lines) {
        puzzle.push(
            [...line].map(c => {
                if (c === " ") return null;
                if (c === ".") return 0;
                return +c;
            })
        );
    }
    updateGraphics();
}

let allowMouseEvents = true;
function mouseDownEvent(e) {
    if (e.type === "touchstart") {
        allowMouseEvents = false;
        setTimeout(() => {allowMouseEvents = true;}, 1);
    }
    if (e.type === "mousedown" && !allowMouseEvents) return;
    if (e.type === "mousedown" && e.button !== 0) return;
    onClickCell(+e.target.getAttribute("row"), +e.target.getAttribute("col"));
}

function onClickCell(row, col) {
    let cell = puzzle[row][col];
    if (cell === null) return;
    if (mergeEffectData) {
        handleMergeEffect(row, col);
        updateGraphics();
        return;
    }
    if (cell === 0) return;
    if (selectedCell) {
        if (selectedCell[0] === row && selectedCell[1] === col) undo();
        else {
            let currentlySelectedCell = puzzle[selectedCell[0]][selectedCell[1]];
            if (cell === currentlySelectedCell && isAdjacent(row, col, ...selectedCell)) {
                puzzle[row][col] = cell + 1;
                puzzle[selectedCell[0]][selectedCell[1]] = 0;
                selectedCell = null;
                if (cell === 2) {
                    if (previousMergeEffect) mergeEffectData = {number: previousMergeEffect};
                } else if (cell === 9) {
                    puzzle = puzzle.map(row => row.fill(null));
                } else mergeEffectData = {number: cell};
            } else {
                selectedCell = [row, col];
            }
        }
    } else {
        saveState();
        selectedCell = [row, col];
    }
    updateGraphics();
}

function handleMergeEffect(row, col) {
    let cell = puzzle[row][col];
    let prevNumber = mergeEffectData.number;
    switch (mergeEffectData.number) {
        case 1:
            if (mergeEffectData.first) {
                if (isAdjacent(row, col, ...mergeEffectData.first)) {
                    puzzle[row][col] = null;
                    mergeEffectData = null;
                }
            } else {
                puzzle[row][col] = null;
                mergeEffectData.first = [row, col];
            }
            break;
        case 3:
            puzzle = puzzle.map(row => row.map(c => cell === c ? 1 : c));
            mergeEffectData = null;
            break;
        case 4:
            puzzle = puzzle.map(
                (puzzleRow, r) => puzzleRow.map(
                    (puzzleCell, c) => (r === row || c === col) ? null : puzzleCell
                )
            );
            mergeEffectData = null;
            break;
        case 5:
            puzzle = puzzle.map(
                (puzzleRow, r) => puzzleRow.map(
                    (puzzleCell, c) => (Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1) ? null : puzzleCell
                )
            );
            mergeEffectData = null;
            break;
        case 6:
            if (mergeEffectData.selected && puzzle[row][col] === 0) {
                let [sr, sc] = mergeEffectData.selected;
                puzzle[row][col] = puzzle[sr][sc];
                puzzle[sr][sc] = 0;
                mergeEffectData = null;
            } else {
                mergeEffectData.selected = [row, col];
            }
            break;
        case 7:
            if (cell !== 0 && cell !== 9) {
                puzzle = puzzle.map(
                    puzzleRow => puzzleRow.map(
                        puzzleCell => puzzleCell === cell ? cell + 1 : puzzleCell
                    )
                );
                mergeEffectData = null;
            }
            break;
        case 8: {
            let frontier = [[row, col]];
            let connected = [];
            while (frontier.length) {
                let current = frontier.shift();
                let [currentRow, currentCol] = current;
                if (connected.some(([r, c]) => currentRow === r && currentCol === c)) continue;
                connected.push(current);
                for (let [roff, coff] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                    let possibleCell = (puzzle[currentRow + roff] ?? [])[currentCol + coff] ?? null;
                    if (possibleCell !== null) frontier.push([currentRow + roff, currentCol + coff]);
                }
            }
            connected.forEach(([r, c]) => {puzzle[r][c] = null;});
            mergeEffectData = null;
            break;
        }
        default:
            console.error(`Unimplemented merge effect: merged ${mergeEffectData.number}s`);
            break;
    }
    if (!mergeEffectData) previousMergeEffect = prevNumber;
}

function getCurrentMoveText() {
    if (!mergeEffectData) return "none";
    switch (mergeEffectData.number) {
        case 1:
            if (mergeEffectData.first) return "Remove an adjacent cell";
            else return "Remove two adjacent cells";
        case 3:
            return "Transform clicked cell type into 1s";
        case 4:
            return "Remove row and column of clicked cell";
        case 5:
            return "Remove 3x3 area";
        case 6:
            if (mergeEffectData.selected) return "Select empty cell to move it to";
            else return "Select cell to move";
        case 7:
            return "Increment clicked cell type";
        case 8:
            return "Remove group of connected cells";
    }
}

function getTableCell(row, col) {
    return puzzleTable.children[row].children[col];
}

function isAdjacent(r1, c1, r2, c2) {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

PUZZLES.forEach((puzzle, i) => {
    let option = document.createElement("option");
    option.value = i;
    option.appendChild(document.createTextNode(puzzle.name));
    levelSelect.appendChild(option);
});

function loadLevelSelect() {
    loadFromString(PUZZLES[+levelSelect.value].grid);
}

function copyCustom() {
    let link = location.href.split("?")[0] + "?" + btoa(document.getElementById("custom").value)
        .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
    navigator.clipboard.writeText(link);
}

document.querySelectorAll("button").forEach(btn => {
    let oldClick = btn.onclick;
    btn.ontouchstart = btn.onclick = e => {
        if (typeof (window.ontouchstart) !== "undefined" && e.type === "click") return;
        oldClick(e);
    }
});

if (location.href.indexOf("?") > -1) {
    let base64 = location.href.split("?")[1].replaceAll("-", "+").replaceAll("_", "/");
    while (base64.length % 4) base64 += "=";
    loadFromString(atob(base64));
}