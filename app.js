import { loadData, setSalary, addExpense as dataAddExpense } from './js/data.js';
import { calculateAvailableCaixaBalance, calculateAvailableReservaBalance } from './js/calculations.js';
import {
    updateAllDisplays,
    clearTransactionForm,
    getTodayDateString,
    showNotification,
    updateSalaryDisplay,
    updateDistributionStatus,
    updateStatementList,
    toggleDebitSourceDisplay 
} from './js/ui.js';
import { updateCharts } from './js/charts.js';
import { initializeNavigation, switchView } from './js/navigation.js';

const salaryInput = document.getElementById('salary');
const transactionForm = document.getElementById('transactionForm');
const addTransactionBtn = document.getElementById('addTransactionBtn');
const modal = document.getElementById('transactionModal');
const modalCloseBtn = document.getElementsByClassName('close')[0];
const monthYearSelect = document.getElementById('monthYearSelect');
const categorySelect = document.getElementById('category'); 
const debitCaixaCheckbox = document.querySelector('input[name="debitCaixa"]'); 

function handleSalaryChange(event) {
    setSalary(event.target.value);
    updateSalaryDisplay();
    updateDistributionStatus(); 
    updateCharts();
}

function handleAddTransaction(event) {
    event.preventDefault();

    const amountInput = document.getElementById('amount');
    const categoryInput = document.getElementById('category');
    const descriptionInput = document.getElementById('description');
    const dateInput = document.getElementById('date');
    const debitSourceInput = document.querySelector('input[name="debitSource"]:checked');
    const debitCaixaChecked = debitCaixaCheckbox ? debitCaixaCheckbox.checked : false; 

    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;
    const description = descriptionInput.value.trim();
    const date = dateInput.value;

    let options = {}; 

    if (category === 'needs' && debitSourceInput) {
        options.debitedFrom = debitSourceInput.value; 
    }

    if (category === 'emergency') {
        options.debitFromCaixa = debitCaixaChecked;
    }

    if (!date || !category || !description || isNaN(amount) || amount <= 0) {
        if (!date) showNotification('Por favor, selecione uma data.', 'error');
        else if (!category) showNotification('Por favor, selecione uma categoria.', 'error');
        else if (!description) showNotification('Por favor, insira uma descrição.', 'error');
        else showNotification('Por favor, insira um valor válido.', 'error');
        return;
    }

    let balanceToCheck;
    let balanceName;
    let sourceToCheck = null; 

    if (category === 'needs') {
        sourceToCheck = options.debitedFrom; 
    } else if (category === 'wants') {
        sourceToCheck = 'caixa'; 
    } else if (category === 'emergency' && options.debitFromCaixa === true) {
        sourceToCheck = 'caixa';
        balanceName = "Caixa";
    }

    if (sourceToCheck === 'emergency') {
        balanceToCheck = calculateAvailableReservaBalance();
        balanceName = "Reserva";
    } else if (sourceToCheck === 'caixa') {
        balanceToCheck = calculateAvailableCaixaBalance();
        balanceName = "Caixa";
    }

    if (balanceToCheck !== undefined) {
        if (amount > balanceToCheck + 0.001) {
            showNotification(`Saldo ${balanceName} (R$${balanceToCheck.toFixed(2)}) insuficiente para esta operação de R$${amount.toFixed(2)}.`, 'error', 5000);
            return; 
        }
    }

    dataAddExpense(amount, category, description, date, options);

    updateAllDisplays();
    updateCharts();
    showNotification(`Transação "${description}" adicionada.`, 'success', 2000);
    closeModal();
}

function handleMonthYearChange(event) {
    updateStatementList(event.target.value);
}

function handleCategoryChange(event) {
    toggleDebitSourceDisplay(event.target.value);
}

function openModal() {
    document.getElementById('date').value = getTodayDateString();
    toggleDebitSourceDisplay(categorySelect.value);
    const caixaRadio = document.querySelector('input[name="debitSource"][value="caixa"]');
    if (caixaRadio) caixaRadio.checked = true;
    if (debitCaixaCheckbox) debitCaixaCheckbox.checked = true;
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
    clearTransactionForm();
}

function initializeApp() {
    loadData();
    updateAllDisplays();
    initializeNavigation();
    switchView('transactions-view');

    salaryInput.addEventListener('change', handleSalaryChange);
    transactionForm.addEventListener('submit', handleAddTransaction);
    addTransactionBtn.addEventListener('click', openModal);
    modalCloseBtn.addEventListener('click', closeModal);
    monthYearSelect.addEventListener('change', handleMonthYearChange);
    categorySelect.addEventListener('change', handleCategoryChange); 

    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal();
        }
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registrado:', reg))
            .catch(err => console.log('Falha ao registrar Service Worker:', err));
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
