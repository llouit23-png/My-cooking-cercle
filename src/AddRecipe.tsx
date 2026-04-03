import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Save, X, UtensilsCrossed, 
  Clock, BarChart3, ListChecks, CheckCircle2,
  WheatOff, MilkOff, Fish, Leaf, Beef
} from 'lucide-react';
import { Recipe, IngredientDetail } from './types';
import { cn, capitalizeWords } from './lib/utils';
import { db, collection, onSnapshot, setDoc, doc, OperationType, handleFirestoreError, auth } from './firebase';

export default function AddRecipe() {
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [success, setSuccess] = React.useState(false);

  const [formData, setFormData] = React.useState<Partial<Recipe>>({
    title: '',
    category: 'Plat principal',
    prep_time_minutes: 30,
    difficulty: 'Facile',
    base_servings: 4,
    ingredients: [],
    ingredients_details: [],
    steps: [],
    gluten_free: false,
    dairy_free: false,
    vegetarian: false,
    contains_fish: false,
    contains_vegetables: false,
    halal: false,
    kosher: false,
    contains_pork: false,
    image_url: ''
  });

  const [newIngredient, setNewIngredient] = React.useState<IngredientDetail>({ name: '', amount: 0, unit: 'g' });
  const [newStep, setNewStep] = React.useState('');

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, 'recipes'), (snapshot) => {
      const recipesData = snapshot.docs.map(doc => doc.data() as Recipe);
      setRecipes(recipesData);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'recipes'));

    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) {
      alert("Veuillez vous connecter pour enregistrer une recette.");
      return;
    }

    if (!formData.title || formData.ingredients_details?.length === 0 || formData.steps?.length === 0) {
      alert("Veuillez remplir tous les champs obligatoires (titre, ingrédients, étapes).");
      return;
    }

    const recipeId = recipes.length > 0 ? Math.max(...recipes.map(r => r.recipe_id)) + 1 : 1;
    const newRecipe: Recipe = {
      ...formData as Recipe,
      recipe_id: recipeId,
      ingredients: formData.ingredients_details?.map(i => i.name) || []
    };

    try {
      await setDoc(doc(db, 'recipes', recipeId.toString()), newRecipe);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Reset form
      setFormData({
        title: '',
        category: 'Plat principal',
        prep_time_minutes: 30,
        difficulty: 'Facile',
        base_servings: 4,
        ingredients: [],
        ingredients_details: [],
        steps: [],
        gluten_free: false,
        dairy_free: false,
        vegetarian: false,
        contains_fish: false,
        contains_vegetables: false,
        halal: false,
        kosher: false,
        contains_pork: false,
        image_url: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `recipes/${recipeId}`);
    }
  };

  const addIngredient = () => {
    if (newIngredient.name && newIngredient.amount > 0) {
      setFormData(prev => ({
        ...prev,
        ingredients_details: [...(prev.ingredients_details || []), newIngredient]
      }));
      setNewIngredient({ name: '', amount: 0, unit: 'g' });
    }
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients_details: prev.ingredients_details?.filter((_, i) => i !== index)
    }));
  };

  const addStep = () => {
    if (newStep) {
      setFormData(prev => ({
        ...prev,
        steps: [...(prev.steps || []), newStep]
      }));
      setNewStep('');
    }
  };

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps?.filter((_, i) => i !== index)
    }));
  };

  if (loading) return <div className="flex justify-center py-20">Chargement...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-[#2D3436]">Ajouter mes recettes</h2>
        <p className="text-[#636E72]">Partagez vos propres créations culinaires avec votre cercle.</p>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-[#E5E7EB] shadow-xl space-y-10">
        {/* Basic Info */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#636E72]">Titre de la recette</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Lasagnes à ma façon"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#FF7675]/20 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#636E72]">Catégorie</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#FF7675]/20 outline-none"
            >
              <option value="Entrée">Entrée</option>
              <option value="Plat principal">Plat principal</option>
              <option value="Dessert">Dessert</option>
              <option value="Accompagnement">Accompagnement</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#636E72]">URL de l'image (optionnel)</label>
            <input 
              type="url" 
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://exemple.com/image.jpg"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#FF7675]/20 outline-none"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#636E72]">Temps (min)</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B2BEC3]" />
              <input 
                type="number" 
                value={formData.prep_time_minutes}
                onChange={(e) => setFormData({ ...formData, prep_time_minutes: parseInt(e.target.value) })}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#636E72]">Difficulté</label>
            <div className="relative">
              <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B2BEC3]" />
              <select 
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
              >
                <option value="Très Facile">Très Facile</option>
                <option value="Facile">Facile</option>
                <option value="Moyen">Moyen</option>
                <option value="Difficile">Difficile</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#636E72]">Portions de base</label>
            <input 
              type="number" 
              value={formData.base_servings}
              onChange={(e) => setFormData({ ...formData, base_servings: parseInt(e.target.value) })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
            />
          </div>
        </div>

        {/* Dietary Flags */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-[#636E72]">Caractéristiques alimentaires</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DietaryToggle 
              active={formData.gluten_free!} 
              onClick={() => setFormData({ ...formData, gluten_free: !formData.gluten_free })}
              icon={WheatOff} label="Sans Gluten" 
            />
            <DietaryToggle 
              active={formData.dairy_free!} 
              onClick={() => setFormData({ ...formData, dairy_free: !formData.dairy_free })}
              icon={MilkOff} label="Sans Lactose" 
            />
            <DietaryToggle 
              active={formData.vegetarian!} 
              onClick={() => setFormData({ ...formData, vegetarian: !formData.vegetarian })}
              icon={Leaf} label="Végétarien" 
            />
            <DietaryToggle 
              active={formData.halal!} 
              onClick={() => setFormData({ ...formData, halal: !formData.halal })}
              icon={CheckCircle2} label="Halal" 
            />
            <DietaryToggle 
              active={formData.kosher!} 
              onClick={() => setFormData({ ...formData, kosher: !formData.kosher })}
              icon={CheckCircle2} label="Casher" 
            />
            <DietaryToggle 
              active={!formData.contains_pork!} 
              onClick={() => setFormData({ ...formData, contains_pork: !formData.contains_pork })}
              icon={Beef} label="Sans Porc" 
            />
            <DietaryToggle 
              active={formData.contains_fish!} 
              onClick={() => setFormData({ ...formData, contains_fish: !formData.contains_fish })}
              icon={Fish} label="Contient Poisson" 
            />
          </div>
        </div>

        {/* Ingredients */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-[#FF7675]" />
            <h3 className="text-lg font-bold text-[#2D3436]">Ingrédients</h3>
          </div>
          
          <div className="flex flex-wrap gap-3 mb-4">
            {formData.ingredients_details?.map((ing, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-[#FF7675]/10 text-[#FF7675] rounded-xl text-sm font-bold border border-[#FF7675]/20">
                {ing.amount} {ing.unit} {ing.name}
                <button onClick={() => removeIngredient(i)} className="hover:text-red-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input 
              type="text" 
              placeholder="Ingrédient"
              value={newIngredient.name}
              onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
              className="md:col-span-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
            />
            <input 
              type="number" 
              placeholder="Qté"
              value={newIngredient.amount || ''}
              onChange={(e) => setNewIngredient({ ...newIngredient, amount: parseFloat(e.target.value) })}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
            />
            <div className="flex gap-2">
              <select 
                value={newIngredient.unit}
                onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
              >
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="cl">cl</option>
                <option value="L">L</option>
                <option value="c.à.s">c.à.s</option>
                <option value="c.à.c">c.à.c</option>
                <option value="unités">unités</option>
                <option value="unité">unité</option>
                <option value="pincée">pincée</option>
              </select>
              <button 
                onClick={addIngredient}
                className="p-3 bg-[#FF7675] text-white rounded-2xl hover:bg-[#FF7675]/90"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-[#FF7675]" />
            <h3 className="text-lg font-bold text-[#2D3436]">Étapes</h3>
          </div>

          <div className="space-y-3">
            {formData.steps?.map((step, i) => (
              <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shrink-0 font-bold text-[#FF7675] shadow-sm">
                  {i + 1}
                </div>
                <p className="flex-1 text-sm text-[#636E72] pt-1">{step}</p>
                <button onClick={() => removeStep(i)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <textarea 
              placeholder="Décrivez l'étape..."
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none min-h-[100px] resize-none"
            />
            <button 
              onClick={addStep}
              className="px-6 bg-[#FF7675] text-white rounded-2xl hover:bg-[#FF7675]/90 flex flex-col items-center justify-center gap-2"
            >
              <Plus className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase">Ajouter</span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-6">
          <button 
            onClick={handleSave}
            className="w-full py-5 bg-[#2D3436] text-white rounded-[2rem] text-lg font-bold hover:bg-[#2D3436]/90 transition-all flex items-center justify-center gap-3 shadow-2xl"
          >
            <Save className="w-6 h-6" />
            Enregistrer ma recette
          </button>
        </div>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[100]"
          >
            <CheckCircle2 className="w-6 h-6" />
            Recette enregistrée avec succès !
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DietaryToggle({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold border-2 transition-all",
        active 
          ? "bg-[#FF7675]/10 border-[#FF7675] text-[#FF7675]" 
          : "bg-white border-gray-100 text-[#B2BEC3] hover:border-gray-200"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
