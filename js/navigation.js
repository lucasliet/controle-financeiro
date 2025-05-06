import { updateCharts } from './charts.js';
// Importa funções da UI para o extrato
import { populateMonthYearSelector, updateStatementList } from './ui.js';

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
