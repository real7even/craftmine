// combat.js - Turn-based Adventuring

window.Combat = {
    inCombat: false,
    currentStage: null,
    playerHp: 0,
    enemyHp: 0,
    enemyDefending: false,
    playerDefending: false,

    stages: [
        { id: 1, name: "Goblin Caves", fee: 10, enemy: { name: "Goblin Scrapper", hp: 30, attack: 4, defense: 1, reward: 25 } },
        { id: 2, name: "Orc Stronghold", fee: 50, enemy: { name: "Orc Bruiser", hp: 80, attack: 12, defense: 4, reward: 100 } },
        { id: 3, name: "Undead Crypts", fee: 150, enemy: { name: "Skeleton Knight", hp: 150, attack: 25, defense: 12, reward: 350 } },
        { id: 4, name: "Dragon Peak", fee: 500, enemy: { name: "Lesser Drake", hp: 400, attack: 60, defense: 30, reward: 1200 } }
    ],

    init: function() {
        document.querySelector('[data-target="view-adventure"]').addEventListener('click', () => {
            if(!this.inCombat) this.renderStageSelect();
        });
        this.renderStageSelect();
    },

    renderStageSelect: function() {
        const container = document.getElementById('adventure-area');
        if(!container) return;

        let html = `<h3>Select Adventure Stage</h3>
            <p>Pay the adventure fee to fight monsters and earn gold!</p>
            <div class="stage-list" style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">`;

        this.stages.forEach(stage => {
            const canAfford = State.gold >= stage.fee;
            html += `<div class="stage-card" style="background: var(--bg-panel-light); padding: 15px; border-left: 4px solid var(--danger); border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4>Stage ${stage.id}: ${stage.name}</h4>
                    <p>Enemy: ${stage.enemy.name} (HP: ${stage.enemy.hp} | ATK: ${stage.enemy.attack} | DEF: ${stage.enemy.defense})</p>
                    <p>Fee: 🪙 ${stage.fee} | Reward: 🪙 ${stage.enemy.reward}</p>
                </div>
                <button class="btn ${canAfford ? '' : 'locked'}"
                    onclick="Combat.startCombat(${stage.id})" ${canAfford ? '' : 'disabled'}>
                    Embark (🪙 ${stage.fee})
                </button>
            </div>`;
        });

        html += `</div>`;
        container.innerHTML = html;
    },

    startCombat: function(stageId) {
        const stage = this.stages.find(s => s.id === stageId);
        if(!stage || State.gold < stage.fee) return;

        State.gold -= stage.fee;
        State.updateUI();

        this.currentStage = JSON.parse(JSON.stringify(stage)); // Deep copy enemy stats
        this.playerHp = State.stats.maxHp;
        this.enemyHp = this.currentStage.enemy.hp;
        this.inCombat = true;
        this.playerDefending = false;
        this.enemyDefending = false;

        this.renderCombatView();
    },

    renderCombatView: function() {
        const container = document.getElementById('adventure-area');
        if(!container) return;

        const playerHpPct = Math.max(0, (this.playerHp / State.stats.maxHp) * 100);
        const enemyHpPct = Math.max(0, (this.enemyHp / this.currentStage.enemy.hp) * 100);

        let html = `<div class="combat-arena" style="background: #222; padding: 20px; border-radius: 10px; border: 2px solid #444;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">

                <!-- Player Side -->
                <div class="combatant player-side" style="width: 45%;">
                    <h4>You (ATK: ${State.stats.attack} | DEF: ${State.stats.defense})</h4>
                    <div style="font-size: 3rem; margin: 10px 0;">🛡️⚔️</div>
                    <div class="hp-bar-bg" style="width: 100%; height: 20px; background: #555; border-radius: 10px; overflow: hidden;">
                        <div style="width: ${playerHpPct}%; height: 100%; background: var(--success); transition: width 0.3s;"></div>
                    </div>
                    <p id="player-hp-text">${this.playerHp} / ${State.stats.maxHp} HP</p>
                </div>

                <div style="display: flex; align-items: center; font-size: 2rem; font-weight: bold; color: var(--danger);">VS</div>

                <!-- Enemy Side -->
                <div class="combatant enemy-side" style="width: 45%; text-align: right;">
                    <h4>${this.currentStage.enemy.name} (ATK: ${this.currentStage.enemy.attack} | DEF: ${this.currentStage.enemy.defense})</h4>
                    <div style="font-size: 3rem; margin: 10px 0;" id="enemy-sprite">👹</div>
                    <div class="hp-bar-bg" style="width: 100%; height: 20px; background: #555; border-radius: 10px; overflow: hidden;">
                        <div style="width: ${enemyHpPct}%; height: 100%; background: var(--danger); transition: width 0.3s; float: right;"></div>
                    </div>
                    <p id="enemy-hp-text">${this.enemyHp} / ${this.currentStage.enemy.hp} HP</p>
                </div>

            </div>

            <!-- Combat Log -->
            <div id="combat-log" style="height: 100px; overflow-y: auto; background: #111; padding: 10px; border: 1px solid #333; margin-bottom: 20px; font-family: monospace; font-size: 0.9rem;">
                Battle started against ${this.currentStage.enemy.name}!
            </div>

            <!-- Action Buttons -->
            <div class="combat-actions" style="display: flex; gap: 10px; justify-content: center;">
                <button class="btn" onclick="Combat.playerTurn('attack')" id="btn-atk" style="font-size: 1.2rem; padding: 10px 30px;">⚔️ Attack</button>
                <button class="btn" onclick="Combat.playerTurn('defend')" id="btn-def" style="font-size: 1.2rem; padding: 10px 30px;">🛡️ Defend</button>
            </div>
        </div>`;

        container.innerHTML = html;
        // Scroll log to bottom
        const log = document.getElementById('combat-log');
        log.scrollTop = log.scrollHeight;
    },

    logMessage: function(msg, color = 'var(--text-main)') {
        const log = document.getElementById('combat-log');
        if(!log) return;
        const div = document.createElement('div');
        div.style.color = color;
        div.innerText = msg;
        log.appendChild(div);
        log.scrollTop = log.scrollHeight;
    },

    toggleButtons: function(disabled) {
        const atk = document.getElementById('btn-atk');
        const def = document.getElementById('btn-def');
        if(atk) atk.disabled = disabled;
        if(def) def.disabled = disabled;
    },

    playerTurn: function(action) {
        if(!this.inCombat) return;

        this.toggleButtons(true);
        this.playerDefending = (action === 'defend');

        if(action === 'attack') {
            // Damage calc: Atk - (Enemy Def * (Enemy Defending ? 2 : 1))
            let effDef = this.currentStage.enemy.defense * (this.enemyDefending ? 2 : 1);
            let dmg = Math.max(1, State.stats.attack - effDef);

            // Add a little randomness (±20%)
            dmg = Math.floor(dmg * (0.8 + Math.random() * 0.4));

            this.enemyHp -= dmg;
            this.logMessage(`You attacked for ${dmg} damage!`, 'var(--success)');

            // Basic animation
            const sprite = document.getElementById('enemy-sprite');
            if(sprite) {
                sprite.style.transform = 'translateX(10px)';
                setTimeout(() => sprite.style.transform = 'translateX(0)', 100);
            }
        } else {
            this.logMessage(`You take a defensive stance!`, 'var(--accent)');
        }

        this.renderCombatView();

        if(this.enemyHp <= 0) {
            this.endCombat(true);
        } else {
            // Enemy turn after delay
            setTimeout(() => this.enemyTurn(), 1000);
        }
    },

    enemyTurn: function() {
        if(!this.inCombat || this.enemyHp <= 0) return;

        // Simple enemy AI: 20% chance to defend, 80% to attack
        const action = Math.random() < 0.2 ? 'defend' : 'attack';
        this.enemyDefending = (action === 'defend');

        if(action === 'attack') {
            let effDef = State.stats.defense * (this.playerDefending ? 2 : 1);
            let dmg = Math.max(1, this.currentStage.enemy.attack - effDef);
            dmg = Math.floor(dmg * (0.8 + Math.random() * 0.4));

            this.playerHp -= dmg;
            this.logMessage(`${this.currentStage.enemy.name} attacks for ${dmg} damage!`, 'var(--danger)');
        } else {
            this.logMessage(`${this.currentStage.enemy.name} guards!`, '#aaa');
        }

        this.renderCombatView();

        if(this.playerHp <= 0) {
            this.endCombat(false);
        } else {
            this.toggleButtons(false); // Enable player buttons
        }
    },

    endCombat: function(playerWon) {
        this.inCombat = false;

        setTimeout(() => {
            const modal = document.getElementById('minigame-modal');
            const mgContainer = document.getElementById('minigame-container');
            const closeBtn = document.getElementById('close-minigame');

            modal.classList.remove('hidden');
            closeBtn.classList.remove('hidden');

            if(playerWon) {
                State.addGold(this.currentStage.enemy.reward);
                mgContainer.innerHTML = `
                    <h2 style="color: var(--success); font-size: 2.5rem; margin-bottom: 20px;">Victory! 🏆</h2>
                    <p style="font-size: 1.2rem;">You defeated the <strong>${this.currentStage.enemy.name}</strong>!</p>
                    <p style="font-size: 1.5rem; color: var(--accent); margin-top: 20px;">Reward: 🪙 ${this.currentStage.enemy.reward}</p>
                `;
            } else {
                mgContainer.innerHTML = `
                    <h2 style="color: var(--danger); font-size: 2.5rem; margin-bottom: 20px;">Defeat 💀</h2>
                    <p style="font-size: 1.2rem;">The <strong>${this.currentStage.enemy.name}</strong> knocked you out.</p>
                    <p style="margin-top: 20px; color: var(--text-muted);">You fled to safety, but lost the adventure fee.</p>
                `;
            }

            closeBtn.innerText = "Return to Map";
            closeBtn.onclick = () => {
                modal.classList.add('hidden');
                closeBtn.innerText = "Leave"; // Reset for other uses
                this.renderStageSelect();
            };

        }, 500);
    }
};
