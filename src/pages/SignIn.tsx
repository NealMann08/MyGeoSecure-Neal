// // frontend/src/pages/SignIn.tsx - FIXED VERSION
// import React, { useState } from 'react';
// import {
//   IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
//   IonButton, IonInput, IonSelect, IonSelectOption, IonLabel, IonToggle,
//   IonLoading
// } from '@ionic/react';
// import { useHistory } from 'react-router-dom';

// interface SignInProps {
//   onSignIn: (user: any) => void;
// }

// const SignIn: React.FC<SignInProps> = ({ onSignIn }) => {
//   const [name, setName] = useState('');
//   const [role, setRole] = useState('driver');
//   const [isNewUser, setIsNewUser] = useState(true);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const history = useHistory();

//   const handleAuth = async () => {
//     if (!name.trim()) {
//       setError('Name is required');
//       return;
//     }

//     setLoading(true);
//     setError('');

//     try {
//       const userId = name.trim().toLowerCase().replace(/\s+/g, '-');
      
//       const res = await fetch(`https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/auth-user`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           user_id: userId,
//           name: name.trim(),
//           role,
//           mode: isNewUser ? 'signup' : 'signin'
//         })
//       });

//       const data = await res.json();
//       if (res.status !== 200) {
//         setError(data.error || 'Something went wrong');
//         return;
//       }

//       // FIXED: Pass complete user object with name
//       onSignIn({ 
//         userId, 
//         name: name.trim(), 
//         role 
//       });
      
//       history.push(`/${role}`);
//     } catch (err) {
//       console.error('Auth error:', err);
//       setError(err instanceof Error ? err.message : 'Authentication failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <IonPage>
//       <IonHeader>
//         <IonToolbar>
//           <IonTitle>{isNewUser ? 'Sign Up' : 'Sign In'}</IonTitle>
//         </IonToolbar>
//       </IonHeader>
//       <IonContent className="ion-padding">
//         <IonInput
//           placeholder="Full Name"
//           value={name}
//           onIonChange={e => setName(e.detail.value!)}
//           disabled={loading}
//         />
//         <IonSelect value={role} onIonChange={e => setRole(e.detail.value)} disabled={loading}>
//           <IonSelectOption value="driver">Driver</IonSelectOption>
//           <IonSelectOption value="provider">Service Provider</IonSelectOption>
//         </IonSelect>

//         <IonButton expand="block" onClick={handleAuth} disabled={loading || !name.trim()}>
//           {loading ? 'Please wait...' : (isNewUser ? 'Create Account' : 'Log In')}
//         </IonButton>

//         <IonLabel className="ion-padding-top">
//           {isNewUser ? 'Already have an account?' : 'New user?'}
//         </IonLabel>
//         <IonToggle
//           checked={isNewUser}
//           onIonChange={e => setIsNewUser(e.detail.checked)}
//           disabled={loading}
//         />

//         {error && <IonLabel color="danger">{error}</IonLabel>}
        
//         <IonLoading isOpen={loading} message="Authenticating..." />
//       </IonContent>
//     </IonPage>
//   );
// };

// export default SignIn;

// frontend/src/pages/SignIn.tsx - Enhanced with Zipcode Support
import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonInput, IonSelect, IonSelectOption, IonLabel, IonToggle,
  IonLoading, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonText, IonItem, IonIcon, IonChip, IonProgressBar, IonRange
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { locationOutline, shieldCheckmarkOutline, alertCircleOutline } from 'ionicons/icons';
import { getCityCoordinatesFromZipcode, validateZipcode } from '../utils/geocoding';
import type { CityCoordinates } from '../utils/geocoding';

// Add this debug line temporarily
console.log('Geocoding functions loaded:', { getCityCoordinatesFromZipcode, validateZipcode });


interface SignInProps {
  onSignIn: (user: any) => void;
}

interface EnhancedUser {
  userId: string;
  name: string;
  role: 'driver' | 'provider';
  zipcode?: string;
  basePoint?: CityCoordinates;
  privacySettings?: {
    anonymizationRadius: number;
    dataRetentionPeriod: number;
    consentLevel: 'full' | 'basic' | 'minimal';
  };
}

