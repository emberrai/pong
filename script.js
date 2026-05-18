// Game Canvas and Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Objects
const game = {
    width: canvas.width,
    height: canvas.height,
    isRunning: false,
    isPaused: false,
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 6,
    dx: 5,
    dy: 5,
    speed: 5,
    maxSpeed: 8,
};

const paddle = {
    width: 12,
    height: 80,
    speed: 6,
};

const player = {
    x: 20,
    y: game.height / 2 - paddle.height / 2,
    width: paddle.width,
    height: paddle.height,
    dy: 0,
    score: 0,
};

const computer = {
    x: game.width - paddle.width - 20,
    y: game.height / 2 - paddle.height / 2,
    width: paddle.width,
    height: paddle.height,
    dy: 0,
    score: 0,
    difficulty: 0.08, // AI difficulty factor
};

// Input handling
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    MouseY: null,
};

// Event Listeners
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
canvas.addEventListener('mousemove', handleMouseMove);

function handleKeyDown(e) {
    if (e.key === 'ArrowUp') keys.ArrowUp = true;
    if (e.key === 'ArrowDown') keys.ArrowDown = true;
    
    if (e.code === 'Space') {
        e.preventDefault();
        toggleGame();
    }
    
    if (e.key.toUpperCase() === 'R') {
        resetScores();
    }
}

function handleKeyUp(e) {
    if (e.key === 'ArrowUp') keys.ArrowUp = false;
    if (e.key === 'ArrowDown') keys.ArrowDown = false;
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    keys.MouseY = e.clientY - rect.top;
}

function toggleGame() {
    if (!game.isRunning) {
        game.isRunning = true;
        game.isPaused = false;
        updateStatus('Game Running');
        gameLoop();
    } else {
        game.isPaused = !game.isPaused;
        updateStatus(game.isPaused ? 'PAUSED - Press SPACE to resume' : 'Game Running');
        if (!game.isPaused) {
            gameLoop();
        }
    }
}

function resetScores() {
    player.score = 0;
    computer.score = 0;
    game.isRunning = false;
    game.isPaused = false;
    resetBall();
    resetPaddles();
    updateScoreboard();
    updateStatus('Press SPACE to start');
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.dy = (Math.random() - 0.5) * ball.speed;
}

function resetPaddles() {
    player.y = game.height / 2 - paddle.height / 2;
    computer.y = game.height / 2 - paddle.height / 2;
}

function updateStatus(message) {
    document.getElementById('gameStatus').textContent = message;
}

function updateScoreboard() {
    document.getElementById('playerScore').textContent = player.score;
    document.getElementById('computerScore').textContent = computer.score;
}

// Game Logic
function gameLoop() {
    if (game.isPaused) return;

    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Update player paddle position
    if (keys.MouseY !== null) {
        // Use mouse control
        player.y = Math.max(0, Math.min(keys.MouseY - paddle.height / 2, game.height - paddle.height));
    } else {
        // Use keyboard control
        if (keys.ArrowUp && player.y > 0) {
            player.y -= paddle.speed;
        }
        if (keys.ArrowDown && player.y < game.height - paddle.height) {
            player.y += paddle.speed;
        }
    }

    // Update computer paddle (AI)
    computerAI();

    // Update ball position
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top and bottom walls
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > game.height) {
        ball.dy = -ball.dy;
        ball.y = Math.max(ball.radius, Math.min(ball.y, game.height - ball.radius));
    }

    // Ball collision with paddles
    checkPaddleCollision(player);
    checkPaddleCollision(computer);

    // Ball out of bounds (scoring)
    if (ball.x - ball.radius < 0) {
        computer.score++;
        updateScoreboard();
        resetBall();
    } else if (ball.x + ball.radius > game.width) {
        player.score++;
        updateScoreboard();
        resetBall();
    }
}

function computerAI() {
    const paddleCenter = computer.y + paddle.height / 2;
    const ballCenter = ball.y;
    const difference = ballCenter - paddleCenter;

    // AI only reacts if ball is coming towards it
    if (ball.dx > 0) {
        if (difference > paddle.speed * computer.difficulty) {
            if (computer.y < game.height - paddle.height) {
                computer.y += paddle.speed * computer.difficulty;
            }
        } else if (difference < -paddle.speed * computer.difficulty) {
            if (computer.y > 0) {
                computer.y -= paddle.speed * computer.difficulty;
            }
        }
    }
}

function checkPaddleCollision(paddle) {
    // Check if ball collides with paddle
    if (
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.x + ball.radius > paddle.x &&
        ball.y - ball.radius < paddle.y + paddle.height &&
        ball.y + ball.radius > paddle.y
    ) {
        // Collision detected
        ball.dx = -ball.dx;

        // Add spin based on where ball hits the paddle
        const collisionPoint = ball.y - (paddle.y + paddle.height / 2);
        const collisionRatio = collisionPoint / (paddle.height / 2);
        ball.dy += collisionRatio * ball.speed;

        // Clamp ball speed
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        if (speed > ball.maxSpeed) {
            ball.dx = (ball.dx / speed) * ball.maxSpeed;
            ball.dy = (ball.dy / speed) * ball.maxSpeed;
        }

        // Prevent ball from getting stuck in paddle
        ball.x = paddle.x + (paddle.x < game.width / 2 ? paddle.width : -ball.radius);
    }
}

// Drawing Functions
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, game.width, game.height);

    // Draw center line
    ctx.strokeStyle = '#00ff00';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(game.width / 2, 0);
    ctx.lineTo(game.width / 2, game.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    drawPaddle(player);
    drawPaddle(computer);

    // Draw ball
    drawBall();
}

function drawPaddle(paddle) {
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = 'rgba(0, 255, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 0;
}

function drawBall() {
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = 'rgba(0, 255, 0, 0.8)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

// Initialize the game
updateScoreboard();
updateStatus('Press SPACE to start');