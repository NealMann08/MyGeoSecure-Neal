// frontend/src/pages/EnhancedGPSProcessing.ts - Updated with User-Specific Base Points
import { CityCoordinates } from '../utils/geocoding';

interface EnhancedLocationPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  speedAccuracy?: number;
  isValid?: boolean;
  confidence?: number;
}

interface ProcessedSpeedData {
  speed: number;
  confidence: number;
  isReliable: boolean;
  method: 'calculated' | 'gps' | 'interpolated';
}

interface UserBasePoint {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  source: 'zippopotam' | 'cache' | 'fallback';  // ← Updated to match geocoding types
  anonymizationRadius?: number;
}

// Default fallback base point (Beijing)
const DEFAULT_BASE_POINT: UserBasePoint = {
  latitude: 39.913818,
  longitude: 116.363625,
  city: 'Beijing',
  state: 'CN',
  source: 'fallback'  // ← This now matches the type
};

// GPS Quality and Filtering Functions
const GPS_QUALITY_CONFIG = {
  MAX_ACCURACY: 20, // meters
  MAX_SPEED_ACCURACY: 5, // m/s
  MIN_MOVEMENT_THRESHOLD: 5, // meters
  MIN_TIME_THRESHOLD: 2, // seconds
  MAX_REASONABLE_SPEED: 85, // mph for highways
  URBAN_MAX_SPEED: 45, // mph for city driving
  SMOOTHING_WINDOW: 5 // points for moving average
};

/**
 * Get user's base point from stored user data
 */
export function getUserBasePoint(): UserBasePoint {
  try {
    const userData = localStorage.getItem('privacyDriveUser');
    if (userData) {
      const user = JSON.parse(userData);
      
      if (user.basePoint) {
        const basePoint: UserBasePoint = {
          latitude: user.basePoint.latitude,
          longitude: user.basePoint.longitude,
          city: user.basePoint.city,
          state: user.basePoint.state,
          source: user.basePoint.source,
          anonymizationRadius: user.privacySettings?.anonymizationRadius || 10
        };
        
        console.log(`🎯 Using user-specific base point: ${basePoint.city}, ${basePoint.state} (${basePoint.source})`);
        return basePoint;
      }
    }
    
    console.log(`⚠️ No user base point found, using Beijing fallback`);
    return DEFAULT_BASE_POINT;
  } catch (error) {
    console.error('Error getting user base point:', error);
    return DEFAULT_BASE_POINT;
  }
}

/**
 * Apply anonymization radius offset to base point
 */
export function getAnonymizedBasePoint(): UserBasePoint {
  const basePoint = getUserBasePoint();
  
  if (!basePoint.anonymizationRadius || basePoint.source === 'fallback') {
    return basePoint;
  }
  
  // Apply random offset within anonymization radius
  const radiusMiles = basePoint.anonymizationRadius;
  const radiusDegrees = radiusMiles / 69; // Approximate: 1 degree ≈ 69 miles
  
  // Generate random offset within radius
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusDegrees;
  
  const offsetLat = distance * Math.cos(angle);
  const offsetLon = distance * Math.sin(angle);
  
  const anonymizedPoint: UserBasePoint = {
    ...basePoint,
    latitude: basePoint.latitude + offsetLat,
    longitude: basePoint.longitude + offsetLon
  };
  
  console.log(`🔒 Applied ${radiusMiles}-mile anonymization offset to ${basePoint.city}`);
  return anonymizedPoint;
}

/**
 * COMPLETELY FIXED: Calculate deltas using user-specific base point
 * Replace ONLY this function in your existing EnhancedGPSProcessing.ts file
 */
