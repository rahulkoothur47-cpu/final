"use client";

import { useMemo } from "react";

function haversineDistanceKm(origin, destination) {
  const toRadians = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const deltaLat = toRadians(destination.lat - origin.lat);
  const deltaLng = toRadians(destination.lng - origin.lng);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(origin.lat)) *
      Math.cos(toRadians(destination.lat)) *
      Math.sin(deltaLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export default function LinearRouteMap({ busPosition, routeStops, selectedStop }) {
  const routeContainerHeight = useMemo(() => {
    if (!routeStops || routeStops.length < 2) return 520;

    // Keep enough vertical spacing so stop labels do not overlap.
    const requiredHeight = (routeStops.length - 1) * 40 + 64;
    return Math.max(520, requiredHeight);
  }, [routeStops]);

  const busPositionOnRoute = useMemo(() => {
    if (!busPosition || !routeStops || routeStops.length < 2) return null;

    // Define max distance from route (in km) to consider bus "on route"
    const MAX_DISTANCE_FROM_ROUTE = 0.5; // 500 meters

    // Calculate total route distance
    let totalDistance = 0;
    const distances = [];
    
    for (let i = 0; i < routeStops.length - 1; i++) {
      const segmentDist = haversineDistanceKm(routeStops[i], routeStops[i + 1]);
      distances.push(segmentDist);
      totalDistance += segmentDist;
    }

    // Find closest segment to bus
    let minDistFromRoute = Infinity;
    let closestSegmentIndex = 0;
    let distanceAlongSegment = 0;

    for (let i = 0; i < routeStops.length - 1; i++) {
      const distToStart = haversineDistanceKm(busPosition, routeStops[i]);
      const distToEnd = haversineDistanceKm(busPosition, routeStops[i + 1]);
      const segmentLength = distances[i];

      // Calculate perpendicular distance from bus to segment
      const distFromSegment = Math.abs((distToStart + distToEnd - segmentLength) / 2);
      
      if (distFromSegment < minDistFromRoute) {
        minDistFromRoute = distFromSegment;
        closestSegmentIndex = i;
        distanceAlongSegment = distToStart;
      }
    }

    // Check if bus is actually on the route
    if (minDistFromRoute > MAX_DISTANCE_FROM_ROUTE) {
      // Bus is too far from the route - it's parked elsewhere
      return { isOffRoute: true };
    }

    // Calculate cumulative distance to start of closest segment
    let cumulativeDist = 0;
    for (let i = 0; i < closestSegmentIndex; i++) {
      cumulativeDist += distances[i];
    }

    // Add distance along the segment
    const busProgress = cumulativeDist + distanceAlongSegment;
    const percentage = totalDistance > 0 ? (busProgress / totalDistance) * 100 : 0;

    return {
      percentage: Math.min(100, Math.max(0, percentage)),
      segmentIndex: closestSegmentIndex,
      isOffRoute: false
    };
  }, [busPosition, routeStops]);

  if (!routeStops || routeStops.length === 0) {
    return <div className="linear-route-map">No route data available</div>;
  }

  // If bus is off route, show simplified view
  if (busPositionOnRoute?.isOffRoute) {
    return (
      <div className="linear-route-map">
        <div className="off-route-notice">
          ⚠️ Bus is currently not on the route (parked or off-route)
        </div>
        <div className="route-info-text">
          The bus will appear on the route map once it starts the journey.
        </div>
      </div>
    );
  }

  // Only show full route visualization when bus is on route
  if (!busPosition || !busPositionOnRoute) {
    return (
      <div className="linear-route-map">
        <div className="route-info-text">
          Waiting for bus location data...
        </div>
      </div>
    );
  }

  return (
    <div className="linear-route-map">
      <div className="route-header">
        <h3 className="route-title">Bus Route Progress</h3>
        <div className="route-percentage">{Math.round(busPositionOnRoute.percentage)}% Complete</div>
      </div>
      
      <div className="linear-route-container" style={{ height: `${routeContainerHeight}px` }}>
        {/* Route Line */}
        <div className="route-line">
          {/* Progress indicator */}
          {busPositionOnRoute && !busPositionOnRoute.isOffRoute && (
            <div 
              className="route-progress" 
              style={{ height: `${busPositionOnRoute.percentage}%` }}
            />
          )}
        </div>

        {/* Stops and Bus */}
        <div className="stops-container">
          {routeStops.map((stop, index) => {
            const stopPercentage = routeStops.length > 1 
              ? (index / (routeStops.length - 1)) * 100 
              : 50;
            
            const isSelected = selectedStop?.name === stop.name;

            return (
              <div
                key={stop.name}
                className={`stop-marker ${isSelected ? 'selected' : ''}`}
                style={{ top: `${stopPercentage}%` }}
              >
                <div className="stop-dot" />
                <div className="stop-label">{stop.name}</div>
              </div>
            );
          })}

          {/* Bus Position - Only show if on route */}
          {busPositionOnRoute && !busPositionOnRoute.isOffRoute && (
            <div
              className="bus-marker-linear"
              style={{ top: `${busPositionOnRoute.percentage}%` }}
            >
              <div className="bus-icon-linear">🚌</div>
              <div className="bus-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
