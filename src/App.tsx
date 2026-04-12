import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Home from './Home';
import Profiles from './Profiles';
import Recommendations from './Recommendations';
import AddRecipe from './AddRecipe';
import WebRecipes from './WebRecipes';
import Login from './Login';
import AuthGuard from './components/AuthGuard';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/circle" 
            element={
              <AuthGuard>
                <Profiles />
              </AuthGuard>
            } 
          />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/recommendations/:recipeId" element={<Recommendations />} />
          <Route path="/add-recipe" element={<AddRecipe />} />
          <Route path="/web-recipes" element={<WebRecipes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
