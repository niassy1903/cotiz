import React, { useState } from 'react';
import { Expense } from '../../types/expense';
import { Payment } from '../../types/payment';
import { formatFCFA } from '../../utils/formatters';

interface RevenueExpenseChartProps {
  payments: Payment[];
  expenses: Expense[];
  totalRevenue: number;
  totalExpenses: number;
}

interface FinancialPeriod {
  label: string;
  revenue: number;
  expense: number;
}

const dateKey = (value: string): string | undefined => {
  const key = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key : undefined;
};

const buildFinancialPeriods = (
  payments: Payment[],
  expenses: Expense[],
  period: '30j' | '7j',
): FinancialPeriod[] => {
  const numberOfDays = period === '7j' ? 7 : 30;
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dates = Array.from({ length: numberOfDays }, (_, index) => (
    new Date(today - (numberOfDays - index - 1) * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
  ));
  const periods = Array.from({ length: period === '7j' ? 7 : 4 }, (_, index) => ({
    label: period === '7j'
      ? new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: 'UTC' })
        .format(new Date(`${dates[index]}T00:00:00Z`))
        .replace(/\.$/, '')
      : `Sem ${index + 1}`,
    revenue: 0,
    expense: 0,
  }));
  const dateIndexes = new Map(dates.map((date, index) => [date, index]));
  const getPeriodIndex = (value: string): number | undefined => {
    const index = dateIndexes.get(dateKey(value) ?? '');
    if (index === undefined) return undefined;
    return period === '7j' ? index : Math.min(3, Math.floor(index * 4 / numberOfDays));
  };

  payments.forEach(payment => {
    const index = getPeriodIndex(payment.paymentDate);
    if (index !== undefined) periods[index].revenue += payment.amount;
  });

  expenses.forEach(expense => {
    const index = getPeriodIndex(expense.date);
    if (index !== undefined) periods[index].expense += expense.amount;
  });

  return periods;
};

export const RevenueExpenseChart: React.FC<RevenueExpenseChartProps> = ({
  payments,
  expenses,
  totalRevenue,
  totalExpenses,
}) => {
  const [period, setPeriod] = useState<'30j' | '7j'>('30j');
  const activeData = buildFinancialPeriods(payments, expenses, period);
  const maxVal = Math.max(...activeData.map(d => Math.max(d.revenue, d.expense))) || 1;
  const hasFinancialData = activeData.some(d => d.revenue > 0 || d.expense > 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Évolution des Flux Financiers
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Collectes encaissées vs Dépenses validées
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-700" />
              <span>Collecté</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              <span>Dépenses</span>
            </span>
          </div>

          <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setPeriod('7j')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                period === '7j' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              7 jours
            </button>
            <button
              onClick={() => setPeriod('30j')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                period === '30j' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              30 jours
            </button>
          </div>
        </div>
      </div>

      <div className="h-48 flex items-end gap-3 sm:gap-6 pt-4 border-b border-slate-100 pb-2 relative">
        {!hasFinancialData && (
          <p className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
            Aucune activité financière sur cette période.
          </p>
        )}
        {activeData.map((data, index) => {
          const revenueHeight = Math.round((data.revenue / maxVal) * 100);
          const expenseHeight = Math.round((data.expense / maxVal) * 100);

          return (
            <div key={`${data.label}-${index}`} className="flex-1 flex flex-col items-center h-full justify-end group">
              <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full">
                <div
                  style={{ height: `${revenueHeight}%` }}
                  className="w-1/2 max-w-[28px] bg-emerald-700 hover:bg-emerald-800 rounded-t-sm transition-all relative cursor-pointer"
                  title={`Collecte: ${formatFCFA(data.revenue)}`}
                />
                <div
                  style={{ height: `${expenseHeight}%` }}
                  className="w-1/2 max-w-[28px] bg-rose-400 hover:bg-rose-500 rounded-t-sm transition-all relative cursor-pointer"
                  title={`Dépense: ${formatFCFA(data.expense)}`}
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-2 font-medium">{data.label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
        <span>Solde net cumulé disponible :</span>
        <span className="font-bold text-slate-900 font-tabular text-sm">
          {formatFCFA(totalRevenue - totalExpenses)}
        </span>
      </div>
    </div>
  );
};
