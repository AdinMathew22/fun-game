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

const projectileImage = new Image();
projectileImage.src = 'OBL.png';

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
    this.projectiles = [];
    this.blockedLeft = false;
    this.blockedRight = false;
    this.blockedTop = false;

    // Health properties (10 hearts, each heart is worth 2 points)
    this.maxHealth = 20;
    this.health = 20;
    this.alive = true;
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

    // Draw hearts below the player
    this.drawHearts(this.x, this.y - 15);
  }

  drawHearts(x, y) {
    const totalHearts = 10;
    const heartSpacing = 2;
    const heartWidth = (this.width - heartSpacing * (totalHearts - 1)) / totalHearts;
    const heartHeight = heartWidth;

    for (let i = 0; i < totalHearts; i++) {
      const isFullHeart = this.health >= (i + 1) * 2;
      const isHalfHeart = this.health >= (i * 2) + 1 && this.health < (i + 1) * 2;

      if (isFullHeart) {
        ctx.fillStyle = 'red';
      } else if (isHalfHeart) {
        ctx.fillStyle = 'pink';
      } else {
        ctx.fillStyle = 'gray';
      }

      ctx.fillRect(x + i * (heartWidth + heartSpacing), y, heartWidth, heartHeight);
    }
  }

  update() {
    if (!this.alive) return; // Don't update if the player is dead

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

    // Update projectiles
    this.projectiles = this.projectiles.filter((proj) => proj.update());

    this.draw();
  }

  move(keys, keysPressed) {
    if (!this.alive) return; // Don't allow movement if the player is dead

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

    // Fire projectiles
    if (keysPressed[this.controls.fire]) {
      this.fireProjectile();
    }
  }

  jump() {
    if (this.jumpsUsed < this.maxJumps) {
      this.dy = -this.jumpStrength;
      this.jumpsUsed++;
    }
  }

  fireProjectile() {
    const direction = this.controls.left === 'a' ? 1 : -1; // Determine projectile direction based on player controls
    this.projectiles.push(new Projectile(this.x + this.width / 2, this.y + this.height / 2, direction, this));
  }

  getHitbox() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) {
      this.alive = false;
    }
  }

  checkCollisionWithProjectiles(otherPlayer) {
    this.projectiles.forEach((projectile, index) => {
      if (this.isColliding(projectile, otherPlayer.getHitbox())) {
        otherPlayer.takeDamage(2); // Each hit takes away 1 heart (2 health points)
        this.projectiles.splice(index, 1); // Remove the projectile after hitting
      }
    });
  }

  isColliding(proj, hitbox) {
    return (
      proj.x < hitbox.x + hitbox.width &&
      proj.x + proj.width > hitbox.x &&
      proj.y < hitbox.y + hitbox.height &&
      proj.y + proj.height > hitbox.y
    );
  }
}

// Projectile class
class Projectile {
  constructor(x, y, direction, owner) {
    this.x = x;
    this.y = y;
    this.width = 40; // Increased width
    this.height = 20; // Increased height
    this.speed = 10; // Semi-fast speed
    this.direction = direction;
    this.owner = owner;
  }

  update() {
    this.x += this.speed * this.direction;

    // Check if the projectile is still within canvas bounds
    if (this.x + this.width < 0 || this.x > canvas.width) {
      return false; // Remove projectile
    }

    this.draw();
    return true; // Keep projectile
  }

  draw() {
    ctx.drawImage(projectileImage, this.x, this.y, this.width, this.height);
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
const player1 = new Player(100, 300, { left: 'a', right: 'd', jump: 'w', crouch: 's', fire: ' ' });
const player2 = new Player(600, 300, { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', crouch: 'ArrowDown', fire: '/' }, true);
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

// Function to display win message
function displayWinMessage(message) {
  ctx.font = '50px Arial';
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

// Game loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  floor.draw();

  if (player1.alive && player2.alive) {
    player1.update();
    player1.move(keys, keysPressed);
    player2.update();
    player2.move(keys, keysPressed);

    // Check for projectile collisions between players
    player1.checkCollisionWithProjectiles(player2);
    player2.checkCollisionWithProjectiles(player1);
  } else {
    // Display winning message
    if (!player2.alive) {
      displayWinMessage("White Wins!");
    } else if (!player1.alive) {
      displayWinMessage("Black Wins!");
    }
  }

  for (let key in keysPressed) {
    keysPressed[key] = false;
  }

  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
