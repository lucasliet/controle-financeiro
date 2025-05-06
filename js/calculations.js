import { getExpenses, getSalary } from './data.js';

// Função auxiliar para obter despesas de um mês/ano específico
export function getExpensesForMonth(year, month) {
    // month é 0-indexado (0 = Janeiro, 11 = Dezembro)
    return getExpenses().filter(expense => {
        const expenseDate = new Date(expense.date + 'T00:00:00'); // Evita problemas de fuso
        return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
    });
}

// Modificada para aceitar um array opcional de despesas
export function calculateCategoryExpenses(category, expensesArray = getExpenses()) {
    return expensesArray
        .filter(expense => expense.category === category)
        .reduce((total, expense) => total + expense.amount, 0);
}

export function calculate50_30_20Rule(income) {
    const needs = income * 0.5;
    const wants = income * 0.3;
    const savings = income * 0.2;
    return { needs, wants, savings };
}

export function checkExpensesAgainstRule(income) {
    const limits = calculate50_30_20Rule(income);
    const needsExpenses = calculateCategoryExpenses('needs');
    const wantsExpenses = calculateCategoryExpenses('wants');
    const needsOver = needsExpenses > limits.needs;
    const wantsOver = wantsExpenses > limits.wants;

    return {
        needsOk: !needsOver,
        wantsOk: !wantsOver,
        needsActual: needsExpenses,
        needsLimit: limits.needs,
        wantsActual: wantsExpenses,
        wantsLimit: limits.wants,
        // savingsActual e savingsLimit podem ser adicionados se necessário em outro lugar
    };
}

// Saldo disponível continua usando o total geral
export function calculateAvailableBalance() {
    const totalSavings = calculateCategoryExpenses('savings'); // Usa getExpenses() por padrão (total geral)
    const totalNeeds = calculateCategoryExpenses('needs');     // Usa getExpenses() por padrão (total geral)
    const totalWants = calculateCategoryExpenses('wants');     // Usa getExpenses() por padrão (total geral)
    return totalSavings - totalNeeds - totalWants;
}
