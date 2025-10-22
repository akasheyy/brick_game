const canvas = document.getElementById("tetris");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const pauseBtn = document.getElementById("pauseBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const rotateBtn = document.getElementById("rotateBtn");
const downBtn = document.getElementById("downBtn");

const ROWS = 18;
const COLS = 10;
const BLOCK_SIZE = 30;

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

const COLORS = ["cyan", "blue", "orange", "yellow", "green", "purple", "red"];
const SHAPES = [
  [[1, 1, 1, 1]], // I
  [
    [2, 0, 0],
    [2, 2, 2],
  ], // J
  [
    [0, 0, 3],
    [3, 3, 3],
  ], // L
  [
    [4, 4],
    [4, 4],
  ], // O
  [
    [0, 5, 5],
    [5, 5, 0],
  ], // S
  [
    [0, 6, 0],
    [6, 6, 6],
  ], // T
  [
    [7, 7, 0],
    [0, 7, 7],
  ], // Z
];

let board, piece, score, highscore;
let gameOver = false;
let gamePaused = true;
let gameStarted = false;
let dropStart = Date.now();

// Initialize high score
highscore = localStorage.getItem("tetrisHighScore") || 0;
document.getElementById("highscore").textContent = highscore;

// Hide restart initially
restartBtn.style.display = "none";

function randomPiece() {
  const typeId = Math.floor(Math.random() * SHAPES.length);
  const shape = SHAPES[typeId];
  return {
    shape,
    color: COLORS[typeId],
    x: Math.floor(COLS / 2) - Math.ceil(shape[0].length / 2),
    y: 0,
  };
}

function drawSquare(x, y, color) {
  ctx.fillStyle = color || "#111";
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  ctx.strokeStyle = "#333";
  ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawBoard() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      drawSquare(c, r, board[r][c] ? COLORS[board[r][c] - 1] : "#111");
    }
  }
}

function drawPiece() {
  piece.shape.forEach((row, r) => {
    row.forEach((value, c) => {
      if (value) drawSquare(piece.x + c, piece.y + r, piece.color);
    });
  });
}

function collision(x, y, shape) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      let newX = piece.x + c + x;
      let newY = piece.y + r + y;
      if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
      if (newY >= 0 && board[newY][newX]) return true;
    }
  }
  return false;
}

function lockPiece() {
  piece.shape.forEach((row, r) => {
    row.forEach((value, c) => {
      if (value) board[piece.y + r][piece.x + c] = COLORS.indexOf(piece.color) + 1;
    });
  });

  // clear full lines
  let lines = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(val => val !== 0)) {
      board.splice(r, 1);
      board.unshift(Array(COLS).fill(0));
      lines++;
      r++;
    }
  }

  score += lines * 100;
  document.getElementById("score").textContent = score;

  // update highscore
  if (score > highscore) {
    highscore = score;
    localStorage.setItem("tetrisHighScore", score);
    document.getElementById("highscore").textContent = score;
  }

  piece = randomPiece();

  // Game over condition
  if (collision(0, 0, piece.shape)) {
    gameOver = true;
    gamePaused = true;

    // Hide pause and show restart
    pauseBtn.style.display = "none";
    startBtn.style.display = "none";
    restartBtn.style.display = "inline-block";

    drawGameOver();
  }
}

function moveDown() {
  if (!collision(0, 1, piece.shape)) piece.y++;
  else lockPiece();
  dropStart = Date.now();
}

function moveLeft() {
  if (!collision(-1, 0, piece.shape)) piece.x--;
}

function moveRight() {
  if (!collision(1, 0, piece.shape)) piece.x++;
}

function rotate() {
  const rotated = piece.shape[0].map((_, i) => piece.shape.map(r => r[i])).reverse();
  if (!collision(0, 0, rotated)) piece.shape = rotated;
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "red";
  ctx.font = "bold 40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  if (!gameOver) drawPiece();
  if (gameOver) drawGameOver();

  if (!gamePaused && !gameOver) {
    const now = Date.now();
    const delta = now - dropStart;
    if (delta > 500) moveDown();
    requestAnimationFrame(draw);
  }
}

document.addEventListener("keydown", e => {
  if (gamePaused || gameOver) return;
  if (e.key === "ArrowLeft") moveLeft();
  else if (e.key === "ArrowRight") moveRight();
  else if (e.key === "ArrowUp") rotate();
  else if (e.key === "ArrowDown") moveDown();
});

leftBtn.addEventListener("click", moveLeft);
rightBtn.addEventListener("click", moveRight);
rotateBtn.addEventListener("click", rotate);
downBtn.addEventListener("click", moveDown);

// 🎮 Start Game
startBtn.addEventListener("click", () => {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  piece = randomPiece();
  score = 0;
  gameOver = false;
  gameStarted = true;
  gamePaused = false;
  document.getElementById("score").textContent = score;

  startBtn.style.display = "none";
  restartBtn.style.display = "none";
  pauseBtn.style.display = "inline-block";

  draw();
});

// 🔁 Restart Game
restartBtn.addEventListener("click", () => {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  piece = randomPiece();
  score = 0;
  gameOver = false;
  gamePaused = false;
  document.getElementById("score").textContent = score;

  restartBtn.style.display = "none";
  pauseBtn.style.display = "inline-block";

  draw();
});

// ⏸ Pause / Resume
pauseBtn.addEventListener("click", () => {
  if (gameOver || !gameStarted) return;
  gamePaused = !gamePaused;
  pauseBtn.textContent = gamePaused ? "Resume" : "Pause";
  if (!gamePaused) {
    dropStart = Date.now();
    draw();
  }
});

// Draw initial board
drawBoard();
