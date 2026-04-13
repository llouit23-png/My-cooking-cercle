import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChefHat, LogIn, ShieldCheck, Heart, Sparkles, AlertCircle } from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from './firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const from = (location.state as any)?.from?.pathname || "/circle";

  useEffect(() => {
    // Si l'utilisateur est déjà connecté, on le redirige immédiatement
    if (!loading && user) {
      console.log("Utilisateur déjà connecté, redirection vers:", from);
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    setError(null);
    console.log("Déclenchement de la connexion Google...");

    try {
      // On force la sélection du compte pour éviter les sessions fantômes
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      
      // Appel direct pour éviter le blocage des popups par le navigateur
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Connexion réussie pour:", result.user.email);
      // La redirection sera gérée par le useEffect ci-dessus une fois que useAuth aura mis à jour l'état
    } catch (err: any) {
      setIsLoggingIn(false);
      console.error('Erreur détaillée de connexion:', err);

      // Gestion fine des erreurs pour guider l'utilisateur
      if (err.code === 'auth/popup-closed-by-user') {
        setError("La fenêtre de connexion a été fermée avant la fin.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("La fenêtre a été bloquée. Veuillez autoriser les popups pour ce site.");
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("Ce domaine n'est pas autorisé. Veuillez vérifier la console Firebase.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError("Une tentative de connexion est déjà en cours.");
      } else {
        setError("Erreur : " + (err.message || "Impossible de se connecter"));
      }
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7675]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden"
      >
        <div className="bg-gradient-to-br from-[#FF7675] to-[#D63031] p-12 text-center text-white space-y-4">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ChefHat className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Connecte-toi à ton Cooking Cercle</h1>
          <p className="text-white/80">Retrouve tes amies et leurs préférences culinaires en un clic.</p>
        </div>

        <div className="p-12 space-y-8">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          )}

          <div className="space-y-4">
            <FeatureItem icon={ShieldCheck} text="Données sécurisées avec Firebase" />
            <FeatureItem icon={Heart} text="Tes préférences sauvegardées" />
            <FeatureItem icon={Sparkles} text="Accès à l'assistant IA" />
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className={`w-full flex items-center justify-center gap-4 px-8 py-4 bg-[#2D3436] text-white rounded-2xl font-bold transition-all shadow-xl transform ${
              isLoggingIn ? 'opacity-70 cursor-not-allowed' : 'hover:bg-black hover:-translate-y-1 active:scale-95'
            }`}
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {isLoggingIn ? 'Connexion en cours...' : 'Continuer avec Google'}
          </button>

          <p className="text-center text-xs text-[#B2BEC3] leading-relaxed">
            En te connectant, tu acceptes que nous utilisions ton email Google pour identifier ton cercle culinaire.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function FeatureItem({ icon: Icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-center gap-3 text-[#636E72]">
      <div className="w-8 h-8 bg-[#FFEAA7]/20 rounded-lg flex items-center justify-center text-[#FF7675]">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}
