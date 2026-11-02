import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { PaymentMethod } from '../../types/payment';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { CheckCircle2, Smartphone, Banknote, ShieldCheck, ArrowRight, Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../utils/helpers';

interface MakePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedContributionId?: string;
}

export const MakePaymentModal: React.FC<MakePaymentModalProps> = ({
  isOpen,
  onClose,
  preselectedContributionId,
}) => {
  const { user } = useAuth();
  const { currentOrg, orgContributions, orgMembers, recordPayment } = useData();

  const currentMember =
    orgMembers.find(m => m.userId === user?.id || m.email === user?.email) || orgMembers[0];

  const [contributionId, setContributionId] = useState(
    preselectedContributionId || orgContributions[0]?.id || ''
  );
  const selectedContrib = orgContributions.find(c => c.id === contributionId) || orgContributions[0];

  const [amount, setAmount] = useState<number>(selectedContrib?.amount || 5000);
  const [method, setMethod] = useState<PaymentMethod>('wave');
  const [notes, setNotes] = useState('');

  // Flow steps: 'form' -> 'waiting' -> 'success'
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [completedPayment, setCompletedPayment] = useState<any>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');

    const payment = await recordPayment({
      contributionId: selectedContrib?.id || '',
      memberId: currentMember?.id || '',
      amount: Number(amount),
      method,
      notes: notes || undefined,
    });
    if (payment) {
      setCompletedPayment(payment);
      setStep('success');
    } else {
      setStep('form');
    }
  };

  const handleCopyTransaction = () => {
    if (completedPayment?.transactionId) {
      copyToClipboard(completedPayment.transactionId);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setStep('form');
    setCompletedPayment(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'success' ? 'Reçu de Paiement' : 'Régler une Cotisation'}
      subtitle={`Organisation bénéficiaire : ${currentOrg.name}`}
      maxWidth="md"
    >
      {step === 'form' && (
        <form onSubmit={handleStartPayment} className="space-y-4">
          {/* Select Contribution */}
          <Select
            label="Sélectionnez la cotisation"
            value={contributionId}
            onChange={e => {
              setContributionId(e.target.value);
              const found = orgContributions.find(c => c.id === e.target.value);
              if (found) setAmount(found.amount);
            }}
            options={orgContributions.map(c => ({
              value: c.id,
              label: `${c.title} (${formatFCFA(c.amount)})`,
            }))}
          />

          {/* Amount input */}
          <Input
            label="Montant à verser (FCFA)"
            type="number"
            min="100"
            step="500"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            helperText="Paiement en avance ou partiel possible"
            required
          />

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Moyen de paiement
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Wave */}
              <button
                type="button"
                onClick={() => setMethod('wave')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  method === 'wave'
                    ? 'border-sky-500 bg-sky-50 text-sky-950 font-semibold ring-1 ring-sky-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-black text-xs">
                  W
                </div>
                <span className="text-xs">Wave</span>
                <span className="text-[10px] text-sky-700">Déclaration</span>
              </button>

              {/* Orange Money */}
              <button
                type="button"
                onClick={() => setMethod('orange_money')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  method === 'orange_money'
                    ? 'border-orange-500 bg-orange-50 text-orange-950 font-semibold ring-1 ring-orange-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-black text-xs">
                  OM
                </div>
                <span className="text-xs">Orange Money</span>
                <span className="text-[10px] text-orange-700">Mobile #</span>
              </button>

              {/* Cash */}
              <button
                type="button"
                onClick={() => setMethod('cash')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  method === 'cash'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                  <Banknote className="w-4 h-4" />
                </div>
                <span className="text-xs">Espèces</span>
                <span className="text-[10px] text-emerald-700">Validé admin</span>
              </button>
            </div>
          </div>

          {/* Account destination preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Numéro de destination officiel :
            </span>
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>
                {method === 'wave'
                  ? 'Compte Wave de l’organisation'
                  : method === 'orange_money'
                  ? 'Compte Orange Money'
                  : 'Trésorier du Dahira'}
              </span>
              <span className="font-tabular text-emerald-800">
                {method === 'wave'
                  ? currentOrg.waveNumber
                  : method === 'orange_money'
                  ? currentOrg.orangeMoneyNumber
                  : currentOrg.adminName}
              </span>
            </div>
          </div>

          <Input
            label="Notes ou références (optionnel)"
            placeholder="Ex: Paiement avec le numéro de mon conjoint"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant={method === 'wave' ? 'primary' : method === 'orange_money' ? 'secondary' : 'primary'}
            >
              Déclarer un versement de {formatFCFA(amount)}
            </Button>
          </div>
        </form>
      )}

      {step === 'processing' && (
        <div className="py-12 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center animate-pulse">
            <Smartphone className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-900">
            Connexion au réseau {method === 'wave' ? 'Wave' : method === 'orange_money' ? 'Orange Money' : 'Cotiz'}...
          </h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Enregistrement de votre déclaration de versement pour {formatFCFA(amount)}.
          </p>
        </div>
      )}

      {step === 'success' && completedPayment && (
        <div className="space-y-4">
          {/* Success Banner */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-emerald-950">Paiement Enregistré !</h4>
            <p className="text-xs text-emerald-700">
              Votre versement a été transmis aux administrateurs de {currentOrg.name}.
            </p>
          </div>

          {/* Receipt details */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Montant versé :</span>
              <span className="font-bold text-slate-900 font-tabular text-sm">
                {formatFCFA(completedPayment.amount)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Cotisation :</span>
              <span className="font-semibold text-slate-800">{completedPayment.contributionTitle}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Méthode :</span>
              <span className="font-semibold uppercase text-slate-800">{completedPayment.method}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500">Identifiant Transaction :</span>
              <div className="flex items-center gap-1 font-mono font-medium text-slate-800">
                <span>{completedPayment.transactionId}</span>
                <button
                  onClick={handleCopyTransaction}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Copier"
                >
                  {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Date & heure :</span>
              <span className="font-medium text-slate-800">{formatDate(completedPayment.paymentDate, { showTime: true })}</span>
            </div>
          </div>

          <Button className="w-full" onClick={handleClose}>
            Retour à l'accueil
          </Button>
        </div>
      )}
    </Modal>
  );
};
