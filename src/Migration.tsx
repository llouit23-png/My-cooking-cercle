import React, { useState, useEffect } from 'react';
import { db, collection, setDoc, doc, getDocs, OperationType, handleFirestoreError } from './firebase';

const Migration = () => {
  const [status, setStatus] = useState<string>('');
  const [isMigrating, setIsMigrating] = useState(false);

  const migrateData = async () => {
    setIsMigrating(true);
    setStatus('Migration en cours...');

    try {
      // Migrate Users
      const usersRes = await fetch('/api/data/users.json');
      const users = await usersRes.json();
      for (const user of users) {
        await setDoc(doc(db, 'users', user.user_id.toString()), user);
      }
      setStatus('Utilisateurs migrés...');

      // Migrate Constraints
      const constraintsRes = await fetch('/api/data/dietary_constraints.json');
      const constraints = await constraintsRes.json();
      for (const constraint of constraints) {
        await setDoc(doc(db, 'constraints', constraint.constraint_id.toString()), constraint);
      }
      setStatus('Restrictions migrées...');

      // Migrate Recipes
      const recipesRes = await fetch('/api/data/recipes.json');
      const recipes = await recipesRes.json();
      for (const recipe of recipes) {
        await setDoc(doc(db, 'recipes', recipe.recipe_id.toString()), recipe);
      }
      setStatus('Recettes migrées ! Migration terminée.');
    } catch (error) {
      console.error('Migration failed:', error);
      setStatus('Erreur lors de la migration.');
      handleFirestoreError(error, OperationType.WRITE, 'migration');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Migration vers Firebase</h3>
      <p className="text-sm text-gray-600 mb-4">
        Cliquez sur le bouton ci-dessous pour transférer vos données locales vers votre nouvelle base de données Firebase.
      </p>
      <button
        onClick={migrateData}
        disabled={isMigrating}
        className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
      >
        {isMigrating ? 'Migration...' : 'Lancer la migration'}
      </button>
      {status && <p className="mt-2 text-sm font-medium">{status}</p>}
    </div>
  );
};

export default Migration;
