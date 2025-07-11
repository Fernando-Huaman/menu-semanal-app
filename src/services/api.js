const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Mock data para desarrollo
const mockMenu = {
  success: true,
  menu: {
    Lunes: {
      desayuno: {
        bebida: { nombre: "Café con Leche", calorias: 120, precio: 0.93 },
        principal: { nombre: "Pan con Palta", calorias: 280, precio: 1.18 }
      },
      almuerzo: {
        bebida: { nombre: "Chicha Morada", calorias: 120, precio: 1.26 },
        entrada: { nombre: "Causa Limeña", calorias: 420, precio: 3.44 },
        fondo: { nombre: "Arroz con Pollo", calorias: 580, precio: 2.55 }
      },
      cena: {
        bebida: { nombre: "Limonada", calorias: 80, precio: 0.64 },
        entrada: { nombre: "Wantán Frito", calorias: 280, precio: 2.89 },
        fondo: { nombre: "Tallarín Saltado", calorias: 720, precio: 3.29 }
      }
    },
    Martes: {
      desayuno: {
        bebida: { nombre: "Quinua con Leche", calorias: 200, precio: 1.29 },
        principal: { nombre: "Pan con Huevo", calorias: 320, precio: 1.86 }
      },
      almuerzo: {
        bebida: { nombre: "Refresco de Maracuyá", calorias: 100, precio: 1.19 },
        entrada: { nombre: "Papa Rellena", calorias: 350, precio: 2.62 },
        fondo: { nombre: "Lomo Saltado", calorias: 680, precio: 7.01 }
      },
      cena: {
        bebida: { nombre: "Inca Kola", calorias: 150, precio: 0.90 },
        entrada: { nombre: "Anticuchos", calorias: 380, precio: 1.92 },
        fondo: { nombre: "Ají de Gallina", calorias: 620, precio: 3.78 }
      }
    }
  },
  listaCompras: {
    items: [
      { ingrediente: "Arroz", cantidad: 1, unidad: "kg", subtotal: 3.50, categoria: "cereal" },
      { ingrediente: "Pollo", cantidad: 0.5, unidad: "kg", subtotal: 4.25, categoria: "proteina" },
      { ingrediente: "Papa", cantidad: 2, unidad: "kg", subtotal: 5.00, categoria: "tuberculo" },
      { ingrediente: "Café", cantidad: 250, unidad: "g", subtotal: 5.00, categoria: "bebida" }
    ],
    total: 50.00,
    categorias: {
      cereal: [
        { ingrediente: "Arroz", cantidad: 1, unidad: "kg", subtotal: 3.50 }
      ],
      proteina: [
        { ingrediente: "Pollo", cantidad: 0.5, unidad: "kg", subtotal: 4.25 }
      ],
      tuberculo: [
        { ingrediente: "Papa", cantidad: 2, unidad: "kg", subtotal: 5.00 }
      ],
      bebida: [
        { ingrediente: "Café", cantidad: 250, unidad: "g", subtotal: 5.00 }
      ]
    }
  },
  presupuestoTotal: 50.00
};

export const menuService = {
  generarMenu: async (presupuesto, tipoComida = [], categoria = []) => {
    console.log('🔧 Generando menú:', { presupuesto, tipoComida, categoria });
    console.log('📡 API URL:', API_URL);
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Si no hay API configurada, usar mock
    if (!API_URL || API_URL.includes('localhost') || API_URL.includes('example')) {
      console.log('📦 Usando datos mock (API no configurada)');
      return mockMenu;
    }
    
    // Intentar llamar a la API real
    try {
      const response = await fetch(`${API_URL}/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presupuesto,
          tipoComida,
          categoria,
          userId: localStorage.getItem('userId') || 'default'
        })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error llamando API:', error);
      console.log('📦 Usando datos mock como fallback');
      return mockMenu;
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