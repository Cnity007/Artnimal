import { Juice } from './Juice.js';

export class DrawingEditor {
    constructor(onSave) {
        this.canvas = document.getElementById('drawing-canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.onSave = onSave;
        
        this.isDrawing = false;
        this.color = '#000000';
        this.size = 5;
        this.lastX = 0;
        this.lastY = 0;
        this.hasDrawn = false;
        this.usedColors = new Set();

        // Undo/Redo stacks
        this.undoStack = [];
        this.redoStack = [];

        this.initUI();
        
        // Intentionally small initial timeout to ensure CSS metrics are applied
        setTimeout(() => {
            this.resize();
            this.clearCanvas(false);
        }, 50);
        
        this.bindEvents();

        // Handle window resize logic nicely without breaking drawing
        window.addEventListener('resize', () => {
            // Re-calc scale basically
        });
    }

    initUI() {
        this.colorPicker = document.getElementById('color-picker');
        this.brushSize = document.getElementById('brush-size');
        this.btnUndo = document.getElementById('btn-undo');
        this.btnRedo = document.getElementById('btn-redo');
        this.btnClear = document.getElementById('btn-clear');
        this.btnSave = document.getElementById('btn-save');

        this.colorPicker.addEventListener('input', (e) => { this.color = e.target.value; });
        this.brushSize.addEventListener('input', (e) => { this.size = e.target.value; });

        this.btnUndo.addEventListener('click', () => { this.playJuicyClick(); this.undo(); });
        this.btnRedo.addEventListener('click', () => { this.playJuicyClick(); this.redo(); });
        this.btnClear.addEventListener('click', () => { this.playJuicyClick(); this.clearCanvas(true); });
        
        this.btnSave.addEventListener('click', () => {
            this.playJuicyClick();
            if (this.onSave) {
                // Ensure there is something to save, get the dataURL
                const dataUrl = this.canvas.toDataURL('image/png');
                this.onSave(dataUrl, this.hasDrawn, this.usedColors.size);
                
                // Only clear if actually saved
                if (this.hasDrawn) {
                    this.clearCanvas(true);
                }
            }
        });
    }

    playJuicyClick() {
        if (window.DoodleGarden.isJuicy) {
            Juice.play('click');
        }
    }

    resize() {
        const wrapper = document.querySelector('.canvas-wrapper');
        const size = Math.min(wrapper.clientWidth, wrapper.clientHeight) - 40; 
        
        // Fixed internal drawing resolution (keeps lines crisp but scaleable)
        this.canvas.width = 600; 
        this.canvas.height = 600;
        
        // Display size
        this.canvas.style.width = `${Math.min(size, 600)}px`;
        this.canvas.style.height = `${Math.min(size, 600)}px`;
    }

    bindEvents() {
        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Scale between display size and internal size
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            
            let clientX, clientY;
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        };

        const startDraw = (e) => {
            if (e.type === 'touchstart') e.preventDefault();
            this.isDrawing = true;
            const pos = getPos(e);
            this.lastX = pos.x;
            this.lastY = pos.y;
            this.saveStateToUndo();
        };

        const draw = (e) => {
            if (!this.isDrawing) return;
            if (e.type === 'touchmove') e.preventDefault();

            const pos = getPos(e);
            this.ctx.beginPath();
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.lineWidth = this.size;
            this.ctx.strokeStyle = this.color;
            
            this.ctx.moveTo(this.lastX, this.lastY);
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.stroke();

            this.lastX = pos.x;
            this.lastY = pos.y;
            this.hasDrawn = true;
            this.usedColors.add(this.color);
        };

        const stopDraw = (e) => {
            if (!this.isDrawing) return;
            this.isDrawing = false;
        };

        // Mouse Events
        this.canvas.addEventListener('mousedown', startDraw);
        this.canvas.addEventListener('mousemove', draw);
        window.addEventListener('mouseup', stopDraw);

        // Touch Events
        this.canvas.addEventListener('touchstart', startDraw, { passive: false });
        this.canvas.addEventListener('touchmove', draw, { passive: false });
        window.addEventListener('touchend', stopDraw);
    }

    clearCanvas(saveHistory = true) {
        if (saveHistory) this.saveStateToUndo();
        // Clear background (transparent is fine, CSS colors the canvas background white) 
        // We preserve transparent bg for when animals spawn later!
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.hasDrawn = false;
        this.usedColors.clear();
    }

    saveStateToUndo() {
        if (this.undoStack.length > 20) this.undoStack.shift(); 
        this.undoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        this.redoStack = []; 
    }

    undo() {
        if (this.undoStack.length > 0) {
            this.redoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
            const imageData = this.undoStack.pop();
            this.ctx.putImageData(imageData, 0, 0);
            
            // Note: simple hasDrawn reversion. A blank canvas implies no drawing
            if (this.undoStack.length === 1) { // 1 stack item is the blank initialization
                this.hasDrawn = false;
            }
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            this.undoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
            const imageData = this.redoStack.pop();
            this.ctx.putImageData(imageData, 0, 0);
        }
    }
}
