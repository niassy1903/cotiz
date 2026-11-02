import React from 'react';
import { useData } from '../../context/DataContext';
import { StatCard } from '../common/StatCard';
import { Button } from '../common/Button';
import { RevenueExpenseChart } from './RevenueExpenseChart';
import {
  Wallet,
  Receipt,
  Scale,
  Clock,
  Plus,
  UserPlus,
  Share2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { formatFCFA, formatDate, getInitials } from '../../utils/formatters';
import { usePreferences } from '../../context/PreferencesContext';

interface AdminDashboardProps {
  onNavigateTab: (tab: any) => void;
  onOpenCreateContribution: () => void;
  onOpenCreateExpense: () => void;
  onOpenAddMember: () => void;
  onOpenInviteModal: () => void;
  onOpenValidatePayment: (paymentId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  onOpenCreateContribution,
  onOpenCreateExpense,
  onOpenAddMember,
  onOpenInviteModal,
  onOpenValidatePayment,
}) => {
  const {
    currentOrg,
    orgMembers,
    orgContributions,
    orgCycles,
    orgPayments,
    orgExpenses,
  } = useData();
  const { t } = usePreferences();

  // Financial calculations
  const validatedPayments = orgPayments.filter(p => p.status === 'validated');
  const pendingPayments = orgPayments.filter(p => p.status === 'pending');
  const activeExpenses = orgExpenses.filter(e => e.status === 'active');

  const totalCollected = validatedPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalExpenses = activeExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netBalance = totalCollected - totalExpenses;

  // Pending members
  const pendingMembers = orgMembers.filter(m => m.status === 'pending');

  const today = new Date().toISOString().slice(0, 10);
  const contributionsById = new Map(orgContributions.map(contribution => [contribution.id, contribution]));
  const overdueMemberIds = new Set<string>();

  orgCycles
    .filter(cycle => cycle.status === 'open' && cycle.dueDate < today)
    .forEach(cycle => {
      const contribution = contributionsById.get(cycle.contributionId);
      if (!contribution || contribution.status !== 'active') return;

      orgMembers
        .filter(member => (
          member.status === 'active'
          && (contribution.targetType !== 'custom' || contribution.targetMemberIds?.includes(member.id))
        ))
        .forEach(member => {
          const expectedAmount = contribution.targetType === 'by_gender' && member.gender === 'F'
            ? contribution.amountFemale ?? contribution.amount
            : contribution.amount;
          const paidAmount = validatedPayments
            .filter(payment => payment.cycleId === cycle.id && payment.memberId === member.id)
            .reduce((total, payment) => total + payment.amount, 0);

          if (paidAmount < expectedAmount) overdueMemberIds.add(member.id);
        });
    });

  const overdueMembersCount = overdueMemberIds.size;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {currentOrg.name}
            </h1>
            <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {currentOrg.type}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentOrg.location} · {orgMembers.length} {t('membres enregistrés')} · {t('Devise FCFA')}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenInviteModal}
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
          >
            {t("Lien d'invitation")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenAddMember}
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
          >
            {t('Ajouter membre')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenCreateExpense}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            + {t('Dépense')}
          </Button>
          <Button
            size="sm"
            onClick={onOpenCreateContribution}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            + {t('Cotisation')}
          </Button>
        </div>
      </div>

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('Total collecté')}
          value={formatFCFA(totalCollected)}
          subValue={`${validatedPayments.length} ${t('versements validés')}`}
          icon={<Wallet className="w-4 h-4 text-emerald-700" />}
          onClick={() => onNavigateTab('payments')}
        />
        <StatCard
          label={t('Total dépenses')}
          value={formatFCFA(totalExpenses)}
          subValue={`${activeExpenses.length} ${t('dépenses enregistrées')}`}
          icon={<Receipt className="w-4 h-4 text-rose-600" />}
          onClick={() => onNavigateTab('expenses')}
        />
        <StatCard
          label={t('Solde net en caisse')}
          value={formatFCFA(netBalance)}
          subValue={t('Fonds disponibles (Wave/OM/Cash)')}
          icon={<Scale className="w-4 h-4 text-emerald-800" />}
        />
        <StatCard
          label={t('Cotisations en retard')}
          value={overdueMembersCount}
          subValue={t('Membres à relancer')}
          icon={<Clock className="w-4 h-4 text-amber-600" />}
          onClick={() => onNavigateTab('contributions')}
        />
      </div>

      {/* Action alerts if pending items */}
      {(pendingPayments.length > 0 || pendingMembers.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingPayments.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    {pendingPayments.length} {t('paiement(s) en attente de validation')}
                  </h4>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    {t('Wave & Orange Money prêts à être vérifiés')}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onNavigateTab('payments')}
              >
                {t('Vérifier')}
              </Button>
            </div>
          )}

          {pendingMembers.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">
                    {pendingMembers.length} {t("demande(s) d'adhésion en attente")}
                  </h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    {t("Nouveaux membres ayant utilisé le lien d'invitation")}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => onNavigateTab('members')}
              >
                {t('Gérer')}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Chart & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <RevenueExpenseChart
            payments={validatedPayments}
            expenses={activeExpenses}
            totalRevenue={totalCollected}
            totalExpenses={totalExpenses}
          />

          {/* Active Cotisations Spotlight */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{t('Cotisations en cours')}</h3>
                <p className="text-xs text-slate-500">{t('Cycles et échéances programmées')}</p>
              </div>
              <button
                onClick={() => onNavigateTab('contributions')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>{t('Tout afficher')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {orgContributions.map(c => (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900">{c.title}</h4>
                      <p className="text-[11px] text-slate-500 capitalize">
                        {c.frequency} · Échéance le {c.dayOfMonth || 5} du mois
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-tabular text-slate-900">
                      {formatFCFA(c.amount)}
                    </span>
                    <span className="block text-[10px] text-emerald-700 font-medium">{t('Actif')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col: Recent Activity */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">{t('Activité Récente')}</h3>
              <span className="text-[11px] text-slate-400">{t('Dernières 48h')}</span>
            </div>

            <div className="space-y-3">
              {orgPayments.slice(0, 5).map(pay => (
                <div
                  key={pay.id}
                  className="p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center">
                      {getInitials(pay.memberName)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{pay.memberName}</p>
                      <p className="text-[10px] text-slate-500">
                        {pay.method.toUpperCase()} · {formatDate(pay.paymentDate, { short: true })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-tabular text-emerald-800">
                      +{formatFCFA(pay.amount)}
                    </span>
                    <span
                      className={`block text-[10px] font-medium ${
                        pay.status === 'validated'
                          ? 'text-emerald-700'
                          : pay.status === 'pending'
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {pay.status === 'validated'
                        ? t('Validé')
                        : pay.status === 'pending'
                        ? t('En attente')
                        : t('Rejeté')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => onNavigateTab('payments')}
              >
                Voir tout l'historique
              </Button>
            </div>
          </div>

          {/* Quick Account Setup card */}
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800">
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
              Comptes de collecte configurés
            </span>
            <div className="space-y-2 mt-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Wave Organisation :</span>
                <span className="font-semibold text-sky-400">{currentOrg.waveNumber}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Orange Money :</span>
                <span className="font-semibold text-orange-400">
                  {currentOrg.orangeMoneyNumber}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
              Les paiements Wave et Orange Money sont déclarés dans l’application puis validés manuellement par un administrateur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
