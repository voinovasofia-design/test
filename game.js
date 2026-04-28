const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const menuEl = document.getElementById('main-menu');
const startBtn = document.getElementById('start-game');

const WORLD_WIDTH = 3400;
const GRAVITY = 0.62;
const MAX_FALL_SPEED = 14;

const keys = {
  left: false,
  right: false,
  jump: false,
};

const game = {
  score: 0,
  lives: 3,
  gameOver: false,
  victory: false,
  started: false,
};

const player = {
  x: 96,
  y: 200,
  w: 34,
  h: 42,
  vx: 0,
  vy: 0,
  speed: 4.2,
  jumpForce: 13,
  grounded: false,
  invincibleFrames: 0,
  facing: 1,
};

const platforms = [
  { x: 0, y: 500, w: WORLD_WIDTH, h: 40 },
  { x: 220, y: 420, w: 170, h: 26 },
  { x: 500, y: 350, w: 180, h: 26 },
  { x: 790, y: 280, w: 160, h: 26 },
  { x: 1120, y: 410, w: 210, h: 26 },
  { x: 1450, y: 340, w: 180, h: 26 },
  { x: 1740, y: 280, w: 240, h: 26 },
  { x: 2140, y: 430, w: 220, h: 26 },
  { x: 2480, y: 360, w: 180, h: 26 },
  { x: 2830, y: 300, w: 190, h: 26 },
];

const coins = [
  [260, 380], [335, 380], [560, 312], [635, 312], [840, 242], [905, 242], [1170, 372],
  [1260, 372], [1500, 302], [1570, 302], [1790, 242], [1870, 242], [1950, 242], [2200, 392],
  [2290, 392], [2520, 322], [2600, 322], [2870, 262], [2950, 262], [3030, 262],
].map(([x, y]) => ({ x, y, r: 10, taken: false }));

const enemies = [
  { x: 410, y: 468, w: 32, h: 32, vx: 1.4, minX: 350, maxX: 650, alive: true },
  { x: 1350, y: 468, w: 32, h: 32, vx: 1.7, minX: 1200, maxX: 1550, alive: true },
  { x: 2390, y: 468, w: 32, h: 32, vx: 1.8, minX: 2300, maxX: 2620, alive: true },
  { x: 3050, y: 468, w: 32, h: 32, vx: 2, minX: 2920, maxX: 3250, alive: true },
];

const flag = { x: 3320, y: 340, w: 16, h: 160 };

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function resetLevel(fullReset = false) {
  player.x = 96;
  player.y = 200;
  player.vx = 0;
  player.vy = 0;
  player.grounded = false;
  player.invincibleFrames = 0;
  game.gameOver = false;
  game.victory = false;

  enemies.forEach((enemy) => {
    enemy.alive = true;
  });

  if (fullReset) {
    game.score = 0;
    game.lives = 3;
    coins.forEach((coin) => {
      coin.taken = false;
    });
  }

  updateHud();
}

function updateHud() {
  scoreEl.textContent = `Score: ${game.score}`;
  livesEl.textContent = `Lives: ${game.lives}`;
}

function handleInput() {
  if (keys.left && !keys.right) {
    player.vx = -player.speed;
    player.facing = -1;
  } else if (keys.right && !keys.left) {
    player.vx = player.speed;
    player.facing = 1;
  } else {
    player.vx *= 0.75;
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
  }

  if (keys.jump && player.grounded) {
    player.vy = -player.jumpForce;
    player.grounded = false;
  }
}

function updatePlayer() {
  handleInput();

  player.vy += GRAVITY;
  if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED;

  player.x += player.vx;
  player.y += player.vy;

  if (player.x < 0) player.x = 0;
  if (player.x + player.w > WORLD_WIDTH) player.x = WORLD_WIDTH - player.w;

  player.grounded = false;
  platforms.forEach((p) => {
    if (!rectsOverlap(player, p)) return;

    const prevBottom = player.y + player.h - player.vy;
    const prevTop = player.y - player.vy;
    const prevRight = player.x + player.w - player.vx;
    const prevLeft = player.x - player.vx;

    if (prevBottom <= p.y) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.grounded = true;
    } else if (prevTop >= p.y + p.h) {
      player.y = p.y + p.h;
      player.vy = 0;
    } else if (prevRight <= p.x) {
      player.x = p.x - player.w;
      player.vx = 0;
    } else if (prevLeft >= p.x + p.w) {
      player.x = p.x + p.w;
      player.vx = 0;
    }
  });

  if (player.y > canvas.height + 200) {
    loseLife();
  }

  if (player.invincibleFrames > 0) player.invincibleFrames -= 1;
}

function updateCoins() {
  for (const coin of coins) {
    if (coin.taken) continue;
    const hitbox = { x: coin.x - coin.r, y: coin.y - coin.r, w: coin.r * 2, h: coin.r * 2 };
    if (rectsOverlap(player, hitbox)) {
      coin.taken = true;
      game.score += 100;
      updateHud();
    }
  }
}

function updateEnemies() {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;

    enemy.x += enemy.vx;
    if (enemy.x < enemy.minX || enemy.x + enemy.w > enemy.maxX) {
      enemy.vx *= -1;
    }

    if (!rectsOverlap(player, enemy)) continue;
    const stomped = player.vy > 2 && player.y + player.h - player.vy <= enemy.y + 6;

    if (stomped) {
      enemy.alive = false;
      player.vy = -9;
      game.score += 250;
      updateHud();
    } else if (player.invincibleFrames === 0) {
      loseLife();
      return;
    }
  }
}