const SignIn: React.FC<SignInProps> = ({ onSignIn }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'driver' | 'provider'>('driver');
  const [zipcode, setZipcode] = useState('');
  const [isNewUser, setIsNewUser] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [basePoint, setBasePoint] = useState<CityCoordinates | null>(null);
  const [zipcodeValid, setZipcodeValid] = useState<boolean | null>(null);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  
  // Privacy settings
  const [anonymizationRadius, setAnonymizationRadius] = useState(10); // miles
  const [dataRetentionPeriod, setDataRetentionPeriod] = useState(12); // months
  const [consentLevel, setConsentLevel] = useState<'full' | 'basic' | 'minimal'>('full');

  const history = useHistory();

  // Validate zipcode as user types
  useEffect(() => {
    if (zipcode.trim()) {
      const isValid = validateZipcode(zipcode);
      setZipcodeValid(isValid);
      
      if (isValid && role === 'driver') {
        // Debounce geocoding
        const timer = setTimeout(async () => {
          await performGeocoding(zipcode);
        }, 1000);
        
        return () => clearTimeout(timer);
      } else {
        setBasePoint(null);
      }
    } else {
      setZipcodeValid(null);
      setBasePoint(null);
    }
  }, [zipcode, role]);

  const performGeocoding = async (zip: string) => {
    if (geocoding) return;
    
    setGeocoding(true);
    try {
      const coordinates = await getCityCoordinatesFromZipcode(zip);
      setBasePoint(coordinates);
      console.log('🎯 Base point set:', coordinates);
    } catch (error) {
      console.error('Geocoding error:', error);
      setError('Unable to locate city center. Beijing fallback will be used.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleAuth = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    // Driver-specific validations
    if (role === 'driver') {
      if (isNewUser && !zipcode.trim()) {
        setError('Zipcode is required for drivers to set up privacy protection');
        return;
      }

      if (zipcode.trim() && !validateZipcode(zipcode)) {
        setError('Please enter a valid US zipcode (e.g., 94583 or 94583-1234)');
        return;
      }

      // Ensure we have base point for drivers with zipcode
      if (zipcode.trim() && !basePoint) {
        setError('Please wait for location verification to complete');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const userId = name.trim().toLowerCase().replace(/\s+/g, '-');
      
      // Prepare enhanced user data
      const userData: EnhancedUser = {
        userId,
        name: name.trim(),
        role,
      };

      // Add driver-specific data
      if (role === 'driver' && zipcode.trim()) {
        userData.zipcode = zipcode.trim();
        userData.basePoint = basePoint || undefined;
        userData.privacySettings = {
          anonymizationRadius,
          dataRetentionPeriod,
          consentLevel
        };
      }

      // Call backend with enhanced data
      const res = await fetch(`https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/auth-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: name.trim(),
          role,
          mode: isNewUser ? 'signup' : 'signin',
          // Enhanced fields
          zipcode: userData.zipcode,
          base_point: userData.basePoint,
          privacy_settings: userData.privacySettings
        })
      });

      const data = await res.json();
      if (res.status !== 200) {
        setError(data.error || 'Something went wrong');
        return;
      }

      // Store enhanced user data locally
      const enhancedUserData = {
        userId,
        name: name.trim(),
        role,
        zipcode: userData.zipcode,
        basePoint: userData.basePoint,
        privacySettings: userData.privacySettings,
        registrationDate: new Date().toISOString()
      };

      localStorage.setItem('privacyDriveUser', JSON.stringify(enhancedUserData));
      
      console.log('✅ Enhanced user authenticated:', enhancedUserData);
      onSignIn(enhancedUserData);
      history.push(`/${role}`);

    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const getPrivacyImpactText = () => {
    if (!basePoint) return 'Location not verified';
    
    const radiusText = anonymizationRadius === 1 ? '1 mile' : `${anonymizationRadius} miles`;
    return `Your driving data will be anonymized within a ${radiusText} radius of ${basePoint.city}, ${basePoint.state}`;
  };

  const canSubmit = () => {
    if (!name.trim()) return false;
    if (loading || geocoding) return false;
    
    if (role === 'driver') {
      if (isNewUser) {
        return zipcode.trim() && zipcodeValid && basePoint;
      } else {
        return !zipcode.trim() || (zipcodeValid && basePoint);
      }
    }
    
    return true;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{isNewUser ? 'Create Account' : 'Sign In'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        {/* Basic Information */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Account Information</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonInput
                placeholder="Full Name"
                value={name}
                onIonChange={e => setName(e.detail.value!)}
                disabled={loading}
                required
              />
            </IonItem>
            
            <IonItem>
              <IonSelect 
                value={role} 
                onIonChange={e => setRole(e.detail.value)} 
                disabled={loading}
                placeholder="Select Role"
              >
                <IonSelectOption value="driver">Driver</IonSelectOption>
                <IonSelectOption value="provider">Service Provider</IonSelectOption>
              </IonSelect>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Driver Privacy Setup */}
        {role === 'driver' && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={shieldCheckmarkOutline} style={{marginRight: '8px'}} />
                Privacy Protection Setup
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText>
                <p>Enter your zipcode to set up location-based privacy protection. Your exact location will never be stored.</p>
              </IonText>

              <IonItem>
                <IonIcon icon={locationOutline} slot="start" />
                <IonInput
                  placeholder="Zipcode (e.g., 94583)"
                  value={zipcode}
                  onIonChange={e => setZipcode(e.detail.value!)}
                  disabled={loading || geocoding}
                  required={isNewUser}
                />
                {zipcodeValid === true && (
                  <IonIcon icon={shieldCheckmarkOutline} color="success" slot="end" />
                )}
                {zipcodeValid === false && (
                  <IonIcon icon={alertCircleOutline} color="danger" slot="end" />
                )}
              </IonItem>

              {geocoding && (
                <div style={{ marginTop: '10px' }}>
                  <IonLabel>Verifying location...</IonLabel>
                  <IonProgressBar type="indeterminate" color="primary" />
                </div>
              )}

              {basePoint && (
                <div style={{ marginTop: '15px' }}>
                  <IonChip color="success">
                    <IonIcon icon={shieldCheckmarkOutline} />
                    <IonLabel>
                      Verified: {basePoint.city}, {basePoint.state}
                    </IonLabel>
                  </IonChip>
                  
                  <IonText>
                    <p style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)', marginTop: '8px' }}>
                      Source: {basePoint.source === 'census' ? 'US Census' : 
                               basePoint.source === 'opencage' ? 'OpenCage' :
                               basePoint.source === 'cache' ? 'Cached' :
                               basePoint.source === 'regional' ? 'Regional Center' : 'Fallback'}
                    </p>
                  </IonText>

                  {isNewUser && (
                    <IonButton
                      fill="outline"
                      size="small"
                      onClick={() => setShowPrivacySettings(!showPrivacySettings)}
                      style={{ marginTop: '10px' }}
                    >
                      {showPrivacySettings ? 'Hide' : 'Show'} Privacy Settings
                    </IonButton>
                  )}
                </div>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* Privacy Settings (for new driver accounts) */}
        {role === 'driver' && isNewUser && showPrivacySettings && basePoint && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Privacy Settings</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel>
                  <h3>Anonymization Radius</h3>
                  <p>{anonymizationRadius} mile{anonymizationRadius !== 1 ? 's' : ''}</p>
                </IonLabel>
                <IonRange
                  min={1}
                  max={50}
                  value={anonymizationRadius}
                  onIonChange={e => setAnonymizationRadius(e.detail.value as number)}
                  pin={true}
                  snaps={true}
                  ticks={false}
                />
              </IonItem>

              <IonItem>
                <IonLabel>
                  <h3>Data Retention Period</h3>
                  <p>{dataRetentionPeriod} month{dataRetentionPeriod !== 1 ? 's' : ''}</p>
                </IonLabel>
                <IonSelect 
                  value={dataRetentionPeriod} 
                  onIonChange={e => setDataRetentionPeriod(e.detail.value)}
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
                    {consentLevel === 'full' ? 'Full analytics for best insurance rates' :
                     consentLevel === 'basic' ? 'Basic analytics only' :
                     'Minimal data sharing'}
                  </p>
                </IonLabel>
                <IonSelect 
                  value={consentLevel} 
                  onIonChange={e => setConsentLevel(e.detail.value)}
                >
                  <IonSelectOption value="full">Full Analytics</IonSelectOption>
                  <IonSelectOption value="basic">Basic Analytics</IonSelectOption>
                  <IonSelectOption value="minimal">Minimal Data</IonSelectOption>
                </IonSelect>
              </IonItem>

              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'var(--ion-color-light)', borderRadius: '8px' }}>
                <IonText>
                  <h4 style={{ margin: '0 0 8px 0' }}>Privacy Impact:</h4>
                  <p style={{ margin: 0, fontSize: '0.9em' }}>
                    {getPrivacyImpactText()}
                  </p>
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Authentication Controls */}
        <IonCard>
          <IonCardContent>
            <IonButton 
              expand="block" 
              onClick={handleAuth} 
              disabled={!canSubmit()}
              color={canSubmit() ? 'primary' : 'medium'}
            >
              {loading ? 'Please wait...' : (isNewUser ? 'Create Account' : 'Log In')}
            </IonButton>

            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <IonLabel>{isNewUser ? 'Already have an account?' : 'New user?'}</IonLabel>
              <IonButton 
                fill="clear" 
                onClick={() => {
                  setIsNewUser(!isNewUser);
                  setShowPrivacySettings(false);
                  setError('');
                }}
                disabled={loading}
              >
                {isNewUser ? 'Sign In' : 'Create Account'}
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        {error && (
          <IonCard color="danger">
            <IonCardContent>
              <IonText color="light">
                <p style={{ margin: 0 }}>{error}</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        )}
        
        <IonLoading 
          isOpen={loading} 
          message={geocoding ? "Verifying location..." : "Authenticating..."} 
        />
      </IonContent>
    </IonPage>
  );
};

export default SignIn;