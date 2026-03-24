import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Star, Leaf, Award, MessageSquare, BarChart3, GitCompare, Sparkles, Database } from 'lucide-react';
import { ImageWithFallback } from '../share/ImageWithFallback';
import { useDashboardData } from '../hooks/useDashboardData';

const filterCards = [
  {
    id: '5stars',
    name: '5 Estrellas',
    description: 'Calificación máxima en todas las plataformas',
    image: 'https://images.unsplash.com/photo-1758193783649-13371d7fb8dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMGZpdmUlMjBzdGFycyUyMGxvYmJ5JTIwcHJlbWl1bSUyMGludGVyaW9yfGVufDF8fHx8MTc3NDE0MDY1OXww&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-amber-500 via-yellow-500 to-orange-500',
    icon: Star,
    badge: '★★★★★',
    sort: 'rating',
  },
  {
    id: 'sustainability',
    name: 'Sostenibilidad 5/5',
    description: 'Máxima puntuación de sostenibilidad',
    image: 'https://images.unsplash.com/photo-1608387371413-f2566ac510e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMHN1c3RhaW5hYmlsaXR5JTIwZWNvJTIwZ3JlZW4lMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzc0MTQwNjU5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    icon: Leaf,
    badge: '🌿 5/5',
    sort: 'sustainability',
  },
  {
    id: 'top-quality',
    name: 'Top Calidad',
    description: 'Mejor puntuación de calidad general',
    image: 'https://images.unsplash.com/photo-1691138472938-9c71df7e17d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMHJhdGluZyUyMHF1YWxpdHklMjBhd2FyZCUyMGV4Y2VsbGVuY2V8ZW58MXx8fHwxNzc0MTQwNjYyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-blue-500 via-indigo-500 to-violet-500',
    icon: Award,
    badge: '🏆 Top',
    sort: 'quality',
  },
  {
    id: 'best-sentiment',
    name: 'Mejor Sentimiento',
    description: 'Mayor porcentaje de reseñas positivas por IA',
    image: 'https://images.unsplash.com/photo-1563244943-ce82ae870e42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMGd1ZXN0cyUyMGhhcHB5JTIwc21pbGluZyUyMHJldmlld3MlMjBleHBlcmllbmNlfGVufDF8fHx8MTc3NDE0MDY2MXww&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
    icon: Sparkles,
    badge: '😊 +95%',
    sort: 'sentiment',
  },
  {
    id: 'most-reviewed',
    name: 'Más Reseñados',
    description: 'Mayor volumen de reseñas analizadas',
    image: 'https://images.unsplash.com/photo-1589568482418-998c3cb2430a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMGRhdGElMjBhbmFseXRpY3MlMjBkYXNoYm9hcmQlMjByZXZpZXdzJTIwc2VudGltZW50fGVufDF8fHx8MTc3NDE0MDY2MHww&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
    icon: MessageSquare,
    badge: '💬 +1K',
    sort: 'reviews',
  },
  {
    id: 'best-balance',
    name: 'Mejor Balance',
    description: 'Equilibrio entre calidad, precio y sostenibilidad',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMGNvbXBhcmlzb24lMjBkYXRhJTIwY2hhcnRzJTIwdmlzdWFsaXphdGlvbnxlbnwxfHx8fDE3NzQxNDA2NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    gradient: 'from-rose-500 via-orange-500 to-amber-500',
    icon: GitCompare,
    badge: '⚖️ Balance',
    sort: 'balance',
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const { summary } = useDashboardData();

  const handleFilterClick = (card: typeof filterCards[0]) => {
    const params = new URLSearchParams({
      q: '',
      platforms: 'Google,Booking,Airbnb',
      sort: card.sort,
    });
    navigate(`/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzAwZmZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-3 mb-8 px-6 py-3 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
              <span className="text-sm font-medium uppercase tracking-wider text-cyan-300">Barranquilla · Atlántico · Análisis en Tiempo Real</span>
            </div>
            <h1 className="text-7xl font-bold mb-6 leading-tight text-white">
              Hoteles Analizados en<br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Barranquilla
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-4 max-w-3xl mx-auto leading-relaxed">
              HotelLens extrae y analiza reseñas reales de Google, Booking y Airbnb
              usando IA para mostrarte métricas de calidad, sostenibilidad y sentimiento
            </p>
            <p className="text-sm text-slate-400 mb-12">
              Calificaciones de ★ a ★★★★★ · Scraping web verificado · Datos actualizados continuamente
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-4 mb-16">
              <button
                onClick={() => {
                  const params = new URLSearchParams({
                    q: '',
                    platforms: 'Google,Booking,Airbnb',
                    sort: 'sentiment',
                  });
                  navigate(`/results?${params.toString()}`);
                }}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-cyan-500/50 transition-all hover:scale-105"
              >
                Explorar Hoteles en Barranquilla
              </button>
              <a
                href="#how-it-works"
                className="px-8 py-4 bg-white/10 backdrop-blur-xl text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all"
              >
                Cómo Funciona
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { value: `${summary.totalReviews.toLocaleString()}+`, label: 'Reseñas Analizadas', icon: Database, color: 'from-cyan-500 to-blue-500' },
                { value: `${summary.iaPrecision}%`, label: 'Precisión IA', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
                { value: `${summary.totalPlatforms}`, label: 'Plataformas', icon: BarChart3, color: 'from-green-500 to-emerald-500' },
                { value: `${summary.starsScaleMin}-${summary.starsScaleMax}`, label: 'Escala de Estrellas', icon: Star, color: 'from-orange-500 to-amber-500' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-4`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-sm text-slate-300">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Explora hoteles en Barranquilla */}
      <div className="max-w-7xl mx-auto px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-5xl font-bold text-gray-800 dark:text-white mb-4">
            Explora hoteles en Barranquilla
          </h2>
          <p className="text-xl text-gray-500 dark:text-slate-400">
            Encuentra opciones según métricas extraídas de plataformas reales ·{' '}
            <span className="text-yellow-500">★</span> a{' '}
            <span className="text-yellow-500">★★★★★</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {filterCards.map((card, index) => (
            <motion.button
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              onClick={() => handleFilterClick(card)}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative h-80 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 text-left"
            >
              <div className="absolute inset-0">
                <ImageWithFallback
                  src={card.image}
                  alt={card.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-60 group-hover:opacity-70 transition-opacity`}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              </div>

              {/* Badge top right */}
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full text-white text-sm font-bold border border-white/20">
                  {card.badge}
                </span>
              </div>

              <div className="relative h-full flex flex-col justify-between p-6">
                <div className="self-start">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                    <card.icon className="w-7 h-7 text-white" />
                  </div>
                </div>

                <div className="text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {card.name}
                  </h3>
                  <p className="text-white/90 text-sm mb-4">
                    {card.description}
                  </p>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-xl rounded-xl border border-white/30 text-white text-sm font-medium transition-all ${
                    hoveredCard === card.id ? 'translate-x-2' : ''
                  }`}>
                    Ver hoteles
                    <span className="text-lg">→</span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div id="how-it-works" className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-gray-800 dark:text-white mb-4">
              ¿Cómo Funciona?
            </h2>
            <p className="text-xl text-gray-600 dark:text-slate-400">
              Nuestro proceso de análisis de hoteles en Barranquilla en 4 pasos
            </p>
          </motion.div>

          <div className="grid grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Scraping Web',
                description: 'Extraemos reseñas reales de Google, Booking y Airbnb para hoteles en Barranquilla',
                icon: '📥',
                color: 'from-cyan-500 to-blue-500',
              },
              {
                step: '02',
                title: 'Limpiamos',
                description: 'Procesamos y normalizamos los datos para garantizar mayor precisión en el análisis',
                icon: '🧹',
                color: 'from-purple-500 to-pink-500',
              },
              {
                step: '03',
                title: 'IA Analiza',
                description: 'Nuestra IA identifica sentimientos, calidad y sostenibilidad en escala de 1 a 5 estrellas',
                icon: '🤖',
                color: 'from-green-500 to-emerald-500',
              },
              {
                step: '04',
                title: 'Visualizamos',
                description: 'Mostramos métricas claras: ranking, sentimiento, calidad y sostenibilidad por hotel',
                icon: '✨',
                color: 'from-orange-500 to-amber-500',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl dark:shadow-slate-900/50 hover:shadow-2xl transition-all hover:-translate-y-2 border border-transparent dark:border-slate-700"
              >
                <div className="text-6xl mb-6">{item.icon}</div>
                <div className={`inline-block px-3 py-1 bg-gradient-to-r ${item.color} text-white text-xs font-bold rounded-full mb-4`}>
                  PASO {item.step}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">{item.title}</h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Platform source badges */}
          <div className="flex items-center justify-center gap-4 mt-12">
            <span className="text-sm text-gray-500 dark:text-slate-400">Fuentes de datos:</span>
            <span className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-md border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-slate-300">
              <span className="w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center text-blue-600 text-xs font-black shadow-sm">G</span>
              Google Reviews
            </span>
            <span className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-md border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-slate-300">
              <span className="w-5 h-5 bg-blue-700 rounded-full flex items-center justify-center text-white text-xs font-black">B</span>
              Booking.com
            </span>
            <span className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-md border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-slate-300">
              <span className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white text-xs font-black">A</span>
              Airbnb
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
