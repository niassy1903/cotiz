import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useData } from '../../context/DataContext';
import { Payment } from '../../types/payment';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { Check, X, ShieldAlert } from 'lucide-react';

interface PaymentValidationModalProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentValidationModal: React.FC<PaymentValidationModalProps> = ({
  payment,
  isOpen,
  onClose,
}) => {
  const { validatePayment, rejectPayment } = useData();

  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!payment) return null;

  const handleValidate = async () => {
    setIsSaving(true);
    const saved = await validatePayment(payment.id, notes);
    setIsSaving(false);
    if (saved) onClose();
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setIsSaving(true);
    const saved = await rejectPayment(payment.id, rejectReason);
    setIsSaving(false);
    if (saved) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vérification de Paiement"
      subtitle={`Transaction : ${payment.transactionId}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Payment summary box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Membre :</span>
            <span className="font-bold text-slate-900">{payment.memberName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Montant déclaré :</span>
            <span className="font-bold font-tabular text-emerald-800 text-sm">
              {formatFCFA(payment.amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Moyen de paiement :</span>
            <span className="font-semibold uppercase text-slate-800">{payment.method}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Cotisation associée :</span>
            <span className="font-medium text-slate-800">{payment.contributionTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Date de déclaration :</span>
            <span className="text-slate-700">{formatDate(payment.paymentDate, { showTime: true })}</span>
          </div>
          {payment.notes && (
            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-500 block mb-0.5">Note du membre :</span>
              <p className="italic text-slate-700 bg-white p-2 rounded border border-slate-100">
                "{payment.notes}"
              </p>
            </div>
          )}
        </div>

        {/* Validation or Rejection Form */}
        {!isRejecting ? (
          <div className="space-y-3">
            <Input
              label="Commentaire de validation (optionnel)"
              placeholder="Ex: Reçu confirmé sur le compte Wave pro"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setIsRejecting(true)}
                leftIcon={<X className="w-4 h-4" />}
              >
                Rejeter le paiement
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Annuler
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleValidate}
                  isLoading={isSaving}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Valider le paiement
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-3 bg-rose-50 rounded-xl border border-rose-200">
            <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs">
              <ShieldAlert className="w-4 h-4" />
              <span>Motif du rejet :</span>
            </div>
            <Input
              placeholder="Ex: Transaction introuvable ou montant erroné"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRejecting(false)}
              >
                Retour
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                isLoading={isSaving}
              >
                Confirmer le rejet
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
