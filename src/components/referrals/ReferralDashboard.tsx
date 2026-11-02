import React, { useEffect, useState } from 'react';
import { ReferralData } from '../../types';
import { api, getApiErrorMessage } from '../../api/client';
import { StatCard } from '../common/StatCard';
import { Button } from '../common/Button';
import { formatFCFA, formatDate } from '../../utils/formatters';
import { copyToClipboard } from '../../utils/helpers';
import { Gift, Copy, Check, Users, TrendingUp, Smartphone } from 'lucide-react';
import { usePreferences } from '../../context/PreferencesContext';

export const ReferralDashboard: React.FC = () => {
  const { t } = usePreferences();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRotating, setIsRotating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.referrals.show()
      .then(setReferralData)
      .catch(error => setError(getApiErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, []);

  const handleGenerateNewCode = async () => {
    setIsRotating(true);
    setError('');
    try {
      setReferralData(await api.referrals.rotate());
    } catch (error) {
      setError(getApiErrorMessage(error));
    } finally {
      setIsRotating(false);
    }
  };

  const handleCopyCode = () => {
    if (!referralData) return;
    copyToClipboard(referralData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!referralData) {
    return (
      <div role={error ? 'alert' : undefined} className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        {error || (isLoading ? t('Chargement du programme de parrainage…') : t('Aucun code de parrainage disponible.'))}
      </div>
    );
  }

  const referralUrl = `${window.location.origin}/?ref=${encodeURIComponent(referralData.code)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('Programme de Parrainage')}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('Partagez votre code pour suivre les nouvelles organisations inscrites.')}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void handleGenerateNewCode()} isLoading={isRotating}>
          {t('Nouveau code promo')}
        </Button>
      </div>

      {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}

      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2.5 py-1 rounded-md">
            {t("Code d'affiliation Cotiz")}
          </span>
          <h2 className="text-lg font-bold">{t('Votre code partenaire')}</h2>
          <p className="text-xs text-slate-300 max-w-md">
            {t('Les inscriptions effectuées avec ce code sont comptabilisées ici. Les commissions et versements nécessitent une facturation Cotiz active.')}
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl border border-white/20">
            <span className="text-base font-mono font-black text-amber-400 px-4 select-all">{referralData.code}</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopyCode}
              leftIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? t('Copié !') : t('Copier')}
            </Button>
          </div>
          <a className="text-xs text-emerald-200 underline" href={referralUrl} onClick={event => {
            event.preventDefault();
            copyToClipboard(referralUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}>
            {copied ? t('Lien copié !') : t("Copier le lien d'inscription")}
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('Organisations inscrites')} value={referralData.totalUses} subValue={t('Via votre code')} icon={<Users className="w-4 h-4 text-emerald-700" />} />
        <StatCard label={t('Commissions cumulées')} value={formatFCFA(referralData.totalCommission)} subValue={t('Facturation non configurée')} icon={<TrendingUp className="w-4 h-4 text-emerald-800" />} />
        <StatCard label={t('Commissions versées')} value={formatFCFA(referralData.paidCommission)} subValue={t('Versements non configurés')} icon={<Smartphone className="w-4 h-4 text-sky-600" />} />
        <StatCard label={t('En attente de versement')} value={formatFCFA(referralData.pendingCommission)} subValue={t('Aucune commission comptabilisée')} icon={<Gift className="w-4 h-4 text-amber-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">{t('Organisations Référées')}</h3>
          <div className="divide-y divide-slate-100">
            {referralData.convertedOrgs.length ? referralData.convertedOrgs.map((org, index) => (
              <div key={`${org.orgName}-${index}`} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900 block">{org.orgName}</span>
                  <span className="text-[10px] text-slate-400">{formatDate(org.date)} · {t('Plan')} {org.plan}</span>
                </div>
                <span className="font-bold font-tabular text-emerald-800">+{formatFCFA(org.commissionAmount)}</span>
              </div>
            )) : <p className="py-3 text-xs text-slate-500">{t('Aucune inscription avec ce code pour le moment.')}</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">{t('Historique des Versements')}</h3>
          <div className="divide-y divide-slate-100">
            {referralData.payouts.length ? referralData.payouts.map(payout => (
              <div key={payout.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900 block">{t('Virement')} {payout.method} {payout.waveNumber}</span>
                  <span className="text-[10px] text-slate-400">{formatDate(payout.date)}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold font-tabular text-slate-900 block">{formatFCFA(payout.amount)}</span>
                  <span className={`text-[10px] font-semibold ${payout.status === 'paid' ? 'text-emerald-700' : 'text-amber-600'}`}>
                    {payout.status === 'paid' ? t('Versé') : t('En attente')}
                  </span>
                </div>
              </div>
            )) : <p className="py-3 text-xs text-slate-500">{t('Aucun versement enregistré.')}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
