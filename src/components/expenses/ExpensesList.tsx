import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { CreateExpenseModal } from './CreateExpenseModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { Expense } from '../../types/expense';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { canUndo } from '../../utils/helpers';
import {
  Receipt,
  Plus,
  RotateCcw,
  Utensils,
  Car,
  HeartPulse,
  FolderMinus,
  Lock,
} from 'lucide-react';

interface ExpensesListProps {
  onOpenCreate: () => void;
}

export const ExpensesList: React.FC<ExpensesListProps> = ({ onOpenCreate }) => {
  const { user } = useAuth();
  const { orgExpenses, orgMembers, cancelExpense } = useData();

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const currentMember = orgMembers.find(
    m => m.userId === user?.id || m.email === user?.email
  );
  const hasAccess = isAdmin || (currentMember?.hasTransactionAccess ?? false);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expenseToCancel, setExpenseToCancel] = useState<Expense | null>(null);

  const activeExpenses = orgExpenses.filter(e => e.status === 'active');
  const totalCumulated = activeExpenses.reduce((acc, e) => acc + e.amount, 0);

  const filtered = orgExpenses.filter(e => {
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    return true;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Nourriture':
        return <Utensils className="w-4 h-4 text-amber-600" />;
      case 'Transport':
        return <Car className="w-4 h-4 text-sky-600" />;
      case 'Santé':
        return <HeartPulse className="w-4 h-4 text-rose-600" />;
      default:
        return <FolderMinus className="w-4 h-4 text-slate-600" />;
    }
  };

  if (!hasAccess) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center max-w-lg mx-auto my-12 shadow-xs space-y-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Accès restreint aux dépenses</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          La consultation des dépenses détaillées est réservée aux administrateurs ou aux membres auxquels l'administrateur a délégué la visibilité des transactions financières.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Registre des Dépenses & Sorties de Caisse
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Total engagé : <span className="font-bold text-rose-700 font-tabular">{formatFCFA(totalCumulated)}</span> sur {activeExpenses.length} opérations
          </p>
        </div>

        {isAdmin && (
          <Button onClick={onOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
            Enregistrer une dépense
          </Button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs w-fit">
        {[
          { id: 'all', label: 'Toutes les catégories' },
          { id: 'Nourriture', label: 'Nourriture & Collation' },
          { id: 'Transport', label: 'Transport' },
          { id: 'Santé', label: 'Santé & Urgences' },
          { id: 'Autres', label: 'Autres charges' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              categoryFilter === cat.id
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description & Justificatif</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Enregistré par</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-center">État</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Aucune dépense enregistrée dans cette sélection
                  </td>
                </tr>
              ) : (
                filtered.map(expense => {
                  const isCancelable =
                    isAdmin && expense.status === 'active' && canUndo(expense.createdAt, 1);

                  return (
                    <tr key={expense.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {formatDate(expense.date, { short: true })}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {expense.description}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getCategoryIcon(expense.category)}
                          <span className="font-medium text-slate-700">{expense.category}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {expense.createdByAdminName}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-bold font-tabular text-rose-700 text-sm">
                          -{formatFCFA(expense.amount)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            expense.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200 line-through'
                          }`}
                        >
                          {expense.status === 'active' ? 'Validée' : 'Annulée'}
                        </span>
                      </td>

                      {isAdmin && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {isCancelable ? (
                            <button
                              onClick={() => setExpenseToCancel(expense)}
                              className="text-rose-600 hover:text-rose-800 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Annuler (&lt;1h)</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Verrouillé</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm cancel modal */}
      <ConfirmModal
        isOpen={!!expenseToCancel}
        onClose={() => setExpenseToCancel(null)}
        onConfirm={() => {
          if (expenseToCancel) {
            cancelExpense(expenseToCancel.id);
            setExpenseToCancel(null);
          }
        }}
        title="Annuler cette dépense ?"
        description={`Le montant de ${formatFCFA(
          expenseToCancel?.amount || 0
        )} sera réintégré dans le solde de la caisse. Cette annulation sera tracée dans le journal d'audit.`}
        confirmLabel="Confirmer l'annulation"
        isDestructive
      />
    </div>
  );
};
