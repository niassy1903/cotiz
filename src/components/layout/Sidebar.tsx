import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Users,
  Receipt,
  BarChart3,
  Settings,
  Gift,
  ShieldCheck,
  UserPlus,
  Moon,
  Sun,
} from 'lucide-react';
import { appLanguages, usePreferences } from '../../context/PreferencesContext';

export type NavigationTab =
  | 'dashboard'
  | 'contributions'
  | 'payments'
  | 'members'
  | 'expenses'
  | 'reports'
  | 'settings'
  | 'referrals'
  | 'superadmin';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenInviteModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenInviteModal,
}) => {
  const { user } = useAuth();
  const { currentOrg, payments } = useData();
  const { language, setLanguage, theme, toggleTheme, t } = usePreferences();

  // Pending payments needing validation count
  const pendingPaymentsCount = payments.filter(
    p => p.orgId === currentOrg.id && p.status === 'pending'
  ).length;

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';

  const navItems: Array<{
    id: NavigationTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    adminOnly?: boolean;
    superAdminOnly?: boolean;
  }> = [
    {
      id: 'dashboard',
      label: t('Tableau de bord'),
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'contributions',
      label: t('Cotisations'),
      icon: <Wallet className="w-4 h-4" />,
    },
    {
      id: 'payments',
      label: t('Paiements'),
      icon: <ArrowLeftRight className="w-4 h-4" />,
      badge: isAdmin && pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
    },
    {
      id: 'members',
      label: t('Membres'),
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'expenses',
      label: t('Dépenses'),
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      id: 'reports',
      label: t('Rapports & Bilan'),
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: t('Administration'),
      icon: <Settings className="w-4 h-4" />,
      adminOnly: true,
    },
    {
      id: 'referrals',
      label: t('Parrainage & Gains'),
      icon: <Gift className="w-4 h-4" />,
    },
    {
      id: 'superadmin',
      label: t('Console Super Admin'),
      icon: <ShieldCheck className="w-4 h-4" />,
      superAdminOnly: true,
    },
  ];

  return (
    <aside className="cotiz-sidebar w-64 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <img
            src="/assets/aistudio/image_64acfe51.png"
            alt="Cotiz Logo"
            className="w-8 h-8 object-contain rounded-lg"
          />
          <div>
            <span className="text-lg font-bold text-white tracking-tight leading-none block">
              Cotiz
            </span>
            <span className="text-[11px] text-slate-300 font-medium">{t('Finance Solidaire')}</span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          {t('Menu Principal')}
        </div>
        {navItems
          .filter(item => {
            if (item.superAdminOnly && !isSuperAdmin) return false;
            if (item.adminOnly && !isAdmin) return false;
            return true;
          })
          .map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`cotiz-nav-item w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'is-active bg-emerald-800 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950 font-tabular">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </nav>

      <div className="cotiz-sidebar-preferences mx-3 mb-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-emerald-100/70">
          {t('Langue de l’application')}
        </label>
        <select
          value={language}
          onChange={event => setLanguage(event.target.value as typeof language)}
          className="cotiz-preference-select mb-2 w-full rounded-lg border border-white/15 bg-black/10 px-2.5 py-2 text-xs text-white outline-none focus:border-orange-300"
          aria-label={t('Langue de l’application')}
        >
          {appLanguages.map(option => (
            <option key={option.code} value={option.code}>{option.nativeName}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-emerald-50 transition-colors hover:bg-white/10 cursor-pointer"
          aria-label={theme === 'dark' ? t('Désactiver le mode sombre') : t('Activer le mode sombre')}
        >
          <span>{theme === 'dark' ? t('Thème sombre') : t('Thème clair')}</span>
          {theme === 'dark' ? <Moon className="h-4 w-4 text-orange-300" /> : <Sun className="h-4 w-4 text-orange-300" />}
        </button>
      </div>

      {/* Invite Member Quick Action Card */}
      {isAdmin && (
        <div className="p-3 mx-3 mb-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-white">
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>{t('Inviter des membres')}</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            {t("Partagez le lien d'adhésion WhatsApp ou scannez le QR code.")}
          </p>
          <button
            onClick={onOpenInviteModal}
            className="w-full py-1.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>{t('Générer un lien')}</span>
          </button>
        </div>
      )}

      {/* Current Plan footer */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          <span className="text-[10px] text-emerald-100/70 block">{t('Formule actuelle')}</span>
          <span className="font-semibold text-white capitalize">
            {currentOrg.subscriptionPlan}
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
          {t('Actif')}
        </span>
      </div>
    </aside>
  );
};
