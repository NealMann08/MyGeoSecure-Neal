// PROFESSIONAL Insurance Provider Dashboard - Clean & Corporate Ready
import React, { useState, useCallback } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonInput, IonButton, IonLabel, IonText, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonLoading, IonList, IonItem, 
  IonGrid, IonRow, IonCol, IonButtons, IonIcon, IonNote,
  IonAccordion, IonAccordionGroup
} from '@ionic/react';
import { 
  logOutOutline, searchOutline, documentTextOutline,
  mailOutline, personOutline, shieldCheckmarkOutline,
  checkmarkCircle, warningOutline, informationCircle
} from 'ionicons/icons';

interface EnhancedTripSummary {
  trip_id: string;
  start_timestamp: string;
  end_timestamp: string;
  total_distance_miles: number;
  duration_minutes: number;
  formatted_duration?: string;
  avg_speed_mph: number;
  max_speed_mph: number;
  sudden_accelerations: number;
  sudden_decelerations: number;
  hard_stops: number;
  safe_turns: number;
  aggressive_turns: number;
  dangerous_turns: number;
  behavior_score: number;
  behavior_category: string;
  data_quality_score: number;
  enhanced_metrics: boolean;
  gentle_acceleration_score: number;
  turn_speed_score: number;
  events_per_100_miles?: number;
  events_per_1000_miles?: number;
  industry_rating?: string;
  industry_percentile?: number;
  frequency_score?: number;
}

interface EnhancedDriverAnalytics {
  user_id: string;
  user_email?: string;
  user_name?: string;
  searched_by?: string;
  analysis_timestamp: string;
  data_version: string;
  algorithm_version?: string;
  total_trips: number;
  total_distance_miles: number;
  total_driving_time_hours: number;
  formatted_total_time?: string;
  avg_trip_distance_miles: number;
  avg_trip_duration_minutes: number;
  formatted_avg_duration?: string;
  overall_avg_speed_mph: number;
  overall_max_speed_mph: number;
  speed_consistency_score: number;
  total_sudden_accelerations: number;
  total_sudden_decelerations: number;
  total_hard_stops: number;
  total_dangerous_turns: number;
  overall_behavior_score: number;
  risk_level: string;
  harsh_events_per_100_miles?: number;
  harsh_events_per_hour?: number;
  events_per_1000_miles?: number;
  events_per_100_miles?: number;
  industry_rating?: string;
  industry_percentile?: number;
  data_quality_score: number;
  enhanced_data_percentage: number;
  avg_gentle_acceleration_score: number;
  avg_acceleration_consistency: number;
  avg_turn_speed_score: number;
  safe_turns_percentage: number;
  trips: EnhancedTripSummary[];
  analysis_method?: string;
  speed_consistency_algorithm?: string;
  frequency_integration?: string;
  email_lookup_enabled?: boolean;
}

interface ProviderHomeProps {
  user: any;
  onSignOut?: () => void;
}

