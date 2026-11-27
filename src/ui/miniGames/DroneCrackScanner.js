import { soundService } from '../../services/soundService.js';

/**
 * UAV Crack Scanner Mini-Game inspired by Mohilc's crackwise-ai (YOLOv8 + ESP32-CAM + UAV).
 * Pilot the quadcopter, dodge static interference, and scan structural cracks!
 */
export function mountDroneCrackScanner(container, store) {
  let best = store.getState().games.droneHighScore || 0;

  container.innerHTML = `
    <div class="minigame-wrap">
      <div class="minigame-hud">
        <span>SCANNED: <strong id="drone-score">0</strong></span>
        <span>BEST: <strong id="drone-best">${best}</strong></span>
        <span>YOLOv8 + ESP32-CAM SIM</span>
      </div>
      <canvas id="drone-canvas" width="384" height="220" class="pixel-canvas"></canvas>
      <div class="minigame-controls">
        <button class="pixel-btn small" id="drone-up">▲ UP</button>
        <button class="pixel-btn small" id="drone-down">▼ DOWN</button>
        <button class="pixel-btn accent small" id="drone-scan">⚡ SCAN CRACK (SPACE)</button>
        <button class="pixel-btn small" id="drone-restart">↻ RESET</button>
      </div>
      <p class="hint-text">Move with ↑ / ↓ and press SPACE (or click SCAN) when aligned with red cracks!</p>
    </div>
  `;

  const canvas = container.querySelector('#drone-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = container.querySelector('#drone-score');
  const bestEl = container.querySelector('#drone-best');

  let droneY = 110;
  let vy = 0;
  let scanTimer = 0;
  let score = 0;
  let lives = 3;
  let gameOver = false;
  let entities = [];
  let spawnTick = 0;

  function reset() {
    droneY = 110;
    vy = 0;
    scanTimer = 0;
    score = 0;
    lives = 3;
    gameOver = false;
    entities = [];
    spawnTick = 0;
    scoreEl.textContent = '0';
  }

  function triggerScan() {
    if (gameOver) return;
    scanTimer = 10;
    let hit = false;
    for (const ent of entities) {
      if (ent.type === 'crack' && !ent.scanned && ent.x > 55 && ent.x < 210 && Math.abs(ent.y - droneY) < 30) {
        ent.scanned = true;
        score += 15;
        hit = true;
        scoreEl.textContent = String(score);
        if (store.recordHighScore('droneHighScore', score)) {
          best = score;
          bestEl.textContent = String(best);
        }
      }
    }
    if (hit) soundService.playCollect();
    else soundService.playTone(300, 0.04, 'triangle', 0.02);
  }

  function step() {
    if (!gameOver) {
      droneY = Math.max(20, Math.min(canvas.height - 22, droneY + vy));
      vy *= 0.84;
      if (scanTimer > 0) scanTimer -= 1;

      spawnTick += 1;
      if (spawnTick % 26 === 0) {
        const isHazard = Math.random() < 0.38;
        entities.push({
          type: isHazard ? 'storm' : 'crack',
          x: canvas.width + 20,
          y: 26 + Math.random() * (canvas.height - 52),
          scanned: false,
        });
      }

      for (let i = entities.length - 1; i >= 0; i -= 1) {
        const ent = entities[i];
        ent.x -= 3.2;
        if (ent.type === 'storm' && Math.abs(ent.x - 56) < 18 && Math.abs(ent.y - droneY) < 18) {
          entities.splice(i, 1);
          lives -= 1;
          soundService.playHit();
          if (lives <= 0) gameOver = true;
          continue;
        }
        if (ent.x < -30) entities.splice(i, 1);
      }
    }

    // Render pixel concrete wall backdrop
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#334155';
    for (let x = 0; x < canvas.width; x += 32) {
      ctx.fillRect(x, 0, 2, canvas.height);
    }

    // Draw entities
    for (const ent of entities) {
      if (ent.type === 'crack') {
        ctx.strokeStyle = ent.scanned ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ent.x - 10, ent.y - 12);
        ctx.lineTo(ent.x + 2, ent.y);
        ctx.lineTo(ent.x - 4, ent.y + 12);
        ctx.stroke();
        ctx.strokeRect(ent.x - 14, ent.y - 16, 28, 32);
        ctx.fillStyle = ent.scanned ? '#22c55e' : '#fca5a5';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(ent.scanned ? 'OK' : '94%', ent.x - 12, ent.y - 19);
      } else {
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(ent.x - 10, ent.y - 10, 20, 20);
        ctx.fillStyle = '#f3e8ff';
        ctx.fillRect(ent.x - 4, ent.y - 4, 8, 8);
      }
    }

    // Scan cone
    if (scanTimer > 0) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.moveTo(64, droneY);
      ctx.lineTo(205, droneY - 32);
      ctx.lineTo(205, droneY + 32);
      ctx.closePath();
      ctx.fill();
    }

    // Drone sprite
    ctx.fillStyle = '#f97316';
    ctx.fillRect(44, droneY - 8, 22, 16);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(58, droneY - 4, 8, 8);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(40, droneY - 12, 12, 3);
    ctx.fillRect(56, droneY - 12, 12, 3);

    // Lives HUD
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`UAV HP: ${'♥'.repeat(Math.max(0, lives))}`, 10, 16);

    if (gameOver) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
      ctx.fillRect(0, 74, canvas.width, 72);
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DRONE SIGNAL LOST', canvas.width / 2, 106);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`CRACKS SCANNED: ${score} · CLICK RESET`, canvas.width / 2, 130);
      ctx.textAlign = 'left';
    }
  }

  const onKeyDown = (e) => {
    if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (e.key === 'ArrowUp') vy = -5;
    if (e.key === 'ArrowDown') vy = 5;
    if (e.key === ' ') triggerScan();
  };

  window.addEventListener('keydown', onKeyDown, true);
  container.querySelector('#drone-up').addEventListener('click', () => { vy = -6; });
  container.querySelector('#drone-down').addEventListener('click', () => { vy = 6; });
  container.querySelector('#drone-scan').addEventListener('click', triggerScan);
  container.querySelector('#drone-restart').addEventListener('click', reset);

  const timer = setInterval(step, 33);

  return () => {
    clearInterval(timer);
    window.removeEventListener('keydown', onKeyDown, true);
  };
}
