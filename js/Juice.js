export class Juice {
    static audioContext = null;

    static initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    static play(soundType) {
        if (!window.DoodleGarden.isJuicy) return;
        
        try {
            this.initAudio();
            const ctx = this.audioContext;
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            const now = ctx.currentTime;
            const vol = (window.DoodleGarden.sfxVol !== undefined) ? window.DoodleGarden.sfxVol : 0.5;

            if (soundType === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
                gainNode.gain.setValueAtTime(0.1 * vol, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01 * vol, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (soundType === 'tada') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.setValueAtTime(500, now + 0.1);
                osc.frequency.setValueAtTime(800, now + 0.2);
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(0.2 * vol, now + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01 * vol, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
            } else if (soundType === 'pop') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(1000, now + 0.05);
                gainNode.gain.setValueAtTime(0.2 * vol, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01 * vol, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            }
        } catch (e) {
            console.error("Audio playback failed", e);
        }
    }
    
    static createParticles(x, y, color) {
        if (!window.DoodleGarden.isJuicy) return [];
        const particles = [];
        for(let i = 0; i < 10; i++) {
            // We return them so game loop can manage them
            particles.push(new (window.DoodleGarden.ParticleClass)(x, y, color)); 
        }
        return particles;
    }
}

// Global click to unlock audio context
document.addEventListener('click', () => {
    if (Juice.audioContext && Juice.audioContext.state === 'suspended') {
        Juice.audioContext.resume();
    }
});
