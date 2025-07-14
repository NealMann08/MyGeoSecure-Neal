// // MODERN Professional Driver Dashboard - Complete Implementation WITH DISTANCE TRACKING FIX
// import React, { useState, useRef, useEffect } from 'react';
// import {
//   IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
//   IonButton, IonText, IonAlert, IonCard, IonCardContent,
//   IonCardHeader, IonCardTitle, IonProgressBar, IonLabel,
//   IonButtons, IonIcon, IonBadge, IonChip, IonItem, IonList,
//   IonModal, IonRange, IonSelect, IonSelectOption,
//   IonInput, useIonToast, IonGrid, IonRow, IonCol
// } from '@ionic/react';
// import {
//   logOutOutline, shieldCheckmarkOutline, settingsOutline,
//   locationOutline, lockClosedOutline, alertCircleOutline,
//   speedometerOutline, timeOutline, saveOutline, closeOutline,
//   playOutline, stopOutline, trashOutline, warningOutline,
//   checkmarkCircle, informationCircle, keyOutline
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

//   // ✅ NEW: Distance tracking state variables
//   const [totalTripDistance, setTotalTripDistance] = useState(0); // Track cumulative distance in miles
//   const [lastDistancePoint, setLastDistancePoint] = useState<EnhancedLocationPoint | null>(null); // Last point for distance calc

//   // Settings Modal and Privacy Controls
//   const [showSettingsModal, setShowSettingsModal] = useState(false);
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

//   // Delete Account States - SIMPLIFIED
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [deletePassword, setDeletePassword] = useState('');
//   const [deletingAccount, setDeletingAccount] = useState(false);
//   const [deleteStep, setDeleteStep] = useState<'password' | 'confirm'>('password');

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
      
//       present({
//         message: 'Location settings updated successfully!',
//         duration: 2000,
//         color: 'success'
//       });
      
//     } catch (error) {
//       console.error('Error updating zipcode:', error);
//       setError(error instanceof Error ? error.message : 'Failed to update zipcode');
//     } finally {
//       setUpdatingPrivacy(false);
//     }
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
//       window.dispatchEvent(new CustomEvent('userDataUpdated'));
//       loadUserPrivacySettings();
      
//       console.log('✅ Privacy settings updated:', privacySettings);
      
//       present({
//         message: 'Privacy settings saved!',
//         duration: 2000,
//         color: 'success'
//       });
      
//     } catch (error) {
//       console.error('Error updating privacy settings:', error);
//       setError('Failed to update privacy settings');
//     } finally {
//       setUpdatingPrivacy(false);
//     }
//   };

//   // DELETE ACCOUNT FUNCTIONALITY - FIXED WITH MODAL
//   const handleDeleteAccountRequest = () => {
//     setDeleteStep('password');
//     setDeletePassword('');
//     setShowDeleteModal(true);
//   };

//   const handlePasswordSubmit = () => {
//     if (!deletePassword.trim()) {
//       setError('Password is required');
//       return;
//     }
//     setDeleteStep('confirm');
//   };

//   const handleDeleteAccountConfirm = async () => {
//     if (!deletePassword.trim()) {
//       setError('Password is required to delete your account');
//       return;
//     }

//     setDeletingAccount(true);
    
//     // Enhanced debug logging
//     console.log('🗑️ Delete Account Debug:', {
//       userEmail: user?.email,
//       userUserEmail: user?.user_email,
//       userId: user?.userId,
//       userUserId: user?.user_id,
//       hasPassword: !!deletePassword.trim(),
//       passwordLength: deletePassword.trim().length,
//       fullUserObject: user
//     });

//     try {
//       // Try multiple email field variations
//       const emailToUse = user?.email || user?.user_email || user?.Email || '';
//       const userIdToUse = user?.userId || user?.user_id || user?.id || '';
      
//       const requestBody = {
//         mode: 'delete_account',
//         email: emailToUse,
//         user_id: userIdToUse,
//         password: deletePassword.trim()
//       };

//       console.log('🚀 Sending delete request to:', 'https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/auth-user');
//       console.log('🚀 Request body (password hidden):', {
//         ...requestBody,
//         password: '[HIDDEN]'
//       });

//       const response = await fetch('https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/auth-user', {
//         method: 'POST',
//         headers: { 
//           'Content-Type': 'application/json',
//           'Accept': 'application/json'
//         },
//         body: JSON.stringify(requestBody)
//       });

//       console.log('📡 Delete response status:', response.status);
//       console.log('📡 Delete response headers:', Object.fromEntries(response.headers.entries()));

//       let data;
//       try {
//         const responseText = await response.text();
//         console.log('📄 Raw response text:', responseText);
//         data = JSON.parse(responseText);
//       } catch (parseError) {
//         console.error('❌ Failed to parse response as JSON:', parseError);
//         throw new Error('Invalid response from server');
//       }

//       console.log('📊 Delete response data:', data);

//       if (!response.ok) {
//         console.error('❌ Delete failed:', {
//           status: response.status,
//           statusText: response.statusText,
//           data: data
//         });
//         throw new Error(data.error || `HTTP ${response.status}: Delete failed`);
//       }

//       // Account successfully deleted
//       console.log('✅ Account deleted successfully:', data);
      
//       // Close modal
//       setShowDeleteModal(false);
      
//       present({
//         message: 'Account deleted successfully. You will be signed out.',
//         duration: 3000,
//         color: 'success'
//       });

//       // Clear local data and sign out immediately
//       localStorage.removeItem('privacyDriveUser');
      
//       // Sign out immediately to go back to signup page
//       if (onSignOut) {
//         console.log('🚪 Calling onSignOut to return to signup page');
//         onSignOut();
//       } else {
//         console.warn('⚠️ onSignOut function not available');
//       }

//     } catch (error: any) {
//       console.error('❌ Delete account error details:', {
//         error: error,
//         message: error.message,
//         stack: error.stack
//       });
      
//       const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
//       setError(errorMessage);
      
//       // Show error in toast as well
//       present({
//         message: `Delete failed: ${errorMessage}`,
//         duration: 5000,
//         color: 'danger'
//       });
//     } finally {
//       setDeletingAccount(false);
//     }
//   };

//   const cancelDeleteAccount = () => {
//     setDeletePassword('');
//     setShowDeleteModal(false);
//     setDeleteStep('password');
//     setDeletingAccount(false);
//     setError('');
//   };

//   // GPS and Trip Functions
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

//   // Helper function for accurate distance calculation
//   const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
//     const R = 3959; // Earth's radius in miles
//     const dLat = toRadians(lat2 - lat1);
//     const dLon = toRadians(lon2 - lon1);
    
//     const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//               Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
//               Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c;
//   };

//   const toRadians = (degrees: number): number => {
//     return degrees * (Math.PI / 180);
//   };

//   // ✅ UPDATED finalizeTripOnServer function - REPLACE your existing one completely:
//   const finalizeTripOnServer = async (tripId: string) => {
//     try {
//       console.log(`🏁 Finalizing real trip: ${tripId}`);
//       console.log(`📏 Total accumulated distance: ${totalTripDistance.toFixed(3)} miles`);
      
//       // ✅ CRITICAL FIX: Use accumulated distance instead of calculating from remaining queue points
//       const totalDistanceMiles = totalTripDistance; // This now contains the FULL trip distance
      
//       // Calculate actual trip duration from timestamps
//       const tripEndTime = new Date().toISOString();
//       const tripStartTime = tripQuality.tripStartTime;
//       const actualDurationMs = new Date(tripEndTime).getTime() - new Date(tripStartTime).getTime();
//       const actualDurationMinutes = Math.max(1, actualDurationMs / (1000 * 60)); // Minimum 1 minute
      
//       // Enhanced trip quality with accurate distance
//       const enhancedTripQuality = {
//         ...tripQuality,
//         // ✅ Use the accumulated distance (FULL TRIP)
//         actual_distance_miles: totalDistanceMiles,
//         actual_duration_minutes: actualDurationMinutes,
//         actual_start_timestamp: tripStartTime,
//         actual_end_timestamp: tripEndTime,
        
//         // iPhone GPS accuracy metrics
//         gps_max_speed_mph: tripQuality.maxSpeed,
//         gps_avg_speed_mph: tripQuality.avgSpeed,
//         gps_current_speed_mph: tripQuality.currentSpeed,
        
//         // Quality indicators
//         total_gps_points: tripQuality.totalPoints,
//         valid_gps_points: tripQuality.validPoints,
//         gps_accuracy_avg: tripQuality.averageAccuracy,
        
//         // Privacy protection status
//         privacy_protected: basePoint?.source !== 'fallback',
//         base_point_city: basePoint?.city,
//         anonymization_radius: basePoint?.anonymizationRadius,
        
//         // Metadata for analysis
//         use_gps_metrics: true, // Flag to use iPhone GPS data over reconstructed
//         data_source: 'iphone_gps_realtime_accumulation', // Updated to reflect new method
//         distance_calculation_method: 'realtime_accumulation', // New field
//         remaining_queue_points: locationQueue.length // For debugging
//       };
      
