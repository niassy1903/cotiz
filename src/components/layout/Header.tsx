import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Search, Bell, ChevronDown, Check, Building2, UserCircle, LogOut } from 'lucide-react';
import { getInitials } from '../../utils/formatters';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenNotifications,
  onOpenProfile,
}) => {
  const { user, logout } = useAuth();
  const { currentOrg, organizations, setCurrentOrgId } = useData();
  const { notifications } = useData();

  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 lg:px-8 py-3 bg-white border-b border-slate-200">
      {/* Zone 1: Organization Switcher & Context */}
      <div className="flex items-center gap-3">
        {/* Org selector dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <div className="w-5 h-5 rounded-md bg-emerald-800 text-white flex items-center justify-center font-bold text-[10px]">
              {getInitials(currentOrg.name)}
            </div>
            <span className="max-w-[140px] sm:max-w-[200px] truncate">{currentOrg.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showOrgDropdown && (
            <div
              className="absolute left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs"
              onClick={() => setShowOrgDropdown(false)}
            >
              <div className="px-3 py-1.5 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Organisations
              </div>
              {organizations.map(org => (
                <button
                  key={org.id}
                  onClick={() => setCurrentOrgId(org.id)}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    org.id === currentOrg.id ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{org.name}</span>
                  </div>
                  {org.id === currentOrg.id && <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zone 2: Global Search Trigger */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-white transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Rechercher membre, cotisation, paiement...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Actions & User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Rechercher"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications Icon with unread badge */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white font-tabular">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* Role Switcher & Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer text-left"
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-semibold text-xs flex items-center justify-center shrink-0">
              {user ? getInitials(`${user.firstName} ${user.lastName}`) : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[10px] text-emerald-700 font-medium capitalize">
                {user?.role === 'admin' ? 'Administrateur' : user?.role === 'superadmin' ? 'Super Admin' : 'Membre'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showUserDropdown && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs"
              onClick={() => setShowUserDropdown(false)}
            >
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-800">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={onOpenProfile}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <UserCircle className="w-4 h-4 text-slate-400" />
                  <span>Mon profil & paramètres</span>
                </button>
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
