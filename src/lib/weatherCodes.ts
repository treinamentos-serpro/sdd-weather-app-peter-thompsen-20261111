interface WeatherCondition {
  label: string;
  icon: string;
}

const conditions: Record<number, WeatherCondition> = {
  0: { label: 'Céu limpo', icon: '☀️' },
  1: { label: 'Predominantemente limpo', icon: '🌤️' },
  2: { label: 'Parcialmente nublado', icon: '⛅' },
  3: { label: 'Nublado', icon: '☁️' },
  45: { label: 'Nevoeiro', icon: '🌫️' },
  48: { label: 'Nevoeiro com geada', icon: '🌫️' },
  51: { label: 'Garoa fraca', icon: '🌦️' },
  53: { label: 'Garoa moderada', icon: '🌦️' },
  55: { label: 'Garoa intensa', icon: '🌧️' },
  56: { label: 'Garoa congelante fraca', icon: '🌧️' },
  57: { label: 'Garoa congelante intensa', icon: '🌧️' },
  61: { label: 'Chuva fraca', icon: '🌧️' },
  63: { label: 'Chuva moderada', icon: '🌧️' },
  65: { label: 'Chuva forte', icon: '🌧️' },
  66: { label: 'Chuva congelante fraca', icon: '🌧️' },
  67: { label: 'Chuva congelante forte', icon: '🌧️' },
  71: { label: 'Neve fraca', icon: '🌨️' },
  73: { label: 'Neve moderada', icon: '🌨️' },
  75: { label: 'Neve forte', icon: '🌨️' },
  77: { label: 'Grãos de neve', icon: '🌨️' },
  80: { label: 'Pancadas de chuva fracas', icon: '🌦️' },
  81: { label: 'Pancadas de chuva moderadas', icon: '🌧️' },
  82: { label: 'Pancadas de chuva fortes', icon: '🌧️' },
  85: { label: 'Pancadas de neve fracas', icon: '🌨️' },
  86: { label: 'Pancadas de neve fortes', icon: '🌨️' },
  95: { label: 'Tempestade', icon: '⛈️' },
  96: { label: 'Tempestade com granizo fraco', icon: '⛈️' },
  99: { label: 'Tempestade com granizo forte', icon: '⛈️' },
};

const unavailable: WeatherCondition = { label: 'Condição indisponível', icon: '❔' };

export function getWeatherCondition(code: number | null): WeatherCondition {
  return code === null ? unavailable : (conditions[code] ?? unavailable);
}
