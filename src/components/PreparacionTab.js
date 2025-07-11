import React, { useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonText
} from '@ionic/react';

const PreparacionTab = ({ menu }) => {
  const [diaSeleccionado, setDiaSeleccionado] = useState('Lunes');
  const [momentoSeleccionado, setMomentoSeleccionado] = useState('almuerzo');

  if (!menu) {
    return (
      <IonCard>
        <IonCardContent>
          <p>Genera un menú primero para ver las preparaciones.</p>
        </IonCardContent>
      </IonCard>
    );
  }

  const dias = Object.keys(menu);
  const momentos = ['desayuno', 'almuerzo', 'cena'];

  const platosDelMomento = menu[diaSeleccionado]?.[momentoSeleccionado] || {};

  return (
    <>
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Guía de Preparación</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonItem>
            <IonLabel>Día</IonLabel>
            <IonSelect 
              value={diaSeleccionado} 
              onIonChange={e => setDiaSeleccionado(e.detail.value)}
            >
              {dias.map(dia => (
                <IonSelectOption key={dia} value={dia}>{dia}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel>Momento</IonLabel>
            <IonSelect 
              value={momentoSeleccionado} 
              onIonChange={e => setMomentoSeleccionado(e.detail.value)}
            >
              {momentos.map(momento => (
                <IonSelectOption key={momento} value={momento}>
                  {momento.charAt(0).toUpperCase() + momento.slice(1)}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        </IonCardContent>
      </IonCard>

      {Object.entries(platosDelMomento).map(([tipo, plato]) => (
        plato && plato.preparacion && (
          <IonCard key={tipo}>
            <IonCardHeader>
              <IonCardTitle>{plato.nombre}</IonCardTitle>
              <IonText color="medium">
                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </IonText>
            </IonCardHeader>
            <IonCardContent>
              <div className="preparacion-steps">
                {plato.preparacion.split(/\d+\./).filter(step => step.trim()).map((paso, index) => (
                  <div key={index} className="step">
                    <div className="step-number">{index + 1}</div>
                    <div className="step-content">{paso.trim()}</div>
                  </div>
                ))}
              </div>
            </IonCardContent>
          </IonCard>
        )
      ))}
    </>
  );
};

export default PreparacionTab;