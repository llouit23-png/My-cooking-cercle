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
    console.log("Démarrage du flux de connexion Google...");

    // Timeout de sécurité pour ne pas rester bloqué indéfiniment si la popup ne répond pas
    const timeoutId = setTimeout(() => {
      if (isLoggingIn) {
        console.warn("La connexion semble prendre du temps. Vérifiez si une fenêtre est bloquée.");
        setError("La connexion prend du temps. Vérifiez si votre navigateur bloque les fenêtres surgissantes.");
      }
    }, 10000);

    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      
      console.log("Appel de signInWithPopup...");
      const result = await signInWithPopup(auth, googleProvider);
      
      clearTimeout(timeoutId);
      console.log("Succès de signInWithPopup pour:", result.user.email);
    } catch (err: any) {
      clearTimeout(timeoutId);
      setIsLoggingIn(false);
      console.error('Erreur Firebase Auth:', err.code, err.message);

      if (err.code === 'auth/popup-closed-by-user') {
        setError("Vous avez fermé la fenêtre de connexion.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("La fenêtre de connexion a été bloquée. Veuillez autoriser les popups pour ce site.");
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("Ce domaine n'est pas autorisé. Ajoutez 'mycookingcircle.netlify.app' dans la console Firebase.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Erreur réseau. Vérifiez votre connexion internet.");
      } else {
        setError(`Erreur (${err.code}) : ${err.message}`);
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
