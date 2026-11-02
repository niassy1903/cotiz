import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ConfirmModal } from '../common/ConfirmModal';
import { useData } from '../../context/DataContext';
import { Member } from '../../types/member';
import { formatFCFA, formatDate, getInitials } from '../../utils/formatters';
import {
  Wallet,
  Clock,
  ShieldCheck,
  ShieldOff,
  UserX,
  KeyRound,
  CheckCircle2,
  Calendar,
  History,
} from 'lucide-react';

interface MemberDetailsModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({
  member,
  isOpen,
  onClose,
  isAdmin,
}) => {
  const {
    orgPayments,
    toggleTransactionAccess,
    transferAdminRole,
    deleteMember,
  } = useData();

  const [activeTab, setActiveTab] = useState<'stats' | 'payments' | 'actions'>('stats');
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!member) return null;

  const memberPayments = orgPayments.filter(p => p.memberId === member.id);
  const validatedPayments = memberPayments.filter(p => p.status === 'validated');
  const totalPaid = validatedPayments.reduce((acc, p) => acc + p.amount, 0);

  // Solde calculé
  const currentDue = memberPayments.some(p => p.status === 'pending') ? 5000 : 0;
  const lastPayment = validatedPayments[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${member.firstName} ${member.lastName}`}
      subtitle={`Membre ${member.isGhost ? 'Fantôme (géré par admin)' : 'Actif'} · Adhésion : ${formatDate(member.joinDate)}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Profile Card Summary */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-emerald-800 text-white font-bold text-base flex items-center justify-center shrink-0">
            {getInitials(`${member.firstName} ${member.lastName}`)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {member.firstName} {member.lastName}
              </h3>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.2 rounded bg-slate-200 text-slate-700">
                {member.gender === 'M' ? 'Homme' : 'Femme'}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.2 rounded ${
                  member.role === 'admin'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {member.role === 'admin' ? 'Administrateur' : 'Membre'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {member.phone} {member.email && `· ${member.email}`}
            </p>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'stats' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Statistiques Personnelles
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'payments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Historique ({memberPayments.length})
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('actions')}
              className={`flex-1 py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'actions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Droits & Gestion
            </button>
          )}
        </div>

        {/* Tab 1: Stats */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total payé (Lifetime)
                </span>
                <span className="text-sm font-bold font-tabular text-emerald-800 mt-1 block">
                  {formatFCFA(totalPaid)}
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Solde actuel dû
                </span>
                <span className="text-sm font-bold font-tabular text-slate-900 mt-1 block">
                  {formatFCFA(currentDue)}
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Dernier versement
                </span>
                <span className="text-xs font-semibold text-slate-800 mt-1 block">
                  {lastPayment ? formatDate(lastPayment.paymentDate, { short: true }) : 'Aucun'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Statut de compte :</span>
                <span className="font-semibold text-slate-800 capitalize">{member.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Accès aux transactions financières :</span>
                <span
                  className={`font-semibold ${
                    member.hasTransactionAccess ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {member.hasTransactionAccess ? 'Autorisé' : 'Restreint'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Payments */}
        {activeTab === 'payments' && (
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {memberPayments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                Aucun paiement enregistré pour ce membre.
              </p>
            ) : (
              memberPayments.map(p => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      {p.contributionTitle}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {p.method.toUpperCase()} · {formatDate(p.paymentDate, { short: true })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-tabular text-slate-900 block">
                      {formatFCFA(p.amount)}
                    </span>
                    <span
                      className={`text-[10px] font-medium ${
                        p.status === 'validated' ? 'text-emerald-700' : 'text-amber-600'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Admin Management Actions */}
        {activeTab === 'actions' && isAdmin && (
          <div className="space-y-3 pt-1">
            {/* Toggle Transaction access */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-slate-800">
                  Visibilité des transactions
                </h5>
                <p className="text-[11px] text-slate-500">
                  Autorise ce membre à consulter l'historique complet et les dépenses de l'organisation.
                </p>
              </div>
              <Button
                size="sm"
                variant={member.hasTransactionAccess ? 'outline' : 'primary'}
                onClick={() => toggleTransactionAccess(member.id)}
              >
                {member.hasTransactionAccess ? 'Révoquer l’accès' : 'Accorder l’accès'}
              </Button>
            </div>

            {/* Transfer admin role */}
            {member.role !== 'admin' && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800">
                    Transférer le rôle Administrateur
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Délègue la gestion complète de l'organisation à ce membre.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmTransfer(true)}
                  leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                >
                  Transférer rôle
                </Button>
              </div>
            )}

            {/* Soft Delete */}
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-rose-900">
                  Archiver ce membre
                </h5>
                <p className="text-[11px] text-rose-700">
                  Suppression logique : ses cotisations passées restent conservées dans le bilan.
                </p>
              </div>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setConfirmDelete(true)}
                leftIcon={<UserX className="w-3.5 h-3.5" />}
              >
                Archiver
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={confirmTransfer}
        onClose={() => setConfirmTransfer(false)}
        onConfirm={() => {
          transferAdminRole(member.id);
          setConfirmTransfer(false);
          onClose();
        }}
        title="Transférer le rôle d'administrateur ?"
        description={`Êtes-vous certain de vouloir désigner ${member.firstName} ${member.lastName} comme unique administrateur actif de ${member.orgId} ? Votre compte redeviendra simple membre.`}
        confirmLabel="Confirmer le transfert"
      />

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteMember(member.id);
          setConfirmDelete(false);
          onClose();
        }}
        title="Archiver ce membre ?"
        description={`Le membre ${member.firstName} ${member.lastName} ne pourra plus accéder à l'organisation, mais tout son historique financier sera préservé.`}
        confirmLabel="Archiver définitivement"
        isDestructive
      />
    </Modal>
  );
};
