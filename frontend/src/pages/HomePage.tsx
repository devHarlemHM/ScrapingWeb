import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Star, BarChart3, Sparkles, Database, Target, Clock3, ShieldCheck } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';

export function HomePage() {
  const navigate = useNavigate();
  const { summary } = useDashboardData();

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
                onClick={() => navigate('/explore')}
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

      {/* Informacion relevante del aplicativo */}
      <div className="max-w-7xl mx-auto px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-5xl font-bold text-gray-800 dark:text-white mb-4">
            Informacion relevante del aplicativo
          </h2>
          <p className="text-xl text-gray-500 dark:text-slate-400">
            Conoce que mide HotelLens y como interpretar los resultados antes de explorar
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Que incluye el puntaje',
              description:
                'Cada hotel combina calificacion promedio, volumen de reseñas y señales de sentimiento para facilitar comparaciones claras.',
              icon: Target,
              color: 'from-cyan-500 to-blue-500',
            },
            {
              title: 'Frecuencia de actualizacion',
              description:
                'Los datos se refrescan por ciclos de scraping programados y se normalizan para eliminar duplicados y ruido.',
              icon: Clock3,
              color: 'from-purple-500 to-fuchsia-500',
            },
            {
              title: 'Confiabilidad del analisis',
              description:
                'Se filtran reseñas no utiles y respuestas de anfitrion para priorizar comentarios reales de huespedes.',
              icon: ShieldCheck,
              color: 'from-emerald-500 to-green-500',
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-7 shadow-lg dark:shadow-slate-900/50"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${item.color} mb-5`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                {item.title}
              </h3>
              <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
                {item.description}
              </p>
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700 text-sm text-gray-500 dark:text-slate-400">
                Basado en {summary.totalReviews.toLocaleString()} reseñas analizadas y {summary.totalPlatforms} plataformas
              </div>
            </motion.div>
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
