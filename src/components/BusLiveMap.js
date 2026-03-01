"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

const busIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const destinationIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: "destination-pin",
});

function MapAutoCenter({ center }) {
  const map = useMap();

  useEffect(() => {
    if (Number.isFinite(center?.lat) && Number.isFinite(center?.lng)) {
      map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
    }
  }, [center, map]);

  return null;
}

export default function BusLiveMap({ busPosition, destination }) {
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

        {Number.isFinite(busPosition?.lat) && Number.isFinite(busPosition?.lng) && (
          <Marker position={[busPosition.lat, busPosition.lng]} icon={busIcon}>
            <Popup>
              Live Bus Position
              <br />
              Lat: {busPosition.lat.toFixed(6)}
              <br />
              Lng: {busPosition.lng.toFixed(6)}
            </Popup>
          </Marker>
        )}

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

        <MapAutoCenter center={busPosition} />
      </MapContainer>
    </div>
  );
}
