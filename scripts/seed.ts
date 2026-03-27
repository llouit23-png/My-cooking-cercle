import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'public', 'data');

function jsonToCsv(json) {
  if (json.length === 0) return '';
  const headers = Object.keys(json[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const row of json) {
    const values = headers.map(header => {
      const val = row[header];
      if (Array.isArray(val)) {
        return `"${val.join(';')}"`;
      }
      if (typeof val === 'string' && val.includes(',')) {
        return `"${val}"`;
      }
      return val;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

const files = ['users', 'dietary_constraints', 'recipes'];

files.forEach(file => {
  const jsonPath = path.join(dataDir, `${file}.json`);
  const csvPath = path.join(dataDir, `${file}.csv`);
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const csv = jsonToCsv(data);
  fs.writeFileSync(csvPath, csv);
  console.log(`Generated ${csvPath}`);
});

// Recommendations logic
const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'));
const constraints = JSON.parse(fs.readFileSync(path.join(dataDir, 'dietary_constraints.json'), 'utf8'));
const recipes = JSON.parse(fs.readFileSync(path.join(dataDir, 'recipes.json'), 'utf8'));

const recommendations = [];
let recId = 1;

users.forEach(user => {
  const userConstraints = constraints.filter(c => c.user_id === user.user_id);
  
  recipes.forEach(recipe => {
    let compatible = true;
    let reason = "";

    for (const c of userConstraints) {
      if (c.constraint_value === 'gluten' && !recipe.gluten_free) {
        compatible = false;
        reason = "Contient du gluten";
        break;
      }
      if (c.constraint_value === 'halal' && !recipe.halal) {
        compatible = false;
        reason = "Non Halal";
        break;
      }
      if (c.constraint_value === 'casher' && !recipe.kosher) {
        compatible = false;
        reason = "Non Casher";
        break;
      }
      if (c.constraint_value === 'sans porc' && recipe.contains_pork) {
        compatible = false;
        reason = "Contient du porc";
        break;
      }
      if (c.constraint_value === 'fromage' && !recipe.dairy_free && recipe.ingredients.some(i => i.toLowerCase().includes('fromage'))) {
        compatible = false;
        reason = "Contient du fromage";
        break;
      }
      if (c.constraint_value === 'saumon' && recipe.contains_fish && recipe.title.toLowerCase().includes('saumon')) {
        compatible = false;
        reason = "Contient du saumon";
        break;
      }
      if (c.constraint_value === 'oignons frits' && recipe.ingredients.some(i => i.toLowerCase().includes('oignons frits'))) {
        compatible = false;
        reason = "Contient des oignons frits";
        break;
      }
      if (c.constraint_value === 'concombre' && recipe.ingredients.some(i => i.toLowerCase().includes('concombre'))) {
        compatible = false;
        reason = "Contient du concombre";
        break;
      }
      if (c.constraint_value === 'légumes' && recipe.contains_vegetables) {
        compatible = false;
        reason = "Contient des légumes";
        break;
      }
      if (c.constraint_value === 'fruits' && recipe.ingredients.some(i => i.toLowerCase().includes('fruit'))) {
        compatible = false;
        reason = "Contient des fruits";
        break;
      }
    }

    recommendations.push({
      recommendation_id: recId++,
      user_id: user.user_id,
      recipe_id: recipe.recipe_id,
      compatibility_score: compatible ? 100 : 0,
      excluded_reason: compatible ? null : reason
    });
  });
});

fs.writeFileSync(path.join(dataDir, 'recommendations.json'), JSON.stringify(recommendations, null, 2));
fs.writeFileSync(path.join(dataDir, 'recommendations.csv'), jsonToCsv(recommendations));
console.log('Generated recommendations.json and recommendations.csv');
