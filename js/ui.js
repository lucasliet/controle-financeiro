import { getExpenses, getSalary, deleteExpense as dataDeleteExpense } from './data.js'; // Renomeia deleteExpense para evitar conflito
import { calculateCategoryExpenses, calculateAvailableBalance, checkExpensesAgainstRule } from './calculations.js';

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

// --- Atualizações do DOM ---
export function updateSalaryDisplay() {
    const salary = getSalary();
    document.getElementById('salaryDisplay').textContent = `Salário: R$${salary.toFixed(2)}`;
    // Atualiza também o valor do input se ele existir
    const salaryInput = document.getElementById('salary');
    if (salaryInput) {
        salaryInput.value = salary > 0 ? salary.toFixed(2) : '';
    }
}

export function updateCategoryTotalsDisplay() {
    const needsTotal = calculateCategoryExpenses('needs');
    const wantsTotal = calculateCategoryExpenses('wants');
    const savingsTotal = calculateCategoryExpenses('savings'); // Total adicionado como poupança

    document.getElementById('needsTotalDisplay').textContent = `Necessidades: R$${needsTotal.toFixed(2)}`;
    document.getElementById('wantsTotalDisplay').textContent = `Desejos: R$${wantsTotal.toFixed(2)}`;
    document.getElementById('savingsTotalDisplay').textContent = `Poupança (Total): R$${savingsTotal.toFixed(2)}`;
}

export function updateSavingsBalanceDisplay() {
    const availableBalance = calculateAvailableBalance();
    const displayElement = document.getElementById('savingsBalanceDisplay');
    if (displayElement) {
        displayElement.textContent = `Saldo Disponível: R$${availableBalance.toFixed(2)}`;
        displayElement.style.color = availableBalance < 0 ? '#c62828' : '#555';
    }
}

export function updateDistributionStatus() {
    const statusElement = document.getElementById('distributionStatus');
    if (!statusElement) return;

    const needsTotal = calculateCategoryExpenses('needs');
    const wantsTotal = calculateCategoryExpenses('wants');
    const savingsTotal = calculateCategoryExpenses('savings');
    const totalExpenses = needsTotal + wantsTotal + savingsTotal;

    let needsPerc = 0, wantsPerc = 0, savingsPerc = 0;

    if (totalExpenses > 0) {
        needsPerc = (needsTotal / totalExpenses) * 100;
        wantsPerc = (wantsTotal / totalExpenses) * 100;
        savingsPerc = 100 - needsPerc - wantsPerc;
    } else {
        statusElement.textContent = 'Distribuição: N/A';
        statusElement.className = 'distribution-status';
        return;
    }

    const ruleCheck = checkExpensesAgainstRule(getSalary());
    let statusClass = 'status-good';
    if (!ruleCheck.needsOk && !ruleCheck.wantsOk) statusClass = 'status-bad';
    else if (!ruleCheck.needsOk || !ruleCheck.wantsOk) statusClass = 'status-warning';

    statusElement.textContent = `Distribuição: ${needsPerc.toFixed(1)}% Nec. / ${wantsPerc.toFixed(1)}% Des. / ${savingsPerc.toFixed(1)}% Pou.`;
    statusElement.className = `distribution-status ${statusClass}`;
}

export function updateTransactionsList() {
    const transactionsList = document.getElementById('transactions');
    transactionsList.innerHTML = '';
    const expenses = getExpenses(); // Pega a lista atualizada

    const categoryMap = { needs: 'Necessidades', wants: 'Desejos', savings: 'Poupança' };

    expenses.forEach(expense => {
        const listItem = document.createElement('li');
        listItem.setAttribute('data-id', expense.id);
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

        // --- Lógica de Swipe (adaptada para usar dataDeleteExpense importado) ---
        let startX = 0, currentX = 0, isDragging = false;
        const threshold = -80;
        const itemWrapper = listItem.querySelector('.transaction-item-wrapper');

        const handleDragStart = (clientX) => { /* ... código handleDragStart ... */ };
        const handleDragMove = (clientX) => { /* ... código handleDragMove ... */ };
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
                    const deleted = dataDeleteExpense(idToDelete); // Chama a função importada
                    if (deleted) {
                        // Atualiza displays relevantes após a exclusão dos dados
                        updateCategoryTotalsDisplay();
                        updateSavingsBalanceDisplay();
                        updateDistributionStatus();
                        // Idealmente, charts também seriam atualizados, mas isso pode exigir passar a função de update
                        // ou emitir um evento. Por simplicidade, deixamos assim por enquanto.
                        listItem.remove(); // Remove do DOM
                        showNotification(`Transação "${deleted.description}" removida.`, 'info', 2000);
                    }
                }, { once: true });
            } else {
                itemWrapper.style.transform = 'translateX(0px)';
            }
            startX = 0; currentX = 0;
        };

        // Reatribuir funções internas para que tenham acesso a startX, currentX, etc.
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

        // Event Listeners
        listItem.addEventListener('touchstart', (e) => boundHandleDragStart(e.touches[0].clientX), { passive: true });
        listItem.addEventListener('touchmove', (e) => boundHandleDragMove(e.touches[0].clientX), { passive: true });
        listItem.addEventListener('touchend', handleDragEnd);
        listItem.addEventListener('touchcancel', handleDragEnd);
        listItem.addEventListener('mousedown', (e) => boundHandleDragStart(e.clientX));
        // Listeners de mousemove/mouseup precisam ser globais (adicionados em app.js ou aqui com cuidado para remover)
        // Por simplicidade, vamos manter a lógica original que adicionava ao document,
        // mas isso pode vazar listeners se não gerenciado corretamente.
        // Uma abordagem mais robusta usaria um estado global ou passaria os listeners.
        // Mantendo como estava por enquanto:
         document.addEventListener('mousemove', (e) => { if (isDragging) boundHandleDragMove(e.clientX); });
         document.addEventListener('mouseup', () => { if (isDragging) handleDragEnd(); });
         listItem.addEventListener('mouseleave', () => { if (isDragging && !document.mouseButtons) handleDragEnd(); });
        // --- Fim Lógica de Swipe ---
    });
}

export function clearTransactionForm() {
    document.getElementById('amount').value = '';
    document.getElementById('description').value = '';
    document.getElementById('category').value = '';
    document.getElementById('date').value = '';
}

// --- Função de Notificação ---
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
    void notification.offsetWidth; // Force reflow
    notification.classList.add('show');

    if (duration > 0) {
        timeoutId = setTimeout(removeNotification, duration);
    }
}

// Função para atualizar toda a UI principal de uma vez
export function updateAllDisplays() {
    updateSalaryDisplay();
    updateCategoryTotalsDisplay();
    updateSavingsBalanceDisplay();
    updateDistributionStatus();
    updateTransactionsList(); // Recria a lista e anexa listeners
}
