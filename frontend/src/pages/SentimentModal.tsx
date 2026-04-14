import { X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useId, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import type { Hotel, HotelAnalytics } from '../models/hotel';
import { hotelService } from '../services/hotelService';

interface SentimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: Hotel;
}

const COLORS = ['#10b981', '#a78bfa', '#fb923c'];

export function SentimentModal({ isOpen, onClose, hotel }: SentimentModalProps) {
  const uid = useId().replace(/:/g, '-');
  const [analytics, setAnalytics] = useState<HotelAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (!isOpen || !hotel.id) {
      return;
    }

    const controller = new AbortController();

    async function loadAnalytics() {
      try {
        setIsLoadingAnalytics(true);
        const response = await hotelService.getHotelAnalytics(hotel.id, controller.signal);
        setAnalytics(response);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setAnalytics(null);
      } finally {
        setIsLoadingAnalytics(false);
      }
    }

    loadAnalytics();
    return () => controller.abort();
  }, [hotel.id, isOpen]);

  const sentimentPercentages = useMemo(() => {
    if (analytics) {
      return analytics.sentimentPercentages;
    }
    const total = Math.max(1, hotel.sentiments.positive + hotel.sentiments.neutral + hotel.sentiments.negative);
    return {
      positive: (hotel.sentiments.positive / total) * 100,
      neutral: (hotel.sentiments.neutral / total) * 100,
      negative: (hotel.sentiments.negative / total) * 100,
    };
  }, [analytics, hotel.sentiments]);

  const sentimentData = [
    { name: 'Positivo', value: Number(sentimentPercentages.positive.toFixed(1)), color: COLORS[0] },
    { name: 'Neutral', value: Number(sentimentPercentages.neutral.toFixed(1)), color: COLORS[1] },
    { name: 'Negativo', value: Number(sentimentPercentages.negative.toFixed(1)), color: COLORS[2] },
  ];

  const trendData = analytics
    ? analytics.trend6m.map((item) => ({
      month: item.month,
      sentiment: Number(item.positivePct.toFixed(1)),
    }))
    : [];

  const topicData = analytics
    ? analytics.topics.slice(0, 8).map((item) => ({
      name: item.topic,
      positive: Number(item.positivePct.toFixed(1)),
    }))
    : [];

  const platformStats = useMemo(() => {
    if (!analytics) {
      return {
        google: hotel.platforms.google,
        booking: hotel.platforms.booking,
        airbnb: hotel.platforms.airbnb,
      };
    }

    const breakdown = {
      google: 0,
      booking: 0,
      airbnb: 0,
    };

    analytics.platformBreakdown.forEach((item) => {
      if (item.platform === 'google' || item.platform === 'booking' || item.platform === 'airbnb') {
        breakdown[item.platform] = item.reviews;
      }
    });

    return breakdown;
  }, [analytics, hotel.platforms]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
        </Dialog.Overlay>
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-3xl shadow-2xl z-50 p-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <Dialog.Title className="text-2xl font-bold text-gray-800 dark:text-white">
                  Análisis de Sentimiento
                </Dialog.Title>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{hotel.name}</p>
              </div>
              <Dialog.Close asChild>
                <button className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
                  <X className="w-6 h-6 text-gray-500 dark:text-slate-400" />
                </button>
              </Dialog.Close>
            </div>

            <Dialog.Description className="sr-only">
              Análisis detallado del sentimiento de las reseñas del hotel {hotel.name}
            </Dialog.Description>

            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Pie Chart */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-600">
                <h3 className="text-sm font-medium text-gray-600 dark:text-slate-300 mb-4 text-center">
                  Distribución de Sentimientos
                </h3>
                {isLoadingAnalytics ? (
                  <div className="h-[200px] flex items-center justify-center text-sm text-gray-500 dark:text-slate-400">
                    Cargando analítica real...
                  </div>
                ) : (
                  <ResponsiveContainer key={`pie-rc-${uid}`} width="100%" height={200}>
                    <PieChart id={`pie-${uid}`}>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${hotel.id}-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="flex justify-center gap-4 mt-4">
                  {sentimentData.map((item) => (
                    <div key={`legend-${hotel.id}-${item.name}`} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-600 dark:text-slate-300">{item.name} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Line Chart */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-600">
                <h3 className="text-sm font-medium text-gray-600 dark:text-slate-300 mb-4 text-center">
                  Tendencia (últimos 6 meses)
                </h3>
                {isLoadingAnalytics ? (
                  <div className="h-[200px] flex items-center justify-center text-sm text-gray-500 dark:text-slate-400">
                    Cargando tendencia...
                  </div>
                ) : (
                  <ResponsiveContainer key={`line-rc-${uid}`} width="100%" height={200}>
                    <LineChart data={trendData} id={`line-${uid}`}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="sentiment"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Topics Bar Chart */}
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-slate-600">
              <h3 className="text-sm font-medium text-gray-600 dark:text-slate-300 mb-4">
                Análisis por Temas
              </h3>
              {isLoadingAnalytics ? (
                <div className="h-[300px] flex items-center justify-center text-sm text-gray-500 dark:text-slate-400">
                  Cargando temas...
                </div>
              ) : (
                <ResponsiveContainer key={`bar-rc-${uid}`} width="100%" height={300}>
                  <BarChart data={topicData} layout="vertical" id={`bar-${uid}`}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9ca3af' }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <Tooltip />
                    <Bar dataKey="positive" fill="#10b981" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Platform Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-700/40">
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Google Reviews</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">{platformStats.google}</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-4 border border-amber-200 dark:border-amber-700/40">
                <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">Booking.com</div>
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-300">{platformStats.booking}</div>
              </div>
              <div className="bg-rose-50 dark:bg-rose-900/30 rounded-xl p-4 border border-rose-200 dark:border-rose-700/40">
                <div className="text-xs text-rose-600 dark:text-rose-400 font-medium mb-1">Airbnb</div>
                <div className="text-2xl font-bold text-rose-900 dark:text-rose-300">{platformStats.airbnb}</div>
              </div>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}