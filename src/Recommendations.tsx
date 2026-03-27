import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Clock, BarChart3, 
  CheckCircle2, XCircle, 
  ChevronRight, UtensilsCrossed,
  WheatOff, MilkOff, Users,
  Check, Info, X, ListChecks
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Recipe, DietaryConstraint } from './types';
import { cn, capitalizeWords } from './lib/utils';
import { checkGroupCompatibility } from './lib/compatibility';
import ChatAssistant from './components/ChatAssistant';
import { db, collection, onSnapshot, OperationType, handleFirestoreError } from './firebase';

export default function Recommendations() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = React.useState<User[]>([]);
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [constraints, setConstraints] = React.useState<DietaryConstraint[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const [selectedUserIds, setSelectedUserIds] = React.useState<number[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [maxTime, setMaxTime] = React.useState<number>(120);
  const [category, setCategory] = React.useState<string>("Toutes");
  const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);
  const [servings, setServings] = React.useState<number>(4);

  React.useEffect(() => {
    if (selectedRecipe) {
      setServings(selectedRecipe.base_servings);
    }
  }, [selectedRecipe]);

  React.useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as User);
      setUsers(usersData.sort((a, b) => a.user_id - b.user_id));
      if (selectedUserIds.length === 0) {
        setSelectedUserIds(usersData.map((u: User) => u.user_id));
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubRecipes = onSnapshot(collection(db, 'recipes'), (snapshot) => {
      const recipesData = snapshot.docs.map(doc => doc.data() as Recipe);
      setRecipes(recipesData.sort((a, b) => a.recipe_id - b.recipe_id));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'recipes'));

    const unsubConstraints = onSnapshot(collection(db, 'constraints'), (snapshot) => {
      const constraintsData = snapshot.docs.map(doc => doc.data() as DietaryConstraint);
      setConstraints(constraintsData.sort((a, b) => a.constraint_id - b.constraint_id));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'constraints'));

    return () => {
      unsubUsers();
      unsubRecipes();
      unsubConstraints();
    };
  }, []);

  React.useEffect(() => {
    if (recipeId && recipes.length > 0) {
      const recipe = recipes.find(r => r.recipe_id === parseInt(recipeId));
      if (recipe) {
        setSelectedRecipe(recipe);
      }
    }
  }, [recipeId, recipes]);

  const categories: string[] = React.useMemo(() => {
    const cats = recipes.map(r => r.category);
    return ["Toutes", ...Array.from(new Set(cats))];
  }, [recipes]);

  const toggleUser = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const selectedUsers = users.filter(u => selectedUserIds.includes(u.user_id));

  const filteredRecipes = React.useMemo(() => {
    return recipes
      .filter(recipe => {
        const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            recipe.ingredients.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesTime = recipe.prep_time_minutes <= maxTime;
        const matchesCategory = category === "Toutes" || recipe.category === category;
        
        return matchesSearch && matchesTime && matchesCategory;
      })
      .map(recipe => {
        const compatibility = checkGroupCompatibility(recipe, selectedUsers, constraints);
        return { ...recipe, compatibility };
      })
      .sort((a, b) => (b.compatibility.isCompatible ? 1 : 0) - (a.compatibility.isCompatible ? 1 : 0));
  }, [recipes, selectedUsers, constraints, searchQuery, maxTime, category]);

  const stats = React.useMemo(() => {
    return {
      totalRecipes: recipes.length,
      compatibleCount: filteredRecipes.filter(r => r.compatibility.isCompatible).length,
      selectedCount: selectedUserIds.length
    };
  }, [recipes, filteredRecipes, selectedUserIds]);

  if (loading) return <div className="flex justify-center py-20">Chargement de l'assistant...</div>;

  return (
    <div className="space-y-10 relative pb-20">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-[#2D3436]">Assistant Recettes</h2>
          <p className="text-[#636E72]">Trouvez le plat parfait pour vos amies présentes.</p>
        </div>
        <div className="flex gap-4">
          <StatCard label="Recettes" value={stats.totalRecipes} icon={UtensilsCrossed} color="text-purple-600" />
          <StatCard label="Compatibles" value={stats.compatibleCount} icon={CheckCircle2} color="text-green-600" />
        </div>
      </div>

      {/* Guest Selection */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-[#FF7675]" />
          <h3 className="font-bold text-[#2D3436]">Qui mange chez vous aujourd'hui ?</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {users.map(user => (
            <button
              key={user.user_id}
              onClick={() => toggleUser(user.user_id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all border-2",
                selectedUserIds.includes(user.user_id)
                  ? "bg-[#FF7675] border-[#FF7675] text-white shadow-lg scale-105"
                  : "bg-white border-gray-100 text-[#636E72] hover:border-[#FF7675]/30"
              )}
            >
              {selectedUserIds.includes(user.user_id) && <Check className="w-4 h-4" />}
              {user.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid md:grid-cols-3 gap-6 bg-[#FDFCFB] p-6 rounded-3xl border border-[#E5E7EB]">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#B2BEC3]">Rechercher</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B2BEC3]" />
            <input
              type="text"
              placeholder="Nom, ingrédient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7675]/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#B2BEC3]">Catégorie</label>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7675]/20"
          >
            {categories.map(c => <option key={c} value={c}>{capitalizeWords(c)}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#B2BEC3]">Temps Max: {maxTime} min</label>
          <input 
            type="range" 
            min="10" 
            max="120" 
            step="5"
            value={maxTime}
            onChange={(e) => setMaxTime(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FF7675]"
          />
        </div>
      </div>

      {/* Results */}
      <div className="grid lg:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredRecipes.map((recipe) => (
            <motion.div
              layout
              key={recipe.recipe_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "group relative bg-white rounded-[2.5rem] border-2 transition-all overflow-hidden",
                recipe.compatibility.isCompatible 
                  ? "border-transparent shadow-sm hover:shadow-xl hover:-translate-y-1" 
                  : "border-red-50 opacity-80"
              )}
            >
              {recipe.image_url && (
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={recipe.image_url} 
                    alt={recipe.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              )}
              <div className="p-8">
                <div className="flex justify-between items-start gap-4 mb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#636E72]">
                      {capitalizeWords(recipe.category)}
                    </span>
                    {recipe.gluten_free && <WheatOff className="w-4 h-4 text-orange-400" />}
                    {recipe.dairy_free && <MilkOff className="w-4 h-4 text-pink-400" />}
                    {recipe.halal && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[11px] font-bold border border-green-100">
                        حلال
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-[#2D3436]">{capitalizeWords(recipe.title)}</h3>
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

                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold shadow-sm",
                  recipe.compatibility.isCompatible 
                    ? "bg-green-50 text-green-600" 
                    : "bg-red-50 text-red-600"
                )}>
                  {recipe.compatibility.isCompatible ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Parfait pour tous
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Incompatible
                    </>
                  )}
                </div>
              </div>
            </div>

              {/* Compatibility Breakdown */}
              <div className="space-y-4 mb-6">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#B2BEC3]">Statut par amie</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedUsers.map(user => {
                    const result = recipe.compatibility.userResults[user.user_id];
                    return (
                      <div 
                        key={user.user_id}
                        className={cn(
                          "p-3 rounded-2xl border text-center space-y-1",
                          result.isCompatible 
                            ? "bg-green-50/30 border-green-100" 
                            : "bg-red-50/30 border-red-100"
                        )}
                      >
                        <p className="text-xs font-bold text-[#2D3436]">{user.name}</p>
                        {result.isCompatible ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <div className="group/reason relative inline-block">
                            <XCircle className="w-4 h-4 text-red-500 mx-auto cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-red-600 text-white text-[10px] rounded-lg opacity-0 group-hover/reason:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                              {result.reasons.join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#B2BEC3] mb-3">Ingrédients clés</h4>
                  <div className="flex flex-wrap gap-2">
                    {recipe.ingredients.map((ing, i) => (
                      <span key={i} className="px-3 py-1.5 bg-gray-50 rounded-xl text-xs font-medium text-[#2D3436]">
                        {capitalizeWords(ing)}
                      </span>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedRecipe(recipe)}
                  className="w-full py-4 bg-[#2D3436] text-white rounded-[1.5rem] text-sm font-bold hover:bg-[#2D3436]/90 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  Voir la recette complète
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {filteredRecipes.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
          <UtensilsCrossed className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#2D3436]">Aucune recette trouvée</h3>
          <p className="text-[#636E72]">Essayez de modifier vos filtres ou de sélectionner moins d'amies.</p>
        </div>
      )}

      {/* Recipe Detail Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="relative h-80 bg-gray-900 p-8 text-white flex flex-col justify-end">
                {selectedRecipe.image_url && (
                  <img 
                    src={selectedRecipe.image_url} 
                    alt={selectedRecipe.title}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <button 
                  onClick={() => {
                    setSelectedRecipe(null);
                    if (recipeId) navigate('/recommendations');
                  }}
                  className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full transition-colors z-10"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                      {capitalizeWords(selectedRecipe.category)}
                    </span>
                    {selectedRecipe.halal && (
                      <span className="px-3 py-1 bg-green-500/80 text-white rounded-full text-[12px] font-bold uppercase tracking-wider backdrop-blur-md">
                        حلال
                      </span>
                    )}
                  </div>
                  <h2 className="text-4xl font-bold">{capitalizeWords(selectedRecipe.title)}</h2>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Compatibility Status in Modal */}
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#FF7675]" />
                      <h3 className="font-bold text-[#2D3436]">Compatibilité du groupe</h3>
                    </div>
                    {(() => {
                      const comp = checkGroupCompatibility(selectedRecipe, selectedUsers, constraints);
                      return (
                        <div className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-bold shadow-sm",
                          comp.isCompatible ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {comp.isCompatible ? "Validé pour tous" : "Attention : Incompatibilités"}
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedUsers.map(user => {
                      const comp = checkGroupCompatibility(selectedRecipe, [user], constraints);
                      const result = comp.userResults[user.user_id];
                      return (
                        <div 
                          key={user.user_id}
                          className={cn(
                            "p-3 rounded-2xl border flex flex-col items-center text-center gap-1",
                            result.isCompatible 
                              ? "bg-white border-green-100" 
                              : "bg-white border-red-100"
                          )}
                        >
                          <span className="text-xs font-bold text-[#2D3436]">{user.name}</span>
                          {result.isCompatible ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <XCircle className="w-4 h-4 text-red-500" />
                              <span className="text-[9px] text-red-500 font-medium leading-tight">
                                {result.reasons.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-8 items-center">
                  <div className="flex items-center gap-2 text-[#636E72]">
                    <Clock className="w-5 h-5" />
                    <span className="font-bold">{selectedRecipe.prep_time_minutes} min</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#636E72]">
                    <BarChart3 className="w-5 h-5" />
                    <span className="font-bold">{capitalizeWords(selectedRecipe.difficulty)}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                    <Users className="w-4 h-4 text-[#FF7675]" />
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setServings(Math.max(1, servings - 1))}
                        className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-xs hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold w-12 text-center">{servings} pers</span>
                      <button 
                        onClick={() => setServings(servings + 1)}
                        className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-xs hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-[#FF7675]" />
                    <h3 className="text-lg font-bold text-[#2D3436]">Ingrédients</h3>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedRecipe.ingredients_details?.map((ing, i) => {
                      const calculatedAmount = (ing.amount * servings) / selectedRecipe.base_servings;
                      return (
                        <li key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="text-sm text-[#2D3436] font-medium">{capitalizeWords(ing.name)}</span>
                          <span className="text-xs font-bold text-[#FF7675]">
                            {calculatedAmount % 1 === 0 ? calculatedAmount : calculatedAmount.toFixed(1)} {ing.unit}
                          </span>
                        </li>
                      );
                    }) || selectedRecipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[#636E72]">
                        <div className="w-1.5 h-1.5 bg-[#FF7675] rounded-full" />
                        {capitalizeWords(ing)}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-[#FF7675]" />
                    <h3 className="text-lg font-bold text-[#2D3436]">Étapes de préparation</h3>
                  </div>
                  <div className="space-y-4">
                    {selectedRecipe.steps.map((step, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 font-bold text-[#FF7675]">
                          {i + 1}
                        </div>
                        <p className="text-sm text-[#636E72] leading-relaxed pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Assistant */}
      <ChatAssistant 
        users={users} 
        recipes={recipes} 
        constraints={constraints} 
      />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white px-6 py-4 rounded-2xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
      <div className={cn("p-2 rounded-xl bg-gray-50", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#B2BEC3]">{label}</p>
        <p className="text-xl font-bold text-[#2D3436]">{value}</p>
      </div>
    </div>
  );
}
