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
  AlertCircle,
  ArrowRight,
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

const DashboardIllustration: React.FC<{ balance: number }> = ({ balance }) => (
  <svg className="dashboard-hero-art" viewBox="0 0 460 320" fill="none" aria-hidden="true">
    <circle cx="255" cy="161" r="132" fill="#FFF" fillOpacity=".08" />
    <circle cx="255" cy="161" r="101" stroke="#FFF" strokeOpacity=".18" strokeDasharray="5 9" />
    <path d="M92 266c52-31 90-33 138-11 56 25 105 27 165-10" stroke="#FDBA74" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 10" />
    <g className="dashboard-art-coin" transform="rotate(-12 100 99)">
      <circle cx="100" cy="99" r="42" fill="#F47721" /><circle cx="100" cy="99" r="34" stroke="#FFC18F" strokeWidth="3" />
      <path d="M111 83c-4-8-22-7-24 3-2 11 24 9 22 21-2 10-19 12-27 4m16-39v54" stroke="white" strokeWidth="5" strokeLinecap="round" />
    </g>
    <g className="dashboard-art-phone">
      <rect x="168" y="33" width="145" height="250" rx="27" fill="#073D31" stroke="#A5D6BB" strokeWidth="3" />
      <rect x="177" y="44" width="127" height="228" rx="20" fill="#F9FCF8" /><path d="M217 48h47c0 8-5 12-12 12h-23c-7 0-12-4-12-12Z" fill="#073D31" />
      <circle cx="197" cy="78" r="10" fill="#0A805B" /><path d="M193 78h8m-4-4v8" stroke="white" strokeWidth="2" strokeLinecap="round" /><path d="M214 75h47" stroke="#B7C8BD" strokeWidth="4" strokeLinecap="round" />
      <text x="190" y="111" fill="#75867C" fontSize="9" fontFamily="sans-serif">SOLDE DE LA CAISSE</text><text x="190" y="134" fill="#163D32" fontSize="17" fontWeight="700" fontFamily="sans-serif">{new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(balance)}</text><text x="274" y="134" fill="#75867C" fontSize="8" fontFamily="sans-serif">FCFA</text>
      <path d="M191 197c14-2 19-29 34-24s19 23 34 8 23-26 34-23" stroke="#0A805B" strokeWidth="3" strokeLinecap="round" /><path d="M191 202c17-6 21-12 35-8s20 17 34 8 22-14 33-11" stroke="#F47721" strokeWidth="2.5" strokeLinecap="round" /><circle cx="259" cy="181" r="4" fill="white" stroke="#F47721" strokeWidth="2" />
      <rect x="190" y="222" width="52" height="23" rx="7" fill="#E4F2E8" /><circle cx="201" cy="233.5" r="4" fill="#0A805B" /><path d="M210 232h23" stroke="#9CB5A5" strokeWidth="3" strokeLinecap="round" /><rect x="248" y="222" width="43" height="23" rx="7" fill="#FFF0E4" /><path d="M258 233h22" stroke="#E8A16C" strokeWidth="3" strokeLinecap="round" />
    </g>
    <g className="dashboard-art-float dashboard-art-float-top"><rect x="311" y="73" width="121" height="58" rx="15" fill="white" /><circle cx="333" cy="102" r="12" fill="#E5F4EA" /><path d="m328 102 4 4 7-9" stroke="#0A805B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M354 96h58M354 106h40" stroke="#8AA096" strokeWidth="4" strokeLinecap="round" /></g>
    <g className="dashboard-art-float dashboard-art-float-bottom"><rect x="47" y="188" width="126" height="57" rx="15" fill="white" /><circle cx="70" cy="216" r="13" fill="#FFF0E4" /><path d="M66 216h8m-4-4v8" stroke="#E8651A" strokeWidth="2" strokeLinecap="round" /><path d="M92 210h62M92 221h43" stroke="#8AA096" strokeWidth="4" strokeLinecap="round" /></g>
    <path d="M84 73c6-9 12-9 18 0m262 119c6-9 12-9 18 0" stroke="#FBC99F" strokeWidth="3" strokeLinecap="round" /><circle cx="357" cy="253" r="5" fill="#F47721" /><circle cx="120" cy="156" r="4" fill="#A7D8B8" />
  </svg>
);

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
    <div className="dashboard-page space-y-6">
      {/* Top Banner / Welcome */}
      <section className="dashboard-hero relative isolate overflow-hidden rounded-[1.75rem] p-6 sm:p-8 lg:p-9">
        <div className="dashboard-hero-copy relative z-10 max-w-2xl">
          <div className="dashboard-eyebrow"><span className="dashboard-live-dot" />{t('Pilotage de votre organisation')}</div>
          <div className="flex items-center gap-2 flex-wrap mt-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {currentOrg.name}
            </h1>
            <span className="dashboard-org-type text-[11px] font-semibold uppercase px-2.5 py-1 rounded-full">
              {currentOrg.type}
            </span>
          </div>
          <p className="text-sm text-emerald-50/80 mt-2">
            {currentOrg.location} <span className="mx-1.5 text-white/35">·</span> {orgMembers.length} {t('membres enregistrés')} <span className="mx-1.5 text-white/35">·</span> {t('Devise FCFA')}
          </p>
          <p className="mt-5 max-w-lg text-sm leading-6 text-white/75">{t('Une vue claire de vos cotisations, paiements et dépenses pour prendre les bonnes décisions ensemble.')}</p>

        {/* Quick action buttons */}
        <div className="dashboard-hero-actions mt-6 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="dashboard-hero-button"
            onClick={onOpenInviteModal}
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
          >
            {t("Lien d'invitation")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="dashboard-hero-button"
            onClick={onOpenAddMember}
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
          >
            {t('Ajouter membre')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="dashboard-hero-button"
            onClick={onOpenCreateExpense}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            + {t('Dépense')}
          </Button>
          <Button
            size="sm"
            onClick={onOpenCreateContribution}
            className="dashboard-hero-primary"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            + {t('Cotisation')}
          </Button>
        </div>
        </div>
        <DashboardIllustration balance={netBalance} />
        <div className="dashboard-hero-glow" aria-hidden="true" />
      </section>

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('Total collecté')}
          value={formatFCFA(totalCollected)}
          subValue={`${validatedPayments.length} ${t('versements validés')}`}
          icon={<Wallet className="w-4 h-4 text-emerald-700" />}
          onClick={() => onNavigateTab('payments')}
          accent="green"
        />
        <StatCard
          label={t('Total dépenses')}
          value={formatFCFA(totalExpenses)}
          subValue={`${activeExpenses.length} ${t('dépenses enregistrées')}`}
          icon={<Receipt className="w-4 h-4 text-rose-600" />}
          onClick={() => onNavigateTab('expenses')}
          accent="rose"
        />
        <StatCard
          label={t('Solde net en caisse')}
          value={formatFCFA(netBalance)}
          subValue={t('Fonds disponibles (Wave/OM/Cash)')}
          icon={<Scale className="w-4 h-4 text-emerald-800" />}
          accent="blue"
        />
        <StatCard
          label={t('Cotisations en retard')}
          value={overdueMembersCount}
          subValue={t('Membres à relancer')}
          icon={<Clock className="w-4 h-4 text-amber-600" />}
          onClick={() => onNavigateTab('contributions')}
          accent="amber"
        />
      </div>

      {/* Action alerts if pending items */}
      {(pendingPayments.length > 0 || pendingMembers.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingPayments.length > 0 && (
            <div className="dashboard-alert dashboard-alert-payment bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
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
            <div className="dashboard-alert dashboard-alert-member bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
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
          <div className="dashboard-panel bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
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
          <div className="dashboard-panel bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">{t('Activité Récente')}</h3>
              <span className="text-[11px] text-slate-400">{t('Dernières 48h')}</span>
            </div>

            <div className="space-y-3">
              {orgPayments.slice(0, 5).map(pay => (
                <div
                  key={pay.id}
                  className="dashboard-activity-row p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between"
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
          <div className="dashboard-accounts-card bg-slate-900 text-white rounded-xl p-5 border border-slate-800">
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
