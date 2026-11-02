import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useData } from '../../context/DataContext';
import { Contribution } from '../../types/contribution';
import { formatFCFA, formatDate, getInitials } from '../../utils/formatters';
import { CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp, Lock } from 'lucide-react';

interface ContributionDetailsModalProps {
  contribution: Contribution | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onRecordPaymentForMember?: (memberId: string, cycleId: string) => void;
}

export const ContributionDetailsModal: React.FC<ContributionDetailsModalProps> = ({
  contribution,
  isOpen,
  onClose,
  isAdmin,
  onRecordPaymentForMember,
}) => {
  const { orgCycles, orgMembers, orgPayments, closeCycle } = useData();
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);

  if (!contribution) return null;

  const contribCycles = orgCycles.filter(c => c.contributionId === contribution.id);
  const totalCollected = contribCycles.reduce((acc, c) => acc + c.totalCollected, 0);
  const totalExpected = contribCycles.reduce((acc, c) => acc + c.expectedAmount, 0);
  const progressPercent = totalExpected > 0 ? Math.min(100, Math.round((totalCollected / totalExpected) * 100)) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contribution.title}
      subtitle={`Fréquence : ${contribution.frequency} · Début le ${formatDate(contribution.startDate)}`}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Montant attendu
            </span>
            <span className="text-base font-bold font-tabular text-slate-900">
              {formatFCFA(totalExpected)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total collecté
            </span>
            <span className="text-base font-bold font-tabular text-emerald-800">
              {formatFCFA(totalCollected)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Complétude
            </span>
            <span className="text-base font-bold font-tabular text-slate-900">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>{contribCycles.length} cycle(s) généré(s)</span>
            <span>Reste à percevoir : {formatFCFA(Math.max(0, totalExpected - totalCollected))}</span>
          </div>
        </div>

        {/* Cycles list */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Échéances et Cycles de Cotisation
          </h4>

          {contribCycles.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Aucun cycle pour le moment.</p>
          ) : (
            contribCycles.map(cycle => {
              const isExpanded = expandedCycleId === cycle.id;
              const cyclePayments = orgPayments.filter(p => p.cycleId === cycle.id && p.status === 'validated');
              const cycleProgress = cycle.expectedAmount > 0 ? Math.round((cycle.totalCollected / cycle.expectedAmount) * 100) : 0;

              return (
                <div
                  key={cycle.id}
                  className="rounded-xl border border-slate-200/80 overflow-hidden bg-white shadow-2xs"
                >
                  {/* Cycle Header */}
                  <div
                    onClick={() => setExpandedCycleId(isExpanded ? null : cycle.id)}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center">
                        #{cycle.cycleNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-slate-900">{cycle.periodLabel}</h5>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.2 rounded ${
                              cycle.status === 'open'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {cycle.status === 'open' ? 'Ouverte' : 'Clôturée'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Échéance : {formatDate(cycle.dueDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs font-bold font-tabular text-slate-900 block">
                          {formatFCFA(cycle.totalCollected)} / {formatFCFA(cycle.expectedAmount)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {cycleProgress}% collecté
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Members breakdown */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/40 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">
                          État des membres pour cette échéance :
                        </span>
                        {isAdmin && cycle.status === 'open' && (
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<Lock className="w-3.5 h-3.5" />}
                            onClick={e => {
                              e.stopPropagation();
                              closeCycle(cycle.id);
                            }}
                          >
                            Clôturer ce cycle
                          </Button>
                        )}
                      </div>

                      <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto bg-white rounded-lg border border-slate-200">
                        {orgMembers.map(member => {
                          const payment = cyclePayments.find(p => p.memberId === member.id);
                          const isPaid = !!payment;
                          const isOverdue = !isPaid && new Date(cycle.dueDate) < new Date();

                          return (
                            <div
                              key={member.id}
                              className="p-2.5 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px] flex items-center justify-center">
                                  {getInitials(`${member.firstName} ${member.lastName}`)}
                                </div>
                                <div>
                                  <span className="font-medium text-slate-800">
                                    {member.firstName} {member.lastName}
                                  </span>
                                  {member.isGhost && (
                                    <span className="ml-1 text-[10px] text-slate-400">(Fantôme)</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                {isPaid ? (
                                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Payé ({formatFCFA(payment.amount)})</span>
                                  </span>
                                ) : isOverdue ? (
                                  <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>En retard</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>En attente</span>
                                  </span>
                                )}

                                {isAdmin && !isPaid && (
                                  <button
                                    onClick={() => onRecordPaymentForMember?.(member.id, cycle.id)}
                                    className="px-2 py-0.5 text-[10px] font-medium rounded border border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
                                  >
                                    Encaisser
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
