"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, Polyline } from "react-leaflet";

// Component to fetch and display actual road route
function RoadRoutePolyline({ routeStops }) {
  const [roadPath, setRoadPath] = useState([]);
  const map = useMap();

  useEffect(() => {
    if (!routeStops || routeStops.length < 2) return;

    // Build OSRM API URL with all stops
    const coordinates = routeStops
      .filter(stop => Number.isFinite(stop.lat) && Number.isFinite(stop.lng))
      .map(stop => `${stop.lng},${stop.lat}`)
      .join(';');

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

    fetch(osrmUrl)
      .then(res => res.json())
      .then(data => {
        if (data.code === 'Ok' && data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRoadPath(coords);
        }
      })
      .catch(err => {
        console.error('Error fetching route:', err);
        // Fallback to straight lines if routing fails
        const fallbackPath = routeStops
          .filter(stop => Number.isFinite(stop.lat) && Number.isFinite(stop.lng))
          .map(stop => [stop.lat, stop.lng]);
        setRoadPath(fallbackPath);
      });
  }, [routeStops, map]);

  if (roadPath.length === 0) return null;

  return (
    <Polyline 
      positions={roadPath} 
      color="#3b82f6" 
      weight={4} 
      opacity={0.7}
    />
  );
}

function createBusIcon() {
  return L.divIcon({
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 25px;
        height: 25px;
        background: #141601;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4), 0 0 0 3px #ef4444;
        font-size: 24px;
        z-index: 9999;
      ">
        🚌
      </div>
    `,
    iconSize: [45, 45],
    iconAnchor: [22, 22],
    popupAnchor: [0, -25],
    className: "bus-icon-marker",
  });
}

const destinationIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: "destination-pin",
});

const stopIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [0, -40],
  className: "stop-icon-marker",
});

function BusMarker({ busPosition }) {
  const icon = useMemo(() => createBusIcon(), []);

  if (!Number.isFinite(busPosition?.lat) || !Number.isFinite(busPosition?.lng)) {
    return null;
  }

  return (
    <Marker position={[busPosition.lat, busPosition.lng]} icon={icon} pane="markerPane" zIndexOffset={1000}>
      <Popup>
        Live Bus Position
        <br />
        Lat: {busPosition.lat.toFixed(6)}
        <br />
        Lng: {busPosition.lng.toFixed(6)}
      </Popup>
    </Marker>
  );
}

function MapCameraController({ busPosition }) {
  const map = useMap();
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    if (!Number.isFinite(busPosition?.lat) || !Number.isFinite(busPosition?.lng)) {
      return;
    }

    const busLatLng = [busPosition.lat, busPosition.lng];

    if (!hasCenteredRef.current) {
      // Center once at current zoom level without changing zoom.
      map.setView(busLatLng, map.getZoom(), { animate: true });
      hasCenteredRef.current = true;
      return;
    }

    // Follow bus position smoothly without changing zoom.
    map.panTo(busLatLng, { animate: true, duration: 0.8 });
  }, [busPosition, map]);

  return null;
}

export default function BusLiveMap({ busPosition, destination, routeStops }) {
  const initialCenter = useMemo(() => {
    if (Number.isFinite(busPosition?.lat) && Number.isFinite(busPosition?.lng)) {
      return [busPosition.lat, busPosition.lng];
    }

    return [11.8745, 75.3704];
  }, [busPosition]);

  return (
    <div className="busmap-map-wrap">
      <MapContainer center={initialCenter} zoom={14} className="busmap-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RoadRoutePolyline routeStops={routeStops} />

        {routeStops &&
          routeStops.map((stop) =>
            Number.isFinite(stop.lat) && Number.isFinite(stop.lng) ? (
              <Marker key={stop.name} position={[stop.lat, stop.lng]} icon={stopIcon}>
                <Popup>
                  <div style={{ textAlign: "center", fontWeight: "bold" }}>
                    {stop.name}
                    <br />
                    <span style={{ fontSize: "0.85rem", color: "#666" }}>
                      {stop.lat.toFixed(6)}, {stop.lng.toFixed(6)}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ) : null
          )}

        <BusMarker busPosition={busPosition} />

        {Number.isFinite(destination?.lat) && Number.isFinite(destination?.lng) && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>
              Destination: {destination.name}
              <br />
              Lat: {destination.lat.toFixed(6)}
              <br />
              Lng: {destination.lng.toFixed(6)}
            </Popup>
          </Marker>
        )}

        <MapCameraController busPosition={busPosition} />
      </MapContainer>
    </div>
  );
}
