/**
 * Einfaches Benutzer-System für GartenMeister
 * Lokale Benutzerverwaltung mit Profilen
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

class UserManager {
  constructor() {
    this.userDataPath = app ? app.getPath('userData') : process.cwd();
    this.usersFile = path.join(this.userDataPath, 'users.json');
    this.currentUserFile = path.join(this.userDataPath, 'current-user.json');
    
    this.ensureUsersFile();
    this.ensureDefaultUser();
  }

  /**
   * Users-Datei erstellen falls nicht vorhanden
   */
  ensureUsersFile() {
    if (!fs.existsSync(this.usersFile)) {
      const defaultUsers = [];
      fs.writeFileSync(this.usersFile, JSON.stringify(defaultUsers, null, 2));
    }
  }

  /**
   * Standard-Benutzer erstellen
   */
  ensureDefaultUser() {
    const users = this.getUsers();
    if (users.length === 0) {
      const defaultUser = {
        id: 'user-default',
        name: 'Garten-Besitzer',
        email: '',
        avatar: '',
        role: 'admin',
        createdAt: new Date().toISOString(),
        preferences: {
          defaultCategory: 'Allgemein',
          autoTagging: true,
          notifications: true
        }
      };
      
      this.addUser(defaultUser);
      this.setCurrentUser(defaultUser.id);
    }
  }

  /**
   * Alle Benutzer abrufen
   */
  getUsers() {
    try {
      const data = fs.readFileSync(this.usersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('[UserManager] Fehler beim Laden der Benutzer:', error);
      return [];
    }
  }

  /**
   * Benutzer hinzufügen
   */
  addUser(userData) {
    try {
      const users = this.getUsers();
      const newUser = {
        id: userData.id || `user-${Date.now()}`,
        name: userData.name || 'Neuer Benutzer',
        email: userData.email || '',
        avatar: userData.avatar || '',
        role: userData.role || 'user',
        createdAt: new Date().toISOString(),
        preferences: userData.preferences || {
          defaultCategory: 'Allgemein',
          autoTagging: true,
          notifications: true
        }
      };
      
      users.push(newUser);
      fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
      
      console.log(`[UserManager] ✅ Benutzer hinzugefügt: ${newUser.name}`);
      return newUser;
    } catch (error) {
      console.error('[UserManager] Fehler beim Hinzufügen des Benutzers:', error);
      throw error;
    }
  }

  /**
   * Benutzer bearbeiten
   */
  updateUser(userId, updates) {
    try {
      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        throw new Error('Benutzer nicht gefunden');
      }
      
      users[userIndex] = { ...users[userIndex], ...updates };
      fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
      
      return users[userIndex];
    } catch (error) {
      console.error('[UserManager] Fehler beim Aktualisieren des Benutzers:', error);
      throw error;
    }
  }

  /**
   * Aktuellen Benutzer setzen
   */
  setCurrentUser(userId) {
    try {
      const currentUser = { userId, setAt: new Date().toISOString() };
      fs.writeFileSync(this.currentUserFile, JSON.stringify(currentUser, null, 2));
      return true;
    } catch (error) {
      console.error('[UserManager] Fehler beim Setzen des aktuellen Benutzers:', error);
      return false;
    }
  }

  /**
   * Aktuellen Benutzer abrufen
   */
  getCurrentUser() {
    try {
      if (fs.existsSync(this.currentUserFile)) {
        const currentUserData = JSON.parse(fs.readFileSync(this.currentUserFile, 'utf8'));
        const users = this.getUsers();
        const user = users.find(u => u.id === currentUserData.userId);
        return user || null;
      }
      
      // Fallback: Ersten Benutzer zurückgeben
      const users = this.getUsers();
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('[UserManager] Fehler beim Abrufen des aktuellen Benutzers:', error);
      return null;
    }
  }

  /**
   * Benutzer-Avatar erstellen (Initialen)
   */
  generateAvatar(name) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const color = colors[name.length % colors.length];
    
    return {
      initials,
      backgroundColor: color,
      textColor: '#FFFFFF'
    };
  }

  /**
   * Benutzer-Statistiken
   */
  getUserStats(userId) {
    try {
      // TODO: Integration mit ImageManager für Upload-Statistiken
      const ImageManager = require('./image-manager');
      let imageStats = { totalUploads: 0, totalComments: 0, favoriteImages: 0 };
      
      try {
        const imageManager = new ImageManager();
        const images = imageManager.loadMetadata();
        
        // Uploads von diesem Benutzer zählen
        const userImages = images.filter(img => img.uploadedBy === userId || 
          (userId.startsWith('user-') && img.uploadedBy === 'Aktueller Nutzer'));
        
        imageStats.totalUploads = userImages.length;
        imageStats.totalComments = userImages.reduce((sum, img) => sum + (img.comments?.length || 0), 0);
        imageStats.favoriteImages = userImages.filter(img => img.isFavorite).length;
        
      } catch (imageError) {
        console.warn('[UserManager] Fehler beim Laden der Bild-Statistiken:', imageError.message);
      }
      
      const user = this.getUsers().find(u => u.id === userId);
      
      return {
        ...imageStats,
        joinedDate: user?.createdAt || new Date().toISOString(),
        lastActiveDate: new Date().toISOString() // TODO: Echte letzte Aktivität tracken
      };
    } catch (error) {
      console.error('[UserManager] Fehler beim Abrufen der Benutzer-Statistiken:', error);
      return {
        totalUploads: 0,
        totalComments: 0,
        favoriteImages: 0,
        joinedDate: new Date().toISOString(),
        lastActiveDate: new Date().toISOString()
      };
    }
  }

  /**
   * Benutzer löschen
   */
  deleteUser(userId) {
    try {
      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        throw new Error('Benutzer nicht gefunden');
      }
      
      // Verhindere das Löschen des letzten Admin-Benutzers
      const admins = users.filter(u => u.role === 'admin');
      const userToDelete = users[userIndex];
      
      if (userToDelete.role === 'admin' && admins.length === 1) {
        throw new Error('Der letzte Administrator kann nicht gelöscht werden');
      }
      
      // Entferne Benutzer
      users.splice(userIndex, 1);
      fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
      
      // Falls der aktuelle Benutzer gelöscht wurde, wechsle zu einem anderen
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        if (users.length > 0) {
          this.setCurrentUser(users[0].id);
        }
      }
      
      console.log(`[UserManager] ✅ Benutzer gelöscht: ${userToDelete.name}`);
      return true;
    } catch (error) {
      console.error('[UserManager] Fehler beim Löschen des Benutzers:', error);
      throw error;
    }
  }

  /**
   * Alle Benutzer-Statistiken abrufen
   */
  getAllUserStats() {
    try {
      const users = this.getUsers();
      return users.map(user => ({
        ...user,
        stats: this.getUserStats(user.id)
      }));
    } catch (error) {
      console.error('[UserManager] Fehler beim Abrufen aller Benutzer-Statistiken:', error);
      return [];
    }
  }
}

module.exports = UserManager;
