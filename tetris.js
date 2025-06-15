class Tetris {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;  // 10 columns × 40px
        this.canvas.height = 800; // 20 rows × 40px
        
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 40; // Keep at 40px for proper sizing
        
        this.board = this.createBoard();
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.isPaused = false;
        
        this.dropCounter = 0;
        this.dropInterval = 1500; // Start slower for easier gameplay
        this.lastTime = 0;
        
        this.colors = [
            '#000000', // 空
            '#FF0000', // I
            '#00FF00', // O  
            '#0000FF', // T
            '#FFFF00', // S
            '#FF00FF', // Z
            '#00FFFF', // J
            '#FFA500'  // L
        ];
        
        this.pieces = [
            [], // 空
            [[[1,1,1,1]]], // I
            [[[1,1],[1,1]]], // O
            [[[0,1,0],[1,1,1]],[[1,0],[1,1],[1,0]],[[1,1,1],[0,1,0]],[[0,1],[1,1],[0,1]]], // T
            [[[0,1,1],[1,1,0]],[[1,0],[1,1],[0,1]]], // S
            [[[1,1,0],[0,1,1]],[[0,1],[1,1],[1,0]]], // Z
            [[[1,0,0],[1,1,1]],[[1,1],[1,0],[1,0]],[[1,1,1],[0,0,1]],[[0,1],[0,1],[1,1]]], // J
            [[[0,0,1],[1,1,1]],[[1,0],[1,0],[1,1]],[[1,1,1],[1,0,0]],[[1,1],[0,1],[0,1]]]  // L
        ];
        
        this.setupControls();
        this.setupAudio();
        this.createBackgroundMusic();
        this.spawnPiece();
        this.gameLoop();
    }
    
    createBoard() {
        return Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            // Prevent default behavior for game control keys to stop page scrolling
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyP', 'KeyR'].includes(e.code)) {
                e.preventDefault();
            }
            
            if (this.gameOver || this.isPaused) return;
            
            switch(e.code) {
                case 'ArrowLeft':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                case 'Space':
                    this.rotatePiece();
                    break;
            }
        });
    }
    
    setupAudio() {
        this.sounds = {
            move: document.getElementById('moveSFX'),
            rotate: document.getElementById('rotateSFX'),
            lineClear: document.getElementById('lineClearSFX'),
            drop: document.getElementById('dropSFX'),
            gameOver: document.getElementById('gameOverSFX')
        };
        
        this.isMuted = localStorage.getItem('tetrisMuted') === 'true';
        this.updateMuteButton();
        
        // Initialize Web Audio API for background music
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.3; // Background music volume
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    createBackgroundMusic() {
        if (!this.audioContext) return;
        
        // Classic Tetris-inspired melody (simplified)
        this.melody = [
            { note: 'E5', duration: 0.5 },
            { note: 'B4', duration: 0.25 },
            { note: 'C5', duration: 0.25 },
            { note: 'D5', duration: 0.5 },
            { note: 'C5', duration: 0.25 },
            { note: 'B4', duration: 0.25 },
            { note: 'A4', duration: 0.5 },
            { note: 'A4', duration: 0.25 },
            { note: 'C5', duration: 0.25 },
            { note: 'E5', duration: 0.5 },
            { note: 'D5', duration: 0.25 },
            { note: 'C5', duration: 0.25 },
            { note: 'B4', duration: 0.75 },
            { note: 'C5', duration: 0.25 },
            { note: 'D5', duration: 0.5 },
            { note: 'E5', duration: 0.5 },
            { note: 'C5', duration: 0.5 },
            { note: 'A4', duration: 0.5 },
            { note: 'A4', duration: 1 }
        ];
        
        this.noteFrequencies = {
            'A4': 440,
            'B4': 493.88,
            'C5': 523.25,
            'D5': 587.33,
            'E5': 659.25,
            'F5': 698.46,
            'G5': 783.99
        };
        
        this.currentNoteIndex = 0;
        this.musicPlaying = false;
    }
    
    create8BitOscillator(frequency, startTime, duration) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // 8-bit square wave sound
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(frequency, startTime);
        
        // Envelope for 8-bit feel
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.05, startTime + duration * 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
        
        return oscillator;
    }
    
    playBackgroundMusic() {
        if (!this.audioContext || this.isMuted || this.musicPlaying) return;
        
        this.musicPlaying = true;
        this.playMelodyLoop();
    }
    
    playMelodyLoop() {
        if (!this.musicPlaying || this.isMuted) return;
        
        const currentTime = this.audioContext.currentTime;
        let timeOffset = 0;
        
        for (let i = 0; i < this.melody.length; i++) {
            const note = this.melody[i];
            const frequency = this.noteFrequencies[note.note];
            const duration = note.duration * 0.4; // Adjust tempo
            
            this.create8BitOscillator(frequency, currentTime + timeOffset, duration);
            timeOffset += duration;
        }
        
        // Loop the melody
        setTimeout(() => {
            if (this.musicPlaying && !this.gameOver && !this.isPaused) {
                this.playMelodyLoop();
            }
        }, timeOffset * 1000);
    }
    
    stopBackgroundMusic() {
        this.musicPlaying = false;
    }
    
    playSound(soundName) {
        if (!this.isMuted && this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(() => {
                // Ignore audio play errors (browser autoplay policy)
            });
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('tetrisMuted', this.isMuted.toString());
        this.updateMuteButton();
        
        if (this.isMuted) {
            this.stopBackgroundMusic();
        } else if (!this.gameOver && !this.isPaused) {
            this.playBackgroundMusic();
        }
    }
    
    updateMuteButton() {
        const muteButton = document.getElementById('muteButton');
        if (muteButton) {
            muteButton.textContent = this.isMuted ? '🔇' : '🔊';
            muteButton.title = this.isMuted ? 'Enable Sound' : 'Disable Sound';
        }
    }
    
    spawnPiece() {
        const pieceType = Math.floor(Math.random() * 7) + 1;
        this.currentPiece = {
            type: pieceType,
            shape: this.pieces[pieceType][0],
            x: Math.floor(this.BOARD_WIDTH / 2) - 1,
            y: 0,
            rotation: 0
        };
        
        if (this.collision()) {
            this.gameOver = true;
            this.playSound('gameOver');
            this.stopBackgroundMusic();
        }
    }
    
    movePiece(dx, dy) {
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        
        if (this.collision()) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;
            
            if (dy > 0) {
                this.playSound('drop');
                this.placePiece();
                this.clearLines();
                this.spawnPiece();
            }
        } else if (dx !== 0) {
            this.playSound('move');
        }
    }
    
    rotatePiece() {
        const nextRotation = (this.currentPiece.rotation + 1) % this.pieces[this.currentPiece.type].length;
        const originalRotation = this.currentPiece.rotation;
        const originalShape = this.currentPiece.shape;
        
        this.currentPiece.rotation = nextRotation;
        this.currentPiece.shape = this.pieces[this.currentPiece.type][nextRotation];
        
        if (this.collision()) {
            this.currentPiece.rotation = originalRotation;
            this.currentPiece.shape = originalShape;
        } else {
            this.playSound('rotate');
        }
    }
    
    collision() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const newX = this.currentPiece.x + x;
                    const newY = this.currentPiece.y + y;
                    
                    if (newX < 0 || newX >= this.BOARD_WIDTH || 
                        newY >= this.BOARD_HEIGHT || 
                        (newY >= 0 && this.board[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    placePiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.type;
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // 检查同一行，因为上面的行下移了
            }
        }
        
        if (linesCleared > 0) {
            this.playSound('lineClear');
            this.lines += linesCleared;
            
            // New scoring system based on lines cleared simultaneously
            let baseScore = 0;
            switch (linesCleared) {
                case 1:
                    baseScore = 100;  // Single line
                    break;
                case 2:
                    baseScore = 300;  // Double lines
                    break;
                case 3:
                    baseScore = 500;  // Triple lines
                    break;
                case 4:
                    baseScore = 1000; // Tetris (4 lines)
                    break;
                default:
                    baseScore = 100 * linesCleared; // Fallback for more than 4 lines
            }
            
            this.score += baseScore * this.level; // Multiply by level for progressive difficulty
            this.level = Math.floor(this.lines / 10) + 1;
            
            // New difficulty progression system
            if (this.level <= 2) {
                // Levels 1-2: Very easy (1500ms to 1200ms)
                this.dropInterval = Math.max(1200, 1500 - (this.level - 1) * 150);
            } else if (this.level <= 4) {
                // Levels 3-4: Moderate difficulty (1000ms to 700ms)
                this.dropInterval = Math.max(700, 1150 - (this.level - 2) * 225);
            } else if (this.level <= 6) {
                // Levels 5-6: Hard difficulty (600ms to 400ms)
                this.dropInterval = Math.max(400, 750 - (this.level - 4) * 175);
            } else {
                // Levels 7+: Very hard (progressively faster)
                this.dropInterval = Math.max(100, 450 - (this.level - 6) * 25);
            }
            
            this.updateScore();
        }
    }
    
    draw() {
        // 清除画布
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制已放置的方块
        this.drawBoard();
        
        // 绘制当前方块
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece);
        }
        
        // 绘制游戏结束画面
        if (this.gameOver) {
            this.drawGameOver();
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.BOARD_HEIGHT * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(this.BOARD_WIDTH * this.BLOCK_SIZE, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    drawBoard() {
        for (let y = 0; y < this.BOARD_HEIGHT; y++) {
            for (let x = 0; x < this.BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.colors[this.board[y][x]]);
                }
            }
        }
    }
    
    drawPiece(piece) {
        this.ctx.fillStyle = this.colors[piece.type];
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    this.drawBlock(piece.x + x, piece.y + y, this.colors[piece.type]);
                }
            }
        }
    }
    
    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * this.BLOCK_SIZE + 1, y * this.BLOCK_SIZE + 1, 
                         this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
        
        // 添加高光效果
        this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this.ctx.fillRect(x * this.BLOCK_SIZE + 1, y * this.BLOCK_SIZE + 1, 
                         this.BLOCK_SIZE - 2, 2);
        this.ctx.fillRect(x * this.BLOCK_SIZE + 1, y * this.BLOCK_SIZE + 1, 
                         2, this.BLOCK_SIZE - 2);
    }
    
    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Press R to Restart', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }
    
    updateScore() {
        // 更新游戏标题下方的状态栏
        const scoreDisplay = document.getElementById('score-display');
        const levelDisplay = document.getElementById('level-display');
        const linesDisplay = document.getElementById('lines-display');
        
        if (scoreDisplay) scoreDisplay.textContent = this.score.toLocaleString();
        if (levelDisplay) levelDisplay.textContent = this.level;
        if (linesDisplay) linesDisplay.textContent = this.lines;
        
        // 更新排行榜
        this.updateLeaderboard();
    }
    
    updateLeaderboard() {
        // 获取本地存储的排行榜数据
        let todayLeaderboard = JSON.parse(localStorage.getItem('tetrisTodayLeaderboard') || '[]');
        let weekLeaderboard = JSON.parse(localStorage.getItem('tetrisWeekLeaderboard') || '[]');
        
        // 获取当前日期
        const today = new Date().toDateString();
        const currentWeek = this.getWeekNumber(new Date());
        
        // 如果游戏结束且分数大于0，添加到排行榜
        if (this.gameOver && this.score > 0) {
            const entry = {
                score: this.score,
                level: this.level,
                lines: this.lines,
                date: today,
                week: currentWeek
            };
            
            // 添加到今日排行榜
            todayLeaderboard = todayLeaderboard.filter(item => item.date === today);
            todayLeaderboard.push(entry);
            todayLeaderboard.sort((a, b) => b.score - a.score);
            todayLeaderboard = todayLeaderboard.slice(0, 10);
            localStorage.setItem('tetrisTodayLeaderboard', JSON.stringify(todayLeaderboard));
            
            // 添加到本周排行榜
            weekLeaderboard = weekLeaderboard.filter(item => item.week === currentWeek);
            weekLeaderboard.push(entry);
            weekLeaderboard.sort((a, b) => b.score - a.score);
            weekLeaderboard = weekLeaderboard.slice(0, 10);
            localStorage.setItem('tetrisWeekLeaderboard', JSON.stringify(weekLeaderboard));
        }
        
        // 更新排行榜显示
        this.displayLeaderboards(todayLeaderboard, weekLeaderboard);
    }
    
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
    
    displayLeaderboards(todayData, weekData) {
        this.displayTabLeaderboard('today-panel', todayData, 'today');
        this.displayTabLeaderboard('week-panel', weekData, 'week');
    }
    
    displayTabLeaderboard(panelId, leaderboard, type) {
        const panel = document.getElementById(panelId);
        if (!panel) return;
        
        // If no data, show default leaderboard
        if (leaderboard.length === 0) {
            const defaultData = type === 'today' ? [
                { score: 15000, level: 8, lines: 75 },
                { score: 12500, level: 7, lines: 62 },
                { score: 10800, level: 6, lines: 54 },
                { score: 9200, level: 5, lines: 46 },
                { score: 8500, level: 5, lines: 42 },
                { score: 7800, level: 4, lines: 39 },
                { score: 7200, level: 4, lines: 36 },
                { score: 6600, level: 3, lines: 33 },
                { score: 6000, level: 3, lines: 30 },
                { score: 5500, level: 3, lines: 27 }
            ] : [
                { score: 25000, level: 10, lines: 125 },
                { score: 20300, level: 9, lines: 101 },
                { score: 18700, level: 8, lines: 93 },
                { score: 16400, level: 8, lines: 82 },
                { score: 14800, level: 7, lines: 74 },
                { score: 13500, level: 7, lines: 67 },
                { score: 12200, level: 6, lines: 61 },
                { score: 11000, level: 6, lines: 55 },
                { score: 9800, level: 5, lines: 49 },
                { score: 8600, level: 5, lines: 43 }
            ];
            leaderboard = defaultData;
        }
        
        // 清空现有内容
        panel.innerHTML = '';
        
        // 如果排行榜为空，显示空状态
        if (leaderboard.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'leaderboard-empty';
            emptyState.innerHTML = 'No records yet<br>Start playing to create your record!';
            panel.appendChild(emptyState);
            return;
        }
        
        // 限制显示前10名
        const topTen = leaderboard.slice(0, 10);
        
        // 显示排行榜数据
        topTen.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            
            // Add special icons for top 3
            let rankIcon = index + 1;
            if (index === 0) rankIcon = '🥇';
            else if (index === 1) rankIcon = '🥈';
            else if (index === 2) rankIcon = '🥉';
            
            const playerName = type === 'today' ? 
                `Player ${String.fromCharCode(65 + index)}` : 
                `Player ${String.fromCharCode(88 - index)}`;
            
            item.innerHTML = `
                <div class="leaderboard-item-top">
                    <span class="rank">${rankIcon}</span>
                    <span class="player-score">${entry.score.toLocaleString()}</span>
                </div>
                <div class="leaderboard-item-bottom">
                    <span class="player-name">${playerName}</span>
                </div>
            `;
            panel.appendChild(item);
        });
    }
    
    displayLeaderboard(leaderboard) {
        // 保持向后兼容，但现在使用新的显示方法
        this.displayLeaderboards(leaderboard, leaderboard);
    }
    
    gameLoop(time = 0) {
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        if (!this.gameOver && !this.isPaused) {
            this.dropCounter += deltaTime;
            if (this.dropCounter > this.dropInterval) {
                this.movePiece(0, 1);
                this.dropCounter = 0;
            }
        }
        
        this.draw();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    restart() {
        this.board = this.createBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.dropCounter = 0;
        this.dropInterval = 1500;
        this.updateScore();
        this.spawnPiece();
        
        // Start background music when game starts
        if (!this.isMuted) {
            setTimeout(() => this.playBackgroundMusic(), 100);
        }
    }
    
    pause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.stopBackgroundMusic();
        } else if (!this.isMuted) {
            this.playBackgroundMusic();
        }
    }
}

