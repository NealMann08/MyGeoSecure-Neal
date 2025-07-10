// // Production-Ready DriverHome.tsx for Real Driving Tests
// // Remove test mode entirely and optimize for real GPS tracking

// import React, { useState, useRef, useEffect } from 'react';
// import {
//   IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
//   IonButton, IonText, IonAlert, IonCard, IonCardContent,
//   IonCardHeader, IonCardTitle, IonProgressBar, IonLabel,
//   IonButtons, IonIcon, IonBadge, IonChip, IonItem, IonList,
//   IonItemDivider, IonModal, IonRange, IonSelect, IonSelectOption,
//   IonInput, useIonToast
// } from '@ionic/react';
// import {
//   logOutOutline, shieldCheckmarkOutline, settingsOutline,
//   locationOutline, lockClosedOutline, alertCircleOutline,
//   speedometerOutline, timeOutline
// } from 'ionicons/icons';

// import {
//   validateGPSPoint,
//   getUserBasePoint,
//   getAnonymizedBasePoint,
//   calculateUserSpecificDeltas,
//   type EnhancedLocationPoint,
//   type UserBasePoint
// } from './EnhancedGPSProcessing';

// import {
//   getCityCoordinatesFromZipcode,
//   validateZipcode,
//   getGeocodeStats,
//   type CityCoordinates
// } from '../utils/geocoding';

// interface DriverHomeProps {
//   user: any;
//   onSignOut?: () => void;
// }

// interface TripQualityMetrics {
//   totalPoints: number;
//   validPoints: number;
//   rejectedPoints: number;
//   averageAccuracy: number;
//   speedDataQuality: number;
//   stationaryPeriods: number;
//   tripStartTime: string;
//   currentSpeed: number;
//   maxSpeed: number;
//   avgSpeed: number;
// }

// interface PrivacySettings {
//   anonymizationRadius: number;
//   dataRetentionPeriod: number;
//   consentLevel: 'full' | 'basic' | 'minimal';
// }

// const DriverHome: React.FC<DriverHomeProps> = ({ user, onSignOut }) => {
//   const [tracking, setTracking] = useState(false);
//   const [currentTrip, setCurrentTrip] = useState<string | null>(null);
//   const [locationQueue, setLocationQueue] = useState<EnhancedLocationPoint[]>([]);
//   const [error, setError] = useState('');
//   const [showAlert, setShowAlert] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [batchCount, setBatchCount] = useState(0);
//   const [tripQuality, setTripQuality] = useState<TripQualityMetrics>({
//     totalPoints: 0,
//     validPoints: 0,
//     rejectedPoints: 0,
//     averageAccuracy: 0,
//     speedDataQuality: 0,
//     stationaryPeriods: 0,
//     tripStartTime: '',
//     currentSpeed: 0,
//     maxSpeed: 0,
//     avgSpeed: 0
//   });
 
//   // Privacy Controls
//   const [showPrivacyModal, setShowPrivacyModal] = useState(false);
//   const [basePoint, setBasePoint] = useState<UserBasePoint | null>(null);
//   const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
//     anonymizationRadius: 10,
//     dataRetentionPeriod: 12,
//     consentLevel: 'full'
//   });
//   const [updatingPrivacy, setUpdatingPrivacy] = useState(false);

//   // Zipcode Management States
//   const [editingZipcode, setEditingZipcode] = useState(false);
//   const [newZipcode, setNewZipcode] = useState('');
//   const [newZipcodeValid, setNewZipcodeValid] = useState<boolean | null>(null);
//   const [geocodingNewZipcode, setGeocodingNewZipcode] = useState(false);
//   const [newBasePoint, setNewBasePoint] = useState<CityCoordinates | null>(null);

//   const [present] = useIonToast();
//   const watchIdRef = useRef<number | null>(null);
//   const TRAJECTORY_LENGTH = 25;

//   useEffect(() => {
//     loadUserPrivacySettings();
   
//     return () => {
//       if (watchIdRef.current !== null) {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//       }
//     };
//   }, []);

//   // Validate new zipcode in real-time
//   useEffect(() => {
//     if (newZipcode.trim() && editingZipcode) {
//       const isValid = validateZipcode(newZipcode);
//       setNewZipcodeValid(isValid);
     
//       if (isValid) {
//         const timer = setTimeout(async () => {
//           await performNewZipcodeGeocoding(newZipcode);
//         }, 1000);
       
//         return () => clearTimeout(timer);
//       } else {
//         setNewBasePoint(null);
//       }
//     } else {
//       setNewZipcodeValid(null);
//       setNewBasePoint(null);
//     }
//   }, [newZipcode, editingZipcode]);

//   const loadUserPrivacySettings = () => {
//     try {
//       const userBasePoint = getUserBasePoint();
//       setBasePoint(userBasePoint);
     
//       if (user.privacySettings) {
//         setPrivacySettings(user.privacySettings);
//       }
     
//       console.log('🔒 Loaded user privacy settings:', {
//         basePoint: userBasePoint,
//         privacySettings: user.privacySettings
//       });
//     } catch (error) {
//       console.error('Error loading privacy settings:', error);
//     }
//   };

//   const performNewZipcodeGeocoding = async (zipcode: string) => {
//     if (geocodingNewZipcode) return;
   
//     setGeocodingNewZipcode(true);
//     try {
//       const coordinates = await getCityCoordinatesFromZipcode(zipcode);
//       setNewBasePoint(coordinates);
//       console.log('🎯 New base point geocoded:', coordinates);
//     } catch (error) {
//       console.error('New zipcode geocoding error:', error);
//       setError('Unable to locate city center for new zipcode. Please try a different zipcode.');
//     } finally {
//       setGeocodingNewZipcode(false);
//     }
//   };

//   const startEditingZipcode = () => {
//     setEditingZipcode(true);
//     setNewZipcode(user.zipcode || '');
//     setNewZipcodeValid(null);
//     setNewBasePoint(null);
//     setError('');
//   };

//   const cancelEditingZipcode = () => {
//     setEditingZipcode(false);
//     setNewZipcode('');
//     setNewZipcodeValid(null);
//     setNewBasePoint(null);
//     setError('');
//   };

//   const updateZipcodeAndPrivacy = async () => {
//     if (!newBasePoint || !newZipcode.trim()) {
//       setError('Please enter a valid zipcode first');
//       return;
//     }

//     setUpdatingPrivacy(true);
//     try {
//       const response = await fetch('https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/update-user-zipcode', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           user_id: user.userId,
//           zipcode: newZipcode.trim(),
//           base_point: {
//             latitude: newBasePoint.latitude,
//             longitude: newBasePoint.longitude,
//             city: newBasePoint.city,
//             state: newBasePoint.state,
//             source: newBasePoint.source,
//             zipcode: newBasePoint.zipcode
//           },
//           privacy_settings: {
//             anonymizationRadius: privacySettings.anonymizationRadius,
//             dataRetentionPeriod: privacySettings.dataRetentionPeriod,
//             consentLevel: privacySettings.consentLevel
//           }
//         })
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to update zipcode');
//       }

