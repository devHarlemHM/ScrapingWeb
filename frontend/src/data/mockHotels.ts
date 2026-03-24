export interface Hotel {
  id: string;
  name: string;
  location: string;
  city: string;
  country: string;
  image: string;
  rating: number;
  pricePerNight: number;
  totalReviews: number;
  sentimentScore: number;
  qualityScore: number;
  sustainabilityScore: number;
  platforms: {
    google: number;
    booking: number;
    airbnb: number;
  };
  sentiments: {
    positive: number;
    neutral: number;
    negative: number;
  };
  features: string[];
  description: string;
}

export interface Review {
  id: string;
  author: string;
  platform: 'google' | 'booking' | 'airbnb';
  rating: number;
  date: string;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
}

export const mockHotels: Hotel[] = [
  {
    id: '1',
    name: 'Luxury Eco Resort & Spa',
    location: 'Centro Histórico',
    city: 'Cartagena',
    country: 'Colombia',
    image: 'luxury resort beach',
    rating: 9.4,
    pricePerNight: 280,
    totalReviews: 1847,
    sentimentScore: 92,
    qualityScore: 5,
    sustainabilityScore: 4,
    platforms: {
      google: 4.8,
      booking: 9.2,
      airbnb: 4.9,
    },
    sentiments: {
      positive: 78,
      neutral: 15,
      negative: 7,
    },
    features: ['Spa', 'Piscina', 'Restaurante', 'WiFi', 'Eco-friendly'],
    description: 'Resort de lujo con enfoque sostenible, ubicado en el corazón del centro histórico.',
  },
  {
    id: '2',
    name: 'Boutique Hotel Colonial',
    location: 'San Diego',
    city: 'Cartagena',
    country: 'Colombia',
    image: 'colonial boutique hotel',
    rating: 9.1,
    pricePerNight: 195,
    totalReviews: 923,
    sentimentScore: 88,
    qualityScore: 5,
    sustainabilityScore: 3,
    platforms: {
      google: 4.7,
      booking: 9.0,
      airbnb: 4.8,
    },
    sentiments: {
      positive: 72,
      neutral: 20,
      negative: 8,
    },
    features: ['Centro histórico', 'Terraza', 'Desayuno incluido', 'WiFi'],
    description: 'Encantador hotel boutique en edificio colonial restaurado del siglo XVIII.',
  },
  {
    id: '3',
    name: 'Modern Beach Resort',
    location: 'Bocagrande',
    city: 'Cartagena',
    country: 'Colombia',
    image: 'modern beach resort pool',
    rating: 8.8,
    pricePerNight: 225,
    totalReviews: 1432,
    sentimentScore: 85,
    qualityScore: 4,
    sustainabilityScore: 3,
    platforms: {
      google: 4.6,
      booking: 8.9,
      airbnb: 4.7,
    },
    sentiments: {
      positive: 68,
      neutral: 24,
      negative: 8,
    },
    features: ['Playa privada', 'Piscina infinity', 'Gimnasio', 'WiFi', 'Parking'],
    description: 'Resort moderno frente al mar con todas las comodidades contemporáneas.',
  },
  {
    id: '4',
    name: 'Garden Eco Lodge',
    location: 'Manga',
    city: 'Cartagena',
    country: 'Colombia',
    image: 'tropical garden hotel',
    rating: 9.0,
    pricePerNight: 145,
    totalReviews: 687,
    sentimentScore: 90,
    qualityScore: 4,
    sustainabilityScore: 5,
    platforms: {
      google: 4.8,
      booking: 8.8,
      airbnb: 4.9,
    },
    sentiments: {
      positive: 75,
      neutral: 18,
      negative: 7,
    },
    features: ['Jardín tropical', 'Sostenible', 'Yoga', 'Orgánico', 'WiFi'],
    description: 'Lodge ecológico rodeado de exuberantes jardines tropicales.',
  },
  {
    id: '5',
    name: 'Historic Castle Hotel',
    location: 'Centro amurallado',
    city: 'Cartagena',
    country: 'Colombia',
    image: 'historic castle hotel interior',
    rating: 9.3,
    pricePerNight: 310,
    totalReviews: 2103,
    sentimentScore: 91,
    qualityScore: 5,
    sustainabilityScore: 3,
    platforms: {
      google: 4.9,
      booking: 9.3,
      airbnb: 4.8,
    },
    sentiments: {
      positive: 80,
      neutral: 13,
      negative: 7,
    },
    features: ['Patrimonio', 'Restaurante gourmet', 'Bar rooftop', 'WiFi', 'Concierge'],
    description: 'Majestuoso hotel en edificio histórico con vistas a las murallas.',
  },
  {
    id: '6',
    name: 'Sunset Beach Cabanas',
    location: 'Playa Blanca',
    city: 'Barú',
    country: 'Colombia',
    image: 'beach cabanas sunset',
    rating: 8.5,
    pricePerNight: 165,
    totalReviews: 534,
    sentimentScore: 83,
    qualityScore: 4,
    sustainabilityScore: 4,
    platforms: {
      google: 4.5,
      booking: 8.6,
      airbnb: 4.7,
    },
    sentiments: {
      positive: 65,
      neutral: 27,
      negative: 8,
    },
    features: ['Playa', 'Cabañas', 'Restaurante', 'Snorkel', 'WiFi'],
    description: 'Cabañas frente al mar con acceso directo a playa de arena blanca.',
  },
];

