import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7675]"></div>
      </div>
    );
  }

  if (!user) {
    // On ne redirige vers /login que si on est CERTAIN que l'utilisateur n'est pas connecté
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
