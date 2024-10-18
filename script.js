const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas size
canvas.width = 800;
canvas.height = 400;

// Load images
const characterImage = new Image();
characterImage.src = 'character.png';

const floorImage = new Image();
floorImage.src = 'floor.png';

// Player class
class Player {
  constructor(x, y, controls, invertColors = false) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 50;
    this.originalHeight = 50;
    this.crouchHeight = 30;
    this.dy = 0;
    this.speed = 5;
    this.jumpStrength = 10;
    this.jumpsUsed = 0;
    this.maxJumps = 2;
    this.isOnGround = false;
    this.controls = controls;
    this.invertColors = invertColors;
    this.blockedLeft = false;
    this.blockedRight = false;
    this.blockedTop = false;

    // Health properties (10 hearts, each heart is worth 2 points)
    this.maxHealth = 20; // Total health points (10 hearts * 2)
    this.health = 20; // Start with full health
  }

  draw() {
    if (this.invertColors) {
      ctx.save();
      ctx.filter = 'invert(100%)';
      ctx.drawImage(characterImage, this.x, this.y, this.width, this.height);
      ctx.restore();
    } else {
      ctx.drawImage(characterImage, this.x, this.y, this.width, this.height);
    }

    this.drawHealthBar(); // Draw the health bar above the player
  }

  drawHealthBar() {
    const barWidth = 50;
    const barHeight = 5;
    const barX = this.x + (this.width - barWidth) / 2; // Center above the player
    const barY = this.y - 15; // Slightly above the player

    // Calculate health percentage
    const healthPercent = this.health / this.maxHealth;

    // Interpolate between green (healthy) and red (low health)
    const red = Math.floor((1 - healthPercent) * 255);
    const green = Math.floor(healthPercent * 255);
    ctx.fillStyle = `rgb(${red}, ${green}, 0)`;

    // Draw health bar
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Draw hearts below the health bar
    this.drawHearts(barX, barY - 15);
  }

  drawHearts(x, y) {
    const heartWidth = 10;
    const heartSpacing = 5; // Spacing between hearts

    for (let i = 0; i < 10; i++) {
      const isFullHeart = this.health >= (i + 1) * 2;
      const isHalfHeart = this.health >= (i * 2) + 1 && this.health < (i + 1) * 2;

      if (isFullHeart) {
        ctx.fillStyle = 'red'; // Full heart
      } else if (isHalfHeart) {
        ctx.fillStyle = 'pink'; // Half heart
      } else {
        ctx.fillStyle = 'gray'; // Empty heart
      }

      ctx.fillRect(x + i * (heartWidth + heartSpacing), y, heartWidth, heartWidth);
    }
  }

  update() {
    this.dy += 0.5; // Gravity
    this.y += this.dy;

    // Stop at floor
    if (this.y + this.height >= canvas.height - 50) {
      this.y = canvas.height - this.height - 50;
      this.dy = 0;
      this.isOnGround = true;
      this.jumpsUsed = 0;
    } else {
      this.isOnGround = false;
    }

    // Screen wrapping
    if (this.x + this.width < 0) this.x = canvas.width;
    if (this.x > canvas.width) this.x = -this.width;

    this.draw();
  }

  move(keys, keysPressed) {
    if (keys[this.controls.left] && !this.blockedLeft) {
      this.x -= this.speed;
    }
    if (keys[this.controls.right] && !this.blockedRight) {
      this.x += this.speed;
    }

    if (keysPressed[this.controls.jump]) {
      this.jump();
    }

    if (keys[this.controls.crouch]) {
      this.height = this.crouchHeight;
    } else {
      this.height = this.originalHeight;
    }
  }

  jump() {
    if (this.jumpsUsed < this.maxJumps) {
      this.dy = -this.jumpStrength;
      this.jumpsUsed++;
    }
  }

  getHitbox() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount); // Decrease health, but don't go below 0
  }
}

// Floor class
class Floor {
  constructor() {
    this.x = 0;
    this.y = canvas.height - 50;
    this.width = canvas.width;
    this.height = 50;
  }

  draw() {
    ctx.drawImage(floorImage, this.x, this.y, this.width, this.height);
  }
}

// Create players and floor
const player1 = new Player(100, 300, { left: 'a', right: 'd', jump: 'w', crouch: 's' });
const player2 = new Player(600, 300, { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', crouch: 'ArrowDown' }, true);
const floor = new Floor();

const keys = {};
const keysPressed = {};

// Event listeners for key presses
window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  keysPressed[e.key] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
  keysPressed[e.key] = false;
});

// Function to handle collisions between players
function handleCollision(playerA, playerB) {
  const hitboxA = playerA.getHitbox();
  const hitboxB = playerB.getHitbox();

  const isColliding =
    hitboxA.x < hitboxB.x + hitboxB.width &&
    hitboxA.x + hitboxA.width > hitboxB.x &&
    hitboxA.y < hitboxB.y + hitboxB.height &&
    hitboxA.y + hitboxA.height > hitboxB.y;

  if (isColliding) {
    playerA.takeDamage(1); // Each collision decreases health by 1 point
    playerB.takeDamage(1);
  }
}

// Game loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  floor.draw();

  player1.update();
  player1.move(keys, keysPressed);

  player2.update();
  player2.move(keys, keysPressed);

  handleCollision(player1, player2);
  handleCollision(player2, player1);

  for (let key in keysPressed) {
    keysPressed[key] = false;
  }

  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
