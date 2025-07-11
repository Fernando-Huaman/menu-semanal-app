import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonItem,
  IonList,
  IonButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonLoading,
  IonToast,
  IonBadge,
  IonIcon,
  IonChip,
  IonAvatar,
  IonProgressBar,
  IonFab,
  IonFabButton,
  IonRippleEffect,
  IonSkeletonText,
  IonThumbnail,
} from '@ionic/react';
import { 
  restaurant, 
  cart, 
  clipboard, 
  settings,
  sunny,
  moon,
  cafe,
  pizza,
  fish,
  nutrition,
  cash,
  refresh,
  checkmarkCircle,
  closeCircle,
  time,
  flame,
  star
} from 'ionicons/icons';
import { menuService } from '../services/api';
import { saveMenu } from '../services/storage';
import ComprasTab from './ComprasTab';
import PreparacionTab from './PreparacionTab';
import ConfigTab from './ConfigTab';
import '../theme/custom.css';

const MenuDisplay = () => {
  const [selectedTab, setSelectedTab] = useState('menu');
  const [presupuesto, setPresupuesto] = useState('200');
  const [tipoComida, setTipoComida] = useState([]);
  const [categoria, setCategoria] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState(null);
  const [listaCompras, setListaCompras] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const tiposComidaOptions = [
    { value: 'criolla', label: '🍽️ Criolla', color: 'primary' },
    { value: 'marina', label: '🐟 Marina', color: 'secondary' },
    { value: 'china', label: '🥢 Chifa', color: 'tertiary' },
    { value: 'andina', label: '🏔️ Andina', color: 'success' },
    { value: 'selvatica', label: '🌿 Selvática', color: 'warning' },
  ];

  const getMomentoIcon = (momento) => {
    switch(momento) {
      case 'desayuno': return cafe;
      case 'almuerzo': return sunny;
      case 'cena': return moon;
      default: return restaurant;
    }
  };

  const getComponenteColor = (componente) => {
    switch(componente) {
      case 'bebida': return 'secondary';
      case 'entrada': return 'tertiary';
      case 'fondo': return 'success';
      case 'principal': return 'primary';
      default: return 'medium';
    }
  };

  const generarMenu = async () => {
    if (!presupuesto || presupuesto < 50) {
      setToastMessage('El presupuesto mínimo es S/ 50');
      setShowToast(true);
      return;
    }

    setLoading(true);
    
    try {
      const result = await menuService.generarMenu(
        parseFloat(presupuesto),
        tipoComida,
        categoria
      );
      
      if (result.success) {
        setMenu(result.menu);
        setListaCompras(result.listaCompras);
        saveMenu(result.menu, result.listaCompras, presupuesto);
        setToastMessage('¡Menú generado exitosamente! 🎉');
      } else {
        setToastMessage('Error al generar el menú');
      }
    } catch (error) {
      console.error('Error:', error);
      setToastMessage('Error de conexión. Verifica tu internet.');
    } finally {
      setLoading(false);
      setShowToast(true);
    }
  };

  const renderMenuTab = () => (
    <>
      {!menu ? (
        <div className="config-container">
          <IonCard className="gradient-card">
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={restaurant} /> Configurar Menú Semanal
              </IonCardTitle>
              <IonCardSubtitle>
                Personaliza tu menú según tus gustos y presupuesto
              </IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              {/* Presupuesto con visual mejorado */}
              <div className="presupuesto-section">
                <IonItem lines="none" className="presupuesto-item">
                  <IonIcon icon={cash} slot="start" color="success" />
                  <IonLabel>
                    <h2>Presupuesto Semanal</h2>
                    <p>Para 2 personas</p>
                  </IonLabel>
                  <div className="precio-tag" slot="end">
                    S/ {presupuesto}
                  </div>
                </IonItem>
                
                <IonProgressBar 
                  value={presupuesto / 600} 
                  color="success"
                  className="presupuesto-bar"
                />
                
                <IonItem lines="none">
                  <IonInput
                    type="range"
                    min="50"
                    max="600"
                    value={presupuesto}
                    onIonChange={e => setPresupuesto(e.detail.value)}
                  />
                </IonItem>
                
                <div className="presupuesto-info">
                  <IonChip color="primary">
                    <IonIcon icon={cafe} />
                    <IonLabel>Desayuno: S/ {Math.round(presupuesto * 0.20)}</IonLabel>
                  </IonChip>
                  <IonChip color="warning">
                    <IonIcon icon={sunny} />
                    <IonLabel>Almuerzo: S/ {Math.round(presupuesto * 0.45)}</IonLabel>
                  </IonChip>
                  <IonChip color="tertiary">
                    <IonIcon icon={moon} />
                    <IonLabel>Cena: S/ {Math.round(presupuesto * 0.35)}</IonLabel>
                  </IonChip>
                </div>
              </div>

              {/* Tipos de comida con chips visuales */}
              <div className="tipo-comida-section">
                <IonItem lines="none">
                  <IonIcon icon={restaurant} slot="start" color="primary" />
                  <IonLabel>
                    <h2>Tipos de Comida</h2>
                    <p>Selecciona tus preferencias</p>
                  </IonLabel>
                </IonItem>
                
                <div className="chips-container">
                  {tiposComidaOptions.map(tipo => (
                    <IonChip
                      key={tipo.value}
                      color={tipoComida.includes(tipo.value) ? tipo.color : 'medium'}
                      outline={!tipoComida.includes(tipo.value)}
                      onClick={() => {
                        setTipoComida(prev =>
                          prev.includes(tipo.value)
                            ? prev.filter(t => t !== tipo.value)
                            : [...prev, tipo.value]
                        );
                      }}
                      className="tipo-chip"
                    >
                      <IonLabel>{tipo.label}</IonLabel>
                      {tipoComida.includes(tipo.value) && (
                        <IonIcon icon={checkmarkCircle} />
                      )}
                    </IonChip>
                  ))}
                </div>
              </div>

              {/* Categoría dietética */}
              <IonItem lines="none" className="categoria-item">
                <IonIcon icon={nutrition} slot="start" color="success" />
                <IonLabel>
                  <h2>Preferencias Dietéticas</h2>
                </IonLabel>
                <IonCheckbox 
                  checked={categoria.includes('vegetariano')}
                  onIonChange={e => {
                    if (e.detail.checked) {
                      setCategoria([...categoria, 'vegetariano']);
                    } else {
                      setCategoria(categoria.filter(c => c !== 'vegetariano'));
                    }
                  }}
                  color="success"
                />
              </IonItem>

              <IonButton 
                expand="block" 
                onClick={generarMenu}
                className="generar-button"
                size="large"
              >
                <IonIcon slot="start" icon={restaurant} />
                Generar Menú Optimizado con IA
                <IonRippleEffect />
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      ) : (
        <div className="menu-generado">
          {/* Header con estadísticas */}
          <IonCard className="stats-card gradient-header">
            <IonCardContent>
              <div className="stats-grid">
                <div className="stat-item">
                  <IonIcon icon={cash} />
                  <h3>S/ {menu.presupuestoTotal || presupuesto}</h3>
                  <p>Presupuesto</p>
                </div>
                <div className="stat-item">
                  <IonIcon icon={flame} />
                  <h3>{Math.round(menu.caloriasPromedio || 2500)}</h3>
                  <p>Cal/día</p>
                </div>
                <div className="stat-item">
                  <IonIcon icon={restaurant} />
                  <h3>21</h3>
                  <p>Comidas</p>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Menú por días */}
          {Object.entries(menu).map(([dia, comidas]) => (
            <IonCard key={dia} className="dia-card">
              <IonCardHeader className="dia-header">
                <IonCardTitle>{dia}</IonCardTitle>
                <IonBadge color="primary">{Object.keys(comidas).length} comidas</IonBadge>
              </IonCardHeader>
              <IonCardContent>
                {Object.entries(comidas).map(([momento, platos]) => {
                  const hayPlatos = platos && Object.keys(platos).length > 0;
                  
                  return (
                    <div key={momento} className={`momento-section momento-${momento}`}>
                      <div className={`momento-header momento-${momento}`}>
                        <IonIcon icon={getMomentoIcon(momento)} />
                        <h3>{momento.charAt(0).toUpperCase() + momento.slice(1)}</h3>
                      </div>
                      
                      <IonList>
                        {!hayPlatos ? (
                          <IonItem lines="none" className="empty-state-item">
                            <IonLabel>
                              <p>Sin platos asignados</p>
                            </IonLabel>
                          </IonItem>
                        ) : (
                          Object.entries(platos).map(([tipo, plato]) => (
                            plato && (
                              <IonItem key={tipo} lines="none" className="plato-item">
                                <IonAvatar slot="start" className={`avatar-${tipo}`}>
                                  <IonIcon 
                                    icon={tipo === 'bebida' ? cafe : 
                                          tipo === 'entrada' ? pizza :
                                          tipo === 'fondo' ? fish : restaurant} 
                                  />
                                </IonAvatar>
                                <IonLabel>
                                  <h2>{plato.nombre}</h2>
                                  <p>
                                    <IonChip color={getComponenteColor(tipo)} className="tipo-chip-small">
                                      {tipo}
                                    </IonChip>
                                    <IonChip color="warning" className="tipo-chip-small">
                                      {plato.calorias} cal
                                    </IonChip>
                                  </p>
                                </IonLabel>
                                <div className="precio-tag" slot="end">
                                  S/ {plato.precio?.toFixed(2) || '0.00'}
                                </div>
                              </IonItem>
                            )
                          ))
                        )}
                      </IonList>
                    </div>
                  );
                })}
              </IonCardContent>
            </IonCard>
          ))}
          
          {/* Botón flotante para regenerar */}
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton 
              onClick={() => {
                setMenu(null);
                setListaCompras(null);
              }}
              color="primary"
            >
              <IonIcon icon={refresh} />
            </IonFabButton>
          </IonFab>
        </div>
      )}
    </>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="gradient-header">
          <IonTitle>🍽️ Menú Semanal AI</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={selectedTab} onIonChange={e => setSelectedTab(e.detail.value)}>
            <IonSegmentButton value="menu">
              <IonLabel>Menú</IonLabel>
              <IonIcon icon={restaurant} />
            </IonSegmentButton>
            <IonSegmentButton value="compras" disabled={!listaCompras}>
              <IonLabel>Compras</IonLabel>
              <IonIcon icon={cart} />
            </IonSegmentButton>
            <IonSegmentButton value="preparacion" disabled={!menu}>
              <IonLabel>Preparación</IonLabel>
              <IonIcon icon={clipboard} />
            </IonSegmentButton>
            <IonSegmentButton value="config">
              <IonLabel>Config</IonLabel>
              <IonIcon icon={settings} />
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding menu-content">
        {selectedTab === 'menu' && renderMenuTab()}
        {selectedTab === 'compras' && <ComprasTab listaCompras={listaCompras} />}
        {selectedTab === 'preparacion' && <PreparacionTab menu={menu} />}
        {selectedTab === 'config' && <ConfigTab />}
        
        <IonLoading
          isOpen={loading}
          message={'Optimizando tu menú con IA... 🤖'}
          cssClass="custom-loading"
        />
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
          cssClass="custom-toast"
          buttons={[
            {
              icon: checkmarkCircle,
              role: 'cancel',
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default MenuDisplay;