function updateFlag() {
  if (!game.victory && rectsOverlap(player, flag)) {
    game.victory = true;
    game.score += 1000;
    updateHud();
  }
}

function loseLife() {
  game.lives -= 1;
  updateHud();
  if (game.lives <= 0) {
    game.gameOver = true;
    return;
  }

  player.x = Math.max(64, player.x - 120);
  player.y = 120;
  player.vx = 0;
  player.vy = 0;
  player.invincibleFrames = 80;
}

function drawPlatform(p, cameraX) {
  ctx.fillStyle = '#7f5539';
  ctx.fillRect(p.x - cameraX, p.y, p.w, p.h);
  ctx.fillStyle = '#9c6644';
  ctx.fillRect(p.x - cameraX, p.y, p.w, 7);
}

function drawPlayer(cameraX) {
  const x = player.x - cameraX;
  const blink = player.invincibleFrames > 0 && Math.floor(player.invincibleFrames / 6) % 2 === 0;
  if (blink) return;

  ctx.fillStyle = '#e76f51';
  ctx.fillRect(x + 5, player.y, player.w - 10, 10);
  ctx.fillStyle = '#264653';
  ctx.fillRect(x, player.y + 10, player.w, player.h - 10);
  ctx.fillStyle = '#f4a261';
  ctx.fillRect(x + (player.facing === 1 ? player.w - 10 : 2), player.y + 16, 8, 8);
}

function drawCoin(coin, cameraX, time) {
  if (coin.taken) return;
  const bob = Math.sin((time / 170) + coin.x) * 3;
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(coin.x - cameraX, coin.y + bob, coin.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fca311';
  ctx.stroke();
}

function drawEnemy(enemy, cameraX) {
  if (!enemy.alive) return;
  ctx.fillStyle = '#6a040f';
  ctx.fillRect(enemy.x - cameraX, enemy.y, enemy.w, enemy.h);
  ctx.fillStyle = '#fff';
  ctx.fillRect(enemy.x - cameraX + 6, enemy.y + 8, 6, 6);
  ctx.fillRect(enemy.x - cameraX + 20, enemy.y + 8, 6, 6);
}

function drawFlag(cameraX) {
  ctx.fillStyle = '#ced4da';
  ctx.fillRect(flag.x - cameraX, flag.y, flag.w, flag.h);
  ctx.fillStyle = game.victory ? '#06d6a0' : '#ef476f';
  ctx.fillRect(flag.x - cameraX + flag.w, flag.y + 12, 34, 22);
}

function drawBackground(cameraX) {
  ctx.fillStyle = '#7dc8ff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#95d5b2';
  for (let i = 0; i < 10; i += 1) {
    const baseX = ((i * 430) - cameraX * 0.25) % (canvas.width + 300);
    const x = baseX < -120 ? baseX + canvas.width + 300 : baseX;
    ctx.beginPath();
    ctx.moveTo(x, 420);
    ctx.lineTo(x + 90, 270);
    ctx.lineTo(x + 180, 420);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#7c4e2f';
  ctx.fillRect(0, 500, canvas.width, 40);
}

function drawOverlay() {
  if (!game.started || (!game.gameOver && !game.victory)) return;

  ctx.fillStyle = 'rgb(0 0 0 / 70%)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 48px Segoe UI';
  ctx.fillText(game.victory ? 'Level Cleared!' : 'Game Over', canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = '24px Segoe UI';
  ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 28);
}

function render(time) {
  const cameraX = Math.min(Math.max(player.x - canvas.width * 0.35, 0), WORLD_WIDTH - canvas.width);

  drawBackground(cameraX);
  platforms.forEach((p) => drawPlatform(p, cameraX));
  coins.forEach((coin) => drawCoin(coin, cameraX, time));
  enemies.forEach((enemy) => drawEnemy(enemy, cameraX));
  drawFlag(cameraX);
  drawPlayer(cameraX);
  drawOverlay();
}

function gameLoop(time) {
  if (game.started && !game.gameOver && !game.victory) {
    updatePlayer();
    updateCoins();
    updateEnemies();
    updateFlag();
  }

  render(time);
  requestAnimationFrame(gameLoop);
}

function startGame() {
  game.started = true;
  menuEl.hidden = true;
  resetLevel(true);
}

function bindEvents() {
  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();

    if (!game.started && key === 'enter') {
      startGame();
      return;
    }

    if (key === 'arrowleft' || key === 'a') keys.left = true;
    if (key === 'arrowright' || key === 'd') keys.right = true;
    if (key === 'arrowup' || key === 'w' || key === ' ') {
      if (!keys.jump && player.grounded) {
        player.vy = -player.jumpForce;
        player.grounded = false;
      }
      keys.jump = true;
    }

    if (key === 'r' && (game.gameOver || game.victory)) {
      resetLevel(true);
    }
  });

  window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') keys.left = false;
    if (key === 'arrowright' || key === 'd') keys.right = false;
    if (key === 'arrowup' || key === 'w' || key === ' ') keys.jump = false;
  });
}

startBtn.addEventListener('click', startGame);
bindEvents();
updateHud();
requestAnimationFrame(gameLoop);
