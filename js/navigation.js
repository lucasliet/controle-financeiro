import { updateCharts } from './charts.js';

const menuToggle = document.getElementById('menu-toggle');
const drawer = document.getElementById('drawer');
const overlay = document.getElementById('overlay');
const navLinks = document.querySelectorAll('.nav-link');
const views = document.querySelectorAll('.view');

function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('active');
    menuToggle.classList.add('active');
}

function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    menuToggle.classList.remove('active');
}

export function switchView(viewId) {
    views.forEach(view => {
        view.classList.toggle('active-view', view.id === viewId);
        view.classList.toggle('hidden-view', view.id !== viewId);
    });
    if (viewId === 'charts-view') {
        setTimeout(updateCharts, 50); // Atualiza gráficos ao mostrar a view
    }
    closeDrawer();
}

export function initializeNavigation() {
    menuToggle.addEventListener('click', () => {
        drawer.classList.contains('open') ? closeDrawer() : openDrawer();
    });

    overlay.addEventListener('click', closeDrawer);

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = link.getAttribute('data-view');
            switchView(viewId);
        });
    });
}
