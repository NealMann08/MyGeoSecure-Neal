// frontend/src/App.tsx
import React, { useState, useEffect } from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import SignIn from './pages/SignIn';
import DriverHome from './pages/DriverHome';
import ProviderHome from './pages/ProviderHome';

setupIonicReact();

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/signin">
            <SignIn onSignIn={setUser} />
          </Route>
          <Route path="/driver">
            {user?.role === 'driver' ? <DriverHome user={user} /> : <Redirect to="/signin" />}
          </Route>
          <Route path="/provider">
            {user?.role === 'provider' ? <ProviderHome user={user} /> : <Redirect to="/signin" />}
          </Route>
          <Route exact path="/">
            <Redirect to="/signin" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;