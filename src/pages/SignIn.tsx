// frontend/src/pages/SignIn.tsx
import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonInput, IonSelect, IonSelectOption, IonLabel, IonToggle
} from '@ionic/react';
import { useHistory } from 'react-router-dom';

interface SignInProps {
  onSignIn: (user: any) => void;
}

const SignIn: React.FC<SignInProps> = ({ onSignIn }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('driver');
  const [isNewUser, setIsNewUser] = useState(true);
  const [error, setError] = useState('');
  const history = useHistory();

  const handleAuth = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    const userId = name.trim().toLowerCase().replace(/\s+/g, '-');

const res = await fetch(`https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/auth-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        name: name.trim(),
        role,
        mode: isNewUser ? 'signup' : 'signin'
      })
    });

    const data = await res.json();
    if (res.status !== 200) {
      setError(data.error || 'Something went wrong');
      return;
    }

    onSignIn({ userId, role });
    history.push(`/${role}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{isNewUser ? 'Sign Up' : 'Sign In'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonInput
          placeholder="Full Name"
          value={name}
          onIonChange={e => setName(e.detail.value!)}
        />
        <IonSelect value={role} onIonChange={e => setRole(e.detail.value)}>
          <IonSelectOption value="driver">Driver</IonSelectOption>
          <IonSelectOption value="provider">Service Provider</IonSelectOption>
        </IonSelect>

        <IonButton expand="block" onClick={handleAuth}>
          {isNewUser ? 'Create Account' : 'Log In'}
        </IonButton>

        <IonLabel className="ion-padding-top">
          {isNewUser ? 'Already have an account?' : 'New user?'}
        </IonLabel>
        <IonToggle checked={isNewUser} onIonChange={e => setIsNewUser(e.detail.checked)} />

        {error && <IonLabel color="danger">{error}</IonLabel>}
      </IonContent>
    </IonPage>
  );
};

export default SignIn;
