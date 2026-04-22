// utils.js - Helper functions

window.Utils = {
    spawnFloatingText: function(text, color = '#fff') {
        const container = document.getElementById('fx-container');
        if(!container) return;

        const el = document.createElement('div');
        el.innerText = text;
        el.style.position = 'absolute';
        el.style.color = color;
        el.style.fontWeight = 'bold';
        el.style.fontSize = '1.5rem';
        el.style.textShadow = '0px 0px 5px #000';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '9999';

        // Randomize slight start position near center
        const x = window.innerWidth / 2 + (Math.random() * 100 - 50);
        const y = window.innerHeight / 2 + (Math.random() * 50 - 25);

        el.style.left = x + 'px';
        el.style.top = y + 'px';

        container.appendChild(el);

        // Simple animation
        let opacity = 1;
        let currentY = y;

        const anim = setInterval(() => {
            currentY -= 2;
            opacity -= 0.02;

            el.style.top = currentY + 'px';
            el.style.opacity = opacity;

            if(opacity <= 0) {
                clearInterval(anim);
                el.remove();
            }
        }, 16);
    }
};
