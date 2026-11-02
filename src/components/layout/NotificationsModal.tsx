import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { Button } from '../common/Button';
import { Bell, CheckCheck, Wallet, ArrowLeftRight, Users, Receipt } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationAsRead, clearAllNotifications } = useData();
  const [filter, setFilter] = useState<'all' | 'unread' | 'payment' | 'contribution' | 'member'>('all');

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'payment') return n.type === 'payment';
    if (filter === 'contribution') return n.type === 'contribution';
    if (filter === 'member') return n.type === 'member';
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <ArrowLeftRight className="w-4 h-4 text-sky-600" />;
      case 'contribution':
        return <Wallet className="w-4 h-4 text-emerald-600" />;
      case 'member':
        return <Users className="w-4 h-4 text-amber-600" />;
      case 'expense':
        return <Receipt className="w-4 h-4 text-rose-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notifications" maxWidth="md">
      <div className="space-y-4">
        {/* Actions bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Filters */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'Toutes' },
              { id: 'unread', label: 'Non lues' },
              { id: 'payment', label: 'Paiements' },
              { id: 'contribution', label: 'Cotisations' },
              { id: 'member', label: 'Membres' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as typeof filter)}
                className={`px-2.5 py-1 font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                  filter === tab.id
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllNotifications}
            leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
          >
            Tout marquer lu
          </Button>
        </div>

        {/* Notifications list */}
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Aucune notification dans cette vue
            </div>
          ) : (
            filtered.map(notif => (
              <div
                key={notif.id}
                onClick={() => markNotificationAsRead(notif.id)}
                className={`p-3 rounded-lg flex items-start gap-3 transition-colors cursor-pointer ${
                  !notif.read ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="p-2 bg-white rounded-lg shadow-2xs border border-slate-100 shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5
                      className={`text-xs ${
                        !notif.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                      }`}
                    >
                      {notif.title}
                    </h5>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {formatDate(notif.date, { short: true })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600 leading-snug">{notif.message}</p>
                </div>
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