export function calculateUserSpecificDeltas(queue: EnhancedLocationPoint[]): any[] {
  if (queue.length < 2) return [];

  const basePoint = getAnonymizedBasePoint();
  const FIXED_POINT_MULTIPLIER = 1000000;

  const deltas = [];

  console.log(`📍 FIXED: Calculating deltas for ${queue.length} points`);
  console.log(`🔒 Base point: ${basePoint.city}, ${basePoint.state}`);
  
  // DEBUG: Log first few points to see what we're working with
  console.log('🔍 First 3 points from test data:', queue.slice(0, 3).map(p => ({
    speed_ms: p.speed,
    speed_mph: p.speed ? (p.speed * 2.237).toFixed(1) : 'undefined',
    lat: p.latitude.toFixed(6),
    lon: p.longitude.toFixed(6),
    timestamp: p.timestamp
  })));

  for (let i = 1; i < queue.length; i++) {
    const prev = queue[i - 1];
    const curr = queue[i];

    // Calculate deltas relative to user's base point
    const prevDeltaLat = prev.latitude - basePoint.latitude;
    const prevDeltaLon = prev.longitude - basePoint.longitude;
    const currDeltaLat = curr.latitude - basePoint.latitude;
    const currDeltaLon = curr.longitude - basePoint.longitude;

    // Calculate relative movement deltas
    const deltaLat = Math.round((currDeltaLat - prevDeltaLat) * FIXED_POINT_MULTIPLIER);
    const deltaLong = Math.round((currDeltaLon - prevDeltaLon) * FIXED_POINT_MULTIPLIER);
    const deltaTime = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();

    // FIXED: Calculate actual distance moved for this segment
    const distanceMiles = haversineDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    const timeSeconds = deltaTime / 1000;
    
    // FIXED: Extract speed properly - prioritize test data speed
    let speedMph = 0;
    let speedConfidence = 0.8;
    let isStationary = false;
    
    if (curr.speed !== undefined && curr.speed !== null) {
      // FIXED: Use the speed directly from test data (already in m/s)
      speedMph = curr.speed * 2.237; // Convert m/s to mph
      speedConfidence = curr.confidence || 0.9; // High confidence for test data
      
      // FIXED: Realistic stationary detection - only very low speeds
      isStationary = speedMph < 2; // Less than 2 mph is stationary
      
      console.log(`🔍 Point ${i}: Test speed ${curr.speed.toFixed(2)} m/s = ${speedMph.toFixed(1)} mph, stationary: ${isStationary}`);
    } else if (distanceMiles > 0 && timeSeconds > 0.5) {
      // FIXED: Fallback calculation only if no test speed available
      speedMph = (distanceMiles / timeSeconds) * 3600; // Convert to mph
      speedConfidence = 0.6; // Lower confidence for calculated speed
      isStationary = speedMph < 2;
      
      console.log(`🔍 Point ${i}: Calculated speed ${speedMph.toFixed(1)} mph from distance/time`);
    } else {
      // No movement detected
      speedMph = 0;
      speedConfidence = 0.9; // High confidence in zero speed
      isStationary = true;
      
      console.log(`🔍 Point ${i}: No movement detected, speed = 0`);
    }

    // FIXED: Cap unrealistic speeds but preserve test data
    if (speedMph > 100) {
      console.log(`⚠️ Capping unrealistic speed ${speedMph.toFixed(1)} mph to 85 mph`);
      speedMph = 85; // Cap at highway speeds
      speedConfidence = 0.4; // Lower confidence for capped speeds
    }

    // FIXED: Round speed to reasonable precision
    speedMph = Math.round(speedMph * 100) / 100; // 2 decimal places

    const delta = {
      delta_lat: deltaLat,
      delta_long: deltaLong,
      delta_time: deltaTime,
      timestamp: curr.timestamp,
      sequence: i - 1,
      
      // FIXED: Enhanced metadata with proper speed data preservation
      speed_mph: speedMph,
      speed_confidence: Math.round(speedConfidence * 100) / 100,
      gps_accuracy: curr.accuracy || 5, // Default good accuracy for test data
      is_stationary: isStationary,
      data_quality: curr.isValid !== false ? 'high' : 'medium', // Default to high for test data
      
      // Additional movement metadata for debugging
      distance_miles: Math.round(distanceMiles * 10000) / 10000, // 4 decimal places
      time_seconds: Math.round(timeSeconds * 100) / 100,
      original_speed_ms: curr.speed, // Preserve original test speed
      
      // Privacy metadata
      base_point_source: basePoint.source,
      anonymization_applied: basePoint.anonymizationRadius ? true : false,
      privacy_radius: basePoint.anonymizationRadius || 0
    };

    deltas.push(delta);

    // DEBUG: Log first few deltas to verify they're correct
    if (i <= 5) {
      console.log(`✅ Delta ${i}:`, {
        speed_mph: delta.speed_mph,
        distance_miles: delta.distance_miles,
        time_seconds: delta.time_seconds,
        is_stationary: delta.is_stationary,
        original_test_speed_ms: delta.original_speed_ms,
        delta_lat: deltaLat,
        delta_long: deltaLong
      });
    }
  }

  // FIXED: Final verification logging
  const nonStationaryDeltas = deltas.filter(d => !d.is_stationary);
  const speedRange = deltas.length > 0 ? {
    min: Math.min(...deltas.map(d => d.speed_mph)),
    max: Math.max(...deltas.map(d => d.speed_mph)),
    avg: deltas.reduce((sum, d) => sum + d.speed_mph, 0) / deltas.length
  } : { min: 0, max: 0, avg: 0 };

  console.log(`✅ FIXED: Generated ${deltas.length} deltas with user-specific base point`);
  console.log(`🏃 Non-stationary deltas: ${nonStationaryDeltas.length} of ${deltas.length}`);
  console.log(`📊 Speed range: ${speedRange.min.toFixed(1)} - ${speedRange.max.toFixed(1)} mph (avg: ${speedRange.avg.toFixed(1)})`);
  console.log(`🎯 Expected for highway test: 0-69 mph range with most 60-69 mph`);
  console.log(`🎯 Expected for city test: 0-36 mph range with stops and starts`);
  console.log(`🎯 Expected for erratic test: 10-65 mph range with rapid changes`);
  
  return deltas;
}

