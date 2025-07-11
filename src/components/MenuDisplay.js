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
} from '@ionic/react';
import { restaurant, cart, clipboard, settings } from 'ionicons/icons';
import { menuService } from '../services/api';
import { saveMenu } from '../services/storage';
import ComprasTab from './ComprasTab';
import PreparacionTab from './PreparacionTab';
import ConfigTab from './ConfigTab';

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
        
        // Guardar en storage local
        saveMenu(result.menu, result.listaCompras, presupuesto);
        
        setToastMessage('¡Menú generado exitosamente!');
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
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Configurar Menú Semanal</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Presupuesto Semanal (S/)</IonLabel>
              <IonInput
                type="number"
                value={presupuesto}
                onIonChange={e => setPresupuesto(e.detail.value)}
                placeholder="200"
              />
            </IonItem>

            <IonItem>
              <IonLabel>Tipo de Comida</IonLabel>
              <IonSelect 
                multiple={true} 
                value={tipoComida}
                onIonChange={e => setTipoComida(e.detail.value)}
              >
                <IonSelectOption value="criolla">Criolla</IonSelectOption>
                <IonSelectOption value="marina">Marina</IonSelectOption>
                <IonSelectOption value="china">Chifa</IonSelectOption>
                <IonSelectOption value="andina">Andina</IonSelectOption>
                <IonSelectOption value="selvatica">Selvática</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel>Categoría</IonLabel>
              <IonCheckbox 
                checked={categoria.includes('vegetariano')}
                onIonChange={e => {
                  if (e.detail.checked) {
                    setCategoria([...categoria, 'vegetariano']);
                  } else {
                    setCategoria(categoria.filter(c => c !== 'vegetariano'));
                  }
                }}
              />
              <IonLabel className="ion-margin-start">Solo Vegetariano</IonLabel>
            </IonItem>

            <IonButton 
              expand="block" 
              onClick={generarMenu}
              className="ion-margin-top"
            >
              <IonIcon slot="start" icon={restaurant} />
              Generar Menú Optimizado
            </IonButton>
          </IonCardContent>
        </IonCard>
      ) : (
        <div>
          {Object.entries(menu).map(([dia, comidas]) => (
            <IonCard key={dia}>
              <IonCardHeader>
                <IonCardTitle>{dia}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {Object.entries(comidas).map(([momento, platos]) => (
                  <div key={momento} className="momento-section">
                    <h3 className="momento-title">{momento.charAt(0).toUpperCase() + momento.slice(1)}</h3>
                    <IonList>
                      {Object.entries(platos).map(([tipo, plato]) => (
                        plato && (
                          <IonItem key={tipo}>
                            <IonLabel>
                              <h2>{plato.nombre}</h2>
                              <p>{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</p>
                            </IonLabel>
                            <IonBadge slot="end" color="primary">
                              S/ {plato.precio?.toFixed(2) || '0.00'}
                            </IonBadge>
                          </IonItem>
                        )
                      ))}
                    </IonList>
                  </div>
                ))}
              </IonCardContent>
            </IonCard>
          ))}
          
          <IonButton 
            expand="block" 
            onClick={() => {
              setMenu(null);
              setListaCompras(null);
            }}
            className="ion-margin"
            color="secondary"
          >
            Generar Nuevo Menú
          </IonButton>
        </div>
      )}
    </>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Menú Semanal ML</IonTitle>
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
      
      <IonContent className="ion-padding">
        {selectedTab === 'menu' && renderMenuTab()}
        {selectedTab === 'compras' && <ComprasTab listaCompras={listaCompras} />}
        {selectedTab === 'preparacion' && <PreparacionTab menu={menu} />}
        {selectedTab === 'config' && <ConfigTab />}
        
        <IonLoading
          isOpen={loading}
          message={'Optimizando menú con ML...'}
        />
        
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default MenuDisplay;