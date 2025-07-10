// frontend/src/pages/ProviderHome.tsx - FIXED: Proper Industry Integration
import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonInput, IonButton, IonLabel, IonText, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonLoading, IonSegment, IonSegmentButton,
  IonList, IonItem, IonItemDivider, IonBadge, IonGrid, IonRow, IonCol,
  IonButtons, IonIcon, IonProgressBar, IonChip
} from '@ionic/react';
import { logOutOutline, checkmarkCircle, warningOutline, alertCircle } from 'ionicons/icons';

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
  // FIXED: Industry metrics
  events_per_100_miles?: number;
  events_per_1000_miles?: number;
  industry_rating?: string;
  industry_percentile?: number;
  frequency_score?: number;
}

interface EnhancedDriverAnalytics {
  user_id: string;
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
  // FIXED: Multiple frequency metric names for compatibility
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
  // Algorithm info
  analysis_method?: string;
  speed_consistency_algorithm?: string;
  frequency_integration?: string;
}

interface ProviderHomeProps {
  user: any;
  onSignOut?: () => void;
}

const ProviderHome: React.FC<ProviderHomeProps> = ({ user, onSignOut }) => {
  const [searchId, setSearchId] = useState('');
  const [analytics, setAnalytics] = useState<EnhancedDriverAnalytics | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<EnhancedTripSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSegment, setActiveSegment] = useState<string>('overview');

  // FIXED: Safe value handling functions
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
    if (!searchId.trim()) {
      setError('Driver ID is required');
      return;
    }

    setLoading(true);
    setError('');
    setAnalytics(null);
    setSelectedTrip(null);

    try {
      const res = await fetch(`https://m9yn8bsm3k.execute-api.us-west-1.amazonaws.com/analyze-driver?user_id=${encodeURIComponent(searchId.trim())}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setAnalytics(data);
      setActiveSegment('overview');
    } catch (err) {
      console.error('Analyze driver error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze driver data');
    } finally {
      setLoading(false);
    }
  };

  const getBehaviorColor = (score: number): string => {
    if (score >= 85) return 'success';
    if (score >= 75) return 'warning';
    if (score >= 60) return 'medium';
    return 'danger';
  };

  const getRiskColor = (risk: string): string => {
    switch (risk.toLowerCase()) {
      case 'very low':
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high':
      case 'very high': return 'danger';
      default: return 'medium';
    }
  };

  const getDataQualityColor = (score: number): string => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'danger';
  };

  // FIXED: Industry rating color function
  const getIndustryRatingColor = (rating: string): string => {
    switch (rating?.toLowerCase()) {
      case 'excellent': return 'success';
      case 'very good': return 'success';
      case 'good': return 'warning';
      case 'fair': return 'warning';
      case 'poor': return 'danger';
      case 'dangerous': return 'danger';
      default: return 'medium';
    }
  };

  const formatDate = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // FIXED: Smart duration formatting - minutes until >60, then hours+minutes
  const formatDuration = (minutes: number | undefined): string => {
    if (!minutes || isNaN(minutes)) return '0m';
    
    const totalMinutes = Math.round(minutes);
    
    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;
      if (remainingMinutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h ${remainingMinutes}m`;
      }
    }
  };

  // FIXED: Get frequency metrics with fallback
  const getFrequencyMetrics = (analytics: EnhancedDriverAnalytics) => {
    // Try multiple property names for compatibility
    const per100Miles = analytics.events_per_100_miles || 
                       analytics.harsh_events_per_100_miles || 
                       (analytics.events_per_1000_miles ? analytics.events_per_1000_miles / 10 : 0);
    
    const per1000Miles = analytics.events_per_1000_miles || 
                        (analytics.events_per_100_miles ? analytics.events_per_100_miles * 10 : 0) ||
                        (analytics.harsh_events_per_100_miles ? analytics.harsh_events_per_100_miles * 10 : 0);
    
    const perHour = analytics.harsh_events_per_hour || 0;
    
    return { per100Miles, per1000Miles, perHour };
  };

  // FIXED: Explain why score is good despite industry rating
  const getScoreExplanation = (analytics: EnhancedDriverAnalytics) => {
    const behaviorScore = safeNumber(analytics.overall_behavior_score);
    const industryRating = analytics.industry_rating;
    const { per1000Miles } = getFrequencyMetrics(analytics);
    
    if (behaviorScore >= 75 && industryRating === 'Dangerous') {
      return {
        title: "Score vs Industry Rating Explanation",
        message: `The behavior score (${behaviorScore}) considers multiple factors including speed consistency, acceleration smoothness, and turn safety. The "Dangerous" industry rating is based solely on event frequency (${safeToFixed(per1000Miles, 1)} events per 1000 miles). This suggests good fundamental driving habits with some harsh events that need improvement.`,
        color: 'warning'
      };
    }
    return null;
  };

  const handleSignOut = () => {
    localStorage.removeItem('privacyDriveUser');
    if (onSignOut) {
      onSignOut();
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Insurance Provider Dashboard</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSignOut}>
              <IonIcon icon={logOutOutline} />
              Sign Out
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Driver Analysis</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonLabel>Welcome, {user?.name || 'Provider'}</IonLabel>
            <br /><br />
            <IonLabel>Enter Driver ID to analyze driving patterns:</IonLabel>
            <IonInput
              placeholder="driver-user-id"
              value={searchId}
              onIonChange={e => setSearchId(e.detail.value!)}
              disabled={loading}
            />
            <IonButton
              expand="block"
              onClick={handleAnalyzeDriver}
              disabled={!searchId.trim() || loading}
            >
              {loading ? 'Analyzing...' : 'Analyze Driver (FIXED)'}
            </IonButton>
          </IonCardContent>
        </IonCard>

        {error && <IonText color="danger"><h3>{error}</h3></IonText>}

        {analytics && (
          <>
            {/* FIXED Data Quality Indicator */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  Data Quality Assessment
                  <IonChip color={getDataQualityColor(analytics.data_quality_score)} style={{marginLeft: '10px'}}>
                    {analytics.algorithm_version || analytics.data_version}
                  </IonChip>
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol size="6">
                      <p><strong>Overall Data Quality:</strong></p>
                      <IonProgressBar
                        value={analytics.data_quality_score}
                        color={getDataQualityColor(analytics.data_quality_score)}
                      />
                      <p style={{textAlign: 'center', margin: '5px 0'}}>
                        {Math.round(analytics.data_quality_score * 100)}%
                      </p>
                    </IonCol>
                    <IonCol size="6">
                      <p><strong>Enhanced Data Coverage:</strong></p>
                      <IonProgressBar
                        value={analytics.enhanced_data_percentage / 100}
                        color="tertiary"
                      />
                      <p style={{textAlign: 'center', margin: '5px 0'}}>
                        {safeToFixed(analytics.enhanced_data_percentage, 0)}%
                      </p>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>

            <IonSegment value={activeSegment} onIonChange={e => setActiveSegment(e.detail.value as string)}>
              <IonSegmentButton value="overview">
                <IonLabel>Overview</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="detailed">
                <IonLabel>Detailed Metrics</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="trips">
                <IonLabel>Trip Analysis</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="industry">
                <IonLabel>Industry Metrics</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {activeSegment === 'overview' && (
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>
                    Driver Risk Assessment
                    <IonBadge color={getRiskColor(analytics.risk_level)} style={{marginLeft: '10px'}}>
                      {analytics.risk_level.toUpperCase()} RISK
                    </IonBadge>
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="6">
                        <IonText>
                          <h3>Overall Behavior Score</h3>
                          <h1 style={{
                            color: getBehaviorColor(analytics.overall_behavior_score) === 'success' ? 'green' :
                                   getBehaviorColor(analytics.overall_behavior_score) === 'warning' ? 'orange' : 'red'
                          }}>
                            {safeToFixed(analytics.overall_behavior_score, 0)}/100
                          </h1>
                          <p><strong>Speed Consistency:</strong> {safeToFixed(analytics.speed_consistency_score, 0)}/100</p>
                        </IonText>
                      </IonCol>
                      <IonCol size="6">
                        <IonText>
                          <p><strong>Total Trips:</strong> {analytics.total_trips}</p>
                          <p><strong>Total Distance:</strong> {safeToFixed(analytics.total_distance_miles, 1)} miles</p>
                          <p><strong>Total Driving Time:</strong> {analytics.formatted_total_time || formatDuration(analytics.total_driving_time_hours * 60)}</p>
                          <p><strong>Average Speed:</strong> {safeToFixed(analytics.overall_avg_speed_mph, 1)} mph</p>
                        </IonText>
                      </IonCol>
                    </IonRow>
                  </IonGrid>

                  {/* FIXED Behavior Breakdown */}
                  <IonItemDivider>
                    <IonLabel>Behavior Breakdown</IonLabel>
                  </IonItemDivider>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="6">
                        <IonItem>
                          <IonLabel>
                            <h3>Acceleration Control</h3>
                            <p>{safeToFixed(analytics.avg_gentle_acceleration_score, 0)}/100</p>
                          </IonLabel>
                          <IonBadge color={getBehaviorColor(safeNumber(analytics.avg_gentle_acceleration_score))}>
                            {safeToFixed(analytics.avg_gentle_acceleration_score, 0)}
                          </IonBadge>
                        </IonItem>
                      </IonCol>
                      <IonCol size="6">
                        <IonItem>
                          <IonLabel>
                            <h3>Turn Safety</h3>
                            <p>{safeToFixed(analytics.avg_turn_speed_score, 0)}/100</p>
                          </IonLabel>
                          <IonBadge color={getBehaviorColor(safeNumber(analytics.avg_turn_speed_score))}>
                            {safeToFixed(analytics.avg_turn_speed_score, 0)}
                          </IonBadge>
                        </IonItem>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>
            )}

            {activeSegment === 'detailed' && (
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Detailed Driving Statistics</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    <IonItemDivider>
                      <IonLabel>Speed Analysis</IonLabel>
                    </IonItemDivider>
                    <IonItem>
                      <IonLabel>
                        <h3>Average Speed</h3>
                        <p>{safeToFixed(analytics.overall_avg_speed_mph, 1)} mph</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>Maximum Speed Recorded</h3>
                        <p>{safeToFixed(analytics.overall_max_speed_mph, 1)} mph</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>Speed Consistency Score</h3>
                        <p>{safeToFixed(analytics.speed_consistency_score, 0)}/100</p>
                      </IonLabel>
                      <IonBadge color={getBehaviorColor(safeNumber(analytics.speed_consistency_score))}>
                        {safeToFixed(analytics.speed_consistency_score, 0)}
                      </IonBadge>
                    </IonItem>

                    <IonItemDivider>
                      <IonLabel>Acceleration Analysis</IonLabel>
                    </IonItemDivider>
                    <IonItem>
                      <IonLabel>
                        <h3>Sudden Accelerations</h3>
                        <p>{analytics.total_sudden_accelerations} events total</p>
                      </IonLabel>
                      <IonBadge color={analytics.total_sudden_accelerations > 10 ? 'danger' : analytics.total_sudden_accelerations > 5 ? 'warning' : 'success'}>
                        {analytics.total_sudden_accelerations}
                      </IonBadge>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>Sudden Decelerations</h3>
                        <p>{analytics.total_sudden_decelerations} events total</p>
                      </IonLabel>
                      <IonBadge color={analytics.total_sudden_decelerations > 10 ? 'danger' : analytics.total_sudden_decelerations > 5 ? 'warning' : 'success'}>
                        {analytics.total_sudden_decelerations}
                      </IonBadge>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>Hard Stops</h3>
                        <p>{analytics.total_hard_stops} emergency/hard stops</p>
                      </IonLabel>
                      <IonBadge color={analytics.total_hard_stops > 5 ? 'danger' : analytics.total_hard_stops > 2 ? 'warning' : 'success'}>
                        {analytics.total_hard_stops}
                      </IonBadge>
                    </IonItem>

                    <IonItemDivider>
                      <IonLabel>Turn Analysis</IonLabel>
                    </IonItemDivider>
                    <IonItem>
                      <IonLabel>
                        <h3>Safe Turns Percentage</h3>
                        <p>{safeToFixed(analytics.safe_turns_percentage, 0)}% of all turns</p>
                      </IonLabel>
                      <IonBadge color={getBehaviorColor(safeNumber(analytics.safe_turns_percentage))}>
                        {safeToFixed(analytics.safe_turns_percentage, 0)}%
                      </IonBadge>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>Dangerous Turns</h3>
                        <p>{analytics.total_dangerous_turns} high-speed turns</p>
                      </IonLabel>
                      <IonBadge color={analytics.total_dangerous_turns > 5 ? 'danger' : analytics.total_dangerous_turns > 2 ? 'warning' : 'success'}>
                        {analytics.total_dangerous_turns}
                      </IonBadge>
                    </IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>
            )}

            {activeSegment === 'industry' && (
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Industry-Standard Metrics</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {/* FIXED: Score vs Industry Rating Explanation */}
                  {getScoreExplanation(analytics) && (
                    <IonCard color={getScoreExplanation(analytics)!.color}>
                      <IonCardContent>
                        <IonText color="light">
                          <h4>{getScoreExplanation(analytics)!.title}</h4>
                          <p style={{ margin: 0, fontSize: '0.9em' }}>
                            {getScoreExplanation(analytics)!.message}
                          </p>
                        </IonText>
                      </IonCardContent>
                    </IonCard>
                  )}

                  <IonList>
                    <IonItemDivider>
                      <IonLabel>Frequency-Based Risk Metrics</IonLabel>
                    </IonItemDivider>
                    
                    {/* FIXED: Handle both per 1000 miles and per 100 miles metrics */}
                    <IonItem>
                      <IonLabel>
                        <h3>Harsh Events per 1000 Miles</h3>
                        <p>Industry benchmark: &lt;8 (Excellent), &lt;20 (Very Good), &lt;45 (Good)</p>
                      </IonLabel>
                      <IonBadge color={getIndustryRatingColor(analytics.industry_rating || 'Unknown')}>
                        {safeToFixed(getFrequencyMetrics(analytics).per1000Miles, 1)}
                      </IonBadge>
                    </IonItem>
                    
                    <IonItem>
                      <IonLabel>
                        <h3>Harsh Events per 100 Miles</h3>
                        <p>Industry benchmark: &lt;0.8 (Excellent), &lt;2.0 (Very Good), &lt;4.5 (Good)</p>
                      </IonLabel>
                      <IonBadge color={getIndustryRatingColor(analytics.industry_rating || 'Unknown')}>
                        {safeToFixed(getFrequencyMetrics(analytics).per100Miles, 2)}
                      </IonBadge>
                    </IonItem>
                    
                    <IonItem>
                      <IonLabel>
                        <h3>Harsh Events per Hour</h3>
                        <p>Industry benchmark: &lt;2.0 (Good), &lt;4.0 (Fair)</p>
                      </IonLabel>
                      <IonBadge color={safeNumber(getFrequencyMetrics(analytics).perHour) > 4 ? 'danger' : safeNumber(getFrequencyMetrics(analytics).perHour) > 2 ? 'warning' : 'success'}>
                        {safeToFixed(getFrequencyMetrics(analytics).perHour, 2)}
                      </IonBadge>
                    </IonItem>
                    
                    <IonItem>
                      <IonLabel>
                        <h3>Industry Rating</h3>
                        <p>Based on realistic physics-based thresholds</p>
                      </IonLabel>
                      <IonBadge color={getIndustryRatingColor(analytics.industry_rating || 'Unknown')}>
                        {analytics.industry_rating || 'Not Available'}
                      </IonBadge>
                    </IonItem>

                    <IonItemDivider>
                      <IonLabel>Trip Efficiency Metrics</IonLabel>
                    </IonItemDivider>
                    <IonItem>
                      <IonLabel>
                        <h3>Average Trip Distance</h3>
                        <p>{safeToFixed(analytics.avg_trip_distance_miles, 2)} miles</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>Average Trip Duration (FIXED)</h3>
                        <p>{analytics.formatted_avg_duration || formatDuration(analytics.avg_trip_duration_minutes)}</p>
                      </IonLabel>
                    </IonItem>

                    <IonItemDivider>
                      <IonLabel>Data Quality Metrics</IonLabel>
                    </IonItemDivider>
                    <IonItem>
                      <IonLabel>
                        <h3>Analysis Timestamp</h3>
                        <p>{formatDate(analytics.analysis_timestamp)}</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>Algorithm Version</h3>
                        <p>Analytics {analytics.algorithm_version || analytics.data_version}</p>
                      </IonLabel>
                      <IonChip color="tertiary">
                        <IonIcon icon={checkmarkCircle} />
                        FIXED
                      </IonChip>
                    </IonItem>
                    
                    {/* FIXED: Show algorithm information */}
                    {analytics.frequency_integration && (
                      <IonItem>
                        <IonLabel>
                          <h3>Industry Integration</h3>
                          <p>{analytics.frequency_integration.replace(/_/g, ' ')}</p>
                        </IonLabel>
                        <IonChip color="success">
                          <IonIcon icon={checkmarkCircle} />
                          Integrated
                        </IonChip>
                      </IonItem>
                    )}
                  </IonList>
                </IonCardContent>
              </IonCard>
            )}

            {activeSegment === 'trips' && (
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Trip History ({analytics.trips.length} trips)</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    {analytics.trips.map((trip, index) => (
                      <IonItem key={trip.trip_id} button onClick={() => setSelectedTrip(trip)}>
                        <IonLabel>
                          <h3>
                            Trip #{analytics.trips.length - index}
                            {trip.enhanced_metrics && (
                              <IonChip color="tertiary" style={{marginLeft: '10px'}}>
                                Enhanced
                              </IonChip>
                            )}
                          </h3>
                          <p>{formatDate(trip.start_timestamp)}</p>
                          <p>
                            {safeToFixed(trip.total_distance_miles, 1)} miles •
                            {trip.formatted_duration || formatDuration(trip.duration_minutes)} •
                            {safeToFixed(trip.avg_speed_mph, 1)} mph avg
                          </p>
                          <p>
                            Quality: {Math.round(trip.data_quality_score * 100)}% •
                            Harsh Events: {trip.sudden_accelerations + trip.sudden_decelerations + trip.hard_stops}
                          </p>
                        </IonLabel>
                        <IonBadge color={getBehaviorColor(trip.behavior_score)}>
                          {safeToFixed(trip.behavior_score, 0)}
                        </IonBadge>
                      </IonItem>
                    ))}
                  </IonList>
                </IonCardContent>
              </IonCard>
            )}

            {selectedTrip && (
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>
                    Trip Details
                    {selectedTrip.enhanced_metrics && (
                      <IonChip color="tertiary" style={{marginLeft: '10px'}}>
                        <IonIcon icon={checkmarkCircle} />
                        Enhanced Data
                      </IonChip>
                    )}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="6">
                        <p><strong>Trip ID:</strong> {selectedTrip.trip_id.split('_').pop()}</p>
                        <p><strong>Start:</strong> {formatDate(selectedTrip.start_timestamp)}</p>
                        <p><strong>End:</strong> {formatDate(selectedTrip.end_timestamp)}</p>
                        <p><strong>Duration (FIXED):</strong> {selectedTrip.formatted_duration || formatDuration(selectedTrip.duration_minutes)}</p>
                        <p><strong>Data Quality:</strong>
                          <IonBadge color={getDataQualityColor(selectedTrip.data_quality_score)} style={{marginLeft: '5px'}}>
                            {Math.round(selectedTrip.data_quality_score * 100)}%
                          </IonBadge>
                        </p>
                      </IonCol>
                      <IonCol size="6">
                        <p><strong>Distance:</strong> {safeToFixed(selectedTrip.total_distance_miles, 2)} miles</p>
                        <p><strong>Avg Speed:</strong> {safeToFixed(selectedTrip.avg_speed_mph, 1)} mph</p>
                        <p><strong>Max Speed:</strong> {safeToFixed(selectedTrip.max_speed_mph, 1)} mph</p>
                        <p><strong>Behavior Score:</strong>
                          <IonBadge color={getBehaviorColor(selectedTrip.behavior_score)} style={{marginLeft: '5px'}}>
                            {selectedTrip.behavior_category} ({safeToFixed(selectedTrip.behavior_score, 0)})
                          </IonBadge>
                        </p>
                      </IonCol>
                    </IonRow>
                  </IonGrid>

                  {/* FIXED Trip Metrics */}
                  <IonItemDivider>
                    <IonLabel>Behavior Metrics</IonLabel>
                  </IonItemDivider>
                  
                  <IonGrid>
                    <IonRow>
                      <IonCol size="6">
                        <IonItem>
                          <IonLabel>
                            <h4>Acceleration Events</h4>
                            <p>Sudden: {selectedTrip.sudden_accelerations}</p>
                            <p>Gentle Score: {safeToFixed(selectedTrip.gentle_acceleration_score, 0)}/100</p>
                          </IonLabel>
                          <IonBadge color={selectedTrip.sudden_accelerations > 3 ? 'danger' : selectedTrip.sudden_accelerations > 1 ? 'warning' : 'success'}>
                            {selectedTrip.sudden_accelerations}
                          </IonBadge>
                        </IonItem>
                      </IonCol>
                      <IonCol size="6">
                        <IonItem>
                          <IonLabel>
                            <h4>Deceleration Events</h4>
                            <p>Sudden: {selectedTrip.sudden_decelerations}</p>
                            <p>Hard Stops: {selectedTrip.hard_stops}</p>
                          </IonLabel>
                          <IonBadge color={(selectedTrip.sudden_decelerations + selectedTrip.hard_stops) > 3 ? 'danger' : (selectedTrip.sudden_decelerations + selectedTrip.hard_stops) > 1 ? 'warning' : 'success'}>
                            {selectedTrip.sudden_decelerations + selectedTrip.hard_stops}
                          </IonBadge>
                        </IonItem>
                      </IonCol>
                    </IonRow>
                    <IonRow>
                      <IonCol size="6">
                        <IonItem>
                          <IonLabel>
                            <h4>Turn Analysis</h4>
                            <p>Safe: {selectedTrip.safe_turns}</p>
                            <p>Aggressive: {selectedTrip.aggressive_turns}</p>
                            <p>Dangerous: {selectedTrip.dangerous_turns}</p>
                          </IonLabel>
                          <IonBadge color={getBehaviorColor(selectedTrip.turn_speed_score)}>
                            {safeToFixed(selectedTrip.turn_speed_score, 0)}/100
                          </IonBadge>
                        </IonItem>
                      </IonCol>
                      <IonCol size="6">
                        <IonItem>
                          <IonLabel>
                            <h4>Safety Summary</h4>
                            <p>Total Harsh Events: {selectedTrip.sudden_accelerations + selectedTrip.sudden_decelerations + selectedTrip.hard_stops}</p>
                            <p>Events per Mile: {((selectedTrip.sudden_accelerations + selectedTrip.sudden_decelerations + selectedTrip.hard_stops) / selectedTrip.total_distance_miles).toFixed(3)}</p>
                            <p>Industry Rating: {selectedTrip.industry_rating || 'Not Available'}</p>
                          </IonLabel>
                          {selectedTrip.enhanced_metrics ? (
                            <IonChip color="success">
                              <IonIcon icon={checkmarkCircle} />
                              Verified
                            </IonChip>
                          ) : (
                            <IonChip color="warning">
                              <IonIcon icon={warningOutline} />
                              Basic
                            </IonChip>
                          )}
                        </IonItem>
                      </IonCol>
                    </IonRow>
                  </IonGrid>

                  <IonButton
                    fill="outline"
                    size="small"
                    onClick={() => setSelectedTrip(null)}
                  >
                    Close Details
                  </IonButton>
                </IonCardContent>
              </IonCard>
            )}
          </>
        )}

        <IonLoading isOpen={loading} message="Analyzing driver data..." />
      </IonContent>
    </IonPage>
  );
};

export default ProviderHome;