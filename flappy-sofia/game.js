// ============================================
// FLAPPY SOFIA - Game Engine
// ============================================

// ----- AUDIO SYSTEM (Web Audio API) -----
class AudioSystem {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.customSounds = {
            flap: null,
            score: null,
            hit: null
        };
        this.loadCustomSounds();
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    loadCustomSounds() {
        const saved = localStorage.getItem('flappySofia_sounds');
        if (saved) {
            this.customSounds = JSON.parse(saved);
        }
    }

    saveCustomSounds() {
        localStorage.setItem('flappySofia_sounds', JSON.stringify(this.customSounds));
    }

    async playCustomSound(dataUrl) {
        if (!this.ctx || this.muted) return;

        try {
            const response = await fetch(dataUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            const source = this.ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.ctx.destination);
            source.start(0);
        } catch (e) {
            console.warn('Error playing custom sound:', e);
        }
    }

    playTone(frequency, duration, type = 'square', volume = 0.3) {
        if (!this.ctx || this.muted) return;

        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        oscillator.start(this.ctx.currentTime);
        oscillator.stop(this.ctx.currentTime + duration);
    }

    playFlap() {
        if (this.customSounds.flap) {
            this.playCustomSound(this.customSounds.flap);
        } else {
            this.playTone(400, 0.1, 'sine', 0.2);
            setTimeout(() => this.playTone(600, 0.1, 'sine', 0.15), 50);
        }
    }

    playScore() {
        if (this.customSounds.score) {
            this.playCustomSound(this.customSounds.score);
        } else {
            this.playTone(523, 0.1, 'sine', 0.3);
            setTimeout(() => this.playTone(659, 0.1, 'sine', 0.3), 100);
            setTimeout(() => this.playTone(784, 0.15, 'sine', 0.3), 200);
        }
    }

    playHit() {
        if (this.customSounds.hit) {
            this.playCustomSound(this.customSounds.hit);
        } else {
            this.playTone(200, 0.3, 'sawtooth', 0.4);
            this.playTone(150, 0.4, 'square', 0.2);
        }
    }
}

// ----- GAME ENGINE -----
class FlappySofia {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audio = new AudioSystem();