//       const response = await fetch('https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/finalize-trip', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           user_id: user.userId,
//           trip_id: tripId,
//           start_timestamp: tripStartTime,
//           end_timestamp: tripEndTime,
//           trip_quality: enhancedTripQuality
//         })
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to finalize trip: ${response.status}`);
//       }

//       console.log('✅ Trip finalized successfully with ACCURATE distance tracking');
//       console.log(`📊 Final Stats - Distance: ${totalDistanceMiles.toFixed(3)} miles, Duration: ${actualDurationMinutes.toFixed(1)} minutes`);
//       console.log(`📈 Average Speed: ${totalDistanceMiles > 0 ? ((totalDistanceMiles / actualDurationMinutes) * 60).toFixed(1) : 0} mph`);
//     } catch (err) {
//       console.error('❌ Failed to finalize trip:', err);
//     }
//   };

//   // ✅ UPDATED processLocationUpdate function - REPLACE your existing one completely:
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

//     const lastValidPoint = locationQueue.length > 0 ? locationQueue[locationQueue.length - 1] : undefined;
//     const isValid = validateGPSPoint(newPoint, lastValidPoint);
//     newPoint.isValid = isValid;

//     // ✅ CRITICAL FIX: Accumulate distance throughout entire trip
//     if (isValid && lastDistancePoint) {
//       const segmentDistance = calculateHaversineDistance(
//         lastDistancePoint.latitude, lastDistancePoint.longitude,
//         newPoint.latitude, newPoint.longitude
//       );
      
//       // Filter out GPS noise - only add reasonable distances
//       if (segmentDistance >= 0.001 && segmentDistance <= 0.5) { // 0.001 to 0.5 miles per GPS update
//         setTotalTripDistance(prev => {
//           const newTotal = prev + segmentDistance;
//           console.log(`📏 Distance segment: ${(segmentDistance * 5280).toFixed(1)}ft, Total: ${newTotal.toFixed(3)} miles`);
//           return newTotal;
//         });
//       } else if (segmentDistance > 0.5) {
//         console.log(`⚠️ Large GPS jump rejected: ${segmentDistance.toFixed(3)} miles (likely GPS error)`);
//       }
//     }

//     // Update last distance point for next calculation (only if valid)
//     if (isValid) {
//       setLastDistancePoint(newPoint);
//     }

//     // Update trip quality metrics (existing code)
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

//     if (!isValid) return;

//     // Existing queue management (unchanged)
//     setLocationQueue(prevQueue => {
//       const updatedQueue = [...prevQueue, newPoint];

//       if (updatedQueue.length >= TRAJECTORY_LENGTH) {
//         const batchToUpload = updatedQueue.slice(0, TRAJECTORY_LENGTH);
//         const remainingQueue = updatedQueue.slice(TRAJECTORY_LENGTH);

//         if (currentTrip) {
//           uploadBatch(batchToUpload, currentTrip, batchCount + 1);
//           setBatchCount(prev => prev + 1);
//         }

//         return remainingQueue;
//       }

//       return updatedQueue;
//     });

//     setError('');
//   };

//   // ✅ UPDATED toggleTracking function - REPLACE your existing one completely:
//   const toggleTracking = async () => {
//     if (!tracking) {
//       if (!navigator.geolocation) {
//         setError('Geolocation is not supported by this device');
//         return;
//       }

//       const tripId = generateTripId();
//       setCurrentTrip(tripId);
//       setLocationQueue([]);
//       setBatchCount(0);
      
//       // ✅ CRITICAL FIX: Reset distance tracking for new trip
//       setTotalTripDistance(0);
//       setLastDistancePoint(null);
      
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

//       const options = {
//         enableHighAccuracy: true,
//         timeout: 15000,
//         maximumAge: 2000
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

//       console.log(`🚗 Started tracking trip ${tripId} with distance monitoring`);
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
//         console.log('🏁 Uploading final batch and finalizing trip...');
//         await uploadBatch(locationQueue, currentTrip, batchCount + 1);
//         await finalizeTripOnServer(currentTrip);
//       }

//       // Reset all state
//       setLocationQueue([]);
//       setCurrentTrip(null);
//       setBatchCount(0);
//       setError('');
      
//       // Reset distance tracking
//       setTotalTripDistance(0);
//       setLastDistancePoint(null);
      
//       console.log('🛑 Stopped tracking');
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

//   // Utility Functions
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
//         <IonToolbar color="light">
//           <IonTitle style={{ color: '#2c3e50', fontWeight: '600' }}>
//             Driver Dashboard - {user?.name || 'Driver'}
//           </IonTitle>
//           <IonButtons slot="end">
//             <IonButton fill="clear" onClick={() => setShowSettingsModal(true)} style={{ color: '#6c757d' }}>
//               <IonIcon icon={settingsOutline} />
//             </IonButton>
//             <IonButton fill="clear" onClick={handleSignOut} style={{ color: '#6c757d' }}>
//               <IonIcon icon={logOutOutline} />
//               <IonLabel style={{ marginLeft: '4px' }}>Sign Out</IonLabel>
//             </IonButton>
//           </IonButtons>
//         </IonToolbar>
//       </IonHeader>

//       <IonContent style={{ '--background': '#f8f9fa' }}>
//         <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
          
//           {/* Welcome Section */}
//           <div style={{
//             backgroundColor: 'white',
//             borderRadius: '12px',
//             padding: '24px',
//             marginBottom: '20px',
//             boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//             border: '1px solid #e9ecef'
//           }}>
//             <h2 style={{ margin: '0 0 8px 0', color: '#2c3e50', fontSize: '1.5rem', fontWeight: '600' }}>
//               🚗 Privacy-Protected Driving Analysis
//             </h2>
//             <p style={{ margin: '0', color: '#6c757d', fontSize: '1rem' }}>
//               Test your driving behavior with real GPS data. Your exact location is never stored - only encrypted movement patterns for insurance analysis.
//             </p>
//           </div>

//           {error && (
//             <div style={{
//               backgroundColor: '#fff5f5',
//               border: '1px solid #feb2b2',
//               borderRadius: '12px',
//               padding: '16px',
//               marginBottom: '20px',
//               color: '#c53030'
//             }}>
//               <IonIcon icon={warningOutline} style={{ marginRight: '8px' }} />
//               {error}
//             </div>
//           )}

//           {/* Privacy Status */}
//           <div style={{
//             backgroundColor: 'white',
//             borderRadius: '12px',
//             padding: '24px',
//             marginBottom: '20px',
//             boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//             border: '1px solid #e9ecef'
//           }}>
//             <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
//               <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: '1.5rem', marginRight: '12px', color: '#28a745' }} />
//               <h3 style={{ margin: '0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
//                 Privacy Protection Status
//               </h3>
//               <div style={{
//                 marginLeft: 'auto',
//                 padding: '4px 12px',
//                 backgroundColor: getPrivacyStatusColor() === 'success' ? '#d4edda' : '#fff3cd',
//                 color: getPrivacyStatusColor() === 'success' ? '#155724' : '#856404',
//                 borderRadius: '20px',
//                 fontSize: '0.85rem',
//                 fontWeight: '600'
//               }}>
//                 {basePoint?.source === 'fallback' ? 'Basic Protection' : 'Enhanced Protection'}
//               </div>
//             </div>
            
//             {basePoint && (
//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
//                 <div>
//                   <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Anonymization Center</div>
//                   <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>
//                     {basePoint.city}, {basePoint.state}
//                   </div>
//                   <div style={{ color: '#6c757d', fontSize: '0.8rem' }}>
//                     Source: {basePoint.source === 'zippopotam' ? 'Verified API' : basePoint.source}
//                   </div>
//                 </div>
//                 <div>
//                   <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Privacy Radius</div>
//                   <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>
//                     {basePoint.anonymizationRadius || 0} miles
//                   </div>
//                   <div style={{ color: '#6c757d', fontSize: '0.8rem' }}>
//                     Location anonymization range
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Trip Tracking Controls */}
//           <div style={{
//             backgroundColor: 'white',
//             borderRadius: '12px',
//             padding: '24px',
//             marginBottom: '20px',
//             boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//             border: '1px solid #e9ecef'
//           }}>
//             <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
//               Driving Test Controls
//             </h3>
            
//             <IonButton
//               expand="block"
//               onClick={toggleTracking}
//               disabled={uploading}
//               style={{
//                 '--background': tracking ? '#dc3545' : '#007bff',
//                 '--color': 'white',
//                 '--border-radius': '12px',
//                 '--padding-top': '16px',
//                 '--padding-bottom': '16px',
//                 fontSize: '1.1rem',
//                 fontWeight: '600',
//                 marginBottom: '16px'
//               }}
//             >
//               <IonIcon icon={tracking ? stopOutline : playOutline} slot="start" />
//               {tracking ? 'Stop Driving Test' : 'Start Driving Test'}
//             </IonButton>
            
//             {!tracking && (
//               <div style={{
//                 padding: '16px',
//                 backgroundColor: '#f8f9fa',
//                 borderRadius: '8px',
//                 fontSize: '0.9rem',
//                 color: '#6c757d',
//                 textAlign: 'center'
//               }}>
//                 <p style={{ margin: '0 0 8px 0', fontWeight: '500', color: '#495057' }}>
//                   📱 Testing Instructions
//                 </p>
//                 <p style={{ margin: '0' }}>
//                   Start tracking before driving. The app analyzes speed consistency, acceleration patterns, 
//                   and turning behavior while protecting your privacy through location anonymization.
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* Active Trip Status */}
//           {tracking && (
//             <div style={{
//               backgroundColor: 'white',
//               borderRadius: '12px',
//               padding: '24px',
//               marginBottom: '20px',
//               boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//               border: '2px solid #28a745'
//             }}>
//               <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
//                 <div style={{
//                   width: '12px',
//                   height: '12px',
//                   backgroundColor: '#28a745',
//                   borderRadius: '50%',
//                   marginRight: '12px',
//                   animation: 'pulse 2s infinite'
//                 }}></div>
//                 <h3 style={{ margin: '0', color: '#28a745', fontSize: '1.2rem', fontWeight: '600' }}>
//                   🚗 Trip Active - {currentTrip?.slice(-8)}
//                 </h3>
//               </div>

//               {/* ✅ NEW: Real-time distance display */}
//               <div style={{ textAlign: 'center', marginBottom: '16px' }}>
//                 <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Trip Distance</div>
//                 <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#007bff' }}>
//                   {totalTripDistance.toFixed(2)} miles
//                 </div>
//                 <div style={{ color: '#6c757d', fontSize: '0.8rem' }}>
//                   ({(totalTripDistance * 1.60934).toFixed(2)} km)
//                 </div>
//               </div>

//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '20px' }}>
//                 <div style={{ textAlign: 'center' }}>
//                   <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Duration</div>
//                   <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#2c3e50' }}>{getTripDuration()}</div>
//                 </div>
//                 <div style={{ textAlign: 'center' }}>
//                   <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Current Speed</div>
//                   <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#2c3e50' }}>{tripQuality.currentSpeed.toFixed(1)} mph</div>
//                 </div>
//                 <div style={{ textAlign: 'center' }}>
//                   <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Max Speed</div>
//                   <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#2c3e50' }}>{tripQuality.maxSpeed.toFixed(1)} mph</div>
//                 </div>
//                 <div style={{ textAlign: 'center' }}>
//                   <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>GPS Quality</div>
//                   <div style={{ fontSize: '1.4rem', fontWeight: '700', color: getQualityColor(getDataQualityScore()) === 'success' ? '#28a745' : getQualityColor(getDataQualityScore()) === 'warning' ? '#ffc107' : '#dc3545' }}>
//                     {Math.round(getDataQualityScore() * 100)}%
//                   </div>
//                 </div>
//               </div>

//               <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
//                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
//                   <div><strong>GPS Points:</strong> {locationQueue.length}/{TRAJECTORY_LENGTH}</div>
//                   <div><strong>Batches:</strong> {batchCount}</div>
//                   <div><strong>Total Points:</strong> {tripQuality.totalPoints}</div>
//                   <div><strong>Valid Points:</strong> {tripQuality.validPoints}</div>
//                   <div><strong>Rejected:</strong> {tripQuality.rejectedPoints}</div>
//                   {tripQuality.averageAccuracy > 0 && (
//                     <div><strong>Accuracy:</strong> {tripQuality.averageAccuracy.toFixed(1)}m</div>
//                   )}
//                 </div>
//               </div>

//               {uploading && (
//                 <div style={{ marginTop: '16px' }}>
//                   <div style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '8px' }}>
//                     Uploading batch with privacy protection...
//                   </div>
//                   <IonProgressBar type="indeterminate" style={{ '--background': '#e9ecef' }}></IonProgressBar>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Testing Scenarios */}
//           <div style={{
//             backgroundColor: 'white',
//             borderRadius: '12px',
//             padding: '24px',
//             boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//             border: '1px solid #e9ecef'
//           }}>
//             <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
//               🎯 Testing Scenarios
//             </h3>
            
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
//               <div style={{ padding: '16px', backgroundColor: '#e8f5e8', borderRadius: '8px', border: '1px solid #c3e6c3' }}>
//                 <h4 style={{ margin: '0 0 8px 0', color: '#155724', fontSize: '1rem', fontWeight: '600' }}>
//                   🛣️ Highway Driving
//                 </h4>
//                 <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#155724' }}>
//                   Steady speeds, minimal lane changes
//                 </p>
//                 <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
//                   <strong>Expected Score:</strong> 80-95
//                 </div>
//               </div>
              
//               <div style={{ padding: '16px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
//                 <h4 style={{ margin: '0 0 8px 0', color: '#856404', fontSize: '1rem', fontWeight: '600' }}>
//                   🏙️ City Driving
//                 </h4>
//                 <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#856404' }}>
//                   Stop and go, normal acceleration
//                 </p>
//                 <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
//                   <strong>Expected Score:</strong> 65-80
//                 </div>
//               </div>
              
//               <div style={{ padding: '16px', backgroundColor: '#f8d7da', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
//                 <h4 style={{ margin: '0 0 8px 0', color: '#721c24', fontSize: '1rem', fontWeight: '600' }}>
//                   ⚡ Aggressive Test
//                 </h4>
//                 <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#721c24' }}>
//                   Rapid speed changes, hard braking
//                 </p>
//                 <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
//                   <strong>Expected Score:</strong> 30-60
//                 </div>
//               </div>
//             </div>
            
//             <div style={{
//               marginTop: '16px',
//               padding: '12px',
//               backgroundColor: '#d1ecf1',
//               borderRadius: '6px',
//               fontSize: '0.85rem',
//               color: '#0c5460'
//             }}>
//               <IonIcon icon={informationCircle} style={{ marginRight: '6px' }} />
//               <strong>Tip:</strong> Drive for at least 2-3 minutes to generate enough data for accurate analysis.
//             </div>
//           </div>

//         </div>

//         {/* MODERN Settings Modal with Delete Account */}
//         <IonModal isOpen={showSettingsModal} onDidDismiss={() => setShowSettingsModal(false)}>
//           <IonHeader>
//             <IonToolbar color="light">
//               <IonTitle style={{ color: '#2c3e50', fontWeight: '600' }}>
//                 Account Settings
//               </IonTitle>
//               <IonButtons slot="end">
//                 <IonButton fill="clear" onClick={() => setShowSettingsModal(false)} style={{ color: '#6c757d' }}>
//                   <IonIcon icon={closeOutline} />
//                 </IonButton>
//               </IonButtons>
//             </IonToolbar>
//           </IonHeader>
          
//           <IonContent style={{ '--background': '#f8f9fa' }}>
//             <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>

//               {/* Account Information */}
//               <div style={{
//                 backgroundColor: 'white',
//                 borderRadius: '12px',
//                 padding: '24px',
//                 marginBottom: '20px',
//                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//                 border: '1px solid #e9ecef'
//               }}>
//                 <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
//                   <IonIcon icon={informationCircle} style={{ marginRight: '8px' }} />
//                   Account Information
//                 </h3>
                
//                 <div style={{ display: 'grid', gap: '12px' }}>
//                   <div>
//                     <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Name</div>
//                     <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>{user?.name || 'Not set'}</div>
//                   </div>
//                   <div>
//                     <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Email</div>
//                     <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>{user?.email || 'Not set'}</div>
//                   </div>
//                   <div>
//                     <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Role</div>
//                     <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>Driver</div>
//                   </div>
//                 </div>
//               </div>

//               {/* Location Settings */}
//               <div style={{
//                 backgroundColor: 'white',
//                 borderRadius: '12px',
//                 padding: '24px',
//                 marginBottom: '20px',
//                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//                 border: '1px solid #e9ecef'
//               }}>
//                 <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
//                   <IonIcon icon={locationOutline} style={{ marginRight: '8px' }} />
//                   Location Settings
//                 </h3>
                
//                 {!editingZipcode ? (
//                   <div>
//                     <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
//                       <div>
//                         <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Current Zipcode</div>
//                         <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>{user.zipcode || 'Not set'}</div>
//                       </div>
//                       {basePoint && (
//                         <div>
//                           <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Privacy Center</div>
//                           <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>
//                             {basePoint.city}, {basePoint.state}
//                           </div>
//                           <div style={{ color: '#6c757d', fontSize: '0.8rem' }}>
//                             Source: {basePoint.source}
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                     <IonButton
//                       fill="outline"
//                       onClick={startEditingZipcode}
//                       style={{ '--border-color': '#007bff', '--color': '#007bff' }}
//                     >
//                       Edit Location
//                     </IonButton>
//                   </div>
//                 ) : (
//                   <div>
//                     <div style={{ marginBottom: '16px' }}>
//                       <IonInput
//                         placeholder="Enter new zipcode (e.g., 94583)"
//                         value={newZipcode}
//                         onIonInput={e => setNewZipcode(e.detail.value!)}
//                         disabled={updatingPrivacy || geocodingNewZipcode}
//                         clearInput
//                         style={{
//                           '--border-radius': '8px',
//                           '--border-color': '#dee2e6',
//                           '--padding-start': '12px',
//                           '--padding-end': '12px',
//                           '--background': 'white'
//                         }}
//                       />
//                       {newZipcodeValid === true && (
//                         <div style={{ color: '#28a745', fontSize: '0.8rem', marginTop: '4px' }}>
//                           <IonIcon icon={checkmarkCircle} style={{ marginRight: '4px' }} />
//                           Valid zipcode
//                         </div>
//                       )}
//                       {newZipcodeValid === false && (
//                         <div style={{ color: '#dc3545', fontSize: '0.8rem', marginTop: '4px' }}>
//                           <IonIcon icon={alertCircleOutline} style={{ marginRight: '4px' }} />
//                           Invalid zipcode format
//                         </div>
//                       )}
//                     </div>

//                     {geocodingNewZipcode && (
//                       <div style={{ marginBottom: '16px' }}>
//                         <div style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '8px' }}>
//                           Verifying new location...
//                         </div>
//                         <IonProgressBar type="indeterminate" />
//                       </div>
//                     )}

//                     {newBasePoint && (
//                       <div style={{
//                         marginBottom: '16px',
//                         padding: '12px',
//                         backgroundColor: '#d4edda',
//                         borderRadius: '6px',
//                         color: '#155724'
//                       }}>
//                         <IonIcon icon={checkmarkCircle} style={{ marginRight: '6px' }} />
//                         New location: {newBasePoint.city}, {newBasePoint.state}
//                       </div>
//                     )}

//                     <div style={{ display: 'flex', gap: '10px' }}>
//                       <IonButton
//                         fill="outline"
//                         onClick={cancelEditingZipcode}
//                         disabled={updatingPrivacy}
//                         style={{ '--border-color': '#6c757d', '--color': '#6c757d' }}
//                       >
//                         Cancel
//                       </IonButton>
//                       <IonButton
//                         onClick={updateZipcodeAndPrivacy}
//                         disabled={!newBasePoint || updatingPrivacy}
//                         style={{ '--background': '#007bff' }}
//                       >
//                         {updatingPrivacy ? 'Updating...' : 'Save Location'}
//                       </IonButton>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Privacy Settings */}
//               <div style={{
//                 backgroundColor: 'white',
//                 borderRadius: '12px',
//                 padding: '24px',
//                 marginBottom: '20px',
//                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//                 border: '1px solid #e9ecef'
//               }}>
//                 <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
//                   <IonIcon icon={lockClosedOutline} style={{ marginRight: '8px' }} />
//                   Privacy Settings
//                 </h3>
                
//                 <div style={{ marginBottom: '20px' }}>
//                   <div style={{ marginBottom: '12px' }}>
//                     <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '8px' }}>
//                       Anonymization Radius: {privacySettings.anonymizationRadius} mile{privacySettings.anonymizationRadius !== 1 ? 's' : ''}
//                     </div>
//                     <IonRange
//                       min={1}
//                       max={50}
//                       value={privacySettings.anonymizationRadius}
//                       onIonChange={e => setPrivacySettings(prev => ({ 
//                         ...prev, 
//                         anonymizationRadius: e.detail.value as number 
//                       }))}
//                       pin={true}
//                       snaps={true}
//                       disabled={updatingPrivacy}
//                     />
//                   </div>

//                   <div style={{ marginBottom: '12px' }}>
//                     <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '8px' }}>Data Retention Period</div>
//                     <IonSelect
//                       value={privacySettings.dataRetentionPeriod}
//                       onIonChange={e => setPrivacySettings(prev => ({ 
//                         ...prev, 
//                         dataRetentionPeriod: e.detail.value 
//                       }))}
//                       disabled={updatingPrivacy}
//                       style={{
//                         '--border-radius': '8px',
//                         '--border-color': '#dee2e6',
//                         '--padding-start': '12px',
//                         '--background': 'white'
//                       }}
//                     >
//                       <IonSelectOption value={1}>1 Month</IonSelectOption>
//                       <IonSelectOption value={3}>3 Months</IonSelectOption>
//                       <IonSelectOption value={6}>6 Months</IonSelectOption>
//                       <IonSelectOption value={12}>1 Year</IonSelectOption>
//                       <IonSelectOption value={24}>2 Years</IonSelectOption>
//                     </IonSelect>
//                   </div>

//                   <div style={{ marginBottom: '12px' }}>
//                     <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '8px' }}>Consent Level</div>
//                     <IonSelect
//                       value={privacySettings.consentLevel}
//                       onIonChange={e => setPrivacySettings(prev => ({ 
//                         ...prev, 
//                         consentLevel: e.detail.value 
//                       }))}
//                       disabled={updatingPrivacy}
//                       style={{
//                         '--border-radius': '8px',
//                         '--border-color': '#dee2e6',
//                         '--padding-start': '12px',
//                         '--background': 'white'
//                       }}
//                     >
//                       <IonSelectOption value="full">Full Analytics</IonSelectOption>
//                       <IonSelectOption value="basic">Basic Analytics</IonSelectOption>
//                       <IonSelectOption value="minimal">Minimal Data</IonSelectOption>
//                     </IonSelect>
//                   </div>
//                 </div>

//                 <IonButton
//                   expand="block"
//                   onClick={updatePrivacySettings}
//                   disabled={updatingPrivacy}
//                   style={{ '--background': '#007bff', '--border-radius': '8px' }}
//                 >
//                   <IonIcon icon={saveOutline} slot="start" />
//                   {updatingPrivacy ? 'Saving...' : 'Save Privacy Settings'}
//                 </IonButton>
//               </div>

//               {/* Account Management - DELETE ACCOUNT */}
//               <div style={{
//                 backgroundColor: 'white',
//                 borderRadius: '12px',
//                 padding: '24px',
//                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//                 border: '1px solid #e9ecef'
//               }}>
//                 <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
//                   <IonIcon icon={keyOutline} style={{ marginRight: '8px' }} />
//                   Account Management
//                 </h3>
                
//                 <div style={{
//                   padding: '16px',
//                   backgroundColor: '#fff5f5',
//                   borderRadius: '8px',
//                   border: '1px solid #feb2b2',
//                   marginBottom: '16px'
//                 }}>
//                   <h4 style={{ margin: '0 0 8px 0', color: '#c53030', fontSize: '1rem', fontWeight: '600' }}>
//                     ⚠️ Delete Account
//                   </h4>
//                   <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#721c24' }}>
//                     Permanently delete your account and all associated driving data. This action cannot be undone.
//                   </p>
//                   <ul style={{ margin: '0 0 12px 0', paddingLeft: '20px', fontSize: '0.8rem', color: '#721c24' }}>
//                     <li>All trip data will be permanently removed</li>
//                     <li>Privacy settings and location data will be deleted</li>
//                     <li>You will need to create a new account to use the service again</li>
//                   </ul>
//                 </div>

//                 <IonButton
//                   expand="block"
//                   fill="outline"
//                   onClick={handleDeleteAccountRequest}
//                   disabled={deletingAccount}
//                   style={{
//                     '--border-color': '#dc3545',
//                     '--color': '#dc3545',
//                     '--border-radius': '8px'
//                   }}
//                 >
//                   <IonIcon icon={trashOutline} slot="start" />
//                   Delete My Account
//                 </IonButton>
//               </div>

//               {/* Privacy Impact Summary */}
//               <div style={{
//                 backgroundColor: 'white',
//                 borderRadius: '12px',
//                 padding: '24px',
//                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//                 border: '1px solid #e9ecef'
//               }}>
//                 <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
//                   Privacy Impact Summary
//                 </h3>
                
//                 <div style={{ fontSize: '0.9rem', color: '#495057' }}>
//                   <p style={{ margin: '0 0 12px 0' }}><strong>Current Protection:</strong></p>
//                   <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px' }}>
//                     <li>Your exact location is never stored</li>
//                     <li>Data is anonymized within {privacySettings.anonymizationRadius} miles of {basePoint?.city || 'your area'}</li>
//                     <li>Data retention: {privacySettings.dataRetentionPeriod} months</li>
//                     <li>Analytics level: {privacySettings.consentLevel}</li>
//                   </ul>
                  
//                   <p style={{ fontSize: '0.85rem', color: '#6c757d', margin: '0' }}>
//                     <strong>How it works:</strong> Your phone calculates movement differences, then shifts them 
//                     to a random point near {basePoint?.city || 'your city'}. Service providers see driving patterns 
//                     but never your actual routes or destinations.
//                   </p>
//                 </div>
//               </div>

//               {/* Geocoding Cache Stats */}
//               {geocodeStats.entries > 0 && (
//                 <div style={{
//                   backgroundColor: 'white',
//                   borderRadius: '12px',
//                   padding: '24px',
//                   boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//                   border: '1px solid #e9ecef'
//                 }}>
//                   <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
//                     Cache Statistics
//                   </h3>
                  
//                   <div style={{ fontSize: '0.9rem', color: '#495057' }}>
//                     <p style={{ margin: '0 0 8px 0' }}><strong>Cached Locations:</strong> {geocodeStats.entries}</p>
//                     <p style={{ margin: '0 0 8px 0' }}><strong>Cache Size:</strong> {geocodeStats.size}</p>
//                     {geocodeStats.oldestEntry && (
//                       <p style={{ margin: '0' }}><strong>Oldest Entry:</strong> {geocodeStats.oldestEntry}</p>
//                     )}
//                   </div>
//                 </div>
//               )}

//             </div>
//           </IonContent>
//         </IonModal>

//         {/* FIXED Delete Account Modal - No More IonAlert Issues */}
//         <IonModal isOpen={showDeleteModal} onDidDismiss={cancelDeleteAccount}>
//           <IonHeader>
//             <IonToolbar color="danger">
//               <IonTitle style={{ color: 'white', fontWeight: '600' }}>
//                 {deleteStep === 'password' ? 'Delete Account' : 'Final Confirmation'}
//               </IonTitle>
//               <IonButtons slot="end">
//                 <IonButton fill="clear" onClick={cancelDeleteAccount} style={{ color: 'white' }}>
//                   <IonIcon icon={closeOutline} />
//                 </IonButton>
//               </IonButtons>
//             </IonToolbar>
//           </IonHeader>
          
//           <IonContent style={{ '--background': '#f8f9fa' }}>
//             <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>

//               {deleteStep === 'password' && (
//                 <div>
//                   <div style={{
//                     backgroundColor: '#fff5f5',
//                     border: '1px solid #feb2b2',
//                     borderRadius: '12px',
//                     padding: '20px',
//                     marginBottom: '20px'
//                   }}>
//                     <h3 style={{ margin: '0 0 12px 0', color: '#c53030', fontSize: '1.2rem', fontWeight: '600' }}>
//                       ⚠️ Account Deletion
//                     </h3>
//                     <p style={{ margin: '0 0 12px 0', color: '#721c24', fontSize: '0.95rem' }}>
//                       This action is <strong>permanent and cannot be undone</strong>. All your driving data will be permanently deleted.
//                     </p>
//                     <ul style={{ margin: '0', paddingLeft: '20px', color: '#721c24', fontSize: '0.9rem' }}>
//                       <li>All trip data will be permanently removed</li>
//                       <li>Privacy settings and location data will be deleted</li>
//                       <li>You will need to create a new account to use the service again</li>
//                     </ul>
//                   </div>

//                   <div style={{
//                     backgroundColor: 'white',
//                     borderRadius: '12px',
//                     padding: '20px',
//                     border: '1px solid #e9ecef'
//                   }}>
//                     <h4 style={{ margin: '0 0 16px 0', color: '#2c3e50' }}>
//                       Enter your password to continue:
//                     </h4>
                    
//                     <IonInput
//                       type="password"
//                       placeholder="Enter your password"
//                       value={deletePassword}
//                       onIonInput={e => setDeletePassword(e.detail.value!)}
//                       style={{
//                         '--border-radius': '8px',
//                         '--border-color': '#dee2e6',
//                         '--padding-start': '12px',
//                         '--padding-end': '12px',
//                         '--background': 'white',
//                         marginBottom: '20px'
//                       }}
//                     />

//                     <div style={{ display: 'flex', gap: '10px' }}>
//                       <IonButton
//                         expand="block"
//                         fill="outline"
//                         onClick={cancelDeleteAccount}
//                         style={{ '--border-color': '#6c757d', '--color': '#6c757d' }}
//                       >
//                         Cancel
//                       </IonButton>
//                       <IonButton
//                         expand="block"
//                         onClick={handlePasswordSubmit}
//                         disabled={!deletePassword.trim()}
//                         style={{ '--background': '#dc3545' }}
//                       >
//                         Continue
//                       </IonButton>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {deleteStep === 'confirm' && (
//                 <div>
//                   <div style={{
//                     backgroundColor: '#fff5f5',
//                     border: '2px solid #dc3545',
//                     borderRadius: '12px',
//                     padding: '20px',
//                     marginBottom: '20px',
//                     textAlign: 'center'
//                   }}>
//                     <h3 style={{ margin: '0 0 16px 0', color: '#c53030', fontSize: '1.3rem', fontWeight: '700' }}>
//                       ⚠️ FINAL CONFIRMATION
//                     </h3>
//                     <p style={{ margin: '0 0 16px 0', color: '#721c24', fontSize: '1rem', fontWeight: '600' }}>
//                       Are you absolutely sure you want to delete your account for:
//                     </p>
//                     <div style={{
//                       backgroundColor: 'white',
//                       padding: '12px',
//                       borderRadius: '6px',
//                       border: '1px solid #dc3545',
//                       margin: '0 0 16px 0'
//                     }}>
//                       <strong style={{ color: '#dc3545', fontSize: '1.1rem' }}>
//                         {user?.email || user?.name || 'this user'}
//                       </strong>
//                     </div>
//                     <p style={{ margin: '0', color: '#721c24', fontSize: '0.9rem' }}>
//                       This action is <strong>permanent and cannot be undone</strong>.
//                     </p>
//                   </div>

//                   <div style={{ display: 'flex', gap: '10px' }}>
//                     <IonButton
//                       expand="block"
//                       fill="outline"
//                       onClick={() => setDeleteStep('password')}
//                       disabled={deletingAccount}
//                       style={{ '--border-color': '#6c757d', '--color': '#6c757d' }}
//                     >
//                       Back
//                     </IonButton>
//                     <IonButton
//                       expand="block"
//                       onClick={handleDeleteAccountConfirm}
//                       disabled={deletingAccount}
//                       style={{ '--background': '#dc3545' }}
//                     >
//                       {deletingAccount ? (
//                         <>
//                           <IonIcon icon={timeOutline} slot="start" />
//                           Deleting...
//                         </>
//                       ) : (
//                         <>
//                           <IonIcon icon={trashOutline} slot="start" />
//                           Yes, Delete Forever
//                         </>
//                       )}
//                     </IonButton>
//                   </div>
//                 </div>
//               )}

//             </div>
//           </IonContent>
//         </IonModal>

//         {/* GPS Error Alert */}
//         <IonAlert
//           isOpen={showAlert}
//           onDidDismiss={() => setShowAlert(false)}
//           header="GPS Error"
//           message={error}
//           buttons={['OK']}
//         />

//         {/* CSS for pulse animation */}
//         <style>{`
//           @keyframes pulse {
//             0% { opacity: 1; }
//             50% { opacity: 0.5; }
//             100% { opacity: 1; }
//           }
//         `}</style>
//       </IonContent>
//     </IonPage>
//   );
// };

