import React, { useState, useRef } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonText
} from '@ionic/react';

const DriverHome: React.FC<{ user: any }> = ({ user }) => {
  const [tracking, setTracking] = useState(false);
  const [lastLat, setLastLat] = useState<number | null>(null);
  const [lastLong, setLastLong] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);  // ✅ this is the fix

  const toggleTracking = () => {
    if (!tracking) {
      // Start tracking
      watchIdRef.current = navigator.geolocation.watchPosition(position => {
        const { latitude, longitude } = position.coords;

        if (lastLat !== null && lastLong !== null) {
          const deltaLat = latitude - lastLat;
          const deltaLong = longitude - lastLong;

          console.log('∆lat, ∆long:', deltaLat, deltaLong);

          fetch('https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/store-coordinates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.userId,
              delta_lat: deltaLat,
              delta_long: deltaLong,
              timestamp: new Date().toISOString()
            })
          });
        }

        setLastLat(latitude);
        setLastLong(longitude);
      });
    } else {
      // Stop tracking
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    }

    setTracking(!tracking);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Welcome, {user.name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText>Press the button below to toggle tracking.</IonText>
        <IonButton expand="block" onClick={toggleTracking} color={tracking ? 'danger' : 'primary'}>
          {tracking ? 'Stop Tracking' : 'Start Tracking'}
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default DriverHome;
