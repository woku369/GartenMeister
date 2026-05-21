'use client';

import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Thermometer, Wind, Droplets } from 'lucide-react';

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeatherData();
    // Aktualisiere alle 10 Minuten
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Versuche zuerst IPC (für Electron)
      if (window.electronAPI) {
        const result = await window.electronAPI.invoke('weather:fetch', 'Gurk,AT');
        if (result.success) {
          setWeather(result.data);
          return;
        } else {
          throw new Error(result.error);
        }
      }
      
      // Fallback: Direkte API-Anfrage (für Browser)
      const API_KEY = '7c24de0c0b5a6d85a0f84c01eeff96ba';
      const city = 'Gurk,AT';
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=de`
      );
      
      if (!response.ok) {
        throw new Error('Wetterdaten konnten nicht geladen werden');
      }
      
      const data = await response.json();
      setWeather(data);
    } catch (err) {
      console.error('Fehler beim Laden der Wetterdaten:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (weather) => {
    if (!weather) return <Cloud className="w-6 h-6" />;
    
    const main = weather.weather[0]?.main.toLowerCase();
    switch (main) {
      case 'clear':
        return <Sun className="w-6 h-6 text-yellow-500" />;
      case 'rain':
        return <CloudRain className="w-6 h-6 text-blue-500" />;
      case 'clouds':
        return <Cloud className="w-6 h-6 text-gray-500" />;
      default:
        return <Cloud className="w-6 h-6" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">Wetterdaten werden geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-destructive">
          Wetterdaten konnten nicht geladen werden. Bitte überprüfen Sie Ihre Internetverbindung.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {weather && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getWeatherIcon(weather)}
              <div>
                <p className="font-semibold">{Math.round(weather.main.temp)}°C</p>
                <p className="text-sm text-muted-foreground">
                  {weather.weather[0]?.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Gefühlt</p>
              <p className="font-medium">{Math.round(weather.main.feels_like)}°C</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Luftfeuchtigkeit</p>
                <p className="text-sm font-medium">{weather.main.humidity}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-xs text-muted-foreground">Wind</p>
                <p className="text-sm font-medium">{Math.round(weather.wind?.speed || 0)} m/s</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Weitere Details</p>
            <div className="flex justify-between text-sm">
              <span>Min: {Math.round(weather.main.temp_min)}°C</span>
              <span>Max: {Math.round(weather.main.temp_max)}°C</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
