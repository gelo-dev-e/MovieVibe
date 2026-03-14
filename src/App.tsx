import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Sparkles, Film, AlertCircle } from 'lucide-react';

interface Movie {
  id: number;
  title: string;
  overview: string;
  imdb_id: string;
  release_date: string;
  vote_average: number;
}

interface Recommendation {
  movieId: string;
  recommendationText: string;
}

interface RecommendResponse {
  movies: Movie[];
  recommendation: Recommendation | null;
}

const getMovieRecommendations = async (vibe: string): Promise<RecommendResponse> => {
  const res = await fetch('/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vibe }),
  });

  if (!res.ok) {
    const body = await res.text();
    const message = body || `Server responded with status ${res.status}`;
    throw new Error(message);
  }

  const data = (await res.json()) as RecommendResponse;
  return data;
};

const MoviePoster = ({ imdbId, title, className }: { imdbId: string; title: string; className?: string }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    if (!imdbId) {
      setError(true);
      return;
    }
    setImageUrl(`https://images.metahub.space/poster/medium/${imdbId}/img`);
    setError(false);
    setUseFallback(false);
  }, [imdbId, title]);

  useEffect(() => {
    if (!useFallback || !title) return;

    const fetchFallbackImage = async () => {
      try {
        const searchTerm = encodeURIComponent(title);
        const res = await fetch(`https://itunes.apple.com/search?term=${searchTerm}&entity=movie&limit=3`);
        if (!res.ok) throw new Error('iTunes API failed');
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const exactMatch = data.results.find((r: any) => r.trackName.toLowerCase() === title.toLowerCase());
          const bestResult = exactMatch || data.results[0];
          const highResUrl = bestResult.artworkUrl100.replace('100x100bb.jpg', '600x900bb.jpg');
          setImageUrl(highResUrl);
          setError(false);
        } else {
          setError(true);
        }
      } catch (e) {
        console.error("Fallback image fetch failed:", e);
        setError(true);
      }
    };
    fetchFallbackImage();
  }, [useFallback, title]);

  if (error || !imageUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-zinc-800 ${className}`}>
        <Film className="w-12 h-12 text-zinc-600 mb-2" />
        <span className="text-xs text-zinc-500 text-center px-4">{title}</span>
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={`${title} poster`}
      className={`object-cover ${className}`}
      onError={() => {
        if (!useFallback) {
          setUseFallback(true);
        } else {
          setError(true);
        }
      }}
      referrerPolicy="no-referrer"
    />
  );
};

export default function App() {
  const [vibe, setVibe] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vibe.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await getMovieRecommendations(vibe);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      let message = err?.message || 'Something went wrong';
      if (typeof message === 'string' && (message.includes('non ISO-8859-1') || message.includes('Headers'))) {
        message = 'Request failed due to unsupported characters in request headers. Please make sure your OPENAI_API_KEY is a valid ASCII string.';
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const topMovie = result?.movies.find(m => m.title === result.recommendation?.movieId) || result?.movies[0];
  const otherMovies = result?.movies.filter(m => m.id !== topMovie?.id) || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500/30">
      {}
      <header className="border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Film className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">MovieVibe</h1>
          </div>
          <a href="https://github.com/gelo-dev-e" target="_blank" rel="noreferrer" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            GitHub
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
        {}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
          >
            What's your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">vibe</span> today?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-400"
          >
            Describe your mood, how your day went, or what you're craving. 
            Our AI will translate your feelings into the perfect movie recommendation.
          </motion.p>
        </div>

        {}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto mb-16"
        >
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-zinc-900 rounded-2xl border border-zinc-800 focus-within:border-indigo-500/50 transition-colors overflow-hidden">
              <div className="pl-6 pr-2 py-4">
                <Search className="w-6 h-6 text-zinc-500" />
              </div>
              <input
                type="text"
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                placeholder="e.g., I had a tiring day, I want something nostalgic from the 90s..."
                className="w-full bg-transparent border-none focus:ring-0 text-lg py-5 px-2 text-zinc-100 placeholder:text-zinc-600 outline-none"
                disabled={isLoading}
              />
              <div className="pr-3">
                <button
                  type="submit"
                  disabled={isLoading || !vibe.trim()}
                  className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    'Discover'
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>

        {}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto mb-12 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium">Oops, something went wrong</h3>
              <p className="text-sm opacity-80 mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        {}
        {result && topMovie && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-16"
          >
            {}
            <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none"></div>
              <div className="grid md:grid-cols-[1fr_2fr] gap-8 p-8 lg:p-12">
                <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-900 to-zinc-900 border border-zinc-700/50 flex flex-col items-center justify-center text-center relative group/poster">
                  <MoviePoster 
                    imdbId={topMovie.imdb_id} 
                    title={topMovie.title}
                    className="absolute inset-0 w-full h-full transition-transform duration-700 group-hover/poster:scale-105"
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent opacity-0 group-hover/poster:opacity-100 transition-opacity duration-500"></div>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium mb-6 w-fit border border-indigo-500/20">
                    <Sparkles className="w-4 h-4" />
                    AI Top Pick
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold mb-2">{topMovie.title}</h3>
                  <div className="flex items-center gap-4 text-zinc-400 text-sm mb-6">
                    <span>{new Date(topMovie.release_date).getFullYear()}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {topMovie.vote_average.toFixed(1)}
                    </span>
                  </div>
                  
                  {result.recommendation && (
                    <div className="bg-zinc-800/50 rounded-2xl p-6 mb-6 border border-zinc-700/50">
                      <p className="text-lg text-zinc-200 leading-relaxed italic">
                        "{result.recommendation.recommendationText}"
                      </p>
                    </div>
                  )}
                  
                  <p className="text-zinc-400 leading-relaxed">
                    {topMovie.overview}
                  </p>
                </div>
              </div>
            </div>

            {}
            {otherMovies.length > 0 && (
              <div>
                <h4 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  More matches for your vibe
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {otherMovies.map((movie, idx) => (
                    <motion.div 
                      key={movie.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="group relative aspect-[2/3] rounded-xl bg-transparent perspective-1000"
                    >
                      <div className="w-full h-full relative preserve-3d transition-transform duration-500 group-hover:rotate-y-180">
                        {}
                        <div className="absolute inset-0 backface-hidden rounded-xl overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex flex-col items-center justify-center text-center">
                          <MoviePoster 
                            imdbId={movie.imdb_id} 
                            title={movie.title}
                            className="absolute inset-0 w-full h-full"
                          />
                        </div>
                        
                        {}
                        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 p-4 flex flex-col">
                          <h5 className="font-semibold text-sm mb-1 line-clamp-2 text-indigo-300">{movie.title}</h5>
                          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {movie.vote_average.toFixed(1)}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 line-clamp-[8] overflow-hidden">
                            {movie.overview}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
