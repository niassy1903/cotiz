import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { Search, User, Wallet, ArrowLeftRight } from 'lucide-react';
import { formatFCFA, formatDate, getInitials } from '../../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult?: (type: 'member' | 'contribution' | 'payment', id: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const { orgMembers, orgContributions, orgPayments } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'members' | 'contributions' | 'payments'>('all');

  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) return { members: [], contributions: [], payments: [] };
    const q = searchTerm.toLowerCase();

    const members = (filterType === 'all' || filterType === 'members')
      ? orgMembers.filter(
          m =>
            m.firstName.toLowerCase().includes(q) ||
            m.lastName.toLowerCase().includes(q) ||
            m.phone.includes(q) ||
            m.email?.toLowerCase().includes(q)
        )
      : [];

    const contributions = (filterType === 'all' || filterType === 'contributions')
      ? orgContributions.filter(c => c.title.toLowerCase().includes(q))
      : [];

    const payments = (filterType === 'all' || filterType === 'payments')
      ? orgPayments.filter(
          p =>
            p.memberName.toLowerCase().includes(q) ||
            p.transactionId.toLowerCase().includes(q) ||
            p.contributionTitle.toLowerCase().includes(q)
        )
      : [];

    return { members, contributions, payments };
  }, [searchTerm, filterType, orgMembers, orgContributions, orgPayments]);

  const totalResults =
    filteredResults.members.length +
    filteredResults.contributions.length +
    filteredResults.payments.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Recherche Globale" maxWidth="lg">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            autoFocus
            type="text"
            placeholder="Rechercher un membre, une cotisation, une transaction..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          {[
            { id: 'all', label: 'Tout' },
            { id: 'members', label: `Membres (${orgMembers.length})` },
            { id: 'contributions', label: `Cotisations (${orgContributions.length})` },
            { id: 'payments', label: `Paiements (${orgPayments.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as typeof filterType)}
              className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
                filterType === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results Area */}
        <div className="max-h-80 overflow-y-auto space-y-4 pt-1">
          {searchTerm.trim() === '' ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Tapez au moins une lettre pour chercher dans l'organisation...
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Aucun résultat pour <span className="font-semibold">"{searchTerm}"</span>
            </div>
          ) : (
            <>
              {/* Members */}
              {filteredResults.members.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Membres ({filteredResults.members.length})
                  </h4>
                  <div className="space-y-1">
                    {filteredResults.members.map(m => (
                      <div
                        key={m.id}
                        onClick={() => {
                          onSelectResult?.('member', m.id);
                          onClose();
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center justify-center">
                            {getInitials(`${m.firstName} ${m.lastName}`)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">
                              {m.firstName} {m.lastName}{' '}
                              {m.isGhost && (
                                <span className="text-[10px] text-slate-400">(Fantôme)</span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500">{m.phone}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 capitalize">{m.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contributions */}
              {filteredResults.contributions.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Cotisations ({filteredResults.contributions.length})
                  </h4>
                  <div className="space-y-1">
                    {filteredResults.contributions.map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onSelectResult?.('contribution', c.id);
                          onClose();
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                            <Wallet className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{c.title}</p>
                            <p className="text-[11px] text-slate-500 capitalize">{c.frequency}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold font-tabular text-emerald-800">
                          {formatFCFA(c.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments */}
              {filteredResults.payments.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Transactions ({filteredResults.payments.length})
                  </h4>
                  <div className="space-y-1">
                    {filteredResults.payments.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onSelectResult?.('payment', p.id);
                          onClose();
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
                            <ArrowLeftRight className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{p.memberName}</p>
                            <p className="text-[11px] text-slate-500">
                              {p.transactionId} · {formatDate(p.paymentDate, { short: true })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold font-tabular text-slate-900">
                            {formatFCFA(p.amount)}
                          </p>
                          <span className="text-[10px] text-emerald-700 capitalize">
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