// export default DriverHome;

// COMPLETE FIXED Professional Driver Dashboard - GPS AND DELTA TRACKING IMPLEMENTATION
import React, { useState, useRef, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonText, IonAlert, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonProgressBar, IonLabel,
  IonButtons, IonIcon, IonBadge, IonChip, IonItem, IonList,
  IonModal, IonRange, IonSelect, IonSelectOption,
  IonInput, useIonToast, IonGrid, IonRow, IonCol
} from '@ionic/react';
import {
  logOutOutline, shieldCheckmarkOutline, settingsOutline,
  locationOutline, lockClosedOutline, alertCircleOutline,
  speedometerOutline, timeOutline, saveOutline, closeOutline,
  playOutline, stopOutline, trashOutline, warningOutline,
  checkmarkCircle, informationCircle, keyOutline
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

// ============ TEST MODE CODE - REMOVE FOR PRODUCTION ============
interface TestGPSPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number; // m/s
  timestamp: string;
}

class GPSTestDataGenerator {
  private baseLatitude: number;
  private baseLongitude: number;
  private currentTime: Date;
  
  constructor(userBasePoint: any) {
    this.baseLatitude = userBasePoint.latitude;
    this.baseLongitude = userBasePoint.longitude;
    this.currentTime = new Date();
  }

