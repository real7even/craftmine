// mining.js - "Combo Strike" Mini-game

window.Mining = {
    combo: 0,
    activeMaterial: 'copper',
    gameLoop: null,
    crosshairPos: 0,
    direction: 1, // 1 for right, -1 for left
    weakPointStart: 0,
    weakPointEnd: 0,
    baseSpeed: 2,
    isPlaying: false,

    init: function() {
        this.renderMiningView();
    },

    renderMiningView: function() {
        const container = document.getElementById('mining-area');
        if(!container) return;

        let html = `<div class="material-selector">
            <h3>Select Vein</h3>
            <div class="vein-buttons">`;

        for(let key in State.materials) {
            const mat = State.materials[key];
            // Simple unlock logic based on pickaxe upgrade
            const isUnlocked = State.upgrades.pickaxe >= mat.tier;
            html += `<button class="btn vein-btn ${isUnlocked ? '' : 'locked'}"
                     ${isUnlocked ? `onclick="Mining.startMiniGame('${key}')"` : 'disabled'}
                     style="border-color: ${mat.color}">
                     ${mat.name} Ore
                     ${!isUnlocked ? '<br><small>Requires Pickaxe Tier ' + mat.tier + '</small>' : ''}
                     </button>`;
        }

        html += `</div></div>`;
        container.innerHTML = html;
    },

    startMiniGame: function(materialKey) {
        this.activeMaterial = materialKey;
        this.combo = 0;
        this.isPlaying = true;

        const modal = document.getElementById('minigame-modal');
        const mgContainer = document.getElementById('minigame-container');
        const closeBtn = document.getElementById('close-minigame');

        modal.classList.remove('hidden');
        closeBtn.classList.remove('hidden');
        closeBtn.onclick = () => this.stopMiniGame();

        const mat = State.materials[this.activeMaterial];

        mgContainer.innerHTML = `
            <h3>Mining ${mat.name} Vein</h3>
            <div id="combo-meter">Combo: <span>0</span>x</div>
            <div class="mining-bar-container">
                <div id="weak-point" class="weak-point"></div>
                <div id="crosshair" class="crosshair"></div>
            </div>
            <button class="btn" id="strike-btn">Strike! (Spacebar)</button>
        `;

        this.generateWeakPoint();
        this.crosshairPos = 0;
        this.direction = 1;

        document.getElementById('strike-btn').addEventListener('click', () => this.strike());

        // Setup keyboard listener
        this._keydownHandler = (e) => {
            if(e.code === 'Space' && this.isPlaying) {
                e.preventDefault();
                this.strike();
            }
        };
        document.addEventListener('keydown', this._keydownHandler);

        this.gameLoop = requestAnimationFrame(this.update.bind(this));
    },

    stopMiniGame: function() {
        this.isPlaying = false;
        cancelAnimationFrame(this.gameLoop);
        document.removeEventListener('keydown', this._keydownHandler);

        document.getElementById('minigame-modal').classList.add('hidden');
        document.getElementById('close-minigame').classList.add('hidden');
    },

    generateWeakPoint: function() {
        // Base width depends on pickaxe upgrade vs material tier.
        // Higher tier materials have smaller weak points by default.
        const tierDiff = State.upgrades.pickaxe - State.materials[this.activeMaterial].tier;
        let widthPercentage = 15 + (tierDiff * 5); // 15% base width
        if(widthPercentage < 5) widthPercentage = 5;
        if(widthPercentage > 40) widthPercentage = 40;

        // Position between 10% and (90% - width)
        const maxStart = 100 - widthPercentage;
        this.weakPointStart = Math.random() * (maxStart - 10) + 10;
        this.weakPointEnd = this.weakPointStart + widthPercentage;

        const wpElement = document.getElementById('weak-point');
        if(wpElement) {
            wpElement.style.left = this.weakPointStart + '%';
            wpElement.style.width = widthPercentage + '%';
        }
    },

    update: function() {
        if(!this.isPlaying) return;

        const crosshair = document.getElementById('crosshair');
        if(!crosshair) return;

        // Speed increases slightly with combo
        const speed = this.baseSpeed + (this.combo * 0.2);

        this.crosshairPos += speed * this.direction;

        if (this.crosshairPos >= 100) {
            this.crosshairPos = 100;
            this.direction = -1;
        } else if (this.crosshairPos <= 0) {
            this.crosshairPos = 0;
            this.direction = 1;
        }

        crosshair.style.left = this.crosshairPos + '%';

        this.gameLoop = requestAnimationFrame(this.update.bind(this));
    },

    strike: function() {
        if(!this.isPlaying) return;

        const hit = this.crosshairPos >= this.weakPointStart && this.crosshairPos <= this.weakPointEnd;

        const strikeBtn = document.getElementById('strike-btn');

        if (hit) {
            this.combo++;
            // Calculate reward: base 1, +1 for every 5 combo
            const amount = 1 + Math.floor(this.combo / 5);
            State.addOre(this.activeMaterial, amount);

            // Visual feedback
            strikeBtn.style.backgroundColor = 'var(--success)';
            setTimeout(() => strikeBtn.style.backgroundColor = '', 150);
            Utils.spawnFloatingText('+ ' + amount + ' ' + State.materials[this.activeMaterial].name, 'var(--success)');

            document.querySelector('#combo-meter span').innerText = this.combo;
            this.generateWeakPoint();
        } else {
            this.combo = 0;
            document.querySelector('#combo-meter span').innerText = this.combo;

            // Visual feedback
            strikeBtn.style.backgroundColor = 'var(--danger)';
            setTimeout(() => strikeBtn.style.backgroundColor = '', 150);
            Utils.spawnFloatingText('Miss!', 'var(--danger)');
        }
    }
};
