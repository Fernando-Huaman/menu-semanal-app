import React, { useState, useEffect } from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact, IonLoading, IonAlert } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route } from 'react-router-dom';
import MenuDisplay from './components/MenuDisplay';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './App.css';

setupIonicReact();

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Algo salió mal 😕</h2>
          <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>
            <summary>Detalles del error</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button onClick={() => window.location.reload()}>
            Recargar App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar configuración
    const checkConfig = async () => {
      try {
        console.log('🚀 App iniciando...');
        console.log('📡 API URL:', process.env.REACT_APP_API_URL || 'NO CONFIGURADA');
        
        // Simular carga inicial
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setLoading(false);
      } catch (err) {
        console.error('Error en inicio:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    checkConfig();
  }, []);

  if (loading) {
    return (
      <IonApp>
        <IonLoading
          isOpen={loading}
          message={'Cargando Menu Semanal...'}
        />
      </IonApp>
    );
  }

  if (error) {
    return (
      <IonApp>
        <IonAlert
          isOpen={true}
          header={'Error de Configuración'}
          message={error}
          buttons={['OK']}
        />
      </IonApp>
    );
  }

  return (
    <IonApp>
      <ErrorBoundary>
        <IonReactRouter>
          <IonRouterOutlet>
            <Route exact path="/">
              <MenuDisplay />
            </Route>
            <Route exact path="/menu">
              <MenuDisplay />
            </Route>
          </IonRouterOutlet>
        </IonReactRouter>
      </ErrorBoundary>
    </IonApp>
  );
};

export default App;