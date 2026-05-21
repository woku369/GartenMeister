/**
 * Script zum Hinzufügen von Test-Wetterdaten für Statistik-Demonstration
 * Erstellt realistische Wetterdaten für die letzten 3 Monate
 */

const fs = require('fs');
const path = require('path');

// Pfad zur Wetterdaten-Datei
const userDataPath = require('os').homedir();
const dataPath = path.join(userDataPath, 'AppData', 'Roaming', 'GartenMeister', 'data', 'weather-data.json');

// Bestehende Daten laden
function loadExistingData() {
  try {
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
    return [];
  } catch (error) {
    console.error('Fehler beim Laden der bestehenden Daten:', error);
    return [];
  }
}

// Realistische Wetterdaten für Gurk, Österreich generieren
function generateRealisticWeatherData(startDate, endDate) {
  const data = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    // Saisonale Temperatur-Baseline für Österreich
    const dayOfYear = getDayOfYear(current);
    const seasonalTemp = getSeasonalTemperature(dayOfYear);
    
    // Tägliche Schwankungen (+/- 5°C)
    const dailyVariation = (Math.random() - 0.5) * 10;
    const airTemp = seasonalTemp + dailyVariation;
    
    // Bodentemperatur (4-6°C niedriger, weniger schwankend)
    const soilTemp = airTemp - 4.5 - (Math.random() * 2);
    
    // Luftfeuchtigkeit (30-90%, abhängig von Temperatur)
    const humidity = Math.max(30, Math.min(90, 75 - (airTemp - 15) * 2 + (Math.random() - 0.5) * 20));
    
    // Windgeschwindigkeit (0-20 km/h, meist 3-12)
    const windSpeed = Math.max(0, Math.min(20, 7 + (Math.random() - 0.5) * 8));
    
    // Niederschlag (80% trocken, 20% Regen)
    const precipitation = Math.random() < 0.8 ? 0 : Math.random() * 15;
    
    // Wetterlage basierend auf Niederschlag und Temperatur
    let condition;
    if (precipitation > 5) {
      condition = 'Regen';
    } else if (precipitation > 0) {
      condition = 'Leichter Regen';
    } else if (humidity > 80) {
      condition = 'Überwiegend bewölkt';
    } else if (humidity < 50 && airTemp > 20) {
      condition = 'Sonnig';
    } else {
      condition = 'Teilweise bewölkt';
    }
    
    data.push({
      id: `weather-test-${current.getTime()}`,
      timestamp: current.toISOString(),
      airTemperature: Math.round(airTemp * 100) / 100,
      soilTemperature: Math.round(soilTemp * 100) / 100,
      humidity: Math.round(humidity),
      windSpeed: Math.round(windSpeed * 100) / 100,
      precipitation: Math.round(precipitation * 100) / 100,
      condition: condition
    });
    
    // Nächster Zeitpunkt (alle 2-3 Stunden für realistischere Dichte)
    current.setHours(current.getHours() + 2 + Math.floor(Math.random() * 2));
  }
  
  return data;
}

// Tag des Jahres berechnen (1-365)
function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Saisonale Grundtemperatur für Österreich
function getSeasonalTemperature(dayOfYear) {
  // Sinuswelle: Minimum im Januar (~2°C), Maximum im Juli (~25°C)
  const amplitude = 11.5; // (25-2)/2
  const baseline = 13.5;  // (25+2)/2
  const phase = (dayOfYear - 200) * 2 * Math.PI / 365; // Maximum um Tag 200 (Juli)
  
  return baseline + amplitude * Math.sin(phase);
}

// Hauptfunktion
function main() {
  console.log('🌤️ Generiere Test-Wetterdaten...');
  
  // Bestehende Daten laden
  const existingData = loadExistingData();
  console.log(`📊 Bestehende Datenpunkte: ${existingData.length}`);
  
  // Test-Daten für die letzten 3 Monate generieren
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);
  
  console.log(`📅 Generiere Daten von ${startDate.toLocaleDateString()} bis ${endDate.toLocaleDateString()}`);
  
  const testData = generateRealisticWeatherData(startDate, endDate);
  console.log(`✨ ${testData.length} Test-Datenpunkte generiert`);
  
  // Daten zusammenführen (keine Duplikate basierend auf Zeitstempel)
  const existingTimestamps = new Set(existingData.map(d => d.timestamp));
  const newData = testData.filter(d => !existingTimestamps.has(d.timestamp));
  
  const combinedData = [...existingData, ...newData];
  
  // Nach Zeitstempel sortieren
  combinedData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  console.log(`💾 Speichere ${combinedData.length} Datenpunkte (${newData.length} neue)...`);
  
  // Sichern
  try {
    fs.writeFileSync(dataPath, JSON.stringify(combinedData, null, 2));
    console.log('✅ Test-Daten erfolgreich hinzugefügt!');
    console.log(`📈 Insgesamt: ${combinedData.length} Wetterdatenpunkte`);
    console.log('🎯 Die Statistiken im "Gartenwerkzeuge" Tab sollten nun aussagekräftige Daten zeigen');
  } catch (error) {
    console.error('❌ Fehler beim Speichern:', error);
  }
}

// Script ausführen
if (require.main === module) {
  main();
}
