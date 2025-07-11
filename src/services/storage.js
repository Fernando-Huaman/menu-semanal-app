const STORAGE_KEYS = {
  MENU_HISTORY: 'menu_history',
  USER_PREFERENCES: 'user_preferences',
  USER_ID: 'user_id'
};

// Generar o recuperar ID de usuario
const getUserId = () => {
  let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  }
  return userId;
};

// Guardar menú en historial
export const saveMenu = (menu, listaCompras, presupuesto) => {
  try {
    const history = getMenuHistory();
    const newEntry = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      menu,
      listaCompras,
      presupuesto,
      userId: getUserId()
    };
    
    // Mantener solo los últimos 10 menús
    history.unshift(newEntry);
    if (history.length > 10) {
      history.pop();
    }
    
    localStorage.setItem(STORAGE_KEYS.MENU_HISTORY, JSON.stringify(history));
    console.log('✅ Menú guardado en historial');
    return true;
  } catch (error) {
    console.error('Error guardando menú:', error);
    return false;
  }
};

// Obtener historial de menús
export const getMenuHistory = () => {
  try {
    const history = localStorage.getItem(STORAGE_KEYS.MENU_HISTORY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return [];
  }
};

// Limpiar historial
export const clearMenuHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.MENU_HISTORY);
    console.log('🗑️ Historial borrado');
    return true;
  } catch (error) {
    console.error('Error borrando historial:', error);
    return false;
  }
};

// Guardar preferencias de usuario
export const saveUserPreferences = (preferences) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error('Error guardando preferencias:', error);
    return false;
  }
};

// Obtener preferencias de usuario
export const getUserPreferences = () => {
  try {
    const prefs = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return prefs ? JSON.parse(prefs) : {
      presupuestoDefault: 200,
      tipoComidaDefault: [],
      categoriaDefault: []
    };
  } catch (error) {
    console.error('Error obteniendo preferencias:', error);
    return {
      presupuestoDefault: 200,
      tipoComidaDefault: [],
      categoriaDefault: []
    };
  }
};

// Obtener último menú guardado
export const getLastMenu = () => {
  const history = getMenuHistory();
  return history.length > 0 ? history[0] : null;
};

// Buscar menú por ID
export const getMenuById = (id) => {
  const history = getMenuHistory();
  return history.find(entry => entry.id === id) || null;
};