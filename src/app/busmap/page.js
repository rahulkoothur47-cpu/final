"use client";

import { useEffect, useMemo, useState } from "react";
import dynamicImport from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { onValue, ref } from "firebase/database";
import { db, hasFirebaseConfig } from "@/lib/firebase";

// Prevent static generation - this page requires client-side rendering
export const dynamic = 'force-dynamic';

const BusLiveMap = dynamicImport(() => import("@/components/BusLiveMap"), {
  ssr: false,
  loading: () => <p className="busmap-loading">Loading map...</p>,
});

const LinearRouteMap = dynamicImport(() => import("@/components/LinearRouteMap"), {
  ssr: false,
});

const ROUTE_STOPS = {
  payyanurViaTaliparamba: [
    { name: "Payyanur", lat: 12.106784790108003, lng: 75.21030675840721 },
    {name:"Bypass road stop", lat: 12.11351613506258, lng: 75.21043618869865},
    { name: "Perumba", lat: 12.111626988027025, lng: 75.21924800410231},
    {name:"Payyanur college stop", lat: 12.101188992612682, lng: 75.22995782962082},
    {name:"Ezhilode", lat: 12.092453748656329, lng: 75.24806314053399},
    {name:"Plathara", lat: 12.08014701482077, lng: 75.26306381376685},
    {name:"Vilayankode", lat: 12.075428683131365, lng:75.27602501692503},
    {name:"periyaram", lat: 12.075428683131365, lng: 75.27602501692503},
    {name:"Empate bus stop", lat: 12.068244675039452, lng: 75.30528064520092},
    {name:"koran-pedika stop", lat: 12.06144416292877, lng: 75.32569999880673},
    {name:"Chudala", lat: 12.061137399293951, lng: 75.33612726382222},
    {name:"Kuppam", lat: 12.051880200379442, lng: 75.34320901055995},
    { name:"Taliparamba", lat: 12.03616141329985, lng: 75.36020462074428},
    {name:"kuttikkol", lat: 12.018436491728679, lng: 75.36934147817087},
    {name:"bakkalam", lat: 11.997059731844809, lng: 75.37077729639444},
    {name:"GCEK ", lat: 11.986166453917972, lng: 75.38159230420446}
  ],

  payyanurViaPazhangadi: [
    { name: "Payyanur", lat: 12.1044, lng: 75.2025 },
    {name:"payyanur college stop", lat: 12.0615, lng: 75.2532},
    {name:"Ezhilode", lat: 12.092453748656329, lng: 75.24806314053399},
    { name: "Pazhangadi", lat: 12.0248, lng: 75.2621 },
    { name: "Valapattanam", lat: 11.9331, lng: 75.3471 },
    { name: "GCEK Main Gate", lat: 11.8745, lng: 75.3704 },
  ],

  kannurViaKambil: [
    { name: "Kannur", lat: 11.8745, lng: 75.3704 },
    { name: "Narath", lat: 11.9373, lng: 75.4292 },
    { name: "GCEK Main Gate", lat: 11.8745, lng: 75.3704 },
  ],
  kannurViaValapattanam: [
    { name: "Kannur", lat: 11.8745, lng: 75.3704 },
    { name: "Valapattanam", lat: 11.9331, lng: 75.3471 },
    { name: "GCEK Main Gate", lat: 11.8745, lng: 75.3704 },
  ],
};

const BUS_ROUTE_KEY = {
  1: "kannurViaValapattanam",
  2: "payyanurViaTaliparamba",
  3: "kannurViaKambil",
  8: "payyanurViaPazhangadi",
  9: "payyanurViaTaliparamba",
  10: "kannurViaValapattanam",
};

const ROUTE_LABEL = {
  payyanurViaTaliparamba: "Payyanur to College via Taliparamba",
  payyanurViaPazhangadi: "Payyanur to College via Pazhangadi",
  kannurViaKambil: "Kannur to College via Kambil",
  kannurViaValapattanam: "Kannur to College via Valapattanam",
};

const FRESHNESS_THRESHOLD_MS = 15000;

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

function normalizeTimestamp(rawTimestamp) {
  if (!rawTimestamp) return Date.now();

  const numericTime = Number(rawTimestamp);
  if (Number.isNaN(numericTime)) return Date.now();

  return numericTime < 1e12 ? numericTime * 1000 : numericTime;
}

function normalizeBusPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const latitude =
    payload.latitude ?? payload.lat ?? payload.location?.latitude ?? payload.location?.lat;
  const longitude =
    payload.longitude ?? payload.lng ?? payload.lon ?? payload.location?.longitude ?? payload.location?.lng;
  const speed = payload.speed ?? payload.speedKmh ?? payload.velocity ?? 0;
  const timestamp = normalizeTimestamp(
    payload.timestamp ?? payload.updatedAt ?? payload.serverTimestamp ?? payload.time
  );

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  const parsedSpeed = Number(speed);

  if (Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude)) {
    return null;
  }

  return {
    lat: parsedLatitude,
    lng: parsedLongitude,
    speed: Number.isNaN(parsedSpeed) ? 0 : parsedSpeed,
    timestamp,
  };
}

export default function BusMapPage() {
  const searchParams = useSearchParams();
  const busNumber = searchParams.get("bus") || "1";
  const selectedRouteKey = BUS_ROUTE_KEY[Number(busNumber)] || "kannurViaTaliparamba";
  const currentRouteStops = ROUTE_STOPS[selectedRouteKey] || ROUTE_STOPS["kannurViaTaliparamba"] || [];

  const [selectedLocationName, setSelectedLocationName] = useState("");
  const [busLiveData, setBusLiveData] = useState(null);
  const [uiError, setUiError] = useState("");
  const [nowTime, setNowTime] = useState(Date.now());

  const selectedLocation = useMemo(
    () =>
      selectedLocationName && currentRouteStops.length
        ? currentRouteStops.find((location) => location.name === selectedLocationName)
        : null,
    [currentRouteStops, selectedLocationName]
  );

  useEffect(() => {
    setSelectedLocationName("");
  }, [currentRouteStops]);

  const shouldShowEta = selectedLocationName && selectedLocation && busLiveData;

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    setUiError("");

    if (!hasFirebaseConfig || !db) {
      setUiError("Firebase config is missing. Add NEXT_PUBLIC_FIREBASE_* values in .env.local");
      return undefined;
    }

    const busRef = ref(db, `bus_${busNumber}`);
    const unsubscribe = onValue(
      busRef,
      (snapshot) => {
        const payload = snapshot.val();
        const normalizedData = normalizeBusPayload(payload);

        if (!normalizedData) {
          setUiError("No valid live coordinates available for this bus yet.");
          return;
        }

        setUiError("");
        setBusLiveData(normalizedData);
      },
      () => {
        setUiError("Unable to read live bus data from Firebase.");
      }
    );

    return () => unsubscribe();
  }, [busNumber]);

  const isDataDelayed = busLiveData ? nowTime - busLiveData.timestamp > FRESHNESS_THRESHOLD_MS : false;

  const distanceKm = busLiveData && selectedLocation
    ? haversineDistanceKm({ lat: busLiveData.lat, lng: busLiveData.lng }, selectedLocation)
    : null;

  const etaMinutes =
    distanceKm !== null && busLiveData?.speed > 0
      ? Math.max(1, Math.round((distanceKm / busLiveData.speed) * 60 - 2.5))
      : null;

  return (
    <main className="busmap-main">
      <section className="busmap-shell container">
        <div className="busmap-header-row">
          <div>
            <h2 className="busmap-title">Bus {busNumber} Live Map</h2>
            <p className="busmap-subtitle">
              Realtime OpenStreetMap tracking with Firebase updates • Route: {ROUTE_LABEL[selectedRouteKey]}
            </p>
          </div>
          <Link href="/?flow=gcek" className="track-btn">
            Back to Home
          </Link>
        </div>

        <div className="busmap-controls">
          <div className="busmap-control-row">
            <div className="busmap-input-group">
              <label htmlFor="destination" className="busmap-label">
                Select Bus-stop
              </label>
              <select
                id="destination"
                value={selectedLocationName}
                onChange={(event) => setSelectedLocationName(event.target.value)}
                className="busmap-select"
              >
                <option value="">-- Choose a stop --</option>
                {currentRouteStops.map((location) => (
                  <option key={location.name} value={location.name}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            {shouldShowEta && (
              <div className="busmap-eta-display">
                <p className="busmap-eta-label">ETA</p>
                <p className="busmap-eta-value">
                  {etaMinutes !== null ? Math.max(1, Math.round(etaMinutes)) : "--"} mins
                </p>
              </div>
            )}
          </div>
        </div>

        {uiError && <p className="busmap-error">{uiError}</p>}

      
        <BusLiveMap
          busPosition={busLiveData}
          destination={selectedLocation || { lat: 11.8745, lng: 75.3704, name: "College" }}
          routeStops={currentRouteStops}
        />

        <LinearRouteMap
          busPosition={busLiveData}
          routeStops={currentRouteStops}
          selectedStop={selectedLocation}
        />
      </section>
    </main>
  );
}
