import { loadData, setSalary, addExpense as dataAddExpense } from './js/data.js';
// Importar cálculos de saldo específico
import { calculateAvailableCaixaBalance, calculateAvailableReservaBalance } from './js/calculations.js';
import {
    updateAllDisplays,
    clearTransactionForm,
    getTodayDateString,
    showNotification,
    updateSalaryDisplay,
    updateDistributionStatus,
    updateStatementList,
    toggleDebitSourceDisplay // Importa a função de toggle
} from './js/ui.js';
import { updateCharts } from './js/charts.js';
import { initializeNavigation, switchView } from './js/navigation.js';

// --- Elementos Globais ---
const salaryInput = document.getElementById('salary');
const transactionForm = document.getElementById('transactionForm');
const addTransactionBtn = document.getElementById('addTransactionBtn');
const modal = document.getElementById('transactionModal');
const modalCloseBtn = document.getElementsByClassName('close')[0];
const monthYearSelect = document.getElementById('monthYearSelect');
const categorySelect = document.getElementById('category'); // Select de categoria
const debitCaixaCheckbox = document.querySelector('input[name="debitCaixa"]'); // Checkbox

// --- Funções de Handler ---
function handleSalaryChange(event) {
    setSalary(event.target.value);
    updateSalaryDisplay();
    updateDistributionStatus(); // Status da regra depende do salário
    updateCharts();
}

function handleAddTransaction(event) {
    event.preventDefault();

    const amountInput = document.getElementById('amount');
    const categoryInput = document.getElementById('category');
    const descriptionInput = document.getElementById('description');
    const dateInput = document.getElementById('date');
    const debitSourceInput = document.querySelector('input[name="debitSource"]:checked');
    const debitCaixaChecked = debitCaixaCheckbox ? debitCaixaCheckbox.checked : false; // Lê o estado do checkbox

    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;
    const description = descriptionInput.value.trim();
    const date = dateInput.value;

    let options = {}; // Objeto para passar opções para addExpense

    // Determina a fonte de débito para 'needs'
    if (category === 'needs' && debitSourceInput) {
        options.debitedFrom = debitSourceInput.value; // 'caixa' ou 'emergency'
    }

    // Determina se 'emergency' deve debitar do caixa
    if (category === 'emergency') {
        options.debitFromCaixa = debitCaixaChecked;
    }

    // Validações básicas
    if (!date || !category || !description || isNaN(amount) || amount <= 0) {
        if (!date) showNotification('Por favor, selecione uma data.', 'error');
        else if (!category) showNotification('Por favor, selecione uma categoria.', 'error');
        else if (!description) showNotification('Por favor, insira uma descrição.', 'error');
        else showNotification('Por favor, insira um valor válido.', 'error');
        return;
    }

    // Verifica saldo ANTES de adicionar
    let balanceToCheck;
    let balanceName;
    let sourceToCheck = null; // Fonte primária do débito (caixa ou reserva)

    if (category === 'needs') {
        sourceToCheck = options.debitedFrom; // 'caixa' ou 'emergency'
    } else if (category === 'wants') {
        sourceToCheck = 'caixa'; // Desejos sempre do caixa
    } else if (category === 'emergency' && options.debitFromCaixa === true) {
        // Se for adicionar à reserva debitando do caixa, verifica o saldo do CAIXA
        sourceToCheck = 'caixa';
        balanceName = "Caixa";
    }
    // Se for 'emergency' sem debitar do caixa, não precisa verificar saldo (é um aporte)
    // Se for 'caixa', não precisa verificar saldo (é um aporte)

    // Define qual saldo verificar baseado na fonte
    if (sourceToCheck === 'emergency') {
        balanceToCheck = calculateAvailableReservaBalance();
        balanceName = "Reserva";
    } else if (sourceToCheck === 'caixa') {
        balanceToCheck = calculateAvailableCaixaBalance();
        balanceName = "Caixa";
    }

    // Realiza a verificação se um saldo precisa ser checado
    if (balanceToCheck !== undefined) {
        if (amount > balanceToCheck + 0.001) {
            showNotification(`Saldo ${balanceName} (R$${balanceToCheck.toFixed(2)}) insuficiente para esta operação de R$${amount.toFixed(2)}.`, 'error', 5000);
            return; // Bloqueia
        }
    }

    // Adiciona a despesa passando as opções relevantes
    dataAddExpense(amount, category, description, date, options);

    // Atualiza toda a UI relevante após adicionar
    updateAllDisplays();
    updateCharts();
    showNotification(`Transação "${description}" adicionada.`, 'success', 2000);
    closeModal();
}

// Handler para mudança no select de mês/ano do extrato
function handleMonthYearChange(event) {
    updateStatementList(event.target.value);
}

// Handler para mudança na categoria (mostrar/esconder radios)
function handleCategoryChange(event) {
    toggleDebitSourceDisplay(event.target.value);
}

function openModal() {
    document.getElementById('date').value = getTodayDateString();
    // Garante que grupos estejam corretamente visíveis/ocultos
    toggleDebitSourceDisplay(categorySelect.value);
    // Reseta a seleção de débito para 'caixa' (needs)
    const caixaRadio = document.querySelector('input[name="debitSource"][value="caixa"]');
    if (caixaRadio) caixaRadio.checked = true;
    // Reseta o checkbox de debitar do caixa (emergency) para MARCADO (true)
    if (debitCaixaCheckbox) debitCaixaCheckbox.checked = true;
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
    clearTransactionForm();
}

// --- Inicialização ---
function initializeApp() {
    loadData();
    updateAllDisplays();
    initializeNavigation();
    switchView('transactions-view');

    // Configura Event Listeners
    salaryInput.addEventListener('change', handleSalaryChange);
    transactionForm.addEventListener('submit', handleAddTransaction);
    addTransactionBtn.addEventListener('click', openModal);
    modalCloseBtn.addEventListener('click', closeModal);
    monthYearSelect.addEventListener('change', handleMonthYearChange);
    categorySelect.addEventListener('change', handleCategoryChange); // Novo listener

    // Fechar modal clicando fora
    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal();
        }
    }

    // Registro do Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registrado:', reg))
            .catch(err => console.log('Falha ao registrar Service Worker:', err));
    }
}

// --- Ponto de Entrada ---
document.addEventListener('DOMContentLoaded', initializeApp);