/**
 * Validate GPS point quality
 */
function validateGPSPoint(point: EnhancedLocationPoint, previousPoint?: EnhancedLocationPoint): boolean {
  // Basic accuracy check
  if (point.accuracy && point.accuracy > GPS_QUALITY_CONFIG.MAX_ACCURACY) {
    console.log(`GPS point rejected: poor accuracy (${point.accuracy}m)`);
    return false;
  }

  // Speed accuracy check
  if (point.speedAccuracy && point.speedAccuracy > GPS_QUALITY_CONFIG.MAX_SPEED_ACCURACY) {
    console.log(`GPS point rejected: poor speed accuracy (${point.speedAccuracy}m/s)`);
    return false;
  }

  // Unrealistic position jump check
  if (previousPoint) {
    const distance = haversineDistance(
      previousPoint.latitude, previousPoint.longitude,
      point.latitude, point.longitude
    );
    const timeDiff = (new Date(point.timestamp).getTime() - new Date(previousPoint.timestamp).getTime()) / 1000;
   
    if (timeDiff > 0) {
      const calculatedSpeed = (distance * 1000) / timeDiff; // m/s
      const speedMph = calculatedSpeed * 2.237; // Convert to mph
     
      // Reject impossible speeds (likely GPS jumps)
      if (speedMph > 120) {
        console.log(`GPS point rejected: impossible speed (${speedMph.toFixed(1)} mph)`);
        return false;
      }
    }
  }

  return true;
}

/**
 * Detect stationary periods
 */
function detectStationaryPeriod(points: EnhancedLocationPoint[], startIndex: number): {
  isStationary: boolean;
  duration: number;
  endIndex: number;
} {
  if (startIndex >= points.length - 1) {
    return { isStationary: false, duration: 0, endIndex: startIndex };
  }

  const startPoint = points[startIndex];
  let endIndex = startIndex + 1;
  let totalMovement = 0;

  // Look ahead to find end of stationary period
  while (endIndex < points.length) {
    const distance = haversineDistance(
      startPoint.latitude, startPoint.longitude,
      points[endIndex].latitude, points[endIndex].longitude
    );
   
    totalMovement += distance * 1000; // Convert to meters
   
    // If we've moved more than threshold, not stationary
    if (totalMovement > GPS_QUALITY_CONFIG.MIN_MOVEMENT_THRESHOLD) {
      break;
    }
   
    endIndex++;
  }

  const duration = (new Date(points[Math.min(endIndex - 1, points.length - 1)].timestamp).getTime() -
                   new Date(startPoint.timestamp).getTime()) / 1000;

  const isStationary = duration >= GPS_QUALITY_CONFIG.MIN_TIME_THRESHOLD &&
                      totalMovement <= GPS_QUALITY_CONFIG.MIN_MOVEMENT_THRESHOLD;

  return {
    isStationary,
    duration,
    endIndex: endIndex - 1
  };
}

