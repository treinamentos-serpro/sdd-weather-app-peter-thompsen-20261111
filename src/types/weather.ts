export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  id: number | null;
  name: string;
  admin1: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperatureC: number | null;
  weatherCode: number | null;
  time: string | null;
  humidityPercent: number | null;
  windSpeedKmh: number | null;
  precipitationMm: number | null;
  surfacePressureHpa: number | null;
}

export interface ForecastDay {
  date: string;
  weatherCode: number | null;
  minimumC: number | null;
  maximumC: number | null;
  precipitationProbabilityMaxPercent: number | null;
}

export interface WeatherData {
  city: City;
  timezone: string;
  fetchedAt: string;
  current: CurrentWeather;
  forecast: ForecastDay[];
  isPartial: boolean;
}
