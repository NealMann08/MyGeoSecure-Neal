// frontend/src/App.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact, IonToast } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import SignIn from './pages/SignIn';
import DriverHome from './pages/DriverHome';
import ProviderHome from './pages/ProviderHome';

// Import Ionic CSS
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

setupIonicReact();

interface User {
  userId: string;
  name: string;
  role: 'driver' | 'provider';
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on app start
  useEffect(() => {
    console.log('App: Loading saved user...');
    const savedUser = localStorage.getItem('privacyDriveUser');
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('App: Found saved user:', parsedUser);
        
        // Validate user object has required fields
        if (parsedUser.userId && parsedUser.name && parsedUser.role) {
          setUser(parsedUser);
          console.log('App: User loaded successfully');
        } else {
          console.log('App: Invalid user data, clearing localStorage');
          localStorage.removeItem('privacyDriveUser');
        }
      } catch (error) {
        console.error('App: Error parsing saved user:', error);
        localStorage.removeItem('privacyDriveUser');
      }
    } else {
      console.log('App: No saved user found');
    }
    
    setIsLoading(false);
  }, []);

  const handleSignIn = (newUser: User) => {
    console.log('App: Sign in with user:', newUser);
    
    // Validate user object
    if (!newUser.userId || !newUser.name || !newUser.role) {
      console.error('App: Invalid user object received:', newUser);
      setToastMessage('Sign in failed: Invalid user data');
      setShowToast(true);
      return;
    }
    
    setUser(newUser);
    localStorage.setItem('privacyDriveUser', JSON.stringify(newUser));
    setToastMessage(`Welcome, ${newUser.name}!`);
    setShowToast(true);
    console.log('App: User signed in and saved');
  };

  const handleSignOut = () => {
    console.log('App: Signing out user');
    setUser(null);
    localStorage.removeItem('privacyDriveUser');
    setToastMessage('Signed out successfully');
    setShowToast(true);
  };

  // Show loading while checking for saved user
  if (isLoading) {
    return (
      <IonApp>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          Loading...
        </div>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/signin">
            {user ? (
              <Redirect to={`/${user.role}`} />
            ) : (
              <SignIn onSignIn={handleSignIn} />
            )}
          </Route>
          
          <Route path="/driver">
            {user?.role === 'driver' ? (
              <DriverHome user={user} onSignOut={handleSignOut} />
            ) : (
              <Redirect to="/signin" />
            )}
          </Route>
          
          <Route path="/provider">
            {user?.role === 'provider' ? (
              <ProviderHome user={user} onSignOut={handleSignOut} />
            ) : (
              <Redirect to="/signin" />
            )}
          </Route>
          
          <Route exact path="/">
            {user ? (
              <Redirect to={`/${user.role}`} />
            ) : (
              <Redirect to="/signin" />
            )}
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="top"
      />
    </IonApp>
  );
};

export default App;