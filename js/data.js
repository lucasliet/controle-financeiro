let expenses = [];
let salary = 0;
let nextExpenseId = 1;

// --- Getters (para acesso seguro aos dados) ---
export const getExpenses = () => [...expenses]; // Retorna cópia para evitar mutação externa
export const getSalary = () => salary;
export const getNextExpenseId = () => nextExpenseId;

// --- Persistência ---
export function saveData() {
    localStorage.setItem('financialControlSalary', salary);
    localStorage.setItem('financialControlExpenses', JSON.stringify(expenses));
    localStorage.setItem('financialControlNextId', nextExpenseId.toString());
}

export function loadData() {
    const savedSalary = localStorage.getItem('financialControlSalary');
    const savedExpenses = localStorage.getItem('financialControlExpenses');
    const savedNextId = localStorage.getItem('financialControlNextId');

    salary = parseFloat(savedSalary) || 0;
    expenses = savedExpenses ? JSON.parse(savedExpenses) : [];

    expenses.forEach(exp => {
        if (exp.id === undefined) {
            exp.id = nextExpenseId++;
        }
    });

    if (savedNextId) {
        nextExpenseId = parseInt(savedNextId, 10) || expenses.length + 1;
    } else {
        nextExpenseId = expenses.reduce((maxId, exp) => Math.max(exp.id || 0, maxId), 0) + 1;
    }
    // Ordena ao carregar
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// --- Modificadores de Estado ---
export function setSalary(newSalary) {
    salary = parseFloat(newSalary) || 0;
    saveData();
}

// Modificado para aceitar e armazenar debitedFrom
export function addExpense(amount, category, description, date, debitedFrom = null) {
    const newExpense = {
        id: nextExpenseId++,
        amount,
        category,
        description,
        date
    };
    // Armazena a fonte do débito APENAS para necessidades
    if (category === 'needs' && debitedFrom) {
        newExpense.debitedFrom = debitedFrom; // 'caixa' ou 'emergency'
    }
    expenses.push(newExpense);
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    saveData();
    return newExpense;
}

export function deleteExpense(id) {
    const expenseIndex = expenses.findIndex(expense => expense.id === id);
    if (expenseIndex === -1) return null;

    const deletedExpense = expenses[expenseIndex];
    expenses.splice(expenseIndex, 1);
    saveData();
    return deletedExpense; // Retorna a despesa deletada
}
