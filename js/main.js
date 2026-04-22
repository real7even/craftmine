// main.js - Entry point, handles UI navigation and initialization

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();

    // Initialize other modules
    if(window.State) State.init();
    if(window.Mining) Mining.init();
    if(window.Smithing) Smithing.init();
    if(window.Shop) Shop.init();
    if(window.Combat) Combat.init();

    // Initial UI update
    if(window.State) State.updateUI();
});

function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update buttons
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update views
            const targetId = btn.getAttribute('data-target');
            views.forEach(view => {
                if (view.id === targetId) {
                    view.classList.add('active');
                    view.classList.remove('hidden');
                } else {
                    view.classList.remove('active');
                    view.classList.add('hidden');
                }
            });

            // Trigger specific view logic if needed
            if(targetId === 'view-inventory' && window.State) {
                State.renderInventoryView();
            }
        });
    });
}
