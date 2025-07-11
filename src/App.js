import React from 'react';
import { IonApp, setupIonicReact } from '@ionic/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MenuDisplay from './components/MenuDisplay';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

setupIonicReact();

function App() {
  return (
    <IonApp>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MenuDisplay />} />
        </Routes>
      </BrowserRouter>
    </IonApp>
  );
}

export default App;