  generateRealisticTrip(): TestGPSPoint[] {
    console.log('🧪 GENERATING FIXED 15-MINUTE TEST TRIP');
    
    const testPoints: TestGPSPoint[] = [];
    let currentLat = this.baseLatitude;
    let currentLon = this.baseLongitude;
    let currentSpeed = 0;
    
    const segments = [
      { 
        duration: 180,
        speedPattern: 'gentle_acceleration',
        targetSpeed: 25,
        description: 'Residential streets - gentle acceleration'
      },
      {
        duration: 180,
        speedPattern: 'normal_driving',
        targetSpeed: 45,
        description: 'Arterial roads - normal acceleration'
      },
      {
        duration: 240,
        speedPattern: 'highway_merge',
        targetSpeed: 65,
        description: 'Highway merge - 2 harsh accelerations'
      },
      {
        duration: 120,
        speedPattern: 'cruise_control',
        targetSpeed: 65,
        description: 'Highway cruise - very consistent speed'
      },
      {
        duration: 180,
        speedPattern: 'exit_and_stop',
        targetSpeed: 0,
        description: 'Highway exit - 1 hard braking event'
      }
    ];
    
    let totalSeconds = 0;
    
    for (const segment of segments) {
      console.log(`📍 Segment: ${segment.description}`);
      
      const segmentPoints = this.generateSegment(
        currentLat,
        currentLon,
        currentSpeed,
        segment,
        totalSeconds
      );
      
      testPoints.push(...segmentPoints);
      
      if (segmentPoints.length > 0) {
        const lastPoint = segmentPoints[segmentPoints.length - 1];
        currentLat = lastPoint.latitude;
        currentLon = lastPoint.longitude;
        currentSpeed = lastPoint.speed * 2.237;
      }
      
      totalSeconds += segment.duration;
    }
    
    console.log(`✅ Generated ${testPoints.length} GPS points for 15-minute trip`);
    console.log(`📏 Expected distance: ~8.0 miles`);
    console.log(`⚠️ Expected harsh events: 3 (2 accel + 1 braking)`);
    console.log(`🎯 Expected behavior score: ~65-70/100`);
    
    return testPoints;
  }
  
