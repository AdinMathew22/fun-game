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
    this.originalHeight = 50; // Store original height
    this.crouchHeight = 30;   // Height when crouching
    this.dy = 0;
    this.speed = 5;
    this.jumpStrength = 10;
    this.canAirJump = true;
    this.onGround = false;
    this.controls = controls;
    this.invertColors = invertColors;
    this.blockedLeft = false;
    this.blockedRight = false;
    this.blockedTop = false;
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
  }

  update() {
    if (!this.blockedTop) {
      this.dy += 0.5; // Gravity
    }
    this.y += this.dy;

    if (this.y + this.height >= canvas.height - 50) {
      this.y = canvas.height - this.height - 50;
      this.dy = 0;
      this.canAirJump = true;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // Screen wrapping (left and right)
    if (this.x + this.width < 0) this.x = canvas.width;
    if (this.x > canvas.width) this.x = -this.width;

    this.draw();
  }

  move(keys) {
    if (keys[this.controls.left] && !this.blockedLeft) {
      this.x -= this.speed;
    }
    if (keys[this.controls.right] && !this.blockedRight) {
      this.x += this.speed;
    }
    if (keys[this.controls.jump]) {
      if (this.onGround) {
        this.dy = -this.jumpStrength;
      } else if (this.canAirJump) {
        this.dy = -this.jumpStrength;
        this.canAirJump = false;
      }
    }
    if (keys[this.controls.crouch]) {
      this.height = this.crouchHeight; // Shrink height when crouching
    } else {
      this.height = this.originalHeight; // Restore height when not crouching
    }
  }

  getHitbox() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
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

// Event listeners for key presses
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Function to detect and resolve collisions between two players
function handleCollision(playerA, playerB) {
  const hitboxA = playerA.getHitbox();
  const hitboxB = playerB.getHitbox();

  const isColliding =
    hitboxA.x < hitboxB.x + hitboxB.width &&
    hitboxA.x + hitboxA.width > hitboxB.x &&
    hitboxA.y < hitboxB.y + hitboxB.height &&
    hitboxA.y + hitboxA.height > hitboxB.y;

  if (isColliding) {
    const overlapX = Math.min(hitboxA.x + hitboxA.width - hitboxB.x, hitboxB.x + hitboxB.width - hitboxA.x);
    const overlapY = Math.min(hitboxA.y + hitboxA.height - hitboxB.y, hitboxB.y + hitboxB.height - hitboxA.y);

    if (overlapX < overlapY) {
      // Horizontal collision resolution
      if (hitboxA.x < hitboxB.x) {
        playerA.blockedRight = true;
      } else {
        playerA.blockedLeft = true;
      }
    } else {
      // Vertical collision resolution (stacking)
      if (hitboxA.y < hitboxB.y) {
        // Player A lands on Player B
        playerA.y = hitboxB.y - playerA.height;
        playerA.dy = 0; // Stop falling
        playerA.onGround = true;
      } else {
        // Player A hits the bottom of Player B
        playerA.blockedTop = true;
      }
    }
  } else {
    // Reset movement restrictions if no collision
    playerA.blockedLeft = false;
    playerA.blockedRight = false;
    playerA.blockedTop = false;
  }
}

// Game loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  floor.draw();

  player1.update();
  player1.move(keys);

  player2.update();
  player2.move(keys);

  // Handle collisions between players
  handleCollision(player1, player2);
  handleCollision(player2, player1);

  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