// 游戏控制
document.addEventListener('keydown', (e) => {
    // Prevent default behavior for game control keys
    if (['KeyR', 'KeyP'].includes(e.code)) {
        e.preventDefault();
    }
    
    if (e.code === 'KeyR' && window.tetrisGame && window.tetrisGame.gameOver) {
        window.tetrisGame.restart();
    }
    if (e.code === 'KeyP' && window.tetrisGame) {
        window.tetrisGame.pause();
    }
});

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startGame');
    const pauseButton = document.getElementById('pauseGame');
    const muteButton = document.getElementById('muteButton');
    
    // Initialize canvas immediately to show the game board
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = 400;  // 10 columns × 40px
        canvas.height = 800; // 20 rows × 40px
        
        // Draw initial empty game board with full grid
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw complete grid filling the entire board
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        const BLOCK_SIZE = 40;
        const BOARD_WIDTH = 10;
        const BOARD_HEIGHT = 20;
        
        // Draw vertical lines
        for (let x = 0; x <= BOARD_WIDTH; x++) {
            ctx.beginPath();
            ctx.moveTo(x * BLOCK_SIZE, 0);
            ctx.lineTo(x * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= BOARD_HEIGHT; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * BLOCK_SIZE);
            ctx.lineTo(BOARD_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE);
            ctx.stroke();
        }
        
        // Fill each grid cell with a subtle background pattern
        ctx.fillStyle = '#111';
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                // Alternate pattern for better visibility
                if ((x + y) % 2 === 0) {
                    ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
                }
            }
        }
        
        // Redraw grid lines on top
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        
        for (let x = 0; x <= BOARD_WIDTH; x++) {
            ctx.beginPath();
            ctx.moveTo(x * BLOCK_SIZE, 0);
            ctx.lineTo(x * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
            ctx.stroke();
        }
        
        for (let y = 0; y <= BOARD_HEIGHT; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * BLOCK_SIZE);
            ctx.lineTo(BOARD_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE);
            ctx.stroke();
        }
    }
    
    if (startButton) {
        startButton.addEventListener('click', () => {
            if (!window.tetrisGame || window.tetrisGame.gameOver) {
                window.tetrisGame = new Tetris('gameCanvas');
                // Start background music when game starts
                if (!window.tetrisGame.isMuted) {
                    setTimeout(() => window.tetrisGame.playBackgroundMusic(), 500);
                }
            }
        });
    }
    
    if (pauseButton) {
        pauseButton.addEventListener('click', () => {
            if (window.tetrisGame && !window.tetrisGame.gameOver) {
                window.tetrisGame.pause();
            }
        });
    }
    
    if (muteButton) {
        muteButton.addEventListener('click', () => {
            if (window.tetrisGame) {
                window.tetrisGame.toggleMute();
            }
        });
    }
    
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove all active states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // Activate current tab
            button.classList.add('active');
            document.getElementById(`${targetTab}-panel`).classList.add('active');
        });
    });
    
    // Initialize leaderboard display
    if (window.tetrisGame) {
        window.tetrisGame.displayLeaderboards([], []);
    } else {
        // Create temporary instance to display initial leaderboard
        const tempGame = { 
            displayLeaderboards: Tetris.prototype.displayLeaderboards,
            displayTabLeaderboard: Tetris.prototype.displayTabLeaderboard
        };
        tempGame.displayLeaderboards([], []);
    }
});
