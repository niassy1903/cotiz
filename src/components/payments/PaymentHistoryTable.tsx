import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { SectionHero } from '../common/SectionHero';
import { Badge } from '../common/Badge';
import { PaymentValidationModal } from './PaymentValidationModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { Payment, PaymentMethod, PaymentStatus } from '../../types/payment';
import { formatFCFA, formatDate, getInitials } from '../../utils/formatters';
import { canUndo } from '../../utils/helpers';
import { usePreferences } from '../../context/PreferencesContext';
import {
  Download,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  Search,
  Check,
  CreditCard,
} from 'lucide-react';

interface PaymentHistoryTableProps {
  onOpenMakePayment: () => void;
}

export const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({
  onOpenMakePayment,
}) => {
  const { user } = useAuth();
  const { orgPayments, cancelPayment } = useData();
  const { t } = usePreferences();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethod>('all');

  // Modals state
  const [selectedForValidation, setSelectedForValidation] = useState<Payment | null>(null);
  const [paymentToCancel, setPaymentToCancel] = useState<Payment | null>(null);
  const [exportNotice, setExportNotice] = useState(false);

  const filtered = orgPayments.filter(p => {
    // If regular member without full transaction access, only view their own payments!
    if (!isAdmin && !p.memberName.includes(user?.firstName || 'Fatou')) {
      return false;
    }
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (methodFilter !== 'all' && p.method !== methodFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.memberName.toLowerCase().includes(q) ||
        p.transactionId.toLowerCase().includes(q) ||
        p.contributionTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Membre', 'Cotisation', 'Montant FCFA', 'Moyen', 'Statut'];
    const rows = filtered.map(p => [
      p.transactionId,
      formatDate(p.paymentDate, { short: true }),
      p.memberName,
      p.contributionTitle,
      p.amount,
      p.method,
      p.status,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cotiz_paiements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      <SectionHero
        theme="payments"
        eyebrow={t('Suivi sécurisé des versements')}
        title={t('Registre des Paiements & Transactions')}
        description={t('Traçabilité complète des cotisations perçues par Wave, Orange Money et Espèces')}
        detail={`${orgPayments.length} ${t('transactions enregistrées')}`}
        action={<>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            {t('Exporter (CSV)')}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onOpenMakePayment}
            leftIcon={<CreditCard className="w-3.5 h-3.5" />}
          >
            {t('Effectuer un versement')}
          </Button>
        </>}
      />

      {exportNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
          <span>{t('Export CSV des transactions téléchargé avec succès.')}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={t('Rechercher par membre ou transaction...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status selector */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
            {(['all', 'validated', 'pending', 'rejected'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors cursor-pointer ${
                  statusFilter === st ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                {st === 'all'
                  ? t('Tous')
                  : st === 'validated'
                  ? t('Validés')
                  : st === 'pending'
                  ? t('En attente')
                  : t('Rejetés')}
              </button>
            ))}
          </div>

          {/* Method selector */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
            {(['all', 'wave', 'orange_money', 'cash'] as const).map(mt => (
              <button
                key={mt}
                onClick={() => setMethodFilter(mt)}
                className={`px-2.5 py-1 rounded-md font-medium uppercase transition-colors cursor-pointer ${
                  methodFilter === mt ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                {mt === 'all' ? t('Toutes Méthodes') : mt === 'orange_money' ? 'OM' : mt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">{t('Date & Réf')}</th>
                <th className="py-3 px-4">{t('Membre')}</th>
                <th className="py-3 px-4">{t('Cotisation')}</th>
                <th className="py-3 px-4">{t('Méthode')}</th>
                <th className="py-3 px-4 text-right">{t('Montant')}</th>
                <th className="py-3 px-4 text-center">{t('Statut')}</th>
                <th className="py-3 px-4 text-right">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {t('Aucune transaction ne correspond aux critères')}
                  </td>
                </tr>
              ) : (
                filtered.map(payment => {
                  const isCancelable =
                    isAdmin && payment.status !== 'cancelled' && canUndo(payment.paymentDate, 1);

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900 block">
                          {formatDate(payment.paymentDate, { short: true })}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {payment.transactionId}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold flex items-center justify-center">
                            {getInitials(payment.memberName)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block">
                              {payment.memberName}
                            </span>
                            {payment.memberPhone && (
                              <span className="text-[10px] text-slate-400">
                                {payment.memberPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">
                          {payment.contributionTitle}
                        </span>
                        {payment.notes && (
                          <span className="block text-[10px] text-slate-400 italic">
                            "{payment.notes}"
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold text-[11px] uppercase ${
                            payment.method === 'wave'
                              ? 'text-sky-700'
                              : payment.method === 'orange_money'
                              ? 'text-orange-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {payment.method === 'orange_money' ? 'Orange Money' : t(payment.method)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="font-bold font-tabular text-slate-900 text-sm">
                          {formatFCFA(payment.amount)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            payment.status === 'validated'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : payment.status === 'pending'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : payment.status === 'rejected'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {payment.status === 'validated'
                            ? t('Validé')
                            : payment.status === 'pending'
                            ? t('En attente')
                            : payment.status === 'rejected'
                            ? t('Rejeté')
                            : t('Annulé')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Admin validate trigger */}
                        {isAdmin && payment.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setSelectedForValidation(payment)}
                          >
                            {t('Valider')}
                          </Button>
                        )}

                        {/* 1 hour cancellation window */}
                        {isCancelable && (
                          <button
                            onClick={() => setPaymentToCancel(payment)}
                            className="p-1 hover:bg-rose-50 rounded text-rose-600 cursor-pointer inline-flex items-center gap-1 text-[11px] font-medium"
                            title={t('Annuler (délai 1h)')}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{t('Annuler (<1h)')}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation modal */}
      <PaymentValidationModal
        payment={selectedForValidation}
        isOpen={!!selectedForValidation}
        onClose={() => setSelectedForValidation(null)}
      />

      {/* Cancellation modal */}
      <ConfirmModal
        isOpen={!!paymentToCancel}
        onClose={() => setPaymentToCancel(null)}
        onConfirm={() => {
          if (paymentToCancel) {
            cancelPayment(paymentToCancel.id);
            setPaymentToCancel(null);
          }
        }}
        title={t('Annuler le paiement')}
        description={`${t('Êtes-vous sûr de vouloir annuler le versement de')} ${formatFCFA(
          paymentToCancel?.amount || 0
        )} ${t('pour')} ${paymentToCancel?.memberName} ? ${t("Le statut passera à 'Annulé' et sera tracé dans l'audit.")}`}
        confirmLabel={t("Confirmer l'annulation")}
        isDestructive
      />
    </div>
  );
};
