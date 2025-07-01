// // Updated DriverHome.tsx with Enhanced GPS Processing and Full Debugging
// import React, { useState, useRef, useEffect } from 'react';
// import {
//   IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
//   IonButton, IonText, IonAlert, IonCard, IonCardContent,
//   IonCardHeader, IonCardTitle, IonProgressBar, IonLabel,
//   IonButtons, IonIcon, IonBadge
// } from '@ionic/react';
// import { logOutOutline } from 'ionicons/icons';

// import {
//   validateGPSPoint,
//   detectStationaryPeriod,
//   calculateEnhancedSpeed,
//   processSpeedData,
//   GPS_QUALITY_CONFIG,
//   type EnhancedLocationPoint,
//   type ProcessedSpeedData
// } from './EnhancedGPSProcessing'; // Import our new functions

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
//     stationaryPeriods: 0
//   });
//   const [testMode, setTestMode] = useState(false);
//   const [simulationRunning, setSimulationRunning] = useState(false);

//   // Add ref to store current trip ID for test mode
//   const testTripIdRef = useRef<string | null>(null);

//   const watchIdRef = useRef<number | null>(null);
//   const TRAJECTORY_LENGTH = 25;
//   const FIXED_POINT_MULTIPLIER = 1000000;

//   useEffect(() => {
//     return () => {
//       if (watchIdRef.current !== null) {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//       }
//     };
//   }, []);

//   const generateTripId = (): string => {
//     return `trip_${user.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//   };

//   const calculateEnhancedDeltas = (queue: EnhancedLocationPoint[]): any[] => {
//     if (queue.length < 2) return [];

//     // Process speed data with enhanced algorithms
//     const speedData = processSpeedData(queue);
//     const deltas = [];

//     for (let i = 1; i < queue.length; i++) {
//       const prev = queue[i - 1];
//       const curr = queue[i];

//       const deltaLat = Math.round((curr.latitude - prev.latitude) * FIXED_POINT_MULTIPLIER);
//       const deltaLong = Math.round((curr.longitude - prev.longitude) * FIXED_POINT_MULTIPLIER);
//       const deltaTime = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();

//       deltas.push({
//         delta_lat: deltaLat,
//         delta_long: deltaLong,
//         delta_time: deltaTime,
//         timestamp: curr.timestamp,
//         sequence: i - 1,
//         // Enhanced metadata
//         speed_mph: speedData.reliableSpeeds[i - 1] || 0,
//         speed_confidence: speedData.confidence[i - 1] || 0,
//         gps_accuracy: curr.accuracy || 0,
//         is_stationary: speedData.reliableSpeeds[i - 1] === 0,
//         data_quality: curr.isValid ? 'high' : 'medium'
//       });
//     }

//     return deltas;
//   };

//   const uploadBatch = async (queue: EnhancedLocationPoint[], tripId: string, batchNumber: number) => {
//     try {
//       setUploading(true);
//       console.log(`🚀 Starting batch upload for trip: ${tripId}, batch: ${batchNumber}`);
      
//       const deltas = calculateEnhancedDeltas(queue);

//       if (deltas.length === 0) {
//         console.log('❌ No deltas to upload');
//         return;
//       }

//       // Calculate quality metrics for this batch
//       const validPoints = queue.filter(p => p.isValid).length;
//       const avgAccuracy = queue.reduce((sum, p) => sum + (p.accuracy || 0), 0) / queue.length;
//       const speedQuality = deltas.filter(d => d.speed_confidence > 0.6).length / deltas.length;

//       const payload = {
//         user_id: user.userId,
//         trip_id: tripId,
//         batch_number: batchNumber,
//         batch_size: queue.length,
//         first_point_timestamp: queue[0].timestamp,
//         last_point_timestamp: queue[queue.length - 1].timestamp,
//         deltas: deltas,
//         // Enhanced quality metadata
//         quality_metrics: {
//           valid_points: validPoints,
//           rejected_points: queue.length - validPoints,
//           average_accuracy: Math.round(avgAccuracy * 100) / 100,
//           speed_data_quality: Math.round(speedQuality * 100) / 100,
//           gps_quality_score: Math.min(1, validPoints / queue.length)
//         }
//       };

//       console.log('📤 Uploading enhanced batch:', {
//         tripId,
//         batchNumber,
//         queueSize: queue.length,
//         deltasCount: deltas.length
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
//       console.log('✅ Enhanced batch uploaded successfully:', result);

//     } catch (err) {
//       console.error('❌ Failed to upload batch:', err);
//       setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
//     } finally {
//       setUploading(false);
//     }
//   };

//   const finalizeTripOnServer = async (tripId: string) => {
//     try {
//       console.log(`🏁 Finalizing trip: ${tripId}`);
      