export const mockReviews: { [key: string]: Review[] } = {
  '1': [
    {
      id: 'r1',
      author: 'María González',
      platform: 'google',
      rating: 5,
      date: '2024-02-15',
      text: 'Experiencia excepcional. El servicio es impecable, las instalaciones son de primer nivel y el compromiso con la sostenibilidad es admirable. La comida del restaurante es deliciosa y el spa es un paraíso de relajación.',
      sentiment: 'positive',
      topics: ['servicio', 'instalaciones', 'sostenibilidad', 'gastronomía', 'spa'],
    },
    {
      id: 'r2',
      author: 'John Smith',
      platform: 'booking',
      rating: 5,
      date: '2024-02-10',
      text: 'Amazing stay! The staff went above and beyond to make our honeymoon special. The eco-friendly practices are impressive without compromising luxury. Highly recommend!',
      sentiment: 'positive',
      topics: ['staff', 'service', 'sustainability', 'luxury'],
    },
    {
      id: 'r3',
      author: 'Carlos Ramírez',
      platform: 'airbnb',
      rating: 4,
      date: '2024-01-28',
      text: 'Muy buen hotel, aunque el precio es elevado. Las habitaciones son espaciosas y limpias. La ubicación es perfecta para explorar el centro histórico.',
      sentiment: 'positive',
      topics: ['precio', 'habitaciones', 'limpieza', 'ubicación'],
    },
    {
      id: 'r4',
      author: 'Sophie Martin',
      platform: 'google',
      rating: 3,
      date: '2024-01-20',
      text: 'Good hotel but had some issues with noise from the restaurant below. Room service was a bit slow during peak hours.',
      sentiment: 'neutral',
      topics: ['ruido', 'room service'],
    },
    {
      id: 'r5',
      author: 'Ana Rodríguez',
      platform: 'booking',
      rating: 5,
      date: '2024-01-15',
      text: 'Increíble! Todo perfecto desde el check-in hasta el check-out. El personal es súper atento y las instalaciones están impecables. Volveré sin duda.',
      sentiment: 'positive',
      topics: ['servicio', 'instalaciones', 'personal'],
    },
    {
      id: 'r6',
      author: 'Roberto Silva',
      platform: 'airbnb',
      rating: 2,
      date: '2024-01-05',
      text: 'Decepcionante para el precio. El WiFi era lento y tuvimos problemas con el aire acondicionado. El desayuno no cumplió nuestras expectativas.',
      sentiment: 'negative',
      topics: ['precio', 'wifi', 'aire acondicionado', 'desayuno'],
    },
  ],
};

export const sentimentTopics = [
  { name: 'Servicio', positive: 85, negative: 15 },
  { name: 'Limpieza', positive: 90, negative: 10 },
  { name: 'Ubicación', positive: 92, negative: 8 },
  { name: 'Comida', positive: 78, negative: 22 },
  { name: 'Precio/Calidad', positive: 65, negative: 35 },
  { name: 'Instalaciones', positive: 88, negative: 12 },
  { name: 'WiFi', positive: 70, negative: 30 },
  { name: 'Comodidad', positive: 87, negative: 13 },
];
