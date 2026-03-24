import { useId } from 'react';
import { useParams } from 'react-router';
import { motion } from 'motion/react';
import { Star, MapPin, TrendingUp, Sparkles, ExternalLink } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

import { monthlySentimentTrend, sentimentTopics } from '../models/analytics';
import { useHotelDetails } from '../hooks/useHotelDetails';
import { ImageWithFallback } from '../share/ImageWithFallback';

const hotelImages = [
  'https://images.unsplash.com/photo-1729708475316-88ec2dc0083e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXNvcnQlMjBiZWFjaHxlbnwxfHx8fDE3NzM5NzE0ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1762360090104-c94c8497f067?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xvbmlhbCUyMGJvdXRpcXVlJTIwaG90ZWx8ZW58MXx8fHwxNzczOTcxNDgzfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1559235196-38074cb7b7cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiZWFjaCUyMHJlc29ydCUyMHBvb2x8ZW58MXx8fHwxNzczOTcxNDgzfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1716214188132-b7c1c751873c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMGdhcmRlbiUyMGhvdGVsfGVufDF8fHx8MTc3Mzk3MTQ4M3ww&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1677514148664-4cb1353ade73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3JpYyUyMGNhc3RsZSUyMGhvdGVsJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzczOTcxNDg0fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1568031398663-7a9f7f2308ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMGNhYmFuYXMlMjBzdW5zZXR8ZW58MXx8fHwxNzczOTcxNDg0fDA&ixlib=rb-4.1.0&q=80&w=1080',
];

const COLORS = ['#10b981', '#a78bfa', '#fb923c'];

export function HotelDetailsPage() {
  const { id } = useParams();
  const uid = useId().replace(/:/g, '-');
  const { hotel, recentReviews, isLoading, error } = useHotelDetails(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Cargando hotel...</p>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">{error ?? 'Hotel no encontrado'}</p>
      </div>
    );
  }

  const hotelIndex = Number.parseInt(hotel.id, 10);
  const imageIndex = Number.isNaN(hotelIndex) ? 0 : Math.max(hotelIndex - 1, 0);
  const hotelImage = hotel.imageUrl || hotelImages[imageIndex % hotelImages.length];

  const sentimentData = [
    { name: 'Positivo', value: hotel.sentiments.positive, color: COLORS[0] },
    { name: 'Neutral', value: hotel.sentiments.neutral, color: COLORS[1] },
    { name: 'Negativo', value: hotel.sentiments.negative, color: COLORS[2] },
  ];

  const platformNames = {
    google: 'Google Reviews',
    booking: 'Booking.com',
    airbnb: 'Airbnb',
  } as const;

  const platformColors = {
    google: 'bg-blue-100 text-blue-700 border-blue-300',
    booking: 'bg-amber-100 text-amber-700 border-amber-300',
    airbnb: 'bg-rose-100 text-rose-700 border-rose-300',
  } as const;

  const sentimentColors = {
    positive: 'bg-green-50 border-green-200',
    neutral: 'bg-purple-50 border-purple-200',
    negative: 'bg-orange-50 border-orange-200',
  } as const;

  return (
    <div className="min-h-screen">
      <div className="relative h-96 overflow-hidden">
        <ImageWithFallback src={hotelImage} alt={hotel.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="px-4 py-2 bg-white/95 backdrop-blur-sm rounded-xl flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    <span className="font-bold text-gray-800 text-lg">{hotel.rating.toFixed(1)}</span>
                  </div>
                  <div className="px-4 py-2 bg-green-500/95 backdrop-blur-sm rounded-xl flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-white" />
                    <span className="font-bold text-white">{hotel.sentimentScore.toFixed(0)}%</span>
                    <span className="text-white/90 text-sm">Sentimiento positivo</span>
                  </div>
                </div>
                <h1 className="text-5xl font-bold text-white mb-2">{hotel.name}</h1>
                <div className="flex items-center gap-2 text-white/90 text-lg">
                  <MapPin className="w-5 h-5" />
                  <span>
                    {hotel.location}, {hotel.city}, {hotel.country}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Descripcion</h2>
              <p className="text-gray-600 leading-relaxed mb-6">{hotel.description}</p>

              <div className="flex flex-wrap gap-2">
                {hotel.features.map((feature) => (
                  <span key={feature} className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-medium border border-purple-200">
                    {feature}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-800">Analisis de Sentimiento</h2>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-4 text-center">Distribucion de Sentimientos</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart id={`details-pie-${uid}`}>
                      <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-4">
                    {sentimentData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm text-gray-600">
                          {item.name} ({item.value}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-4 text-center">Tendencia (ultimos 6 meses)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={monthlySentimentTrend} id={`details-line-${uid}`}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="sentiment" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-4">Analisis por Temas</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sentimentTopics} layout="vertical" id={`details-bar-${uid}`}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="positive" fill="#10b981" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Resenas Recientes</h2>
                <span className="text-sm text-gray-500">{hotel.totalReviews.toLocaleString()} resenas totales</span>
              </div>

              <div className="space-y-4">
                {recentReviews.map((review) => (
                  <div key={review.id} className={`p-4 rounded-xl border-2 ${sentimentColors[review.sentiment]}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-800">{review.author}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border-2 ${platformColors[review.platform]}`}>
                            {platformNames[review.platform]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">.</span>
                          <span className="text-sm text-gray-500">{review.date}</span>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          review.sentiment === 'positive'
                            ? 'bg-green-100 text-green-700'
                            : review.sentiment === 'neutral'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {review.sentiment === 'positive' && 'Positivo'}
                        {review.sentiment === 'neutral' && 'Neutral'}
                        {review.sentiment === 'negative' && 'Negativo'}
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-3">{review.text}</p>
                    {review.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {review.topics.map((topic) => (
                          <span key={topic} className="px-2 py-1 bg-white/60 text-gray-600 rounded-lg text-xs border border-gray-200">
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 shadow-lg text-white"
            >
              <h3 className="text-lg font-bold mb-4">Estadisticas Clave</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-white/80 text-sm mb-1">Total de resenas</div>
                  <div className="text-3xl font-bold">{hotel.totalReviews.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-white/80 text-sm mb-1">Puntuacion de calidad</div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < hotel.qualityScore ? 'fill-white text-white' : 'text-white/30'}`} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-white/80 text-sm mb-1">Sostenibilidad</div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-8 h-2 rounded-full ${i < hotel.sustainabilityScore ? 'bg-white' : 'bg-white/30'}`}></div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <h3 className="font-bold text-gray-800 mb-4">Calificaciones por Plataforma</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="font-medium text-blue-900">Google Reviews</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-blue-600 text-blue-600" />
                    <span className="font-bold text-blue-900">{hotel.platforms.google}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="font-medium text-amber-900">Booking.com</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-600 text-amber-600" />
                    <span className="font-bold text-amber-900">{hotel.platforms.booking}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="font-medium text-rose-900">Airbnb</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-rose-600 text-rose-600" />
                    <span className="font-bold text-rose-900">{hotel.platforms.airbnb}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <h3 className="font-bold text-gray-800 mb-3">Listo para reservar?</h3>
              <p className="text-sm text-gray-600 mb-4">Visita las plataformas oficiales para verificar disponibilidad y precios actuales.</p>
              <div className="space-y-2">
                <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  Google Reviews
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button className="w-full py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors flex items-center justify-center gap-2">
                  Booking.com
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button className="w-full py-3 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition-colors flex items-center justify-center gap-2">
                  Airbnb
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
