import { getSalary } from './data.js';
import { calculateCategoryExpenses, calculate50_30_20Rule } from './calculations.js';

let ruleChartInstance = null;
let categoryPieChartInstance = null;

function createOrUpdateRuleChart() {
    const ctx = document.getElementById('ruleChart')?.getContext('2d');
    if (!ctx) return;
    const salary = getSalary();
    const limits = calculate50_30_20Rule(salary);
    const actual = {
        needs: calculateCategoryExpenses('needs'),
        wants: calculateCategoryExpenses('wants'),
        savings: calculateCategoryExpenses('savings')
    };

    const chartData = { /* ... dados do gráfico de barras ... */ };

    if (ruleChartInstance) {
        ruleChartInstance.data = chartData;
        ruleChartInstance.update();
    } else {
        ruleChartInstance = new Chart(ctx, { /* ... config do gráfico de barras ... */ });
    }
     // Colar a definição completa de chartData e a configuração do Chart daqui
     chartData.labels = ['Necessidades (50%)', 'Desejos (30%)', 'Poupança (20%)'];
     chartData.datasets = [
            {
                label: 'Limite (R$)',
                data: [limits.needs, limits.wants, limits.savings],
                backgroundColor: 'rgba(150, 150, 150, 0.6)',
                borderColor: 'rgba(150, 150, 150, 1)',
                borderWidth: 1
            },
            {
                label: 'Gasto Atual (R$)',
                data: [actual.needs, actual.wants, actual.savings],
                backgroundColor: [
                    actual.needs > limits.needs ? 'rgba(255, 99, 132, 0.6)' : 'rgba(75, 192, 192, 0.6)',
                    actual.wants > limits.wants ? 'rgba(255, 99, 132, 0.6)' : 'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)'
                ],
                borderColor: [
                    actual.needs > limits.needs ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)',
                    actual.wants > limits.wants ? 'rgba(255, 99, 132, 1)' : 'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 1
            }
        ];

     if (!ruleChartInstance) {
         ruleChartInstance = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { callback: value => 'R$' + value.toFixed(2) } } },
                plugins: { tooltip: { callbacks: { label: context => `${context.dataset.label || ''}: R$${context.parsed.y?.toFixed(2) || 0}` } } }
            }
        });
     }
}

function createOrUpdateCategoryPieChart() {
    const ctx = document.getElementById('categoryPieChart')?.getContext('2d');
    if (!ctx) return;
    const needsTotal = calculateCategoryExpenses('needs');
    const wantsTotal = calculateCategoryExpenses('wants');
    const savingsTotal = calculateCategoryExpenses('savings');
    const total = needsTotal + wantsTotal + savingsTotal;

    if (total === 0) {
        if (categoryPieChartInstance) { categoryPieChartInstance.destroy(); categoryPieChartInstance = null; }
        return;
    }

    const chartData = { /* ... dados do gráfico de pizza ... */ };

    if (categoryPieChartInstance) {
        categoryPieChartInstance.data = chartData;
        categoryPieChartInstance.update();
    } else {
        categoryPieChartInstance = new Chart(ctx, { /* ... config do gráfico de pizza ... */ });
    }
     // Colar a definição completa de chartData e a configuração do Chart daqui
     chartData.labels = ['Necessidades', 'Desejos', 'Poupança'];
     chartData.datasets = [{
            label: 'Distribuição de Gastos',
            data: [needsTotal, wantsTotal, savingsTotal],
            backgroundColor: ['rgba(75, 192, 192, 0.8)', 'rgba(54, 162, 235, 0.8)', 'rgba(255, 206, 86, 0.8)'],
            borderColor: ['rgba(75, 192, 192, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
            borderWidth: 1
        }];

     if (!categoryPieChartInstance) {
         categoryPieChartInstance = new Chart(ctx, {
            type: 'pie',
            data: chartData,
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    tooltip: { callbacks: { label: context => {
                        let label = context.label || ''; if (label) label += ': ';
                        const value = context.parsed || 0; const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        label += `R$${value.toFixed(2)} (${percentage}%)`; return label;
                    }}},
                    legend: { position: 'top' }
                }
            }
        });
     }
}

export function updateCharts() {
    createOrUpdateRuleChart();
    createOrUpdateCategoryPieChart();
}