//       const userData = JSON.parse(localStorage.getItem('privacyDriveUser') || '{}');
//       userData.zipcode = newZipcode.trim();
//       userData.basePoint = {
//         latitude: newBasePoint.latitude,
//         longitude: newBasePoint.longitude,
//         city: newBasePoint.city,
//         state: newBasePoint.state,
//         source: newBasePoint.source,
//         zipcode: newBasePoint.zipcode,
//         anonymizationRadius: privacySettings.anonymizationRadius
//       };
//       userData.privacySettings = privacySettings;
     
//       localStorage.setItem('privacyDriveUser', JSON.stringify(userData));
//       window.dispatchEvent(new CustomEvent('userDataUpdated'));
     
//       loadUserPrivacySettings();
     
//       console.log('✅ Zipcode updated successfully:', newBasePoint);
//       setEditingZipcode(false);
//       setNewZipcode('');
//       setNewBasePoint(null);
//       setError('');
     
//     } catch (error) {
//       console.error('Error updating zipcode:', error);
//       setError(error instanceof Error ? error.message : 'Failed to update zipcode');
//     } finally {
//       setUpdatingPrivacy(false);
//     }
//   };

//   const generateTripId = (): string => {
//     return `trip_${user.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//   };

//   const calculateEnhancedDeltas = (queue: EnhancedLocationPoint[]): any[] => {
//     if (queue.length < 2) return [];
//     return calculateUserSpecificDeltas(queue);
//   };

//   const uploadBatch = async (queue: EnhancedLocationPoint[], tripId: string, batchNumber: number) => {
//     try {
//       setUploading(true);
//       console.log(`🚀 Starting real driving batch upload for trip: ${tripId}, batch: ${batchNumber}`);
     
//       const deltas = calculateEnhancedDeltas(queue);

//       if (deltas.length === 0) {
//         console.log('❌ No deltas to upload');
//         return;
//       }

//       const validPoints = queue.filter(p => p.isValid).length;
//       const avgAccuracy = queue.reduce((sum, p) => sum + (p.accuracy || 0), 0) / queue.length;
//       const speedQuality = deltas.filter(d => d.speed_confidence > 0.6).length / deltas.length;
//       const currentBasePoint = getAnonymizedBasePoint();

//       const payload = {
//         user_id: user.userId,
//         trip_id: tripId,
//         batch_number: batchNumber,
//         batch_size: queue.length,
//         first_point_timestamp: queue[0].timestamp,
//         last_point_timestamp: queue[queue.length - 1].timestamp,
//         deltas: deltas,
//         quality_metrics: {
//           valid_points: validPoints,
//           rejected_points: queue.length - validPoints,
//           average_accuracy: Math.round(avgAccuracy * 100) / 100,
//           speed_data_quality: Math.round(speedQuality * 100) / 100,
//           gps_quality_score: Math.min(1, validPoints / queue.length),
//           base_point_source: currentBasePoint.source,
//           anonymization_applied: currentBasePoint.anonymizationRadius ? true : false,
//           privacy_radius_miles: currentBasePoint.anonymizationRadius || 0,
//           privacy_level: user.privacySettings?.consentLevel || 'full'
//         }
//       };

//       console.log('📤 Uploading real driving batch with privacy protection:', {
//         tripId,
//         batchNumber,
//         queueSize: queue.length,
//         deltasCount: deltas.length,
//         privacyRadius: currentBasePoint.anonymizationRadius,
//         basePointSource: currentBasePoint.source
//       });

//       const response = await fetch('https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/store-trajectory-batch', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//       }

//       const result = await response.json();
//       console.log('✅ Real driving batch uploaded with privacy protection:', result);

//     } catch (err) {
//       console.error('❌ Failed to upload batch:', err);
//       setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
//     } finally {
//       setUploading(false);
//     }
//   };

//   const finalizeTripOnServer = async (tripId: string) => {
//     try {
//       console.log(`🏁 Finalizing real trip: ${tripId}`);
     