/**
 * Calculate moving average for array of numbers
 */
function movingAverage(values: number[], windowSize: number = GPS_QUALITY_CONFIG.SMOOTHING_WINDOW): number[] {
  if (values.length < windowSize) {
    return values;
  }

  const smoothed: number[] = [];
 
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(values.length, i + Math.ceil(windowSize / 2));
   
    const windowValues = values.slice(start, end);
    const average = windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length;
    smoothed.push(average);
  }
 
  return smoothed;
}

/**
 * Enhanced speed calculation with validation and smoothing
 */
function calculateEnhancedSpeed(
  point1: EnhancedLocationPoint,
  point2: EnhancedLocationPoint,
  isDriving: boolean = true
): ProcessedSpeedData {
  const distance = haversineDistance(
    point1.latitude, point1.longitude,
    point2.latitude, point2.longitude
  );
 
  const timeDiff = (new Date(point2.timestamp).getTime() - new Date(point1.timestamp).getTime()) / 1000;
 
  // Handle invalid time differences
  if (timeDiff <= 0) {
    return {
      speed: 0,
      confidence: 0,
      isReliable: false,
      method: 'calculated'
    };
  }

  // Skip micro-movements for speed calculation
  if (distance * 1000 < GPS_QUALITY_CONFIG.MIN_MOVEMENT_THRESHOLD) {
    return {
      speed: 0,
      confidence: 0.5,
      isReliable: false,
      method: 'calculated'
    };
  }

  // Calculate speed in mph
  const speedMps = (distance * 1000) / timeDiff; // meters per second
  const speedMph = speedMps * 2.237; // Convert to mph

  // Determine max reasonable speed based on context
  const maxReasonableSpeed = isDriving ? GPS_QUALITY_CONFIG.MAX_REASONABLE_SPEED : GPS_QUALITY_CONFIG.URBAN_MAX_SPEED;

  // Validate speed reasonableness
  if (speedMph > maxReasonableSpeed) {
    return {
      speed: speedMph,
      confidence: 0.2,
      isReliable: false,
      method: 'calculated'
    };
  }

  // Calculate confidence based on multiple factors
  let confidence = 1.0;
 
  // Reduce confidence for very short time intervals
  if (timeDiff < GPS_QUALITY_CONFIG.MIN_TIME_THRESHOLD) {
    confidence *= 0.7;
  }
 
  // Reduce confidence for very high speeds
  if (speedMph > maxReasonableSpeed * 0.8) {
    confidence *= 0.8;
  }

  // Prefer GPS speed if available and reasonable
  if (point2.speed !== undefined) {
    const gpsSpeedMph = point2.speed * 2.237; // Convert m/s to mph
    if (gpsSpeedMph > 0 && gpsSpeedMph < maxReasonableSpeed) {
      // Use weighted average of GPS and calculated speed
      const calculatedWeight = confidence;
      const gpsWeight = point2.speedAccuracy ? Math.max(0.3, 1 - (point2.speedAccuracy / 5)) : 0.6;
     
      const totalWeight = calculatedWeight + gpsWeight;
      const blendedSpeed = (speedMph * calculatedWeight + gpsSpeedMph * gpsWeight) / totalWeight;
     
      return {
        speed: blendedSpeed,
        confidence: Math.min(1.0, confidence + 0.2),
        isReliable: true,
        method: 'gps'
      };
    }
  }

  return {
    speed: speedMph,
    confidence,
    isReliable: confidence > 0.6,
    method: 'calculated'
  };
}

/**
 * Process speed data with smoothing and validation
 */
