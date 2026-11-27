import { soundService } from '../../services/soundService.js';

/**
 * Git Contribution Snake Mini-Game.
 * Seeded with real repository names from the connected GitHub account.
 */
export function mountContributionSnake(container, repos, store) {
  const repoNames = repos.length ? repos.map((r) => r.name) : ['meiyonpersonalai', 'crackwise-ai', 'elrics-task'];
  let highScore = store.getState().games.snakeHighScore || 0;

  container.innerHTML = `
    <div class="minigame-wrap">
      <div class="minigame-hud">
        <span>SCORE: <strong id="snake-score">0</strong></span>
        <span>BEST: <strong id="snake-best">${highScore}</strong></span>
        <span id="snake-target">NEXT COMMIT: ${repoNames[0]}</span>
      </div>
      <canvas id="snake-canvas" width="384" height="256" class="pixel-canvas"></canvas>
      <div class="minigame-controls">
        <div class="dpad">
          <button class="pixel-btn small" data-dir="up">▲</button>
          <div class="dpad-mid">
            <button class="pixel-btn small" data-dir="left">◀</button>
            <button class="pixel-btn small" data-dir="down">▼</button>
            <button class="pixel-btn small" data-dir="right">▶</button>
          </div>
        </div>
        <button class="pixel-btn accent small" id="snake-restart">↻ RESTART</button>
      </div>
      <p class="hint-text">Use Arrow keys or D-Pad to eat glowing GitHub commits without hitting walls.</p>
    </div>
  `;

  const canvas = container.querySelector('#snake-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = container.querySelector('#snake-score');
  const bestEl = container.querySelector('#snake-best');
  const targetEl = container.querySelector('#snake-target');

  const cols = 24;
  const rows = 16;
  const cell = 16;

  let snake = [];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let food = { x: 16, y: 8 };
  let score = 0;
  let gameOver = false;
  let repoIndex = 0;
  let bgMatrix = [];

  function spawnFood() {
    let fx;
    let fy;
    let guard = 0;
    do {
      fx = Math.floor(Math.random() * cols);
      fy = Math.floor(Math.random() * rows);
      guard += 1;
    } while (snake.some((s) => s.x === fx && s.y === fy) && guard < 100);
    food = { x: fx, y: fy };
    repoIndex = (repoIndex + 1) % repoNames.length;
    targetEl.textContent = `NEXT COMMIT: ${repoNames[repoIndex]}`;
  }

  function reset() {
    snake = [
      { x: 6, y: 8 },
      { x: 5, y: 8 },
      { x: 4, y: 8 },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    gameOver = false;
    scoreEl.textContent = '0';
    bgMatrix = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => (Math.random() > 0.72 ? '#163125' : '#121824'))
    );
    spawnFood();
    draw();
  }

  function setDirection(nx, ny) {
    if (nx === -dir.x && ny === -dir.y) return;
    nextDir = { x: nx, y: ny };
  }

  function tick() {
    if (gameOver) return;
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows || snake.some((s) => s.x === head.x && s.y === head.y)) {
      gameOver = true;
      soundService.playHit();
      draw();
      return;
    }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      scoreEl.textContent = String(score);
      soundService.playCollect();
      if (store.recordHighScore('snakeHighScore', score)) {
        highScore = score;
        bestEl.textContent = String(highScore);
      }
      spawnFood();
    } else {
      snake.pop();
    }
    draw();
  }

  function draw() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // GitHub contribution graph grid
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        ctx.fillStyle = bgMatrix[y][x];
        ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
      }
    }

    // Glowing commit fruit
    ctx.fillStyle = '#facc15';
    ctx.fillRect(food.x * cell + 2, food.y * cell + 2, cell - 4, cell - 4);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(food.x * cell + 5, food.y * cell + 5, 4, 4);

    // Snake segments
    snake.forEach((seg, idx) => {
      ctx.fillStyle = idx === 0 ? '#39d353' : idx % 2 === 0 ? '#26a641' : '#006d32';
      ctx.fillRect(seg.x * cell + 1, seg.y * cell + 1, cell - 2, cell - 2);
    });

    if (gameOver) {
      ctx.fillStyle = 'rgba(13, 17, 23, 0.8)';
      ctx.fillRect(0, 88, canvas.width, 80);
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MERGE CONFLICT! GAME OVER', canvas.width / 2, 122);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`FINAL SCORE: ${score} · CLICK RESTART`, canvas.width / 2, 148);
      ctx.textAlign = 'left';
    }
  }

  const onKeyDown = (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (e.key === 'ArrowUp') setDirection(0, -1);
    else if (e.key === 'ArrowDown') setDirection(0, 1);
    else if (e.key === 'ArrowLeft') setDirection(-1, 0);
    else if (e.key === 'ArrowRight') setDirection(1, 0);
  };

  window.addEventListener('keydown', onKeyDown, true);
  container.querySelector('#snake-restart').addEventListener('click', reset);
  container.querySelectorAll('[data-dir]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const d = btn.dataset.dir;
      if (d === 'up') setDirection(0, -1);
      if (d === 'down') setDirection(0, 1);
      if (d === 'left') setDirection(-1, 0);
      if (d === 'right') setDirection(1, 0);
    });
  });

  reset();
  const intervalId = setInterval(tick, 130);

  return () => {
    clearInterval(intervalId);
    window.removeEventListener('keydown', onKeyDown, true);
  };
}