        // Game state
        this.state = 'menu'; // menu, playing, gameover
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('flappySofia_highScore')) || 0;

        // Bird properties
        this.bird = {
            x: 0,
            y: 0,
            width: 50,
            height: 50,
            velocity: 0,
            gravity: 0.25,
            jumpForce: -6,
            rotation: 0
        };

        // Pipes
        this.pipes = [];
        this.pipeWidth = 70;
        this.pipeGap = 220;
        this.pipeSpeed = 2.5;
        this.pipeSpawnInterval = 2200;
        this.lastPipeSpawn = 0;

        // Ground
        this.groundHeight = 80;
        this.groundOffset = 0;

        // Clouds
        this.clouds = [];

        // Particles
        this.particles = [];

        // Custom sprite
        this.customSprite = null;
        this.spriteImage = null;
        this.loadCustomSprite();

        // Difficulty progression
        this.basePipeSpeed = 2.5;
        this.baseGap = 220;

        // Callbacks for Alpine.js
        this.onStateChange = null;
        this.onScoreChange = null;

        this.resize();
        this.initClouds();
        this.bindEvents();
    }

    loadCustomSprite() {
        const saved = localStorage.getItem('flappySofia_sprite');
        if (saved) {
            this.customSprite = saved;
            this.loadSpriteImage(saved);
        }
    }

    loadSpriteImage(dataUrl) {
        const img = new Image();
        img.onload = () => {
            // Create cartoon-style processed version
            this.spriteImage = this.processSprite(img);
        };
        img.src = dataUrl;
    }

    processSprite(img) {
        // Create a circular, cartoon-styled version of the sprite
        const size = 200;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Draw circular clip
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw image centered and cropped to circle
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (size - w) / 2;
        const y = (size - h) / 2;
        ctx.drawImage(img, x, y, w, h);

        // Apply cartoon effect: increase contrast and saturation
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            // Skip transparent pixels
            if (data[i + 3] === 0) continue;

            // Increase saturation and contrast
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Convert to HSL, boost saturation, convert back
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const l = (max + min) / 2 / 255;

            // Increase contrast
            const contrast = 1.2;
            data[i] = Math.min(255, Math.max(0, ((r / 255 - 0.5) * contrast + 0.5) * 255));
            data[i + 1] = Math.min(255, Math.max(0, ((g / 255 - 0.5) * contrast + 0.5) * 255));
            data[i + 2] = Math.min(255, Math.max(0, ((b / 255 - 0.5) * contrast + 0.5) * 255));
        }

        ctx.putImageData(imageData, 0, 0);

        // Create final image
        const finalImg = new Image();
        finalImg.src = canvas.toDataURL();
        return finalImg;
    }

    setCustomSprite(dataUrl) {
        this.customSprite = dataUrl;
        localStorage.setItem('flappySofia_sprite', dataUrl);
        this.loadSpriteImage(dataUrl);
    }

    removeCustomSprite() {
        this.customSprite = null;
        this.spriteImage = null;
        localStorage.removeItem('flappySofia_sprite');
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.parentElement.getBoundingClientRect();

        // Game dimensions (fixed aspect ratio)
        const gameWidth = 400;
        const gameHeight = 600;

        // Scale to fit
        const scale = Math.min(rect.width / gameWidth, rect.height / gameHeight);

        this.canvas.width = gameWidth * dpr;
        this.canvas.height = gameHeight * dpr;
        this.canvas.style.width = `${gameWidth * scale}px`;
        this.canvas.style.height = `${gameHeight * scale}px`;

        this.ctx.scale(dpr, dpr);

        this.width = gameWidth;
        this.height = gameHeight;

        // Reset bird position
        this.bird.x = this.width * 0.25;
        this.bird.y = this.height / 2;
    }

    initClouds() {
        this.clouds = [];
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.width,
                y: Math.random() * (this.height * 0.4),
                width: 60 + Math.random() * 60,
                speed: 0.3 + Math.random() * 0.3
            });
        }
    }

    bindEvents() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.handleInput();
            }
        });

        // Mouse
        this.canvas.addEventListener('click', () => this.handleInput());

        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput();
        });

        // Resize
        window.addEventListener('resize', () => this.resize());
    }

    handleInput() {
        this.audio.init();

        if (this.state === 'menu') {
            this.start();
        } else if (this.state === 'playing') {
            this.jump();
        } else if (this.state === 'gameover') {
            this.restart();
        }
    }

    start() {
        this.state = 'playing';
        this.score = 0;
        this.pipes = [];
        this.particles = [];
        this.bird.y = this.height / 2;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.lastPipeSpawn = 0;
        this.pipeSpeed = this.basePipeSpeed;
        this.pipeGap = this.baseGap;

        if (this.onStateChange) this.onStateChange('playing');
        if (this.onScoreChange) this.onScoreChange(0);
    }

    restart() {
        this.start();
    }

    jump() {
        this.bird.velocity = this.bird.jumpForce;
        this.audio.playFlap();
        // Spawn flap particles
        this.spawnFlapParticles(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
    }

    gameOver() {
        this.state = 'gameover';
        this.audio.playHit();

        // Spawn hit particles
        this.spawnHitParticles(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flappySofia_highScore', this.highScore);
        }

        if (this.onStateChange) this.onStateChange('gameover');
    }

    spawnPipe() {
        const minY = 80;
        const maxY = this.height - this.groundHeight - this.pipeGap - 80;
        const topHeight = minY + Math.random() * (maxY - minY);

        this.pipes.push({
            x: this.width,
            topHeight: topHeight,
            bottomY: topHeight + this.pipeGap,
            scored: false
        });
    }

    updateDifficulty() {
        // Increase difficulty every 10 points (more gradual)
        const difficultyLevel = Math.floor(this.score / 10);
        this.pipeSpeed = this.basePipeSpeed + difficultyLevel * 0.2;
        this.pipeGap = Math.max(160, this.baseGap - difficultyLevel * 5);
    }

    update(timestamp) {
        // Always update particles (even in gameover)
        this.updateParticles();

        if (this.state !== 'playing') return;

        // Spawn pipes
        if (timestamp - this.lastPipeSpawn > this.pipeSpawnInterval) {
            this.spawnPipe();
            this.lastPipeSpawn = timestamp;
        }

        // Update bird
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;

        // Rotation based on velocity
        this.bird.rotation = Math.min(Math.max(this.bird.velocity * 3, -30), 90);

        // Update pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed;

            // Score
            if (!pipe.scored && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.scored = true;
                this.score++;
                this.audio.playScore();
                this.updateDifficulty();
                if (this.onScoreChange) this.onScoreChange(this.score);
                // Spawn score particles
                this.spawnScoreParticles(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
            }

            // Remove off-screen pipes
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }

        // Collision detection
        this.checkCollisions();

        // Update ground
        this.groundOffset = (this.groundOffset + this.pipeSpeed) % 24;

        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.width + cloud.width;
                cloud.y = Math.random() * (this.height * 0.4);
            }
        });
    }

    checkCollisions() {
        const bird = this.bird;
        const birdRadius = bird.width / 2 - 5;
        const birdCenterX = bird.x + bird.width / 2;
        const birdCenterY = bird.y + bird.height / 2;

        // Ground collision
        if (bird.y + bird.height > this.height - this.groundHeight) {
            this.gameOver();
            return;
        }

        // Ceiling collision
        if (bird.y < 0) {
            this.gameOver();
            return;
        }

        // Pipe collision
        for (const pipe of this.pipes) {
            // Top pipe
            if (this.circleRectCollision(birdCenterX, birdCenterY, birdRadius,
                pipe.x, 0, this.pipeWidth, pipe.topHeight)) {
                this.gameOver();
                return;
            }

            // Bottom pipe
            if (this.circleRectCollision(birdCenterX, birdCenterY, birdRadius,
                pipe.x, pipe.bottomY, this.pipeWidth, this.height - pipe.bottomY - this.groundHeight)) {
                this.gameOver();
                return;
            }
        }
    }

    circleRectCollision(cx, cy, radius, rx, ry, rw, rh) {
        const closestX = Math.max(rx, Math.min(cx, rx + rw));
        const closestY = Math.max(ry, Math.min(cy, ry + rh));
        const dx = cx - closestX;
        const dy = cy - closestY;
        return (dx * dx + dy * dy) < (radius * radius);
    }

    // Particle system
    spawnScoreParticles(x, y) {
        // Golden stars when scoring
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.5;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 8 + Math.random() * 8,
                life: 1,
                decay: 0.02 + Math.random() * 0.02,
                type: 'star',
                color: Math.random() > 0.5 ? '#FFD700' : '#FFA500',
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3
            });
        }
    }

    spawnHitParticles(x, y) {
        // Dust/debris when hitting
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: 4 + Math.random() * 6,
                life: 1,
                decay: 0.015 + Math.random() * 0.02,
                type: 'dust',
                color: '#8B4513'
            });
        }
        // Some feathers
        for (let i = 0; i < 5; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 10 + Math.random() * 8,
                life: 1,
                decay: 0.01 + Math.random() * 0.01,
                type: 'feather',
                color: '#FFD700',
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }

    spawnFlapParticles(x, y) {
        // Small puff when flapping
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: x - 10 + Math.random() * 20,
                y: y + 15,
                vx: (Math.random() - 0.5) * 1,
                vy: 1 + Math.random(),
                size: 6 + Math.random() * 4,
                life: 0.7,
                decay: 0.05,
                type: 'puff',
                color: 'rgba(255, 255, 255, 0.6)'
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // gravity
            p.life -= p.decay;

            if (p.rotation !== undefined) {
                p.rotation += p.rotationSpeed;
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    drawParticles() {
        const ctx = this.ctx;

        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.translate(p.x, p.y);

            if (p.rotation !== undefined) {
                ctx.rotate(p.rotation);
            }

            if (p.type === 'star') {
                this.drawStar(ctx, 0, 0, p.size, p.color);
            } else if (p.type === 'feather') {
                this.drawFeather(ctx, 0, 0, p.size, p.color);
            } else if (p.type === 'puff') {
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            } else {
                // dust
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            }

            ctx.restore();
        }
    }

    drawStar(ctx, x, y, size, color) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size / 2;

        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI / spikes) - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;

            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    drawFeather(ctx, x, y, size, color) {
        ctx.beginPath();
        ctx.ellipse(x, y, size / 2, size, 0, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Feather line
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x, y + size);
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    draw() {
        const ctx = this.ctx;

        // Sky gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.height);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.7, '#E0F6FF');
        skyGradient.addColorStop(1, '#87CEEB');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.width, this.height);

        // Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.clouds.forEach(cloud => {
            this.drawCloud(cloud.x, cloud.y, cloud.width);
        });

        // Pipes
        this.pipes.forEach(pipe => {
            this.drawPipe(pipe);
        });

        // Ground
        this.drawGround();

        // Bird
        this.drawBird();

        // Particles (drawn on top)
        this.drawParticles();
    }

    drawCloud(x, y, width) {
        const ctx = this.ctx;
        const height = width * 0.5;

        ctx.beginPath();
        ctx.ellipse(x + width * 0.3, y + height * 0.6, width * 0.3, height * 0.4, 0, 0, Math.PI * 2);
        ctx.ellipse(x + width * 0.5, y + height * 0.4, width * 0.35, height * 0.5, 0, 0, Math.PI * 2);
        ctx.ellipse(x + width * 0.7, y + height * 0.6, width * 0.25, height * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawPipe(pipe) {
        const ctx = this.ctx;
        const capHeight = 30;
        const capOverhang = 6;

        // Pipe colors
        const pipeColor = '#73BF2E';
        const pipeDark = '#558B2F';
        const pipeLight = '#8BC34A';

        // Top pipe body
        ctx.fillStyle = pipeColor;
        ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight - capHeight);

        // Top pipe gradient
        const topGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + this.pipeWidth, 0);
        topGradient.addColorStop(0, pipeDark);
        topGradient.addColorStop(0.3, pipeLight);
        topGradient.addColorStop(0.7, pipeColor);
        topGradient.addColorStop(1, pipeDark);
        ctx.fillStyle = topGradient;
        ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight - capHeight);

        // Top pipe cap
        ctx.fillStyle = topGradient;
        ctx.fillRect(pipe.x - capOverhang, pipe.topHeight - capHeight, this.pipeWidth + capOverhang * 2, capHeight);
        ctx.strokeStyle = pipeDark;
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x - capOverhang, pipe.topHeight - capHeight, this.pipeWidth + capOverhang * 2, capHeight);

        // Bottom pipe body
        const bottomPipeStart = pipe.bottomY;
        const bottomPipeHeight = this.height - this.groundHeight - bottomPipeStart;

        ctx.fillStyle = topGradient;
        ctx.fillRect(pipe.x, bottomPipeStart + capHeight, this.pipeWidth, bottomPipeHeight - capHeight);

        // Bottom pipe cap
        ctx.fillRect(pipe.x - capOverhang, bottomPipeStart, this.pipeWidth + capOverhang * 2, capHeight);
        ctx.strokeRect(pipe.x - capOverhang, bottomPipeStart, this.pipeWidth + capOverhang * 2, capHeight);
    }

    drawGround() {
        const ctx = this.ctx;
        const groundY = this.height - this.groundHeight;

        // Ground base
        ctx.fillStyle = '#DED895';
        ctx.fillRect(0, groundY, this.width, this.groundHeight);

        // Ground top (grass)
        ctx.fillStyle = '#73BF2E';
        ctx.fillRect(0, groundY, this.width, 15);

        // Ground pattern
        ctx.fillStyle = '#C9B896';
        for (let x = -this.groundOffset; x < this.width + 24; x += 24) {
            ctx.fillRect(x, groundY + 20, 12, 8);
            ctx.fillRect(x + 12, groundY + 35, 12, 8);
        }
    }

    drawBird() {
        const ctx = this.ctx;
        const bird = this.bird;

        ctx.save();
        ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
        ctx.rotate(bird.rotation * Math.PI / 180);

        if (this.spriteImage) {
            // Draw flapping wings behind the face
            const wingFlap = Math.sin(Date.now() / 80) * 15;

            // Left wing
            ctx.save();
            ctx.translate(-bird.width / 2 + 5, 0);
            ctx.rotate((-30 + wingFlap) * Math.PI / 180);
            ctx.beginPath();
            ctx.ellipse(0, 0, 20, 12, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#FFD700';
            ctx.fill();
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();

            // Right wing
            ctx.save();
            ctx.translate(bird.width / 2 - 5, 0);
            ctx.rotate((30 - wingFlap) * Math.PI / 180);
            ctx.beginPath();
            ctx.ellipse(0, 0, 20, 12, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#FFD700';
            ctx.fill();
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();

            // Draw custom sprite in a circle
            ctx.beginPath();
            ctx.arc(0, 0, bird.width / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(this.spriteImage, -bird.width / 2, -bird.height / 2, bird.width, bird.height);

            // Border - golden ring
            ctx.restore();
            ctx.save();
            ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
            ctx.rotate(bird.rotation * Math.PI / 180);

            // Outer glow
            ctx.beginPath();
            ctx.arc(0, 0, bird.width / 2 + 2, 0, Math.PI * 2);
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 5;
            ctx.stroke();

            // Inner gold border
            ctx.beginPath();
            ctx.arc(0, 0, bird.width / 2, 0, Math.PI * 2);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.stroke();
        } else {
            // Default bird (yellow circle with face)
            // Body
            ctx.beginPath();
            ctx.arc(0, 0, bird.width / 2, 0, Math.PI * 2);
            ctx.fillStyle = '#FFD700';
            ctx.fill();
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Eye
            ctx.beginPath();
            ctx.arc(8, -5, 8, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(10, -5, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'black';
            ctx.fill();

            // Beak
            ctx.beginPath();
            ctx.moveTo(15, 5);
            ctx.lineTo(28, 2);
            ctx.lineTo(15, 10);
            ctx.closePath();
            ctx.fillStyle = '#FF6B35';
            ctx.fill();

            // Wing
            const wingOffset = Math.sin(Date.now() / 100) * 3;
            ctx.beginPath();
            ctx.ellipse(-5, 5 + wingOffset, 12, 8, -0.3, 0, Math.PI * 2);
            ctx.fillStyle = '#E6C200';
            ctx.fill();
        }

        ctx.restore();
    }

    gameLoop(timestamp) {
        this.update(timestamp);
        this.draw();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    run() {
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// ----- ALPINE.JS UI INTEGRATION -----
function gameUI() {
    return {
        gameState: 'menu',
        score: 0,
        highScore: parseInt(localStorage.getItem('flappySofia_highScore')) || 0,
        muted: false,
        showSettings: false,
        customSprite: localStorage.getItem('flappySofia_sprite') || null,
        customSounds: JSON.parse(localStorage.getItem('flappySofia_sounds') || '{}'),
        game: null,

        init() {
            const canvas = document.getElementById('gameCanvas');
            this.game = new FlappySofia(canvas);

            this.game.onStateChange = (state) => {
                this.gameState = state;
                if (state === 'gameover') {
                    this.highScore = this.game.highScore;
                }
            };

            this.game.onScoreChange = (score) => {
                this.score = score;
            };

            this.game.run();
        },

        startGame() {
            this.game.audio.init();
            this.game.start();
        },

        restartGame() {
            this.game.restart();
        },

        toggleMute() {
            this.muted = !this.muted;
            this.game.audio.muted = this.muted;
        },

        uploadSprite(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.customSprite = e.target.result;
                    this.game.setCustomSprite(e.target.result);
                };
                reader.readAsDataURL(file);
            }
        },

        removeSprite() {
            this.customSprite = null;
            this.game.removeCustomSprite();
        },

        uploadSound(type, event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.customSounds[type] = e.target.result;
                    this.game.audio.customSounds[type] = e.target.result;
                    this.game.audio.saveCustomSounds();
                };
                reader.readAsDataURL(file);
            }
        },

        removeSound(type) {
            this.customSounds[type] = null;
            this.game.audio.customSounds[type] = null;
            this.game.audio.saveCustomSounds();
        },

        testSound(type) {
            this.game.audio.init();
            if (type === 'flap') this.game.audio.playFlap();
            else if (type === 'score') this.game.audio.playScore();
            else if (type === 'hit') this.game.audio.playHit();
        },

        resetAll() {
            localStorage.removeItem('flappySofia_sprite');
            localStorage.removeItem('flappySofia_sounds');
            localStorage.removeItem('flappySofia_highScore');
            this.customSprite = null;
            this.customSounds = {};
            this.highScore = 0;
            this.game.removeCustomSprite();
            this.game.audio.customSounds = { flap: null, score: null, hit: null };
            this.game.highScore = 0;
            this.showSettings = false;
        }
    };
}