function processSpeedData(points: EnhancedLocationPoint[]): {
  speeds: number[];
  reliableSpeeds: number[];
  confidence: number[];
  stationaryPeriods: Array<{start: number, end: number, duration: number}>;
} {
  if (points.length < 2) {
    return { speeds: [], reliableSpeeds: [], confidence: [], stationaryPeriods: [] };
  }

  const rawSpeeds: number[] = [];
  const confidenceScores: number[] = [];
  const reliableFlags: boolean[] = [];
  const stationaryPeriods: Array<{start: number, end: number, duration: number}> = [];

  let i = 0;
  while (i < points.length - 1) {
    // Check for stationary period
    const stationaryCheck = detectStationaryPeriod(points, i);
   
    if (stationaryCheck.isStationary && stationaryCheck.duration > 3) {
      // Record stationary period
      stationaryPeriods.push({
        start: i,
        end: stationaryCheck.endIndex,
        duration: stationaryCheck.duration
      });
     
      // Fill speeds with zeros for stationary period
      for (let j = i; j <= stationaryCheck.endIndex && j < points.length - 1; j++) {
        rawSpeeds.push(0);
        confidenceScores.push(0.9); // High confidence in zero speed
        reliableFlags.push(true);
      }
     
      i = stationaryCheck.endIndex + 1;
      continue;
    }

    // Calculate speed for non-stationary movement
    const speedData = calculateEnhancedSpeed(points[i], points[i + 1]);
    rawSpeeds.push(speedData.speed);
    confidenceScores.push(speedData.confidence);
    reliableFlags.push(speedData.isReliable);
   
    i++;
  }

  // Apply smoothing to reliable speeds only
  const reliableSpeeds = rawSpeeds.map((speed, index) => reliableFlags[index] ? speed : NaN);
  const smoothedSpeeds = applySmoothing(reliableSpeeds);

  return {
    speeds: rawSpeeds,
    reliableSpeeds: smoothedSpeeds,
    confidence: confidenceScores,
    stationaryPeriods
  };
}

/**
 * Apply smoothing with NaN handling for unreliable data
 */
function applySmoothing(speeds: number[]): number[] {
  const smoothed: number[] = [];
 
  for (let i = 0; i < speeds.length; i++) {
    if (isNaN(speeds[i])) {
      // Interpolate from nearby reliable values
      const interpolated = interpolateSpeed(speeds, i);
      smoothed.push(interpolated);
    } else {
      // Apply moving average to reliable values
      const windowStart = Math.max(0, i - 2);
      const windowEnd = Math.min(speeds.length, i + 3);
      const windowValues = speeds.slice(windowStart, windowEnd).filter(v => !isNaN(v));
     
      if (windowValues.length > 0) {
        const average = windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length;
        smoothed.push(average);
      } else {
        smoothed.push(speeds[i]);
      }
    }
  }
 
  return smoothed;
}

/**
 * Interpolate speed for unreliable data points
 */
function interpolateSpeed(speeds: number[], index: number): number {
  // Find nearest reliable values
  let prevReliable = -1;
  let nextReliable = -1;
 
  // Look backward
  for (let i = index - 1; i >= 0; i--) {
    if (!isNaN(speeds[i])) {
      prevReliable = i;
      break;
    }
  }
 
  // Look forward
  for (let i = index + 1; i < speeds.length; i++) {
    if (!isNaN(speeds[i])) {
      nextReliable = i;
      break;
    }
  }
 
  // Interpolate or use nearest value
  if (prevReliable >= 0 && nextReliable >= 0) {
    const ratio = (index - prevReliable) / (nextReliable - prevReliable);
    return speeds[prevReliable] + (speeds[nextReliable] - speeds[prevReliable]) * ratio;
  } else if (prevReliable >= 0) {
    return speeds[prevReliable];
  } else if (nextReliable >= 0) {
    return speeds[nextReliable];
  } else {
    return 0; // No reliable data available
  }
}

/**
 * Enhanced haversine distance calculation
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
 
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export {
  validateGPSPoint,
  detectStationaryPeriod,
  calculateEnhancedSpeed,
  processSpeedData,
  movingAverage,
  GPS_QUALITY_CONFIG,
  type EnhancedLocationPoint,
  type ProcessedSpeedData,
  type UserBasePoint
};