//       const response = await fetch('https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/finalize-trip', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           user_id: user.userId,
//           trip_id: tripId,
//           end_timestamp: new Date().toISOString(),
//           // Add trip quality summary
//           trip_quality: tripQuality
//         })
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to finalize trip: ${response.status}`);
//       }

//       console.log('✅ Trip finalized successfully with quality metrics');
//     } catch (err) {
//       console.error('❌ Failed to finalize trip:', err);
//     }
//   };

//   const processLocationUpdate = async (position: GeolocationPosition, forceTripId?: string) => {
//     const { latitude, longitude, accuracy, speed } = position.coords;

//     // Create enhanced location point
//     const newPoint: EnhancedLocationPoint = {
//       latitude,
//       longitude,
//       timestamp: new Date().toISOString(),
//       accuracy,
//       speed: speed || undefined,
//       speedAccuracy: (position.coords as any).speedAccuracy || undefined
//     };

//     // Validate GPS point quality (bypass for test mode)
//     const lastValidPoint = locationQueue.length > 0 ? locationQueue[locationQueue.length - 1] : undefined;
//     const isValid = testMode ? true : validateGPSPoint(newPoint, lastValidPoint);
//     newPoint.isValid = isValid;

//     // Use forceTripId for test mode, otherwise use state
//     const activeTripId = forceTripId || currentTrip;

//     console.log('📍 Point validation:', {
//       testMode,
//       isValid,
//       beforeQueueLength: locationQueue.length,
//       currentTrip,
//       forceTripId,
//       activeTripId,
//       point: { lat: newPoint.latitude.toFixed(6), lon: newPoint.longitude.toFixed(6) }
//     });

//     // Update quality metrics
//     setTripQuality(prev => {
//       const newMetrics = {
//         totalPoints: prev.totalPoints + 1,
//         validPoints: prev.validPoints + (isValid ? 1 : 0),
//         rejectedPoints: prev.rejectedPoints + (isValid ? 0 : 1),
//         averageAccuracy: ((prev.averageAccuracy * prev.totalPoints) + (accuracy || 0)) / (prev.totalPoints + 1),
//         speedDataQuality: prev.speedDataQuality, // Will be updated in batch processing
//         stationaryPeriods: prev.stationaryPeriods
//       };
//       return newMetrics;
//     });

//     if (!isValid) {
//       console.log('❌ GPS point rejected due to quality issues');
//       return;
//     }

//     setLocationQueue(prevQueue => {
//       const updatedQueue = [...prevQueue, newPoint];
//       console.log(`📊 Updated queue length: ${updatedQueue.length}, Active trip: ${activeTripId}`);

//       if (updatedQueue.length >= TRAJECTORY_LENGTH) {
//         const batchToUpload = updatedQueue.slice(0, TRAJECTORY_LENGTH);
//         const remainingQueue = updatedQueue.slice(TRAJECTORY_LENGTH);

//         if (activeTripId) {
//           console.log(`🚀 Auto-uploading batch for trip: ${activeTripId}`);
//           uploadBatch(batchToUpload, activeTripId, batchCount + 1);
//           setBatchCount(prev => prev + 1);
//         } else {
//           console.log('❌ No active trip ID for batch upload');
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
//       console.log('🎯 Generated trip ID:', tripId);
//       console.log('👤 User object:', user);
      
//       setCurrentTrip(tripId);
//       console.log('💾 Set current trip to:', tripId);
      
//       setLocationQueue([]);
//       setBatchCount(0);
//       setTripQuality({
//         totalPoints: 0,
//         validPoints: 0,
//         rejectedPoints: 0,
//         averageAccuracy: 0,
//         speedDataQuality: 0,
//         stationaryPeriods: 0
//       });

//       const options = {
//         enableHighAccuracy: true,
//         timeout: 10000,
//         maximumAge: 1000 // Reduced for better real-time accuracy
//       };

//       watchIdRef.current = navigator.geolocation.watchPosition(
//         processLocationUpdate,
//         (error) => {
//           console.error('Geolocation error:', error);
//           setError(`Location error: ${error.message}`);
//           setShowAlert(true);
//         },
//         options
//       );

//       console.log('🚀 Started enhanced tracking with trip ID:', tripId);
//     } else {
//       if (watchIdRef.current !== null) {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//         watchIdRef.current = null;
//       }

//       if (locationQueue.length > 1 && currentTrip) {
//         console.log('🏁 Uploading final batch before stopping...');
//         await uploadBatch(locationQueue, currentTrip, batchCount + 1);
//         await finalizeTripOnServer(currentTrip);
//       }

//       setLocationQueue([]);
//       setCurrentTrip(null);
//       setBatchCount(0);
//       setError('');
//       console.log('🛑 Stopped enhanced tracking');
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

//   // Test mode: Simulate realistic GPS data
//   const generateTestGPSData = () => {
//     // Simulate a 5-minute drive with realistic GPS patterns
//     const testRoute = [
//       // Starting location (San Ramon area)
//       { lat: 37.7799, lon: -121.9780, speed: 0, scenario: 'start' },
//       // Gradual acceleration
//       { lat: 37.7802, lon: -121.9785, speed: 15, scenario: 'acceleration' },
//       { lat: 37.7808, lon: -121.9792, speed: 25, scenario: 'acceleration' },
//       { lat: 37.7815, lon: -121.9800, speed: 35, scenario: 'steady' },
//       // Highway merge
//       { lat: 37.7825, lon: -121.9815, speed: 50, scenario: 'highway_merge' },
//       { lat: 37.7840, lon: -121.9835, speed: 65, scenario: 'highway' },
//       { lat: 37.7860, lon: -121.9860, speed: 70, scenario: 'highway' },
//       // Sharp turn (testing turn analysis)
//       { lat: 37.7875, lon: -121.9840, speed: 45, scenario: 'sharp_turn' },
//       { lat: 37.7885, lon: -121.9820, speed: 30, scenario: 'turn_exit' },
//       // Sudden stop (testing hard stop detection)
//       { lat: 37.7890, lon: -121.9815, speed: 5, scenario: 'sudden_stop' },
//       { lat: 37.7891, lon: -121.9814, speed: 0, scenario: 'stopped' },
//       { lat: 37.7891, lon: -121.9814, speed: 0, scenario: 'stopped' },
//       // Resume driving
//       { lat: 37.7895, lon: -121.9810, speed: 20, scenario: 'resume' },
//       { lat: 37.7900, lon: -121.9805, speed: 35, scenario: 'city_driving' },
//       // End location
//       { lat: 37.7905, lon: -121.9800, speed: 0, scenario: 'end' }
//     ];

//     return testRoute;
//   };

//   const startTestMode = async () => {
//     if (!testMode) {
//       alert('Please enable Test Mode first');
//       return;
//     }

//     console.log('🧪 ===== STARTING TEST MODE =====');
    
//     const tripId = generateTripId();
//     console.log('🎯 Generated test trip ID:', tripId);
//     console.log('👤 User object:', user);
    
//     // Store trip ID in ref for reliable access
//     testTripIdRef.current = tripId;
    
//     setCurrentTrip(tripId);
//     console.log('💾 Set current trip to:', tripId);
    
//     setTracking(true);
//     console.log('🚀 Set tracking to true');
    
//     setLocationQueue([]);
//     setBatchCount(0);
//     setTripQuality({
//       totalPoints: 0,
//       validPoints: 0,
//       rejectedPoints: 0,
//       averageAccuracy: 0,
//       speedDataQuality: 0,
//       stationaryPeriods: 0
//     });
//     setSimulationRunning(true);

//     // Debug state after 100ms
//     setTimeout(() => {
//       console.log('🔍 State check after 100ms:', {
//         tracking,
//         currentTrip,
//         testMode,
//         locationQueueLength: locationQueue.length,
//         testTripIdRef: testTripIdRef.current
//       });
//     }, 100);

//     const testData = generateTestGPSData();
//     console.log(`📊 Starting GPS simulation with ${testData.length} points`);

//     // Simulate GPS points every 2 seconds
//     for (let i = 0; i < testData.length; i++) {
//       console.log(`\n🔄 Processing point ${i + 1}/${testData.length}: ${testData[i].scenario}`);
      
//       const point = testData[i];
      
//       // Add realistic GPS noise
//       const noise = (Math.random() - 0.5) * 0.0001; // ~10 meter noise
//       const accuracyNoise = 5 + Math.random() * 15; // 5-20m accuracy

//       const simulatedPosition = {
//         coords: {
//           latitude: point.lat + noise,
//           longitude: point.lon + noise,
//           accuracy: accuracyNoise,
//           speed: point.speed * 0.44704, // Convert mph to m/s
//           speedAccuracy: 2 + Math.random() * 3,
//           altitude: null,
//           altitudeAccuracy: null,
//           heading: null,
//           toJSON: function() { return this; }
//         },
//         timestamp: Date.now(),
//         toJSON: function() { return this; }
//       } as unknown as GeolocationPosition;

//       console.log(`📍 Test GPS Point ${i + 1}/${testData.length}: ${point.scenario} - ${point.speed}mph`);
      
//       try {
//         // Pass the tripId directly to ensure it's available
//         await processLocationUpdate(simulatedPosition, testTripIdRef.current);
//         console.log(`✅ Successfully processed point ${i + 1}`);
//       } catch (error) {
//         console.error(`❌ Error processing point ${i + 1}:`, error);
//       }
      
//       // Wait 2 seconds between points (realistic GPS frequency)
//       if (i < testData.length - 1) { // Don't wait after the last point
//         console.log(`⏳ Waiting 2 seconds before next point...`);
//         await new Promise(resolve => setTimeout(resolve, 2000));
//       }
//     }

//     console.log(`📊 Final queue length: ${locationQueue.length}`);
//     setSimulationRunning(false);
//     console.log('🏁 GPS simulation completed');
    
// // Auto-finalize the test trip
// setTimeout(async () => {
//   console.log('\n🏁 ===== FINALIZING TEST TRIP =====');
//   console.log('💾 Current trip at finalization:', currentTrip);
//   console.log('🎯 Test trip ID at finalization:', testTripIdRef.current);
  
//   const finalTripId = testTripIdRef.current || tripId;
  
//   // Access the final queue state properly
//   setLocationQueue(currentQueue => {
//     console.log('📊 Actual final queue length:', currentQueue.length);
    
//     if (currentQueue.length > 0 && finalTripId) {
//       console.log('🚀 Uploading final batch...');
//       // Upload the current queue
//       uploadBatch(currentQueue, finalTripId, batchCount + 1).then(() => {
//         finalizeTripOnServer(finalTripId).then(() => {
//           console.log('✅ Trip finalized successfully');
//         });
//       });
      
//       return []; // Clear the queue after upload
//     } else {
//       console.log('❌ No data to finalize:', { 
//         queueLength: currentQueue.length, 
//         finalTripId,
//         currentTrip
//       });
//       return currentQueue;
//     }
//   });
  
//   // Reset tracking state
//   setTracking(false);
//   setCurrentTrip(null);
//   testTripIdRef.current = null;
//   console.log('🔄 Reset tracking state');
// }, 1000);
//   };

//   return (
//     <IonPage>
//       <IonHeader>
//         <IonToolbar>
//           <IonTitle>Welcome, {user?.name || 'Driver'}</IonTitle>
//           <IonButtons slot="end">
//             <IonButton onClick={handleSignOut}>
//               <IonIcon icon={logOutOutline} />
//               Sign Out
//             </IonButton>
//           </IonButtons>
//         </IonToolbar>
//       </IonHeader>

//       <IonContent className="ion-padding">
//         <IonText>
//           <h2>Enhanced Privacy-Protected Trip Tracking</h2>
//           <p>Your exact location is never stored. Only encrypted movement patterns with enhanced accuracy are transmitted.</p>
//         </IonText>

//         {error && (
//           <IonText color="danger">
//             <p>{error}</p>
//           </IonText>
//         )}

//         {tracking && (
//           <IonCard>
//             <IonCardHeader>
//               <IonCardTitle color="success">Enhanced Tracking Active</IonCardTitle>
//             </IonCardHeader>
//             <IonCardContent>
//               <p><strong>Trip ID:</strong> {currentTrip}</p>
//               <p><strong>Points in Queue:</strong> {locationQueue.length}/{TRAJECTORY_LENGTH}</p>
//               <p><strong>Batches Uploaded:</strong> {batchCount}</p>
              
//               {/* Enhanced Quality Metrics Display */}
//               <div style={{ marginTop: '1rem' }}>
//                 <h4>Data Quality Metrics</h4>
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
//                   <IonLabel>Uploading enhanced batch...</IonLabel>
//                   <IonProgressBar type="indeterminate"></IonProgressBar>
//                 </>
//               )}
//             </IonCardContent>
//           </IonCard>
//         )}

//         {/* Test Mode Section */}
//         <IonCard>
//           <IonCardHeader>
//             <IonCardTitle color="tertiary">Test Mode (Desktop Testing)</IonCardTitle>
//           </IonCardHeader>
//           <IonCardContent>
//             <IonLabel>
//               <p>Test the enhanced GPS algorithms with simulated driving data</p>
//             </IonLabel>
            
//             <IonButton
//               fill={testMode ? "solid" : "outline"}
//               color="tertiary"
//               onClick={() => setTestMode(!testMode)}
//               disabled={tracking || simulationRunning}
//             >
//               {testMode ? 'Test Mode: ON' : 'Enable Test Mode'}
//             </IonButton>

//             {testMode && (
//               <IonButton
//                 expand="block"
//                 color="secondary"
//                 onClick={startTestMode}
//                 disabled={simulationRunning || (tracking && !testMode)}
//                 style={{ marginTop: '10px' }}
//               >
//                 {simulationRunning ? 'Running Simulation...' : 'Start GPS Simulation'}
//               </IonButton>
//             )}

//             {simulationRunning && (
//               <div style={{ marginTop: '10px' }}>
//                 <IonLabel>Simulating realistic drive pattern...</IonLabel>
//                 <IonProgressBar type="indeterminate" color="secondary"></IonProgressBar>
//               </div>
//             )}
//           </IonCardContent>
//         </IonCard>

//         <IonButton
//           expand="block"
//           onClick={toggleTracking}
//           color={tracking ? 'danger' : 'primary'}
//           disabled={uploading || simulationRunning}
//         >
//           {tracking ? 'Stop Enhanced Tracking' : 'Start Enhanced Tracking'}
//         </IonButton>

//         <IonAlert
//           isOpen={showAlert}
//           onDidDismiss={() => setShowAlert(false)}
//           header="Location Error"
//           message={error}
//           buttons={['OK']}
//         />
//       </IonContent>
//     </IonPage>
//   );
// };

// export default DriverHome;

// Updated DriverHome.tsx with User-Specific Base Points and Privacy Controls
import React, { useState, useRef, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonText, IonAlert, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonProgressBar, IonLabel,
  IonButtons, IonIcon, IonBadge, IonChip, IonItem, IonList,
  IonItemDivider, IonModal, IonRange, IonSelect, IonSelectOption
} from '@ionic/react';
import { logOutOutline, shieldCheckmarkOutline, settingsOutline, locationOutline, lockClosedOutline } from 'ionicons/icons';

import {
  validateGPSPoint,
  detectStationaryPeriod,
  calculateEnhancedSpeed,
  processSpeedData,
  getUserBasePoint,
  getAnonymizedBasePoint,
  calculateUserSpecificDeltas,
  GPS_QUALITY_CONFIG,
  type EnhancedLocationPoint,
  type ProcessedSpeedData,
  type UserBasePoint
} from './EnhancedGPSProcessing';

import { getCityCoordinatesFromZipcode, validateZipcode, clearGeocodingCache, getGeocodeStats } from '../utils/geocoding';

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
    stationaryPeriods: 0
  });
  const [testMode, setTestMode] = useState(false);
  const [simulationRunning, setSimulationRunning] = useState(false);
  
  // Privacy Controls
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [basePoint, setBasePoint] = useState<UserBasePoint | null>(null);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    anonymizationRadius: 10,
    dataRetentionPeriod: 12,
    consentLevel: 'full'
  });
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);

  // Add ref to store current trip ID for test mode
  const testTripIdRef = useRef<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const TRAJECTORY_LENGTH = 25;
  const FIXED_POINT_MULTIPLIER = 1000000;

  useEffect(() => {
    // Load user's base point and privacy settings
    loadUserPrivacySettings();
    
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

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

  const generateTripId = (): string => {
    return `trip_${user.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const calculateEnhancedDeltas = (queue: EnhancedLocationPoint[]): any[] => {
    if (queue.length < 2) return [];

    // Use user-specific base point calculation
    return calculateUserSpecificDeltas(queue);
  };

  const uploadBatch = async (queue: EnhancedLocationPoint[], tripId: string, batchNumber: number) => {
    try {
      setUploading(true);
      console.log(`🚀 Starting enhanced batch upload for trip: ${tripId}, batch: ${batchNumber}`);
      
      const deltas = calculateEnhancedDeltas(queue);

      if (deltas.length === 0) {
        console.log('❌ No deltas to upload');
        return;
      }

      // Calculate quality metrics for this batch
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
        // Enhanced quality metadata with privacy info
        quality_metrics: {
          valid_points: validPoints,
          rejected_points: queue.length - validPoints,
          average_accuracy: Math.round(avgAccuracy * 100) / 100,
          speed_data_quality: Math.round(speedQuality * 100) / 100,
          gps_quality_score: Math.min(1, validPoints / queue.length),
          // Privacy metadata
          base_point_source: currentBasePoint.source,
          anonymization_applied: currentBasePoint.anonymizationRadius ? true : false,
          privacy_radius_miles: currentBasePoint.anonymizationRadius || 0,
          privacy_level: user.privacySettings?.consentLevel || 'full'
        }
      };

      console.log('📤 Uploading enhanced batch with privacy protection:', {
        tripId,
        batchNumber,
        queueSize: queue.length,
        deltasCount: deltas.length,
        privacyRadius: currentBasePoint.anonymizationRadius,
        basePointSource: currentBasePoint.source
      });

      const response = await fetch('https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/store-trajectory-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Enhanced batch uploaded with privacy protection:', result);

    } catch (err) {
      console.error('❌ Failed to upload batch:', err);
      setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const finalizeTripOnServer = async (tripId: string) => {
    try {
      console.log(`🏁 Finalizing trip: ${tripId}`);
      
      const response = await fetch('https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/finalize-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.userId,
          trip_id: tripId,
          end_timestamp: new Date().toISOString(),
          // Add trip quality summary with privacy info
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

      console.log('✅ Trip finalized successfully with privacy metadata');
    } catch (err) {
      console.error('❌ Failed to finalize trip:', err);
    }
  };

  const processLocationUpdate = async (position: GeolocationPosition, forceTripId?: string) => {
    const { latitude, longitude, accuracy, speed } = position.coords;

    // Create enhanced location point
    const newPoint: EnhancedLocationPoint = {
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
      accuracy,
      speed: speed || undefined,
      speedAccuracy: (position.coords as any).speedAccuracy || undefined
    };

    // Validate GPS point quality (bypass for test mode)
    const lastValidPoint = locationQueue.length > 0 ? locationQueue[locationQueue.length - 1] : undefined;
    const isValid = testMode ? true : validateGPSPoint(newPoint, lastValidPoint);
    newPoint.isValid = isValid;

    // Use forceTripId for test mode, otherwise use state
    const activeTripId = forceTripId || currentTrip;

    console.log('📍 Point validation with privacy protection:', {
      testMode,
      isValid,
      beforeQueueLength: locationQueue.length,
      currentTrip,
      forceTripId,
      activeTripId,
      basePointCity: basePoint?.city,
      privacyRadius: basePoint?.anonymizationRadius,
      point: { lat: newPoint.latitude.toFixed(6), lon: newPoint.longitude.toFixed(6) }
    });

    // Update quality metrics
    setTripQuality(prev => {
      const newMetrics = {
        totalPoints: prev.totalPoints + 1,
        validPoints: prev.validPoints + (isValid ? 1 : 0),
        rejectedPoints: prev.rejectedPoints + (isValid ? 0 : 1),
        averageAccuracy: ((prev.averageAccuracy * prev.totalPoints) + (accuracy || 0)) / (prev.totalPoints + 1),
        speedDataQuality: prev.speedDataQuality, // Will be updated in batch processing
        stationaryPeriods: prev.stationaryPeriods
      };
      return newMetrics;
    });

    if (!isValid) {
      console.log('❌ GPS point rejected due to quality issues');
      return;
    }

    setLocationQueue(prevQueue => {
      const updatedQueue = [...prevQueue, newPoint];
      console.log(`📊 Updated queue length: ${updatedQueue.length}, Active trip: ${activeTripId}`);

      if (updatedQueue.length >= TRAJECTORY_LENGTH) {
        const batchToUpload = updatedQueue.slice(0, TRAJECTORY_LENGTH);
        const remainingQueue = updatedQueue.slice(TRAJECTORY_LENGTH);

        if (activeTripId) {
          console.log(`🚀 Auto-uploading batch for trip: ${activeTripId} with privacy protection`);
          uploadBatch(batchToUpload, activeTripId, batchCount + 1);
          setBatchCount(prev => prev + 1);
        } else {
          console.log('❌ No active trip ID for batch upload');
        }

        return remainingQueue;
      }

      return updatedQueue;
    });

    setError('');
  };

  // Test mode functions (updated with user-specific base points)
  const generateTestGPSData = () => {
    // Use user's city as starting point if available, otherwise San Ramon
    const startLat = basePoint?.source !== 'fallback' ? basePoint?.latitude ?? 37.7799 : 37.7799;
    const startLon = basePoint?.source !== 'fallback' ? basePoint?.longitude ?? -121.9780 : -121.9780;
    
    const testRoute = [
      { lat: startLat, lon: startLon, speed: 0, scenario: 'start' },
      { lat: startLat + 0.0003, lon: startLon + 0.0005, speed: 15, scenario: 'acceleration' },
      { lat: startLat + 0.0009, lon: startLon + 0.0012, speed: 25, scenario: 'acceleration' },
      { lat: startLat + 0.0016, lon: startLon + 0.0020, speed: 35, scenario: 'steady' },
      { lat: startLat + 0.0026, lon: startLon + 0.0035, speed: 50, scenario: 'highway_merge' },
      { lat: startLat + 0.0041, lon: startLon + 0.0055, speed: 65, scenario: 'highway' },
      { lat: startLat + 0.0061, lon: startLon + 0.0080, speed: 70, scenario: 'highway' },
      { lat: startLat + 0.0076, lon: startLon + 0.0060, speed: 45, scenario: 'sharp_turn' },
      { lat: startLat + 0.0086, lon: startLon + 0.0040, speed: 30, scenario: 'turn_exit' },
      { lat: startLat + 0.0091, lon: startLon + 0.0035, speed: 5, scenario: 'sudden_stop' },
      { lat: startLat + 0.0092, lon: startLon + 0.0034, speed: 0, scenario: 'stopped' },
      { lat: startLat + 0.0092, lon: startLon + 0.0034, speed: 0, scenario: 'stopped' },
      { lat: startLat + 0.0096, lon: startLon + 0.0030, speed: 20, scenario: 'resume' },
      { lat: startLat + 0.0101, lon: startLon + 0.0025, speed: 35, scenario: 'city_driving' },
      { lat: startLat + 0.0106, lon: startLon + 0.0020, speed: 0, scenario: 'end' }
    ];

    console.log(`🧪 Generated test route starting from: ${basePoint?.city || 'San Ramon'}`);
    return testRoute;
  };

  const startTestMode = async () => {
    if (!testMode) {
      alert('Please enable Test Mode first');
      return;
    }

    console.log('🧪 ===== STARTING ENHANCED TEST MODE =====');
    console.log(`🔒 Privacy base point: ${basePoint?.city}, ${basePoint?.state} (${basePoint?.source})`);
    console.log(`🛡️ Anonymization radius: ${basePoint?.anonymizationRadius || 0} miles`);
    
    const tripId = generateTripId();
    console.log('🎯 Generated test trip ID:', tripId);
    
    testTripIdRef.current = tripId;
    setCurrentTrip(tripId);
    setTracking(true);
    setLocationQueue([]);
    setBatchCount(0);
    setTripQuality({
      totalPoints: 0,
      validPoints: 0,
      rejectedPoints: 0,
      averageAccuracy: 0,
      speedDataQuality: 0,
      stationaryPeriods: 0
    });
    setSimulationRunning(true);

    const testData = generateTestGPSData();
    console.log(`📊 Starting GPS simulation with ${testData.length} points using privacy-protected base point`);

    // Simulate GPS points every 2 seconds
    for (let i = 0; i < testData.length; i++) {
      console.log(`\n🔄 Processing point ${i + 1}/${testData.length}: ${testData[i].scenario}`);
      
      const point = testData[i];
      
      // Add realistic GPS noise
      const noise = (Math.random() - 0.5) * 0.0001;
      const accuracyNoise = 5 + Math.random() * 15;

      const simulatedPosition = {
        coords: {
          latitude: point.lat + noise,
          longitude: point.lon + noise,
          accuracy: accuracyNoise,
          speed: point.speed * 0.44704,
          speedAccuracy: 2 + Math.random() * 3,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          toJSON: function() { return this; }
        },
        timestamp: Date.now(),
        toJSON: function() { return this; }
      } as unknown as GeolocationPosition;

      console.log(`📍 Test GPS Point ${i + 1}/${testData.length}: ${point.scenario} - ${point.speed}mph`);
      
      try {
        await processLocationUpdate(simulatedPosition, testTripIdRef.current);
        console.log(`✅ Successfully processed point ${i + 1} with privacy protection`);
      } catch (error) {
        console.error(`❌ Error processing point ${i + 1}:`, error);
      }
      
      if (i < testData.length - 1) {
        console.log(`⏳ Waiting 2 seconds before next point...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`📊 Final queue length: ${locationQueue.length}`);
    setSimulationRunning(false);
    console.log('🏁 GPS simulation completed with privacy protection');
    
    // Auto-finalize the test trip
    setTimeout(async () => {
      console.log('\n🏁 ===== FINALIZING ENHANCED TEST TRIP =====');
      console.log('💾 Current trip at finalization:', currentTrip);
      console.log('🎯 Test trip ID at finalization:', testTripIdRef.current);
      
      const finalTripId = testTripIdRef.current || tripId;
      
      setLocationQueue(currentQueue => {
        console.log('📊 Actual final queue length:', currentQueue.length);
        
        if (currentQueue.length > 0 && finalTripId) {
          console.log('🚀 Uploading final batch with privacy protection...');
          uploadBatch(currentQueue, finalTripId, batchCount + 1).then(() => {
            finalizeTripOnServer(finalTripId).then(() => {
              console.log('✅ Trip finalized successfully with privacy metadata');
            });
          });
          
          return [];
        } else {
          console.log('❌ No data to finalize:', {
            queueLength: currentQueue.length,
            finalTripId,
            currentTrip
          });
          return currentQueue;
        }
      });
      
      // Reset tracking state
      setTracking(false);
      setCurrentTrip(null);
      testTripIdRef.current = null;
      console.log('🔄 Reset tracking state');
    }, 1000);
  };

  const toggleTracking = async () => {
    if (!tracking) {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by this device');
        return;
      }

      const tripId = generateTripId();
      console.log('🎯 Generated trip ID:', tripId);
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
        stationaryPeriods: 0
      });

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
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

      console.log('🚀 Started enhanced tracking with privacy protection, trip ID:', tripId);
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if (locationQueue.length > 1 && currentTrip) {
        console.log('🏁 Uploading final batch with privacy protection before stopping...');
        await uploadBatch(locationQueue, currentTrip, batchCount + 1);
        await finalizeTripOnServer(currentTrip);
      }

      setLocationQueue([]);
      setCurrentTrip(null);
      setBatchCount(0);
      setError('');
      console.log('🛑 Stopped enhanced tracking');
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

  const updatePrivacySettings = async () => {
    setUpdatingPrivacy(true);
    try {
      // Update localStorage
      const userData = JSON.parse(localStorage.getItem('privacyDriveUser') || '{}');
      userData.privacySettings = privacySettings;
      
      if (basePoint && basePoint.source !== 'fallback') {
        userData.basePoint = {
          ...basePoint,
          anonymizationRadius: privacySettings.anonymizationRadius
        };
      }
      
      localStorage.setItem('privacyDriveUser', JSON.stringify(userData));
      
      // Reload base point with new settings
      loadUserPrivacySettings();
      
      console.log('✅ Privacy settings updated:', privacySettings);
      setShowPrivacyModal(false);
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      setError('Failed to update privacy settings');
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  const geocodeStats = getGeocodeStats();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Welcome, {user?.name || 'Driver'}</IonTitle>
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
          <h2>Enhanced Privacy-Protected Trip Tracking</h2>
          <p>Your exact location is never stored. Only encrypted movement patterns with enhanced accuracy are transmitted.</p>
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
                      Source: {basePoint.source}
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
                
                <IonItem>
                  <IonLabel>
                    <h3>Data Sharing Level</h3>
                    <p>{user.privacySettings?.consentLevel || 'full'} analytics</p>
                  </IonLabel>
                </IonItem>
              </>
            )}
          </IonCardContent>
        </IonCard>

        {tracking && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle color="success">Enhanced Tracking Active</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p><strong>Trip ID:</strong> {currentTrip}</p>
              <p><strong>Points in Queue:</strong> {locationQueue.length}/{TRAJECTORY_LENGTH}</p>
              <p><strong>Batches Uploaded:</strong> {batchCount}</p>
              
              <div style={{ marginTop: '1rem' }}>
                <h4>Data Quality Metrics</h4>
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
                <p><strong>Privacy Protected:</strong> 
                  <IonChip color={basePoint?.source !== 'fallback' ? 'success' : 'warning'} style={{marginLeft: '5px'}}>
                    {basePoint?.source !== 'fallback' ? 'Yes' : 'Basic'}
                  </IonChip>
                </p>
              </div>

              {uploading && (
                <>
                  <IonLabel>Uploading enhanced batch with privacy protection...</IonLabel>
                  <IonProgressBar type="indeterminate"></IonProgressBar>
                </>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* Test Mode Section */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle color="tertiary">Test Mode (Desktop Testing)</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonLabel>
              <p>Test the enhanced GPS algorithms with simulated driving data using your privacy settings</p>
            </IonLabel>
            
            <IonButton
              fill={testMode ? "solid" : "outline"}
              color="tertiary"
              onClick={() => setTestMode(!testMode)}
              disabled={tracking || simulationRunning}
            >
              {testMode ? 'Test Mode: ON' : 'Enable Test Mode'}
            </IonButton>

            {testMode && (
              <IonButton
                expand="block"
                color="secondary"
                onClick={startTestMode}
                disabled={simulationRunning || (tracking && !testMode)}
                style={{ marginTop: '10px' }}
              >
                {simulationRunning ? 'Running Simulation...' : 'Start GPS Simulation'}
              </IonButton>
            )}

            {simulationRunning && (
              <div style={{ marginTop: '10px' }}>
                <IonLabel>Simulating realistic drive pattern with privacy protection...</IonLabel>
                <IonProgressBar type="indeterminate" color="secondary"></IonProgressBar>
              </div>
            )}
          </IonCardContent>
        </IonCard>

        <IonButton
          expand="block"
          onClick={toggleTracking}
          color={tracking ? 'danger' : 'primary'}
          disabled={uploading || simulationRunning}
        >
          {tracking ? 'Stop Enhanced Tracking' : 'Start Enhanced Tracking'}
        </IonButton>

        {/* Privacy Settings Modal */}
        <IonModal isOpen={showPrivacyModal} onDidDismiss={() => setShowPrivacyModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Privacy Settings</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowPrivacyModal(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {basePoint && (
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Current Privacy Protection</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    <IonItem>
                      <IonLabel>
                        <h3>Anonymization Center</h3>
                        <p>{basePoint.city}, {basePoint.state}</p>
                        <p style={{fontSize: '0.8em', color: 'var(--ion-color-medium)'}}>
                          Source: {basePoint.source === 'census' ? 'US Census' : 
                                   basePoint.source === 'opencage' ? 'OpenCage' :
                                   basePoint.source === 'cache' ? 'Cached' :
                                   basePoint.source === 'regional' ? 'Regional Center' : 'Fallback'}
                        </p>
                      </IonLabel>
                    </IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>
            )}

            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Adjust Privacy Settings</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList>
                  <IonItem>
                    <IonLabel>
                      <h3>Anonymization Radius</h3>
                      <p>{privacySettings.anonymizationRadius} mile{privacySettings.anonymizationRadius !== 1 ? 's' : ''}</p>
                      <p style={{fontSize: '0.8em', color: 'var(--ion-color-medium)'}}>
                        Larger radius = more privacy, potentially less accurate analytics
                      </p>
                    </IonLabel>
                  </IonItem>
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
                  />

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
                      <h3>Data Sharing Level</h3>
                      <p>
                        {privacySettings.consentLevel === 'full' ? 'Full analytics for best insurance rates' :
                         privacySettings.consentLevel === 'basic' ? 'Basic analytics only' :
                         'Minimal data sharing'}
                      </p>
                    </IonLabel>
                    <IonSelect 
                      value={privacySettings.consentLevel} 
                      onIonChange={e => setPrivacySettings(prev => ({
                        ...prev,
                        consentLevel: e.detail.value
                      }))}
                    >
                      <IonSelectOption value="full">Full Analytics</IonSelectOption>
                      <IonSelectOption value="basic">Basic Analytics</IonSelectOption>
                      <IonSelectOption value="minimal">Minimal Data</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </IonList>

                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'var(--ion-color-light)', borderRadius: '8px' }}>
                  <IonText>
                    <h4 style={{ margin: '0 0 10px 0' }}>Privacy Impact Preview:</h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9em' }}>
                      Your driving data will be anonymized within a {privacySettings.anonymizationRadius}-mile radius of {basePoint?.city || 'your city center'}.
                    </p>
                    <p style={{ margin: '0', fontSize: '0.9em' }}>
                      Data will be automatically deleted after {privacySettings.dataRetentionPeriod} month{privacySettings.dataRetentionPeriod !== 1 ? 's' : ''}.
                    </p>
                  </IonText>
                </div>

                <IonButton
                  expand="block"
                  onClick={updatePrivacySettings}
                  disabled={updatingPrivacy}
                  style={{ marginTop: '20px' }}
                >
                  {updatingPrivacy ? 'Updating...' : 'Save Privacy Settings'}
                </IonButton>
              </IonCardContent>
            </IonCard>

            {/* Cache Statistics */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Geocoding Cache Statistics</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList>
                  <IonItem>
                    <IonLabel>
                      <h3>Cached Locations</h3>
                      <p>{geocodeStats.entries} locations</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>
                      <h3>Cache Size</h3>
                      <p>{geocodeStats.size}</p>
                    </IonLabel>
                  </IonItem>
                  {geocodeStats.oldestEntry && (
                    <IonItem>
                      <IonLabel>
                        <h3>Oldest Entry</h3>
                        <p>{geocodeStats.oldestEntry}</p>
                      </IonLabel>
                    </IonItem>
                  )}
                </IonList>
                
                <IonButton
                  fill="outline"
                  color="warning"
                  onClick={() => {
                    clearGeocodingCache();
                    setShowPrivacyModal(false);
                  }}
                  style={{ marginTop: '10px' }}
                >
                  Clear Geocoding Cache
                </IonButton>
              </IonCardContent>
            </IonCard>
          </IonContent>
        </IonModal>

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