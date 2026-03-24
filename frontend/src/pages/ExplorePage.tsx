import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Star, TrendingUp, Leaf, Award, MessageSquare, BarChart3, GitCompare, Sparkles } from 'lucide-react';
import { ImageWithFallback } from '../share/ImageWithFallback';
import { useDashboardData } from '../hooks/useDashboardData';

const filterCards = [
  {
    id: '5stars',
    name: '5 Estrellas',
    description: 'Hoteles con calificación máxima en todas las plataformas',
    image: 'https://images.unsplash.com/photo-1758193783649-13371d7fb8dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMGZpdmUlMjBzdGFycyUyMGxvYmJ5JTIwcHJlbWl1bSUyMGludGVyaW9yfGVufDF8fHx8MTc3NDE0MDY1OXww&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-amber-500 via-yellow-500 to-orange-500',
    icon: Star,
    stars: 5,
    badge: '★★★★★',
    sort: 'rating',
  },
  {
    id: 'sustainability',
    name: 'Sostenibilidad 5/5',
    description: 'Hoteles con máxima puntuación de sostenibilidad',
    image: 'https://images.unsplash.com/photo-1608387371413-f2566ac510e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMHN1c3RhaW5hYmlsaXR5JTIwZWNvJTIwZ3JlZW4lMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzc0MTQwNjU5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    icon: Leaf,
    badge: '🌿 5/5',
    sort: 'sustainability',
  },
  {
    id: 'top-quality',
    name: 'Top Calidad',
    description: 'Mejor puntuación de calidad general en Barranquilla',
    image: 'https://images.unsplash.com/photo-1691138472938-9c71df7e17d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMHJhdGluZyUyMHF1YWxpdHklMjBhd2FyZCUyMGV4Y2VsbGVuY2V8ZW58MXx8fHwxNzc0MTQwNjYyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-blue-500 via-indigo-500 to-violet-500',
    icon: Award,
    badge: '🏆 Top',
    sort: 'quality',
  },
  {
    id: 'best-sentiment',
    name: 'Mejor Sentimiento',
    description: 'Mayor porcentaje de reseñas positivas analizadas por IA',
    image: 'https://images.unsplash.com/photo-1563244943-ce82ae870e42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMGd1ZXN0cyUyMGhhcHB5JTIwc21pbGluZyUyMHJldmlld3MlMjBleHBlcmllbmNlfGVufDF8fHx8MTc3NDE0MDY2MXww&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
    icon: Sparkles,
    badge: '😊 +95%',
    sort: 'sentiment',
  },
  {
    id: 'most-reviewed',
    name: 'Más Reseñados',
    description: 'Hoteles con mayor volumen de reseñas en las tres plataformas',
    image: 'https://images.unsplash.com/photo-1589568482418-998c3cb2430a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMGRhdGElMjBhbmFseXRpY3MlMjBkYXNoYm9hcmQlMjByZXZpZXdzJTIwc2VudGltZW50fGVufDF8fHx8MTc3NDE0MDY2MHww&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
    icon: MessageSquare,
    badge: '💬 +1K',
    sort: 'reviews',
  },
  {
    id: 'best-balance',
    name: 'Mejor Balance',
    description: 'Óptimo equilibrio entre calidad, precio y sostenibilidad',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMGNvbXBhcmlzb24lMjBkYXRhJTIwY2hhcnRzJTIwdmlzdWFsaXphdGlvbnxlbnwxfHx8fDE3NzQxNDA2NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-rose-500 via-orange-500 to-amber-500',
    icon: GitCompare,
    badge: '⚖️ Balance',
    sort: 'balance',
  },
];

const analysisCategories = [
  {
    id: 'sustainability',
    name: 'Sostenibilidad',
    description: 'Compromiso ambiental verificado',
    icon: Leaf,
    count: 12,
    color: 'from-emerald-500 to-green-500',
    sort: 'sustainability',
  },
  {
    id: 'quality',
    name: 'Calidad',
    description: 'Puntuación de calidad general',
    icon: Award,
    count: 34,
    color: 'from-blue-500 to-indigo-500',
    sort: 'quality',
  },
  {
    id: 'reviews',
    name: 'Mejores Reseñas',
    description: 'Mayor volumen de opiniones',
    icon: MessageSquare,
    count: 28,
    color: 'from-purple-500 to-fuchsia-500',
    sort: 'reviews',
  },
  {
    id: 'sentiment',
    name: 'Sentimiento Positivo',
    description: 'Análisis de emociones por IA',
    icon: Sparkles,
    count: 21,
    color: 'from-pink-500 to-rose-500',
    sort: 'sentiment',
  },
  {
    id: 'analyzed',
    name: 'Más Analizados',
    description: 'Mayor cobertura de scraping',
    icon: BarChart3,
    count: 34,
    color: 'from-cyan-500 to-blue-500',
    sort: 'analyzed',
  },
  {
    id: 'comparative',
    name: 'Comparativa',
    description: 'Ranking cruzado de plataformas',
    icon: GitCompare,
    count: 34,
    color: 'from-orange-500 to-amber-500',
    sort: 'balance',
  },
];

