export interface SentimentTopic {
  name: string;
  positive: number;
  negative: number;
}

export interface MonthlySentimentPoint {
  month: string;
  sentiment: number;
}

export const sentimentTopics: SentimentTopic[] = [
  { name: 'Servicio', positive: 85, negative: 15 },
  { name: 'Limpieza', positive: 90, negative: 10 },
  { name: 'Ubicacion', positive: 92, negative: 8 },
  { name: 'Comida', positive: 78, negative: 22 },
  { name: 'Precio/Calidad', positive: 65, negative: 35 },
  { name: 'Instalaciones', positive: 88, negative: 12 },
  { name: 'WiFi', positive: 70, negative: 30 },
  { name: 'Comodidad', positive: 87, negative: 13 },
];

export const monthlySentimentTrend: MonthlySentimentPoint[] = [
  { month: 'Ago', sentiment: 88 },
  { month: 'Sep', sentiment: 90 },
  { month: 'Oct', sentiment: 87 },
  { month: 'Nov', sentiment: 91 },
  { month: 'Dic', sentiment: 92 },
  { month: 'Ene', sentiment: 93 },
];
