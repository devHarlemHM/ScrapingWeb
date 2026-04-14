import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Star, TrendingUp, MessageSquare, GitCompare } from 'lucide-react';
import { ImageWithFallback } from '../share/ImageWithFallback';

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
    sort: 'reviews',
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
    id: 'worst-balance',
    name: 'Peor Balance',
    description: 'Hoteles con menor equilibrio entre calidad, sostenibilidad y rating',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    gradient: 'from-red-600 via-orange-600 to-amber-600',
    icon: GitCompare,
    badge: '⚠️ Riesgo',
    sort: 'worst-balance',
  },
];

export function ExplorePage() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleFilterClick = (card: typeof filterCards[0]) => {
    const params = new URLSearchParams({
      q: '',
      platforms: 'Google,Booking,Airbnb',
      sort: card.sort,
    });

    if (card.id === '5stars') {
      params.set('rating', '5');
    }

    if (card.id === 'worst-balance') {
      params.set('sentiment', 'negative');
    }

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
