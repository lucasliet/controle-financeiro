import { updateCharts } from './charts.js';
import { populateMonthYearSelector, updateStatementList } from './ui.js';

const menuToggle = document.getElementById('menu-toggle');
const drawer = document.getElementById('drawer');
const overlay = document.getElementById('overlay');
const navLinks = document.querySelectorAll('.nav-link');
const views = document.querySelectorAll('.view');

// Variáveis para controle do swipe
let touchStartX = 0;
let touchCurrentX = 0;
let isDraggingDrawer = false;
let drawerIsOpenAtDragStart = false; // Tracks if the drawer was open at the start of a swipe gesture
const edgeThreshold = 50; // Quão perto da borda o toque deve começar
const openThreshold = 80; // Quão longe deslizar para abrir

function openDrawer() {
    // Garante que a transição esteja ativa ANTES de adicionar a classe
    drawer.style.transition = 'transform 0.3s ease-in-out';
    overlay.style.transition = 'opacity 0.3s ease-in-out';
    // Limpa estilos inline do swipe para usar a classe
    drawer.style.transform = '';
    overlay.style.opacity = '';
    // Adiciona classes para ativar o estado aberto e as transições CSS
    drawer.classList.add('open');
    overlay.classList.add('active');
    menuToggle.classList.add('active');
    // Opcional: remover a transição após a animação para evitar conflitos
    setTimeout(() => {
        drawer.style.transition = '';
        overlay.style.transition = '';
    }, 300); // Duração da transição
}

function closeDrawer() {
    // Garante que a transição esteja ativa ANTES de remover a classe
    drawer.style.transition = 'transform 0.3s ease-in-out';
    overlay.style.transition = 'opacity 0.3s ease-in-out';
    // Limpa estilos inline do swipe para usar a classe
    drawer.style.transform = '';
    overlay.style.opacity = '';
    // Remove classes para ativar o estado fechado e as transições CSS
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    menuToggle.classList.remove('active');
    // Opcional: remover a transição após a animação
    setTimeout(() => {
        drawer.style.transition = '';
        overlay.style.transition = '';
    }, 300); // Duração da transição
}

export function switchView(viewId) {
    views.forEach(view => {
        view.classList.toggle('active-view', view.id === viewId);
        view.classList.toggle('hidden-view', view.id !== viewId);
    });

    // Ações específicas ao ativar uma view
    if (viewId === 'charts-view') {
        setTimeout(updateCharts, 50);
    } else if (viewId === 'statement-view') {
        // Popula o seletor e mostra o mês atual ao abrir o extrato
        populateMonthYearSelector();
        const monthYearSelect = document.getElementById('monthYearSelect');
        if (monthYearSelect.value) { // Garante que há um valor selecionado
            updateStatementList(monthYearSelect.value);
        } else {
             // Se não houver valor (sem transações?), limpa a lista
             const statementList = document.getElementById('statementTransactions');
             if(statementList) statementList.innerHTML = '<li>Nenhuma transação registrada ainda.</li>';
        }
    }
    // Nenhuma ação específica extra para 'transactions-view' (já atualizada por updateAllDisplays)

    closeDrawer();
}

// --- Handlers de Swipe ---
function handleTouchStart(event) {
    touchStartX = event.touches[0].clientX;
    touchCurrentX = touchStartX; // Initialize currentX
    drawerIsOpenAtDragStart = drawer.classList.contains('open');

    if (drawerIsOpenAtDragStart) {
        // Drawer is open, potential swipe to close. Allow swipe from anywhere relevant.
        isDraggingDrawer = true;
        drawer.style.transition = 'none';
        overlay.style.transition = 'none';
    } else {
        // Drawer is closed, potential swipe to open from edge.
        if (touchStartX <= edgeThreshold) {
            isDraggingDrawer = true;
            drawer.style.transition = 'none';
            overlay.style.transition = 'none';
        } else {
            isDraggingDrawer = false;
        }
    }
}

function handleTouchMove(event) {
    if (!isDraggingDrawer) return;

    touchCurrentX = event.touches[0].clientX;
    let diffX = touchCurrentX - touchStartX;
    const drawerWidth = drawer.offsetWidth;

    if (drawerIsOpenAtDragStart) { // Swiping to close (drawer was initially open)
        // diffX will be negative for a left swipe.
        // Drawer starts at translateX(0). Target X should be between -drawerWidth and 0.
        let targetX = Math.max(-drawerWidth, Math.min(0, diffX));
        drawer.style.transform = `translateX(${targetX}px)`;
        // Opacity from 0.5 (fully open) to 0 (fully closed by swipe)
        overlay.style.opacity = Math.max(0, 0.5 * (1 + targetX / drawerWidth));
    } else { // Swiping to open (drawer was initially closed)
        // diffX will be positive for a right swipe.
        // Drawer starts at -drawerWidth. Effective movement (targetX_movement) should be between 0 and drawerWidth.
        let effectiveMove = Math.max(0, Math.min(drawerWidth, diffX));
        drawer.style.transform = `translateX(${-drawerWidth + effectiveMove}px)`;
        overlay.classList.add('active'); // Ensure overlay is active
        // Opacity from 0 (fully closed) to 0.5 (fully open by swipe)
        overlay.style.opacity = Math.min(0.5, 0.5 * (effectiveMove / drawerWidth));
    }

    // Prevent default scroll behavior if we are actively dragging the drawer horizontally
    if (event.cancelable) {
        event.preventDefault();
    }
}

// Refatorado para chamar open/closeDrawer
function handleTouchEnd(event) {
    if (!isDraggingDrawer) return;

    // touchCurrentX has been updated by the last touchmove or set by touchstart
    const diffX = touchCurrentX - touchStartX;
    // drawerIsOpenAtDragStart holds the state at the beginning of the drag

    isDraggingDrawer = false; // Reset dragging state

    if (drawerIsOpenAtDragStart) { // Was trying to close (drawer was open at touchstart)
        if (diffX < -openThreshold) { // Swiped left enough
            closeDrawer();
        } else { // Not swiped enough, or swiped right
            openDrawer(); // Snap back to fully open
        }
    } else { // Was trying to open (drawer was closed at touchstart)
        if (diffX > openThreshold) {
            openDrawer();
        } else {
            // Not swiped enough, or swiped left
            closeDrawer(); // Snap back to fully closed (ensures styles are reset)
        }
    }
    // touchStartX and touchCurrentX will be reset by the next touchstart.
    // openDrawer/closeDrawer handle resetting transitions and styles.
}

export function initializeNavigation() {
    menuToggle.addEventListener('click', () => {
        // Simplesmente alterna chamando as funções corretas
        drawer.classList.contains('open') ? closeDrawer() : openDrawer();
    });

    overlay.addEventListener('click', closeDrawer);

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = link.getAttribute('data-view');
            switchView(viewId);
            // closeDrawer() é chamado dentro de switchView
        });
    });

    document.body.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.body.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.body.addEventListener('touchend', handleTouchEnd);
    document.body.addEventListener('touchcancel', handleTouchEnd);
}
