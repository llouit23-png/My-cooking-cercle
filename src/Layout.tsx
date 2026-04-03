import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChefHat, Users, BookOpen, Home as HomeIcon, Menu, X, LogIn, LogOut, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { auth, googleProvider, signInWithPopup, onAuthStateChanged, FirebaseUser } from './firebase';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { name: 'Accueil', path: '/', icon: HomeIcon },
    { name: 'Mon cercle', path: '/circle', icon: Users },
    { name: 'Assistant Recettes', path: '/recommendations', icon: BookOpen },
    { name: 'Recettes Web', path: '/web-recipes', icon: Globe },
    { name: 'Ajouter une recette', path: '/add-recipe', icon: ChefHat },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7675]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#2D3436] font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <ChefHat className="w-8 h-8 text-[#FF7675]" />
              <span className="text-xl font-bold tracking-tight text-[#2D3436]">My Cooking Cercle</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#FF7675]",
                    location.pathname === item.path ? "text-[#FF7675]" : "text-[#636E72]"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
              
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm font-medium text-[#636E72] hover:text-[#FF7675] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-2 text-sm font-medium text-[#636E72] hover:text-[#FF7675] transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Connexion
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-[#636E72]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-[#E5E7EB] overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors",
                      location.pathname === item.path 
                        ? "bg-[#FFEAA7]/20 text-[#FF7675]" 
                        : "text-[#636E72] hover:bg-gray-50"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
                
                {user ? (
                  <button
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-[#636E72] hover:bg-gray-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Déconnexion
                  </button>
                ) : (
                  <button
                    onClick={() => { handleLogin(); setIsMenuOpen(false); }}
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-[#636E72] hover:bg-gray-50 transition-colors"
                  >
                    <LogIn className="w-5 h-5" />
                    Connexion
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user ? children : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ChefHat className="w-16 h-16 text-[#FF7675] mb-4 opacity-20" />
            <h2 className="text-2xl font-bold mb-2">Bienvenue sur My Cooking Cercle</h2>
            <p className="text-[#636E72] mb-8 max-w-md">
              Veuillez vous connecter pour accéder à votre carnet de recettes et gérer votre cercle d'amies.
            </p>
            <button
              onClick={handleLogin}
              className="bg-[#FF7675] text-white px-8 py-3 rounded-2xl font-semibold shadow-lg shadow-[#FF7675]/20 hover:bg-[#FF6B6B] transition-all transform hover:-translate-y-1"
            >
              Se connecter avec Google
            </button>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-[#E5E7EB] py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[#636E72] text-sm">
            © 2026 My Cooking Cercle - Projet MBA Data & IA
          </p>
        </div>
      </footer>
    </div>
  );
}
