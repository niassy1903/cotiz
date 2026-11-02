import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useData } from '../../context/DataContext';
import { copyToClipboard } from '../../utils/helpers';
import { api, getApiErrorMessage } from '../../api/client';
import { Copy, Check, Share2, RefreshCw, Clock, Link2 } from 'lucide-react';

interface InviteLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteLinkModal: React.FC<InviteLinkModalProps> = ({ isOpen, onClose }) => {
  const { currentOrg } = useData();
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const requestStarted = useRef(false);

  const generateInvite = useCallback(async () => {
    setInviteError('');
    setIsLoading(true);
    try {
      const invitation = await api.invitations.create(currentOrg.id);
      setInviteUrl(invitation.url);
      setCopied(false);
    } catch (error) {
      setInviteError(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg.id]);

  useEffect(() => {
    if (!isOpen) {
      requestStarted.current = false;
      return;
    }
    if (requestStarted.current) return;
    requestStarted.current = true;
    void generateInvite();
  }, [generateInvite, isOpen]);

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Rejoignez ${currentOrg.name} sur Cotiz pour suivre et régler vos cotisations en toute transparence : ${inviteUrl}`
  )}`;

  const handleCopy = () => {
    copyToClipboard(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lien d'Invitation de l'Organisation"
      subtitle={`Partagez ce lien avec les membres de ${currentOrg.name}`}
      maxWidth="md"
    >
      <div className="space-y-5 text-center">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 inline-flex flex-col items-center gap-2 shadow-xs">
          <Link2 className="w-12 h-12 text-emerald-800" />
          <span className="text-xs text-slate-600 font-medium">
            Lien d'adhésion sécurisé à usage unique
          </span>
        </div>

        {/* Expiration badge */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-amber-700 bg-amber-50 py-1.5 px-3 rounded-lg border border-amber-200/80 w-fit mx-auto">
          <Clock className="w-3.5 h-3.5" />
          <span>Le lien est sécurisé et expire après 72 heures</span>
        </div>

        {/* Link box */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-left">
          <input
            type="text"
            readOnly
            value={inviteUrl}
            className="flex-1 bg-transparent px-2 text-xs font-mono text-slate-700 outline-none select-all"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            disabled={!inviteUrl}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? 'Copié' : 'Copier'}
          </Button>
        </div>
        {inviteError && <p role="alert" className="text-xs text-rose-700">{inviteError}</p>}

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          <a
            href={inviteUrl ? whatsappUrl : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center font-medium text-xs px-4 py-2 gap-2 rounded-lg bg-[#25D366] text-white hover:bg-[#20ba5a] transition-colors shadow-2xs"
          >
            <Share2 className="w-4 h-4" />
            <span>Partager sur WhatsApp</span>
          </a>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void generateInvite()}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Générer un nouveau lien
          </Button>
        </div>
      </div>
    </Modal>
  );
};
