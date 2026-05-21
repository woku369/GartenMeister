/**
 * OneDrive Backup Import Helper
 * 
 * Dieses Skript hilft beim Importieren und Validieren von Backup-Dateien
 * vom entfernten Rechner in die OneDrive-Struktur.
 */

const fs = require('fs');
const path = require('path');

// Konfiguration
const BACKUP_DIR = 'C:\\Users\\wolfg\\OneDrive\\GartenMeister\\backups';
const REQUIRED_FIELDS = ['users', 'beds', 'plants', 'lastModified'];

/**
 * Alle Backup-Dateien im OneDrive-Ordner auflisten
 */
function listBackupFiles() {
  console.log('📋 Verfügbare Backup-Dateien in OneDrive:');
  console.log('=' .repeat(60));
  
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ Backup-Ordner nicht gefunden:', BACKUP_DIR);
    return [];
  }
  
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        size: stats.size,
        modified: stats.mtime
      };
    })
    .sort((a, b) => b.modified - a.modified);
  
  if (files.length === 0) {
    console.log('📂 Keine Backup-Dateien gefunden.');
    console.log('');
    console.log('💡 Kopieren Sie Ihre Backup-Dateien (.json) in:');
    console.log('   ' + BACKUP_DIR);
    return [];
  }
  
  files.forEach((file, index) => {
    console.log(`${index + 1}. ${file.name}`);
    console.log(`   Größe: ${(file.size / 1024).toFixed(1)} KB`);
    console.log(`   Datum: ${file.modified.toLocaleString('de-DE')}`);
    console.log('');
  });
  
  return files;
}

/**
 * Backup-Datei validieren
 */
function validateBackupFile(filePath) {
  try {
    console.log(`🔍 Validiere: ${path.basename(filePath)}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Prüfe erforderliche Felder
    const missingFields = REQUIRED_FIELDS.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      console.log(`   ❌ Fehlende Felder: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Prüfe Datenstrukturen
    const stats = {
      users: Array.isArray(data.users) ? data.users.length : 0,
      beds: Array.isArray(data.beds) ? data.beds.length : 0,
      plants: Array.isArray(data.plants) ? data.plants.length : 0,
      harvests: Array.isArray(data.harvests) ? data.harvests.length : 0
    };
    
    console.log(`   ✅ Gültige Backup-Datei:`);
    console.log(`      - Benutzer: ${stats.users}`);
    console.log(`      - Beete: ${stats.beds}`);
    console.log(`      - Pflanzen: ${stats.plants}`);
    console.log(`      - Ernten: ${stats.harvests}`);
    console.log(`      - Letzte Änderung: ${data.lastModified}`);
    
    return true;
    
  } catch (error) {
    console.log(`   ❌ Ungültige Datei: ${error.message}`);
    return false;
  }
}

/**
 * Alle Backup-Dateien validieren
 */
function validateAllBackups() {
  console.log('🧪 Validiere alle Backup-Dateien...');
  console.log('=' .repeat(60));
  
  const files = listBackupFiles();
  
  if (files.length === 0) {
    return;
  }
  
  console.log('🔍 Validierung:');
  console.log('');
  
  let validFiles = 0;
  
  files.forEach(file => {
    if (validateBackupFile(file.path)) {
      validFiles++;
    }
    console.log('');
  });
  
  console.log('📊 Zusammenfassung:');
  console.log(`   Gesamt: ${files.length} Dateien`);
  console.log(`   Gültig: ${validFiles} Dateien`);
  console.log(`   Ungültig: ${files.length - validFiles} Dateien`);
  console.log('');
  
  if (validFiles > 0) {
    console.log('✅ Sie können jetzt in der GartenMeister-App:');
    console.log('   1. Zu Einstellungen → OneDrive gehen');
    console.log('   2. "Backup-Dateien suchen" klicken');
    console.log('   3. Eine Backup-Datei zur Wiederherstellung auswählen');
  }
}

/**
 * Anweisungen anzeigen
 */
function showInstructions() {
  console.log('🚀 OneDrive Backup Import Helper');
  console.log('=' .repeat(60));
  console.log('');
  console.log('📋 Schritte zum Importieren von Backup-Dateien:');
  console.log('');
  console.log('1. Kopieren Sie alle .json Backup-Dateien vom entfernten Rechner');
  console.log('   in diesen Ordner:');
  console.log('   ' + BACKUP_DIR);
  console.log('');
  console.log('2. Führen Sie dieses Skript erneut aus, um die Dateien zu validieren:');
  console.log('   node backup-import-helper.js');
  console.log('');
  console.log('3. Starten Sie GartenMeister und gehen Sie zu:');
  console.log('   Einstellungen → OneDrive → "Backup-Dateien suchen"');
  console.log('');
  console.log('4. Wählen Sie eine Backup-Datei zur Wiederherstellung aus');
  console.log('');
}

// Hauptprogramm
function main() {
  const files = fs.readdirSync(BACKUP_DIR || '').filter(f => f.endsWith('.json'));
  
  if (files.length === 0) {
    showInstructions();
  } else {
    validateAllBackups();
  }
}

// Skript ausführen
main();
