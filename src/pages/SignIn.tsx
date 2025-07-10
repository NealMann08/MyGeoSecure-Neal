// frontend/src/pages/SignIn.tsx - FIXED: Input clearing issue
import React, { useState, useEffect, useCallback } from 'react';
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
  // FIXED: Stable state management to prevent input clearing
  const [formData, setFormData] = useState({
    name: '',
    role: 'driver' as 'driver' | 'provider',
    zipcode: '',
    isNewUser: true
  });
  
  const [uiState, setUiState] = useState({
    error: '',
    loading: false,
    geocoding: false,
    showPrivacySettings: false
  });
  
  const [locationData, setLocationData] = useState({
    basePoint: null as CityCoordinates | null,
    zipcodeValid: null as boolean | null
  });
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    anonymizationRadius: 10,
    dataRetentionPeriod: 12,
    consentLevel: 'full' as 'full' | 'basic' | 'minimal'
  });

  const history = useHistory();

  // FIXED: Memoized handlers to prevent re-renders
  const updateFormData = useCallback((updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateUiState = useCallback((updates: Partial<typeof uiState>) => {
    setUiState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateLocationData = useCallback((updates: Partial<typeof locationData>) => {
    setLocationData(prev => ({ ...prev, ...updates }));
  }, []);

  // FIXED: Debounced zipcode validation
  useEffect(() => {
    if (formData.zipcode.trim() && formData.isNewUser && formData.role === 'driver') {
      const isValid = validateZipcode(formData.zipcode);
      updateLocationData({ zipcodeValid: isValid });
      
      if (isValid) {
        const timer = setTimeout(() => {
          performGeocoding(formData.zipcode);
        }, 1000);
        
        return () => clearTimeout(timer);
      } else {
        updateLocationData({ basePoint: null });
      }
    } else {
      updateLocationData({ zipcodeValid: null, basePoint: null });
    }
  }, [formData.zipcode, formData.role, formData.isNewUser, updateLocationData]);

  const performGeocoding = async (zip: string) => {
    if (uiState.geocoding) return;
    
    updateUiState({ geocoding: true });
    try {
      const coordinates = await getCityCoordinatesFromZipcode(zip);
      updateLocationData({ basePoint: coordinates });
      console.log('🎯 Base point set for new user:', coordinates);
    } catch (error) {
      console.error('Geocoding error:', error);
      updateUiState({ error: 'Unable to locate city center. Please try a different zipcode.' });
    } finally {
      updateUiState({ geocoding: false });
    }
  };

  // FIXED: Stable form handlers
  const handleNameChange = useCallback((value: string) => {
    updateFormData({ name: value });
    if (uiState.error) updateUiState({ error: '' });
  }, [updateFormData, updateUiState, uiState.error]);

  const handleRoleChange = useCallback((value: 'driver' | 'provider') => {
    updateFormData({ role: value });
    if (uiState.error) updateUiState({ error: '' });
  }, [updateFormData, updateUiState, uiState.error]);

  const handleZipcodeChange = useCallback((value: string) => {
    updateFormData({ zipcode: value });
    if (uiState.error) updateUiState({ error: '' });
  }, [updateFormData, updateUiState, uiState.error]);

  const handleAuth = async () => {
    if (!formData.name.trim()) {
      updateUiState({ error: 'Name is required' });
      return;
    }

    // NEW DRIVER validation - zipcode required
    if (formData.isNewUser && formData.role === 'driver') {
      if (!formData.zipcode.trim()) {
        updateUiState({ error: 'Zipcode is required for new driver accounts to set up privacy protection' });
        return;
      }

      if (!validateZipcode(formData.zipcode)) {
        updateUiState({ error: 'Please enter a valid US zipcode (e.g., 94583 or 94583-1234)' });
        return;
      }

      if (!locationData.basePoint) {
        updateUiState({ error: 'Please wait for location verification to complete' });
        return;
      }
    }

    // EXISTING USER validation - no zipcode required
    if (!formData.isNewUser && formData.zipcode.trim()) {
      updateUiState({ error: 'Existing users should manage zipcode in Settings, not during signin' });
      return;
    }

    updateUiState({ loading: true, error: '' });

    try {
      const userId = formData.name.trim().toLowerCase().replace(/\s+/g, '-');
      
      // Prepare user data
      const userData: EnhancedUser = {
        userId,
        name: formData.name.trim(),
        role: formData.role,
      };

      // Only add privacy data for NEW drivers
      if (formData.isNewUser && formData.role === 'driver' && formData.zipcode.trim()) {
        userData.zipcode = formData.zipcode.trim();
        userData.basePoint = locationData.basePoint || undefined;
        userData.privacySettings = privacySettings;
      }

      console.log('🔐 Auth request:', {
        userId,
        role: formData.role,
        mode: formData.isNewUser ? 'signup' : 'signin',
        hasZipcode: !!userData.zipcode
      });

      // Call backend
      const res = await fetch(`https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/auth-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: formData.name.trim(),
          role: formData.role,
          mode: formData.isNewUser ? 'signup' : 'signin',
          zipcode: userData.zipcode,
          base_point: userData.basePoint,
          privacy_settings: userData.privacySettings
        })
      });

      const data = await res.json();
      if (res.status !== 200) {
        updateUiState({ error: data.error || 'Something went wrong' });
        return;
      }

      // FIXED: Use returned user data
      const finalUserData = {
        userId,
        name: formData.name.trim(),
        role: formData.role,
        zipcode: data.user_data?.zipcode || userData.zipcode,
        basePoint: data.user_data?.base_point || userData.basePoint,
        privacySettings: data.user_data?.privacy_settings || userData.privacySettings,
        registrationDate: data.user_data?.created_at || new Date().toISOString()
      };

      localStorage.setItem('privacyDriveUser', JSON.stringify(finalUserData));
      
      console.log('✅ User authenticated with complete data:', finalUserData);
      onSignIn(finalUserData);
      history.push(`/${formData.role}`);

    } catch (err) {
      console.error('Auth error:', err);
      updateUiState({ error: err instanceof Error ? err.message : 'Authentication failed' });
    } finally {
      updateUiState({ loading: false });
    }
  };

  const getPrivacyImpactText = () => {
    if (!locationData.basePoint) return 'Location not verified';
    
    const radiusText = privacySettings.anonymizationRadius === 1 ? '1 mile' : `${privacySettings.anonymizationRadius} miles`;
    return `Your driving data will be anonymized within a ${radiusText} radius of ${locationData.basePoint.city}, ${locationData.basePoint.state}`;
  };

  const canSubmit = () => {
    if (!formData.name.trim()) return false;
    if (uiState.loading || uiState.geocoding) return false;
    
    if (formData.isNewUser && formData.role === 'driver') {
      return formData.zipcode.trim() && locationData.zipcodeValid && locationData.basePoint;
    } else {
      return true;
    }
  };

  const handleToggleUserType = () => {
    updateFormData({ 
      isNewUser: !formData.isNewUser,
      zipcode: formData.isNewUser ? '' : formData.zipcode // Clear zipcode when switching to existing user
    });
    updateUiState({ showPrivacySettings: false, error: '' });
    updateLocationData({ basePoint: null, zipcodeValid: null });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{formData.isNewUser ? 'Create Account' : 'Sign In'}</IonTitle>
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
                value={formData.name}
                onIonInput={e => handleNameChange(e.detail.value!)}
                disabled={uiState.loading}
                required
                clearInput
              />
            </IonItem>
            
            <IonItem>
              <IonSelect 
                value={formData.role} 
                onIonChange={e => handleRoleChange(e.detail.value)} 
                disabled={uiState.loading}
                placeholder="Select Role"
              >
                <IonSelectOption value="driver">Driver</IonSelectOption>
                <IonSelectOption value="provider">Service Provider</IonSelectOption>
              </IonSelect>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Driver Privacy Setup - ONLY for NEW users */}
        {formData.isNewUser && formData.role === 'driver' && (
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
                  value={formData.zipcode}
                  onIonInput={e => handleZipcodeChange(e.detail.value!)}
                  disabled={uiState.loading || uiState.geocoding}
                  required
                  clearInput
                />
                {locationData.zipcodeValid === true && (
                  <IonIcon icon={shieldCheckmarkOutline} color="success" slot="end" />
                )}
                {locationData.zipcodeValid === false && (
                  <IonIcon icon={alertCircleOutline} color="danger" slot="end" />
                )}
              </IonItem>

              {uiState.geocoding && (
                <div style={{ marginTop: '10px' }}>
                  <IonLabel>Verifying location...</IonLabel>
                  <IonProgressBar type="indeterminate" color="primary" />
                </div>
              )}

              {locationData.basePoint && (
                <div style={{ marginTop: '15px' }}>
                  <IonChip color="success">
                    <IonIcon icon={shieldCheckmarkOutline} />
                    <IonLabel>
                      Verified: {locationData.basePoint.city}, {locationData.basePoint.state}
                    </IonLabel>
                  </IonChip>
                  
                  <IonText>
                    <p style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)', marginTop: '8px' }}>
                      Source: {locationData.basePoint.source === 'zippopotam' ? 'Zippopotam API' : 
                               locationData.basePoint.source === 'cache' ? 'Cached' : 'Fallback'}
                    </p>
                  </IonText>

                  <IonButton
                    fill="outline"
                    size="small"
                    onClick={() => updateUiState({ showPrivacySettings: !uiState.showPrivacySettings })}
                    style={{ marginTop: '10px' }}
                  >
                    {uiState.showPrivacySettings ? 'Hide' : 'Show'} Privacy Settings
                  </IonButton>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* Privacy Settings */}
        {formData.isNewUser && formData.role === 'driver' && uiState.showPrivacySettings && locationData.basePoint && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Privacy Settings</IonCardTitle>
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
                  onIonChange={e => setPrivacySettings(prev => ({ ...prev, anonymizationRadius: e.detail.value as number }))}
                  pin={true}
                  snaps={true}
                  ticks={false}
                />
              </IonItem>

              <IonItem>
                <IonLabel>
                  <h3>Data Retention Period</h3>
                  <p>{privacySettings.dataRetentionPeriod} month{privacySettings.dataRetentionPeriod !== 1 ? 's' : ''}</p>
                </IonLabel>
                <IonSelect 
                  value={privacySettings.dataRetentionPeriod} 
                  onIonChange={e => setPrivacySettings(prev => ({ ...prev, dataRetentionPeriod: e.detail.value }))}
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
        {!formData.isNewUser && formData.role === 'driver' && (
          <IonCard>
            <IonCardContent>
              <IonText>
                <p><strong>Existing Driver:</strong> After signing in, you can manage your zipcode and privacy settings from your dashboard.</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        )}

        {/* Provider Notice */}
        {formData.role === 'provider' && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Service Provider Access</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText>
                <p>As a service provider, you can analyze driver data to assess risk and driving behavior patterns.</p>
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
              {uiState.loading ? 'Please wait...' : (formData.isNewUser ? 'Create Account' : 'Log In')}
            </IonButton>

            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <IonLabel>{formData.isNewUser ? 'Already have an account?' : 'New user?'}</IonLabel>
              <IonButton 
                fill="clear" 
                onClick={handleToggleUserType}
                disabled={uiState.loading}
              >
                {formData.isNewUser ? 'Sign In' : 'Create Account'}
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        {uiState.error && (
          <IonCard color="danger">
            <IonCardContent>
              <IonText color="light">
                <p style={{ margin: 0 }}>{uiState.error}</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        )}
        
        <IonLoading 
          isOpen={uiState.loading} 
          message={uiState.geocoding ? "Verifying location..." : "Authenticating..."} 
        />
      </IonContent>
    </IonPage>
  );
};

export default SignIn;