export interface User {
  user_id: number;
  name: string;
  notes: string;
}

export interface DietaryConstraint {
  constraint_id: number;
  user_id: number;
  constraint_type: string;
  constraint_value: string;
}

export interface IngredientDetail {
  name: string;
  amount: number;
  unit: string;
}

export interface Recipe {
  recipe_id: number;
  title: string;
  category: string;
  ingredients: string[]; // Keep for compatibility/search
  ingredients_details: IngredientDetail[];
  base_servings: number;
  steps: string[];
  prep_time_minutes: number;
  difficulty: string;
  gluten_free: boolean;
  dairy_free: boolean;
  vegetarian: boolean;
  contains_fish: boolean;
  contains_vegetables: boolean;
  halal: boolean;
  kosher: boolean;
  contains_pork: boolean;
  image_url?: string;
}

export interface Recommendation {
  recommendation_id: number;
  user_id: number;
  recipe_id: number;
  compatibility_score: number;
  excluded_reason: string | null;
}
