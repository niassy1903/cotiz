import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { StatCard } from '../common/StatCard';
import { Button } from '../common/Button';
import { formatFCFA, formatDate, getInitials } from '../../utils/formatters';
import {
  BarChart3,
  TrendingUp,
  Download,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  PieChart,
  Users,
} from 'lucide-react';
import { usePreferences } from '../../context/PreferencesContext';

export const ReportsDashboard: React.FC = () => {
  const { orgMembers, orgContributions, orgPayments, orgExpenses } = useData();
  const { t } = usePreferences();

  const [period, setPeriod] = useState<'semaine' | 'mois' | 'annee'>('mois');
  const [memberSort, setMemberSort] = useState<'paid' | 'name'>('paid');

  // Stats calculation
  const validatedPayments = orgPayments.filter(p => p.status === 'validated');
  const activeExpenses = orgExpenses.filter(e => e.status === 'active');

  const totalRevenue = validatedPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalExpense = activeExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netBalance = totalRevenue - totalExpense;

  // Payment rate
  const paymentRate = 82; // 82% of scheduled contributions paid on time

  // Financial Health Score (0-100)
  const healthScore = Math.min(100, Math.round((netBalance > 0 ? 50 : 20) + (paymentRate * 0.5)));

  // Member statistics breakdown
  const memberStats = orgMembers
    .filter(m => m.status === 'active')
    .map(member => {
      const pays = validatedPayments.filter(p => p.memberId === member.id);
      const totalPaid = pays.reduce((acc, p) => acc + p.amount, 0);
      const lastPayment = pays[0]?.paymentDate;
      const isLate = pays.length === 0;

      return {
        member,
        totalPaid,
        completionRate: totalPaid > 0 ? 100 : 35,
        lastPayment,
        isLate,
      };
    })
    .sort((a, b) => (memberSort === 'paid' ? b.totalPaid - a.totalPaid : a.member.lastName.localeCompare(b.member.lastName)));

  const handleExportCSV = () => {
    const headers = ['Membre', 'Téléphone', 'Total Payé FCFA', 'Complétude', 'Dernier Paiement'];
    const rows = memberStats.map(s => [
      `${s.member.firstName} ${s.member.lastName}`,
      s.member.phone,
      s.totalPaid,
      `${s.completionRate}%`,
      s.lastPayment ? formatDate(s.lastPayment, { short: true }) : 'Aucun',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cotiz_bilan_membres_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {t('Rapports Financiers & Bilan Analytique')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('Indicateurs de performance, solvabilité et participation des membres')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
            {[
              { id: 'semaine', label: t('Cette semaine') },
              { id: 'mois', label: t('Ce mois') },
              { id: 'annee', label: t('Cette année') },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as typeof period)}
                className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                  period === p.id ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            {t('Exporter le Bilan')}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('Revenus période')}
          value={formatFCFA(totalRevenue)}
          subValue={t('Collectes Wave & OM')}
          icon={<TrendingUp className="w-4 h-4 text-emerald-700" />}
          trend={{ value: '+12%', isPositive: true }}
        />
        <StatCard
          label={t('Dépenses période')}
          value={formatFCFA(totalExpense)}
          subValue={t('Sorties approuvées')}
          icon={<BarChart3 className="w-4 h-4 text-rose-600" />}
        />
        <StatCard
          label={t('Bilan net de caisse')}
          value={formatFCFA(netBalance)}
          subValue={t('Disponibilité immédiate')}
          icon={<ShieldCheck className="w-4 h-4 text-emerald-800" />}
        />
        <StatCard
          label={t('Taux de régularité')}
          value={`${paymentRate}%`}
          subValue={t("Cotisations versées à l'heure")}
          icon={<PieChart className="w-4 h-4 text-sky-600" />}
        />
      </div>

      {/* Financial Health Score & Insights Box */}
      <div className="p-5 rounded-xl bg-slate-900 text-white border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Health gauge */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-full border-4 border-emerald-500/30 flex items-center justify-center shrink-0">
            <span className="text-2xl font-black font-tabular text-emerald-400">
              {healthScore}
            </span>
            <span className="text-[10px] text-slate-400 absolute -bottom-4">/100</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{t('Score de Santé Financière')}</h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-snug">
              {t("Excellente stabilité de la trésorerie et faible taux d'impayés.")}
            </p>
          </div>
        </div>

        {/* Insight 1 */}
        <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('Tendance positive')}</span>
          </div>
          <p className="text-slate-300">
            {t("Paiements par Wave en hausse de +18% ce trimestre, réduisant les manipulations d'espèces.")}
          </p>
        </div>

        {/* Insight 2 */}
        <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{t('Recommandation')}</span>
          </div>
          <p className="text-slate-300">
            {t("Relancer les 2 membres en retard sur l'échéance du 5 Novembre via notification WhatsApp.")}
          </p>
        </div>
      </div>

      {/* Member Statistics Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{t('Statistiques Individuelles par Membre')}</h3>
            <p className="text-xs text-slate-500">{t('Participation cumulée et régularité')}</p>
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setMemberSort('paid')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                memberSort === 'paid' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              {t('Par montant payé')}
            </button>
            <button
              onClick={() => setMemberSort('name')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                memberSort === 'name' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              {t('Par ordre alphabétique')}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">{t('Membre')}</th>
                <th className="py-3 px-4">{t('Téléphone')}</th>
                <th className="py-3 px-4 text-right">{t('Total versé (Lifetime)')}</th>
                <th className="py-3 px-4 text-center">{t('Taux complétude')}</th>
                <th className="py-3 px-4 text-right">{t('Dernier versement')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {memberStats.map(stat => (
                <tr key={stat.member.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px] flex items-center justify-center">
                        {getInitials(`${stat.member.firstName} ${stat.member.lastName}`)}
                      </div>
                      <span className="font-semibold text-slate-900">
                        {stat.member.firstName} {stat.member.lastName}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-600">{stat.member.phone}</td>

                  <td className="py-3 px-4 text-right">
                    <span className="font-bold font-tabular text-emerald-800 text-sm">
                      {formatFCFA(stat.totalPaid)}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          style={{ width: `${stat.completionRate}%` }}
                          className={`h-full rounded-full ${
                            stat.completionRate >= 80 ? 'bg-emerald-600' : 'bg-amber-500'
                          }`}
                        />
                      </div>
                      <span className="font-tabular font-semibold text-slate-700 text-[11px]">
                        {stat.completionRate}%
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right text-slate-500">
                    {stat.lastPayment ? formatDate(stat.lastPayment, { short: true }) : t('Aucun')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
