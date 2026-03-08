import { UIManager } from './UIManager.js';
import { DrawingEditor } from './DrawingEditor.js';
import { Game } from './Game.js';
import { Juice } from './Juice.js';

// Global context
window.DoodleGarden = {
    isJuicy: false,
    currentZone: 'menu', // land, water, sky, menu
    canvasCount: 1,      // Initial canvas inventory
    totalAnimalsSpawned: 0,
    totalFoodsDropped: 0,
    maxColorsUsed: 0,
    maxAnimalLevel: 0,
    rainbowCheatTimer: 0
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize toggles
    const juicyToggle = document.getElementById('juicy-toggle');
    juicyToggle.addEventListener('change', (e) => {
        window.DoodleGarden.isJuicy = e.target.checked;
        if (e.target.checked) {
            document.body.classList.add('juicy-mode');
            Juice.play('tada'); // Initial feedback sound
            Juice.play('pop');
        } else {
            document.body.classList.remove('juicy-mode');
        }
    });

    // Subsystems
    const uiManager = new UIManager();
    const game = new Game();
    const drawingEditor = new DrawingEditor((animalData, hasDrawn, colorsUsed) => {
        if (!hasDrawn) {
            uiManager.showAlert("ต้องวาดอะไรสักอย่างก่อนนะเจ้าของฟาร์ม!");
            return;
        }
        // Open Name Modal instead of saving immediately
        uiManager.openModal(uiManager.animalNameModal);
        
        // Set up the callback for when the user confirms the name
        uiManager.onConfirmName = (petName) => {
            // Update global stats for achievements
            window.DoodleGarden.maxColorsUsed = Math.max(window.DoodleGarden.maxColorsUsed, colorsUsed);
            window.DoodleGarden.canvasCount--;
            window.DoodleGarden.totalAnimalsSpawned++;
            window.dispatchEvent(new Event('inventoryChanged'));
            
            game.addAnimal(animalData, petName);
            uiManager.switchToGame();
        };
    });

    // Handle back logic from the drawing editor to the game
    window.addEventListener('requestDrawBack', () => {
        if (drawingEditor.hasDrawn) {
            // Show warning if dirty
            uiManager.openModal(uiManager.drawBackWarningModal);
        } else {
            // Clean, just go back
            uiManager.switchToGame();
        }
    });

    window.addEventListener('confirmDrawBack', () => {
        // Confirmed discard
        drawingEditor.clearCanvas(true);
        uiManager.switchToGame();
    });
});