const ProviderHome: React.FC<ProviderHomeProps> = ({ user, onSignOut }) => {
  const [searchInput, setSearchInput] = useState('');
  const [searchType, setSearchType] = useState<'email' | 'legacy'>('email');
  const [analytics, setAnalytics] = useState<EnhancedDriverAnalytics | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<EnhancedTripSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  };

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInput(value);
    if (error) setError('');
    
    // Auto-detect search type
    if (value.includes('@')) {
      setSearchType('email');
    } else if (value.includes('-') || value.length > 20) {
      setSearchType('legacy');
    }
  }, [error]);

  const safeToFixed = (value: number | undefined | null, decimals: number = 1): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    return Number(value).toFixed(decimals);
  };

  const safeNumber = (value: number | undefined | null): number => {
    if (value === undefined || value === null || isNaN(value)) {
      return 0;
    }
    return Number(value);
  };

  const handleAnalyzeDriver = async () => {
    if (!searchInput.trim()) {
      setError('Driver email or ID is required');
      return;
    }

    const trimmedInput = searchInput.trim();

    if (searchType === 'email' && !validateEmail(trimmedInput)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setAnalytics(null);
    setSelectedTrip(null);

    try {
      const searchParam = searchType === 'email' ? 'email' : 'user_id';
      const apiUrl = `https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/analyze-driver?${searchParam}=${encodeURIComponent(trimmedInput)}`;
      
      const res = await fetch(apiUrl);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Network error' }));
        
        if (res.status === 404) {
          if (searchType === 'email') {
            throw new Error(`Driver not found: ${trimmedInput}`);
          } else {
            throw new Error(`Driver not found: ${trimmedInput}`);
          }
        }
        
        throw new Error(errorData.error || `Error ${res.status}`);
      }

      const data = await res.json();
      setAnalytics(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze driver');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleAnalyzeDriver();
    }
  };

  const getRiskLevel = (score: number): { level: string; color: string } => {
    if (score >= 85) return { level: 'Very Low Risk', color: '#28a745' };
    if (score >= 75) return { level: 'Low Risk', color: '#6c757d' };
    if (score >= 65) return { level: 'Medium Risk', color: '#ffc107' };
    if (score >= 50) return { level: 'High Risk', color: '#fd7e14' };
    return { level: 'Very High Risk', color: '#dc3545' };
  };

  const getIndustryRating = (rating: string): { color: string; description: string } => {
    switch (rating?.toLowerCase()) {
      case 'exceptional':
      case 'excellent': 
        return { color: '#28a745', description: 'Preferred driver profile' };
      case 'very good':
      case 'good': 
        return { color: '#6c757d', description: 'Standard driver profile' };
      case 'fair': 
        return { color: '#ffc107', description: 'Elevated risk profile' };
      case 'poor':
      case 'dangerous': 
        return { color: '#dc3545', description: 'High risk profile' };
      default: 
        return { color: '#6c757d', description: 'Rating unavailable' };
    }
  };

  const formatDate = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDuration = (minutes: number | undefined): string => {
    if (!minutes || isNaN(minutes)) return '0m';
    
    const totalMinutes = Math.round(minutes);
    
    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;
      return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`;
    }
  };

  const getFrequencyMetrics = (analytics: EnhancedDriverAnalytics) => {
    const per100Miles = analytics.events_per_100_miles || 
                       analytics.harsh_events_per_100_miles || 
                       (analytics.events_per_1000_miles ? analytics.events_per_1000_miles / 10 : 0);
    return per100Miles;
  };

  const handleSignOut = () => {
    localStorage.removeItem('privacyDriveUser');
    if (onSignOut) {
      onSignOut();
    }
  };

  const selectTrip = (trip: EnhancedTripSummary) => {
    setSelectedTrip(selectedTrip?.trip_id === trip.trip_id ? null : trip);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="light">
          <IonTitle style={{ color: '#2c3e50', fontWeight: '600' }}>
            Insurance Analytics Dashboard
          </IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={handleSignOut} style={{ color: '#6c757d' }}>
              <IonIcon icon={logOutOutline} />
              <IonLabel style={{ marginLeft: '4px' }}>Sign Out</IonLabel>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#f8f9fa' }}>
        {/* Search Section */}
        <div style={{ padding: '20px', backgroundColor: 'white', borderBottom: '1px solid #dee2e6' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '1.5rem', fontWeight: '600' }}>
              Driver Risk Assessment
            </h2>
            <p style={{ margin: '0 0 20px 0', color: '#6c757d', fontSize: '0.95rem' }}>
              Search by driver email address to generate comprehensive risk analysis
            </p>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <IonInput
                  placeholder="Enter driver email address"
                  value={searchInput}
                  onIonInput={e => handleSearchInputChange(e.detail.value!)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  clearInput
                  type="email"
                  style={{
                    '--border-radius': '8px',
                    '--border-color': '#dee2e6',
                    '--padding-start': '12px',
                    '--padding-end': '12px',
                    '--background': 'white',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <IonButton
                onClick={handleAnalyzeDriver}
                disabled={!searchInput.trim() || loading || (searchType === 'email' && !validateEmail(searchInput))}
                style={{
                  '--background': '#007bff',
                  '--color': 'white',
                  '--border-radius': '8px',
                  '--padding-start': '20px',
                  '--padding-end': '20px',
                  height: '44px'
                }}
              >
                <IonIcon icon={searchOutline} slot="start" />
                Analyze
              </IonButton>
            </div>

            {error && (
              <div style={{
                marginTop: '15px',
                padding: '12px',
                backgroundColor: '#fff5f5',
                border: '1px solid #feb2b2',
                borderRadius: '8px',
                color: '#c53030'
              }}>
                <IonIcon icon={warningOutline} style={{ marginRight: '8px' }} />
                {error}
              </div>
            )}
          </div>
        </div>

        {analytics && (
          <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Driver Overview */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#2c3e50', fontSize: '1.3rem', fontWeight: '600' }}>
                    {analytics.user_name || 'Driver Analysis'}
                  </h3>
                  <p style={{ margin: '0 0 4px 0', color: '#6c757d', fontSize: '0.95rem' }}>
                    <strong>Email:</strong> {analytics.user_email || 'Not available'}
                  </p>
                  <p style={{ margin: '0', color: '#6c757d', fontSize: '0.9rem' }}>
                    Analysis Date: {formatDate(analytics.analysis_timestamp)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    color: getRiskLevel(analytics.overall_behavior_score).color,
                    lineHeight: '1'
                  }}>
                    {safeToFixed(analytics.overall_behavior_score, 0)}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: getRiskLevel(analytics.overall_behavior_score).color,
                    fontWeight: '600',
                    marginTop: '4px'
                  }}>
                    {getRiskLevel(analytics.overall_behavior_score).level}
                  </div>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div>
                  <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Total Trips</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2c3e50' }}>{analytics.total_trips}</div>
                </div>
                <div>
                  <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Total Distance</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2c3e50' }}>{safeToFixed(analytics.total_distance_miles, 0)} mi</div>
                </div>
                <div>
                  <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Driving Time</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2c3e50' }}>{analytics.formatted_total_time || formatDuration(analytics.total_driving_time_hours * 60)}</div>
                </div>
                <div>
                  <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '4px' }}>Avg Speed</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#2c3e50' }}>{safeToFixed(analytics.overall_avg_speed_mph, 1)} mph</div>
                </div>
              </div>
            </div>

            {/* Risk Analysis */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <h4 style={{ margin: '0 0 20px 0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
                Risk Assessment
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div>
                  <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '8px' }}>Industry Rating</div>
                  <div style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    backgroundColor: getIndustryRating(analytics.industry_rating || '').color + '15',
                    color: getIndustryRating(analytics.industry_rating || '').color,
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    {analytics.industry_rating || 'Not Available'}
                  </div>
                  <div style={{ color: '#6c757d', fontSize: '0.8rem', marginTop: '4px' }}>
                    {getIndustryRating(analytics.industry_rating || '').description}
                  </div>
                </div>
                
                <div>
                  <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '8px' }}>Events per 100 Miles</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '600', color: '#2c3e50' }}>
                    {safeToFixed(getFrequencyMetrics(analytics), 2)}
                  </div>
                  <div style={{ color: '#6c757d', fontSize: '0.8rem', marginTop: '4px' }}>
                    Industry benchmark metric
                  </div>
                </div>
                
                <div>
                  <div style={{ color: '#6c757d', fontSize: '0.85rem', marginBottom: '8px' }}>Speed Consistency</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '600', color: '#2c3e50' }}>
                    {safeToFixed(analytics.speed_consistency_score, 0)}/100
                  </div>
                  <div style={{ color: '#6c757d', fontSize: '0.8rem', marginTop: '4px' }}>
                    Smooth driving indicator
                  </div>
                </div>
              </div>
            </div>

            {/* Trip Details */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: '0', color: '#2c3e50', fontSize: '1.2rem', fontWeight: '600' }}>
                  Trip History ({analytics.trips?.length || 0} trips)
                </h4>
                <IonButton
                  fill="clear"
                  onClick={() => setShowDetailedView(!showDetailedView)}
                  style={{ '--color': '#007bff', fontSize: '0.9rem' }}
                >
                  <IonIcon icon={documentTextOutline} slot="start" />
                  {showDetailedView ? 'Hide Details' : 'Show Details'}
                </IonButton>
              </div>

              {analytics.trips && analytics.trips.length > 0 ? (
                <div>
                  {analytics.trips.slice(0, showDetailedView ? analytics.trips.length : 5).map((trip, index) => (
                    <div
                      key={trip.trip_id}
                      style={{
                        padding: '16px',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        cursor: 'pointer',
                        backgroundColor: selectedTrip?.trip_id === trip.trip_id ? '#f8f9fa' : 'white'
                      }}
                      onClick={() => selectTrip(trip)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ color: '#2c3e50', fontSize: '0.95rem' }}>
                            Trip {index + 1} - {formatDate(trip.start_timestamp)}
                          </strong>
                        </div>
                        <div style={{
                          padding: '4px 8px',
                          backgroundColor: getRiskLevel(trip.behavior_score).color + '15',
                          color: getRiskLevel(trip.behavior_score).color,
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}>
                          Score: {safeToFixed(trip.behavior_score, 0)}
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', fontSize: '0.85rem', color: '#6c757d' }}>
                        <div><strong>Distance:</strong> {safeToFixed(trip.total_distance_miles, 1)} mi</div>
                        <div><strong>Duration:</strong> {formatDuration(trip.duration_minutes)}</div>
                        <div><strong>Avg Speed:</strong> {safeToFixed(trip.avg_speed_mph, 1)} mph</div>
                        <div><strong>Max Speed:</strong> {safeToFixed(trip.max_speed_mph, 1)} mph</div>
                      </div>

                      {selectedTrip?.trip_id === trip.trip_id && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e9ecef' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', fontSize: '0.85rem' }}>
                            <div>
                              <div style={{ color: '#6c757d' }}>Sudden Accelerations</div>
                              <div style={{ fontWeight: '600', color: '#2c3e50' }}>{trip.sudden_accelerations}</div>
                            </div>
                            <div>
                              <div style={{ color: '#6c757d' }}>Hard Stops</div>
                              <div style={{ fontWeight: '600', color: '#2c3e50' }}>{trip.hard_stops}</div>
                            </div>
                            <div>
                              <div style={{ color: '#6c757d' }}>Dangerous Turns</div>
                              <div style={{ fontWeight: '600', color: '#2c3e50' }}>{trip.dangerous_turns}</div>
                            </div>
                            <div>
                              <div style={{ color: '#6c757d' }}>Safe Turns</div>
                              <div style={{ fontWeight: '600', color: '#2c3e50' }}>{trip.safe_turns}</div>
                            </div>
                            <div>
                              <div style={{ color: '#6c757d' }}>Events/100mi</div>
                              <div style={{ fontWeight: '600', color: '#2c3e50' }}>{safeToFixed(trip.events_per_100_miles || 0, 2)}</div>
                            </div>
                            <div>
                              <div style={{ color: '#6c757d' }}>Industry Rating</div>
                              <div style={{ fontWeight: '600', color: getIndustryRating(trip.industry_rating || '').color }}>
                                {trip.industry_rating || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {!showDetailedView && analytics.trips.length > 5 && (
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                      <IonButton
                        fill="clear"
                        onClick={() => setShowDetailedView(true)}
                        style={{ '--color': '#007bff' }}
                      >
                        Show {analytics.trips.length - 5} more trips
                      </IonButton>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#6c757d', padding: '40px' }}>
                  <IonIcon icon={informationCircle} style={{ fontSize: '2rem', marginBottom: '8px' }} />
                  <p>No trip data available for this driver</p>
                </div>
              )}
            </div>
          </div>
        )}

        <IonLoading 
          isOpen={loading} 
          message="Analyzing driver data..." 
        />
      </IonContent>
    </IonPage>
  );
};

export default ProviderHome;