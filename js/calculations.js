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

// Regra agora é 50 Necessidades / 30 Desejos / 20 Reserva de Emergência
export function calculate50_30_20Rule(income) {
    const needs = income * 0.5;
    const wants = income * 0.3;
    const emergency = income * 0.2; // Reserva de Emergência
    return { needs, wants, emergency };
}

// Verifica gastos TOTAIS contra os limites da regra Nec/Des/Res
export function checkExpensesAgainstRule(income) {
    const limits = calculate50_30_20Rule(income);
    const needsExpenses = calculateCategoryExpenses('needs'); // Total geral
    const wantsExpenses = calculateCategoryExpenses('wants'); // Total geral
    const emergencyExpenses = calculateCategoryExpenses('emergency'); // Total geral

    const needsOver = needsExpenses > limits.needs;
    const wantsOver = wantsExpenses > limits.wants;
    const emergencyOver = emergencyExpenses > limits.emergency; // Verifica se o total adicionado à reserva excede o limite (informativo)

    return {
        needsOk: !needsOver,
        wantsOk: !wantsOver,
        emergencyOk: !emergencyOver, // Informativo
        // ... (valores atuais e limites podem ser retornados se necessário)
    };
}

// Saldo disponível Caixa = Total Adicionado Caixa - Total Desejos - Total Necessidades (debitadas do Caixa)
export function calculateAvailableCaixaBalance() {
    const totalCaixa = calculateCategoryExpenses('caixa');
    const totalWants = calculateCategoryExpenses('wants');
    let totalNeedsDebitedFromCaixa = 0;

    getExpenses().forEach(exp => {
        // Soma necessidades que foram explicitamente debitadas do caixa
        if (exp.category === 'needs' && exp.debitedFrom === 'caixa') {
            totalNeedsDebitedFromCaixa += exp.amount;
        }
        // Considera também necessidades antigas (sem debitedFrom) como debitadas do caixa?
        // Ou assume que só as novas com a propriedade definida contam?
        // Vamos assumir que só as novas contam por enquanto.
        // else if (exp.category === 'needs' && !exp.debitedFrom) {
        //     totalNeedsDebitedFromCaixa += exp.amount; // Opcional: tratar dados antigos
        // }
    });

    return totalCaixa - totalWants - totalNeedsDebitedFromCaixa;
}

// Saldo disponível Reserva = Total Adicionado Reserva - Total Necessidades (debitadas da Reserva)
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
