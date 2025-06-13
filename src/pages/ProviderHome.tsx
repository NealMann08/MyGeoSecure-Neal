// // frontend/src/pages/ProviderHome.tsx
// import React, { useState } from 'react';
// import {
//   IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
//   IonInput, IonButton, IonLabel, IonText, IonCard, IonCardHeader, IonCardTitle, IonCardContent
// } from '@ionic/react';

// const ProviderHome: React.FC<{ user: any }> = ({ user }) => {
//   const [searchId, setSearchId] = useState('');
//   const [result, setResult] = useState<any>(null);
//   const [error, setError] = useState('');

//   const handleProcess = async () => {
//     try {
//       setError('');
//       setResult(null);
//       const res = await fetch(`https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/process-trip`);
//       const data = await res.json();

//       if (res.status !== 200) {
//         setError(data.error || 'Failed to process trip');
//       } else {
//         setResult(data);
//       }
//     } catch (err) {
//       setError('Something went wrong.');
//     }
//   };

//   return (
//     <IonPage>
//       <IonHeader>
//         <IonToolbar>
//           <IonTitle>Provider Dashboard</IonTitle>
//         </IonToolbar>
//       </IonHeader>
//       <IonContent className="ion-padding">
//         <IonLabel>Enter Driver ID to analyze:</IonLabel>
//         <IonInput
//           placeholder="driver-user-id"
//           value={searchId}
//           onIonChange={e => setSearchId(e.detail.value!)}
//         />

//         <IonButton expand="block" onClick={handleProcess} disabled={!searchId}>
//           Process Trip
//         </IonButton>

//         {error && <IonText color="danger">{error}</IonText>}

//         {result && (
//           <IonCard>
//             <IonCardHeader>
//               <IonCardTitle>Trip Summary</IonCardTitle>
//             </IonCardHeader>
//             <IonCardContent>
//               <p><strong>Distance:</strong> {result.distance_km.toFixed(2)} km</p>
//               <p><strong>Sharp Turns:</strong> {result.sharp_turns}</p>
//               <p><strong>Behavior:</strong> {result.behavior}</p>
//             </IonCardContent>
//           </IonCard>
//         )}
//       </IonContent>
//     </IonPage>
//   );
// };

// export default ProviderHome;
// frontend/src/pages/ProviderHome.tsx
import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonInput, IonButton, IonLabel, IonText, IonCard, IonCardHeader, IonCardTitle, IonCardContent
} from '@ionic/react';

const ProviderHome: React.FC<{ user: any }> = ({ user }) => {
  const [searchId, setSearchId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleProcess = async () => {
    try {
      setError('');
      setResult(null);
      
      // Include the searchId as a query parameter
      const res = await fetch(`https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/process-trip?user_id=${encodeURIComponent(searchId)}`);
      const data = await res.json();

      if (res.status !== 200) {
        setError(data.error || 'Failed to process trip');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Something went wrong.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Provider Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonLabel>Enter Driver ID to analyze:</IonLabel>
        <IonInput
          placeholder="driver-user-id"
          value={searchId}
          onIonChange={e => setSearchId(e.detail.value!)}
        />

        <IonButton expand="block" onClick={handleProcess} disabled={!searchId}>
          Process Trip
        </IonButton>

        {error && <IonText color="danger">{error}</IonText>}

        {result && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Trip Summary</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p><strong>Distance:</strong> {result.distance_km.toFixed(2)} km</p>
              <p><strong>Sharp Turns:</strong> {result.sharp_turns}</p>
              <p><strong>Behavior:</strong> {result.behavior}</p>
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ProviderHome;