// Servicio para comunicarse con el backend Lambda
const API_URL = process.env.REACT_APP_API_URL || 'https://your-api.execute-api.us-east-1.amazonaws.com/prod';

class MenuAPI {
  /**
   * Genera un nuevo menú semanal usando ML
   */
  async generarMenu(presupuesto, preferencias_tipo, preferencias_categoria) {
    try {
      console.log('Generando menú con:', { presupuesto, preferencias_tipo, preferencias_categoria });
      
      const response = await fetch(`${API_URL}/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presupuesto,
          preferencias_tipo,
          preferencias_categoria
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error generando menú');
      }
      
      // Guardar en cache local para uso offline
      this.guardarEnCache(data);
      
      return data;
    } catch (error) {
      console.error('Error generando menú:', error);
      
      // Si falla, intentar cargar desde cache
      const menuCacheado = this.obtenerDeCache();
      if (menuCacheado) {
        console.log('Usando menú desde cache offline');
        return menuCacheado;
      }
      
      throw error;
    }
  }

  /**
   * Obtiene la lista de todos los platos disponibles
   */
  async obtenerPlatos() {
    try {
      const response = await fetch(`${API_URL}/platos`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      // Cachear platos para referencia
      localStorage.setItem('platos_cache', JSON.stringify({
        platos: data.platos,
        fecha: new Date().toISOString()
      }));
      
      return data;
    } catch (error) {
      console.error('Error obteniendo platos:', error);
      
      // Intentar cargar desde cache
      const platosCache = localStorage.getItem('platos_cache');
      if (platosCache) {
        return JSON.parse(platosCache);
      }
      
      throw error;
    }
  }

  /**
   * Obtiene el historial de menús de un usuario
   */
  async obtenerHistorial(userId) {
    try {
      const response = await fetch(`${API_URL}/history/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      throw error;
    }
  }

  /**
   * Guarda el menú en localStorage para uso offline
   */
  guardarEnCache(data) {
    try {
      const cacheData = {
        menu_semanal: data.menu_semanal,
        lista_compras: data.lista_compras,
        presupuesto_total: data.presupuesto_total,
        user_id: data.user_id,
        fecha_generacion: new Date().toISOString()
      };
      
      localStorage.setItem('menu_cache', JSON.stringify(cacheData));
      
      // Mantener historial de últimos 5 menús
      const historial = JSON.parse(localStorage.getItem('menu_historial') || '[]');
      historial.unshift(cacheData);
      if (historial.length > 5) {
        historial.pop();
      }
      localStorage.setItem('menu_historial', JSON.stringify(historial));
      
    } catch (error) {
      console.error('Error guardando en cache:', error);
    }
  }

  /**
   * Obtiene el menú desde cache
   */
  obtenerDeCache() {
    try {
      const cacheData = localStorage.getItem('menu_cache');
      if (cacheData) {
        const data = JSON.parse(cacheData);
        // Verificar que no sea muy antiguo (7 días)
        const fechaCache = new Date(data.fecha_generacion);
        const ahora = new Date();
        const diasDiferencia = (ahora - fechaCache) / (1000 * 60 * 60 * 24);
        
        if (diasDiferencia < 7) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error leyendo cache:', error);
    }
    return null;
  }

  /**
   * Obtiene el historial de menús guardados localmente
   */
  obtenerHistorialLocal() {
    try {
      const historial = localStorage.getItem('menu_historial');
      return historial ? JSON.parse(historial) : [];
    } catch (error) {
      console.error('Error leyendo historial:', error);
      return [];
    }
  }
}

export default new MenuAPI();