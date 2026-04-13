import { db, collection, getDocs, setDoc, doc, OperationType, handleFirestoreError, query, where } from '../firebase';
import { MOCK_USERS, MOCK_CONSTRAINTS, MOCK_RECIPES } from '../data/mockData';

export async function seedDatabase(userId: string, force = false) {
  if (!userId) return false;

  try {
    // Check if profiles (users in the circle) exist for THIS owner
    const usersQuery = query(collection(db, 'users'), where('owner_id', '==', userId));
    const usersSnap = await getDocs(usersQuery);
    
    if (usersSnap.empty || force) {
      console.log(`Seeding profiles for user ${userId}...`);
      for (const user of MOCK_USERS) {
        const profileId = `${userId}_${user.user_id}`;
        await setDoc(doc(db, 'users', profileId), {
          ...user,
          owner_id: userId,
          // We keep the numeric user_id for internal logic but the doc ID is scoped
        });
      }
    }

    // Check if constraints exist for THIS owner
    const constraintsQuery = query(collection(db, 'constraints'), where('owner_id', '==', userId));
    const constraintsSnap = await getDocs(constraintsQuery);
    
    if (constraintsSnap.empty || force) {
      console.log(`Seeding constraints for user ${userId}...`);
      for (const constraint of MOCK_CONSTRAINTS) {
        const constraintId = `${userId}_${constraint.constraint_id}`;
        await setDoc(doc(db, 'constraints', constraintId), {
          ...constraint,
          owner_id: userId
        });
      }
    }

    // Recipes are global for now, but we could scope them too if needed.
    // For now, let's keep them global but check if they exist.
    const recipesSnap = await getDocs(collection(db, 'recipes'));
    if (recipesSnap.empty) {
      console.log("Seeding global recipes...");
      for (const recipe of MOCK_RECIPES) {
        await setDoc(doc(db, 'recipes', recipe.recipe_id.toString()), recipe);
      }
    }

    console.log("Database seeded successfully for user:", userId);
    return true;
  } catch (error) {
    console.error("Error seeding database:", error);
    handleFirestoreError(error, OperationType.WRITE, 'seed');
    return false;
  }
}
