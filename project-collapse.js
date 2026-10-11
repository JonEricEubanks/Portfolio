// Keeps the longer project grids scannable: shows the first few cards per section and
// tucks the rest behind a "Show all" toggle. Without JS every card stays visible.
(function () {
    const SECTIONS = ['ai-apps', 'lowcode', 'dashboards', 'GIS'];
    const VISIBLE_COUNT = 4;
    const HIDDEN_CLASS = 'project-card-collapsed';

    function setExpanded(grid, button, expanded) {
        const cards = Array.from(grid.querySelectorAll(':scope > .link-container'));
        cards.forEach((card, i) => card.classList.toggle(HIDDEN_CLASS, !expanded && i >= VISIBLE_COUNT));
        button.setAttribute('aria-expanded', String(expanded));
        button.textContent = expanded ? 'Show fewer' : `Show all ${cards.length} projects`;
    }

    function init() {
        SECTIONS.forEach(id => {
            const section = document.getElementById(id);
            const grid = section && section.querySelector('.grid-container');
            if (!grid) return;
            const cardCount = grid.querySelectorAll(':scope > .link-container').length;
            if (cardCount <= VISIBLE_COUNT) return;

            if (!grid.id) grid.id = `${id}-grid`;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'show-all-projects';
            button.setAttribute('aria-controls', grid.id);
            button.addEventListener('click', () => {
                const expand = button.getAttribute('aria-expanded') !== 'true';
                setExpanded(grid, button, expand);
                if (!expand) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            grid.insertAdjacentElement('afterend', button);
            setExpanded(grid, button, false);
        });
    }

    // Lets other scripts (chat spotlight, deep links) reveal a card that is currently collapsed
    window.revealProjectCard = function (card) {
        if (!card || !card.classList.contains(HIDDEN_CLASS)) return;
        const grid = card.parentElement;
        const button = grid && grid.nextElementSibling;
        if (button && button.classList.contains('show-all-projects')) setExpanded(grid, button, true);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