export function ExplorePage() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const { categoriesBySort } = useDashboardData();

  const handleFilterClick = (card: typeof filterCards[0]) => {
    const params = new URLSearchParams({
      q: '',
      platforms: 'Google,Booking,Airbnb',
      sort: card.sort,
    });
    navigate(`/results?${params.toString()}`);
  };

  const handleCategoryClick = (cat: typeof analysisCategories[0]) => {
    const params = new URLSearchParams({
      q: '',
      platforms: 'Google,Booking,Airbnb',
      sort: cat.sort,
    });
    navigate(`/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 py-16">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 mb-4 px-5 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
              <span className="text-sm font-medium text-cyan-300 uppercase tracking-wider">Barranquilla · Atlántico</span>
            </div>
            <h1 className="text-6xl font-bold text-white mb-4">
              Explora Hoteles Analizados
            </h1>
            <p className="text-xl text-slate-300 mb-2 max-w-2xl mx-auto">
              Descubre hoteles según calidad, sostenibilidad y reseñas reales
            </p>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Datos extraídos de Google Reviews, Booking.com y Airbnb · Calificaciones de 1 a 5 estrellas
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filter Cards — Explora según tus criterios */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-3">
            Explora según tus criterios
          </h2>
          <p className="text-gray-500 dark:text-slate-400">
            Encuentra opciones según métricas extraídas de plataformas reales · Las calificaciones van de{' '}
            <span className="text-yellow-500 font-medium">★</span> a{' '}
            <span className="text-yellow-500 font-medium">★★★★★</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {filterCards.map((card, index) => (
            <motion.button
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.08 }}
              onClick={() => handleFilterClick(card)}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative h-72 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 text-left"
            >
              <ImageWithFallback
                src={card.image}
                alt={card.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50 group-hover:opacity-60 transition-opacity`}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>

              <div className="absolute top-4 right-4">
                <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-bold border border-white/30">
                  {card.badge}
                </span>
              </div>

              <div className="absolute inset-0 flex flex-col justify-between p-6">
                <div className="self-start">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{card.name}</h3>
                  <p className="text-white/80 text-sm mb-4">{card.description}</p>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-xl rounded-xl border border-white/30 text-white text-sm font-medium transition-all ${hoveredCard === card.id ? 'translate-x-2' : ''}`}>
                    Ver hoteles
                    <span>→</span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Analysis Categories */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-3">
              Categorías de Análisis
            </h2>
            <p className="text-gray-500 dark:text-slate-400">
              Explora hoteles en Barranquilla agrupados por dimensión de análisis
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {analysisCategories.map((cat, index) => (
              (() => {
                const dynamicCategory = categoriesBySort[cat.sort];
                const label = dynamicCategory?.name ?? cat.name;
                const description = dynamicCategory?.description ?? cat.description;
                const count = dynamicCategory?.count ?? cat.count;

                return (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleCategoryClick(cat)}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg dark:shadow-slate-900/50 hover:shadow-xl transition-all hover:-translate-y-1 group border border-transparent dark:border-slate-700 text-left"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                  <cat.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white mb-1 text-center">{label}</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 text-center">{description}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400 text-center mt-1">{count} hoteles</p>
              </motion.button>
                );
              })()
            ))}
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-3xl p-12 text-white text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">Análisis Basado en Datos Reales</h2>
          <p className="text-xl opacity-90 mb-2 max-w-2xl mx-auto">
            HotelLens extrae y analiza reseñas reales de Google, Booking y Airbnb para hoteles en Barranquilla
          </p>
          <p className="text-sm opacity-70 mb-8">
            Calificaciones de 1 a 5 estrellas · Análisis de sentimiento por IA · Actualización continua
          </p>
          <div className="flex items-center justify-center gap-3 mb-8">
            {/* Platform Badges */}
            <span className="flex items-center gap-1.5 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold border border-white/30">
              <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-blue-600 text-xs font-black">G</span>
              Google
            </span>
            <span className="flex items-center gap-1.5 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold border border-white/30">
              <span className="w-5 h-5 bg-blue-700 rounded-full flex items-center justify-center text-white text-xs font-black">B</span>
              Booking
            </span>
            <span className="flex items-center gap-1.5 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold border border-white/30">
              <span className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white text-xs font-black">A</span>
              Airbnb
            </span>
          </div>
          <button
            onClick={() => navigate('/results')}
            className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            Ver todos los hoteles
          </button>
        </div>
      </div>
    </div>
  );
}