  private generateSegment(
    startLat: number,
    startLon: number,
    startSpeedMph: number,
    segment: any,
    startTimeOffset: number
  ): TestGPSPoint[] {
    
    const points: TestGPSPoint[] = [];
    let currentLat = startLat;
    let currentLon = startLon;
    let currentSpeedMph = startSpeedMph;
    
    for (let second = 0; second < segment.duration; second++) {
      const timestamp = new Date(this.currentTime.getTime() + (startTimeOffset + second) * 1000);
      
      let targetSpeedMph = this.calculateTargetSpeed(
        segment.speedPattern,
        second,
        segment.duration,
        currentSpeedMph,
        segment.targetSpeed
      );
      
      const maxAccel = this.getMaxAcceleration(segment.speedPattern, second, segment.duration);
      const speedChange = Math.max(-maxAccel, Math.min(maxAccel, targetSpeedMph - currentSpeedMph));
      currentSpeedMph = Math.max(0, currentSpeedMph + speedChange);
      
      const currentSpeedMs = currentSpeedMph / 2.237;
      
      const distanceThisSecond = currentSpeedMs;
      const bearing = this.calculateRealisticBearing(segment.speedPattern, second);
      
      const deltaLatDegrees = (distanceThisSecond * Math.cos(bearing * Math.PI / 180)) / 111000;
      const deltaLonDegrees = (distanceThisSecond * Math.sin(bearing * Math.PI / 180)) / (111000 * Math.cos(currentLat * Math.PI / 180));
      
      const maxMovementPerSecond = 0.0001;
      const constrainedDeltaLat = Math.max(-maxMovementPerSecond, Math.min(maxMovementPerSecond, deltaLatDegrees));
      const constrainedDeltaLon = Math.max(-maxMovementPerSecond, Math.min(maxMovementPerSecond, deltaLonDegrees));
      
      currentLat += constrainedDeltaLat;
      currentLon += constrainedDeltaLon;
      
      const gpsPoint: TestGPSPoint = {
        latitude: currentLat,
        longitude: currentLon,
        accuracy: this.getRealisticAccuracy(),
        speed: currentSpeedMs,
        timestamp: timestamp.toISOString()
      };
      
      points.push(gpsPoint);
    }
    
    return points;
  }
  
  private calculateTargetSpeed(
    pattern: string,
    second: number,
    totalSeconds: number,
    currentSpeed: number,
    targetSpeed: number
  ): number {
    
    const progress = second / totalSeconds;
    
    switch (pattern) {
      case 'gentle_acceleration':
        return targetSpeed * Math.min(1, progress * 1.5);
        
      case 'normal_driving':
        return targetSpeed * Math.min(1, progress * 2) + Math.sin(second / 10) * 3;
        
      case 'highway_merge':
        if (second >= 60 && second <= 65) {
          return currentSpeed + 8; // HARSH
        } else if (second >= 180 && second <= 185) {
          return currentSpeed + 7; // HARSH
        } else {
          return targetSpeed * Math.min(1, progress);
        }
        
      case 'cruise_control':
        return targetSpeed + Math.sin(second / 30) * 1;
        
      case 'exit_and_stop':
        if (second >= 120 && second <= 125) {
          return currentSpeed - 12; // HARSH BRAKING
        } else if (progress < 0.7) {
          return 65;
        } else {
          return targetSpeed + (1 - progress) * 30;
        }
        
      default:
        return targetSpeed;
    }
  }
  
  private getMaxAcceleration(pattern: string, second: number, totalSeconds: number): number {
    switch (pattern) {
      case 'gentle_acceleration':
        return 2.5;
      case 'normal_driving':
        return 4;
      case 'highway_merge':
        if ((second >= 60 && second <= 65) || (second >= 180 && second <= 185)) {
          return 10;
        }
        return 5;
      case 'cruise_control':
        return 1;
      case 'exit_and_stop':
        if (second >= 120 && second <= 125) {
          return 15;
        }
        return 6;
      default:
        return 4;
    }
  }
  
  private calculateRealisticBearing(pattern: string, second: number): number {
    switch (pattern) {
      case 'gentle_acceleration':
        return 45 + Math.sin(second / 30) * 10;
      case 'normal_driving':
        return 90 + Math.sin(second / 40) * 8;
      case 'highway_merge':
        return 135 + Math.sin(second / 60) * 3;
      case 'cruise_control':
        return 135 + Math.sin(second / 120) * 1;
      case 'exit_and_stop':
        return 180 + Math.sin(second / 25) * 15;
      default:
        return 90;
    }
  }
  
  private getRealisticAccuracy(): number {
    return 3 + Math.random() * 5;
  }
}

export function generateTestTripData(basePoint: any): TestGPSPoint[] {
  const generator = new GPSTestDataGenerator(basePoint);
  return generator.generateRealisticTrip();
}

export function enableTestMode(testData: TestGPSPoint[], processLocationCallback: Function, onTestComplete?: Function) {
  console.log('🧪 FIXED TEST MODE ENABLED - Using simulated GPS data with auto-stop');
  
  let currentIndex = 0;
  let testInterval: NodeJS.Timeout | null = null;
  
  const simulateGPSFeed = () => {
    // Check if we've reached the end of test data
    if (currentIndex >= testData.length) {
      console.log('✅ Test trip completed - AUTO STOPPING');
      
      // Clear the interval
      if (testInterval) {
        clearInterval(testInterval);
        testInterval = null;
      }
      
      // Call the completion callback to auto-stop tracking
      if (onTestComplete) {
        setTimeout(() => {
          onTestComplete();
        }, 1000); // Small delay to process final points
      }
      
      return;
    }
    
    const testPoint = testData[currentIndex];
    
    const mockPosition: GeolocationPosition = {
      coords: {
        latitude: testPoint.latitude,
        longitude: testPoint.longitude,
        altitude: null,
        accuracy: testPoint.accuracy,
        altitudeAccuracy: null,
        heading: null,
        speed: testPoint.speed,
        toJSON: () => ({
          latitude: testPoint.latitude,
          longitude: testPoint.longitude,
          altitude: null,
          accuracy: testPoint.accuracy,
          altitudeAccuracy: null,
          heading: null,
          speed: testPoint.speed
        })
      },
      timestamp: Date.now(),
      toJSON: () => ({
        coords: {
          latitude: testPoint.latitude,
          longitude: testPoint.longitude,
          altitude: null,
          accuracy: testPoint.accuracy,
          altitudeAccuracy: null,
          heading: null,
          speed: testPoint.speed
        },
        timestamp: Date.now()
      })
    };
    
    // Feed to your existing processing function
    processLocationCallback(mockPosition);
    currentIndex++;
    
    console.log(`🧪 Test progress: ${currentIndex}/${testData.length} (${((currentIndex/testData.length)*100).toFixed(1)}%)`);
  };
  
  // Start the simulation with setInterval for better control
  testInterval = setInterval(simulateGPSFeed, 1000);
  
  // Store the interval reference for cleanup
  return testInterval;
}

