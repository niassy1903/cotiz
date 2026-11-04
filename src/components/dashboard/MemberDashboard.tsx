import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatCard } from '../common/StatCard';
import { Button } from '../common/Button';
import { SectionHero } from '../common/SectionHero';
import {
  Wallet,
  Clock,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { usePreferences } from '../../context/PreferencesContext';

interface MemberDashboardProps {
  onOpenMakePayment: (contributionId?: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  onOpenMakePayment,
  onNavigateTab,
}) => {
  const { user } = useAuth();
  const { language, t } = usePreferences();
  const {
    currentOrg,
    orgMembers,
    orgContributions,
    orgCycles,
    orgPayments,
  } = useData();

  // Find this user's member record in current organization
  const currentMember =
    orgMembers.find(m => m.userId === user?.id || m.email?.toLowerCase() === user?.email.toLowerCase());

  // Payments made by this member
  const myPayments = currentMember
    ? orgPayments.filter(p => p.memberId === currentMember.id)
    : [];
  const myValidatedPayments = myPayments.filter(p => p.status === 'validated');

  // Lifetime paid
  const totalLifetimePaid = myValidatedPayments.reduce((acc, p) => acc + p.amount, 0);

  // Paid this month
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const locale = { fr: 'fr-FR', en: 'en-US', wo: 'wo-SN', es: 'es-ES', pt: 'pt-PT' }[language];
  const currentMonthLabel = now.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const paidThisMonth = myValidatedPayments
    .filter(p => p.paymentDate.startsWith(currentMonth))
    .reduce((acc, p) => acc + p.amount, 0);

  // Contributions due
  const dueContributions = currentMember
    ? orgContributions.filter(contribution =>
      contribution.status === 'active' &&
      (contribution.targetType !== 'custom' || contribution.targetMemberIds?.includes(currentMember.id))
    )
    : [];
  const unpaidContributions = dueContributions.filter(contribution =>
    !myValidatedPayments.some(payment =>
      payment.contributionId === contribution.id && payment.paymentDate.startsWith(currentMonth)
    )
  );
  const totalDueAmount = unpaidContributions.reduce((acc, contribution) => acc + contribution.amount, 0);
  const isUpToDate = unpaidContributions.length === 0;

  const upcomingCycles = orgCycles
    .filter(cycle => {
      const contribution = dueContributions.find(item => item.id === cycle.contributionId);
      return cycle.status === 'open' &&
        contribution &&
        cycle.dueDate >= now.toISOString().slice(0, 10) &&
        !myValidatedPayments.some(payment => payment.cycleId === cycle.id);
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const nextDueCycle = upcomingCycles[0];
  const nextDueDate = nextDueCycle
    ? new Date(`${nextDueCycle.dueDate}T00:00:00`).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    : null;
  const nextDueAmount = nextDueCycle?.expectedAmount ?? 0;

  // Check if member has delegated access to organization transactions
  const hasTransactionAccess = currentMember?.hasTransactionAccess ?? false;

  return (
    <div className="dashboard-page space-y-6">
      <SectionHero
        theme="member"
        eyebrow={t('Votre espace membre')}
        title={`${t('Bonjour')}, ${user?.firstName || currentMember?.firstName} !`}
        description={`${currentOrg.name} (${currentOrg.type}) · ${t('Devise FCFA')}`}
        detail={nextDueDate
          ? `${t('Prochaine échéance')} : ${nextDueDate} · ${formatFCFA(nextDueAmount)}`
          : t('Aucune échéance à venir')}
        action={<Button size="md" variant="secondary" onClick={() => onOpenMakePayment(nextDueCycle?.contributionId)} disabled={!nextDueCycle} leftIcon={<CreditCard className="w-4 h-4" />}>{t('Payer une cotisation')}</Button>}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('Cotisations Dues')}
          value={String(unpaidContributions.length)}
          subValue={isUpToDate ? t('Toutes vos cotisations sont à jour') : t('Échéance en cours')}
          icon={<Clock className="w-4 h-4 text-amber-600" />}
          accent="amber"
        />
        <StatCard
          label={t('Montant total dû')}
          value={formatFCFA(Math.max(0, totalDueAmount))}
          subValue={t('Pour le mois en cours')}
          icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
          accent="rose"
        />
        <StatCard
          label={t('Paiements ce mois')}
          value={formatFCFA(paidThisMonth)}
          subValue={currentMonthLabel}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-700" />}
          accent="green"
        />
        <StatCard
          label={t('Total payé (Lifetime)')}
          value={formatFCFA(totalLifetimePaid)}
          subValue={t('Depuis votre adhésion')}
          icon={<TrendingUp className="w-4 h-4 text-emerald-800" />}
          accent="blue"
        />
      </div>

      {/* Next Due Date & CTA Card */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider block mb-1">
            {t('Prochaine échéance')}
          </span>
          <h3 className="text-lg font-bold">
            {nextDueCycle?.contributionTitle ?? t('Aucune cotisation à venir')}
            {nextDueCycle && ` · ${formatFCFA(nextDueAmount)}`}
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            {nextDueDate
              ? <>{t('Date limite')} : <span className="font-semibold text-white">{nextDueDate}</span></>
              : t('Aucune échéance à venir')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onOpenMakePayment(nextDueCycle?.contributionId)}
            disabled={!nextDueCycle}
          >
            {t('Régler via Wave ou Orange Money')}
          </Button>
        </div>
      </div>

      {/* Grid: My Contributions & Payment History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col: My Contributions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{t('Mes Cotisations')}</h3>
              <p className="text-xs text-slate-500">
                {t('Statut de vos participations au sein du Dahira')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {dueContributions.map(c => {
              // Find if paid for this contribution
              const hasPaid = myPayments.some(
                p => p.contributionId === c.id && p.status === 'validated' && p.paymentDate.startsWith(currentMonth)
              );
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{c.title}</h4>
                      <p className="text-xs text-slate-500 capitalize">
                        {t(c.frequency)} · {t('Échéance le')} {c.dayOfMonth || 5} {t('du mois')}
                      </p>
                      {/* Progress bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              hasPaid ? 'bg-emerald-600 w-full' : 'bg-amber-400 w-1/3'
                            }`}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-slate-600">
                          {hasPaid ? t('100% à jour') : t('À régler')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                    <span className="text-sm font-bold font-tabular text-slate-900">
                      {formatFCFA(c.amount)}
                    </span>
                    {hasPaid ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Payé ce mois
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onOpenMakePayment(c.id)}
                      >
                        Payer
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right col: My Recent Payments History */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Mes Récents Règlements</h3>
              <span className="text-xs text-slate-500">{myPayments.length} reçus</span>
            </div>

            {myPayments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Aucun paiement enregistré pour l'instant.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {myPayments.map(p => (
                  <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{p.contributionTitle}</p>
                      <p className="text-[11px] text-slate-500">
                        {p.method.toUpperCase()} · {formatDate(p.paymentDate, { short: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-tabular text-slate-900">
                        {formatFCFA(p.amount)}
                      </span>
                      <span
                        className={`block text-[10px] font-medium ${
                          p.status === 'validated'
                            ? 'text-emerald-700'
                            : p.status === 'pending'
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {p.status === 'validated'
                          ? 'Validé'
                          : p.status === 'pending'
                          ? 'En cours de validation'
                          : 'Rejeté'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transparency & Access Delegation Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
            <div className="flex items-center gap-2 mb-2 font-semibold text-slate-800">
              <Receipt className="w-4 h-4 text-emerald-700" />
              <span>Transparence financière</span>
            </div>
            {hasTransactionAccess ? (
              <div>
                <p className="text-slate-600 leading-relaxed">
                  L'administrateur vous a accordé l'accès aux dépenses et bilans de l'organisation.
                </p>
                <button
                  onClick={() => onNavigateTab('expenses')}
                  className="mt-2 text-emerald-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Consulter le registre des dépenses</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <p className="text-slate-500 leading-relaxed">
                Les dépenses de l'organisation sont actuellement réservées aux administrateurs ou membres autorisés.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
