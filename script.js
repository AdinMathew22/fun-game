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
    this.jumpsUsed = 0; // Track jumps used
    this.maxJumps = 2; // Allow 2 jumps
    this.isOnGround = false; // Track if on the ground
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
    this.dy += 0.5; // Gravity
    this.y += this.dy;

    // Stop at floor
    if (this.y + this.height >= canvas.height - 50) {
      this.y = canvas.height - this.height - 50;
      this.dy = 0;
      this.isOnGround = true; // Player is on the ground
      this.jumpsUsed = 0; // Reset jumps when on ground
    } else {
      this.isOnGround = false; // Player is in the air
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
      this.jump(); // Call jump only on new key press
    }

    if (keys[this.controls.crouch]) {
      this.height = this.crouchHeight; // Shrink when crouching
    } else {
      this.height = this.originalHeight; // Reset height when not crouching
    }
  }

  jump() {
    // Allow jump if on ground or one air jump in the air
    if (this.jumpsUsed < this.maxJumps) {
      this.dy = -this.jumpStrength; // Apply upward force
      this.jumpsUsed++; // Increment the jump counter
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
const keysPressed = {};

// Event listeners for key presses
window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  keysPressed[e.key] = true; // Track new key presses
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
  keysPressed[e.key] = false; // Reset key press
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
    const overlapX = Math.min(hitboxA.x + hitboxA.width - hitboxB.x, hitboxB.x + hitboxB.width - hitboxA.x);
    const overlapY = Math.min(hitboxA.y + hitboxA.height - hitboxB.y, hitboxB.y + hitboxB.height - hitboxA.y);

    if (overlapX < overlapY) {
      // Horizontal collision
      if (hitboxA.x < hitboxB.x) {
        playerA.blockedRight = true;
      } else {
        playerA.blockedLeft = true;
      }
    } else {
      // Vertical collision (stacking)
      if (hitboxA.y < hitboxB.y) {
        playerA.y = hitboxB.y - playerA.height;
        playerA.dy = 0; // Stop falling
        playerA.jumpsUsed = 0; // Reset jumps when landing on another player
      } else {
        playerA.blockedTop = true;
      }
    }
  } else {
    // Reset movement restrictions when no collision
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
  player1.move(keys, keysPressed);

  player2.update();
  player2.move(keys, keysPressed);

  // Handle collisions between players
  handleCollision(player1, player2);
  handleCollision(player2, player1);

  // Reset keysPressed after each frame
  for (let key in keysPressed) {
    keysPressed[key] = false;
  }

  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
