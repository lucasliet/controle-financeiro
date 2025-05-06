import { getExpenses, getSalary } from './data.js';

export function calculateCategoryExpenses(category) {
    return getExpenses()
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

// Saldo disponível = Total Poupado - Gastos (Needs + Wants)
export function calculateAvailableBalance() {
    const totalSavings = calculateCategoryExpenses('savings');
    const totalNeeds = calculateCategoryExpenses('needs');
    const totalWants = calculateCategoryExpenses('wants');
    return totalSavings - totalNeeds - totalWants;
}