// Test mode control - CHANGE THIS TO SWITCH MODES
const TEST_MODE = true; // Set to false for real GPS
// ================================================================

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

  // Distance tracking state variables
  const [totalTripDistance, setTotalTripDistance] = useState(0);
  const [lastDistancePoint, setLastDistancePoint] = useState<EnhancedLocationPoint | null>(null);

  // Settings Modal and Privacy Controls
  const [showSettingsModal, setShowSettingsModal] = useState(false);
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

  // Delete Account States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'password' | 'confirm'>('password');

  const [present] = useIonToast();
  const watchIdRef = useRef<number | null>(null);
  
  // CRITICAL FIX: Use useRef to store trip ID to avoid React state timing issues
  const currentTripRef = useRef<string | null>(null);
  const testModeActiveRef = useRef<boolean>(false);
  const batchCountRef = useRef<number>(0);
  
  const TRAJECTORY_LENGTH = 25;

  // Store ALL GPS points for trip analysis
  const [allTripPoints, setAllTripPoints] = useState<EnhancedLocationPoint[]>([]);

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
        message: 'Location settings updated successfully!',
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

  // DELETE ACCOUNT FUNCTIONALITY
  const handleDeleteAccountRequest = () => {
    setDeleteStep('password');
    setDeletePassword('');
    setShowDeleteModal(true);
  };

  const handlePasswordSubmit = () => {
    if (!deletePassword.trim()) {
      setError('Password is required');
      return;
    }
    setDeleteStep('confirm');
  };

  const handleDeleteAccountConfirm = async () => {
    if (!deletePassword.trim()) {
      setError('Password is required to delete your account');
      return;
    }

    setDeletingAccount(true);
    
    try {
      const emailToUse = user?.email || user?.user_email || user?.Email || '';
      const userIdToUse = user?.userId || user?.user_id || user?.id || '';
      
      const requestBody = {
        mode: 'delete_account',
        email: emailToUse,
        user_id: userIdToUse,
        password: deletePassword.trim()
      };

      const response = await fetch('https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/auth-user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      let data;
      try {
        const responseText = await response.text();
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Delete failed`);
      }

      setShowDeleteModal(false);
      
      present({
        message: 'Account deleted successfully. You will be signed out.',
        duration: 3000,
        color: 'success'
      });

      localStorage.removeItem('privacyDriveUser');
      
      if (onSignOut) {
        onSignOut();
      }

    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
      setError(errorMessage);
      
      present({
        message: `Delete failed: ${errorMessage}`,
        duration: 5000,
        color: 'danger'
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  const cancelDeleteAccount = () => {
    setDeletePassword('');
    setShowDeleteModal(false);
    setDeleteStep('password');
    setDeletingAccount(false);
    setError('');
  };

  // GPS and Trip Functions
  const generateTripId = (): string => {
    return `trip_${user.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // CRITICAL FIX: Improved delta calculation function
  const calculateEnhancedDeltas = (queue: EnhancedLocationPoint[]): any[] => {
    if (queue.length < 2) {
      console.log('❌ Queue too small for delta calculation:', queue.length);
      return [];
    }

    console.log(`🔧 DELTA CALCULATION: Processing ${queue.length} points`);
    
    const deltas = [];
    for (let i = 1; i < queue.length; i++) {
      const prevPoint = queue[i - 1];
      const currentPoint = queue[i];

      if (!prevPoint || !currentPoint || 
          typeof prevPoint.latitude !== 'number' || 
          typeof prevPoint.longitude !== 'number' ||
          typeof currentPoint.latitude !== 'number' || 
          typeof currentPoint.longitude !== 'number') {
        console.log(`⚠️ Invalid coordinates at index ${i}:`, { prevPoint, currentPoint });
        continue;
      }

      const timeDiff = (new Date(currentPoint.timestamp).getTime() - new Date(prevPoint.timestamp).getTime()) / 1000;
      
      if (timeDiff <= 0 || timeDiff > 300) {
        console.log(`⚠️ Invalid time difference: ${timeDiff}s`);
        continue;
      }

      const deltaLat = currentPoint.latitude - prevPoint.latitude;
      const deltaLon = currentPoint.longitude - prevPoint.longitude;

      const movementThreshold = 0.000001;
      
      const gpsSpeed = currentPoint.speed;
      let calculatedSpeed = 0;
      if (gpsSpeed !== undefined && gpsSpeed !== null) {
        calculatedSpeed = gpsSpeed * 2.237;
      } else {
        const distance = calculateHaversineDistance(
          prevPoint.latitude, prevPoint.longitude,
          currentPoint.latitude, currentPoint.longitude
        );
        calculatedSpeed = (distance / (timeDiff / 3600));
      }

      const delta = {
        sequence: i - 1,
        timestamp: currentPoint.timestamp,
        delta_lat: deltaLat,
        delta_long: deltaLon,
        delta_time: timeDiff,
        speed_mph: calculatedSpeed,
        speed_confidence: gpsSpeed !== undefined ? 0.9 : 0.3,
        gps_accuracy: currentPoint.accuracy || 0,
        is_stationary: Math.abs(deltaLat) < movementThreshold && Math.abs(deltaLon) < movementThreshold,
        data_quality: currentPoint.accuracy && currentPoint.accuracy < 10 ? 'high' : 'medium',
        raw_speed_ms: gpsSpeed || null,
        calculated_from_position: gpsSpeed === undefined
      };

      console.log(`📊 Delta ${i-1}: lat=${deltaLat.toFixed(8)}, lon=${deltaLon.toFixed(8)}, time=${timeDiff.toFixed(1)}s, speed=${calculatedSpeed.toFixed(1)}mph`);
      
      deltas.push(delta);
    }

    console.log(`✅ Generated ${deltas.length} deltas from ${queue.length} points`);
    return deltas;
  };

  // ENHANCED DEBUG: uploadBatch with additional trip ID validation
  const uploadBatch = async (queue: EnhancedLocationPoint[], tripId: string, batchNumber: number) => {
    try {
      setUploading(true);
      console.log(`🚀 BATCH UPLOAD #${batchNumber} STARTING`);
console.log(`📊 Trip: ${tripId}`);
console.log(`🔍 Batch verification:`);
console.log(`   Ref batch count: ${batchCountRef.current}`);
console.log(`   State batch count: ${batchCount}`);
console.log(`   This batch number: ${batchNumber}`);
      
      if (!tripId || tripId.trim() === '') {
        console.error('❌ CRITICAL: Empty trip ID provided to uploadBatch!');
        throw new Error('Invalid trip ID provided to uploadBatch');
      }
      
      console.log(`🚀 UPLOADING BATCH ${batchNumber} for trip: ${tripId}`);
      console.log(`📍 Batch contains ${queue.length} GPS points`);
      console.log(`👤 User ID: ${user.userId}`);
      
      const deltas = calculateEnhancedDeltas(queue);
      console.log(`📊 Calculated ${deltas.length} deltas for upload`);
      
      if (deltas.length === 0) {
        console.log('❌ No valid deltas calculated - skipping batch upload');
        present({
          message: 'No movement detected in this batch',
          duration: 2000,
          color: 'warning'
        });
        return;
      }

      const validPoints = queue.filter(p => p.isValid !== false).length;
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

      console.log('🌐 Making API call to store-trajectory-batch...');
      
      const response = await fetch('https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/store-trajectory-batch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log(`📡 API Response Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
          console.error(`❌ API Error Response: ${errorText}`);
        } catch (e) {
          errorText = `Could not read error response: ${e}`;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      let result;
      try {
        const responseText = await response.text();
        console.log(`📄 Raw API Response: ${responseText}`);
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`❌ Failed to parse success response:`, parseError);
        throw new Error(`Invalid JSON response: ${parseError}`);
      }

      console.log('✅ Batch uploaded successfully:', result);
      console.log(`✅ BATCH #${batchNumber} UPLOADED SUCCESSFULLY`);
      console.log(`📈 Total batches uploaded so far: ${batchNumber}`);
      
      present({
        message: `Batch ${batchNumber} uploaded (${deltas.length} deltas)`,
        duration: 1500,
        color: 'success'
      });

    } catch (err) {
      console.error('❌ BATCH UPLOAD ERROR:', err);
      
      setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      present({
        message: `Batch upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        duration: 5000,
        color: 'danger'
      });
    } finally {
      setUploading(false);
    }
  };

  // Helper function for accurate distance calculation
  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  // FIXED: Finalize trip function
  const finalizeTripOnServer = async (tripId: string) => {
    try {
      console.log(`🏁 FINALIZING TRIP: ${tripId}`);
      console.log(`📏 Total accumulated distance: ${totalTripDistance.toFixed(3)} miles`);
      console.log(`📊 Total GPS points collected: ${allTripPoints.length}`);
      
      const totalDistanceMiles = totalTripDistance;
      
      const tripEndTime = new Date().toISOString();
      const tripStartTime = tripQuality.tripStartTime;
      const actualDurationMs = new Date(tripEndTime).getTime() - new Date(tripStartTime).getTime();
      const actualDurationMinutes = Math.max(1, actualDurationMs / (1000 * 60));
      
      const enhancedTripQuality = {
        ...tripQuality,
        actual_distance_miles: totalDistanceMiles,
        actual_duration_minutes: actualDurationMinutes,
        actual_start_timestamp: tripStartTime,
        actual_end_timestamp: tripEndTime,
        
        gps_max_speed_mph: tripQuality.maxSpeed,
        gps_avg_speed_mph: tripQuality.avgSpeed,
        gps_current_speed_mph: tripQuality.currentSpeed,
        
        total_gps_points: tripQuality.totalPoints,
        valid_gps_points: tripQuality.validPoints,
        gps_accuracy_avg: tripQuality.averageAccuracy,
        
        privacy_protected: basePoint?.source !== 'fallback',
        base_point_city: basePoint?.city,
        anonymization_radius: basePoint?.anonymizationRadius,
        
        use_gps_metrics: true,
        data_source: 'iphone_gps_realtime_accumulation',
        distance_calculation_method: 'realtime_accumulation',
        remaining_queue_points: locationQueue.length,
        total_batches_sent: batchCount + (locationQueue.length > 0 ? 1 : 0)
      };
      
      const response = await fetch('https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/finalize-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.userId,
          trip_id: tripId,
          start_timestamp: tripStartTime,
          end_timestamp: tripEndTime,
          trip_quality: enhancedTripQuality
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Trip finalization failed:', errorText);
        throw new Error(`Failed to finalize trip: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Trip finalized successfully:', result);
      
      present({
        message: `Trip completed! ${totalDistanceMiles.toFixed(2)} miles in ${actualDurationMinutes.toFixed(1)} minutes`,
        duration: 4000,
        color: 'success'
      });

    } catch (err) {
      console.error('❌ Failed to finalize trip:', err);
      present({
        message: 'Failed to finalize trip data',
        duration: 3000,
        color: 'danger'
      });
    }
  };

  // CRITICAL FIX: Enhanced GPS validation - less strict
  const isValidGPSPoint = (point: EnhancedLocationPoint, lastPoint?: EnhancedLocationPoint): boolean => {
    if (!point.latitude || !point.longitude || 
        Math.abs(point.latitude) > 90 || Math.abs(point.longitude) > 180) {
      return false;
    }

    if (point.accuracy && point.accuracy > 100) {
      console.log(`⚠️ Low accuracy point: ${point.accuracy}m`);
      return false;
    }

    if (lastPoint) {
      const distance = calculateHaversineDistance(
        lastPoint.latitude, lastPoint.longitude,
        point.latitude, point.longitude
      );
      
      if (distance > 1.0) {
        console.log(`⚠️ Impossible GPS jump rejected: ${distance.toFixed(3)} miles`);
        return false;
      }
    }

    return true;
  };

  // ENHANCED DEBUG: processLocationUpdate with reliable trip ID access
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

  console.log(`📍 NEW GPS POINT: lat=${latitude.toFixed(6)}, lon=${longitude.toFixed(6)}, accuracy=${accuracy.toFixed(1)}m, speed=${speed ? (speed * 2.237).toFixed(1) : 'N/A'}mph`);

  const lastValidPoint = allTripPoints.length > 0 ? allTripPoints[allTripPoints.length - 1] : undefined;
  const isValid = isValidGPSPoint(newPoint, lastValidPoint);
  newPoint.isValid = isValid;

  setAllTripPoints(prev => [...prev, newPoint]);

  if (isValid && lastDistancePoint) {
    const segmentDistance = calculateHaversineDistance(
      lastDistancePoint.latitude, lastDistancePoint.longitude,
      newPoint.latitude, newPoint.longitude
    );
    
    if (segmentDistance >= 0.001 && segmentDistance <= 0.5) {
      setTotalTripDistance(prev => {
        const newTotal = prev + segmentDistance;
        console.log(`📏 Distance segment: ${(segmentDistance * 5280).toFixed(1)}ft, Total: ${newTotal.toFixed(3)} miles`);
        return newTotal;
      });
    } else if (segmentDistance > 0.5) {
      console.log(`⚠️ Large GPS jump rejected: ${segmentDistance.toFixed(3)} miles (likely GPS error)`);
    }
  }

  if (isValid) {
    setLastDistancePoint(newPoint);
  }

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
    console.log(`❌ Invalid GPS point rejected`);
    return;
  }

  // FIXED: Enhanced batch handling with ref-based counter
  setLocationQueue(prevQueue => {
    const updatedQueue = [...prevQueue, newPoint];
    
    // ENHANCED DEBUG LOGGING
    console.log(`📦 ENHANCED DEBUG - Queue status: ${updatedQueue.length}/${TRAJECTORY_LENGTH} points`);
    console.log(`🔢 ENHANCED DEBUG - Current batch count STATE: ${batchCount}`);
    console.log(`🔢 ENHANCED DEBUG - Current batch count REF: ${batchCountRef.current}`);
    console.log(`🆔 ENHANCED DEBUG - Current trip ID REF: ${currentTripRef.current}`);
    console.log(`🆔 ENHANCED DEBUG - Current trip ID STATE: ${currentTrip}`);
    console.log(`📊 ENHANCED DEBUG - Total GPS points collected: ${allTripPoints.length}`);

    if (updatedQueue.length >= TRAJECTORY_LENGTH) {
      const batchToUpload = updatedQueue.slice(0, TRAJECTORY_LENGTH);
      const remainingQueue = updatedQueue.slice(TRAJECTORY_LENGTH);

      // CRITICAL FIX: Use ref for immediate batch number access
      const nextBatchNumber = batchCountRef.current + 1;
      batchCountRef.current = nextBatchNumber; // Update ref immediately
      
      console.log(`🚀 ENHANCED DEBUG - Queue full! Uploading batch of ${batchToUpload.length} points`);
      console.log(`📊 ENHANCED DEBUG - This will be batch #${nextBatchNumber}`);
      console.log(`🆔 ENHANCED DEBUG - Using trip ID: ${currentTripRef.current}`);
      console.log(`📍 ENHANCED DEBUG - First point timestamp: ${batchToUpload[0]?.timestamp}`);
      console.log(`📍 ENHANCED DEBUG - Last point timestamp: ${batchToUpload[batchToUpload.length - 1]?.timestamp}`);
      
      const tripIdToUse = currentTripRef.current;
      
      if (tripIdToUse) {
        console.log(`📊 ENHANCED DEBUG - Batch #${nextBatchNumber} will be uploaded with trip ID: ${tripIdToUse}`);
        
        // Upload immediately with ref-based batch number
        uploadBatch(batchToUpload, tripIdToUse, nextBatchNumber);
        
        // Update state for UI display (but don't rely on it for batch numbers)
        setBatchCount(nextBatchNumber);
        
      } else {
        console.error('❌ ENHANCED DEBUG - CRITICAL: No trip ID available - batch will be lost!');
        // Reset batch count if trip ID is missing
        batchCountRef.current = nextBatchNumber - 1;
      }

      return remainingQueue;
    }

    return updatedQueue;
  });

  setError('');
};


  // ENHANCED: Toggle tracking with FIXED state management
  const toggleTracking = async () => {
  // STOPPING TRIP - Handle immediately regardless of mode
  if (tracking) {
    console.log('🛑 IMMEDIATE STOP REQUESTED');
    
    // Set tracking to false immediately to prevent UI confusion
    setTracking(false);
    
    // Clear any GPS watching
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    // Stop test mode if active
    testModeActiveRef.current = false;

    const finalTripId = currentTripRef.current || currentTrip;
    
    try {
      // Upload final batch if there are remaining points
      if (locationQueue.length > 0 && finalTripId) {
        console.log(`🏁 Uploading final batch of ${locationQueue.length} points`);
        const finalBatchNumber = batchCountRef.current + 1;
        batchCountRef.current = finalBatchNumber;
        await uploadBatch(locationQueue, finalTripId, finalBatchNumber);
        setBatchCount(finalBatchNumber);
      }

      // Finalize trip
      if (finalTripId) {
        await finalizeTripOnServer(finalTripId);
      }
    } catch (error) {
      console.error('❌ Error during trip finalization:', error);
      present({
        message: 'Trip stopped but finalization had issues',
        duration: 3000,
        color: 'warning'
      });
    }

    // ENHANCED DEBUG: Trip summary
    console.log(`📊 TRIP SUMMARY:`);
    console.log(`   Total batches uploaded: ${batchCountRef.current}`);
    console.log(`   State batch count: ${batchCount}`);
    console.log(`   Total GPS points: ${allTripPoints.length}`);
    console.log(`   Expected batches: ${Math.ceil(allTripPoints.length / TRAJECTORY_LENGTH)}`);

    // Reset all state AND ref
    setLocationQueue([]);
    setCurrentTrip(null);
    currentTripRef.current = null;
    setBatchCount(0);
    batchCountRef.current = 0; // Reset ref-based counter
    setError('');
    setTotalTripDistance(0);
    setLastDistancePoint(null);
    setAllTripPoints([]);
    
    console.log(`🛑 TRIP STOPPED AND FINALIZED (${TEST_MODE ? 'TEST' : 'REAL'} mode)`);
    
    const message = TEST_MODE 
      ? `🧪 Test completed! Check analysis results.`
      : `Trip completed! Check your driving analysis. Total: ${totalTripDistance.toFixed(2)} miles`;
      
    present({
      message,
      duration: 4000,
      color: 'primary'
    });
    
    return; // Exit early after stopping
  }

  // STARTING TRIP
  if (!navigator.geolocation && !TEST_MODE) {
    setError('Geolocation is not supported by this device');
    return;
  }

  const tripId = generateTripId();
  
  // CRITICAL FIX: Set trip ID in BOTH state and ref
  setCurrentTrip(tripId);
  currentTripRef.current = tripId;
  
  console.log(`🆔 TRIP ID SET: State and Ref both set to ${tripId}`);
  
  setLocationQueue([]);
  setBatchCount(0);
  batchCountRef.current = 0; // Reset ref-based counter
  
  setTotalTripDistance(0);
  setLastDistancePoint(null);
  setAllTripPoints([]);
  
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

  if (TEST_MODE) {
    console.log('🧪 TEST MODE ENABLED - Using simulated GPS data with auto-stop');
    
    if (!basePoint) {
      setError('Base point required for test mode');
      return;
    }
    
    testModeActiveRef.current = true;
    const testData = generateTestTripData(basePoint);
    
    // FIXED: Pass auto-complete callback
    const autoCompleteCallback = () => {
      console.log('🧪 Test data completed - auto-stopping trip');
      if (testModeActiveRef.current) {
        testModeActiveRef.current = false;
        // Trigger the stop functionality
        toggleTracking();
      }
    };
    
    enableTestMode(testData, processLocationUpdate, autoCompleteCallback);
    
    present({
      message: '🧪 TEST MODE: 15-minute simulated trip started! Will auto-stop when complete.',
      duration: 4000,
      color: 'warning'
    });
    
  } else {
    console.log('🌍 REAL MODE: Using actual GPS');
    
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 2000
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      processLocationUpdate,
      (error) => {
        console.error('GPS error:', error);
        setError(`GPS error: ${error.message}`);
        setShowAlert(true);
      },
      options
    );

    present({
      message: 'GPS tracking started! Drive safely. Click stop to end trip.',
      duration: 3000,
      color: 'success'
    });
  }

  setTracking(true);
  console.log(`🚗 TRIP STARTED: ${tripId} (${TEST_MODE ? 'TEST' : 'REAL'} mode)`);
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

  // Utility Functions
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
        <IonToolbar color="light">
          <IonTitle style={{ color: '#2c3e50', fontWeight: '600' }}>
            Driver Dashboard - {user?.name || 'Driver'}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={() => setShowSettingsModal(true)} style={{ color: '#6c757d' }}>
              <IonIcon icon={settingsOutline} />
            </IonButton>
            <IonButton fill="clear" onClick={handleSignOut} style={{ color: '#6c757d' }}>
              <IonIcon icon={logOutOutline} />
              <IonLabel style={{ marginLeft: '4px' }}>Sign Out</IonLabel>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#f8f9fa' }}>
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Welcome Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <h2 style={{ margin: '0 0 8px 0', color: '#2c3e50', fontSize: '1.5rem', fontWeight: '600' }}>
              🚗 Privacy-Protected Driving Analysis
            </h2>
            <p style={{ margin: '0', color: '#6c757d', fontSize: '1rem' }}>
              Test your driving behavior with real GPS data. Your exact location is never stored - only encrypted movement patterns for insurance analysis.
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fff5f5',
              border: '1px solid #feb2b2',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              color: '#c53030'
            }}>
              <IonIcon icon={warningOutline} style={{ marginRight: '8px' }} />
              {error}
            </div>
          )}

          {/* Privacy Status */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: '1.5rem', marginRight: '12px', color: '#28a745' }} />
              <h3 style={{ margin: '0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
                Privacy Protection Status
              </h3>
              <div style={{
                marginLeft: 'auto',
                padding: '4px 12px',
                backgroundColor: getPrivacyStatusColor() === 'success' ? '#d4edda' : '#fff3cd',
                color: getPrivacyStatusColor() === 'success' ? '#155724' : '#856404',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>
                {basePoint?.source === 'fallback' ? 'Basic Protection' : 'Enhanced Protection'}
              </div>
            </div>
            
            {basePoint && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Anonymization Center</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>
                    {basePoint.city}, {basePoint.state}
                  </div>
                  <div style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                    Source: {basePoint.source === 'zippopotam' ? 'Verified API' : basePoint.source}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Privacy Radius</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>
                    {basePoint.anonymizationRadius || 0} miles
                  </div>
                  <div style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                    Location anonymization range
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Trip Tracking Controls */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
              Driving Test Controls
            </h3>
            
            <IonButton
              expand="block"
              onClick={toggleTracking}
              disabled={uploading}
              style={{
                '--background': tracking ? '#dc3545' : '#007bff',
                '--color': 'white',
                '--border-radius': '12px',
                '--padding-top': '16px',
                '--padding-bottom': '16px',
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '16px'
              }}
            >
              <IonIcon icon={tracking ? stopOutline : playOutline} slot="start" />
{tracking ? 'Stop Trip Now' : 'Start Driving Test'}
            </IonButton>
            
            {!tracking && (
              <div style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: '#6c757d',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: '500', color: '#495057' }}>
                  📱 Testing Instructions
                </p>
                <p style={{ margin: '0' }}>
                  Start tracking before driving. The app analyzes speed consistency, acceleration patterns, 
                  and turning behavior while protecting your privacy through location anonymization.
                </p>
              </div>
            )}
          </div>

          {/* Active Trip Status */}
          {tracking && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '2px solid #28a745'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#28a745',
                  borderRadius: '50%',
                  marginRight: '12px',
                  animation: 'pulse 2s infinite'
                }}></div>
                <h3 style={{ margin: '0', color: '#28a745', fontSize: '1.2rem', fontWeight: '600' }}>
                  🚗 Trip Active - {currentTrip?.slice(-8)}
                </h3>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Trip Distance</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#007bff' }}>
                  {totalTripDistance.toFixed(2)} miles
                </div>
                <div style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                  ({(totalTripDistance * 1.60934).toFixed(2)} km)
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Duration</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#2c3e50' }}>{getTripDuration()}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Current Speed</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#2c3e50' }}>{tripQuality.currentSpeed.toFixed(1)} mph</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Max Speed</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#2c3e50' }}>{tripQuality.maxSpeed.toFixed(1)} mph</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>GPS Quality</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: getQualityColor(getDataQualityScore()) === 'success' ? '#28a745' : getQualityColor(getDataQualityScore()) === 'warning' ? '#ffc107' : '#dc3545' }}>
                    {Math.round(getDataQualityScore() * 100)}%
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                  <div><strong>Queue:</strong> {locationQueue.length}/{TRAJECTORY_LENGTH}</div>
                  <div><strong>Batches:</strong> {batchCount}</div>
                  <div><strong>Total Points:</strong> {tripQuality.totalPoints}</div>
                  <div><strong>Valid Points:</strong> {tripQuality.validPoints}</div>
                  <div><strong>Rejected:</strong> {tripQuality.rejectedPoints}</div>
                  <div><strong>All Points:</strong> {allTripPoints.length}</div>
                  {tripQuality.averageAccuracy > 0 && (
                    <div><strong>Accuracy:</strong> {tripQuality.averageAccuracy.toFixed(1)}m</div>
                  )}
                </div>
              </div>

              {uploading && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '8px' }}>
                    Uploading batch with privacy protection...
                  </div>
                  <IonProgressBar type="indeterminate" style={{ '--background': '#e9ecef' }}></IonProgressBar>
                </div>
              )}
            </div>
          )}

          {/* Testing Scenarios */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
              🎯 Testing Scenarios
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: '#e8f5e8', borderRadius: '8px', border: '1px solid #c3e6c3' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#155724', fontSize: '1rem', fontWeight: '600' }}>
                  🛣️ Highway Driving
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#155724' }}>
                  Steady speeds, minimal lane changes
                </p>
                <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                  <strong>Expected Score:</strong> 80-95
                </div>
              </div>
              
              <div style={{ padding: '16px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#856404', fontSize: '1rem', fontWeight: '600' }}>
                  🏙️ City Driving
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#856404' }}>
                  Stop and go, normal acceleration
                </p>
                <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                  <strong>Expected Score:</strong> 65-80
                </div>
              </div>
              
              <div style={{ padding: '16px', backgroundColor: '#f8d7da', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#721c24', fontSize: '1rem', fontWeight: '600' }}>
                  ⚡ Aggressive Test
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#721c24' }}>
                  Rapid speed changes, hard braking
                </p>
                <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                  <strong>Expected Score:</strong> 30-60
                </div>
              </div>
            </div>
            
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#d1ecf1',
              borderRadius: '6px',
              fontSize: '0.85rem',
              color: '#0c5460'
            }}>
              <IonIcon icon={informationCircle} style={{ marginRight: '6px' }} />
              <strong>Tip:</strong> Drive for at least 2-3 minutes to generate enough data for accurate analysis.
            </div>
          </div>

        </div>

        {/* Settings Modal */}
        <IonModal isOpen={showSettingsModal} onDidDismiss={() => setShowSettingsModal(false)}>
          <IonHeader>
            <IonToolbar color="light">
              <IonTitle style={{ color: '#2c3e50', fontWeight: '600' }}>
                Account Settings
              </IonTitle>
              <IonButtons slot="end">
                <IonButton fill="clear" onClick={() => setShowSettingsModal(false)} style={{ color: '#6c757d' }}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          
          <IonContent style={{ '--background': '#f8f9fa' }}>
            <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>

              {/* Account Information */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
                  <IonIcon icon={informationCircle} style={{ marginRight: '8px' }} />
                  Account Information
                </h3>
                
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Name</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>{user?.name || 'Not set'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Email</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>{user?.email || 'Not set'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Role</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>Driver</div>
                  </div>
                </div>
              </div>

              {/* Location Settings */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
                  <IonIcon icon={locationOutline} style={{ marginRight: '8px' }} />
                  Location Settings
                </h3>
                
                {!editingZipcode ? (
                  <div>
                    <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Current Zipcode</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>{user.zipcode || 'Not set'}</div>
                      </div>
                      {basePoint && (
                        <div>
                          <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Privacy Center</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>
                            {basePoint.city}, {basePoint.state}
                          </div>
                          <div style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                            Source: {basePoint.source}
                          </div>
                        </div>
                      )}
                    </div>
                    <IonButton
                      fill="outline"
                      onClick={startEditingZipcode}
                      style={{ '--border-color': '#007bff', '--color': '#007bff' }}
                    >
                      Edit Location
                    </IonButton>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: '16px' }}>
                      <IonInput
                        placeholder="Enter new zipcode (e.g., 94583)"
                        value={newZipcode}
                        onIonInput={e => setNewZipcode(e.detail.value!)}
                        disabled={updatingPrivacy || geocodingNewZipcode}
                        clearInput
                        style={{
                          '--border-radius': '8px',
                          '--border-color': '#dee2e6',
                          '--padding-start': '12px',
                          '--padding-end': '12px',
                          '--background': 'white'
                        }}
                      />
                      {newZipcodeValid === true && (
                        <div style={{ color: '#28a745', fontSize: '0.8rem', marginTop: '4px' }}>
                          <IonIcon icon={checkmarkCircle} style={{ marginRight: '4px' }} />
                          Valid zipcode
                        </div>
                      )}
                      {newZipcodeValid === false && (
                        <div style={{ color: '#dc3545', fontSize: '0.8rem', marginTop: '4px' }}>
                          <IonIcon icon={alertCircleOutline} style={{ marginRight: '4px' }} />
                          Invalid zipcode format
                        </div>
                      )}
                    </div>

                    {geocodingNewZipcode && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '8px' }}>
                          Verifying new location...
                        </div>
                        <IonProgressBar type="indeterminate" />
                      </div>
                    )}

                    {newBasePoint && (
                      <div style={{
                        marginBottom: '16px',
                        padding: '12px',
                        backgroundColor: '#d4edda',
                        borderRadius: '6px',
                        color: '#155724'
                      }}>
                        <IonIcon icon={checkmarkCircle} style={{ marginRight: '6px' }} />
                        New location: {newBasePoint.city}, {newBasePoint.state}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <IonButton
                        fill="outline"
                        onClick={cancelEditingZipcode}
                        disabled={updatingPrivacy}
                        style={{ '--border-color': '#6c757d', '--color': '#6c757d' }}
                      >
                        Cancel
                      </IonButton>
                      <IonButton
                        onClick={updateZipcodeAndPrivacy}
                        disabled={!newBasePoint || updatingPrivacy}
                        style={{ '--background': '#007bff' }}
                      >
                        {updatingPrivacy ? 'Updating...' : 'Save Location'}
                      </IonButton>
                    </div>
                  </div>
                )}
              </div>

              {/* Privacy Settings */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
                  <IonIcon icon={lockClosedOutline} style={{ marginRight: '8px' }} />
                  Privacy Settings
                </h3>
                
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '8px' }}>
                      Anonymization Radius: {privacySettings.anonymizationRadius} mile{privacySettings.anonymizationRadius !== 1 ? 's' : ''}
                    </div>
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
                      disabled={updatingPrivacy}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '8px' }}>Data Retention Period</div>
                    <IonSelect
                      value={privacySettings.dataRetentionPeriod}
                      onIonChange={e => setPrivacySettings(prev => ({ 
                        ...prev, 
                        dataRetentionPeriod: e.detail.value 
                      }))}
                      disabled={updatingPrivacy}
                      style={{
                        '--border-radius': '8px',
                        '--border-color': '#dee2e6',
                        '--padding-start': '12px',
                        '--background': 'white'
                      }}
                    >
                      <IonSelectOption value={1}>1 Month</IonSelectOption>
                      <IonSelectOption value={3}>3 Months</IonSelectOption>
                      <IonSelectOption value={6}>6 Months</IonSelectOption>
                      <IonSelectOption value={12}>1 Year</IonSelectOption>
                      <IonSelectOption value={24}>2 Years</IonSelectOption>
                    </IonSelect>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '8px' }}>Consent Level</div>
                    <IonSelect
                      value={privacySettings.consentLevel}
                      onIonChange={e => setPrivacySettings(prev => ({ 
                        ...prev, 
                        consentLevel: e.detail.value 
                      }))}
                      disabled={updatingPrivacy}
                      style={{
                        '--border-radius': '8px',
                        '--border-color': '#dee2e6',
                        '--padding-start': '12px',
                        '--background': 'white'
                      }}
                    >
                      <IonSelectOption value="full">Full Analytics</IonSelectOption>
                      <IonSelectOption value="basic">Basic Analytics</IonSelectOption>
                      <IonSelectOption value="minimal">Minimal Data</IonSelectOption>
                    </IonSelect>
                  </div>
                </div>

                <IonButton
                  expand="block"
                  onClick={updatePrivacySettings}
                  disabled={updatingPrivacy}
                  style={{ '--background': '#007bff', '--border-radius': '8px' }}
                >
                  <IonIcon icon={saveOutline} slot="start" />
                  {updatingPrivacy ? 'Saving...' : 'Save Privacy Settings'}
                </IonButton>
              </div>

              {/* Delete Account Section */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
                  <IonIcon icon={keyOutline} style={{ marginRight: '8px' }} />
                  Account Management
                </h3>
                
                <div style={{
                  padding: '16px',
                  backgroundColor: '#fff5f5',
                  borderRadius: '8px',
                  border: '1px solid #feb2b2',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#c53030', fontSize: '1rem', fontWeight: '600' }}>
                    ⚠️ Delete Account
                  </h4>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#721c24' }}>
                    Permanently delete your account and all associated driving data. This action cannot be undone.
                  </p>
                </div>

                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={handleDeleteAccountRequest}
                  disabled={deletingAccount}
                  style={{
                    '--border-color': '#dc3545',
                    '--color': '#dc3545',
                    '--border-radius': '8px'
                  }}
                >
                  <IonIcon icon={trashOutline} slot="start" />
                  Delete My Account
                </IonButton>
              </div>

            </div>
          </IonContent>
        </IonModal>

        {/* Delete Account Modal */}
        <IonModal isOpen={showDeleteModal} onDidDismiss={cancelDeleteAccount}>
          <IonHeader>
            <IonToolbar color="danger">
              <IonTitle style={{ color: 'white', fontWeight: '600' }}>
                {deleteStep === 'password' ? 'Delete Account' : 'Final Confirmation'}
              </IonTitle>
              <IonButtons slot="end">
                <IonButton fill="clear" onClick={cancelDeleteAccount} style={{ color: 'white' }}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          
          <IonContent style={{ '--background': '#f8f9fa' }}>
            <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>

              {deleteStep === 'password' && (
                <div>
                  <div style={{
                    backgroundColor: '#fff5f5',
                    border: '1px solid #feb2b2',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ margin: '0 0 12px 0', color: '#c53030', fontSize: '1.2rem', fontWeight: '600' }}>
                      ⚠️ Account Deletion
                    </h3>
                    <p style={{ margin: '0 0 12px 0', color: '#721c24', fontSize: '0.95rem' }}>
                      This action is <strong>permanent and cannot be undone</strong>. All your driving data will be permanently deleted.
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #e9ecef'
                  }}>
                    <h4 style={{ margin: '0 0 16px 0', color: '#2c3e50' }}>
                      Enter your password to continue:
                    </h4>
                    
                    <IonInput
                      type="password"
                      placeholder="Enter your password"
                      value={deletePassword}
                      onIonInput={e => setDeletePassword(e.detail.value!)}
                      style={{
                        '--border-radius': '8px',
                        '--border-color': '#dee2e6',
                        '--padding-start': '12px',
                        '--padding-end': '12px',
                        '--background': 'white',
                        marginBottom: '20px'
                      }}
                    />

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <IonButton
                        expand="block"
                        fill="outline"
                        onClick={cancelDeleteAccount}
                        style={{ '--border-color': '#6c757d', '--color': '#6c757d' }}
                      >
                        Cancel
                      </IonButton>
                      <IonButton
                        expand="block"
                        onClick={handlePasswordSubmit}
                        disabled={!deletePassword.trim()}
                        style={{ '--background': '#dc3545' }}
                      >
                        Continue
                      </IonButton>
                    </div>
                  </div>
                </div>
              )}

              {deleteStep === 'confirm' && (
                <div>
                  <div style={{
                    backgroundColor: '#fff5f5',
                    border: '2px solid #dc3545',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px',
                    textAlign: 'center'
                  }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#c53030', fontSize: '1.3rem', fontWeight: '700' }}>
                      ⚠️ FINAL CONFIRMATION
                    </h3>
                    <p style={{ margin: '0 0 16px 0', color: '#721c24', fontSize: '1rem', fontWeight: '600' }}>
                      Are you absolutely sure you want to delete your account for:
                    </p>
                    <div style={{
                      backgroundColor: 'white',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #dc3545',
                      margin: '0 0 16px 0'
                    }}>
                      <strong style={{ color: '#dc3545', fontSize: '1.1rem' }}>
                        {user?.email || user?.name || 'this user'}
                      </strong>
                    </div>
                    <p style={{ margin: '0', color: '#721c24', fontSize: '0.9rem' }}>
                      This action is <strong>permanent and cannot be undone</strong>.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <IonButton
                      expand="block"
                      fill="outline"
                      onClick={() => setDeleteStep('password')}
                      disabled={deletingAccount}
                      style={{ '--border-color': '#6c757d', '--color': '#6c757d' }}
                    >
                      Back
                    </IonButton>
                    <IonButton
                      expand="block"
                      onClick={handleDeleteAccountConfirm}
                      disabled={deletingAccount}
                      style={{ '--background': '#dc3545' }}
                    >
                      {deletingAccount ? (
                        <>
                          <IonIcon icon={timeOutline} slot="start" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <IonIcon icon={trashOutline} slot="start" />
                          Yes, Delete Forever
                        </>
                      )}
                    </IonButton>
                  </div>
                </div>
              )}

            </div>
          </IonContent>
        </IonModal>

        {/* GPS Error Alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="GPS Error"
          message={error}
          buttons={['OK']}
        />

        {/* CSS for pulse animation */}
        <style>{`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}</style>
      </IonContent>
    </IonPage>
  );
};

export default DriverHome;