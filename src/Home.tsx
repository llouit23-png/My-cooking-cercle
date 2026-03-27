import React from 'react';
import { motion } from 'motion/react';
import { ChefHat, Users, BookOpen, Search, ChevronRight, Clock, BarChart3, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, collection, onSnapshot, OperationType, handleFirestoreError } from './firebase';
import { Recipe } from './types';
import { capitalizeWords } from './lib/utils';

export default function Home() {
  const [featuredRecipes, setFeaturedRecipes] = React.useState<Recipe[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, 'recipes'), (snapshot) => {
      const recipesData = snapshot.docs.map(doc => doc.data() as Recipe);
      // Prioritize recipes with images, then sort by ID
      const sorted = recipesData.sort((a, b) => {
        if (a.image_url && !b.image_url) return -1;
        if (!a.image_url && b.image_url) return 1;
        return a.recipe_id - b.recipe_id;
      });
      setFeaturedRecipes(sorted.slice(0, 3));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'recipes'));

    return () => unsub();
  }, []);

  const features = [
    {
      title: "Mon Cercle",
      description: "Gérez les profils de vos amies et leurs contraintes alimentaires.",
      icon: Users,
      path: "/circle",
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "Assistant Recettes",
      description: "Trouvez le plat parfait compatible avec tout le monde.",
      icon: BookOpen,
      path: "/recommendations",
      color: "bg-green-50 text-green-600"
    },
    {
      title: "Recettes Web",
      description: "Explorez des milliers de recettes sur internet.",
      icon: Search,
      path: "/web-recipes",
      color: "bg-purple-50 text-purple-600"
    }
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#FF7675] to-[#D63031] p-8 md:p-16 text-white shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm font-bold backdrop-blur-md"
          >
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            Nouveau : Assistant IA Culinaire
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight"
          >
            Cuisinez pour ceux que vous aimez
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-white/90 leading-relaxed"
          >
            My Cooking Cercle vous aide à trouver des recettes délicieuses qui respectent les goûts et les régimes de toutes vos amies.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 pt-4"
          >
            <Link
              to="/recommendations"
              className="px-8 py-4 bg-white text-[#D63031] rounded-2xl font-bold shadow-lg hover:bg-gray-50 transition-all transform hover:-translate-y-1"
            >
              Trouver une recette
            </Link>
            <Link
              to="/circle"
              className="px-8 py-4 bg-transparent border-2 border-white/40 text-white rounded-2xl font-bold hover:bg-white/10 transition-all"
            >
              Gérer mon cercle
            </Link>
          </motion.div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-64 h-64 bg-black/10 rounded-full blur-2xl" />
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-3 gap-8">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
          >
            <Link
              to={feature.path}
              className="group block bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all h-full"
            >
              <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#2D3436] mb-3">{feature.title}</h3>
              <p className="text-[#636E72] leading-relaxed mb-6">{feature.description}</p>
              <div className="flex items-center gap-2 text-[#FF7675] font-bold text-sm">
                Découvrir
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
        ))}
      </section>

      {/* Featured Recipes */}
      <section className="space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-[#2D3436]">Recettes à la une</h2>
            <p className="text-[#636E72]">Une sélection de plats pour vous inspirer.</p>
          </div>
          <Link to="/recommendations" className="text-[#FF7675] font-bold hover:underline">
            Voir tout
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-[2.5rem] animate-pulse" />
            ))
          ) : (
            featuredRecipes.map((recipe) => (
              <Link
                key={recipe.recipe_id}
                to={`/recommendations/${recipe.recipe_id}`}
                className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  {recipe.image_url ? (
                    <img 
                      src={recipe.image_url} 
                      alt={recipe.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-6 flex items-center gap-2">
                    <span className="px-2 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md text-white">
                      {capitalizeWords(recipe.category)}
                    </span>
                    {recipe.halal && (
                      <span className="px-2 py-1 bg-green-500/80 text-white rounded-full text-[12px] font-bold uppercase tracking-wider backdrop-blur-md">
                        حلال
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-bold text-[#2D3436] group-hover:text-[#FF7675] transition-colors">
                    {capitalizeWords(recipe.title)}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-[#636E72]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {recipe.prep_time_minutes} min
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      {capitalizeWords(recipe.difficulty)}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#FFEAA7]/20 rounded-[3rem] p-8 md:p-16 text-center space-y-6">
        <ChefHat className="w-16 h-16 text-[#FF7675] mx-auto" />
        <h2 className="text-3xl font-bold text-[#2D3436]">Une nouvelle recette à partager ?</h2>
        <p className="text-[#636E72] max-w-xl mx-auto">
          Ajoutez vos propres créations culinaires et laissez l'assistant vérifier leur compatibilité avec votre cercle.
        </p>
        <Link
          to="/add-recipe"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#2D3436] text-white rounded-2xl font-bold hover:bg-[#2D3436]/90 transition-all shadow-lg"
        >
          Ajouter une recette
          <ChevronRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
