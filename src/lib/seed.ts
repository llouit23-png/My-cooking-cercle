import { db, collection, getDocs, setDoc, doc, OperationType, handleFirestoreError } from '../firebase';
import { MOCK_USERS, MOCK_CONSTRAINTS, MOCK_RECIPES } from '../data/mockData';

export async function seedDatabase(force = false) {
  try {
    // Check if users exist
    const usersSnap = await getDocs(collection(db, 'users'));
    if (usersSnap.empty || force) {
      console.log("Seeding users...");
      for (const user of MOCK_USERS) {
        await setDoc(doc(db, 'users', user.user_id.toString()), user);
      }
    }

    // Check if constraints exist
    const constraintsSnap = await getDocs(collection(db, 'constraints'));
    if (constraintsSnap.empty || force) {
      console.log("Seeding constraints...");
      for (const constraint of MOCK_CONSTRAINTS) {
        await setDoc(doc(db, 'constraints', constraint.constraint_id.toString()), constraint);
      }
    }

    // Check if recipes exist
    const recipesSnap = await getDocs(collection(db, 'recipes'));
    if (recipesSnap.empty || force) {
      console.log("Seeding recipes...");
      for (const recipe of MOCK_RECIPES) {
        await setDoc(doc(db, 'recipes', recipe.recipe_id.toString()), recipe);
      }
    }

    console.log("Database seeded successfully!");
    return true;
  } catch (error) {
    console.error("Error seeding database:", error);
    handleFirestoreError(error, OperationType.WRITE, 'seed');
    return false;
  }
}
