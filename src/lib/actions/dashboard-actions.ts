'use client';

import { isElectron } from '@/lib/electron-bridge';

// ===== DASHBOARD DATA LOADING ACTIONS =====

export async function getDashboardData() {
  try {
    if (isElectron()) {
      // Electron-Umgebung: Verwende IPC APIs
      console.log('🟢 Loading dashboard data via Electron IPC...');
      
      const [currentUser, allBeds, allHerbs, harvestEvents] = await Promise.all([
        window.electronAPI.users.getCurrent(),
        window.electronAPI.beds.getAll(),
        window.electronAPI.herbs.getAll(), 
        window.electronAPI.harvests.getEvents()
      ]);

      console.log('✅ Dashboard data loaded via IPC:', {
        user: currentUser?.name,
        beds: allBeds?.length,
        herbs: allHerbs?.length,
        events: harvestEvents?.length
      });

      return {
        currentUser,
        beds: allBeds || [],
        herbs: allHerbs || [],
        harvestEvents: harvestEvents || [],
        isElectron: true
      };
      
    } else {
      // Web-Umgebung: Verwende action-stubs
      console.log('🟡 Loading dashboard data via web stubs...');
      
      const { getUsersAction } = await import('@/lib/actions-stubs');
      const { getBedsAction } = await import('@/lib/actions-stubs');
      const { getHerbsAction } = await import('@/lib/actions-stubs');
      
      const [users, beds, herbs] = await Promise.all([
        getUsersAction(),
        getBedsAction(),
        getHerbsAction()
      ]);

      const currentUser = users?.[0];

      console.log('✅ Dashboard data loaded via stubs:', {
        user: currentUser?.name,
        beds: beds?.length,
        herbs: herbs?.length
      });

      return {
        currentUser,
        beds: beds || [],
        herbs: herbs || [],
        harvestEvents: [],
        isElectron: false
      };
    }
    
  } catch (error) {
    console.error('❌ Error loading dashboard data:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    if (isElectron()) {
      console.log('🟢 Getting current user via IPC...');
      const user = await window.electronAPI.users.getCurrent();
      console.log('✅ Current user loaded:', user?.name);
      return user;
    } else {
      console.log('🟡 Getting current user via stubs...');
      const { getUsersAction } = await import('@/lib/actions-stubs');
      const users = await getUsersAction();
      const user = users?.[0];
      console.log('✅ Current user loaded via stubs:', user?.name);
      return user;
    }
  } catch (error) {
    console.error('❌ Error getting current user:', error);
    throw error;
  }
}

export async function getAllBeds() {
  try {
    if (isElectron()) {
      console.log('🟢 Getting all beds via IPC...');
      const beds = await window.electronAPI.beds.getAll();
      console.log('✅ Beds loaded:', beds?.length);
      return beds || [];
    } else {
      console.log('🟡 Getting all beds via stubs...');
      const { getBedsAction } = await import('@/lib/actions-stubs');
      const beds = await getBedsAction();
      console.log('✅ Beds loaded via stubs:', beds?.length);
      return beds || [];
    }
  } catch (error) {
    console.error('❌ Error getting beds:', error);
    throw error;
  }
}

export async function getAllHerbs() {
  try {
    if (isElectron()) {
      console.log('🟢 Getting all herbs via IPC...');
      const herbs = await window.electronAPI.herbs.getAll();
      console.log('✅ Herbs loaded:', herbs?.length);
      return herbs || [];
    } else {
      console.log('🟡 Getting all herbs via stubs...');
      const { getHerbsAction } = await import('@/lib/actions-stubs');
      const herbs = await getHerbsAction();
      console.log('✅ Herbs loaded via stubs:', herbs?.length);
      return herbs || [];
    }
  } catch (error) {
    console.error('❌ Error getting herbs:', error);
    throw error;
  }
}

export async function getAllHarvestEvents() {
  try {
    if (isElectron()) {
      console.log('🟢 Getting harvest events via IPC...');
      const events = await window.electronAPI.harvests.getEvents();
      console.log('✅ Harvest events loaded:', events?.length);
      return events || [];
    } else {
      console.log('🟡 Getting harvest events via stubs...');
      // Web-Umgebung hat keine harvest events
      return [];
    }
  } catch (error) {
    console.error('❌ Error getting harvest events:', error);
    throw error;
  }
}
