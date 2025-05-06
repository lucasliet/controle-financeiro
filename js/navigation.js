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
    if (drawer.classList.contains('open')) return; // Não iniciar swipe se já estiver aberto
    touchStartX = event.touches[0].clientX;
    if (touchStartX <= edgeThreshold) {
        isDraggingDrawer = true;
        // Remove transições durante o arraste
        drawer.style.transition = 'none';
        overlay.style.transition = 'none';
    } else {
        isDraggingDrawer = false;
    }
}

function handleTouchMove(event) {
    if (!isDraggingDrawer) return;

    touchCurrentX = event.touches[0].clientX;
    let diffX = touchCurrentX - touchStartX;

    const drawerWidth = drawer.offsetWidth;
    // Limita o arraste
    if (diffX < 0) diffX = 0;
    if (diffX > drawerWidth) diffX = drawerWidth;

    // Aplica a transformação diretamente
    drawer.style.transform = `translateX(${-drawerWidth + diffX}px)`;

    // Mostra o overlay proporcionalmente
    overlay.classList.add('active'); // Torna visível (sem transição)
    overlay.style.opacity = (diffX / drawerWidth) * 0.5; // Ajusta opacidade
}

// Refatorado para chamar open/closeDrawer
function handleTouchEnd(event) {
    if (!isDraggingDrawer) return;
    isDraggingDrawer = false;

    const diffX = touchCurrentX - touchStartX;

    // Decide se abre ou fecha baseado no threshold
    if (diffX > openThreshold) {
        openDrawer(); // Chama a função que lida com transições e classes
    } else {
        closeDrawer(); // Chama a função que lida com transições e classes
    }

    // Limpa variáveis
    touchStartX = 0;
    touchCurrentX = 0;
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
