import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonList
} from '@ionic/react';
import { trash, download, informationCircle } from 'ionicons/icons';
import { clearMenuHistory } from '../services/storage';

const ConfigTab = () => {
  const handleClearHistory = () => {
    if (window.confirm('¿Estás seguro de borrar el historial?')) {
      clearMenuHistory();
      alert('Historial borrado');
    }
  };

  return (
    <>
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Configuración</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>
            <IonItem>
              <IonIcon icon={informationCircle} slot="start" />
              <IonLabel>
                <h2>Versión</h2>
                <p>1.0.0</p>
              </IonLabel>
            </IonItem>
            
            <IonItem>
              <IonIcon icon={download} slot="start" />
              <IonLabel>
                <h2>API Status</h2>
                <p>{process.env.REACT_APP_API_URL ? 'Configurada' : 'No configurada'}</p>
              </IonLabel>
            </IonItem>
          </IonList>

          <IonButton 
            expand="block" 
            color="danger" 
            onClick={handleClearHistory}
            className="ion-margin-top"
          >
            <IonIcon slot="start" icon={trash} />
            Borrar Historial
          </IonButton>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Acerca de</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p>
            Menú Semanal ML es una aplicación que utiliza Machine Learning 
            para generar menús semanales optimizados para 2 personas.
          </p>
          <p className="ion-margin-top">
            Desarrollado con React, Ionic y AWS.
          </p>
        </IonCardContent>
      </IonCard>
    </>
  );
};

export default ConfigTab;