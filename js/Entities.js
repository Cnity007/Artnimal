import { Juice } from './Juice.js';

export class Particle {
    constructor(x, y, isJuicy) {
        this.x = x;
        this.y = y;
        this.isJuicy = isJuicy;
        this.size = 20;
        this.collected = false;
        
        // Appear anim
        this.scale = isJuicy ? 0 : 1;
        this.targetScale = 1;
        this.floatY = 0;
        this.time = 0;
    }

    update() {
        if (this.isJuicy) {
            if (this.scale < this.targetScale) {
                this.scale += 0.1;
                if (this.scale > this.targetScale) this.scale = this.targetScale;
            }
            this.time += 0.1;
            this.floatY = Math.sin(this.time) * 5; // Bobbing effect
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y + this.floatY);
        ctx.scale(this.scale, this.scale);
        
        // Draw a mini canvas icon
        ctx.fillStyle = '#fff';
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.strokeStyle = '#34495e'; // Doodle border
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
        
        // Inner squiggle
        ctx.beginPath();
        ctx.moveTo(-5, -5);
        ctx.lineTo(5, 5);
        ctx.moveTo(5, -5);
        ctx.lineTo(-5, 5);
        ctx.strokeStyle = '#e74c3c';
        ctx.stroke();

        ctx.restore();
    }
}

export class CanvasDrop {
    constructor(x, y, isJuicy) {
        this.x = x;
        this.y = y;
        this.isJuicy = isJuicy;
        this.size = 25;
        this.collected = false;
        
        // State machine: falling, waiting, flying
        this.state = 'falling';
        
        if (isJuicy) {
            this.vx = (Math.random() - 0.5) * 6;
            this.vy = -6;
            this.gravity = 0.5;
        } else {
            this.vx = 0;
            this.vy = 2; // Fall linear slow
            this.gravity = 0;
        }
        
        this.groundY = y + 20;
        this.waitTimer = 0;

        // Float anim
        this.startY = y;
        this.floatY = 0;
        this.time = 0;
        this.scale = isJuicy ? 0 : 1;
    }

    update(cw, ch) {
        if (this.state === 'falling') {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity;
            
            if (this.y >= this.groundY) {
                this.y = this.groundY;
                if (this.isJuicy) {
                    this.vy *= -0.4;
                    this.vx *= 0.5;
                    if (Math.abs(this.vy) < 1.0) {
                        this.state = 'waiting';
                        this.waitTimer = 45; // Wait before flying
                        this.startY = this.y;
                    }
                } else {
                    this.state = 'waiting';
                    this.waitTimer = 30;
                    this.startY = this.y;
                }
            }
        } else if (this.state === 'waiting') {
            this.waitTimer--;
            if (this.isJuicy) {
                this.time += 0.05;
                this.floatY = Math.sin(this.time) * 5;
            } else {
                this.floatY = 0;
            }
            
            if (this.waitTimer <= 0) {
                this.state = 'flying';
            }
        } else if (this.state === 'flying') {
            const tx = cw / 2;
            const ty = ch;
            const dx = tx - this.x;
            const dy = ty - this.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < 20) {
                this.collected = true;
                window.DoodleGarden.canvasCount++;
                window.dispatchEvent(new Event('inventoryChanged'));
                if (this.isJuicy) Juice.play('pop');
            } else {
                if (this.isJuicy) {
                    this.x += dx * 0.1;
                    this.y += dy * 0.1;
                    this.scale *= 0.95;
                } else {
                    // Linear un-eased fly
                    const speed = 10;
                    this.x += (dx / dist) * Math.min(dist, speed);
                    this.y += (dy / dist) * Math.min(dist, speed);
                }
            }
        }

        if (this.isJuicy && this.state !== 'flying') {
            if (this.scale < 1) {
                this.scale += 0.05;
                if (this.scale > 1) this.scale = 1;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        const drawY = (this.state === 'waiting') ? this.startY + this.floatY : this.y;
        ctx.translate(this.x, drawY);
        ctx.scale(this.scale, this.scale);
        
        // Draw canvas paper
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 3;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = '#34495e'; 
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
        
        // Inner squiggle
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.lineTo(8, -8);
        ctx.moveTo(-8, 0);
        ctx.lineTo(5, 0);
        ctx.moveTo(-8, 8);
        ctx.lineTo(8, 8);
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
    }
}

export class Food {
    constructor(x, y, isJuicy) {
        this.isJuicy = isJuicy;
        this.size = 12;
        this.consumed = false;
        this.isStar = false; // For 100k achievement reward
        this.color = '#ffb347'; 
        
        this.lifeTimer = 600; // 60 frames/sec * 10 sec = 600 frames until despawn
        
        if (this.isJuicy) {
            this.x = x; 
            this.y = y - 20;
            this.vx = (Math.random() - 0.5) * 5;
            this.vy = -5 - Math.random() * 5; 
            this.targetY = y; 
            this.scale = 0;
        } else {
            this.x = x;
            this.y = y;
            this.vx = 0;
            this.vy = 0;
            this.targetY = y;
            this.scale = 1;
        }
        
        this.consumed = false;
        this.targetedBy = null; // AI pathing metadata
    }

