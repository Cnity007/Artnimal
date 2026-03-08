import { Juice } from './Juice.js';

export class UIManager {
    constructor() {
        this.appContainer = document.getElementById('app-container');
        this.mainMenuState = document.getElementById('main-menu');
        this.drawingState = document.getElementById('drawing-state');
        this.gameState = document.getElementById('game-state');

        // Main Buttons
        this.btnPlay = document.getElementById('btn-play');
        this.btnCredit = document.getElementById('btn-credit');
        this.btnDonate = document.getElementById('btn-donate');
        this.btnQuitMain = document.getElementById('btn-quit-main');

        this.btnMenuIngame = document.getElementById('btn-menu-ingame');
        this.btnCamera = document.getElementById('btn-camera');
        this.btnSurvey = document.getElementById('btn-survey');

        this.btnResume = document.getElementById('btn-resume');
        this.btnHome = document.getElementById('btn-home');
        this.btnSettings = document.getElementById('btn-settings');
        this.btnCreatePaw = document.getElementById('btn-create-paw');
        this.btnConfirmQuit = document.getElementById('btn-confirm-quit');

        // YT Widget & Controls
        this.ytWidget = document.getElementById('record-player-widget');
        this.btnYtAdd = document.getElementById('btn-add-yt');
        this.btnYtSkip = document.getElementById('btn-skip-yt');
        this.btnYtPlay = document.getElementById('btn-play-yt');
        this.btnYtStop = document.getElementById('btn-stop-yt');
        this.ytLinkInput = document.getElementById('yt-link-input');
        this.ytQueueList = document.getElementById('yt-queue-list');

        // Modals
        this.modalOverlay = document.getElementById('modal-overlay');
        this.ingameMenuModal = document.getElementById('ingame-menu-modal');
        this.settingsModal = document.getElementById('settings-modal');
        this.ytQueueModal = document.getElementById('yt-queue-modal');
        this.creditModal = document.getElementById('credit-modal');
        this.donateModal = document.getElementById('donate-modal');
        this.quitModal = document.getElementById('quit-modal');
        this.alertModal = document.getElementById('alert-modal');
        this.animalNameModal = document.getElementById('animal-name-modal');
        this.playWarningModal = document.getElementById('play-warning-modal');
        this.drawBackWarningModal = document.getElementById('draw-back-warning-modal');
        this.questModal = document.getElementById('quest-modal');
        this.screenshotModal = document.getElementById('screenshot-modal');
        this.surveyModal = document.getElementById('survey-modal');
        this.closeModalBtns = document.querySelectorAll('.close-modal');
        this.closeModalDrawBtns = document.querySelectorAll('.close-modal-draw');

        this.canvasCountElem = document.getElementById('canvas-count');
        this.animalNameInput = document.getElementById('animal-name-input');
        this.btnConfirmName = document.getElementById('btn-confirm-name');

        this.btnBackFromDraw = document.getElementById('btn-back-from-draw');
        this.btnConfirmDrawBack = document.getElementById('btn-confirm-draw-back');
        this.btnBackToDraw = document.getElementById('btn-back-to-draw');
        this.btnPlayNormal = document.getElementById('btn-play-normal');
        this.btnPlayJuice = document.getElementById('btn-play-juice');

        this.questWidget = document.getElementById('quest-widget');
        this.questListUI = document.getElementById('quest-list');

        this.btnSaveShot = document.getElementById('btn-save-shot');

        this.gameCanvas = document.getElementById('game-canvas');

        // Zone selectors removed

        // Init Global Volume
        window.DoodleGarden.bgmVol = 0.5;
        window.DoodleGarden.sfxVol = 0.5;

        // Settings inputs
        this.bgmSlider = document.getElementById('bgm-vol');
        this.sfxSlider = document.getElementById('sfx-vol');
        this.juicyToggle = document.getElementById('juicy-toggle');

        this.ytPlayer = null;
        this.ytQueue = [];
        this.currentYtIndex = 0;

        // Setup Initial State
        this.setZone('menu');
        this.bindEvents();

        // Load default BGM automatically on first interaction, via YT iframe if available
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
            this.ytPlayer = new YT.Player('yt-player', {
                height: '200', width: '200', // Matches index.html size
                videoId: 'jfKfPfyJRdk',
                playerVars: {
                    'autoplay': 0, // Browsers block autoplay anyway, requires user interaction
                    'controls': 0,
                    'origin': window.location.origin,
                    'enablejsapi': 1
                },
                events: {
                    'onReady': (e) => this.onPlayerReady(e),
                    'onStateChange': (e) => this.onPlayerStateChange(e),
                    'onError': (e) => this.onPlayerError(e)
                }
            });
        };
    }

    bindEvents() {
        // Main Menu
        this.btnPlay.addEventListener('click', () => {
            this.playClickSound();
            this.openModal(this.playWarningModal);
        });

        if (this.btnPlayNormal) {
            this.btnPlayNormal.addEventListener('click', () => {
                this.playClickSound();
                if (this.juicyToggle && this.juicyToggle.checked) {
                    this.juicyToggle.checked = false;
                    this.juicyToggle.dispatchEvent(new Event('change'));
                }
                this.closeModals();
                this.setZone('land');
                this.switchToGame();
                // trigger timer start event
                window.dispatchEvent(new Event('gameTimerStart'));
            });
        }

        if (this.btnPlayJuice) {
            this.btnPlayJuice.addEventListener('click', () => {
                this.playClickSound();
                if (this.juicyToggle && !this.juicyToggle.checked) {
                    this.juicyToggle.checked = true;
                    this.juicyToggle.dispatchEvent(new Event('change'));
                }
                this.closeModals();
                this.setZone('land');
                this.switchToGame();
                // trigger timer start event
                window.dispatchEvent(new Event('gameTimerStart'));
            });
        }

        this.btnCredit.addEventListener('click', () => { this.playClickSound(); this.openModal(this.creditModal); });
        this.btnDonate.addEventListener('click', () => { this.playClickSound(); this.openModal(this.donateModal); });
        this.btnQuitMain.addEventListener('click', () => {
            this.playClickSound();
            this.isMainQuitFlow = true;
            this.openModal(this.surveyModal);
        });
        this.btnConfirmQuit.addEventListener('click', () => { this.playClickSound(); window.close(); });

        // In-game Menu
        this.btnMenuIngame.addEventListener('click', () => {
            this.playClickSound();
            window.DoodleGarden.isPaused = true;
            this.openModal(this.ingameMenuModal);
        });

        this.btnResume.addEventListener('click', () => {
            this.playClickSound();
            window.DoodleGarden.isPaused = false;
            this.closeModals();
        });

        this.btnHome.addEventListener('click', () => {
            this.playClickSound();
            window.DoodleGarden.isPaused = false;
            this.closeModals();
            this.setZone('menu');
            this.switchToMain();
        });

        this.btnSettings.addEventListener('click', () => { this.playClickSound(); this.openModal(this.settingsModal); });

        if (this.btnSurvey) {
            this.btnSurvey.addEventListener('click', () => {
                this.playClickSound();
                window.DoodleGarden.isPaused = true;
                this.openModal(this.surveyModal);
            });
        }

        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.playClickSound();
                this.closeModals();

                // Check if in Main Quit Flow and closing the Survey Modal
                if (this.isMainQuitFlow && e.target.closest('#survey-modal')) {
                    this.isMainQuitFlow = false;
                    this.openModal(this.quitModal);
                    return; // Return early so we don't unpause or anything else
                }

                // If closing from ingame menu context without explicitly resuming, stay paused.
                // The user must click "Resume" to unpause. Unless it's just a general modal close.
                // For simplicity, we unpause on close if they were in the game view.
                if (!this.gameState.classList.contains('hidden') && !this.ingameMenuModal.classList.contains('hidden') === false) {
                    window.DoodleGarden.isPaused = false;
                }
            });
        });

        // Drawing Nav
        this.btnCreatePaw.addEventListener('click', () => {
            this.playClickSound();
            if (window.DoodleGarden.canvasCount > 0) {
                this.closeModals();
                window.DoodleGarden.isPaused = false;
                this.switchToDrawing();
            } else {
                this.showAlert("ไม่มี Canvas เหลือแล้ว! ให้อาหารสัตว์เพื่อให้มันคราฟ Canvas ให้สิ"); // No canvas
            }
        });

        // From Drawing Back to Game
        if (this.btnBackFromDraw) {
            this.btnBackFromDraw.addEventListener('click', () => {
                this.playClickSound();
                // We check if drawing has happened in main.js, but UI manager dispatches the intent
                window.dispatchEvent(new Event('requestDrawBack'));
            });
        }

        if (this.btnConfirmDrawBack) {
            this.btnConfirmDrawBack.addEventListener('click', () => {
                this.playClickSound();
                this.closeModals();
                window.dispatchEvent(new Event('confirmDrawBack'));
            });
        }

        if (this.closeModalDrawBtns) {
            this.closeModalDrawBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.playClickSound();
                    this.closeModals();
                });
            });
        }

        // Animal Naming Callback setup (will be overridden by main.js)
        this.onConfirmName = null;
        this.btnConfirmName.addEventListener('click', () => {
            this.playClickSound();
            const name = this.animalNameInput.value.trim() || 'นิรนาม';
            if (this.onConfirmName) {
                this.onConfirmName(name);
            }
            this.closeModals();
            this.animalNameInput.value = '';
        });

        if (this.btnBackToDraw) {
            this.btnBackToDraw.addEventListener('click', () => {
                this.playClickSound();
                this.closeModals();
                this.switchToDrawing();
                this.animalNameInput.value = '';
            });
        }

        // Quests
        this.questWidget.addEventListener('click', () => {
            this.playClickSound();
            window.dispatchEvent(new Event('requestQuestUpdate'));
            this.openModal(this.questModal);
        });

        // Screenshot functionality
        this.btnCamera.addEventListener('click', () => {
            this.playClickSound();
            this.takeScreenshot();
        });

        this.btnSaveShot.addEventListener('click', () => {
            this.playClickSound();
            const img = document.getElementById('screenshot-preview');
            const link = document.createElement('a');
            link.download = `own_farm_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.png`;
            link.href = img.src;
            link.click();
            this.closeModals();
        });

        // Settings Listeners
        this.juicyToggle.addEventListener('change', (e) => {
            this.playClickSound();
            window.DoodleGarden.isJuicy = e.target.checked;
            if (e.target.checked) {
                document.body.classList.add('juicy-mode');
                Juice.play('tada');
                if (!this.gameState.classList.contains('hidden')) {
                    this.ytWidget.classList.remove('hidden');
                }

                if (this.ytPlayer && this.ytPlayer.playVideo) {
                    this.ytPlayer.playVideo();
                }
            } else {
                document.body.classList.remove('juicy-mode');
                this.ytWidget.classList.add('hidden');

                if (this.ytPlayer && this.ytPlayer.pauseVideo) {
                    this.ytPlayer.pauseVideo();
                }
            }
        });

        this.bgmSlider.addEventListener('input', (e) => {
            window.DoodleGarden.bgmVol = e.target.value / 100;
            if (this.ytPlayer && this.ytPlayer.setVolume) {
                this.ytPlayer.setVolume(e.target.value);
            }
        });

        this.sfxSlider.addEventListener('input', (e) => {
            window.DoodleGarden.sfxVol = e.target.value / 100;
        });

        // Cheat Mode
        this.btnCheatMode = document.getElementById('btn-cheat-mode');
        if (this.btnCheatMode) {
            this.btnCheatMode.addEventListener('click', () => {
                this.playClickSound();
                const pin = prompt('Enter 4-digit PIN:');
                if (pin === '1919') {
                    window.DoodleGarden.totalAnimalsSpawned = Math.max(window.DoodleGarden.totalAnimalsSpawned, 20);
                    window.DoodleGarden.maxColorsUsed = Math.max(window.DoodleGarden.maxColorsUsed, 10);
                    window.DoodleGarden.totalFoodsDropped = Math.max(window.DoodleGarden.totalFoodsDropped, 1000);
                    window.DoodleGarden.maxAnimalLevel = Math.max(window.DoodleGarden.maxAnimalLevel || 0, 10);
                    window.dispatchEvent(new Event('requestQuestUpdate'));
                    alert('Cheat Activated: All Quests Completed!');
                } else if (pin === '1008') {
                    window.DoodleGarden.rainbowCheatTimer = 1800; // 30 seconds at 60fps
                    alert('Rainbow Mode Activated! Foods are super effective for 30 seconds.');
                } else if (pin !== null) {
                    alert('Invalid PIN!');
                }
            });
        }

        window.addEventListener('inventoryChanged', () => {
            this.canvasCountElem.innerText = window.DoodleGarden.canvasCount;
        });

        // YouTube Widget Controls
        this.ytWidget.addEventListener('click', () => {
            this.playClickSound();
            this.openModal(this.ytQueueModal);
        });

        this.btnYtAdd.addEventListener('click', () => {
            this.playClickSound();
            const url = this.ytLinkInput.value;

            // Better Regex for extracting YT ID from various formats
            const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);

            if (match && match[2].length === 11) {
                const id = match[2];

                // Fetch title from noembed (public oEmbed endpoint)
                fetch(`https://noembed.com/embed?dataType=json&url=https://www.youtube.com/watch?v=${id}`)
                    .then(res => res.json())
                    .then(data => {
                        const title = data.title || `Unknown Song (${id})`;
                        this.ytQueue.push({ id, title });
                        this.updateQueueUI();
                        if (this.ytQueue.length === 1) {
                            this.playYt(0); // auto play first
                        }
                    })
                    .catch(() => {
                        this.ytQueue.push({ id, title: `Song (${id})` });
                        this.updateQueueUI();
                        if (this.ytQueue.length === 1) this.playYt(0);
                    });

                this.ytLinkInput.value = '';
            } else {
                this.showAlert("ลิงก์ YouTube ไม่ถูกต้อง! ลองใช้ของรูปแบบ youtube.com/watch?v= หรือ youtu.be/...");
            }
        });

        this.btnYtSkip.addEventListener('click', () => {
            this.playClickSound();
            if (this.ytQueue.length > 0) {
                this.currentYtIndex = (this.currentYtIndex + 1) % this.ytQueue.length;
                this.playYt(this.currentYtIndex);
            }
        });

        this.btnYtPlay.addEventListener('click', () => {
            this.playClickSound();
            if (this.ytPlayer && this.ytPlayer.playVideo) {
                this.ytPlayer.playVideo();
            }
        });

        this.btnYtStop.addEventListener('click', () => {
            this.playClickSound();
            if (this.ytPlayer && this.ytPlayer.pauseVideo) {
                this.ytPlayer.pauseVideo();
            }
        });

        window.addEventListener('gameStateActive', () => {
            if (window.DoodleGarden.isJuicy) this.ytWidget.classList.remove('hidden');
            this.questWidget.classList.remove('hidden');
        });
    }

    takeScreenshot() {
        // 1. Hide UI elements temporarily
        const uiElements = [
            document.getElementById('top-left-ui'),
            document.getElementById('create-paw-container'),
            document.getElementById('ending-overlay')
        ].filter(el => el !== null);

        uiElements.forEach(el => el.classList.add('hide-ui'));

        // Allow DOM to update before capturing
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // 2. Play flash effect if Juicy
                if (window.DoodleGarden.isJuicy) {
                    Juice.play('tada');
                    const flash = document.getElementById('flash-effect');
                    flash.classList.remove('hidden');
                    flash.classList.add('flash-anim');
                    setTimeout(() => {
                        flash.classList.remove('flash-anim');
                        flash.classList.add('hidden');
                    }, 500);
                }

                // 3. Capture canvas
                // Since game-canvas doesn't have the background color drawn on it, we might need to composite it
                // We'll create a temporary canvas to draw the background and the game canvas
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = this.gameCanvas.width;
                tempCanvas.height = this.gameCanvas.height;
                const topCtx = tempCanvas.getContext('2d');

                // Fill with correct background based on zone (which now includes grid-bg visually, but we just draw plain color as base)
                const appContainer = document.getElementById('app-container');
                const bgColor = window.getComputedStyle(appContainer).backgroundColor;
                topCtx.fillStyle = bgColor;
                topCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                // Re-draw the grid lines if we want them in the screenshot
                topCtx.strokeStyle = 'rgba(52, 152, 219, 0.2)';
                topCtx.lineWidth = 1;
                for (let x = 0; x < tempCanvas.width; x += 30) {
                    topCtx.beginPath(); topCtx.moveTo(x, 0); topCtx.lineTo(x, tempCanvas.height); topCtx.stroke();
                }
                for (let y = 0; y < tempCanvas.height; y += 30) {
                    topCtx.beginPath(); topCtx.moveTo(0, y); topCtx.lineTo(tempCanvas.width, y); topCtx.stroke();
                }

                // Draw game canvas over it (this draws the contents of the viewport, but what if the canvas itself is oversized?)
                // Actually this.gameCanvas is sized to the window viewport. So we don't need to crop further.
                // However, on mobile the canvas might have dpr scaling, but width/height attributes handle that.
                topCtx.drawImage(this.gameCanvas, 0, 0);

                const dataUrl = tempCanvas.toDataURL('image/png');
                document.getElementById('screenshot-preview').src = dataUrl;

                // 4. Restore UI
                uiElements.forEach(el => el.classList.remove('hide-ui'));

                // Hide YT widget if not juicy
                if (!window.DoodleGarden.isJuicy) {
                    this.ytWidget.classList.add('hidden');
                }

                // 5. Open Modal
                this.openModal(this.screenshotModal);
            });
        });
    }

    onPlayerReady(event) {
        event.target.setVolume(this.bgmSlider.value);
        // We do NOT playVideo here because browsers block it without interaction.
        // It will wait for the user to click the "Juicy Mode" toggle or a play button.
    }

    onPlayerError(event) {
        console.error("YouTube Player Error:", event.data);
        // 2: invalid param, 5: html5 error, 100: not found, 101/150: embedded playback disabled
        if (event.data === 101 || event.data === 150) {
            this.showAlert("เจ้าของวิดีโอนี้ไม่อนุญาตให้เล่นวิดีโอในเว็บไซต์ภายนอก ลองเปลี่ยนเป็นเพลงอื่นดูน้า!");
        } else {
            this.showAlert("เกิดข้อผิดพลาดในการโหลดวิดีโอ YouTube (" + event.data + ")");
        }
    }

    onPlayerStateChange(event) {
        const icon = document.querySelector('.vinyl-disc');
        if (event.data === YT.PlayerState.PLAYING) {
            if (icon) icon.classList.add('playing');
        } else {
            if (icon) icon.classList.remove('playing');
        }

        // UNSTARTED often happens when browser blocks autoplay
        if (event.data === YT.PlayerState.UNSTARTED) {
            console.log("YouTube Player is unstarted (likely blocked waiting for interaction).");
        }

        if (event.data === YT.PlayerState.ENDED) {
            if (this.ytQueue.length > 0) {
                this.currentYtIndex = (this.currentYtIndex + 1) % this.ytQueue.length;
                this.playYt(this.currentYtIndex);
            } else {
                // Loop default
                event.target.playVideo();
            }
        }
    }

    playYt(index) {
        if (!this.ytPlayer || this.ytQueue.length === 0) return;
        const song = this.ytQueue[index];
        this.ytPlayer.loadVideoById(song.id);
        this.updateQueueUI(); // to show playing indicator correctly
    }

    updateQueueUI() {
        this.ytQueueList.innerHTML = '';
        this.ytQueue.forEach((song, idx) => {
            const div = document.createElement('div');
            div.className = 'queue-item';

            const textSpan = document.createElement('span');
            textSpan.innerText = `${idx + 1}. ${song.title} ${idx === this.currentYtIndex ? '🎵(Playing)' : ''}`;

            const btnDel = document.createElement('button');
            btnDel.className = 'btn-delete-yt doodle-btn';
            btnDel.innerText = 'X';
            btnDel.onclick = () => {
                this.playClickSound();
                this.ytQueue.splice(idx, 1);
                // If deleted playing song, play next or stop
                if (idx === this.currentYtIndex) {
                    if (this.ytQueue.length > 0) {
                        this.currentYtIndex = this.currentYtIndex % this.ytQueue.length;
                        this.playYt(this.currentYtIndex);
                    } else {
                        if (this.ytPlayer.pauseVideo) this.ytPlayer.pauseVideo();
                    }
                } else if (idx < this.currentYtIndex) {
                    this.currentYtIndex--;
                }
                this.updateQueueUI();
            };

            div.appendChild(textSpan);
            div.appendChild(btnDel);
            this.ytQueueList.appendChild(div);
        });
    }

    playClickSound() {
        if (window.DoodleGarden.isJuicy) {
            Juice.play('click');
        }
    }

    openModal(modalElem) {
        this.modalOverlay.classList.remove('hidden');
        this.ingameMenuModal.classList.add('hidden');
        this.settingsModal.classList.add('hidden');
        this.ytQueueModal.classList.add('hidden');
        this.creditModal.classList.add('hidden');
        this.donateModal.classList.add('hidden');
        this.quitModal.classList.add('hidden');
        this.alertModal.classList.add('hidden');
        this.animalNameModal.classList.add('hidden');
        if (this.playWarningModal) this.playWarningModal.classList.add('hidden');
        if (this.drawBackWarningModal) this.drawBackWarningModal.classList.add('hidden');
        this.questModal.classList.add('hidden');
        this.screenshotModal.classList.add('hidden');
        if (this.surveyModal) this.surveyModal.classList.add('hidden');

        modalElem.classList.remove('hidden');
        if (window.DoodleGarden.isJuicy) {
            Juice.play('pop');
        }
    }

    closeModals() {
        this.modalOverlay.classList.add('hidden');
    }

    showAlert(msg) {
        document.getElementById('alert-msg').innerText = msg;
        this.openModal(this.alertModal);
    }

    setZone(zone) {
        if (zone !== 'menu') {
            window.DoodleGarden.currentZone = zone;
        }

        // Apply zone class and grid-bg for non-menu zones
        this.appContainer.className = `zone-${zone} ${zone !== 'menu' ? 'grid-bg' : ''}`;

        if (zone !== 'menu') {
            window.dispatchEvent(new CustomEvent('zoneChanged', { detail: { zone } }));
        }
    }

    switchToMain() {
        this.drawingState.classList.add('hidden');
        this.gameState.classList.add('hidden');
        this.mainMenuState.classList.remove('hidden');
        this.ytWidget.classList.add('hidden');
        this.questWidget.classList.add('hidden');
    }

    switchToGame() {
        this.mainMenuState.classList.add('hidden');
        this.drawingState.classList.add('hidden');
        this.gameState.classList.remove('hidden');
        window.dispatchEvent(new Event('gameStateActive'));
    }

    switchToDrawing() {
        this.mainMenuState.classList.add('hidden');
        this.gameState.classList.add('hidden');
        this.drawingState.classList.remove('hidden');
        this.ytWidget.classList.add('hidden'); // Hide widget when drawing
        this.questWidget.classList.add('hidden');
        window.dispatchEvent(new Event('drawingStateActive'));
    }
}
