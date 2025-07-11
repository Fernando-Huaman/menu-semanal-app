const API_URL = 'https://q5kug9e8h5.execute-api.sa-east-1.amazonaws.com/prod/menu';

export const menuService = {
  generarMenu: async (presupuesto, tipoComida = [], categoria = []) => {
    console.log('🔧 Generando menú:', { presupuesto, tipoComida, categoria });
    console.log('📡 API URL:', API_URL);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presupuesto,
          tipoComida,
          categoria,
          userId: localStorage.getItem('userId') || null
        })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Respuesta de API:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Error llamando API:', error);
      return {
        success: false,
        error: error.message,
        menu: {},
        listaCompras: { items: [], total: 0 }
      };
    }
  },

  obtenerPlatos: async () => {
    try {
      const response = await fetch(`${API_URL}/platos`);
      if (!response.ok) throw new Error('Error obteniendo platos');
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      return { success: false, platos: [] };
    }
  },

  obtenerHistorial: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/history/${userId}`);
      if (!response.ok) throw new Error('Error obteniendo historial');
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      return { success: false, historial: [] };
    }
  }
};