// Game Configuration
const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 5;

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
const setCanvasSize = () => {
    const size = Math.min(window.innerWidth - 40, 600);
    canvas.width = size;
    canvas.height = size;
};
setCanvasSize();
window.addEventListener('resize', setCanvasSize);

const CELL_SIZE = canvas.width / GRID_SIZE;

// Game State
let snake = [{ x: 10, y: 10 }];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 15, y: 15 };
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop = null;
let gameSpeed = INITIAL_SPEED;
let isGameRunning = false;

// DOM Elements
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const gameOverScreen = document.getElementById('gameOver');
const startScreen = document.getElementById('startScreen');
const restartBtn = document.getElementById('restartBtn');
const startBtn = document.getElementById('startBtn');

// Initialize
highScoreElement.textContent = highScore;

// Generate random food position
function generateFood() {
    food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
    };
    
    // Make sure food doesn't spawn on snake
    const onSnake = snake.some(segment => segment.x === food.x && segment.y === food.y);
    if (onSnake) {
        generateFood();
    }
}

// Draw functions
function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 2, CELL_SIZE - 2);
}

function drawSnake() {
    snake.forEach((segment, index) => {
        const gradient = ctx.createLinearGradient(
            segment.x * CELL_SIZE, 
            segment.y * CELL_SIZE,
            (segment.x + 1) * CELL_SIZE,
            (segment.y + 1) * CELL_SIZE
        );
        
        if (index === 0) {
            gradient.addColorStop(0, '#00ff00');
            gradient.addColorStop(1, '#00cc00');
        } else {
            gradient.addColorStop(0, '#00aa00');
            gradient.addColorStop(1, '#008800');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            segment.x * CELL_SIZE + 1, 
            segment.y * CELL_SIZE + 1, 
            CELL_SIZE - 2, 
            CELL_SIZE - 2
        );
    });
}

function drawFood() {
    const gradient = ctx.createRadialGradient(
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        2,
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2
    );
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(1, '#cc0000');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }
    
    drawFood();
    drawSnake();
}

// Game Logic
function update() {
    if (!isGameRunning) return;
    
    // Update direction
    direction = nextDirection;
    
    // Calculate new head position
    const head = { 
        x: snake[0].x + direction.x, 
        y: snake[0].y + direction.y 
    };
    
    // Check wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        gameOver();
        return;
    }
    
    // Check self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreElement.textContent = score;
        generateFood();
        
        // Increase speed slightly
        if (score % 5 === 0) {
            gameSpeed = Math.max(50, gameSpeed - SPEED_INCREMENT);
            clearInterval(gameLoop);
            gameLoop = setInterval(update, gameSpeed);
        }
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }
    
    draw();
}

function startGame() {
    // Reset game state
    snake = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    gameSpeed = INITIAL_SPEED;
    isGameRunning = true;
    
    scoreElement.textContent = score;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    generateFood();
    draw();
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, gameSpeed);
}

function gameOver() {
    isGameRunning = false;
    clearInterval(gameLoop);
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
    }
    
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Controls
function changeDirection(newDirection) {
    // Prevent reversing
    if (newDirection.x === -direction.x && newDirection.y === -direction.y) {
        return;
    }
    nextDirection = newDirection;
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (!isGameRunning) return;
    
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            e.preventDefault();
            changeDirection({ x: 0, y: -1 });
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            e.preventDefault();
            changeDirection({ x: 0, y: 1 });
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            e.preventDefault();
            changeDirection({ x: -1, y: 0 });
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            e.preventDefault();
            changeDirection({ x: 1, y: 0 });
            break;
    }
});

// Touch controls
document.querySelectorAll('.control-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!isGameRunning) return;
        
        const dir = btn.dataset.direction;
        switch(dir) {
            case 'up':
                changeDirection({ x: 0, y: -1 });
                break;
            case 'down':
                changeDirection({ x: 0, y: 1 });
                break;
            case 'left':
                changeDirection({ x: -1, y: 0 });
                break;
            case 'right':
                changeDirection({ x: 1, y: 0 });
                break;
        }
    });
});

// Swipe controls for mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', (e) => {
    if (!isGameRunning) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
            changeDirection({ x: 1, y: 0 });
        } else {
            changeDirection({ x: -1, y: 0 });
        }
    } else {
        // Vertical swipe
        if (deltaY > 0) {
            changeDirection({ x: 0, y: 1 });
        } else {
            changeDirection({ x: 0, y: -1 });
        }
    }
});

// Button events
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Initial draw
draw();
