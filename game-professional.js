// Game Configuration
const GRID_SIZE = 20;
const DIFFICULTIES = {
    easy: { speed: 200, speedIncrement: 3, levelThreshold: 5 },
    medium: { speed: 150, speedIncrement: 5, levelThreshold: 3 },
    hard: { speed: 100, speedIncrement: 7, levelThreshold: 2 }
};

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
let level = 1;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop = null;
let gameSpeed = 150;
let isGameRunning = false;
let isPaused = false;
let isSoundEnabled = true;
let currentDifficulty = 'easy';

// DOM Elements
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const finalLevelElement = document.getElementById('finalLevel');
const newHighScoreElement = document.getElementById('newHighScore');
const gameOverScreen = document.getElementById('gameOver');
const startScreen = document.getElementById('startScreen');
const pauseScreen = document.getElementById('pauseScreen');
const loadingScreen = document.getElementById('loadingScreen');
const restartBtn = document.getElementById('restartBtn');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const quitBtn = document.getElementById('quitBtn');
const menuBtn = document.getElementById('menuBtn');
const menuBtnGameOver = document.getElementById('menuBtnGameOver');
const soundBtn = document.getElementById('soundBtn');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');

// Initialize
highScoreElement.textContent = highScore;

// Hide loading screen after page load
window.addEventListener('load', () => {
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 2000);
});

// Sound Effects (Simple beep sounds using Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration) {
    if (!isSoundEnabled) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playEatSound() {
    playSound(800, 0.1);
}

function playGameOverSound() {
    playSound(200, 0.3);
    setTimeout(() => playSound(150, 0.3), 100);
}

function playLevelUpSound() {
    playSound(600, 0.1);
    setTimeout(() => playSound(800, 0.1), 100);
    setTimeout(() => playSound(1000, 0.2), 200);
}

// Difficulty Selection
difficultyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        difficultyButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDifficulty = btn.dataset.difficulty;
    });
});

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

// Draw functions with enhanced graphics
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
            // Snake head
            gradient.addColorStop(0, '#00ff41');
            gradient.addColorStop(1, '#00cc33');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                segment.x * CELL_SIZE + 1, 
                segment.y * CELL_SIZE + 1, 
                CELL_SIZE - 2, 
                CELL_SIZE - 2
            );
            
            // Draw eyes
            ctx.fillStyle = '#000000';
            const eyeSize = CELL_SIZE / 6;
            const eyeOffset = CELL_SIZE / 3;
            
            if (direction.x === 1) { // Right
                ctx.fillRect(segment.x * CELL_SIZE + eyeOffset * 2, segment.y * CELL_SIZE + eyeOffset - 2, eyeSize, eyeSize);
                ctx.fillRect(segment.x * CELL_SIZE + eyeOffset * 2, segment.y * CELL_SIZE + eyeOffset * 2, eyeSize, eyeSize);
            } else if (direction.x === -1) { // Left
                ctx.fillRect(segment.x * CELL_SIZE + eyeOffset - 2, segment.y * CELL_SIZE + eyeOffset - 2, eyeSize, eyeSize);
                ctx.fillRect(segment.x * CELL_SIZE + eyeOffset - 2, segment.y * CELL_SIZE + eyeOffset * 2, eyeSize, eyeSize);
            } else if (direction.y === -1) { // Up
                ctx.fillRect(segment.x * CELL_SIZE + eyeOffset - 2, segment.y * CELL_SIZE + eyeOffset - 2, eyeSize, eyeSize);
                ctx.fillRect(segment.x * CELL_SIZE + eyeOffset * 2, segment.y * CELL_SIZE + eyeOffset - 2, eyeSize, eyeSize);
            } else { // Down
                ctx.fillRect(segment.x * CELL_SIZE + eyeOffset - 2, segment.y * CELL_SIZE + eyeOffset * 2, eyeSize, eyeSize);
                ctx.fillRect(segment.x * CELL_SIZE + eyeOffset * 2, segment.y * CELL_SIZE + eyeOffset * 2, eyeSize, eyeSize);
            }
        } else {
            // Snake body
            gradient.addColorStop(0, '#00aa33');
            gradient.addColorStop(1, '#008822');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                segment.x * CELL_SIZE + 1, 
                segment.y * CELL_SIZE + 1, 
                CELL_SIZE - 2, 
                CELL_SIZE - 2
            );
        }
    });
}

