import { Animal, Food, Particle, CanvasDrop } from './Entities.js';
import { Juice } from './Juice.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.animals = [];
        this.foods = [];
        this.particles = [];
        this.canvasDrops = [];
        this.isRunning = false;

        // Auto food drop timer
        this.autoFoodTimer = 0;

        // Playtime Timer
        this.playtimeSeconds = 0;
        this.lastTimestamp = 0;

        // Dragging state
        this.draggedAnimal = null;

        // Expose Particle reference for Juice to use
        window.DoodleGarden.ParticleClass = Particle;

        this.loop = this.loop.bind(this);

        window.addEventListener('gameStateActive', () => {
            if (!this.isRunning) {
                this.isRunning = true;
                this.lastTimestamp = 0; // reset for delta time calculation
                this.resize();
                requestAnimationFrame(this.loop);
            }
        });

        window.addEventListener('drawingStateActive', () => {
            this.isRunning = false;
        });

        window.addEventListener('resize', () => {
            if (this.isRunning) this.resize();
        });

        // Event for Timer start (from Play Warning Modal confirm)
        window.addEventListener('gameTimerStart', () => {
            if (!this.hasStartedTimer) {
                this.playtimeSeconds = 0;
                this.hasStartedTimer = true;
            }
            this.lastTimestamp = performance.now();
        });

        // Quest Evaluation
        window.addEventListener('requestQuestUpdate', () => {
            this.evaluateQuests();
        });

        const getCanvasPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            let clientX = e.clientX;
            let clientY = e.clientY;

            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            }

            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        };

        const downHandler = (e) => {
            e.preventDefault(); // crucial for touch
            if (window.DoodleGarden.isPaused) return;

            const pos = getCanvasPos(e);
            const x = pos.x;
            const y = pos.y;

            // 1. Check if clicked on an Animal
            let clickedAnimal = false;
            for (let i = this.animals.length - 1; i >= 0; i--) {
                const anim = this.animals[i];
                // Simple bounding box check based on scale
                const w = anim.baseWidth * anim.scaleX;
                const h = anim.baseHeight * anim.scaleY;
                if (x > anim.x - w / 2 && x < anim.x + w / 2 && y > anim.y - h / 2 && y < anim.y + h / 2) {
                    anim.onClick();
                    this.draggedAnimal = anim;
                    clickedAnimal = true;
                    break;
                }
            }

            // 2. Drop food if didn't click animal
            if (!clickedAnimal) {
                this.dropFood(x, y);
            }
        };

        const moveHandler = (e) => {
            if (window.DoodleGarden.isPaused || !this.draggedAnimal) return;
            e.preventDefault();
            const pos = getCanvasPos(e);
            this.draggedAnimal.x = pos.x;
            this.draggedAnimal.y = pos.y;
            this.draggedAnimal.isDragged = true;
            // Zero out velocity so it doesn't run away immediately when dropped
            this.draggedAnimal.vx = 0;
            this.draggedAnimal.vy = 0;
        };

        const upHandler = (e) => {
            if (this.draggedAnimal) {
                this.draggedAnimal.isDragged = false;
                this.draggedAnimal = null;
            }
        };

        this.canvas.addEventListener('mousedown', downHandler);
        this.canvas.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);

        this.canvas.addEventListener('touchstart', downHandler, { passive: false });
        this.canvas.addEventListener('touchmove', moveHandler, { passive: false });
        window.addEventListener('touchend', upHandler);
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height - 90; // Subtract space for taller doodle header
    }

    addAnimal(dataUrl, name) {
        const img = new Image();
        img.onload = () => {
            const startX = this.canvas.width / 2;
            const startY = this.canvas.height / 2;
            const isJ = window.DoodleGarden.isJuicy;
            const animal = new Animal(img, name, startX, startY, isJ);
            this.animals.push(animal);

            if (isJ) {
                // Spawn Poof Particles
                const parts = Juice.createParticles(startX, startY, '#ffffff');
                this.particles.push(...parts);
            }
        };
        img.src = dataUrl;
    }

    dropFood(x, y) {
        const isJ = window.DoodleGarden.isJuicy;
        const food = new Food(x, y, isJ);

        // Star Food Logic
        window.DoodleGarden.totalFoodsDropped++;
        if (window.DoodleGarden.totalFoodsDropped >= 1000) {
            food.isStar = true;
        }

        this.foods.push(food);
        if (isJ) Juice.play('pop');
    }

    collectCanvasDrop() {
        const isJ = window.DoodleGarden.isJuicy;
        if (isJ) Juice.play('tada');

        window.DoodleGarden.canvasCount++;
        window.dispatchEvent(new Event('inventoryChanged'));
    }

    loop(timestamp) {
        // Run continuously, but objects pause updates if isPaused
        if (!this.isRunning) return;

        // Update Timer
        if (this.lastTimestamp === 0) this.lastTimestamp = timestamp;
        const delta = timestamp - this.lastTimestamp;

        if (!window.DoodleGarden.isPaused && window.DoodleGarden.currentZone !== 'menu') {
            this.playtimeSeconds += delta / 1000;
            this.updateTimerDisplay();
        }

        this.lastTimestamp = timestamp;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Handle Cheat Timer
        if (window.DoodleGarden.rainbowCheatTimer > 0) {
            window.DoodleGarden.rainbowCheatTimer--;
        }

        const isJ = window.DoodleGarden.isJuicy;
        const currentZ = window.DoodleGarden.currentZone;
        const isPaused = window.DoodleGarden.isPaused;

        if (!isPaused) this.foods.forEach(f => f.update());

        this.canvasDrops = this.canvasDrops.filter(d => !d.collected);
        this.canvasDrops.forEach(d => {
            d.isJuicy = isJ;
            if (!isPaused) d.update(this.canvas.width, this.canvas.height);
            d.draw(this.ctx);
        });

        this.animals.forEach(anim => {
            anim.isJuicy = isJ;
            if (!isPaused) {
                const act = anim.update(this.canvas.width, this.canvas.height, this.foods);

                if (act) {
                    if (act.state === 'droppedCanvas') {
                        this.canvasDrops.push(new CanvasDrop(anim.x, anim.y + 30, isJ));
                    }
                    if (act.crumb && isJ) {
                        const parts = Juice.createParticles(anim.x, anim.y + 20, '#ffb347');
                        this.particles.push(...parts);
                    }
                }
            }

            anim.draw(this.ctx);
        });

        // Filter out consumed foods
        this.foods = this.foods.filter(f => !f.consumed);

        this.foods.forEach(f => {
            f.isJuicy = isJ;
            f.draw(this.ctx);
        });

        if (isJ) {
            if (!isPaused) this.particles.forEach(p => p.update());
            this.particles.forEach(p => p.draw(this.ctx));
            this.particles = this.particles.filter(p => p.life > 0);
        }

        // Draw Rainbow Timer at the very top
        if (window.DoodleGarden.rainbowCheatTimer > 0) {
            this.ctx.save();
            this.ctx.font = 'bold 24px "Patrick Hand", cursive';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';

            const secondsLeft = Math.ceil(window.DoodleGarden.rainbowCheatTimer / 60);
            const text = `🌈 Rainbow Mode: ${secondsLeft}s`;

            // Hue shifts over time
            const hue = (timestamp / 10) % 360;
            this.ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 4;

            const cx = this.canvas.width / 2;
            const cy = 20;
            this.ctx.strokeText(text, cx, cy);
            this.ctx.fillText(text, cx, cy);
            this.ctx.restore();
        }

        requestAnimationFrame(this.loop);
    }

    updateTimerDisplay() {
        const timerDisplay = document.getElementById('timer-display');
        if (!timerDisplay) return;

        const totalSeconds = Math.floor(this.playtimeSeconds);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        timerDisplay.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        // 10 minute check (600 seconds)
        // We only trigger once exactly matching a multiple of 600, checking if it was just hit in this exact frame
        // to avoid spamming the effect.  Actually an easier way is to track the last milestone.
        const currentMilestone = Math.floor(totalSeconds / 600);
        if (currentMilestone > 0 && currentMilestone > (this.lastTenMinMilestone || 0)) {
            this.lastTenMinMilestone = currentMilestone;
            if (window.DoodleGarden.isJuicy) {
                // Celebration Effect
                Juice.play('tada');

                // Spawn a ton of particles
                const cx = this.canvas.width / 2;
                const cy = this.canvas.height / 2;
                for (let i = 0; i < 5; i++) {
                    const parts = Juice.createParticles(cx + (Math.random() - 0.5) * 100, cy + (Math.random() - 0.5) * 100, '#f1c40f');
                    this.particles.push(...parts);
                }

                // Add bounce class to timer
                timerDisplay.parentElement.classList.add('flash-anim');
                setTimeout(() => timerDisplay.parentElement.classList.remove('flash-anim'), 500);
            }
        }
    }

    evaluateQuests() {
        const qList = document.getElementById('quest-list');
        if (!qList) return;

        const state = window.DoodleGarden;
        const quests = [
            { text: "เลี้ยงสัตว์ครบ 10 ตัว", current: state.totalAnimalsSpawned, max: 10 },
            { text: "เลี้ยงสัตว์ครบ 20 ตัว", current: state.totalAnimalsSpawned, max: 20 },
            { text: "วาดรูปสัตว์ 1 ตัวโดยใช้สีมากกว่าหรือเท่ากับ 5 สี", current: state.maxColorsUsed, max: 5 },
            { text: "วาดรูปสัตว์ 1 ตัวโดยใช้สีมากกว่าหรือเท่ากับ 10 สี", current: state.maxColorsUsed, max: 10 },
            { text: "ให้อาหารทั้งหมด 1,000 ชิ้น", current: state.totalFoodsDropped, max: 1000 },
            { text: "เลี้ยงสัตว์ 1 ตัวให้ถึงเลเวล 10", current: state.maxAnimalLevel || 0, max: 10 }
        ];

        let allDone = true;

        qList.innerHTML = '';
        quests.forEach(q => {
            const isDone = q.current >= q.max;
            if (!isDone) allDone = false;

            const div = document.createElement('div');
            div.className = `quest-row ${isDone ? 'done' : ''}`;
            const label = document.createElement('span');
            label.innerText = q.text;

            const prog = document.createElement('span');
            prog.innerText = `${Math.min(q.current, q.max).toLocaleString()} / ${q.max.toLocaleString()} ${isDone ? '✅(รับถ้วยแล้ว)' : '❌'}`;

            div.appendChild(label);
            div.appendChild(prog);
            qList.appendChild(div);
        });

        // Add Total Food Counter at the bottom
        const totalFoodDiv = document.createElement('div');
        totalFoodDiv.style.marginTop = '20px';
        totalFoodDiv.style.paddingTop = '10px';
        totalFoodDiv.style.borderTop = '2px dashed #34495e';
        totalFoodDiv.style.textAlign = 'center';
        totalFoodDiv.innerText = `🍖 จำนวนการให้อาหารทั้งหมด: ${state.totalFoodsDropped.toLocaleString()} ชิ้น`;
        qList.appendChild(totalFoodDiv);

        // Ending Sequence check
        if (allDone && !this.endingTriggered) {
            this.endingTriggered = true;
            setTimeout(() => this.triggerEnding(), 1000);
        }
    }

    triggerEnding() {
        const overlay = document.getElementById('ending-overlay');
        if (!overlay) return;

        overlay.classList.remove('hidden');
        overlay.classList.remove('fade-out'); // Ensure it's not faded
        overlay.style.opacity = '1';

        // Play epic sound via Juice (using a combo for epicness since we only have click/pop/tada)
        if (window.DoodleGarden.isJuicy) {
            Juice.play('tada');
            setTimeout(() => Juice.play('tada'), 500);
            setTimeout(() => Juice.play('tada'), 1000);
        }

        // Wait 10 seconds on the dark screen
        setTimeout(() => {
            // Fade out the entire overlay wrapper
            overlay.style.opacity = '0';
            overlay.classList.add('fade-out');

            // Show quit modal after fade out (2s padding based on CSS transition)
            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.style.opacity = '1'; // reset for next play
                overlay.classList.remove('fade-out');

                // Hide other modals just in case
                const uiModalOverlay = document.getElementById('modal-overlay');
                const quitModal = document.getElementById('quit-modal');
                const ingameMenuModal = document.getElementById('ingame-menu-modal');
                const settingsModal = document.getElementById('settings-modal');
                const ytModal = document.getElementById('yt-queue-modal');
                const alertModal = document.getElementById('alert-modal');
                const questModal = document.getElementById('quest-modal');
                const nameModal = document.getElementById('animal-name-modal');

                if (uiModalOverlay) uiModalOverlay.classList.remove('hidden');
                if (ingameMenuModal) ingameMenuModal.classList.add('hidden');
                if (settingsModal) settingsModal.classList.add('hidden');
                if (ytModal) ytModal.classList.add('hidden');
                if (alertModal) alertModal.classList.add('hidden');
                if (questModal) questModal.classList.add('hidden');
                if (nameModal) nameModal.classList.add('hidden');

                if (quitModal) {
                    quitModal.classList.remove('hidden');
                }
                window.DoodleGarden.isPaused = true;
            }, 2000); // 2 second animation delay
        }, 10000); // 10 seconds wait
    }
}
