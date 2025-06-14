// frontend/src/pages/ProviderHome.tsx - ENHANCED WITH SIGN OUT
import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonInput, IonButton, IonLabel, IonText, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonLoading, IonSegment, IonSegmentButton,
  IonList, IonItem, IonItemDivider, IonBadge, IonGrid, IonRow, IonCol,
  IonButtons, IonIcon
} from '@ionic/react';
import { logOutOutline } from 'ionicons/icons';

interface TripSummary {
  trip_id: string;
  start_timestamp: string;
  end_timestamp: string;
  total_distance_miles: number;
  duration_minutes: number;
  avg_speed_mph: number;
  max_speed_mph: number;
  sharp_turns: number;
  sudden_stops: number;
  behavior_score: number;
  behavior_category: string;
}

interface DriverAnalytics {
  user_id: string;
  total_trips: number;
  total_distance_miles: number;
  total_driving_time_hours: number;
  avg_trip_distance_miles: number;
  avg_trip_duration_minutes: number;
  overall_avg_speed_mph: number;
  overall_max_speed_mph: number;
  total_sharp_turns: number;
  total_sudden_stops: number;
  overall_behavior_score: number;
  risk_level: string;
  trips: TripSummary[];
}

interface ProviderHomeProps {
  user: any;
  onSignOut?: () => void;
}

const ProviderHome: React.FC<ProviderHomeProps> = ({ user, onSignOut }) => {
  const [searchId, setSearchId] = useState('');
  const [analytics, setAnalytics] = useState<DriverAnalytics | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<TripSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSegment, setActiveSegment] = useState<string>('overview');

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
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  const getRiskColor = (risk: string): string => {
    switch (risk.toLowerCase()) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      default: return 'medium';
    }
  };

  const formatDate = (timestamp: string): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
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
              {loading ? 'Analyzing...' : 'Analyze Driver'}
            </IonButton>
          </IonCardContent>
        </IonCard>

        {error && <IonText color="danger"><h3>{error}</h3></IonText>}

        {analytics && (
          <>
            <IonSegment value={activeSegment} onIonChange={e => setActiveSegment(e.detail.value as string)}>
              <IonSegmentButton value="overview">
                <IonLabel>Overview</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="trips">
                <IonLabel>Trip History</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="details">
                <IonLabel>Detailed Stats</IonLabel>
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
                          <h1 style={{color: getBehaviorColor(analytics.overall_behavior_score) === 'success' ? 'green' : 
                                     getBehaviorColor(analytics.overall_behavior_score) === 'warning' ? 'orange' : 'red'}}>
                            {analytics.overall_behavior_score}/100
                          </h1>
                        </IonText>
                      </IonCol>
                      <IonCol size="6">
                        <IonText>
                          <p><strong>Total Trips:</strong> {analytics.total_trips}</p>
                          <p><strong>Total Distance:</strong> {analytics.total_distance_miles.toFixed(1)} miles</p>
                          <p><strong>Total Driving Time:</strong> {analytics.total_driving_time_hours.toFixed(1)} hours</p>
                          <p><strong>Average Speed:</strong> {analytics.overall_avg_speed_mph.toFixed(1)} mph</p>
                        </IonText>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>
            )}

            {activeSegment === 'details' && (
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
                        <p>{analytics.overall_avg_speed_mph.toFixed(1)} mph</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>Maximum Speed Recorded</h3>
                        <p>{analytics.overall_max_speed_mph.toFixed(1)} mph</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>Average Trip Distance</h3>
                        <p>{analytics.avg_trip_distance_miles.toFixed(1)} miles</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>Average Trip Duration</h3>
                        <p>{formatDuration(analytics.avg_trip_duration_minutes)}</p>
                      </IonLabel>
                    </IonItem>

                    <IonItemDivider>
                      <IonLabel>Behavior Analysis</IonLabel>
                    </IonItemDivider>
                    <IonItem>
                      <IonLabel>
                        <h3>Total Sharp Turns</h3>
                        <p>{analytics.total_sharp_turns} across all trips</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>Total Sudden Stops</h3>
                        <p>{analytics.total_sudden_stops} emergency/sudden stops</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>Sharp Turns per Mile</h3>
                        <p>{(analytics.total_sharp_turns / analytics.total_distance_miles).toFixed(2)}</p>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <h3>Sudden Stops per Mile</h3>
                        <p>{(analytics.total_sudden_stops / analytics.total_distance_miles).toFixed(2)}</p>
                      </IonLabel>
                    </IonItem>
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
                          <h3>Trip #{analytics.trips.length - index}</h3>
                          <p>{formatDate(trip.start_timestamp)}</p>
                          <p>{trip.total_distance_miles.toFixed(1)} miles • {formatDuration(trip.duration_minutes)} • {trip.avg_speed_mph.toFixed(1)} mph avg</p>
                        </IonLabel>
                        <IonBadge color={getBehaviorColor(trip.behavior_score)}>
                          {trip.behavior_score}
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
                  <IonCardTitle>Trip Details</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="6">
                        <p><strong>Trip ID:</strong> {selectedTrip.trip_id.split('_').pop()}</p>
                        <p><strong>Start:</strong> {formatDate(selectedTrip.start_timestamp)}</p>
                        <p><strong>End:</strong> {formatDate(selectedTrip.end_timestamp)}</p>
                        <p><strong>Duration:</strong> {formatDuration(selectedTrip.duration_minutes)}</p>
                      </IonCol>
                      <IonCol size="6">
                        <p><strong>Distance:</strong> {selectedTrip.total_distance_miles.toFixed(2)} miles</p>
                        <p><strong>Avg Speed:</strong> {selectedTrip.avg_speed_mph.toFixed(1)} mph</p>
                        <p><strong>Max Speed:</strong> {selectedTrip.max_speed_mph.toFixed(1)} mph</p>
                        <p><strong>Sharp Turns:</strong> {selectedTrip.sharp_turns}</p>
                        <p><strong>Sudden Stops:</strong> {selectedTrip.sudden_stops}</p>
                        <p><strong>Behavior:</strong> 
                          <IonBadge color={getBehaviorColor(selectedTrip.behavior_score)} style={{marginLeft: '5px'}}>
                            {selectedTrip.behavior_category}
                          </IonBadge>
                        </p>
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