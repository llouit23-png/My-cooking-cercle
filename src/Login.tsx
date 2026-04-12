import React from 'react';
import { motion } from 'motion/react';
import { ChefHat, LogIn, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, onAuthStateChanged } from './firebase';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/circle";

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate(from, { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate, from]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.code === 'auth/unauthorized-domain') {
        alert("Erreur : Ce domaine n'est pas autorisé dans la console Firebase. Veuillez ajouter 'mycookingcircle.netlify.app' dans les domaines autorisés sur Firebase.");
      } else {
        alert("Erreur de connexion : " + error.message);
      }
    }
  };

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
          <div className="space-y-4">
            <FeatureItem icon={ShieldCheck} text="Données sécurisées avec Firebase" />
            <FeatureItem icon={Heart} text="Tes préférences sauvegardées" />
            <FeatureItem icon={Sparkles} text="Accès à l'assistant IA" />
          </div>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-4 px-8 py-4 bg-[#2D3436] text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl transform hover:-translate-y-1 active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Continuer avec Google
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
