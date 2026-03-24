import { X, Star } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'motion/react';
import type { Hotel, HotelReview } from '../models/hotel';

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: Hotel;
  reviews: HotelReview[];
  hotelImage: string;
}

const platformColors = {
  google: 'bg-blue-100 text-blue-700 border-blue-300',
  booking: 'bg-amber-100 text-amber-700 border-amber-300',
  airbnb: 'bg-rose-100 text-rose-700 border-rose-300',
};

const platformNames = {
  google: 'Google Reviews',
  booking: 'Booking.com',
  airbnb: 'Airbnb',
};

const sentimentColors = {
  positive: 'bg-green-50 border-green-200 text-green-700',
  neutral: 'bg-purple-50 border-purple-200 text-purple-700',
  negative: 'bg-orange-50 border-orange-200 text-orange-700',
};

export function ReviewsModal({ isOpen, onClose, hotel, reviews, hotelImage }: ReviewsModalProps) {
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="grid grid-cols-5 h-[90vh]">
              {/* Left: Hotel Image */}
              <div className="col-span-2 relative">
                <img
                  src={hotelImage}
                  alt={hotel.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">{hotel.name}</h3>
                  <p className="text-white/90 text-sm">{hotel.location}, {hotel.city}</p>
                </div>
              </div>

              {/* Right: Reviews */}
              <div className="col-span-3 flex flex-col min-h-0">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
                  <div>
                    <Dialog.Title className="text-2xl font-bold text-gray-800 dark:text-white">
                      Reseñas
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                      {reviews.length} reseñas de {hotel.totalReviews.toLocaleString()}
                    </p>
                  </div>
                  <Dialog.Close asChild>
                    <button className="w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
                      <X className="w-6 h-6 text-gray-500 dark:text-slate-400" />
                    </button>
                  </Dialog.Close>
                </div>

                <Dialog.Description className="sr-only">
                  Reseñas de huéspedes del hotel {hotel.name}
                </Dialog.Description>

                {/* Reviews List */}
                <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-800">
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className={`p-4 rounded-xl border-2 ${sentimentColors[review.sentiment]}`}
                      >
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
                                  <Star
                                    key={`review-${review.id}-star-${i}`}
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? 'fill-yellow-500 text-yellow-500'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">·</span>
                              <span className="text-sm text-gray-500">{review.date}</span>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            review.sentiment === 'positive'
                              ? 'bg-green-100 text-green-700'
                              : review.sentiment === 'neutral'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {review.sentiment === 'positive' && '😊 Positivo'}
                            {review.sentiment === 'neutral' && '😐 Neutral'}
                            {review.sentiment === 'negative' && '😞 Negativo'}
                          </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-3">{review.text}</p>
                        <div className="flex flex-wrap gap-2">
                          {review.topics.map((topic) => (
                            <span
                              key={`${review.id}-${topic}`}
                              className="px-2 py-1 bg-white/60 text-gray-600 rounded-lg text-xs border border-gray-200"
                            >
                              #{topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}