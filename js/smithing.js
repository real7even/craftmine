// smithing.js - Smelting and Forging Mini-games

window.Smithing = {
    activeTab: 'smelt',

    // Smelting state
    isSmelting: false,
    smeltTemp: 0,
    smeltTarget: 50,
    smeltProgress: 0,
    smeltLoop: null,
    activeOre: null,

    // Forging state
    isForging: false,
    forgeProgress: 0,
    forgeTarget: 5,
    forgeHits: 0,
    forgeLoop: null,
    forgePos: 0,
    forgeDirection: 1,
    activeBar: null,
    activeRecipe: null,

    init: function() {
        this.setupTabs();
        this.renderView();
    },

    setupTabs: function() {
        const tabs = document.querySelectorAll('.smith-tab-btn');
        tabs.forEach(btn => {
            btn.addEventListener('click', () => {
                tabs.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeTab = btn.getAttribute('data-sub');
                this.renderView();
            });
        });
    },

    renderView: function() {
        const container = document.getElementById('smithing-area');
        if(!container) return;

        if(this.activeTab === 'smelt') {
            this.renderSmeltView(container);
        } else {
            this.renderForgeView(container);
        }
    },

    renderSmeltView: function(container) {
        let html = `<h3>Smelt Ores into Bars</h3>
            <p>Requires 3 Ores to make 1 Bar.</p>
            <div class="vein-buttons">`;

        for(let key in State.materials) {
            const mat = State.materials[key];
            const canSmelt = State.ores[key] >= 3;
            html += `<button class="btn vein-btn ${canSmelt ? '' : 'locked'}"
                     ${canSmelt ? `onclick="Smithing.startSmelting('${key}')"` : 'disabled'}
                     style="border-color: ${mat.color}">
                     Smelt ${mat.name}
                     <br><small>Have: ${State.ores[key]} / 3</small>
                     </button>`;
        }
        html += `</div>`;
        container.innerHTML = html;
    },

    renderForgeView: function(container) {
        let html = `<h3>Forge Bars into Gear</h3>
            <div class="forge-recipes">`;

        const recipes = [
            { id: 'sword', name: 'Sword', type: 'weapon', cost: 2 },
            { id: 'chestplate', name: 'Chestplate', type: 'armor', cost: 3 }
        ];

        for(let key in State.materials) {
            const mat = State.materials[key];
            if(State.bars[key] > 0) {
                html += `<div class="material-group" style="border-left: 4px solid ${mat.color}; padding-left: 10px; margin-bottom: 20px;">
                    <h4>${mat.name} Bars (${State.bars[key]})</h4>
                    <div class="vein-buttons">`;

                recipes.forEach(r => {
                    const canForge = State.bars[key] >= r.cost;
                    html += `<button class="btn vein-btn ${canForge ? '' : 'locked'}"
                            ${canForge ? `onclick="Smithing.startForging('${key}', '${r.id}', '${r.name}', '${r.type}', ${r.cost})"` : 'disabled'}>
                            Forge ${mat.name} ${r.name}
                            <br><small>Cost: ${r.cost} Bars</small>
                            </button>`;
                });

                html += `</div></div>`;
            }
        }

        if(Object.values(State.bars).every(b => b === 0)) {
            html += `<p>You don't have any bars to forge. Go smelt some ore!</p>`;
        }

        html += `</div>`;
        container.innerHTML = html;
    },

    // --- SMELTING MINI-GAME ---

    startSmelting: function(oreKey) {
        if(State.ores[oreKey] < 3) return;

        this.activeOre = oreKey;
        this.isSmelting = true;
        this.smeltTemp = 0;
        this.smeltProgress = 0;

        const modal = document.getElementById('minigame-modal');
        const mgContainer = document.getElementById('minigame-container');
        const closeBtn = document.getElementById('close-minigame');

        modal.classList.remove('hidden');
        closeBtn.classList.remove('hidden');
        closeBtn.onclick = () => this.cancelSmelting();

        mgContainer.innerHTML = `
            <h3>Smelting ${State.materials[oreKey].name}</h3>
            <p>Click repeatedly to keep the temperature in the green zone!</p>

            <div class="smelt-gauge-container">
                <div class="smelt-target-zone"></div>
                <div id="smelt-indicator" class="smelt-indicator"></div>
            </div>

            <div style="margin-top: 15px;">Progress: <span id="smelt-progress-text">0</span>%</div>
            <div class="progress-bar-bg" style="width: 100%; height: 10px; background: #333; margin-top: 5px;">
                <div id="smelt-progress-bar" style="width: 0%; height: 100%; background: var(--accent);"></div>
            </div>

            <button class="btn" id="bellows-btn" style="margin-top: 20px; width: 100%; padding: 20px; font-size: 1.2rem;">Use Bellows (Space)</button>
        `;

        document.getElementById('bellows-btn').addEventListener('click', () => this.pumpBellows());

        if(this._smeltKeyHandler) {
            document.removeEventListener('keydown', this._smeltKeyHandler);
        }

        this._smeltKeyHandler = (e) => {
            if(e.code === 'Space' && this.isSmelting) {
                e.preventDefault();
                this.pumpBellows();
            }
        };
        document.addEventListener('keydown', this._smeltKeyHandler);

        this.smeltLoop = requestAnimationFrame(this.updateSmelting.bind(this));
    },

    pumpBellows: function() {
        if(!this.isSmelting) return;
        this.smeltTemp += 15;
        if(this.smeltTemp > 100) this.smeltTemp = 100;
    },

    updateSmelting: function() {
        if(!this.isSmelting) return;

        // Temperature cools down
        // Higher tier smelter reduces cooldown rate
        const coolRate = 0.5 - (State.upgrades.smelter * 0.05);
        this.smeltTemp -= Math.max(0.2, coolRate);
        if(this.smeltTemp < 0) this.smeltTemp = 0;

        const indicator = document.getElementById('smelt-indicator');
        if(indicator) indicator.style.bottom = this.smeltTemp + '%';

        // Sweet spot is 40% to 60%
        if(this.smeltTemp >= 40 && this.smeltTemp <= 60) {
            this.smeltProgress += 0.5;
            indicator.style.backgroundColor = 'var(--success)';
        } else {
            indicator.style.backgroundColor = 'var(--danger)';
        }

        document.getElementById('smelt-progress-text').innerText = Math.floor(this.smeltProgress);
        document.getElementById('smelt-progress-bar').style.width = this.smeltProgress + '%';

        if(this.smeltProgress >= 100) {
            this.completeSmelting();
            return; // Stop loop
        }

        this.smeltLoop = requestAnimationFrame(this.updateSmelting.bind(this));
    },

    cancelSmelting: function() {
        this.isSmelting = false;
        cancelAnimationFrame(this.smeltLoop);
        document.removeEventListener('keydown', this._smeltKeyHandler);

        document.getElementById('minigame-modal').classList.add('hidden');
        document.getElementById('close-minigame').classList.add('hidden');
    },

    completeSmelting: function() {
        this.isSmelting = false;
        cancelAnimationFrame(this.smeltLoop);
        document.removeEventListener('keydown', this._smeltKeyHandler);

        State.ores[this.activeOre] -= 3; // Deduct cost on success
        State.updateUI();

        State.addBar(this.activeOre, 1);
        Utils.spawnFloatingText('+1 ' + State.materials[this.activeOre].name + ' Bar', 'var(--accent)');

        setTimeout(() => {
            document.getElementById('minigame-modal').classList.add('hidden');
            this.renderView();
        }, 1000);
    },

    // --- FORGING MINI-GAME ---

    startForging: function(barKey, recipeId, recipeName, type, cost) {
        if(State.bars[barKey] < cost) return;

        this.activeBar = barKey;
        this.activeRecipe = { id: recipeId, name: recipeName, type: type, cost: cost };
        this.isForging = true;
        this.forgeHits = 0;
        this.forgeProgress = 0;
        this.forgeTarget = 5; // Need 5 successful hits

        const modal = document.getElementById('minigame-modal');
        const mgContainer = document.getElementById('minigame-container');
        const closeBtn = document.getElementById('close-minigame');

        modal.classList.remove('hidden');
        closeBtn.classList.remove('hidden');
        closeBtn.onclick = () => this.cancelForging();

        mgContainer.innerHTML = `
            <h3>Forging ${State.materials[barKey].name} ${recipeName}</h3>
            <p>Strike when the anvil aligns with the target!</p>

            <div style="margin: 10px 0;">Hits: <span id="forge-hits-text">0</span> / ${this.forgeTarget}</div>

            <div class="mining-bar-container" style="height: 60px; border-radius: 10px;">
                <div id="forge-target" class="forge-target"></div>
                <div id="forge-anvil" class="forge-anvil">⚒️</div>
            </div>

            <button class="btn" id="hammer-btn" style="margin-top: 10px; width: 100%; padding: 20px; font-size: 1.2rem;">Strike (Space)</button>
        `;

        this.forgePos = 0;
        this.forgeDirection = 1;

        document.getElementById('hammer-btn').addEventListener('click', () => this.strikeForge());

        if(this._forgeKeyHandler) {
            document.removeEventListener('keydown', this._forgeKeyHandler);
        }

        this._forgeKeyHandler = (e) => {
            if(e.code === 'Space' && this.isForging) {
                e.preventDefault();
                this.strikeForge();
            }
        };
        document.addEventListener('keydown', this._forgeKeyHandler);

        this.forgeLoop = requestAnimationFrame(this.updateForging.bind(this));
    },

    updateForging: function() {
        if(!this.isForging) return;

        const anvil = document.getElementById('forge-anvil');
        if(!anvil) return;

        // Speed modified by anvil upgrade
        const speed = 3 - (State.upgrades.anvil * 0.2);
        this.forgePos += Math.max(1, speed) * this.forgeDirection;

        if (this.forgePos >= 90) {
            this.forgePos = 90;
            this.forgeDirection = -1;
        } else if (this.forgePos <= 0) {
            this.forgePos = 0;
            this.forgeDirection = 1;
        }

        anvil.style.left = this.forgePos + '%';

        this.forgeLoop = requestAnimationFrame(this.updateForging.bind(this));
    },

    strikeForge: function() {
        if(!this.isForging) return;

        // Target is statically in the center for simplicity (40% to 60%)
        // Wide enough to be forgiving, but can be improved
        const hit = this.forgePos >= 40 && this.forgePos <= 50;

        const btn = document.getElementById('hammer-btn');

        if(hit) {
            this.forgeHits++;
            document.getElementById('forge-hits-text').innerText = this.forgeHits;
            btn.style.backgroundColor = 'var(--success)';
            setTimeout(() => btn.style.backgroundColor = '', 150);
            Utils.spawnFloatingText('Clang!', 'var(--accent)');

            if(this.forgeHits >= this.forgeTarget) {
                this.completeForging(true); // true = perfect/success
            }
        } else {
            // Miss! Penalty or fail? Let's just say it resets progress for harshness
            this.forgeHits = 0;
            document.getElementById('forge-hits-text').innerText = this.forgeHits;
            btn.style.backgroundColor = 'var(--danger)';
            setTimeout(() => btn.style.backgroundColor = '', 150);
            Utils.spawnFloatingText('Missed!', 'var(--danger)');
        }
    },

    cancelForging: function() {
        this.isForging = false;
        cancelAnimationFrame(this.forgeLoop);
        document.removeEventListener('keydown', this._forgeKeyHandler);

        document.getElementById('minigame-modal').classList.add('hidden');
        document.getElementById('close-minigame').classList.add('hidden');
    },

    completeForging: function(success) {
        this.isForging = false;
        cancelAnimationFrame(this.forgeLoop);
        document.removeEventListener('keydown', this._forgeKeyHandler);

        if(success) {
            State.bars[this.activeBar] -= this.activeRecipe.cost; // Deduct cost on success
            State.updateUI();
        }

        const mat = State.materials[this.activeBar];

        // Base stat depends on material tier and recipe type
        let statVal = mat.baseStat;
        if(this.activeRecipe.type === 'armor') statVal = Math.floor(statVal * 1.5);

        const gear = {
            name: `${mat.name} ${this.activeRecipe.name}`,
            type: this.activeRecipe.type,
            material: this.activeBar,
            statValue: statVal,
            quality: success ? 'Masterwork' : 'Normal'
        };

        if(success) gear.statValue = Math.floor(gear.statValue * 1.2); // 20% bonus

        State.addGear(gear);
        Utils.spawnFloatingText('Crafted ' + gear.name + '!', 'var(--success)');

        setTimeout(() => {
            document.getElementById('minigame-modal').classList.add('hidden');
            this.renderView();
            State.renderInventoryView(); // update inventory view
        }, 1000);
    }
};
