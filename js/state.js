// state.js - Game State Management

window.State = {
    gold: 0,

    // Inventory
    ores: {
        copper: 0,
        iron: 0,
        steel: 0,
        mithril: 0,
        adamantite: 0
    },
    bars: {
        copper: 0,
        iron: 0,
        steel: 0,
        mithril: 0,
        adamantite: 0
    },
    gear: [], // Array of crafted gear objects

    // Player Stats (Derived from gear)
    stats: {
        hp: 100,
        maxHp: 100,
        attack: 5,
        defense: 0
    },

    // Equipped Gear
    equipped: {
        weapon: null,
        armor: null
    },

    // Upgrades
    upgrades: {
        pickaxe: 1, // Determines weak point size / combo window
        smelter: 1, // Smelting difficulty
        anvil: 1    // Forging difficulty
    },

    // Material Definitions
    materials: {
        copper: { name: 'Copper', color: '#b87333', tier: 1, value: 5, baseStat: 2 },
        iron: { name: 'Iron', color: '#a19d94', tier: 2, value: 15, baseStat: 5 },
        steel: { name: 'Steel', color: '#71797E', tier: 3, value: 40, baseStat: 10 },
        mithril: { name: 'Mithril', color: '#a0b0d0', tier: 4, value: 100, baseStat: 22 },
        adamantite: { name: 'Adamantite', color: '#2ecc71', tier: 5, value: 250, baseStat: 50 }
    },

    init: function() {
        this.load();
        this.recalculateStats();
    },

    save: function() {
        const saveData = {
            gold: this.gold,
            ores: this.ores,
            bars: this.bars,
            gear: this.gear,
            equipped: this.equipped,
            upgrades: this.upgrades
        };
        localStorage.setItem('fantasyCrafterSave', JSON.stringify(saveData));
    },

    load: function() {
        const saved = localStorage.getItem('fantasyCrafterSave');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.gold = data.gold || 0;
                this.ores = data.ores || this.ores;
                this.bars = data.bars || this.bars;
                this.gear = data.gear || [];
                this.equipped = data.equipped || { weapon: null, armor: null };
                this.upgrades = data.upgrades || { pickaxe: 1, smelter: 1, anvil: 1 };
            } catch (e) {
                console.error("Failed to load save:", e);
            }
        }
    },

    addGold: function(amount) {
        this.gold += amount;
        this.updateUI();
        this.save();
    },

    addOre: function(type, amount) {
        if(this.ores[type] !== undefined) {
            this.ores[type] += amount;
            this.updateUI();
            this.save();
        }
    },

    addBar: function(type, amount) {
        if(this.bars[type] !== undefined) {
            this.bars[type] += amount;
            this.updateUI();
            this.save();
        }
    },

    addGear: function(gearObj) {
        // gearObj: { id, name, type (weapon/armor), material, statValue, quality }
        gearObj.id = Date.now() + Math.random().toString(36).substr(2, 9);
        this.gear.push(gearObj);
        this.save();
    },

    equip: function(gearId) {
        const item = this.gear.find(g => g.id === gearId);
        if(!item) return;

        if(item.type === 'weapon') this.equipped.weapon = item;
        if(item.type === 'armor') this.equipped.armor = item;

        this.recalculateStats();
        this.renderInventoryView();
        this.save();
    },

    recalculateStats: function() {
        this.stats.attack = 5 + (this.equipped.weapon ? this.equipped.weapon.statValue : 0);
        this.stats.defense = 0 + (this.equipped.armor ? this.equipped.armor.statValue : 0);
        this.stats.maxHp = 100 + (this.stats.defense * 2);
        if(this.stats.hp > this.stats.maxHp) this.stats.hp = this.stats.maxHp;
    },

    updateUI: function() {
        const goldDisplay = document.getElementById('gold-display');
        if(goldDisplay) goldDisplay.innerText = this.gold;

        const summary = document.getElementById('inventory-summary');
        if(summary) {
            let text = [];
            for(let key in this.ores) {
                if(this.ores[key] > 0) text.push(`⛏️ ${this.materials[key].name}: ${this.ores[key]}`);
            }
            summary.innerText = text.join(' | ') || 'Inventory Empty';
        }
    },

    renderInventoryView: function() {
        const container = document.getElementById('inventory-area');
        if(!container) return;

        let html = `<div class="stats-panel">
            <h3>Player Stats</h3>
            <p>HP: ${this.stats.hp} / ${this.stats.maxHp}</p>
            <p>Attack: ⚔️ ${this.stats.attack}</p>
            <p>Defense: 🛡️ ${this.stats.defense}</p>
        </div>`;

        html += `<div class="equipped-panel">
            <h3>Equipped</h3>
            <p>Weapon: ${this.equipped.weapon ? this.equipped.weapon.name + ' (⚔️' + this.equipped.weapon.statValue + ')' : 'None'}</p>
            <p>Armor: ${this.equipped.armor ? this.equipped.armor.name + ' (🛡️' + this.equipped.armor.statValue + ')' : 'None'}</p>
        </div>`;

        html += `<h3>Gear Inventory</h3>`;
        if(this.gear.length === 0) {
            html += `<p>No gear crafted yet.</p>`;
        } else {
            html += `<ul class="gear-list">`;
            this.gear.forEach(g => {
                const isEquipped = (this.equipped.weapon && this.equipped.weapon.id === g.id) ||
                                   (this.equipped.armor && this.equipped.armor.id === g.id);
                html += `<li style="margin-bottom: 10px;">
                    ${g.name} (${g.type === 'weapon' ? '⚔️' : '🛡️'}${g.statValue}) - Quality: ${g.quality}
                    ${isEquipped ? '<strong>[EQUIPPED]</strong>' : `<button class="btn" onclick="State.equip('${g.id}')">Equip</button>`}
                </li>`;
            });
            html += `</ul>`;
        }

        html += `<h3>Resources</h3>
        <div style="display: flex; gap: 20px;">
            <div>
                <h4>Ores</h4>
                <ul>`;
        for(let key in this.ores) {
            html += `<li>${this.materials[key].name}: ${this.ores[key]}</li>`;
        }
        html += `</ul></div>
            <div>
                <h4>Bars</h4>
                <ul>`;
        for(let key in this.bars) {
            html += `<li>${this.materials[key].name}: ${this.bars[key]}</li>`;
        }
        html += `</ul></div></div>`;

        container.innerHTML = html;
    }
};
