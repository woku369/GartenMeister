// Script zur Überprüfung fehlender IPC-Handler
const fs = require('fs');

// Alle Preload-IPC-Aufrufe extrahieren
const preloadContent = fs.readFileSync('./src/preload.js', 'utf8');
const indexPortableContent = fs.readFileSync('./src/index-portable.js', 'utf8');

// Regex für IPC-Aufrufe in preload.js
const preloadInvokeMatches = preloadContent.match(/ipcRenderer\.invoke\(['"](.*?)['"],?/g);
const preloadChannels = preloadInvokeMatches ? preloadInvokeMatches.map(match => {
    const result = match.match(/ipcRenderer\.invoke\(['"](.*?)['"],?/);
    return result ? result[1] : null;
}).filter(Boolean) : [];

// Regex für Handler in index-portable.js
const handlerMatches = indexPortableContent.match(/ipcMain\.handle\(['"](.*?)['"],?/g);
const handlers = handlerMatches ? handlerMatches.map(match => {
    const result = match.match(/ipcMain\.handle\(['"](.*?)['"],?/);
    return result ? result[1] : null;
}).filter(Boolean) : [];

console.log('='.repeat(60));
console.log('IPC-HANDLER DIAGNOSE');
console.log('='.repeat(60));

console.log('\n🔍 Erwartete Channels (aus preload.js):');
const uniquePreloadChannels = [...new Set(preloadChannels)].sort();
uniquePreloadChannels.forEach(channel => console.log(`   ${channel}`));

console.log('\n✅ Implementierte Handler (in index-portable.js):');
const uniqueHandlers = [...new Set(handlers)].sort();
uniqueHandlers.forEach(handler => console.log(`   ${handler}`));

console.log('\n❌ FEHLENDE HANDLER:');
const missingHandlers = uniquePreloadChannels.filter(channel => !uniqueHandlers.includes(channel));
if (missingHandlers.length === 0) {
    console.log('   🎉 Alle Handler sind implementiert!');
} else {
    missingHandlers.forEach(handler => console.log(`   ❌ ${handler}`));
}

console.log('\n🔧 ÜBERSCHÜSSIGE HANDLER:');
const extraHandlers = uniqueHandlers.filter(handler => !uniquePreloadChannels.includes(handler));
if (extraHandlers.length === 0) {
    console.log('   ✅ Keine überschüssigen Handler');
} else {
    extraHandlers.forEach(handler => console.log(`   ℹ️  ${handler}`));
}

console.log('\n📊 STATISTIK:');
console.log(`   Erwartete Channels: ${uniquePreloadChannels.length}`);
console.log(`   Implementierte Handler: ${uniqueHandlers.length}`);
console.log(`   Fehlende Handler: ${missingHandlers.length}`);
console.log(`   Überschüssige Handler: ${extraHandlers.length}`);

console.log('\n='.repeat(60));
