import { monthlyIncome } from './data';

export function exportIncomeToCSV() {
  const headers = ['Месяц', 'Доход (₽)'];
  const rows = monthlyIncome.map(item => [item.month, item.income.toString()]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `income_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportIncomeToPDF() {
  // Simplified PDF export - in production use jsPDF or similar
  const content = monthlyIncome.map(item => `${item.month}: ${item.income.toLocaleString()} ₽`).join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `income_${new Date().toISOString().split('T')[0]}.txt`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