function drawFood() {
    // Draw food as a glowing apple
    const gradient = ctx.createRadialGradient(
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        2,
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2
    );
    gradient.addColorStop(0, '#ff6666');
    gradient.addColorStop(0.5, '#ff3333');
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
    
    // Add glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff3333';
    ctx.fill();
    ctx.shadowBlur = 0;
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

// Calculate level
function updateLevel() {
    const threshold = DIFFICULTIES[currentDifficulty].levelThreshold;
    const newLevel = Math.floor(score / threshold) + 1;
    
    if (newLevel > level) {
        level = newLevel;
        levelElement.textContent = level;
        playLevelUpSound();
        
        // Increase speed
        const increment = DIFFICULTIES[currentDifficulty].speedIncrement;
        gameSpeed = Math.max(50, gameSpeed - increment);
        clearInterval(gameLoop);
        gameLoop = setInterval(update, gameSpeed);
    }
}

// Game Logic
function update() {
    if (!isGameRunning || isPaused) return;
    
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
        playEatSound();
        generateFood();
        updateLevel();
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
    level = 1;
    gameSpeed = DIFFICULTIES[currentDifficulty].speed;
    isGameRunning = true;
    isPaused = false;
    
    scoreElement.textContent = score;
    levelElement.textContent = level;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    
    // Update pause button
    document.querySelector('.pause-icon').classList.remove('hidden');
    document.querySelector('.play-icon').classList.add('hidden');
    
    generateFood();
    draw();
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, gameSpeed);
}

function pauseGame() {
    if (!isGameRunning) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        pauseScreen.classList.remove('hidden');
        document.querySelector('.pause-icon').classList.add('hidden');
        document.querySelector('.play-icon').classList.remove('hidden');
    } else {
        pauseScreen.classList.add('hidden');
        document.querySelector('.pause-icon').classList.remove('hidden');
        document.querySelector('.play-icon').classList.add('hidden');
    }
}

function quitToMenu() {
    isGameRunning = false;
    isPaused = false;
    clearInterval(gameLoop);
    
    pauseScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
}

function gameOver() {
    isGameRunning = false;
    clearInterval(gameLoop);
    playGameOverSound();
    
    // Update high score
    const isNewHighScore = score > highScore;
    if (isNewHighScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
        newHighScoreElement.classList.remove('hidden');
    } else {
        newHighScoreElement.classList.add('hidden');
    }
    
    finalScoreElement.textContent = score;
    finalLevelElement.textContent = level;
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
    if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (isGameRunning) {
            pauseGame();
        }
        return;
    }
    
    if (!isGameRunning || isPaused) return;
    
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
        if (!isGameRunning || isPaused) return;
        
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
    if (!isGameRunning || isPaused) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
        return;
    }
    
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
pauseBtn.addEventListener('click', pauseGame);
resumeBtn.addEventListener('click', pauseGame);
quitBtn.addEventListener('click', quitToMenu);
menuBtn.addEventListener('click', quitToMenu);
menuBtnGameOver.addEventListener('click', quitToMenu);

// Sound toggle
soundBtn.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    
    if (isSoundEnabled) {
        document.querySelector('.sound-on').classList.remove('hidden');
        document.querySelector('.sound-off').classList.add('hidden');
    } else {
        document.querySelector('.sound-on').classList.add('hidden');
        document.querySelector('.sound-off').classList.remove('hidden');
    }
});

// Initial draw
draw();
