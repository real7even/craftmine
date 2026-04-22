// shop.js - Economy and Upgrades

window.Shop = {
    init: function() {
        // Will be called by main.js, or can re-render on active tab
        document.querySelector('[data-target="view-shop"]').addEventListener('click', () => {
            this.renderView();
        });
        // Initial render just in case
        this.renderView();
    },

    renderView: function() {
        const container = document.getElementById('shop-area');
        if(!container) return;

        let html = `<div style="display: flex; gap: 40px;">`;

        // --- UPGRADES SECTION ---
        html += `<div class="upgrades-section" style="flex: 1;">
            <h3>Tool Upgrades</h3>
            <p>Spend gold to improve your tools.</p>
            <div class="upgrade-list">`;

        // Pickaxe
        const pickaxeCost = this.getUpgradeCost(State.upgrades.pickaxe);
        html += `<div class="upgrade-item">
            <h4>Pickaxe (Tier ${State.upgrades.pickaxe})</h4>
            <p>Increases weak point size and unlocks higher tier ores.</p>
            <button class="btn ${State.gold >= pickaxeCost ? '' : 'locked'}"
                onclick="Shop.buyUpgrade('pickaxe')" ${State.gold >= pickaxeCost ? '' : 'disabled'}>
                Upgrade (🪙 ${pickaxeCost})
            </button>
        </div>`;

        // Smelter
        const smelterCost = this.getUpgradeCost(State.upgrades.smelter);
        html += `<div class="upgrade-item">
            <h4>Smelter (Tier ${State.upgrades.smelter})</h4>
            <p>Reduces temperature cool-down rate.</p>
            <button class="btn ${State.gold >= smelterCost ? '' : 'locked'}"
                onclick="Shop.buyUpgrade('smelter')" ${State.gold >= smelterCost ? '' : 'disabled'}>
                Upgrade (🪙 ${smelterCost})
            </button>
        </div>`;

        // Anvil
        const anvilCost = this.getUpgradeCost(State.upgrades.anvil);
        html += `<div class="upgrade-item">
            <h4>Anvil (Tier ${State.upgrades.anvil})</h4>
            <p>Slows down the forging mini-game.</p>
            <button class="btn ${State.gold >= anvilCost ? '' : 'locked'}"
                onclick="Shop.buyUpgrade('anvil')" ${State.gold >= anvilCost ? '' : 'disabled'}>
                Upgrade (🪙 ${anvilCost})
            </button>
        </div>`;

        html += `</div></div>`;

        // --- SELLING SECTION ---
        html += `<div class="sell-section" style="flex: 1;">
            <h3>Sell Items</h3>
            <p>Sell surplus materials and gear for gold.</p>
            <div class="sell-list" style="max-height: 400px; overflow-y: auto;">`;

        let hasItems = false;

        // Sell Bars
        for(let key in State.bars) {
            if(State.bars[key] > 0) {
                hasItems = true;
                const val = State.materials[key].value;
                html += `<div class="sell-item">
                    <span>${State.materials[key].name} Bar (x${State.bars[key]})</span>
                    <button class="btn" onclick="Shop.sellBar('${key}', ${val})">Sell 1 (🪙 ${val})</button>
                </div>`;
            }
        }

        // Sell Gear
        State.gear.forEach((g, index) => {
            // Don't sell equipped items
            const isEquipped = (State.equipped.weapon && State.equipped.weapon.id === g.id) ||
                               (State.equipped.armor && State.equipped.armor.id === g.id);
            if(!isEquipped) {
                hasItems = true;
                const matVal = State.materials[g.material].value;
                const gearVal = Math.floor(matVal * (g.type === 'armor' ? 3 : 2) * (g.quality === 'Masterwork' ? 1.5 : 1));

                html += `<div class="sell-item">
                    <span>${g.name} [${g.quality}]</span>
                    <button class="btn" onclick="Shop.sellGear('${g.id}', ${gearVal})">Sell (🪙 ${gearVal})</button>
                </div>`;
            }
        });

        if(!hasItems) {
            html += `<p>You have nothing to sell right now. Equip items cannot be sold.</p>`;
        }

        html += `</div></div>`;
        html += `</div>`;

        container.innerHTML = html;
    },

    getUpgradeCost: function(currentTier) {
        // Simple exponential cost scaling: 50, 150, 450, 1350...
        return Math.floor(50 * Math.pow(3, currentTier - 1));
    },

    buyUpgrade: function(type) {
        const cost = this.getUpgradeCost(State.upgrades[type]);
        if(State.gold >= cost) {
            State.gold -= cost;
            State.upgrades[type]++;
            State.updateUI();
            State.save();
            this.renderView();

            // If mining view is active, update it
            if(window.Mining) Mining.renderMiningView();

            Utils.spawnFloatingText('Upgrade Purchased!', 'var(--success)');
        }
    },

    sellBar: function(key, val) {
        if(State.bars[key] > 0) {
            State.bars[key]--;
            State.addGold(val);
            this.renderView();
            Utils.spawnFloatingText('+🪙 ' + val, 'var(--accent)');
        }
    },

    sellGear: function(gearId, val) {
        const index = State.gear.findIndex(g => g.id === gearId);
        if(index > -1) {
            State.gear.splice(index, 1);
            State.addGold(val);
            this.renderView();
            State.renderInventoryView();
            Utils.spawnFloatingText('+🪙 ' + val, 'var(--accent)');
        }
    }
};
