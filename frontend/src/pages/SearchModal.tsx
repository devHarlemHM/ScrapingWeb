import { useState } from 'react';
import { useNavigate } from 'react-router';
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'motion/react';

// ── MonthPicker inline component ──────────────────────────────────────────────
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function MonthPicker({
  value,
  onChange,
  onClose,
}: {
  value: Date;
  onChange: (d: Date) => void;
  onClose: () => void;
}) {
  const [year, setYear] = useState(value.getFullYear());

  const handleSelect = (monthIdx: number) => {
    onChange(new Date(year, monthIdx, 1));
    onClose();
  };

  return (
    <div className="w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 p-4 select-none">
      {/* Year navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setYear((y) => y - 1)}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-slate-400" />
        </button>
        <span className="font-semibold text-gray-800 dark:text-white text-sm tracking-wide">{year}</span>
        <button
          onClick={() => setYear((y) => y + 1)}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-500 dark:text-slate-400" />
        </button>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {MONTHS_ES.map((m, i) => {
          const isSelected = value.getFullYear() === year && value.getMonth() === i;
          return (
            <button
              key={m}
              onClick={() => handleSelect(i)}
              className={`py-1.5 rounded-lg text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const navigate = useNavigate();
  const [showFromCalendar, setShowFromCalendar] = useState(false);
  const [showToCalendar, setShowToCalendar] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date>(new Date(2024, 0, 1));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Google', 'Booking', 'Airbnb']);
  const [selectedSentiment, setSelectedSentiment] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [ratingStar, setRatingStar] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'reviews' | 'rating-desc' | 'rating-asc'>('reviews');

  const platforms = ['Google', 'Booking', 'Airbnb'];
  const sentiments: Array<{ label: string; value: 'all' | 'positive' | 'neutral' | 'negative' }> = [
    { label: 'Todos', value: 'all' },
    { label: 'Positivo', value: 'positive' },
    { label: 'Neutral', value: 'neutral' },
    { label: 'Negativo', value: 'negative' },
  ];

  const sortOptions: Array<{ label: string; value: 'reviews' | 'rating-desc' | 'rating-asc' }> = [
    { label: 'Mas resenas', value: 'reviews' },
    { label: 'Mayor a menor calificacion', value: 'rating-desc' },
    { label: 'Menor a mayor calificacion', value: 'rating-asc' },
  ];

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter((p) => p !== platform);
      }
      return [...prev, platform];
    });
  };

  const handleSearch = () => {
    const normalizedFrom = dateFrom <= dateTo ? dateFrom : dateTo;
    const normalizedTo = dateTo >= dateFrom ? dateTo : dateFrom;

    const params = new URLSearchParams();
    params.set('advanced', '1');
    if (selectedPlatforms.length > 0) {
      params.set(
        'platforms',
        selectedPlatforms.map((platform) => platform.toLowerCase()).join(','),
      );
    }
    if (selectedSentiment !== 'all') {
      params.set('sentiment', selectedSentiment);
    }
    if (ratingStar !== null) {
      params.set('rating_star', ratingStar.toString());
    }
    params.set('sort', sortOrder);
    params.set('date_from', format(normalizedFrom, 'yyyy-MM-01'));
    params.set('date_to', format(endOfMonth(normalizedTo), 'yyyy-MM-dd'));

    navigate(`/results?${params.toString()}`);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
        </Dialog.Overlay>
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-3xl shadow-2xl z-50 p-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-2xl font-bold text-gray-800 dark:text-white">
                Búsqueda Avanzada
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
                  <X className="w-6 h-6 text-gray-500 dark:text-slate-400" />
                </button>
              </Dialog.Close>
            </div>

            <Dialog.Description className="sr-only">
              Busca hoteles con filtros avanzados por plataforma, sentimiento, calificacion, orden y rango de fechas.
            </Dialog.Description>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Platforms */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Plataformas</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedPlatforms.includes(platform)
                          ? platform === 'Google'
                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                            : platform === 'Booking'
                            ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                            : 'bg-rose-100 text-rose-700 border-2 border-rose-300'
                          : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-400 border-2 border-gray-100 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sentiment */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                  <span className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Sentimiento predominante</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sentiments.map((sentiment) => (
                    <button
                      key={sentiment.value}
                      onClick={() => setSelectedSentiment(sentiment.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedSentiment === sentiment.value
                          ? sentiment.value === 'positive'
                            ? 'bg-green-100 text-green-700 border-2 border-green-300'
                            : sentiment.value === 'neutral'
                            ? 'bg-slate-200 text-slate-700 border-2 border-slate-300'
                            : sentiment.value === 'negative'
                            ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                            : 'bg-cyan-100 text-cyan-700 border-2 border-cyan-300'
                          : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-400 border-2 border-gray-100 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      {sentiment.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Rating */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <span className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Calificacion</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setRatingStar(null)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      ratingStar === null
                        ? 'bg-cyan-100 text-cyan-700 border-2 border-cyan-300'
                        : 'bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400 border-2 border-gray-100 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    Todas
                  </button>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatingStar(star)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                        star === ratingStar
                          ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300 scale-110'
                          : 'bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400 border-2 border-gray-100 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      {star}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-violet-400"></div>
                  <span className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Orden</span>
                </div>
                <select
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value as 'reviews' | 'rating-desc' | 'rating-asc')}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-gray-700 dark:text-slate-200 focus:outline-none focus:border-cyan-400 dark:focus:border-cyan-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range with Calendar Pickers */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                <span className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Rango de Fechas</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowFromCalendar(!showFromCalendar);
                      setShowToCalendar(false);
                    }}
                    className="w-full bg-gray-50 dark:bg-slate-700 rounded-xl p-3 border-2 border-gray-100 dark:border-slate-600 hover:border-cyan-300 dark:hover:border-cyan-500 transition-all text-left"
                  >
                    <label className="text-xs text-gray-400 dark:text-slate-500 block mb-1">Desde</label>
                    <div className="text-gray-700 dark:text-slate-200 font-medium">
                      {format(dateFrom, 'MMM yyyy', { locale: es })}
                    </div>
                  </button>
                  <AnimatePresence>
                    {showFromCalendar && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-2 left-0 bg-white dark:bg-slate-700 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-600 p-4 z-10"
                      >
                        <MonthPicker value={dateFrom} onChange={setDateFrom} onClose={() => setShowFromCalendar(false)} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative">
                  <button
                    onClick={() => {
                      setShowToCalendar(!showToCalendar);
                      setShowFromCalendar(false);
                    }}
                    className="w-full bg-gray-50 dark:bg-slate-700 rounded-xl p-3 border-2 border-gray-100 dark:border-slate-600 hover:border-cyan-300 dark:hover:border-cyan-500 transition-all text-left"
                  >
                    <label className="text-xs text-gray-400 dark:text-slate-500 block mb-1">Hasta</label>
                    <div className="text-gray-700 dark:text-slate-200 font-medium">
                      {format(dateTo, 'MMM yyyy', { locale: es })}
                    </div>
                  </button>
                  <AnimatePresence>
                    {showToCalendar && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-700 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-600 p-4 z-10"
                      >
                        <MonthPicker value={dateTo} onChange={setDateTo} onClose={() => setShowToCalendar(false)} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-slate-700">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSearch}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all flex items-center gap-2"
              >
                Buscar Hoteles
                <span className="text-lg">→</span>
              </button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}