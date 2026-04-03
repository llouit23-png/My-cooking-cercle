import { User, Recipe, DietaryConstraint } from '../types';

export interface CompatibilityResult {
  isCompatible: boolean;
  reasons: string[];
}

export function checkCompatibility(recipe: Recipe, user: User, constraints: DietaryConstraint[]): CompatibilityResult {
  const userConstraints = constraints.filter(c => c.user_id === user.user_id);
  const reasons: Set<string> = new Set();

  for (const constraint of userConstraints) {
    const value = constraint.constraint_value.toLowerCase();
    
    // Check for gluten
    if ((value.includes('gluten') || value.includes('blé')) && !recipe.gluten_free) {
      reasons.add("Contient du gluten");
    }
    
    // Check for dairy/cheese
    if ((value.includes('fromage') || value.includes('laitage') || value.includes('dairy') || value.includes('lait')) && !recipe.dairy_free) {
      const ingredients = recipe.ingredients.map(i => i.toLowerCase());
      if (ingredients.some(i => i.includes('fromage') || i.includes('feta') || i.includes('parmesan') || i.includes('mozzarella') || i.includes('gruyère'))) {
        reasons.add("Contient du fromage");
      } else if (ingredients.some(i => i.includes('lait') || i.includes('crème') || i.includes('beurre'))) {
        reasons.add("Contient des produits laitiers");
      }
    }

    // Check for specific ingredients (avoiding "sans" false positives)
    // Skip this check for positive dietary requirements like 'halal' or 'kosher'
    if (value !== 'halal' && value !== 'casher' && value !== 'kosher') {
      for (const ingredient of recipe.ingredients) {
        const ingLower = ingredient.toLowerCase();
        // Only check if the ingredient doesn't explicitly say it's "sans" the constraint
        if (!ingLower.includes('sans ' + value) && !ingLower.includes('sans-' + value)) {
          if (ingLower.includes(value) || value.includes(ingLower)) {
            reasons.add(`Contient : ${ingredient}`);
          }
        }
      }
    }

    // Special case for Halal / Kosher / Pork
    if (value === 'halal' && !recipe.halal) {
      reasons.add("Non Halal");
    }
    if ((value === 'casher' || value === 'kosher') && !recipe.kosher) {
      reasons.add("Non Casher");
    }
    if ((value === 'sans porc' || value === 'pas de porc') && recipe.contains_pork) {
      reasons.add("Contient du porc");
    }

    // Special case for Copine 1: No fruits, no vegetables
    if (value === 'fruit' || value === 'fruits') {
      const fruitKeywords = ['pomme', 'banane', 'fraise', 'orange', 'citron', 'ananas', 'mangue', 'pêche', 'abricot', 'raisin', 'cerise'];
      if (recipe.ingredients.some(i => {
        const ingLower = i.toLowerCase();
        return fruitKeywords.some(k => {
          if (k === 'pomme') {
            // Exclude "pomme de terre" from the "pomme" (apple) check
            const withoutPotato = ingLower.replace(/pomme de terre/g, '');
            return withoutPotato.includes('pomme');
          }
          return ingLower.includes(k);
        });
      })) {
        reasons.add("Contient des fruits");
      }
    }
    
    if (value === 'légume' || value === 'légumes') {
      if (recipe.contains_vegetables) {
        reasons.add("Contient des légumes");
      }
    }

    // Check for fish
    if ((value.includes('poisson') || value.includes('saumon') || value.includes('thon')) && recipe.contains_fish) {
      if (recipe.ingredients.some(i => i.toLowerCase().includes(value))) {
        reasons.add(`Contient : ${value}`);
      }
    }
  }

  return {
    isCompatible: reasons.size === 0,
    reasons: Array.from(reasons)
  };
}

export function checkGroupCompatibility(recipe: Recipe, selectedUsers: User[], allConstraints: DietaryConstraint[]): {
  isCompatible: boolean;
  userResults: Record<number, CompatibilityResult>;
} {
  const userResults: Record<number, CompatibilityResult> = {};
  let isCompatible = true;

  for (const user of selectedUsers) {
    const result = checkCompatibility(recipe, user, allConstraints);
    userResults[user.user_id] = result;
    if (!result.isCompatible) {
      isCompatible = false;
    }
  }

  return { isCompatible, userResults };
}
