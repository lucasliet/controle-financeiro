import { getExpenses, getSalary, deleteExpense as dataDeleteExpense } from './data.js';
import {
    calculateCategoryExpenses,
    calculateAvailableCaixaBalance,
    calculateAvailableReservaBalance,
    checkExpensesAgainstRule,
    getExpensesForMonth
} from './calculations.js';

// --- Funções de Formatação ---
export function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

export function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// --- Funções da Tela de Extrato ---

export function populateMonthYearSelector() {
    const select = document.getElementById('monthYearSelect');
    if (!select) return;
    select.innerHTML = '';

    const expenses = getExpenses();
    const availableMonths = new Set();

    expenses.forEach(exp => {
        const date = new Date(exp.date + 'T00:00:00');
        const year = date.getFullYear();
        const month = date.getMonth();
        availableMonths.add(`${year}-${String(month).padStart(2, '0')}`);
    });

    const sortedMonths = Array.from(availableMonths).sort().reverse();
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    sortedMonths.forEach(monthYear => {
        const [year, monthIndex] = monthYear.split('-');
        const option = document.createElement('option');
        option.value = monthYear;
        option.textContent = `${monthNames[parseInt(monthIndex, 10)]} ${year}`;
        select.appendChild(option);
    });

    const today = new Date();
    const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth()).padStart(2, '0')}`;
    if (availableMonths.has(currentMonthYear)) {
        select.value = currentMonthYear;
    }
}

export function updateStatementList(selectedMonthYear) {
    const statementList = document.getElementById('statementTransactions');
    if (!statementList || !selectedMonthYear) return;
    statementList.innerHTML = '';

    const [year, monthIndex] = selectedMonthYear.split('-').map(Number);
    const monthExpenses = getExpensesForMonth(year, monthIndex);

    if (monthExpenses.length === 0) {
        statementList.innerHTML = '<li>Nenhuma transação encontrada para este mês.</li>';
        return;
    }

    const categoryMap = { needs: 'Necessidades', wants: 'Desejos', emergency: 'Reserva', caixa: 'Caixa' };

    monthExpenses.forEach(expense => {
        const listItem = document.createElement('li');
        listItem.setAttribute('data-category', expense.category);
        const categoryName = categoryMap[expense.category] || expense.category;
        const formattedDate = formatDate(expense.date);

        listItem.innerHTML = `
            <span class="transaction-info">
                <span class="transaction-date">${formattedDate}</span>
                <span class="transaction-details">
                    <span class="transaction-description">${expense.description}</span>
                    <span class="transaction-category">(${categoryName})</span>
                </span>
            </span>
            <span class="transaction-amount">R$${expense.amount.toFixed(2)}</span>
        `;
        statementList.appendChild(listItem);
    });
}

// --- Atualizações do DOM ---
export function updateSalaryDisplay() {
    const salary = getSalary();
    document.getElementById('salaryDisplay').textContent = `Salário: R$${salary.toFixed(2)}`;
    const salaryInput = document.getElementById('salary');
    if (salaryInput) {
        salaryInput.value = salary > 0 ? salary.toFixed(2) : '';
    }
}

export function updateCategoryTotalsDisplay() {
    const today = new Date();
    const currentMonthExpenses = getExpensesForMonth(today.getFullYear(), today.getMonth());

    const needsTotalMonth = calculateCategoryExpenses('needs', currentMonthExpenses);
    const wantsTotalMonth = calculateCategoryExpenses('wants', currentMonthExpenses);
    const caixaTotalGeneral = calculateCategoryExpenses('caixa');
    const reservaTotalGeneral = calculateCategoryExpenses('emergency');

    // Elementos do DOM
    const needsDisplay = document.getElementById('needsTotalDisplay');
    const wantsDisplay = document.getElementById('wantsTotalDisplay');
    const caixaTotalDisplay = document.getElementById('caixaTotalDisplay');
    const reservaTotalDisplay = document.getElementById('reservaTotalDisplay');

    // Atualiza texto
    if (needsDisplay) needsDisplay.textContent = `Necessidades (Mês): R$${needsTotalMonth.toFixed(2)}`;
    if (wantsDisplay) wantsDisplay.textContent = `Desejos (Mês): R$${wantsTotalMonth.toFixed(2)}`;
    if (caixaTotalDisplay) caixaTotalDisplay.textContent = `Caixa (Total Adic.): R$${caixaTotalGeneral.toFixed(2)}`;
    if (reservaTotalDisplay) reservaTotalDisplay.textContent = `Reserva (Total Adic.): R$${reservaTotalGeneral.toFixed(2)}`;

    // Atualiza cor dos totais adicionados (Caixa e Reserva)
    if (caixaTotalDisplay) {
        caixaTotalDisplay.style.color = caixaTotalGeneral === 0 ? '#333' : (caixaTotalGeneral < 0 ? '#c62828' : '#2e7d32');
    }
    if (reservaTotalDisplay) {
        reservaTotalDisplay.style.color = reservaTotalGeneral === 0 ? '#333' : (reservaTotalGeneral < 0 ? '#c62828' : '#2e7d32');
    }

    // Atualiza cor dos totais de gastos (Necessidades e Desejos)
    if (needsDisplay) {
        needsDisplay.style.color = needsTotalMonth === 0 ? '#333' : '#c62828';
    }
    if (wantsDisplay) {
        wantsDisplay.style.color = wantsTotalMonth === 0 ? '#333' : '#c62828';
    }
}

export function updateCaixaBalanceDisplay() {
    const availableBalance = calculateAvailableCaixaBalance();
    const displayElement = document.getElementById('caixaBalanceDisplay');
    if (displayElement) {
        displayElement.textContent = `Saldo Caixa: R$${availableBalance.toFixed(2)}`;
        displayElement.style.color = availableBalance === 0 ? '#333' : (availableBalance < 0 ? '#c62828' : '#2e7d32');
    }
}

export function updateReservaBalanceDisplay() {
    const availableBalance = calculateAvailableReservaBalance();
    const displayElement = document.getElementById('reservaBalanceDisplay');
    if (displayElement) {
        displayElement.textContent = `Saldo Reserva: R$${availableBalance.toFixed(2)}`;
        displayElement.style.color = availableBalance === 0 ? '#333' : (availableBalance < 0 ? '#c62828' : '#2e7d32');
    }
}

export function updateDistributionStatus() {
    const statusElement = document.getElementById('distributionStatus');
    if (!statusElement) return;

    const needsTotal = calculateCategoryExpenses('needs');
    const wantsTotal = calculateCategoryExpenses('wants');
    const emergencyTotal = calculateCategoryExpenses('emergency');
    const totalConsidered = needsTotal + wantsTotal + emergencyTotal;

    let needsPerc = 0, wantsPerc = 0, emergencyPerc = 0;

    if (totalConsidered > 0) {
        needsPerc = (needsTotal / totalConsidered) * 100;
        wantsPerc = (wantsTotal / totalConsidered) * 100;
        emergencyPerc = 100 - needsPerc - wantsPerc;
    } else {
        statusElement.textContent = 'Distribuição (Nec/Des/Res): N/A';
        statusElement.className = 'distribution-status';
        return;
    }

    const ruleCheck = checkExpensesAgainstRule(getSalary());
    let statusClass = 'status-good';
    if (!ruleCheck.needsOk || !ruleCheck.wantsOk) {
        statusClass = 'status-bad';
    }

    statusElement.textContent = `Distribuição (Nec/Des/Res): ${needsPerc.toFixed(1)}% / ${wantsPerc.toFixed(1)}% / ${emergencyPerc.toFixed(1)}%`;
    statusElement.className = `distribution-status ${statusClass}`;
}

export function updateTransactionsList() {
    const transactionsList = document.getElementById('transactions');
    transactionsList.innerHTML = '';

    const today = new Date();
    const currentMonthExpenses = getExpensesForMonth(today.getFullYear(), today.getMonth());

    if (currentMonthExpenses.length === 0) {
        transactionsList.innerHTML = '<li>Nenhuma transação neste mês.</li>';
        return;
    }

    const categoryMap = { needs: 'Necessidades', wants: 'Desejos', emergency: 'Reserva', caixa: 'Caixa' };

    currentMonthExpenses.forEach(expense => {
        const listItem = document.createElement('li');
        listItem.setAttribute('data-id', expense.id);
        listItem.setAttribute('data-category', expense.category);
        const categoryName = categoryMap[expense.category] || expense.category;
        const formattedDate = formatDate(expense.date);

        listItem.innerHTML = `
            <div class="delete-action"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></div>
            <div class="transaction-item-wrapper">
                <span class="transaction-info">
                    <span class="transaction-date">${formattedDate}</span>
                    <span class="transaction-details">
                        <span class="transaction-description">${expense.description}</span>
                        <span class="transaction-category">(${categoryName})</span>
                    </span>
                </span>
                <span class="transaction-amount">R$${expense.amount.toFixed(2)}</span>
            </div>`;
        transactionsList.appendChild(listItem);

        let startX = 0, currentX = 0, isDragging = false;
        const threshold = -80;
        const itemWrapper = listItem.querySelector('.transaction-item-wrapper');

        const handleDragEnd = () => {
            if (!isDragging || listItem.classList.contains('deleting')) return;
            isDragging = false;
            listItem.classList.remove('swiping');
            itemWrapper.style.transition = '';
            const diffX = currentX - startX;

            if (diffX < threshold) {
                listItem.classList.add('deleting');
                listItem.addEventListener('animationend', () => {
                    const idToDelete = parseInt(listItem.getAttribute('data-id'), 10);
                    const deleted = dataDeleteExpense(idToDelete);
                    if (deleted) {
                        updateAllDisplays();
                        listItem.remove();
                        showNotification(`Transação "${deleted.description}" removida.`, 'info', 2000);
                    }
                }, { once: true });
            } else {
                itemWrapper.style.transform = 'translateX(0px)';
            }
            startX = 0; currentX = 0;
        };

        const boundHandleDragStart = (clientX) => {
            if (listItem.classList.contains('deleting')) return;
            startX = clientX; isDragging = true; listItem.classList.add('swiping'); itemWrapper.style.transition = 'none';
        };
        const boundHandleDragMove = (clientX) => {
            if (!isDragging || listItem.classList.contains('deleting')) return;
            currentX = clientX; let diffX = currentX - startX;
            if (diffX > 20) diffX = 20; if (diffX < threshold - 40) diffX = threshold - 40;
            itemWrapper.style.transform = `translateX(${diffX}px)`;
        };

        listItem.addEventListener('touchstart', (e) => boundHandleDragStart(e.touches[0].clientX), { passive: true });
        listItem.addEventListener('touchmove', (e) => boundHandleDragMove(e.touches[0].clientX), { passive: true });
        listItem.addEventListener('touchend', handleDragEnd);
        listItem.addEventListener('touchcancel', handleDragEnd);
        listItem.addEventListener('mousedown', (e) => boundHandleDragStart(e.clientX));
        document.addEventListener('mousemove', (e) => { if (isDragging) boundHandleDragMove(e.clientX); });
        document.addEventListener('mouseup', () => { if (isDragging) handleDragEnd(); });
        listItem.addEventListener('mouseleave', () => { if (isDragging && !document.mouseButtons) handleDragEnd(); });
    });
}

export function clearTransactionForm() {
    document.getElementById('amount').value = '';
    document.getElementById('description').value = '';
    document.getElementById('category').value = '';
    document.getElementById('date').value = '';
}

export function showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close" aria-label="Fechar">&times;</button>
    `;

    let timeoutId = null;
    const closeButton = notification.querySelector('.notification-close');

    const removeNotification = () => {
        notification.classList.remove('show');
        notification.addEventListener('transitionend', () => notification.remove(), { once: true });
        if (timeoutId) clearTimeout(timeoutId);
    };

    closeButton.onclick = removeNotification;
    container.appendChild(notification);
    void notification.offsetWidth;
    notification.classList.add('show');

    if (duration > 0) {
        timeoutId = setTimeout(removeNotification, duration);
    }
}

// Mostra/Esconde radio buttons (needs) ou checkbox (emergency)
export function toggleDebitSourceDisplay(category) {
    const needsGroup = document.getElementById('debitSourceGroup');
    const emergencyGroup = document.getElementById('debitCaixaGroup'); // Checkbox group

    if (needsGroup) {
        needsGroup.style.display = (category === 'needs') ? 'block' : 'none';
    }
    if (emergencyGroup) {
        emergencyGroup.style.display = (category === 'emergency') ? 'block' : 'none';
    }
}

export function updateAllDisplays() {
    updateSalaryDisplay();
    updateCategoryTotalsDisplay();
    updateCaixaBalanceDisplay();
    updateReservaBalanceDisplay();
    updateDistributionStatus();
    updateTransactionsList();
}
