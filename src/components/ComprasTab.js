import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonList,
  IonBadge,
  IonIcon,
  IonChip
} from '@ionic/react';
import { checkmark } from 'ionicons/icons';

const ComprasTab = ({ listaCompras }) => {
  if (!listaCompras) {
    return (
      <IonCard>
        <IonCardContent>
          <p>Genera un menú primero para ver la lista de compras.</p>
        </IonCardContent>
      </IonCard>
    );
  }

  const categorias = listaCompras.categorias || {};
  const total = listaCompras.total || 0;

  return (
    <>
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Lista de Compras</IonCardTitle>
          <IonChip color="success">
            <IonLabel>Total: S/ {total.toFixed(2)}</IonLabel>
          </IonChip>
        </IonCardHeader>
      </IonCard>

      {Object.entries(categorias).map(([categoria, items]) => (
        <IonCard key={categoria}>
          <IonCardHeader>
            <IonCardTitle className="categoria-title">
              {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              {items.map((item, index) => (
                <IonItem key={index}>
                  <IonIcon icon={checkmark} slot="start" color="medium" />
                  <IonLabel>
                    <h2>{item.ingrediente}</h2>
                    <p>{item.cantidad} {item.unidad}</p>
                  </IonLabel>
                  <IonBadge slot="end">
                    S/ {item.subtotal.toFixed(2)}
                  </IonBadge>
                </IonItem>
              ))}
            </IonList>
          </IonCardContent>
        </IonCard>
      ))}
    </>
  );
};

export default ComprasTab;