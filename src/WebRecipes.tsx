import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Globe, ExternalLink, ChefHat, Loader2, Star, Clock, UtensilsCrossed, X } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from './lib/utils';
import Markdown from 'react-markdown';

interface WebRecipeResult {
  title: string;
  summary: string;
  sourceUrl: string;
  sourceTitle: string;
}

export default function WebRecipes() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<WebRecipeResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Trouve des recettes de cuisine sur internet pour : "${query}". 
        Donne-moi une liste de 3 à 5 recettes avec un titre, un court résumé alléchant et le lien vers la source. 
        Formatte ta réponse de manière structurée pour que je puisse extraire les informations.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "";
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

      // Extract URLs and titles from grounding metadata
      const webResults: WebRecipeResult[] = [];
      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
          if (chunk.web) {
            webResults.push({
              title: chunk.web.title || "Recette trouvée",
              summary: "Cliquez pour découvrir les détails de cette recette sur le site source.",
              sourceUrl: chunk.web.uri,
              sourceTitle: chunk.web.title || "Source externe"
            });
          }
        });
      }

      // If no grounding chunks, try to parse from text (fallback)
      if (webResults.length === 0) {
        // Simple fallback: just show the text as a single result or parse if possible
        setResults([{
          title: "Résultats de recherche",
          summary: text,
          sourceUrl: "#",
          sourceTitle: "Assistant IA"
        }]);
      } else {
        setResults(webResults);
      }

    } catch (err) {
      console.error("Search error:", err);
      setError("Désolé, une erreur est survenue lors de la recherche. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Gâteau au chocolat fondant",
    "Tiramisu traditionnel italien",
    "Lasagnes à la bolognaise",
    "Salade César poulet grillé",
    "Curry de pois chiches vegan"
  ];

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-sm font-bold">
          <Globe className="w-4 h-4" />
          Exploration Web
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#2D3436] tracking-tight">
          Trouvez l'inspiration sur le Web
        </h1>
        <p className="text-[#636E72] text-lg">
          Recherchez n'importe quelle recette et laissez notre IA explorer internet pour vous proposer les meilleures options.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#B2BEC3] group-focus-within:text-[#FF7675] transition-colors" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Quelle recette cherchez-vous ?"
            className="w-full pl-16 pr-32 py-5 bg-white border-2 border-gray-100 rounded-[2rem] text-lg shadow-sm focus:outline-none focus:border-[#FF7675] focus:ring-4 focus:ring-[#FF7675]/10 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-[#2D3436] text-white rounded-2xl font-bold hover:bg-[#2D3436]/90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Chercher"}
          </button>
        </form>

        {/* Suggestions */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => { setQuery(s); handleSearch(); }}
              className="px-4 py-2 bg-gray-50 text-[#636E72] rounded-xl text-sm font-medium hover:bg-[#FFEAA7] hover:text-[#FF7675] transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-4"
            >
              <div className="relative">
                <Globe className="w-16 h-16 text-[#FF7675] animate-pulse" />
                <Loader2 className="absolute -bottom-2 -right-2 w-8 h-8 text-[#2D3436] animate-spin" />
              </div>
              <p className="text-[#636E72] font-medium animate-bounce">Exploration du web en cours...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 bg-red-50 rounded-[2rem] border border-red-100 text-center space-y-4"
            >
              <X className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-red-700 font-bold">{error}</p>
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
              >
                Réessayer
              </button>
            </motion.div>
          ) : results.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <h2 className="text-xl font-bold text-[#2D3436]">Résultats trouvés</h2>
              </div>
              {results.map((result, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Source: {result.sourceTitle}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-[#2D3436] group-hover:text-[#FF7675] transition-colors">
                        {result.title}
                      </h3>
                      <div className="text-[#636E72] leading-relaxed markdown-body">
                        <Markdown>{result.summary}</Markdown>
                      </div>
                    </div>
                    {result.sourceUrl !== "#" && (
                      <a
                        href={result.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-3 bg-[#2D3436] text-white rounded-2xl font-bold hover:bg-[#FF7675] transition-all shadow-lg shrink-0"
                      >
                        Voir la recette
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 space-y-6"
            >
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <UtensilsCrossed className="w-12 h-12 text-gray-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#2D3436]">Prêt à explorer ?</h3>
                <p className="text-[#636E72]">Entrez un plat ou un ingrédient pour commencer.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
