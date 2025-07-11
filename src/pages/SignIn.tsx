// MODERN Professional SignIn - Clean & Elegant Authentication
import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonInput, IonSelect, IonSelectOption, IonLabel, IonToggle,
  IonLoading, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonText, IonItem, IonIcon, IonChip, IonProgressBar, IonRange,
  IonAlert
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { 
  locationOutline, shieldCheckmarkOutline, alertCircleOutline, 
  mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
  trashOutline, checkmarkCircleOutline, personOutline, 
  businessOutline, homeOutline, checkmarkDoneOutline
} from 'ionicons/icons';
import { getCityCoordinatesFromZipcode, validateZipcode, type CityCoordinates } from '../utils/geocoding';

interface SignInProps {
  onSignIn: (user: any) => void;
}

interface SecureUser {
  user_id: string;
  email: string;
  name: string;
  role: 'driver' | 'provider';
  zipcode?: string;
  base_point?: CityCoordinates;
  privacy_settings?: {
    anonymizationRadius: number;
    dataRetentionPeriod: number;
    consentLevel: 'full' | 'basic' | 'minimal';
  };
  created_at?: string;
  last_login?: string;
}

const SignIn: React.FC<SignInProps> = ({ onSignIn }) => {
  // Enhanced form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'driver' as 'driver' | 'provider',
    zipcode: '',
    isNewUser: true,
    showPassword: false,
    showConfirmPassword: false
  });
  
  const [uiState, setUiState] = useState({
    error: '',
    success: '',
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

  // Memoized handlers
  const updateFormData = useCallback((updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateUiState = useCallback((updates: Partial<typeof uiState>) => {
    setUiState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateLocationData = useCallback((updates: Partial<typeof locationData>) => {
    setLocationData(prev => ({ ...prev, ...updates }));
  }, []);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  };

  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (password.length > 128) {
      return { valid: false, message: 'Password is too long (max 128 characters)' };
    }
    if (!/[a-zA-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one letter' };
    }
    if (!/\d/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    return { valid: true, message: '' };
  };

  // Debounced zipcode validation
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

  // Form handlers
  const handleEmailChange = useCallback((value: string) => {
    updateFormData({ email: value.toLowerCase().trim() });
    if (uiState.error || uiState.success) updateUiState({ error: '', success: '' });
  }, [updateFormData, updateUiState, uiState.error, uiState.success]);

  const handlePasswordChange = useCallback((value: string) => {
    updateFormData({ password: value });
    if (uiState.error || uiState.success) updateUiState({ error: '', success: '' });
  }, [updateFormData, updateUiState, uiState.error, uiState.success]);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    updateFormData({ confirmPassword: value });
    if (uiState.error || uiState.success) updateUiState({ error: '', success: '' });
  }, [updateFormData, updateUiState, uiState.error, uiState.success]);

  const handleNameChange = useCallback((value: string) => {
    updateFormData({ name: value });
    if (uiState.error || uiState.success) updateUiState({ error: '', success: '' });
  }, [updateFormData, updateUiState, uiState.error, uiState.success]);

  const handleRoleChange = useCallback((value: 'driver' | 'provider') => {
    updateFormData({ role: value });
    if (uiState.error || uiState.success) updateUiState({ error: '', success: '' });
  }, [updateFormData, updateUiState, uiState.error, uiState.success]);

  const handleZipcodeChange = useCallback((value: string) => {
    updateFormData({ zipcode: value });
    if (uiState.error || uiState.success) updateUiState({ error: '', success: '' });
  }, [updateFormData, updateUiState, uiState.error, uiState.success]);

  // Main authentication handler
  const handleAuth = async () => {
    updateUiState({ error: '', success: '' });

    // Validate email
    if (!formData.email.trim()) {
      updateUiState({ error: 'Email is required' });
      return;
    }

    if (!validateEmail(formData.email)) {
      updateUiState({ error: 'Please enter a valid email address' });
      return;
    }

    // Validate password
    if (!formData.password) {
      updateUiState({ error: 'Password is required' });
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      updateUiState({ error: passwordValidation.message });
      return;
    }

    // For signup, validate additional fields
    if (formData.isNewUser) {
      if (!formData.name.trim()) {
        updateUiState({ error: 'Name is required' });
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        updateUiState({ error: 'Passwords do not match' });
        return;
      }

      // Driver-specific validation
      if (formData.role === 'driver') {
        if (!formData.zipcode.trim()) {
          updateUiState({ error: 'Zipcode is required for new driver accounts' });
          return;
        }

        if (!validateZipcode(formData.zipcode)) {
          updateUiState({ error: 'Please enter a valid US zipcode' });
          return;
        }

        if (!locationData.basePoint) {
          updateUiState({ error: 'Please wait for location verification to complete' });
          return;
        }
      }
    }

    updateUiState({ loading: true });

    try {
      // Prepare request data
      const requestData: any = {
        email: formData.email,
        password: formData.password,
        mode: formData.isNewUser ? 'signup' : 'signin'
      };

      // Add signup-specific data
      if (formData.isNewUser) {
        requestData.name = formData.name.trim();
        requestData.role = formData.role;

        // Add driver-specific data
        if (formData.role === 'driver') {
          requestData.zipcode = formData.zipcode.trim();
          requestData.base_point = locationData.basePoint;
          requestData.privacy_settings = privacySettings;
        }
      }

      console.log('🔐 SECURE Auth request:', {
        email: formData.email,
        mode: requestData.mode,
        role: requestData.role || 'signin'
      });

      // Call secure backend
      const response = await fetch('https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/auth-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (response.status !== 200) {
  // Special handling for existing user during signup
  if (formData.isNewUser && response.status === 409) {
    updateUiState({ 
      error: data.error,
      loading: false 
    });
    // Automatically switch to signin mode
    setTimeout(() => {
      updateFormData({ 
        isNewUser: false,
        confirmPassword: '',
        name: '',
        zipcode: ''
      });
      updateUiState({ 
        error: 'Account already exists. Please sign in with your existing credentials.',
        showPrivacySettings: false,
        loading: false 
      });
      updateLocationData({ basePoint: null, zipcodeValid: null });
    }, 2000);
    return;
  }
  updateUiState({ 
    error: data.error || 'Invalid email or password', 
    loading: false 
  });
  return;
}

      // Store user data securely
      const userData = data.user_data;
      
      // Map new user structure to old App.tsx expectations
      const mappedUserData = {
        userId: userData.user_id,
        user_id: userData.user_id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        zipcode: userData.zipcode,
        basePoint: userData.base_point,
        base_point: userData.base_point,
        privacySettings: userData.privacy_settings,
        privacy_settings: userData.privacy_settings,
        created_at: userData.created_at,
        last_login: userData.last_login,
        account_status: userData.account_status,
        privacy_level: userData.privacy_level,
        anonymization_enabled: userData.anonymization_enabled
      };
      
      localStorage.setItem('privacyDriveUser', JSON.stringify(mappedUserData));
      
      // Show success message
      updateUiState({ 
        success: formData.isNewUser ? 'Account created successfully! Redirecting...' : 'Welcome back! Redirecting...',
        loading: false 
      });

      console.log('✅ SECURE Authentication successful:', userData.email);
      console.log('✅ Mapped user data for App.tsx:', mappedUserData);

      // Redirect to appropriate page
      setTimeout(() => {
        onSignIn(mappedUserData);
        history.push(`/${userData.role}`);
      }, 1500);

    } catch (err) {
      console.error('❌ Authentication error:', err);
      updateUiState({ 
        error: err instanceof Error ? err.message : 'Network error. Please try again.',
        loading: false 
      });
    }
  };

  // Validation helpers
  const getEmailValidationIcon = () => {
    if (!formData.email) return null;
    return validateEmail(formData.email) ? 
      <IonIcon icon={checkmarkCircleOutline} color="success" slot="end" /> :
      <IonIcon icon={alertCircleOutline} color="danger" slot="end" />;
  };

  const getPasswordValidationIcon = () => {
    if (!formData.password) return null;
    const validation = validatePassword(formData.password);
    return validation.valid ? 
      <IonIcon icon={checkmarkCircleOutline} color="success" slot="end" /> :
      <IonIcon icon={alertCircleOutline} color="danger" slot="end" />;
  };

  const getPasswordMatchIcon = () => {
    if (!formData.confirmPassword || !formData.isNewUser) return null;
    return formData.password === formData.confirmPassword ? 
      <IonIcon icon={checkmarkCircleOutline} color="success" slot="end" /> :
      <IonIcon icon={alertCircleOutline} color="danger" slot="end" />;
  };

  const canSubmit = () => {
    if (uiState.loading || uiState.geocoding) return false;
    
    if (!formData.email.trim() || !validateEmail(formData.email)) return false;
    if (!formData.password || !validatePassword(formData.password).valid) return false;
    
    if (formData.isNewUser) {
      if (!formData.name.trim()) return false;
      if (formData.password !== formData.confirmPassword) return false;
      
      if (formData.role === 'driver') {
        return formData.zipcode.trim() && locationData.zipcodeValid && locationData.basePoint;
      }
    }
    
    return true;
  };

  const handleToggleUserType = () => {
    updateFormData({ 
      isNewUser: !formData.isNewUser,
      zipcode: '',
      confirmPassword: '',
      name: ''
    });
    updateUiState({ showPrivacySettings: false, error: '', success: '' });
    updateLocationData({ basePoint: null, zipcodeValid: null });
  };

  const getPrivacyImpactText = () => {
    if (!locationData.basePoint) return 'Location not verified';
    
    const radiusText = privacySettings.anonymizationRadius === 1 ? '1 mile' : `${privacySettings.anonymizationRadius} miles`;
    return `Your driving data will be anonymized within a ${radiusText} radius of ${locationData.basePoint.city}, ${locationData.basePoint.state}`;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="light">
          <IonTitle style={{ color: '#2c3e50', fontWeight: '600' }}>
            Privacy Drive - Secure Authentication
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent style={{ '--background': '#f8f9fa' }}>
        <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
          
          {/* Hero Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px',
            textAlign: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#007bff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: '2.5rem', color: 'white' }} />
            </div>
            <h1 style={{ margin: '0 0 8px 0', color: '#2c3e50', fontSize: '1.8rem', fontWeight: '700' }}>
              Privacy-Protected Driving
            </h1>
            <p style={{ margin: '0', color: '#6c757d', fontSize: '1rem', lineHeight: '1.5' }}>
              {formData.isNewUser ? 'Create your secure account' : 'Welcome back'} to the future of private driving analytics
            </p>
          </div>

          {/* Success Message */}
          {uiState.success && (
            <div style={{
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              color: '#155724'
            }}>
              <IonIcon icon={checkmarkCircleOutline} style={{ marginRight: '8px' }} />
              {uiState.success}
            </div>
          )}

          {/* Main Form */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '28px',
            marginBottom: '20px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <h2 style={{ margin: '0 0 24px 0', color: '#2c3e50', fontSize: '1.4rem', fontWeight: '600' }}>
              {formData.isNewUser ? 'Create Account' : 'Sign In'}
            </h2>

            {/* Email Field */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ color: '#495057', fontSize: '0.9rem', marginBottom: '8px', fontWeight: '500' }}>
                Email Address
              </div>
              <div style={{ position: 'relative' }}>
                <IonInput
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onIonInput={e => handleEmailChange(e.detail.value!)}
                  disabled={uiState.loading}
                  style={{
                    '--border-radius': '12px',
                    '--border-color': '#dee2e6',
                    '--padding-start': '16px',
                    '--padding-end': '50px',
                    '--background': '#f8f9fa',
                    '--color': '#495057',
                    height: '48px',
                    fontSize: '1rem'
                  }}
                />
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                  {getEmailValidationIcon()}
                </div>
              </div>
            </div>
            
            {/* Password Field */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ color: '#495057', fontSize: '0.9rem', marginBottom: '8px', fontWeight: '500' }}>
                Password
              </div>
              <div style={{ position: 'relative' }}>
                <IonInput
                  type={formData.showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onIonInput={e => handlePasswordChange(e.detail.value!)}
                  disabled={uiState.loading}
                  style={{
                    '--border-radius': '12px',
                    '--border-color': '#dee2e6',
                    '--padding-start': '16px',
                    '--padding-end': '50px',
                    '--background': '#f8f9fa',
                    '--color': '#495057',
                    height: '48px',
                    fontSize: '1rem'
                  }}
                />
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <IonButton 
                    fill="clear" 
                    size="small"
                    onClick={() => updateFormData({ showPassword: !formData.showPassword })}
                    style={{ '--color': '#6c757d', height: '32px', width: '32px' }}
                  >
                    <IonIcon icon={formData.showPassword ? eyeOffOutline : eyeOutline} />
                  </IonButton>
                  {getPasswordValidationIcon()}
                </div>
              </div>
            </div>

            {/* Password Requirements (Signup only) */}
            {formData.isNewUser && formData.password && (
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ color: '#495057', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '600' }}>
                  Password Requirements:
                </div>
                <div style={{ display: 'grid', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
                    <IonIcon 
                      icon={formData.password.length >= 8 ? checkmarkCircleOutline : alertCircleOutline} 
                      color={formData.password.length >= 8 ? 'success' : 'medium'}
                      style={{ marginRight: '6px', fontSize: '0.9rem' }}
                    />
                    At least 8 characters
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
                    <IonIcon 
                      icon={/[a-zA-Z]/.test(formData.password) ? checkmarkCircleOutline : alertCircleOutline} 
                      color={/[a-zA-Z]/.test(formData.password) ? 'success' : 'medium'}
                      style={{ marginRight: '6px', fontSize: '0.9rem' }}
                    />
                    At least one letter
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
                    <IonIcon 
                      icon={/\d/.test(formData.password) ? checkmarkCircleOutline : alertCircleOutline} 
                      color={/\d/.test(formData.password) ? 'success' : 'medium'}
                      style={{ marginRight: '6px', fontSize: '0.9rem' }}
                    />
                    At least one number
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Password (Signup only) */}
            {formData.isNewUser && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#495057', fontSize: '0.9rem', marginBottom: '8px', fontWeight: '500' }}>
                  Confirm Password
                </div>
                <div style={{ position: 'relative' }}>
                  <IonInput
                    type={formData.showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onIonInput={e => handleConfirmPasswordChange(e.detail.value!)}
                    disabled={uiState.loading}
                    style={{
                      '--border-radius': '12px',
                      '--border-color': '#dee2e6',
                      '--padding-start': '16px',
                      '--padding-end': '50px',
                      '--background': '#f8f9fa',
                      '--color': '#495057',
                      height: '48px',
                      fontSize: '1rem'
                    }}
                  />
                  <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <IonButton 
                      fill="clear" 
                      size="small"
                      onClick={() => updateFormData({ showConfirmPassword: !formData.showConfirmPassword })}
                      style={{ '--color': '#6c757d', height: '32px', width: '32px' }}
                    >
                      <IonIcon icon={formData.showConfirmPassword ? eyeOffOutline : eyeOutline} />
                    </IonButton>
                    {getPasswordMatchIcon()}
                  </div>
                </div>
              </div>
            )}

            {/* Name and Role (Signup only) */}
            {formData.isNewUser && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ color: '#495057', fontSize: '0.9rem', marginBottom: '8px', fontWeight: '500' }}>
                    Full Name
                  </div>
                  <IonInput
                    placeholder="Enter your full name"
                    value={formData.name}
                    onIonInput={e => handleNameChange(e.detail.value!)}
                    disabled={uiState.loading}
                    style={{
                      '--border-radius': '12px',
                      '--border-color': '#dee2e6',
                      '--padding-start': '16px',
                      '--padding-end': '16px',
                      '--background': '#f8f9fa',
                      '--color': '#495057',
                      height: '48px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ color: '#495057', fontSize: '0.9rem', marginBottom: '8px', fontWeight: '500' }}>
                    Account Type
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div 
                      onClick={() => handleRoleChange('driver')}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: `2px solid ${formData.role === 'driver' ? '#007bff' : '#e9ecef'}`,
                        backgroundColor: formData.role === 'driver' ? '#e7f3ff' : 'white',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <IonIcon 
                        icon={personOutline} 
                        style={{ 
                          fontSize: '1.5rem', 
                          color: formData.role === 'driver' ? '#007bff' : '#6c757d',
                          marginBottom: '8px'
                        }} 
                      />
                      <div style={{ 
                        fontWeight: '600', 
                        color: formData.role === 'driver' ? '#007bff' : '#495057',
                        fontSize: '0.9rem'
                      }}>
                        Driver
                      </div>
                    </div>
                    <div 
                      onClick={() => handleRoleChange('provider')}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: `2px solid ${formData.role === 'provider' ? '#007bff' : '#e9ecef'}`,
                        backgroundColor: formData.role === 'provider' ? '#e7f3ff' : 'white',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <IonIcon 
                        icon={businessOutline} 
                        style={{ 
                          fontSize: '1.5rem', 
                          color: formData.role === 'provider' ? '#007bff' : '#6c757d',
                          marginBottom: '8px'
                        }} 
                      />
                      <div style={{ 
                        fontWeight: '600', 
                        color: formData.role === 'provider' ? '#007bff' : '#495057',
                        fontSize: '0.9rem'
                      }}>
                        Provider
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <IonButton 
              expand="block" 
              onClick={handleAuth} 
              disabled={!canSubmit()}
              style={{
                '--background': canSubmit() ? '#007bff' : '#6c757d',
                '--color': 'white',
                '--border-radius': '12px',
                '--padding-top': '16px',
                '--padding-bottom': '16px',
                fontSize: '1.1rem',
                fontWeight: '600',
                marginBottom: '20px'
              }}
            >
              {uiState.loading ? 'Please wait...' : (formData.isNewUser ? 'Create Secure Account' : 'Sign In')}
            </IonButton>

            {/* Toggle User Type */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                {formData.isNewUser ? 'Already have an account?' : 'New user?'}
              </span>
              <IonButton 
                fill="clear" 
                onClick={handleToggleUserType}
                disabled={uiState.loading}
                style={{ '--color': '#007bff', fontWeight: '600', marginLeft: '8px' }}
              >
                {formData.isNewUser ? 'Sign In' : 'Create Account'}
              </IonButton>
            </div>
          </div>

          {/* Privacy Setup (New Drivers only) */}
          {formData.isNewUser && formData.role === 'driver' && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '28px',
              marginBottom: '20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#e7f3ff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px'
                }}>
                  <IonIcon icon={locationOutline} style={{ fontSize: '1.2rem', color: '#007bff' }} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
                    Privacy Protection Setup
                  </h3>
                  <p style={{ margin: '0', color: '#6c757d', fontSize: '0.9rem' }}>
                    Your exact location is never stored - only anonymized patterns
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#495057', fontSize: '0.9rem', marginBottom: '8px', fontWeight: '500' }}>
                  Zipcode
                </div>
                <div style={{ position: 'relative' }}>
                  <IonInput
                    placeholder="Enter your zipcode (e.g., 94583)"
                    value={formData.zipcode}
                    onIonInput={e => handleZipcodeChange(e.detail.value!)}
                    disabled={uiState.loading || uiState.geocoding}
                    style={{
                      '--border-radius': '12px',
                      '--border-color': '#dee2e6',
                      '--padding-start': '16px',
                      '--padding-end': '50px',
                      '--background': '#f8f9fa',
                      '--color': '#495057',
                      height: '48px',
                      fontSize: '1rem'
                    }}
                  />
                  <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                    {locationData.zipcodeValid === true && (
                      <IonIcon icon={checkmarkCircleOutline} color="success" />
                    )}
                    {locationData.zipcodeValid === false && (
                      <IonIcon icon={alertCircleOutline} color="danger" />
                    )}
                  </div>
                </div>
              </div>

              {uiState.geocoding && (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#e7f3ff',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid #b3d9ff'
                }}>
                  <div style={{ color: '#007bff', fontSize: '0.9rem', marginBottom: '8px', fontWeight: '500' }}>
                    Verifying location...
                  </div>
                  <IonProgressBar type="indeterminate" style={{ '--background': '#b3d9ff' }} />
                </div>
              )}

              {locationData.basePoint && (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#d4edda',
                  borderRadius: '8px',
                  border: '1px solid #c3e6cb',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <IonIcon icon={checkmarkCircleOutline} color="success" style={{ marginRight: '8px' }} />
                    <span style={{ color: '#155724', fontWeight: '600', fontSize: '0.9rem' }}>
                      Location Verified
                    </span>
                  </div>
                  <div style={{ color: '#155724', fontSize: '0.9rem' }}>
                    Privacy center: {locationData.basePoint.city}, {locationData.basePoint.state}
                  </div>
                  
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={() => updateUiState({ showPrivacySettings: !uiState.showPrivacySettings })}
                    style={{ '--color': '#155724', marginTop: '8px', fontWeight: '500' }}
                  >
                    {uiState.showPrivacySettings ? 'Hide' : 'Customize'} Privacy Settings
                  </IonButton>
                </div>
              )}

              {/* Privacy Settings */}
              {uiState.showPrivacySettings && locationData.basePoint && (
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{ margin: '0 0 16px 0', color: '#2c3e50', fontSize: '1rem', fontWeight: '600' }}>
                    Privacy Customization
                  </h4>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ color: '#495057', fontSize: '0.9rem', fontWeight: '500' }}>
                        Anonymization Radius
                      </span>
                      <span style={{ color: '#007bff', fontSize: '0.9rem', fontWeight: '600' }}>
                        {privacySettings.anonymizationRadius} mile{privacySettings.anonymizationRadius !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <IonRange
                      min={1}
                      max={50}
                      value={privacySettings.anonymizationRadius}
                      onIonChange={e => setPrivacySettings(prev => ({ ...prev, anonymizationRadius: e.detail.value as number }))}
                      pin={true}
                      snaps={true}
                      style={{ '--bar-background': '#e9ecef', '--bar-background-active': '#007bff' }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ color: '#495057', fontSize: '0.9rem', marginBottom: '8px', fontWeight: '500' }}>
                      Data Retention Period
                    </div>
                    <IonSelect 
                      value={privacySettings.dataRetentionPeriod} 
                      onIonChange={e => setPrivacySettings(prev => ({ ...prev, dataRetentionPeriod: e.detail.value }))}
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

                  <div style={{
                    padding: '12px',
                    backgroundColor: '#e7f3ff',
                    borderRadius: '6px',
                    border: '1px solid #b3d9ff'
                  }}>
                    <div style={{ color: '#007bff', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>
                      Privacy Impact:
                    </div>
                    <div style={{ color: '#495057', fontSize: '0.8rem' }}>
                      {getPrivacyImpactText()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {uiState.error && (
            <div style={{
              backgroundColor: '#fff5f5',
              border: '1px solid #feb2b2',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              color: '#c53030'
            }}>
              <IonIcon icon={alertCircleOutline} style={{ marginRight: '8px' }} />
              {uiState.error}
            </div>
          )}

          {/* Features Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600', textAlign: 'center' }}>
              Why Choose Privacy Drive?
            </h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#e7f3ff',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px'
                }}>
                  <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: '1.2rem', color: '#007bff' }} />
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.95rem' }}>
                    Privacy Protected
                  </div>
                  <div style={{ color: '#6c757d', fontSize: '0.85rem' }}>
                    Your exact location is never stored or shared
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#e8f5e8',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px'
                }}>
                  <IonIcon icon={checkmarkDoneOutline} style={{ fontSize: '1.2rem', color: '#28a745' }} />
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.95rem' }}>
                    Industry Standard
                  </div>
                  <div style={{ color: '#6c757d', fontSize: '0.85rem' }}>
                    Professional driving analytics for insurance
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px'
                }}>
                  <IonIcon icon={homeOutline} style={{ fontSize: '1.2rem', color: '#ffc107' }} />
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.95rem' }}>
                    User Controlled
                  </div>
                  <div style={{ color: '#6c757d', fontSize: '0.85rem' }}>
                    You control your data retention and privacy settings
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Loading States */}
        <IonLoading 
          isOpen={uiState.loading} 
          message={uiState.geocoding ? "Verifying location..." : "Authenticating..."} 
        />
      </IonContent>
    </IonPage>
  );
};

export default SignIn;