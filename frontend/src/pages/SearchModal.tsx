import { useState } from 'react';
import { useNavigate } from 'react-router';
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showFromCalendar, setShowFromCalendar] = useState(false);
  const [showToCalendar, setShowToCalendar] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date>(new Date(2024, 0, 1));
  const [dateTo, setDateTo] = useState<Date>(new Date(2024, 11, 31));
  const [selectedPeriod, setSelectedPeriod] = useState('6 months');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Google', 'Booking', 'Airbnb']);
  const [selectedSentiment, setSelectedSentiment] = useState<string[]>([]);
  const [minQuality, setMinQuality] = useState<number>(3);
  const [minSustainability, setMinSustainability] = useState<number>(0);
  const [sortBy, setSortBy] = useState('Quality');

  const platforms = ['Google', 'Booking', 'Airbnb'];
  const sentiments = ['Positive', 'Neutral', 'Negative'];
  const periods = ['30 days', '6 months', '12 months'];
  const sortOptions = ['Quality', 'Eco', 'Reviews'];

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const toggleSentiment = (sentiment: string) => {
    setSelectedSentiment(prev =>
      prev.includes(sentiment) ? prev.filter(s => s !== sentiment) : [...prev, sentiment]
    );
  };

  const handleSearch = () => {
    const params = new URLSearchParams({
      q: searchQuery,
      platforms: selectedPlatforms.join(','),
      sentiment: selectedSentiment.join(','),
      quality: minQuality.toString(),
      sustainability: minSustainability.toString(),
      sort: sortBy,
    });
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
              Busca hoteles con filtros avanzados por fecha, plataforma, sentimiento, calidad y sostenibilidad.
            </Dialog.Description>

            {/* Search Input */}
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hotels for carnival · Best eco hotel · City center..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-purple-300 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-slate-600 transition-all text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500"
              />
            </div>

            {/* Date Range with Calendar Pickers */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                <span className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Rango de Fechas</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowFromCalendar(!showFromCalendar);
                      setShowToCalendar(false);
                    }}
                    className="w-full bg-gray-50 dark:bg-slate-700 rounded-xl p-3 border-2 border-gray-100 dark:border-slate-600 hover:border-purple-200 dark:hover:border-purple-500 transition-all text-left"
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
                        <MonthPicker
                          value={dateFrom}
                          onChange={setDateFrom}
                          onClose={() => setShowFromCalendar(false)}
                        />
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
                    className="w-full bg-white dark:bg-slate-700 rounded-xl p-3 border-2 border-purple-200 dark:border-purple-700/50 hover:border-purple-300 dark:hover:border-purple-500 transition-all text-left"
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
                        <MonthPicker
                          value={dateTo}
                          onChange={setDateTo}
                          onClose={() => setShowToCalendar(false)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex gap-2">
                {periods.map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedPeriod === period
                        ? 'bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-white'
                        : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
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
                  <span className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Sentimiento</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sentiments.map((sentiment) => (
                    <button
                      key={sentiment}
                      onClick={() => toggleSentiment(sentiment)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedSentiment.includes(sentiment)
                          ? sentiment === 'Positive'
                            ? 'bg-green-100 text-green-700 border-2 border-green-300'
                            : sentiment === 'Neutral'
                            ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                            : 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                          : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-400 border-2 border-gray-100 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      {sentiment}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quality & Sustainability */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <span className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Calidad Mín.</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setMinQuality(star)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                        star === minQuality
                          ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300 scale-110'
                          : star < minQuality
                          ? 'bg-yellow-50 text-yellow-600 border-2 border-yellow-200'
                          : 'bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-slate-500 border-2 border-gray-100 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Sostenibilidad Mín.</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setMinSustainability(star)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                        star === minSustainability
                          ? 'bg-green-100 text-green-700 border-2 border-green-300 scale-110'
                          : star < minSustainability
                          ? 'bg-green-50 text-green-600 border-2 border-green-200'
                          : 'bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-slate-500 border-2 border-gray-100 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      {star}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sort By */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                <span className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">Ordenar Por</span>
              </div>
              <div className="flex gap-2">
                {sortOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      sortBy === option
                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                        : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-400 border-2 border-gray-100 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    {option}
                  </button>
                ))}
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