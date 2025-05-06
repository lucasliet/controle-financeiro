import { getSalary } from './data.js';
import {
    calculateCategoryExpenses,
    calculate50_30_20Rule,
    getExpensesForMonth
} from './calculations.js';

let ruleChartInstance = null;
let categoryPieChartInstance = null;

function createOrUpdateRuleChart() {
    const ctx = document.getElementById('ruleChart')?.getContext('2d');
    if (!ctx) return;
    const salary = getSalary();
    const limits = calculate50_30_20Rule(salary);

    const today = new Date();
    const currentMonthExpenses = getExpensesForMonth(today.getFullYear(), today.getMonth());
    const needsMonth = calculateCategoryExpenses('needs', currentMonthExpenses);
    const wantsMonth = calculateCategoryExpenses('wants', currentMonthExpenses);
    const savingsGeneral = calculateCategoryExpenses('savings');

    const chartData = {
        labels: ['Necessidades (50%)', 'Desejos (30%)', 'Poupança (20%)'],
        datasets: [
            {
                label: 'Limite (R$)',
                data: [limits.needs, limits.wants, limits.savings],
                backgroundColor: 'rgba(150, 150, 150, 0.6)',
                borderColor: 'rgba(150, 150, 150, 1)',
                borderWidth: 1
            },
            {
                label: 'Gasto (Mês / Total Pou.) (R$)',
                data: [needsMonth, wantsMonth, savingsGeneral],
                backgroundColor: [
                    needsMonth > limits.needs ? 'rgba(255, 99, 132, 0.6)' : 'rgba(75, 192, 192, 0.6)',
                    wantsMonth > limits.wants ? 'rgba(255, 99, 132, 0.6)' : 'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)'
                ],
                borderColor: [
                    needsMonth > limits.needs ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)',
                    wantsMonth > limits.wants ? 'rgba(255, 99, 132, 1)' : 'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 1
            }
        ]
    };

    if (ruleChartInstance) {
        ruleChartInstance.data = chartData;
        ruleChartInstance.update();
    } else {
        ruleChartInstance = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => 'R$' + value.toFixed(2)
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: context => `${context.dataset.label || ''}: R$${context.parsed.y?.toFixed(2) || 0}`
                        }
                    }
                }
            }
        });
    }
}

function createOrUpdateCategoryPieChart() {
    const ctx = document.getElementById('categoryPieChart')?.getContext('2d');
    if (!ctx) return;

    const today = new Date();
    const currentMonthExpenses = getExpensesForMonth(today.getFullYear(), today.getMonth());
    const needsTotalMonth = calculateCategoryExpenses('needs', currentMonthExpenses);
    const wantsTotalMonth = calculateCategoryExpenses('wants', currentMonthExpenses);
    const savingsTotalGeneral = calculateCategoryExpenses('savings');

    const total = needsTotalMonth + wantsTotalMonth + savingsTotalGeneral;

    if (total === 0) {
        if (categoryPieChartInstance) {
            categoryPieChartInstance.destroy();
            categoryPieChartInstance = null;
        }
        return;
    }

    const chartData = {
        labels: ['Necessidades (Mês)', 'Desejos (Mês)', 'Poupança (Total)'],
        datasets: [{
            label: 'Distribuição de Gastos',
            data: [needsTotalMonth, wantsTotalMonth, savingsTotalGeneral],
            backgroundColor: ['rgba(75, 192, 192, 0.8)', 'rgba(54, 162, 235, 0.8)', 'rgba(255, 206, 86, 0.8)'],
            borderColor: ['rgba(75, 192, 192, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
            borderWidth: 1
        }]
    };

    if (categoryPieChartInstance) {
        categoryPieChartInstance.data = chartData;
        categoryPieChartInstance.update();
    } else {
        categoryPieChartInstance = new Chart(ctx, {
            type: 'pie',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: context => {
                                let label = context.label || '';
                                if (label) label += ': ';
                                const value = context.parsed || 0;
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                label += `R$${value.toFixed(2)} (${percentage}%)`;
                                return label;
                            }
                        }
                    },
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }
}

export function updateCharts() {
    createOrUpdateRuleChart();
    createOrUpdateCategoryPieChart();
}
