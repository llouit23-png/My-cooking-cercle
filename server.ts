import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/data/:file", (req, res) => {
    const fileName = req.params.file;
    const filePath = path.join(process.cwd(), 'public', 'data', `${fileName}`);
    
    if (fs.existsSync(filePath)) {
      if (fileName.endsWith('.json')) {
        const data = fs.readFileSync(filePath, 'utf8');
        res.json(JSON.parse(data));
      } else {
        res.sendFile(filePath);
      }
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  app.post("/api/data/:file", express.json(), (req, res) => {
    const fileName = req.params.file;
    const filePath = path.join(process.cwd(), 'public', 'data', `${fileName}`);
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
      
      // Recalculate recommendations if users or constraints changed
      if (fileName === 'users.json' || fileName === 'dietary_constraints.json') {
        const users = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'users.json'), 'utf8'));
        const constraints = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'dietary_constraints.json'), 'utf8'));
        const recipes = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'recipes.json'), 'utf8'));

        const recommendations = [];
        let recId = 1;

        users.forEach((user: any) => {
          const userConstraints = constraints.filter((c: any) => c.user_id === user.user_id);
          
          recipes.forEach((recipe: any) => {
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
              if (c.constraint_value === 'fromage' && !recipe.dairy_free && recipe.ingredients.some((i: string) => i.toLowerCase().includes('fromage'))) {
                compatible = false;
                reason = "Contient du fromage";
                break;
              }
              if (c.constraint_value === 'légumes' && recipe.contains_vegetables) {
                compatible = false;
                reason = "Contient des légumes";
                break;
              }
              if (c.constraint_value === 'fruits' && recipe.ingredients.some((i: string) => i.toLowerCase().includes('fruit'))) {
                compatible = false;
                reason = "Contient des fruits";
                break;
              }
              // Custom dislikes
              if (recipe.ingredients.some((i: string) => i.toLowerCase().includes(c.constraint_value.toLowerCase()))) {
                compatible = false;
                reason = `Contient : ${c.constraint_value}`;
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

        fs.writeFileSync(path.join(process.cwd(), 'public', 'data', 'recommendations.json'), JSON.stringify(recommendations, null, 2));
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
