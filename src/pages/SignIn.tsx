// frontend/src/pages/SignIn.tsx - Fixed: Zipcode only for new users, settings for existing
import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonInput, IonSelect, IonSelectOption, IonLabel, IonToggle,
  IonLoading, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonText, IonItem, IonIcon, IonChip, IonProgressBar, IonRange
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { locationOutline, shieldCheckmarkOutline, alertCircleOutline } from 'ionicons/icons';
import { getCityCoordinatesFromZipcode, validateZipcode, type CityCoordinates } from '../utils/geocoding';

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

  // Only validate zipcode for NEW DRIVER accounts
  useEffect(() => {
    if (zipcode.trim() && isNewUser && role === 'driver') {
      const isValid = validateZipcode(zipcode);
      setZipcodeValid(isValid);
      
      if (isValid) {
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
  }, [zipcode, role, isNewUser]);

  const performGeocoding = async (zip: string) => {
    if (geocoding) return;
    
    setGeocoding(true);
    try {
      const coordinates = await getCityCoordinatesFromZipcode(zip);
      setBasePoint(coordinates);
      console.log('🎯 Base point set for new user:', coordinates);
    } catch (error) {
      console.error('Geocoding error:', error);
      setError('Unable to locate city center. Please try a different zipcode.');
    } finally {
      setGeocoding(false);
    }
  };

// REPLACE your handleAuth function in SignIn.tsx with this:

const handleAuth = async () => {
  if (!name.trim()) {
    setError('Name is required');
    return;
  }

  // NEW DRIVER validation - zipcode required
  if (isNewUser && role === 'driver') {
    if (!zipcode.trim()) {
      setError('Zipcode is required for new driver accounts to set up privacy protection');
      return;
    }

    if (!validateZipcode(zipcode)) {
      setError('Please enter a valid US zipcode (e.g., 94583 or 94583-1234)');
      return;
    }

    if (!basePoint) {
      setError('Please wait for location verification to complete');
      return;
    }
  }

  // EXISTING USER validation - no zipcode required
  if (!isNewUser && zipcode.trim()) {
    setError('Existing users should manage zipcode in Settings, not during signin');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const userId = name.trim().toLowerCase().replace(/\s+/g, '-');
    
    // Prepare user data
    const userData: EnhancedUser = {
      userId,
      name: name.trim(),
      role,
    };

    // Only add privacy data for NEW drivers
    if (isNewUser && role === 'driver' && zipcode.trim()) {
      userData.zipcode = zipcode.trim();
      userData.basePoint = basePoint || undefined;
      userData.privacySettings = {
        anonymizationRadius,
        dataRetentionPeriod,
        consentLevel
      };
    }

    console.log('🔐 Auth request:', {
      userId,
      role,
      mode: isNewUser ? 'signup' : 'signin',
      hasZipcode: !!userData.zipcode
    });

    // Call backend
    const res = await fetch(`https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/auth-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        name: name.trim(),
        role,
        mode: isNewUser ? 'signup' : 'signin',
        // Only send zipcode data for new users
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

    // FIXED: Use returned user data (includes stored zipcode/base point for existing users)
    const finalUserData = {
      userId,
      name: name.trim(),
      role,
      // FIXED: For existing users, use their stored data; for new users, use local data
      zipcode: data.user_data?.zipcode || userData.zipcode,
      basePoint: data.user_data?.base_point || userData.basePoint,
      privacySettings: data.user_data?.privacy_settings || userData.privacySettings,
      registrationDate: data.user_data?.created_at || new Date().toISOString()
    };

    localStorage.setItem('privacyDriveUser', JSON.stringify(finalUserData));
    
    console.log('✅ User authenticated with complete data:', finalUserData);
    onSignIn(finalUserData);
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
    
    if (isNewUser && role === 'driver') {
      // New drivers need valid zipcode
      return zipcode.trim() && zipcodeValid && basePoint;
    } else {
      // Existing users and providers just need name
      return true;
    }
  };

  const handleToggleUserType = () => {
    setIsNewUser(!isNewUser);
    setShowPrivacySettings(false);
    setError('');
    // Clear zipcode fields when switching to existing user
    if (isNewUser) {
      setZipcode('');
      setBasePoint(null);
      setZipcodeValid(null);
    }
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

        {/* Driver Privacy Setup - ONLY for NEW users */}
        {isNewUser && role === 'driver' && (
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
                  required
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
                      Source: {basePoint.source === 'zippopotam' ? 'Zippopotam API' : 
                               basePoint.source === 'cache' ? 'Cached' : 'Fallback'}
                    </p>
                  </IonText>

                  <IonButton
                    fill="outline"
                    size="small"
                    onClick={() => setShowPrivacySettings(!showPrivacySettings)}
                    style={{ marginTop: '10px' }}
                  >
                    {showPrivacySettings ? 'Hide' : 'Show'} Privacy Settings
                  </IonButton>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* Privacy Settings (for new driver accounts) */}
        {isNewUser && role === 'driver' && showPrivacySettings && basePoint && (
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

        {/* Existing User Notice */}
        {!isNewUser && (
          <IonCard>
            <IonCardContent>
              <IonText>
                <p><strong>Existing User:</strong> After signing in, you can manage your zipcode and privacy settings from your dashboard.</p>
              </IonText>
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
                onClick={handleToggleUserType}
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