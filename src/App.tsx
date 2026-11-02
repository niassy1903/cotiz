import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AuthView } from './components/auth/AuthView';
import { MainLayout } from './components/layout/MainLayout';

function AppContent() {
  const { isAuthenticated, isLoading, authError } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-600">Connexion à Cotiz…</div>;
  }

  if (!isAuthenticated) {
    return (
      <>
        {authError && <div role="alert" className="fixed top-3 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow">{authError}</div>}
        <AuthView />
      </>
    );
  }

  return (
    <DataProvider>
      <MainLayout />
    </DataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