//       const response = await fetch('https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/finalize-trip', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           user_id: user.userId,
//           trip_id: tripId,
//           end_timestamp: new Date().toISOString(),
//           trip_quality: {
//             ...tripQuality,
//             privacy_protected: basePoint?.source !== 'fallback',
//             base_point_city: basePoint?.city,
//             anonymization_radius: basePoint?.anonymizationRadius
//           }
//         })
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to finalize trip: ${response.status}`);
//       }

//       console.log('✅ Real trip finalized successfully with privacy metadata');
//     } catch (err) {
//       console.error('❌ Failed to finalize trip:', err);
//     }
//   };

//   const processLocationUpdate = async (position: GeolocationPosition) => {
//     const latitude = position.coords.latitude;
//     const longitude = position.coords.longitude;
//     const accuracy = position.coords.accuracy || 0;
//     const speed = position.coords.speed || undefined;

//     const newPoint: EnhancedLocationPoint = {
//       latitude,
//       longitude,
//       timestamp: new Date().toISOString(),
//       accuracy,
//       speed: speed || undefined,
//       speedAccuracy: (position.coords as any).speedAccuracy || undefined
//     };

//     // Validate GPS point quality for real driving
//     const lastValidPoint = locationQueue.length > 0 ? locationQueue[locationQueue.length - 1] : undefined;
//     const isValid = validateGPSPoint(newPoint, lastValidPoint);
//     newPoint.isValid = isValid;

//     console.log('📍 Real GPS point received:', {
//       isValid,
//       lat: newPoint.latitude.toFixed(6),
//       lon: newPoint.longitude.toFixed(6),
//       accuracy: accuracy.toFixed(1) + 'm',
//       speed: speed ? (speed * 2.237).toFixed(1) + ' mph' : 'no speed',
//       basePointCity: basePoint?.city,
//       privacyRadius: basePoint?.anonymizationRadius
//     });

//     // Update trip quality metrics
//     setTripQuality(prev => {
//       const currentSpeedMph = speed ? speed * 2.237 : 0;
//       const newMetrics = {
//         ...prev,
//         totalPoints: prev.totalPoints + 1,
//         validPoints: prev.validPoints + (isValid ? 1 : 0),
//         rejectedPoints: prev.rejectedPoints + (isValid ? 0 : 1),
//         averageAccuracy: ((prev.averageAccuracy * prev.totalPoints) + (accuracy || 0)) / (prev.totalPoints + 1),
//         currentSpeed: currentSpeedMph,
//         maxSpeed: Math.max(prev.maxSpeed, currentSpeedMph),
//         avgSpeed: prev.totalPoints > 0 ? 
//           ((prev.avgSpeed * (prev.totalPoints - 1)) + currentSpeedMph) / prev.totalPoints : 
//           currentSpeedMph
//       };
//       return newMetrics;
//     });

//     if (!isValid) {
//       console.log('❌ GPS point rejected due to quality issues');
//       return;
//     }

//     setLocationQueue(prevQueue => {
//       const updatedQueue = [...prevQueue, newPoint];
//       console.log(`📊 Real driving queue length: ${updatedQueue.length}`);

//       if (updatedQueue.length >= TRAJECTORY_LENGTH) {
//         const batchToUpload = updatedQueue.slice(0, TRAJECTORY_LENGTH);
//         const remainingQueue = updatedQueue.slice(TRAJECTORY_LENGTH);

//         if (currentTrip) {
//           console.log(`🚀 Auto-uploading real driving batch for trip: ${currentTrip}`);
//           uploadBatch(batchToUpload, currentTrip, batchCount + 1);
//           setBatchCount(prev => prev + 1);
//         }

//         return remainingQueue;
//       }

//       return updatedQueue;
//     });

//     setError('');
//   };

//   const toggleTracking = async () => {
//     if (!tracking) {
//       if (!navigator.geolocation) {
//         setError('Geolocation is not supported by this device');
//         return;
//       }

//       const tripId = generateTripId();
//       console.log('🎯 Generated real trip ID:', tripId);
//       console.log(`🔒 Using privacy base point: ${basePoint?.city}, ${basePoint?.state}`);
     
//       setCurrentTrip(tripId);
//       setLocationQueue([]);
//       setBatchCount(0);
//       setTripQuality({
//         totalPoints: 0,
//         validPoints: 0,
//         rejectedPoints: 0,
//         averageAccuracy: 0,
//         speedDataQuality: 0,
//         stationaryPeriods: 0,
//         tripStartTime: new Date().toISOString(),
//         currentSpeed: 0,
//         maxSpeed: 0,
//         avgSpeed: 0
//       });

//       // PRODUCTION GPS OPTIONS - Optimized for real driving
//       const options = {
//         enableHighAccuracy: true,
//         timeout: 15000,        // 15 second timeout
//         maximumAge: 2000       // Use GPS readings up to 2 seconds old
//       };

//       watchIdRef.current = navigator.geolocation.watchPosition(
//         processLocationUpdate,
//         (error) => {
//           console.error('Real GPS error:', error);
//           setError(`GPS error: ${error.message}`);
//           setShowAlert(true);
//         },
//         options
//       );

//       console.log('🚗 Started REAL DRIVING tracking with privacy protection, trip ID:', tripId);
//       present({
//         message: 'GPS tracking started! Drive safely.',
//         duration: 2000,
//         color: 'success'
//       });
//     } else {
//       if (watchIdRef.current !== null) {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//         watchIdRef.current = null;
//       }

//       if (locationQueue.length > 1 && currentTrip) {
//         console.log('🏁 Uploading final real driving batch before stopping...');
//         await uploadBatch(locationQueue, currentTrip, batchCount + 1);
//         await finalizeTripOnServer(currentTrip);
//       }

//       setLocationQueue([]);
//       setCurrentTrip(null);
//       setBatchCount(0);
//       setError('');
//       console.log('🛑 Stopped real driving tracking');
      
//       present({
//         message: 'Trip completed! Check your driving analysis.',
//         duration: 3000,
//         color: 'primary'
//       });
//     }

//     setTracking(!tracking);
//   };

//   const handleSignOut = () => {
//     if (tracking) {
//       toggleTracking();
//     }
//     localStorage.removeItem('privacyDriveUser');
//     if (onSignOut) {
//       onSignOut();
//     }
//   };

//   const getQualityColor = (percentage: number): string => {
//     if (percentage >= 0.8) return 'success';
//     if (percentage >= 0.6) return 'warning';
//     return 'danger';
//   };

//   const getDataQualityScore = (): number => {
//     if (tripQuality.totalPoints === 0) return 1;
//     return tripQuality.validPoints / tripQuality.totalPoints;
//   };

//   const getPrivacyStatusColor = (): string => {
//     if (!basePoint) return 'medium';
//     if (basePoint.source === 'fallback') return 'warning';
//     return 'success';
//   };

//   const updatePrivacySettings = async () => {
//     setUpdatingPrivacy(true);
//     try {
//       const userData = JSON.parse(localStorage.getItem('privacyDriveUser') || '{}');
//       userData.privacySettings = privacySettings;
     
//       if (basePoint && basePoint.source !== 'fallback') {
//         userData.basePoint = {
//           ...basePoint,
//           anonymizationRadius: privacySettings.anonymizationRadius
//         };
//       }
     
//       localStorage.setItem('privacyDriveUser', JSON.stringify(userData));
//       loadUserPrivacySettings();
     
//       console.log('✅ Privacy settings updated:', privacySettings);
//       setShowPrivacyModal(false);
//     } catch (error) {
//       console.error('Error updating privacy settings:', error);
//       setError('Failed to update privacy settings');
//     } finally {
//       setUpdatingPrivacy(false);
//     }
//   };

//   const getTripDuration = (): string => {
//     if (!tripQuality.tripStartTime) return '0:00';
    
//     const start = new Date(tripQuality.tripStartTime);
//     const now = new Date();
//     const diffMs = now.getTime() - start.getTime();
//     const diffMinutes = Math.floor(diffMs / 60000);
//     const diffSeconds = Math.floor((diffMs % 60000) / 1000);
    
//     return `${diffMinutes}:${diffSeconds.toString().padStart(2, '0')}`;
//   };

//   const geocodeStats = getGeocodeStats();

//   return (
//     <IonPage>
//       <IonHeader>
//         <IonToolbar>
//           <IonTitle>Real Driving Test - {user?.name || 'Driver'}</IonTitle>
//           <IonButtons slot="end">
//             <IonButton onClick={() => setShowPrivacyModal(true)}>
//               <IonIcon icon={settingsOutline} />
//             </IonButton>
//             <IonButton onClick={handleSignOut}>
//               <IonIcon icon={logOutOutline} />
//               Sign Out
//             </IonButton>
//           </IonButtons>
//         </IonToolbar>
//       </IonHeader>

//       <IonContent className="ion-padding">
//         <IonText>
//           <h2>🚗 Real Driving Analysis</h2>
//           <p>Test your driving with real GPS data. Your exact location is never stored - only encrypted movement patterns.</p>
//         </IonText>

//         {error && (
//           <IonText color="danger">
//             <p>{error}</p>
//           </IonText>
//         )}

//         {/* Privacy Status Card */}
//         <IonCard>
//           <IonCardHeader>
//             <IonCardTitle>
//               <IonIcon icon={shieldCheckmarkOutline} style={{marginRight: '8px'}} />
//               Privacy Protection Status
//               <IonChip color={getPrivacyStatusColor()} style={{marginLeft: '10px'}}>
//                 {basePoint?.source === 'fallback' ? 'Basic' : 'Enhanced'}
//               </IonChip>
//             </IonCardTitle>
//           </IonCardHeader>
//           <IonCardContent>
//             {basePoint && (
//               <>
//                 <IonItem>
//                   <IonIcon icon={locationOutline} slot="start" />
//                   <IonLabel>
//                     <h3>Anonymization Center</h3>
//                     <p>{basePoint.city}, {basePoint.state}</p>
//                     <p style={{fontSize: '0.8em', color: 'var(--ion-color-medium)'}}>
//                       Source: {basePoint.source === 'zippopotam' ? 'Zippopotam API' :
//                                basePoint.source === 'cache' ? 'Cached' : 'Fallback'}
//                     </p>
//                   </IonLabel>
//                 </IonItem>
               
//                 <IonItem>
//                   <IonIcon icon={lockClosedOutline} slot="start" />
//                   <IonLabel>
//                     <h3>Privacy Radius</h3>
//                     <p>{basePoint.anonymizationRadius || 0} mile{basePoint.anonymizationRadius !== 1 ? 's' : ''}</p>
//                   </IonLabel>
//                 </IonItem>
//               </>
//             )}
//           </IonCardContent>
//         </IonCard>

//         {/* Real-Time Trip Status */}
//         {tracking && (
//           <IonCard>
//             <IonCardHeader>
//               <IonCardTitle color="success">🚗 Real Driving Active</IonCardTitle>
//             </IonCardHeader>
//             <IonCardContent>
//               <IonList>
//                 <IonItem>
//                   <IonIcon icon={timeOutline} slot="start" />
//                   <IonLabel>
//                     <h3>Trip Duration</h3>
//                     <p>{getTripDuration()}</p>
//                   </IonLabel>
//                 </IonItem>
                
//                 <IonItem>
//                   <IonIcon icon={speedometerOutline} slot="start" />
//                   <IonLabel>
//                     <h3>Current Speed</h3>
//                     <p>{tripQuality.currentSpeed.toFixed(1)} mph</p>
//                   </IonLabel>
//                 </IonItem>
                
//                 <IonItem>
//                   <IonIcon icon={speedometerOutline} slot="start" />
//                   <IonLabel>
//                     <h3>Max Speed</h3>
//                     <p>{tripQuality.maxSpeed.toFixed(1)} mph</p>
//                   </IonLabel>
//                 </IonItem>
//               </IonList>

//               <div style={{ marginTop: '1rem' }}>
//                 <h4>GPS Data Quality</h4>
//                 <p><strong>Trip ID:</strong> {currentTrip}</p>
//                 <p><strong>GPS Points:</strong> {locationQueue.length}/{TRAJECTORY_LENGTH}</p>
//                 <p><strong>Batches Uploaded:</strong> {batchCount}</p>
//                 <p>
//                   <strong>GPS Quality:</strong>
//                   <IonBadge color={getQualityColor(getDataQualityScore())} style={{ marginLeft: '0.5rem' }}>
//                     {Math.round(getDataQualityScore() * 100)}%
//                   </IonBadge>
//                 </p>
//                 <p><strong>Total Points:</strong> {tripQuality.totalPoints}</p>
//                 <p><strong>Valid Points:</strong> {tripQuality.validPoints}</p>
//                 <p><strong>Rejected Points:</strong> {tripQuality.rejectedPoints}</p>
//                 {tripQuality.averageAccuracy > 0 && (
//                   <p><strong>Avg GPS Accuracy:</strong> {tripQuality.averageAccuracy.toFixed(1)}m</p>
//                 )}
//               </div>

//               {uploading && (
//                 <>
//                   <IonLabel>Uploading real driving batch with privacy protection...</IonLabel>
//                   <IonProgressBar type="indeterminate"></IonProgressBar>
//                 </>
//               )}
//             </IonCardContent>
//           </IonCard>
//         )}

//         {/* Main Control */}
//         <IonCard>
//           <IonCardContent>
//             <IonButton
//               expand="block"
//               onClick={toggleTracking}
//               color={tracking ? 'danger' : 'primary'}
//               disabled={uploading}
//               size="large"
//             >
//               {tracking ? '🛑 Stop Real Driving Test' : '🚗 Start Real Driving Test'}
//             </IonButton>
            
//             {!tracking && (
//               <IonText style={{ display: 'block', textAlign: 'center', marginTop: '10px' }}>
//                 <p style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
//                   Start tracking before you begin driving. The app will analyze your speed consistency, 
//                   acceleration patterns, and turning behavior while protecting your privacy.
//                 </p>
//               </IonText>
//             )}
//           </IonCardContent>
//         </IonCard>

//         {/* Instructions */}
//         <IonCard>
//           <IonCardHeader>
//             <IonCardTitle>🔍 How to Test</IonCardTitle>
//           </IonCardHeader>
//           <IonCardContent>
//             <IonText>
//               <ol>
//                 <li><strong>Start tracking</strong> before you begin driving</li>
//                 <li><strong>Drive normally</strong> for at least 2-3 minutes</li>
//                 <li><strong>Try different scenarios:</strong>
//                   <ul>
//                     <li>Highway driving (steady speeds)</li>
//                     <li>City driving (stop and go)</li>
//                     <li>Aggressive driving (rapid speed changes)</li>
//                   </ul>
//                 </li>
//                 <li><strong>Stop tracking</strong> when finished</li>
//                 <li><strong>Check your score</strong> with the insurance provider view</li>
//               </ol>
//               <p><strong>Expected Results:</strong></p>
//               <ul>
//                 <li>Smooth highway driving: 80-95 score</li>
//                 <li>Normal city driving: 65-80 score</li>
//                 <li>Aggressive driving: 30-60 score</li>
//               </ul>
//             </IonText>
//           </IonCardContent>
//         </IonCard>

//         {/* Privacy Settings Modal - keeping same as before */}
//         <IonModal isOpen={showPrivacyModal} onDidDismiss={() => setShowPrivacyModal(false)}>
//           {/* Same privacy modal content as before */}
//         </IonModal>

//         <IonAlert
//           isOpen={showAlert}
//           onDidDismiss={() => setShowAlert(false)}
//           header="GPS Error"
//           message={error}
//           buttons={['OK']}
//         />
//       </IonContent>
//     </IonPage>
//   );
// };

// export default DriverHome;

// FIXED DriverHome.tsx - Complete Settings Modal Implementation
import React, { useState, useRef, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonText, IonAlert, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonProgressBar, IonLabel,
  IonButtons, IonIcon, IonBadge, IonChip, IonItem, IonList,
  IonItemDivider, IonModal, IonRange, IonSelect, IonSelectOption,
  IonInput, useIonToast
} from '@ionic/react';
import {
  logOutOutline, shieldCheckmarkOutline, settingsOutline,
  locationOutline, lockClosedOutline, alertCircleOutline,
  speedometerOutline, timeOutline, saveOutline, closeOutline
} from 'ionicons/icons';
import {
  validateGPSPoint,
  getUserBasePoint,
  getAnonymizedBasePoint,
  calculateUserSpecificDeltas,
  type EnhancedLocationPoint,
  type UserBasePoint
} from './EnhancedGPSProcessing';
import {
  getCityCoordinatesFromZipcode,
  validateZipcode,
  getGeocodeStats,
  type CityCoordinates
} from '../utils/geocoding';

interface DriverHomeProps {
  user: any;
  onSignOut?: () => void;
}

interface TripQualityMetrics {
  totalPoints: number;
  validPoints: number;
  rejectedPoints: number;
  averageAccuracy: number;
  speedDataQuality: number;
  stationaryPeriods: number;
  tripStartTime: string;
  currentSpeed: number;
  maxSpeed: number;
  avgSpeed: number;
}

interface PrivacySettings {
  anonymizationRadius: number;
  dataRetentionPeriod: number;
  consentLevel: 'full' | 'basic' | 'minimal';
}

const DriverHome: React.FC<DriverHomeProps> = ({ user, onSignOut }) => {
  const [tracking, setTracking] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<string | null>(null);
  const [locationQueue, setLocationQueue] = useState<EnhancedLocationPoint[]>([]);
  const [error, setError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [batchCount, setBatchCount] = useState(0);
  const [tripQuality, setTripQuality] = useState<TripQualityMetrics>({
    totalPoints: 0,
    validPoints: 0,
    rejectedPoints: 0,
    averageAccuracy: 0,
    speedDataQuality: 0,
    stationaryPeriods: 0,
    tripStartTime: '',
    currentSpeed: 0,
    maxSpeed: 0,
    avgSpeed: 0
  });

  // Privacy Controls
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [basePoint, setBasePoint] = useState<UserBasePoint | null>(null);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    anonymizationRadius: 10,
    dataRetentionPeriod: 12,
    consentLevel: 'full'
  });
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);

  // Zipcode Management States
  const [editingZipcode, setEditingZipcode] = useState(false);
  const [newZipcode, setNewZipcode] = useState('');
  const [newZipcodeValid, setNewZipcodeValid] = useState<boolean | null>(null);
  const [geocodingNewZipcode, setGeocodingNewZipcode] = useState(false);
  const [newBasePoint, setNewBasePoint] = useState<CityCoordinates | null>(null);

  const [present] = useIonToast();
  const watchIdRef = useRef<number | null>(null);
  const TRAJECTORY_LENGTH = 25;

  useEffect(() => {
    loadUserPrivacySettings();
    
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Validate new zipcode in real-time
  useEffect(() => {
    if (newZipcode.trim() && editingZipcode) {
      const isValid = validateZipcode(newZipcode);
      setNewZipcodeValid(isValid);
      
      if (isValid) {
        const timer = setTimeout(async () => {
          await performNewZipcodeGeocoding(newZipcode);
        }, 1000);
        
        return () => clearTimeout(timer);
      } else {
        setNewBasePoint(null);
      }
    } else {
      setNewZipcodeValid(null);
      setNewBasePoint(null);
    }
  }, [newZipcode, editingZipcode]);

  const loadUserPrivacySettings = () => {
    try {
      const userBasePoint = getUserBasePoint();
      setBasePoint(userBasePoint);
      
      if (user.privacySettings) {
        setPrivacySettings(user.privacySettings);
      }
      
      console.log('🔒 Loaded user privacy settings:', {
        basePoint: userBasePoint,
        privacySettings: user.privacySettings
      });
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const performNewZipcodeGeocoding = async (zipcode: string) => {
    if (geocodingNewZipcode) return;
    
    setGeocodingNewZipcode(true);
    try {
      const coordinates = await getCityCoordinatesFromZipcode(zipcode);
      setNewBasePoint(coordinates);
      console.log('🎯 New base point geocoded:', coordinates);
    } catch (error) {
      console.error('New zipcode geocoding error:', error);
      setError('Unable to locate city center for new zipcode. Please try a different zipcode.');
    } finally {
      setGeocodingNewZipcode(false);
    }
  };

  const startEditingZipcode = () => {
    setEditingZipcode(true);
    setNewZipcode(user.zipcode || '');
    setNewZipcodeValid(null);
    setNewBasePoint(null);
    setError('');
  };

  const cancelEditingZipcode = () => {
    setEditingZipcode(false);
    setNewZipcode('');
    setNewZipcodeValid(null);
    setNewBasePoint(null);
    setError('');
  };

  const updateZipcodeAndPrivacy = async () => {
    if (!newBasePoint || !newZipcode.trim()) {
      setError('Please enter a valid zipcode first');
      return;
    }

    setUpdatingPrivacy(true);
    try {
      const response = await fetch('https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/update-user-zipcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.userId,
          zipcode: newZipcode.trim(),
          base_point: {
            latitude: newBasePoint.latitude,
            longitude: newBasePoint.longitude,
            city: newBasePoint.city,
            state: newBasePoint.state,
            source: newBasePoint.source,
            zipcode: newBasePoint.zipcode
          },
          privacy_settings: {
            anonymizationRadius: privacySettings.anonymizationRadius,
            dataRetentionPeriod: privacySettings.dataRetentionPeriod,
            consentLevel: privacySettings.consentLevel
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update zipcode');
      }

      const userData = JSON.parse(localStorage.getItem('privacyDriveUser') || '{}');
      userData.zipcode = newZipcode.trim();
      userData.basePoint = {
        latitude: newBasePoint.latitude,
        longitude: newBasePoint.longitude,
        city: newBasePoint.city,
        state: newBasePoint.state,
        source: newBasePoint.source,
        zipcode: newBasePoint.zipcode,
        anonymizationRadius: privacySettings.anonymizationRadius
      };
      userData.privacySettings = privacySettings;
      
      localStorage.setItem('privacyDriveUser', JSON.stringify(userData));
      window.dispatchEvent(new CustomEvent('userDataUpdated'));
      
      loadUserPrivacySettings();
      
      console.log('✅ Zipcode updated successfully:', newBasePoint);
      setEditingZipcode(false);
      setNewZipcode('');
      setNewBasePoint(null);
      setError('');
      
      present({
        message: 'Privacy settings updated successfully!',
        duration: 2000,
        color: 'success'
      });
      
    } catch (error) {
      console.error('Error updating zipcode:', error);
      setError(error instanceof Error ? error.message : 'Failed to update zipcode');
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  const updatePrivacySettings = async () => {
    setUpdatingPrivacy(true);
    try {
      const userData = JSON.parse(localStorage.getItem('privacyDriveUser') || '{}');
      userData.privacySettings = privacySettings;
      
      if (basePoint && basePoint.source !== 'fallback') {
        userData.basePoint = {
          ...basePoint,
          anonymizationRadius: privacySettings.anonymizationRadius
        };
      }
      
      localStorage.setItem('privacyDriveUser', JSON.stringify(userData));
      window.dispatchEvent(new CustomEvent('userDataUpdated'));
      loadUserPrivacySettings();
      
      console.log('✅ Privacy settings updated:', privacySettings);
      
      present({
        message: 'Privacy settings saved!',
        duration: 2000,
        color: 'success'
      });
      
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      setError('Failed to update privacy settings');
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  // ... (keep all other existing functions like generateTripId, uploadBatch, etc. unchanged)

  const generateTripId = (): string => {
    return `trip_${user.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const calculateEnhancedDeltas = (queue: EnhancedLocationPoint[]): any[] => {
    if (queue.length < 2) return [];
    return calculateUserSpecificDeltas(queue);
  };

  const uploadBatch = async (queue: EnhancedLocationPoint[], tripId: string, batchNumber: number) => {
    try {
      setUploading(true);
      console.log(`🚀 Starting real driving batch upload for trip: ${tripId}, batch: ${batchNumber}`);
      
      const deltas = calculateEnhancedDeltas(queue);
      if (deltas.length === 0) {
        console.log('❌ No deltas to upload');
        return;
      }

      const validPoints = queue.filter(p => p.isValid).length;
      const avgAccuracy = queue.reduce((sum, p) => sum + (p.accuracy || 0), 0) / queue.length;
      const speedQuality = deltas.filter(d => d.speed_confidence > 0.6).length / deltas.length;
      const currentBasePoint = getAnonymizedBasePoint();

      const payload = {
        user_id: user.userId,
        trip_id: tripId,
        batch_number: batchNumber,
        batch_size: queue.length,
        first_point_timestamp: queue[0].timestamp,
        last_point_timestamp: queue[queue.length - 1].timestamp,
        deltas: deltas,
        quality_metrics: {
          valid_points: validPoints,
          rejected_points: queue.length - validPoints,
          average_accuracy: Math.round(avgAccuracy * 100) / 100,
          speed_data_quality: Math.round(speedQuality * 100) / 100,
          gps_quality_score: Math.min(1, validPoints / queue.length),
          base_point_source: currentBasePoint.source,
          anonymization_applied: currentBasePoint.anonymizationRadius ? true : false,
          privacy_radius_miles: currentBasePoint.anonymizationRadius || 0,
          privacy_level: user.privacySettings?.consentLevel || 'full'
        }
      };

      const response = await fetch('https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/store-trajectory-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Real driving batch uploaded with privacy protection:', result);
    } catch (err) {
      console.error('❌ Failed to upload batch:', err);
      setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const finalizeTripOnServer = async (tripId: string) => {
    try {
      console.log(`🏁 Finalizing real trip: ${tripId}`);
      
      const response = await fetch('https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/finalize-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.userId,
          trip_id: tripId,
          end_timestamp: new Date().toISOString(),
          trip_quality: {
            ...tripQuality,
            privacy_protected: basePoint?.source !== 'fallback',
            base_point_city: basePoint?.city,
            anonymization_radius: basePoint?.anonymizationRadius
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to finalize trip: ${response.status}`);
      }

      console.log('✅ Real trip finalized successfully with privacy metadata');
    } catch (err) {
      console.error('❌ Failed to finalize trip:', err);
    }
  };

  const processLocationUpdate = async (position: GeolocationPosition) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const accuracy = position.coords.accuracy || 0;
    const speed = position.coords.speed || undefined;

    const newPoint: EnhancedLocationPoint = {
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
      accuracy,
      speed: speed || undefined,
      speedAccuracy: (position.coords as any).speedAccuracy || undefined
    };

    // Validate GPS point quality for real driving
    const lastValidPoint = locationQueue.length > 0 ? locationQueue[locationQueue.length - 1] : undefined;
    const isValid = validateGPSPoint(newPoint, lastValidPoint);
    newPoint.isValid = isValid;

    console.log('📍 Real GPS point received:', {
      isValid,
      lat: newPoint.latitude.toFixed(6),
      lon: newPoint.longitude.toFixed(6),
      accuracy: accuracy.toFixed(1) + 'm',
      speed: speed ? (speed * 2.237).toFixed(1) + ' mph' : 'no speed',
      basePointCity: basePoint?.city,
      privacyRadius: basePoint?.anonymizationRadius
    });

    // Update trip quality metrics
    setTripQuality(prev => {
      const currentSpeedMph = speed ? speed * 2.237 : 0;
      const newMetrics = {
        ...prev,
        totalPoints: prev.totalPoints + 1,
        validPoints: prev.validPoints + (isValid ? 1 : 0),
        rejectedPoints: prev.rejectedPoints + (isValid ? 0 : 1),
        averageAccuracy: ((prev.averageAccuracy * prev.totalPoints) + (accuracy || 0)) / (prev.totalPoints + 1),
        currentSpeed: currentSpeedMph,
        maxSpeed: Math.max(prev.maxSpeed, currentSpeedMph),
        avgSpeed: prev.totalPoints > 0 ?
          ((prev.avgSpeed * (prev.totalPoints - 1)) + currentSpeedMph) / prev.totalPoints :
          currentSpeedMph
      };
      return newMetrics;
    });

    if (!isValid) {
      console.log('❌ GPS point rejected due to quality issues');
      return;
    }

    setLocationQueue(prevQueue => {
      const updatedQueue = [...prevQueue, newPoint];
      console.log(`📊 Real driving queue length: ${updatedQueue.length}`);

      if (updatedQueue.length >= TRAJECTORY_LENGTH) {
        const batchToUpload = updatedQueue.slice(0, TRAJECTORY_LENGTH);
        const remainingQueue = updatedQueue.slice(TRAJECTORY_LENGTH);

        if (currentTrip) {
          console.log(`🚀 Auto-uploading real driving batch for trip: ${currentTrip}`);
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
      console.log('🎯 Generated real trip ID:', tripId);
      console.log(`🔒 Using privacy base point: ${basePoint?.city}, ${basePoint?.state}`);
      
      setCurrentTrip(tripId);
      setLocationQueue([]);
      setBatchCount(0);
      setTripQuality({
        totalPoints: 0,
        validPoints: 0,
        rejectedPoints: 0,
        averageAccuracy: 0,
        speedDataQuality: 0,
        stationaryPeriods: 0,
        tripStartTime: new Date().toISOString(),
        currentSpeed: 0,
        maxSpeed: 0,
        avgSpeed: 0
      });

      // PRODUCTION GPS OPTIONS - Optimized for real driving
      const options = {
        enableHighAccuracy: true,
        timeout: 15000, // 15 second timeout
        maximumAge: 2000 // Use GPS readings up to 2 seconds old
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        processLocationUpdate,
        (error) => {
          console.error('Real GPS error:', error);
          setError(`GPS error: ${error.message}`);
          setShowAlert(true);
        },
        options
      );

      console.log('🚗 Started REAL DRIVING tracking with privacy protection, trip ID:', tripId);
      present({
        message: 'GPS tracking started! Drive safely.',
        duration: 2000,
        color: 'success'
      });
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if (locationQueue.length > 1 && currentTrip) {
        console.log('🏁 Uploading final real driving batch before stopping...');
        await uploadBatch(locationQueue, currentTrip, batchCount + 1);
        await finalizeTripOnServer(currentTrip);
      }

      setLocationQueue([]);
      setCurrentTrip(null);
      setBatchCount(0);
      setError('');
      console.log('🛑 Stopped real driving tracking');
      
      present({
        message: 'Trip completed! Check your driving analysis.',
        duration: 3000,
        color: 'primary'
      });
    }
    setTracking(!tracking);
  };

  const handleSignOut = () => {
    if (tracking) {
      toggleTracking();
    }
    localStorage.removeItem('privacyDriveUser');
    if (onSignOut) {
      onSignOut();
    }
  };

  const getQualityColor = (percentage: number): string => {
    if (percentage >= 0.8) return 'success';
    if (percentage >= 0.6) return 'warning';
    return 'danger';
  };

  const getDataQualityScore = (): number => {
    if (tripQuality.totalPoints === 0) return 1;
    return tripQuality.validPoints / tripQuality.totalPoints;
  };

  const getPrivacyStatusColor = (): string => {
    if (!basePoint) return 'medium';
    if (basePoint.source === 'fallback') return 'warning';
    return 'success';
  };

  const getTripDuration = (): string => {
    if (!tripQuality.tripStartTime) return '0:00';
    
    const start = new Date(tripQuality.tripStartTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffSeconds = Math.floor((diffMs % 60000) / 1000);
    
    return `${diffMinutes}:${diffSeconds.toString().padStart(2, '0')}`;
  };

  const geocodeStats = getGeocodeStats();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Real Driving Test - {user?.name || 'Driver'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowPrivacyModal(true)}>
              <IonIcon icon={settingsOutline} />
            </IonButton>
            <IonButton onClick={handleSignOut}>
              <IonIcon icon={logOutOutline} />
              Sign Out
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonText>
          <h2>🚗 Real Driving Analysis</h2>
          <p>Test your driving with real GPS data. Your exact location is never stored - only encrypted movement patterns.</p>
        </IonText>

        {error && (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        )}

        {/* Privacy Status Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={shieldCheckmarkOutline} style={{marginRight: '8px'}} />
              Privacy Protection Status
              <IonChip color={getPrivacyStatusColor()} style={{marginLeft: '10px'}}>
                {basePoint?.source === 'fallback' ? 'Basic' : 'Enhanced'}
              </IonChip>
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {basePoint && (
              <>
                <IonItem>
                  <IonIcon icon={locationOutline} slot="start" />
                  <IonLabel>
                    <h3>Anonymization Center</h3>
                    <p>{basePoint.city}, {basePoint.state}</p>
                    <p style={{fontSize: '0.8em', color: 'var(--ion-color-medium)'}}>
                      Source: {basePoint.source === 'zippopotam' ? 'Zippopotam API' :
                               basePoint.source === 'cache' ? 'Cached' : 'Fallback'}
                    </p>
                  </IonLabel>
                </IonItem>
                
                <IonItem>
                  <IonIcon icon={lockClosedOutline} slot="start" />
                  <IonLabel>
                    <h3>Privacy Radius</h3>
                    <p>{basePoint.anonymizationRadius || 0} mile{basePoint.anonymizationRadius !== 1 ? 's' : ''}</p>
                  </IonLabel>
                </IonItem>
              </>
            )}
          </IonCardContent>
        </IonCard>

        {/* Real-Time Trip Status */}
        {tracking && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle color="success">🚗 Real Driving Active</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonItem>
                  <IonIcon icon={timeOutline} slot="start" />
                  <IonLabel>
                    <h3>Trip Duration</h3>
                    <p>{getTripDuration()}</p>
                  </IonLabel>
                </IonItem>
                
                <IonItem>
                  <IonIcon icon={speedometerOutline} slot="start" />
                  <IonLabel>
                    <h3>Current Speed</h3>
                    <p>{tripQuality.currentSpeed.toFixed(1)} mph</p>
                  </IonLabel>
                </IonItem>
                
                <IonItem>
                  <IonIcon icon={speedometerOutline} slot="start" />
                  <IonLabel>
                    <h3>Max Speed</h3>
                    <p>{tripQuality.maxSpeed.toFixed(1)} mph</p>
                  </IonLabel>
                </IonItem>
              </IonList>

              <div style={{ marginTop: '1rem' }}>
                <h4>GPS Data Quality</h4>
                <p><strong>Trip ID:</strong> {currentTrip}</p>
                <p><strong>GPS Points:</strong> {locationQueue.length}/{TRAJECTORY_LENGTH}</p>
                <p><strong>Batches Uploaded:</strong> {batchCount}</p>
                <p>
                  <strong>GPS Quality:</strong>
                  <IonBadge color={getQualityColor(getDataQualityScore())} style={{ marginLeft: '0.5rem' }}>
                    {Math.round(getDataQualityScore() * 100)}%
                  </IonBadge>
                </p>
                <p><strong>Total Points:</strong> {tripQuality.totalPoints}</p>
                <p><strong>Valid Points:</strong> {tripQuality.validPoints}</p>
                <p><strong>Rejected Points:</strong> {tripQuality.rejectedPoints}</p>
                {tripQuality.averageAccuracy > 0 && (
                  <p><strong>Avg GPS Accuracy:</strong> {tripQuality.averageAccuracy.toFixed(1)}m</p>
                )}
              </div>

              {uploading && (
                <>
                  <IonLabel>Uploading real driving batch with privacy protection...</IonLabel>
                  <IonProgressBar type="indeterminate"></IonProgressBar>
                </>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* Main Control */}
        <IonCard>
          <IonCardContent>
            <IonButton
              expand="block"
              onClick={toggleTracking}
              color={tracking ? 'danger' : 'primary'}
              disabled={uploading}
              size="large"
            >
              {tracking ? '🛑 Stop Real Driving Test' : '🚗 Start Real Driving Test'}
            </IonButton>
            
            {!tracking && (
              <IonText style={{ display: 'block', textAlign: 'center', marginTop: '10px' }}>
                <p style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                  Start tracking before you begin driving. The app will analyze your speed consistency,
                  acceleration patterns, and turning behavior while protecting your privacy.
                </p>
              </IonText>
            )}
          </IonCardContent>
        </IonCard>

        {/* Instructions */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>🔍 How to Test</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>
              <ol>
                <li><strong>Start tracking</strong> before you begin driving</li>
                <li><strong>Drive normally</strong> for at least 2-3 minutes</li>
                <li><strong>Try different scenarios:</strong>
                  <ul>
                    <li>Highway driving (steady speeds)</li>
                    <li>City driving (stop and go)</li>
                    <li>Aggressive driving (rapid speed changes)</li>
                  </ul>
                </li>
                <li><strong>Stop tracking</strong> when finished</li>
                <li><strong>Check your score</strong> with the insurance provider view</li>
              </ol>
              <p><strong>Expected Results:</strong></p>
              <ul>
                <li>Smooth highway driving: 80-95 score</li>
                <li>Normal city driving: 65-80 score</li>
                <li>Aggressive driving: 30-60 score</li>
              </ul>
            </IonText>
          </IonCardContent>
        </IonCard>

        {/* FIXED Privacy Settings Modal - Complete Implementation */}
        <IonModal isOpen={showPrivacyModal} onDidDismiss={() => setShowPrivacyModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Privacy & Settings</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowPrivacyModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          
          <IonContent className="ion-padding">
            {/* Current Privacy Status */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={shieldCheckmarkOutline} style={{marginRight: '8px'}} />
                  Current Privacy Protection
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {basePoint ? (
                  <>
                    <IonItem>
                      <IonIcon icon={locationOutline} slot="start" />
                      <IonLabel>
                        <h3>Base Location</h3>
                        <p>{basePoint.city}, {basePoint.state}</p>
                        <p style={{fontSize: '0.8em', color: 'var(--ion-color-medium)'}}>
                          Zipcode: {user.zipcode || 'Not set'}
                        </p>
                      </IonLabel>
                    </IonItem>
                    
                    <IonItem>
                      <IonIcon icon={lockClosedOutline} slot="start" />
                      <IonLabel>
                        <h3>Anonymization Radius</h3>
                        <p>{basePoint.anonymizationRadius || 0} miles</p>
                      </IonLabel>
                    </IonItem>
                  </>
                ) : (
                  <IonText color="warning">
                    <p>No privacy base point configured. Using fallback protection.</p>
                  </IonText>
                )}
              </IonCardContent>
            </IonCard>

            {/* Zipcode Management */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={locationOutline} style={{marginRight: '8px'}} />
                  Location Settings
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {!editingZipcode ? (
                  <>
                    <IonItem>
                      <IonLabel>
                        <h3>Current Zipcode</h3>
                        <p>{user.zipcode || 'Not set'}</p>
                      </IonLabel>
                      <IonButton fill="outline" onClick={startEditingZipcode}>
                        Edit
                      </IonButton>
                    </IonItem>
                    
                    {basePoint && (
                      <IonItem>
                        <IonLabel>
                          <h3>Privacy Center</h3>
                          <p>{basePoint.city}, {basePoint.state}</p>
                          <p style={{fontSize: '0.8em', color: 'var(--ion-color-medium)'}}>
                            Source: {basePoint.source}
                          </p>
                        </IonLabel>
                      </IonItem>
                    )}
                  </>
                ) : (
                  <>
                    <IonItem>
                      <IonIcon icon={locationOutline} slot="start" />
                      <IonInput
                        placeholder="Enter new zipcode (e.g., 94583)"
                        value={newZipcode}
                        onIonInput={e => setNewZipcode(e.detail.value!)}
                        disabled={updatingPrivacy || geocodingNewZipcode}
                        clearInput
                      />
                      {newZipcodeValid === true && (
                        <IonIcon icon={shieldCheckmarkOutline} color="success" slot="end" />
                      )}
                      {newZipcodeValid === false && (
                        <IonIcon icon={alertCircleOutline} color="danger" slot="end" />
                      )}
                    </IonItem>

                    {geocodingNewZipcode && (
                      <div style={{ marginTop: '10px' }}>
                        <IonLabel>Verifying new location...</IonLabel>
                        <IonProgressBar type="indeterminate" color="primary" />
                      </div>
                    )}

                    {newBasePoint && (
                      <div style={{ marginTop: '15px' }}>
                        <IonChip color="success">
                          <IonIcon icon={shieldCheckmarkOutline} />
                          <IonLabel>
                            New location: {newBasePoint.city}, {newBasePoint.state}
                          </IonLabel>
                        </IonChip>
                      </div>
                    )}

                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                      <IonButton 
                        fill="outline" 
                        onClick={cancelEditingZipcode}
                        disabled={updatingPrivacy}
                      >
                        Cancel
                      </IonButton>
                      <IonButton 
                        onClick={updateZipcodeAndPrivacy}
                        disabled={!newBasePoint || updatingPrivacy}
                      >
                        {updatingPrivacy ? 'Updating...' : 'Save Location'}
                      </IonButton>
                    </div>
                  </>
                )}
              </IonCardContent>
            </IonCard>

            {/* Privacy Settings */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={lockClosedOutline} style={{marginRight: '8px'}} />
                  Privacy Settings
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonItem>
                  <IonLabel>
                    <h3>Anonymization Radius</h3>
                    <p>{privacySettings.anonymizationRadius} mile{privacySettings.anonymizationRadius !== 1 ? 's' : ''}</p>
                  </IonLabel>
                  <IonRange
                    min={1}
                    max={50}
                    value={privacySettings.anonymizationRadius}
                    onIonChange={e => setPrivacySettings(prev => ({ 
                      ...prev, 
                      anonymizationRadius: e.detail.value as number 
                    }))}
                    pin={true}
                    snaps={true}
                    ticks={false}
                    disabled={updatingPrivacy}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel>
                    <h3>Data Retention Period</h3>
                    <p>{privacySettings.dataRetentionPeriod} month{privacySettings.dataRetentionPeriod !== 1 ? 's' : ''}</p>
                  </IonLabel>
                  <IonSelect
                    value={privacySettings.dataRetentionPeriod}
                    onIonChange={e => setPrivacySettings(prev => ({ 
                      ...prev, 
                      dataRetentionPeriod: e.detail.value 
                    }))}
                    disabled={updatingPrivacy}
                  >
                    <IonSelectOption value={1}>1 Month</IonSelectOption>
                    <IonSelectOption value={3}>3 Months</IonSelectOption>
                    <IonSelectOption value={6}>6 Months</IonSelectOption>
                    <IonSelectOption value={12}>1 Year</IonSelectOption>
                    <IonSelectOption value={24}>2 Years</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem>
                  <IonLabel>
                    <h3>Consent Level</h3>
                    <p>Current: {privacySettings.consentLevel}</p>
                  </IonLabel>
                  <IonSelect
                    value={privacySettings.consentLevel}
                    onIonChange={e => setPrivacySettings(prev => ({ 
                      ...prev, 
                      consentLevel: e.detail.value 
                    }))}
                    disabled={updatingPrivacy}
                  >
                    <IonSelectOption value="full">Full Analytics</IonSelectOption>
                    <IonSelectOption value="basic">Basic Analytics</IonSelectOption>
                    <IonSelectOption value="minimal">Minimal Data</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <div style={{ marginTop: '20px' }}>
                  <IonButton
                    expand="block"
                    onClick={updatePrivacySettings}
                    disabled={updatingPrivacy}
                  >
                    <IonIcon icon={saveOutline} slot="start" />
                    {updatingPrivacy ? 'Saving...' : 'Save Privacy Settings'}
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>

            {/* Privacy Impact Summary */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Privacy Impact Summary</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonText>
                  <p><strong>Current Protection:</strong></p>
                  <ul>
                    <li>Your exact location is never stored</li>
                    <li>Data is anonymized within {privacySettings.anonymizationRadius} miles of {basePoint?.city || 'your area'}</li>
                    <li>Data retention: {privacySettings.dataRetentionPeriod} months</li>
                    <li>Analytics level: {privacySettings.consentLevel}</li>
                  </ul>
                  
                  <p style={{fontSize: '0.9em', color: 'var(--ion-color-medium)', marginTop: '15px'}}>
                    <strong>How it works:</strong> Your phone calculates movement differences, then shifts them 
                    to a random point near {basePoint?.city || 'your city'}. Service providers see driving patterns 
                    but never your actual routes or destinations.
                  </p>
                </IonText>
              </IonCardContent>
            </IonCard>

            {/* Geocoding Cache Stats */}
            {geocodeStats.entries > 0 && (
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Cache Statistics</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText>
                    <p><strong>Cached Locations:</strong> {geocodeStats.entries}</p>
                    <p><strong>Cache Size:</strong> {geocodeStats.size}</p>
                    {geocodeStats.oldestEntry && (
                      <p><strong>Oldest Entry:</strong> {geocodeStats.oldestEntry}</p>
                    )}
                  </IonText>
                </IonCardContent>
              </IonCard>
            )}
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="GPS Error"
          message={error}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default DriverHome;