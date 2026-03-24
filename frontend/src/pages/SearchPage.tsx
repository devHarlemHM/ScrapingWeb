import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Calendar, X, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export function SearchPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('Jan 2024');
  const [dateTo, setDateTo] = useState('Dec 2024');
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
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-4 px-6 py-3 bg-white/60 backdrop-blur-sm rounded-full shadow-lg"
          >
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Hotel Sentiment Analyzer
            </h1>
          </motion.div>
          <p className="text-gray-600 text-lg">
            Descubre hoteles a través del análisis inteligente de reseñas
          </p>
        </div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/60"
        >
          {/* Search Input */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hotels for carnival · Best eco hotel · City center..."
              className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-purple-300 focus:bg-white transition-all text-gray-700 placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Date Range */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Date Range</span>
            </div>
            <div className="flex gap-3 mb-3">
              <div className="flex-1 bg-gray-50 rounded-xl p-3 border-2 border-gray-100">
                <label className="text-xs text-gray-400 block mb-1">From</label>
                <input
                  type="text"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-transparent text-gray-700 font-medium focus:outline-none"
                />
              </div>
              <div className="flex-1 bg-white rounded-xl p-3 border-2 border-purple-200">
                <label className="text-xs text-gray-400 block mb-1">To</label>
                <input
                  type="text"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-transparent text-gray-700 font-medium focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {periods.map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === period
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Platforms */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Platforms</span>
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
                        : 'bg-gray-50 text-gray-600 border-2 border-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    {platform === 'Google' && '🔵 '}
                    {platform === 'Booking' && '🟡 '}
                    {platform === 'Airbnb' && '🔴 '}
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            {/* Sentiment */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Sentiment</span>
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
                        : 'bg-gray-50 text-gray-600 border-2 border-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    {sentiment === 'Positive' && '😊 '}
                    {sentiment === 'Neutral' && '😐 '}
                    {sentiment === 'Negative' && '😞 '}
                    {sentiment}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quality & Sustainability */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Min. Quality</span>
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
                        : 'bg-gray-50 text-gray-400 border-2 border-gray-100 hover:bg-gray-100'
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
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Min. Sustainability</span>
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
                        : 'bg-gray-50 text-gray-400 border-2 border-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    {star}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sort By */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Sort By</span>
            </div>
            <div className="flex gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    sortBy === option
                      ? option === 'Quality'
                        ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                        : option === 'Eco'
                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                        : 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      : 'bg-gray-50 text-gray-600 border-2 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  {option === 'Quality' && '⭐ '}
                  {option === 'Eco' && '🌿 '}
                  {option === 'Reviews' && '💬 '}
                  {option}
                </button>
              ))}
              <button className="px-6 py-2 rounded-full text-sm font-medium bg-gray-50 text-gray-600 border-2 border-gray-100 hover:bg-gray-100 transition-all">
                🎪 Carnival
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-gray-600">5 hotels</span> · Barranquilla, Colombia
            </p>
            <button
              onClick={handleSearch}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
            >
              Search Hotels
              <span className="text-xl">→</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
