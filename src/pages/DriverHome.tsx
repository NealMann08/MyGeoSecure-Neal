// frontend/src/pages/DriverHome.tsx - ENHANCED WITH SIGN OUT
import React, { useState, useRef, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonText, IonAlert, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonProgressBar, IonLabel,
  IonButtons, IonIcon
} from '@ionic/react';
import { logOutOutline } from 'ionicons/icons';

interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface DriverHomeProps {
  user: any;
  onSignOut?: () => void;
}

const DriverHome: React.FC<DriverHomeProps> = ({ user, onSignOut }) => {
  const [tracking, setTracking] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<string | null>(null);
  const [locationQueue, setLocationQueue] = useState<LocationPoint[]>([]);
  const [error, setError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [batchCount, setBatchCount] = useState(0);
  
  const watchIdRef = useRef<number | null>(null);
  const TRAJECTORY_LENGTH = 25;
  const FIXED_POINT_MULTIPLIER = 1000000;

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const isValidCoordinate = (value: number): boolean => {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  };

  const generateTripId = (): string => {
    return `trip_${user.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const calculateDeltas = (queue: LocationPoint[]): any[] => {
    if (queue.length < 2) return [];
    
    const deltas = [];
    for (let i = 1; i < queue.length; i++) {
      const prev = queue[i - 1];
      const curr = queue[i];
      
      const deltaLat = Math.round((curr.latitude - prev.latitude) * FIXED_POINT_MULTIPLIER);
      const deltaLong = Math.round((curr.longitude - prev.longitude) * FIXED_POINT_MULTIPLIER);
      const deltaTime = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
      
      deltas.push({
        delta_lat: deltaLat,
        delta_long: deltaLong,
        delta_time: deltaTime,
        timestamp: curr.timestamp,
        sequence: i - 1
      });
    }
    
    return deltas;
  };

  const uploadBatch = async (queue: LocationPoint[], tripId: string, batchNumber: number) => {
    try {
      setUploading(true);
      const deltas = calculateDeltas(queue);
      
      if (deltas.length === 0) {
        console.log('No deltas to upload');
        return;
      }

      const payload = {
        user_id: user.userId,
        trip_id: tripId,
        batch_number: batchNumber,
        batch_size: queue.length,
        first_point_timestamp: queue[0].timestamp,
        last_point_timestamp: queue[queue.length - 1].timestamp,
        deltas: deltas
      };

      console.log('Uploading batch:', payload);

      const response = await fetch('https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/store-trajectory-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Batch uploaded successfully:', result);
      
    } catch (err) {
      console.error('Failed to upload batch:', err);
      setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const finalizeTripOnServer = async (tripId: string) => {
    try {
      const response = await fetch('https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/finalize-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.userId,
          trip_id: tripId,
          end_timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to finalize trip: ${response.status}`);
      }

      console.log('Trip finalized successfully');
    } catch (err) {
      console.error('Failed to finalize trip:', err);
    }
  };

  const processLocationUpdate = async (position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;

    if (!isValidCoordinate(latitude) || !isValidCoordinate(longitude)) {
      console.error('Invalid coordinates received:', latitude, longitude);
      return;
    }

    const newPoint: LocationPoint = {
      latitude,
      longitude,
      timestamp: new Date().toISOString()
    };

    setLocationQueue(prevQueue => {
      const updatedQueue = [...prevQueue, newPoint];
      
      if (updatedQueue.length >= TRAJECTORY_LENGTH) {
        const batchToUpload = updatedQueue.slice(0, TRAJECTORY_LENGTH);
        const remainingQueue = updatedQueue.slice(TRAJECTORY_LENGTH);
        
        if (currentTrip) {
          uploadBatch(batchToUpload, currentTrip, batchCount + 1);
          setBatchCount(prev => prev + 1);
        }
        
        return remainingQueue;
      }
      
      return updatedQueue;
    });

    setError('');
  };

  const toggleTracking = async () => {
    if (!tracking) {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by this device');
        return;
      }
      

      const tripId = generateTripId();
      setCurrentTrip(tripId);
      setLocationQueue([]);
      setBatchCount(0);

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        processLocationUpdate,
        (error) => {
          console.error('Geolocation error:', error);
          setError(`Location error: ${error.message}`);
          setShowAlert(true);
        },
        options
      );

      console.log('Started tracking with trip ID:', tripId);
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if (locationQueue.length > 1 && currentTrip) {
        await uploadBatch(locationQueue, currentTrip, batchCount + 1);
        await finalizeTripOnServer(currentTrip);
      }

      setLocationQueue([]);
      setCurrentTrip(null);
      setBatchCount(0);
      setError('');
      console.log('Stopped tracking');
    }

    setTracking(!tracking);
  };

  const handleSignOut = () => {
    // Stop tracking if active
    if (tracking) {
      toggleTracking();
    }
    
    // Clear localStorage and call parent sign out
    localStorage.removeItem('privacyDriveUser');
    if (onSignOut) {
      onSignOut();
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Welcome, {user?.name || 'Driver'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSignOut}>
              <IonIcon icon={logOutOutline} />
              Sign Out
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText>
          <h2>Privacy-Protected Trip Tracking</h2>
          <p>Your exact location is never stored. Only encrypted movement patterns are transmitted.</p>
        </IonText>
        
        {error && (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        )}
        
        {tracking && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle color="success">Tracking Active</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p><strong>Trip ID:</strong> {currentTrip}</p>
              <p><strong>Points in Queue:</strong> {locationQueue.length}/{TRAJECTORY_LENGTH}</p>
              <p><strong>Batches Uploaded:</strong> {batchCount}</p>
              {uploading && (
                <>
                  <IonLabel>Uploading batch...</IonLabel>
                  <IonProgressBar type="indeterminate"></IonProgressBar>
                </>
              )}
            </IonCardContent>
          </IonCard>
        )}
        
        <IonButton
          expand="block"
          onClick={toggleTracking}
          color={tracking ? 'danger' : 'primary'}
          disabled={uploading}
        >
          {tracking ? 'Stop Tracking' : 'Start Tracking'}
        </IonButton>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Location Error"
          message={error}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default DriverHome;

