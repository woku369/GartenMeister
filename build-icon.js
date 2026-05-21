/**
 * Icon-Konvertierung: SVG → PNG → ICO
 * Bettet EskapadeFraktur als base64 in die SVG ein,
 * damit ImageMagick / Pango den Font findet.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FONT_PATH = 'C:/Users/wolfg/Desktop/CI VS/fonts/EskapadeFraktur-Regular.ttf';
const SVG_SRC   = path.join(__dirname, 'src/app/GartenMeister-icon.svg');
const SVG_EMB   = path.join(__dirname, 'src/app/GartenMeister-icon-embedded.svg');
const PNG_512   = path.join(__dirname, 'src/app/GartenMeister-icon-512.png');
const PNG_256   = path.join(__dirname, 'src/app/GartenMeister-icon-256.png');
const ICO_OUT   = path.join(__dirname, 'src/app/GartenMeister-icon.ico');

// 1. Font base64-encoden und in SVG einbetten
console.log('1/4 Font einbetten...');
const fontBase64 = fs.readFileSync(FONT_PATH).toString('base64');
let svg = fs.readFileSync(SVG_SRC, 'utf8');
svg = svg.replace(
  "src: url('../../fonts/EskapadeFraktur-Regular.ttf') format('truetype');",
  `src: url('data:font/truetype;base64,${fontBase64}') format('truetype');`
);
fs.writeFileSync(SVG_EMB, svg, 'utf8');
console.log('   -> SVG mit eingebetteter Font gespeichert');

// 2. SVG → PNG 512×512
console.log('2/4 SVG → PNG 512×512...');
try {
  execSync(`magick -density 192 -size 512x512 "${SVG_EMB}" -resize 512x512 "${PNG_512}"`, { stdio: 'inherit' });
  console.log('   -> PNG 512 erstellt');
} catch (e) {
  console.error('   Fehler:', e.message);
  process.exit(1);
}

// 3. PNG 512 → PNG 256
console.log('3/4 PNG 512 → 256...');
execSync(`magick "${PNG_512}" -resize 256x256 "${PNG_256}"`, { stdio: 'inherit' });
console.log('   -> PNG 256 erstellt');

// 4. PNG-Dateien → ICO (mehrere Größen)
console.log('4/4 PNG → ICO...');
execSync(
  `magick "${PNG_256}" -define icon:auto-resize="256,128,64,48,32,16" "${ICO_OUT}"`,
  { stdio: 'inherit' }
);
console.log('   -> ICO erstellt:', ICO_OUT);

// Temp-SVG aufräumen
fs.unlinkSync(SVG_EMB);
console.log('\nFertig! Icon-Dateien:');
console.log(' ', PNG_512);
console.log(' ', PNG_256);
console.log(' ', ICO_OUT);
