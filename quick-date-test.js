// Schneller Test für Dateiname-Extraktion
const ExifExtractor = require('./src/utils/exif-extractor');

const extractor = new ExifExtractor();

const testCases = [
  'IMG_20240315_143022.jpg',
  '20240401_garden.jpeg',
  'random_name.jpg'
];

testCases.forEach(fileName => {
  console.log(`\n📝 Test: ${fileName}`);
  const result = extractor.extractDateFromFileName(fileName);
  console.log(`Ergebnis: ${result}`);
  if (result) {
    const date = new Date(result);
    console.log(`Formatiert: ${date.toLocaleDateString('de-DE')}`);
  }
});
