import { getExpenses, getSalary } from './data.js';

export function getExpensesForMonth(year, month) {
    return getExpenses().filter(expense => {
        const expenseDate = new Date(expense.date + 'T00:00:00'); 
        return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
    });
}

export function calculateCategoryExpenses(category, expensesArray = getExpenses()) {
    return expensesArray
        .filter(expense => expense.category === category)
        .reduce((total, expense) => total + expense.amount, 0);
}

export function calculate50_30_20Rule(income) {
    const needs = income * 0.5;
    const wants = income * 0.3;
    const emergency = income * 0.2; 
    return { needs, wants, emergency };
}

export function checkExpensesAgainstRule(income) {
    const limits = calculate50_30_20Rule(income);
    const needsExpenses = calculateCategoryExpenses('needs'); 
    const wantsExpenses = calculateCategoryExpenses('wants'); 
    const emergencyExpenses = calculateCategoryExpenses('emergency'); 

    const needsOver = needsExpenses > limits.needs;
    const wantsOver = wantsExpenses > limits.wants;
    const emergencyOver = emergencyExpenses > limits.emergency; 

    return {
        needsOk: !needsOver,
        wantsOk: !wantsOver,
        emergencyOk: !emergencyOver, 
    };
}

export function calculateAvailableCaixaBalance() {
    const totalCaixa = calculateCategoryExpenses('caixa');
    const totalWants = calculateCategoryExpenses('wants');
    let totalNeedsDebitedFromCaixa = 0;
    let totalEmergencyDebitedFromCaixa = 0;

    getExpenses().forEach(exp => {
        if (exp.category === 'needs' && exp.debitedFrom === 'caixa') {
            totalNeedsDebitedFromCaixa += exp.amount;
        }
        if (exp.category === 'emergency' && exp.debitFromCaixa === true) {
            totalEmergencyDebitedFromCaixa += exp.amount;
        }
    });

    return totalCaixa - totalWants - totalNeedsDebitedFromCaixa - totalEmergencyDebitedFromCaixa;
}

export function calculateAvailableReservaBalance() {
    const totalReserva = calculateCategoryExpenses('emergency');
    let totalNeedsDebitedFromReserva = 0;

    getExpenses().forEach(exp => {
        if (exp.category === 'needs' && exp.debitedFrom === 'emergency') {
            totalNeedsDebitedFromReserva += exp.amount;
        }
    });

    return totalReserva - totalNeedsDebitedFromReserva;
}
