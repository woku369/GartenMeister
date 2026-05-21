// PDF-Generator Test für Portable Build
try { 
    const gen = require('./src/simple-pdf-generator-improved.js');
    console.log('✅ PDF-Generator-Modul OK');
    console.log('✅ SimplePdfGenerator verfügbar:', !!gen.SimplePdfGenerator);
    process.exit(0);
} catch(e) { 
    console.log('❌ PDF-Generator-Modul Fehler:', e.message);
    process.exit(1);
}
