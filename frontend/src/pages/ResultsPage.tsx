import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  BarChart3,
  Star,
  MapPin,
  Search,
  SlidersHorizontal,
  Heart,
  Send,
  ExternalLink,
  Award,
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Popover from '@radix-ui/react-popover';

import { useHotelReviews } from '../hooks/useHotelReviews';
import { useHotelsResults } from '../hooks/useHotelsResults';
import type { Hotel } from '../models/hotel';
import { hotelService } from '../services/hotelService';
import { ImageWithFallback } from '../share/ImageWithFallback';
import { ReviewsModal } from '../pages/ReviewsModal';
import { SentimentModal } from '../pages/SentimentModal';
import { SearchModal } from '../pages/SearchModal';

const hotelImages = [
  'https://images.unsplash.com/photo-1729708475316-88ec2dc0083e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjByZXNvcnQlMjBiZWFjaHxlbnwxfHx8fDE3NzM5NzE0ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1762360090104-c94c8497f067?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xvbmlhbCUyMGJvdXRpcXVlJTIwaG90ZWx8ZW58MXx8fHwxNzczOTcxNDgzfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1559235196-38074cb7b7cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiZWFjaCUyMHJlc29ydCUyMHBvb2x8ZW58MXx8fHwxNzczOTcxNDgzfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1716214188132-b7c1c751873c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMGdhcmRlbiUyMGhvdGVsfGVufDF8fHx8MTc3Mzk3MTQ4M3ww&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1677514148664-4cb1353ade73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3JpYyUyMGNhc3RsZSUyMGhvdGVsJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzczOTcxNDg0fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1568031398663-7a9f7f2308ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMGNhYmFuYXMlMjBzdW5zZXR8ZW58MXx8fHwxNzczOTcxNDg0fDA&ixlib=rb-4.1.0&q=80&w=1080',
];

const getHotelImages = (baseIndex: number) => {
  const images: string[] = [];
  for (let i = 0; i < 4; i += 1) {
    images.push(hotelImages[(baseIndex + i) % hotelImages.length]);
  }
  return images;
};

const getHotelImageIndex = (hotel: Hotel, fallbackIndex: number) => {
  const numeric = Number.parseInt(hotel.id, 10);
  if (!Number.isNaN(numeric) && numeric > 0) {
    return numeric - 1;
  }
  return fallbackIndex;
};

