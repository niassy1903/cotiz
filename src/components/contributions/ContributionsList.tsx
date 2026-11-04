import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { SectionHero } from '../common/SectionHero';
import { ContributionDetailsModal } from './ContributionDetailsModal';
import { Contribution } from '../../types/contribution';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { Wallet, Plus, Calendar, Users, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePreferences } from '../../context/PreferencesContext';

interface ContributionsListProps {
  onOpenCreate: () => void;
  onOpenMakePayment: (contributionId: string) => void;
}

export const ContributionsList: React.FC<ContributionsListProps> = ({
  onOpenCreate,
  onOpenMakePayment,
}) => {
  const { user } = useAuth();
  const { orgContributions, orgCycles, orgPayments, orgMembers } = useData();
  const { t } = usePreferences();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);

  const filtered = orgContributions.filter(c => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return c.status === 'active';
    if (statusFilter === 'archived') return c.status === 'archived';
    return true;
  });

  return (
    <div className="space-y-6">
      <SectionHero
        theme="contributions"
        eyebrow={t('Collectes de la communauté')}
        title={isAdmin ? t('Gestion des Cotisations') : t('Mes Cotisations Communautaires')}
        description={isAdmin
          ? t('Paramétrage des montants, fréquences et suivi des cycles d’échéance')
          : t('Consultez vos cotisations et effectuez vos règlements')}
        detail={`${orgContributions.filter(c => c.status === 'active').length} ${t('cotisations actives')}`}
        action={isAdmin && <Button onClick={onOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>{t('Nouvelle cotisation')}</Button>}
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs w-fit">
        {[
          { id: 'active', label: `${t('Actives')} (${orgContributions.filter(c => c.status === 'active').length})` },
          { id: 'all', label: `${t('Toutes')} (${orgContributions.length})` },
          { id: 'archived', label: t('Archivées') },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
            className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contributions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(contrib => {
          const cycles = orgCycles.filter(c => c.contributionId === contrib.id);
          const totalCollected = cycles.reduce((acc, c) => acc + c.totalCollected, 0);
          const totalExpected = cycles.reduce((acc, c) => acc + c.expectedAmount, 0);
          const percent = totalExpected > 0 ? Math.min(100, Math.round((totalCollected / totalExpected) * 100)) : 0;

          // Check if current user paid for active cycle
          const userPaid = orgPayments.some(
            p => p.contributionId === contrib.id && p.memberName.includes(user?.firstName || 'Lamine') && p.status === 'validated'
          );

          return (
            <div
              key={contrib.id}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {t(contrib.frequency)}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {contrib.title}
                </h3>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-xl font-bold font-tabular text-emerald-900">
                    {formatFCFA(contrib.amount)}
                  </span>
                  {contrib.targetType === 'by_gender' && (
                    <span className="text-[11px] text-slate-500">
                      ({t('Femmes')} : {formatFCFA(contrib.amountFemale || 0)})
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{t('Échéance mensuelle :')}</span>
                    <span className="font-medium text-slate-800">
                      {t('Le')} {contrib.dayOfMonth || 5} {t('de chaque mois')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{t('Cible :')}</span>
                    <span className="font-medium text-slate-800 capitalize">
                      {contrib.targetType === 'all'
                        ? t('Tous les membres')
                        : contrib.targetType === 'by_gender'
                        ? t('Différencié par genre')
                        : t('Personnalisé')}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">{t('Taux de collecte actuel')}</span>
                      <span className="font-bold text-slate-900 font-tabular">{percent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full rounded-full bg-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedContribution(contrib)}
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                >
                  {t('Détails & Cycles')}
                </Button>

                {!isAdmin && (
                  <Button
                    size="sm"
                    variant={userPaid ? 'outline' : 'secondary'}
                    onClick={() => onOpenMakePayment(contrib.id)}
                  >
                    {userPaid ? t('Payer à nouveau') : t('Régler')}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Details & Cycles Modal */}
      <ContributionDetailsModal
        contribution={selectedContribution}
        isOpen={!!selectedContribution}
        onClose={() => setSelectedContribution(null)}
        isAdmin={isAdmin}
      />
    </div>
  );
};
