// Servicio de almacenamiento local
class StorageService {
  constructor() {
    this.KEYS = {
      MENU: 'menu_actual',
      COMPRAS: 'estado_compras',
      PREFERENCIAS: 'preferencias_usuario',
      HISTORIAL: 'historial_menus'
    };
  }

  /**
   * Guarda el menú actual
   */
  guardarMenu(datos) {
    try {
      const menuData = {
        ...datos,
        fechaGuardado: new Date().toISOString()
      };
      localStorage.setItem(this.KEYS.MENU, JSON.stringify(menuData));
      return true;
    } catch (error) {
      console.error('Error guardando menú:', error);
      return false;
    }
  }

  /**
   * Carga el menú guardado
   */
  cargarMenu() {
    try {
      const menuStr = localStorage.getItem(this.KEYS.MENU);
      if (menuStr) {
        return JSON.parse(menuStr);
      }
    } catch (error) {
      console.error('Error cargando menú:', error);
    }
    return null;
  }

  /**
   * Guarda el estado de items comprados
   */
  guardarEstadoCompras(estado) {
    try {
      localStorage.setItem(this.KEYS.COMPRAS, JSON.stringify(estado));
      return true;
    } catch (error) {
      console.error('Error guardando estado de compras:', error);
      return false;
    }
  }

  /**
   * Carga el estado de items comprados
   */
  cargarEstadoCompras() {
    try {
      const estadoStr = localStorage.getItem(this.KEYS.COMPRAS);
      if (estadoStr) {
        return JSON.parse(estadoStr);
      }
    } catch (error) {
      console.error('Error cargando estado de compras:', error);
    }
    return {};
  }

  /**
   * Guarda las preferencias del usuario
   */
  guardarPreferencias(preferencias) {
    try {
      localStorage.setItem(this.KEYS.PREFERENCIAS, JSON.stringify(preferencias));
      return true;
    } catch (error) {
      console.error('Error guardando preferencias:', error);
      return false;
    }
  }

  /**
   * Carga las preferencias del usuario
   */
  cargarPreferencias() {
    try {
      const prefStr = localStorage.getItem(this.KEYS.PREFERENCIAS);
      if (prefStr) {
        return JSON.parse(prefStr);
      }
    } catch (error) {
      console.error('Error cargando preferencias:', error);
    }
    return {
      presupuesto: 200,
      tiposComida: [],
      categorias: []
    };
  }

  /**
   * Limpia todos los datos guardados
   */
  limpiarTodo() {
    try {
      Object.values(this.KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error limpiando storage:', error);
      return false;
    }
  }
}

export default new StorageService();