    get isRainbowStar() {
        return window.DoodleGarden && window.DoodleGarden.rainbowCheatTimer > 0;
    }

    update(canvasWidth, canvasHeight, foods) {
        this.lifeTimer--;
        if (this.lifeTimer <= 0) {
            this.consumed = true; // Despawn
        }

        if (this.isJuicy) {
            if (this.scale < 1) {
                this.scale += 0.1;
                if (this.scale > 1) this.scale = 1;
            }

            if (this.y < this.targetY) {
                this.vy += 0.5; 
                this.y += this.vy;
                this.x += this.vx;
            } else {
                this.y = this.targetY;
                this.vy = 0;
                this.vx = 0;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        // Fade out slightly when about to despawn
        if (this.lifeTimer < 60) {
            ctx.globalAlpha = (this.lifeTimer / 60);
        }

        if (this.isRainbowStar || this.isStar) {
            // Draw a cute star
            if (this.isRainbowStar) {
                const hue = (Date.now() / 10) % 360;
                ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
                ctx.strokeStyle = '#fff';
                ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
                ctx.shadowBlur = 10;
            } else {
                ctx.fillStyle = '#f1c40f';
                ctx.strokeStyle = '#f39c12';
            }
            
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            const spikes = 5;
            const outerRadius = this.size + 5;
            const innerRadius = this.size / 2;
            let rot = Math.PI / 2 * 3;
            let cx = 0, cy = 0;
            let step = Math.PI / spikes;

            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                cx = Math.cos(rot) * outerRadius;
                cy = Math.sin(rot) * outerRadius;
                ctx.lineTo(cx, cy);
                rot += step;

                cx = Math.cos(rot) * innerRadius;
                cy = Math.sin(rot) * innerRadius;
                ctx.lineTo(cx, cy);
                rot += step;
            }
            ctx.lineTo(0, 0 - outerRadius);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0; // reset
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.strokeStyle = '#c2761f';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.restore();
    }
}

export class Animal {
    constructor(imageObj, name, x, y, isJuicy) {
        this.image = imageObj;
        this.name = name || 'นิรนาม';
        this.x = x;
        this.y = y;
        this.isJuicy = isJuicy;
        
        this.baseWidth = 100;
        this.baseHeight = 100;
        
        if (this.image.width && this.image.height) {
            const aspect = this.image.width / this.image.height;
            if (aspect > 1) {
                this.baseHeight = this.baseWidth / aspect;
            } else {
                this.baseWidth = this.baseHeight * aspect;
            }
        }
        
        this.targetBaseScale = 1.0; 
        
        this.scaleX = isJuicy ? 0 : 1;
        this.scaleY = isJuicy ? 0 : 1;
        this.scaleVelocity = 0;
        
        // Dragging state
        this.isDragged = false;
        
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.speed = 1.5;
        this.changeDirTimer = 0;
        
        this.xp = 0;
        this.targetFood = null;
        this.squashTimer = 0;
        
        this.fullnessCooldown = 0; // 30s cooldown after eating max times
        this.maxFullnessCooldown = 1800; // Track the maximum to calculate progress percentage accurately
        this.eatenCount = 0;       // Count towards drop
        this.requiredFood = 3;     // Initial food required to grow

        // New Stats for UI
        this.growthLevel = 0;
        this.totalEaten = 0;
        
        if (this.isJuicy) {
            Juice.play('tada');
        }
    }

    update(canvasWidth, canvasHeight, foods) {
        if (this.isJuicy) {
            const targetS = this.targetBaseScale;
            let displayScaleX = targetS;
            let displayScaleY = targetS;
            
            if (this.squashTimer > 0) {
                this.squashTimer--;
                const amt = Math.sin(this.squashTimer * 0.5) * 0.3;
                displayScaleX += amt;
                displayScaleY -= amt;
            }

            const forceX = (displayScaleX - this.scaleX) * 0.1;
            this.scaleVelocity += forceX;
            this.scaleVelocity *= 0.8; 
            this.scaleX += this.scaleVelocity;
            this.scaleY = this.scaleX; 
            
            if (this.squashTimer > 0) {
                this.scaleX = displayScaleX;
                this.scaleY = displayScaleY;
            }
        } else {
            this.scaleX = this.targetBaseScale;
            this.scaleY = this.targetBaseScale;
        }

        // If dragged, position is handled by Game.js drag logic
        if (this.isDragged) {
            // visually look idle while dragged
            if (this.isJuicy) {
                // wiggle a bit while dragged
                this.squashTimer = 5; 
            }
            return null;
        }

        // Fullness Cooldown Logic
        if (this.fullnessCooldown > 0) {
            this.fullnessCooldown--;
            this.randomWander();
        } else {
            // Hungry: Find food, but COMMIT to current target to prevent stuttering
            if (!this.targetFood || this.targetFood.consumed) {
                let closestFood = null;
                let minDist = Infinity;
                if (foods.length > 0) {
                    // Prioritize food not targeted by others, unless no choice
                    let preferredFoods = foods.filter(f => !f.consumed && (f.targetedBy === null || f.targetedBy === this));
                    if (preferredFoods.length === 0) {
                        preferredFoods = foods.filter(f => !f.consumed); // fallback to already targeted ones
                    }
                    
                    preferredFoods.forEach(f => {
                        const d = Math.hypot(f.x - this.x, f.y - this.y);
                        if (d < minDist) {
                            minDist = d;
                            closestFood = f;
                        }
                    });
                }

                // Release old target if changed
                if (this.targetFood && this.targetFood !== closestFood) {
                    if (this.targetFood.targetedBy === this) this.targetFood.targetedBy = null;
                }
                this.targetFood = closestFood;
                
                if (this.targetFood) {
                    this.targetFood.targetedBy = this;
                    // Add tiny random offset to avoid exact stacking with others if multiple target same food
                    const offsetRadius = 5;
                    this.targetFoodOffsetX = (Math.random() - 0.5) * offsetRadius;
                    this.targetFoodOffsetY = (Math.random() - 0.5) * offsetRadius;
                }
            }

            if (this.targetFood) {
                const targetX = this.targetFood.x + (this.targetFoodOffsetX || 0);
                const targetY = this.targetFood.y + (this.targetFoodOffsetY || 0);
                
                const minDist = Math.hypot(targetX - this.x, targetY - this.y);
                
                if (minDist < 30) {
                    const foodToEat = this.targetFood;
                    this.targetFood.consumed = true;
                    this.targetFood.targetedBy = null;
                    this.targetFood = null;
                    return this.eat(foodToEat); // Passing food reference
                } else {
                    this.targetVx = ((targetX - this.x) / minDist) * this.speed * 1.5; 
                    this.targetVy = ((targetY - this.y) / minDist) * this.speed * 1.5;
                }
            } else {
                this.randomWander();
            }
        }

        // Apply smooth Velocity (lerping)
        if (this.targetVx !== undefined && this.targetVy !== undefined) {
            this.vx += (this.targetVx - this.vx) * 0.05;
            this.vy += (this.targetVy - this.vy) * 0.05;
        }
        
        this.x += this.vx;
        this.y += this.vy;

        // DBoundary constraints (full canvas allowed now)
        let minX = 50, maxX = canvasWidth - 50;
        let minY = 50, maxY = canvasHeight - 50;

        // Bounce back smoothly instead of hard snapping
        if (this.x < minX) { this.targetVx = Math.abs(this.targetVx); }
        if (this.x > maxX) { this.targetVx = -Math.abs(this.targetVx); }
        if (this.y < minY) { this.targetVy = Math.abs(this.targetVy); }
        if (this.y > maxY) { this.targetVy = -Math.abs(this.targetVy); }
        
        // Hard constraint just in case it escapes
        if (this.x < minX - 10) this.x = minX;
        if (this.x > maxX + 10) this.x = maxX;
        if (this.y < minY - 10) this.y = minY;
        if (this.y > maxY + 10) this.y = maxY;
        
        return null;
    }

    randomWander() {
        this.changeDirTimer--;
        if (this.changeDirTimer <= 0) {
            const angle = Math.random() * Math.PI * 2;
            const speedMod = this.fullnessCooldown > 0 ? 0.3 : 0.6; 
            
            // Smoothly lerp towards new velocity instead of instant snap
            this.targetVx = Math.cos(angle) * this.speed * speedMod;
            this.targetVy = Math.sin(angle) * this.speed * speedMod;
            
            this.changeDirTimer = 30 + Math.random() * 90; // Change dir more frequently
        }
    }

    onClick() {
        // Decrease fullness cooldown if waiting
        if (this.fullnessCooldown > 0) {
            if (window.DoodleGarden && window.DoodleGarden.rainbowCheatTimer > 0) {
                this.fullnessCooldown = 0; // Instant clear in Rainbow Mode
            } else {
                this.fullnessCooldown -= 60; // Reduce by 1 second (60 frames)
            }
            if (this.fullnessCooldown < 0) this.fullnessCooldown = 0;
            
            // Pop out juice a bit stronger since we clicked
            this.squashTimer = 20;
            if (this.isJuicy) {
                Juice.play('pop');
            }
        } else {
            // Normal click
            this.squashTimer = 30;
            if (this.isJuicy) {
                Juice.play('pop');
            }
        }
    }

    eat(food) {
        this.xp += 1;
        // If the food is a rainbow star, it gives 100 points to instantly fill
        // If it's a normal star, it gives 2 points.
        let amount = 1;
        if (food && food.isRainbowStar) {
            amount = 100;
        } else if (food && food.isStar) {
            amount = 2;
        }
        this.eatenCount += amount;
        this.totalEaten += amount; // Track total eaten across lifetime
        
        let result = null;

        if (this.eatenCount >= this.requiredFood) {
            // Full! Grow, Drop Canvas, enter 30s + 10s per level cooldown
            this.fullnessCooldown = 1800 + (this.growthLevel * 600);
            this.maxFullnessCooldown = this.fullnessCooldown; // Store max for progress calculation
            this.eatenCount = 0;
            this.growthLevel += 1; // Increase growth state
            
            // Update highest level state
            window.DoodleGarden.maxAnimalLevel = Math.max(window.DoodleGarden.maxAnimalLevel || 0, this.growthLevel);
            window.dispatchEvent(new Event('requestQuestUpdate'));
            
            // Infinite Scaling Mechanics
            this.requiredFood *= 2; 
            this.targetBaseScale += 0.2;
            this.speed = Math.max(0.4, this.speed * 0.9); // Reduce speed, minimum 0.4
            
            result = 'droppedCanvas';
            
            if (this.isJuicy) {
                Juice.play('tada');
            }
        }

        if (this.isJuicy) {
            this.squashTimer = 20;
            if (result !== 'droppedCanvas') Juice.play('pop');
            if (result) return { state: result, crumb: true };
            return { state: 'ate', crumb: true };
        }
        
        if (result) return { state: result, crumb: false };
        return { state: 'ate', crumb: false };
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.vx < 0) {
            ctx.scale(-this.scaleX, this.scaleY);
        } else {
            ctx.scale(this.scaleX, this.scaleY);
        }


        ctx.drawImage(
            this.image, 
            -this.baseWidth / 2, 
            -this.baseHeight / 2, 
            this.baseWidth, 
            this.baseHeight
        );
        
        ctx.restore();
        
        // Draw progress clock if full
        if (this.fullnessCooldown > 0) {
            ctx.save();
            
            const offset = Math.sin(this.fullnessCooldown * 0.05) * 5;
            
            // Draw cooldown pie slice
            const radius = 10;
            const cx = this.x + 25;
            const cy = this.y - this.baseHeight/2 * this.scaleY - 25 + offset;
            
            // Calculate percentage based on the max fullness cooldown instead of a hardcoded 1800
            const progress = 1 - (this.fullnessCooldown / this.maxFullnessCooldown);
            
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress));
            ctx.lineTo(cx, cy);
            ctx.fillStyle = 'rgba(52, 73, 94, 0.5)';
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = '#34495e';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
        }
        
        // Draw Name and Level Below
        if (this.name) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.translate(0, this.baseHeight/2 * this.scaleY + 20); // move below animal
            
            ctx.font = 'bold 16px "Patrick Hand", "Fredoka", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Apply glow
            if (this.isJuicy && this.growthLevel >= 10) {
                ctx.shadowColor = '#f1c40f';
                ctx.shadowBlur = 15 + Math.sin(Date.now() / 200) * 5;
            }
            
            // Text shadow/outline for readability
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.strokeText(this.name, 0, 0);
            
            ctx.fillStyle = (this.isJuicy && this.growthLevel >= 10) ? '#d4ac0d' : '#2c3e50';
            ctx.fillText(this.name, 0, 0);
            
            // Draw Level
            ctx.font = '14px "Patrick Hand", cursive';
            ctx.strokeText(`Lvl ${this.growthLevel}`, 0, 18); // below name
            ctx.fillText(`Lvl ${this.growthLevel}`, 0, 18);
            
            ctx.restore();
        }
    }
}