export function ResultsPage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q')?.trim() ?? '';
  const hasSearchQuery = searchQuery.length > 0;
  const [carouselIndexes, setCarouselIndexes] = useState<Record<string, number>>({});
  const [selectedHotelForReviews, setSelectedHotelForReviews] = useState<Hotel | null>(null);
  const [selectedHotelForSentiment, setSelectedHotelForSentiment] = useState<Hotel | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>(
    hasSearchQuery ? 'all' : '5',
  );
  const [platformFilter, setPlatformFilter] = useState<'all' | 'google' | 'booking' | 'airbnb'>('all');
  const [minReviewsFilter, setMinReviewsFilter] = useState<'all' | '50' | '100' | '200'>('all');
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') ?? 'reviews');
  const [favoritedHotels, setFavoritedHotels] = useState<Set<string>>(new Set());
  const [favoriteCounts, setFavoriteCounts] = useState<Record<string, number>>({});
  const [togglingFavoriteIds, setTogglingFavoriteIds] = useState<Set<string>>(new Set());
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const { hotels, totalReviews, hasMore, isLoading, isLoadingMore, error, loadMore } = useHotelsResults({
    searchParams,
    ratingFilter,
    platformFilter,
    minReviewsFilter,
    sortBy,
  });

  useEffect(() => {
    if (hasSearchQuery) {
      setRatingFilter('all');
      return;
    }

    setSortBy('reviews');
    setRatingFilter('5');
  }, [hasSearchQuery]);

  const { reviews: selectedHotelReviews } = useHotelReviews(selectedHotelForReviews?.id ?? null, 50);

  useEffect(() => {
    const initialIndexes: Record<string, number> = {};
    hotels.forEach((hotel) => {
      initialIndexes[hotel.id] = 0;
    });
    setCarouselIndexes(initialIndexes);
  }, [hotels]);

  const nextImage = (hotelId: string, totalImages: number) => {
    setCarouselIndexes((prev) => ({
      ...prev,
      [hotelId]: (prev[hotelId] + 1) % totalImages,
    }));
  };

  const prevImage = (hotelId: string, totalImages: number) => {
    setCarouselIndexes((prev) => ({
      ...prev,
      [hotelId]: prev[hotelId] === 0 ? totalImages - 1 : prev[hotelId] - 1,
    }));
  };

  const toggleFavorite = async (hotelId: string) => {
    if (togglingFavoriteIds.has(hotelId)) {
      return;
    }

    const isCurrentlyFavorite = favoritedHotels.has(hotelId);
    const nextFavorite = !isCurrentlyFavorite;

    setTogglingFavoriteIds((prev) => new Set(prev).add(hotelId));
    setFavoritedHotels((prev) => {
      const next = new Set(prev);
      if (nextFavorite) next.add(hotelId);
      else next.delete(hotelId);
      return next;
    });

    try {
      const response = await hotelService.setHotelFavorite(hotelId, nextFavorite);
      setFavoriteCounts((prev) => ({
        ...prev,
        [response.hotelId]: response.favoritesCount,
      }));
    } catch {
      setFavoritedHotels((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFavorite) next.add(hotelId);
        else next.delete(hotelId);
        return next;
      });
    } finally {
      setTogglingFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(hotelId);
        return next;
      });
    }
  };

  const platformEntries = (hotel: Hotel) => {
    return [
      { key: 'google', label: 'Google', color: 'bg-white border-2 border-gray-100', textColor: 'text-gray-500 dark:text-slate-400', url: hotel.platformLinks.google },
      { key: 'booking', label: 'Booking', color: 'bg-[#003580]', textColor: 'text-gray-500 dark:text-slate-400', url: hotel.platformLinks.booking },
      { key: 'airbnb', label: 'Airbnb', color: 'bg-[#FF385C]', textColor: 'text-gray-500 dark:text-slate-400', url: hotel.platformLinks.airbnb },
    ].filter((platform) => Boolean(platform.url));
  };

  return (
    <Tooltip.Provider>
      <div className="min-h-screen pb-8 bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-slate-900/50 transition-colors duration-300">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500 pointer-events-none" />
                <button
                  onClick={() => setIsSearchModalOpen(true)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-left text-gray-400 dark:text-slate-500 hover:border-cyan-400 dark:hover:border-cyan-500 hover:bg-white dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  {searchQuery || 'Buscar hoteles en Barranquilla...'}
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  showFilters
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                    : 'bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-cyan-300 dark:hover:border-cyan-500'
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filtros de analisis
              </button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 mt-4 border-t border-gray-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          Estrellas (1-5)
                        </label>
                        <select
                          value={ratingFilter}
                          onChange={(e) => setRatingFilter(e.target.value as 'all' | '5' | '4' | '3' | '2' | '1')}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-lg text-gray-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400"
                        >
                          <option value="all">Todas</option>
                          <option value="5">5 estrellas</option>
                          <option value="4">4 estrellas o más</option>
                          <option value="3">3 estrellas o más</option>
                          <option value="2">2 estrellas o más</option>
                          <option value="1">1 estrella o más</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Plataforma
                        </label>
                        <select
                          value={platformFilter}
                          onChange={(e) => setPlatformFilter(e.target.value as 'all' | 'google' | 'booking' | 'airbnb')}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-lg text-gray-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400"
                        >
                          <option value="all">Todas</option>
                          <option value="google">Google</option>
                          <option value="booking">Booking</option>
                          <option value="airbnb">Airbnb</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Min. reseñas
                        </label>
                        <select
                          value={minReviewsFilter}
                          onChange={(e) => setMinReviewsFilter(e.target.value as 'all' | '50' | '100' | '200')}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-lg text-gray-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400"
                        >
                          <option value="all">Cualquiera</option>
                          <option value="50">50+</option>
                          <option value="100">100+</option>
                          <option value="200">200+</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          Ordenar por
                        </label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-lg text-gray-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400"
                        >
                          <option value="rating">Mejor calificado</option>
                          <option value="favorites">Mas favoritos</option>
                          <option value="reviews">Mas resenado</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{hotels.length} hoteles analizados en Barranquilla</h1>
          <p className="text-gray-500 dark:text-slate-400">{totalReviews.toLocaleString()} resenas extraidas de Google, Booking y Airbnb</p>
          {isLoading && <p className="text-sm text-cyan-600 dark:text-cyan-400 mt-2">Cargando resultados...</p>}
          {error && <p className="text-sm text-rose-600 dark:text-rose-400 mt-2">{error}</p>}
        </div>

        <div className="max-w-4xl mx-auto px-6">
          <div className="space-y-8">
            {hotels.map((hotel, index) => {
              const hotelImageIndex = getHotelImageIndex(hotel, index);
              const images = getHotelImages(hotelImageIndex);
              const currentImageIndex = carouselIndexes[hotel.id] || 0;
              const isFavorited = favoritedHotels.has(hotel.id);

              return (
                <motion.div
                  key={hotel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl dark:shadow-slate-900/50 overflow-hidden border border-gray-100 dark:border-slate-700 hover:shadow-2xl dark:hover:shadow-slate-900 transition-all duration-300"
                >
                  <div className="relative h-96 bg-gray-100 dark:bg-slate-700">
                    <ImageWithFallback src={images[currentImageIndex]} alt={hotel.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

                    <button
                      onClick={() => prevImage(hotel.id, images.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <button
                      onClick={() => nextImage(hotel.id, images.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-800" />
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_, i) => (
                        <div
                          key={`indicator-${hotel.id}-${i}`}
                          className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'w-8 bg-white' : 'w-1.5 bg-white/50'}`}
                        ></div>
                      ))}
                    </div>

                    <div className="absolute top-4 left-4 px-4 py-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-full flex items-center gap-2 shadow-lg">
                      <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                      <span className="font-bold text-gray-800 dark:text-white text-lg">{hotel.rating.toFixed(1)}</span>
                    </div>

                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center gap-1.5 shadow-lg">
                      <span className="text-white font-black text-sm">#{index + 1}</span>
                      <span className="text-yellow-100 text-xs font-medium">en Barranquilla</span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{hotel.name}</h2>
                        <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 mb-3">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {hotel.location}, {hotel.city}
                          </span>
                        </div>
                        {hotel.description && <p className="text-gray-600 dark:text-slate-400 mb-3">{hotel.description}</p>}
                        {hotel.highlightReview && (
                          <p className="text-sm italic text-gray-500 dark:text-slate-400 mb-2">"{hotel.highlightReview}"</p>
                        )}
                      </div>
                    </div>

                    {hotel.features.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-5 pb-5 border-b border-gray-100 dark:border-slate-700">
                        {hotel.features.map((feature) => (
                          <span
                            key={`${hotel.id}-${feature}`}
                            className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-full text-xs font-medium border border-gray-200 dark:border-slate-600"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/40 rounded-lg border border-slate-200 dark:border-slate-600">
                          <Star className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{hotel.rating.toFixed(1)}</span>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/40">
                          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{hotel.totalReviews}</span>
                        </div>

                        <div className="h-8 w-px bg-gray-200 dark:bg-slate-600"></div>

                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <button
                              onClick={() => toggleFavorite(hotel.id)}
                              disabled={togglingFavoriteIds.has(hotel.id)}
                              className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors group"
                            >
                              <Heart
                                className={`w-5 h-5 transition-colors ${
                                  isFavorited
                                    ? 'fill-rose-500 text-rose-500'
                                    : 'text-gray-400 dark:text-slate-500 group-hover:text-rose-500'
                                }`}
                              />
                            </button>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-xl" sideOffset={5}>
                              {isFavorited ? 'Quitar favorito' : 'Guardar favorito'}
                              <Tooltip.Arrow className="fill-gray-900" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>

                        <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
                          {favoriteCounts[hotel.id] ?? hotel.favoritesCount} favoritos
                        </span>

                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <button
                              onClick={() => setSelectedHotelForSentiment(hotel)}
                              className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors group"
                            >
                              <BarChart3 className="w-5 h-5 text-gray-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                            </button>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-xl" sideOffset={5}>
                              Ver analisis de sentimiento
                              <Tooltip.Arrow className="fill-gray-900" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>

                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <button
                              onClick={() => setSelectedHotelForReviews(hotel)}
                              className="flex items-center gap-1 px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors group"
                            >
                              <MessageSquare className="w-5 h-5 text-gray-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                              <span className="text-sm font-medium text-gray-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {hotel.totalReviews}
                              </span>
                            </button>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-xl" sideOffset={5}>
                              Ver resenas extraidas
                              <Tooltip.Arrow className="fill-gray-900" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>

                        <Popover.Root>
                          <Popover.Trigger asChild>
                            <button
                              className="p-2 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors group"
                              disabled={platformEntries(hotel).length === 0}
                            >
                              <Send className="w-5 h-5 text-gray-400 dark:text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
                            </button>
                          </Popover.Trigger>
                          <Popover.Portal>
                            <Popover.Content
                              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-600 px-5 py-4 z-50"
                              sideOffset={8}
                            >
                              <p className="text-xs font-medium text-gray-400 dark:text-slate-500 mb-3 text-center tracking-wide uppercase">Ver en</p>
                              <div className="flex items-center gap-3">
                                {platformEntries(hotel).map((platform) => (
                                  <a
                                    key={`${hotel.id}-${platform.key}`}
                                    href={platform.url!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex flex-col items-center gap-1.5"
                                    title={platform.label}
                                  >
                                    <div className={`w-11 h-11 rounded-full ${platform.color} shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all flex items-center justify-center`}>
                                      <ExternalLink className={`w-4 h-4 ${platform.key === 'google' ? 'text-cyan-700' : 'text-white'}`} />
                                    </div>
                                    <span className={`text-[10px] ${platform.textColor} font-medium`}>{platform.label}</span>
                                  </a>
                                ))}
                              </div>
                              <Popover.Arrow className="fill-white dark:fill-slate-800" />
                            </Popover.Content>
                          </Popover.Portal>
                        </Popover.Root>
                      </div>

                      <span className="text-xs text-gray-400 dark:text-slate-500">{hotel.totalReviews.toLocaleString()} resenas analizadas</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <div className="flex items-center justify-center pt-2 pb-8">
              {hasMore ? (
                <button
                  onClick={loadMore}
                  disabled={isLoading || isLoadingMore}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white font-medium hover:bg-cyan-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoadingMore ? 'Cargando mas...' : 'Cargar 10 mas'}
                </button>
              ) : (
                <span className="text-sm text-gray-500 dark:text-slate-400">No hay mas hoteles para mostrar</span>
              )}
            </div>
          </div>
        </div>

        {selectedHotelForReviews && (
          <ReviewsModal
            isOpen={!!selectedHotelForReviews}
            onClose={() => setSelectedHotelForReviews(null)}
            hotel={selectedHotelForReviews}
            reviews={selectedHotelReviews}
            hotelImage={getHotelImages(getHotelImageIndex(selectedHotelForReviews, 0))[0]}
          />
        )}

        {selectedHotelForSentiment && (
          <SentimentModal
            isOpen={!!selectedHotelForSentiment}
            onClose={() => setSelectedHotelForSentiment(null)}
            hotel={selectedHotelForSentiment}
          />
        )}

        {isSearchModalOpen && <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />}
      </div>
    </Tooltip.Provider>
  );
}
