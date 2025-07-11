import React, { useState, useEffect } from 'react';
import './App.css';
import ConfigTab from './components/ConfigTab';
import PreparacionTab from './components/PreparacionTab';
import ComprasTab from './components/ComprasTab';
import api from './services/api';
import storage from './services/storage';
import { ShoppingCart, Utensils, Settings } from 'lucide-react';

function App() {
  // Estados principales
  const [activeTab, setActiveTab] = useState('configuracion');
  const [presupuesto, setPresupuesto] = useState(200);
  const [preferencias, setPreferencias] = useState([]);
  const [preferenciasCategoria, setPreferenciasCategoria] = useState([]);
  const [menuGenerado, setMenuGenerado] = useState(null);
  const [listaCompras, setListaCompras] = useState({});
  const [itemsComprados, setItemsComprados] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar datos guardados al iniciar
  useEffect(() => {
    const datosGuardados = storage.cargarMenu();
    if (datosGuardados) {
      setMenuGenerado(datosGuardados.menu);
      setListaCompras(datosGuardados.listaCompras);
    }
  }, []);

  // Handlers
  const handlePreferenciaToggle = (tipo) => {
    setPreferencias(prev => 
      prev.includes(tipo) 
        ? prev.filter(p => p !== tipo)
        : [...prev, tipo]
    );
  };

  const handleCategoriaToggle = (categoria) => {
    setPreferenciasCategoria(prev => 
      prev.includes(categoria) 
        ? prev.filter(p => p !== categoria)
        : [...prev, categoria]
    );
  };

  const toggleItemComprado = (ingrediente) => {
    setItemsComprados(prev => ({
      ...prev,
      [ingrediente]: !prev[ingrediente]
    }));
    
    // Guardar estado de compras
    storage.guardarEstadoCompras({
      ...itemsComprados,
      [ingrediente]: !itemsComprados[ingrediente]
    });
  };

  const generarMenu = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const resultado = await api.generarMenu(
        presupuesto,
        preferencias,
        preferenciasCategoria
      );
      
      setMenuGenerado({
        platos: resultado.menu_semanal,
        presupuestoTotal: resultado.presupuesto_total,
        userId: resultado.user_id
      });
      
      setListaCompras(resultado.lista_compras);
      setItemsComprados({});
      
      // Guardar en localStorage
      storage.guardarMenu({
        menu: resultado.menu_semanal,
        listaCompras: resultado.lista_compras,
        presupuestoTotal: resultado.presupuesto_total
      });
      
      // Cambiar a pestaña de preparación
      setActiveTab('preparacion');
      
    } catch (err) {
      setError(err.message);
      console.error('Error generando menú:', err);
    } finally {
      setLoading(false);
    }
  };

  // Componente TabButton
  const TabButton = ({ id, icon: Icon, label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`tab-button ${isActive ? 'active' : ''}`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1>Menú Semanal para 2</h1>
        <p>Powered by ML & AWS</p>
      </header>

      {/* Tab Navigation */}
      <nav className="tab-navigation">
        <TabButton
          id="configuracion"
          icon={Settings}
          label="Configurar"
          isActive={activeTab === 'configuracion'}
          onClick={() => setActiveTab('configuracion')}
        />
        <TabButton
          id="preparacion"
          icon={Utensils}
          label="Preparación"
          isActive={activeTab === 'preparacion'}
          onClick={() => setActiveTab('preparacion')}
        />
        <TabButton
          id="compras"
          icon={ShoppingCart}
          label="Compras"
          isActive={activeTab === 'compras'}
          onClick={() => setActiveTab('compras')}
        />
      </nav>

      {/* Content */}
      <main className="app-content">
        {activeTab === 'configuracion' && (
          <ConfigTab
            presupuesto={presupuesto}
            setPresupuesto={setPresupuesto}
            preferencias={preferencias}
            handlePreferenciaToggle={handlePreferenciaToggle}
            preferenciasCategoria={preferenciasCategoria}
            handleCategoriaToggle={handleCategoriaToggle}
            generarMenu={generarMenu}
            loading={loading}
            error={error}
            menuGenerado={menuGenerado}
          />
        )}
        
        {activeTab === 'preparacion' && (
          <PreparacionTab menuGenerado={menuGenerado} />
        )}
        
        {activeTab === 'compras' && (
          <ComprasTab
            listaCompras={listaCompras}
            itemsComprados={itemsComprados}
            toggleItemComprado={toggleItemComprado}
          />
        )}
      </main>
    </div>
  );
}

export default App;