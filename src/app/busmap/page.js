"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
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
    { name:"Perumba", lat: 12.111626988027025, lng: 75.21924800410231},
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
    {name:"GCEK ", lat: 11.986166453917972, lng: 75.38159230420446},
  ],

  payyanurViaPazhangadi: [
    { name: "Payyanur", lat: 12.1044, lng: 75.2025 },
    {name:"payyanur college stop", lat: 12.0615, lng: 75.2532},
    {name:"Ezhilode", lat: 12.092453748656329, lng: 75.24806314053399},
    { name: "Pazhangadi", lat: 12.0248, lng: 75.2621 },
    {name:"GCEK ", lat: 11.986166453917972, lng: 75.38159230420446},
  ],

  kannurViaKambil: [
    { name: "Kannur", lat: 11.8745, lng: 75.3704 },
    { name: "Narath", lat: 11.9373, lng: 75.4292 },
     {name:"GCEK ", lat: 11.986166453917972, lng: 75.38159230420446},
  ],
  kannurViaValapattanam: [
    { name: "Kannur", lat: 11.8745, lng: 75.3704 },
    { name: "Valapattanam", lat: 11.9331, lng: 75.3471 },
     {name:"GCEK ", lat: 11.986166453917972, lng: 75.38159230420446},
  ],
};

const BUS_ROUTE_KEY = {
  1: "kannurViaValapattanam",
  2: "payyanurViaTaliparamba",
  3: "kannurViaKambil",
  8: "payyanurViaTaliparamba",
  9: "payyanurViaPazhangadi",
  10: "kannurViaValapattanam",
};

const ROUTE_LABEL = {
  payyanurViaTaliparamba: "Payyanur to College via Taliparamba",
  payyanurViaPazhangadi: "Payyanur to College via Pazhangadi",
  kannurViaKambil: "Kannur to College via Kambil",
  kannurViaValapattanam: "Kannur to College via Valapattanam",
};

const FRESHNESS_THRESHOLD_MS = 60000; // 60 seconds - GPS updates may not be instant
const MORNING_START_HOUR = 4;
const EVENING_REVERSE_HOUR = 14;
const MIN_MOVING_SPEED_KMH = 5;
const OFF_ROUTE_THRESHOLD_KM = 0.5;
const ARRIVED_DISTANCE_THRESHOLD_KM = 0.12;
const MIN_MOVEMENT_FOR_DERIVED_SPEED_KM = 0.01;
const MAX_REASONABLE_SPEED_KMH = 120;
const ETA_SMOOTHING_ALPHA = 0.25;
const ETA_MIN_UPDATE_INTERVAL_MS = 15000;
const ETA_MAX_STEP_CHANGE_MINUTES = 2;
const ETA_MIN_REALISTIC_SPEED_KMH = 8;
const ETA_MAX_REALISTIC_SPEED_KMH = 65;
const ETA_CONGESTION_MULTIPLIER = 1.12;
const ETA_DIRECT_DISTANCE_MULTIPLIER = 1.08;
const ETA_BASE_BUFFER_MINUTES = 0.6;
const ETA_PER_STOP_BUFFER_MINUTES = 0.35;
const ETA_MAX_STOP_BUFFER_MINUTES = 4;

function parseNumberish(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue) return null;

    const directNumber = Number(trimmedValue);
    if (!Number.isNaN(directNumber)) {
      return directNumber;
    }

    const match = trimmedValue.match(/-?\d+(?:\.\d+)?/);
    if (match) {
      const matchedNumber = Number(match[0]);
      return Number.isNaN(matchedNumber) ? null : matchedNumber;
    }
  }

  return null;
}

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
  if (rawTimestamp === undefined || rawTimestamp === null || rawTimestamp === "") return Date.now();

  if (rawTimestamp instanceof Date) {
    const timestampMs = rawTimestamp.getTime();
    return Number.isNaN(timestampMs) ? Date.now() : timestampMs;
  }

  if (typeof rawTimestamp === "string") {
    const trimmedTimestamp = rawTimestamp.trim();
    if (!trimmedTimestamp) return Date.now();

    // Only treat as numeric when the whole string is numeric.
    if (/^[+-]?\d+(?:\.\d+)?$/.test(trimmedTimestamp)) {
      const numericFromString = Number(trimmedTimestamp);
      if (!Number.isNaN(numericFromString)) {
        return numericFromString < 1e12 ? numericFromString * 1000 : numericFromString;
      }
    }

    const parsedDateTime = Date.parse(trimmedTimestamp);
    if (!Number.isNaN(parsedDateTime)) return parsedDateTime;

    return Date.now();
  }

  const numericTime = Number(rawTimestamp);
  if (!Number.isNaN(numericTime)) {
    return numericTime < 1e12 ? numericTime * 1000 : numericTime;
  }

  return Date.now();
}

function normalizeSpeedKmh(payload) {
  const speedMps = payload.speedMps ?? payload.speedMs ?? payload.velocityMps ?? payload.velocityMs;
  if (speedMps !== undefined && speedMps !== null) {
    const parsedSpeedMps = parseNumberish(speedMps);
    return parsedSpeedMps === null ? 0 : parsedSpeedMps * 3.6;
  }

  const speedMph = payload.speedMph ?? payload.velocityMph;
  if (speedMph !== undefined && speedMph !== null) {
    const parsedSpeedMph = parseNumberish(speedMph);
    return parsedSpeedMph === null ? 0 : parsedSpeedMph * 1.60934;
  }

  const rawSpeed =
    payload.speed ??
    payload.speedKmh ??
    payload.velocity ??
    payload.location?.speed ??
    payload.coords?.speed ??
    0;
  const parsedRawSpeed = parseNumberish(rawSpeed);
  if (parsedRawSpeed === null) return 0;

  const speedUnit = String(
    payload.speedUnit ?? payload.speedUnits ?? payload.unit ?? payload.location?.speedUnit ?? rawSpeed ?? ""
  ).toLowerCase();
  if (speedUnit.includes("m/s") || speedUnit.includes("meter/second")) {
    return parsedRawSpeed * 3.6;
  }

  if (speedUnit.includes("mph") || speedUnit.includes("mile/hour")) {
    return parsedRawSpeed * 1.60934;
  }

  if (speedUnit.includes("knot") || speedUnit.includes("kt")) {
    return parsedRawSpeed * 1.852;
  }

  return parsedRawSpeed;
}

function normalizeBusPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const latitude =
    payload.latitude ??
    payload.lat ??
    payload.location?.latitude ??
    payload.location?.lat ??
    payload.coords?.latitude ??
    payload.coords?.lat;
  const longitude =
    payload.longitude ??
    payload.lng ??
    payload.lon ??
    payload.location?.longitude ??
    payload.location?.lng ??
    payload.coords?.longitude ??
    payload.coords?.lng ??
    payload.coords?.lon;
  const speed = normalizeSpeedKmh(payload);
  const timestamp = normalizeTimestamp(
    payload.timestamp ?? payload.updatedAt ?? payload.serverTimestamp ?? payload.time ?? payload.createdAt
  );

  const parsedLatitude = parseNumberish(latitude);
  const parsedLongitude = parseNumberish(longitude);
  const parsedSpeed = parseNumberish(speed);

  if (parsedLatitude === null || parsedLongitude === null) {
    return null;
  }

  return {
    lat: parsedLatitude,
    lng: parsedLongitude,
    speed: parsedSpeed === null ? 0 : parsedSpeed,
    timestamp,
  };
}

function buildRouteMetrics(routeStops) {
  if (!Array.isArray(routeStops) || routeStops.length < 2) {
    return null;
  }

  const segmentDistancesKm = [];
  const cumulativeDistancesKm = [0];

  for (let index = 0; index < routeStops.length - 1; index += 1) {
    const segmentDistanceKm = haversineDistanceKm(routeStops[index], routeStops[index + 1]);
    segmentDistancesKm.push(segmentDistanceKm);
    cumulativeDistancesKm.push(cumulativeDistancesKm[index] + segmentDistanceKm);
  }

  return {
    segmentDistancesKm,
    cumulativeDistancesKm,
  };
}

function getRouteProgress(point, routeStops, routeMetrics) {
  if (!point || !routeMetrics || !Array.isArray(routeStops) || routeStops.length < 2) {
    return null;
  }

  let minDistanceFromRouteKm = Infinity;
  let projectedProgressKm = 0;

  for (let index = 0; index < routeStops.length - 1; index += 1) {
    const segmentLengthKm = routeMetrics.segmentDistancesKm[index];
    if (!Number.isFinite(segmentLengthKm) || segmentLengthKm <= 0) continue;

    const distToStartKm = haversineDistanceKm(point, routeStops[index]);
    const distToEndKm = haversineDistanceKm(point, routeStops[index + 1]);

    const projectedAlongSegmentRawKm =
      (distToStartKm ** 2 + segmentLengthKm ** 2 - distToEndKm ** 2) / (2 * segmentLengthKm);
    const projectedAlongSegmentKm = Math.min(
      segmentLengthKm,
      Math.max(0, projectedAlongSegmentRawKm)
    );

    const distanceFromSegmentKm = Math.sqrt(
      Math.max(0, distToStartKm ** 2 - projectedAlongSegmentKm ** 2)
    );

    if (distanceFromSegmentKm < minDistanceFromRouteKm) {
      minDistanceFromRouteKm = distanceFromSegmentKm;
      projectedProgressKm = routeMetrics.cumulativeDistancesKm[index] + projectedAlongSegmentKm;
    }
  }

  return {
    progressKm: projectedProgressKm,
    distanceFromRouteKm: minDistanceFromRouteKm,
  };
}

function getDirectionalRoute(routeStops, hour24) {
  if (!Array.isArray(routeStops) || routeStops.length === 0) return [];

  // Morning/daytime: origin -> college. Evening/night: reverse direction.
  const isEveningOrNight = hour24 >= EVENING_REVERSE_HOUR || hour24 < MORNING_START_HOUR;
  return isEveningOrNight ? [...routeStops].reverse() : routeStops;
}

function getMedianValue(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return 0;

  const sortedNumbers = [...numbers].sort((left, right) => left - right);
  const middleIndex = Math.floor(sortedNumbers.length / 2);

  if (sortedNumbers.length % 2 === 0) {
    return (sortedNumbers[middleIndex - 1] + sortedNumbers[middleIndex]) / 2;
  }

  return sortedNumbers[middleIndex];
}

function getNextStopIndexByProgress(progressKm, routeMetrics) {
  if (!routeMetrics || !Array.isArray(routeMetrics.cumulativeDistancesKm)) {
    return -1;
  }

  for (let index = 0; index < routeMetrics.cumulativeDistancesKm.length; index += 1) {
    if (progressKm <= routeMetrics.cumulativeDistancesKm[index]) {
      return index;
    }
  }

  return routeMetrics.cumulativeDistancesKm.length - 1;
}

function BusMapContent() {
  const searchParams = useSearchParams();
  const busNumber = searchParams.get("bus") || "1";
  const selectedRouteKey = BUS_ROUTE_KEY[Number(busNumber)] || "kannurViaValapattanam";
  const baseRouteStops = ROUTE_STOPS[selectedRouteKey] || ROUTE_STOPS["kannurViaValapattanam"] || [];
  const currentHour = new Date().getHours();
  const currentRouteStops = useMemo(
    () => getDirectionalRoute(baseRouteStops, currentHour),
    [baseRouteStops, currentHour]
  );
  const isReverseDirection = currentHour >= EVENING_REVERSE_HOUR || currentHour < MORNING_START_HOUR;

  const [selectedLocationName, setSelectedLocationName] = useState("");
  const [busLiveData, setBusLiveData] = useState(null);
  const [uiError, setUiError] = useState("");
  const [nowTime, setNowTime] = useState(Date.now());
  const lastBusSampleRef = useRef(null);
  const lastRouteProgressSampleRef = useRef(null);
  const smoothedEtaMinutesRef = useRef(null);
  const lastEtaDisplayUpdateAtRef = useRef(0);
  const [stableEtaMinutes, setStableEtaMinutes] = useState(null);
  const [routeProgressSpeedKmh, setRouteProgressSpeedKmh] = useState(null);

  const selectedLocation = useMemo(
    () =>
      selectedLocationName && currentRouteStops.length
        ? currentRouteStops.find((location) => location.name === selectedLocationName)
        : null,
    [currentRouteStops, selectedLocationName]
  );

  const selectedStopIndex = useMemo(
    () => (selectedLocationName ? currentRouteStops.findIndex((stop) => stop.name === selectedLocationName) : -1),
    [currentRouteStops, selectedLocationName]
  );

  const routeMetrics = useMemo(() => buildRouteMetrics(currentRouteStops), [currentRouteStops]);

  const selectedStopProgressKm =
    selectedStopIndex >= 0 && routeMetrics
      ? routeMetrics.cumulativeDistancesKm[selectedStopIndex]
      : null;

  useEffect(() => {
    setSelectedLocationName("");
  }, [currentRouteStops]);

  useEffect(() => {
    smoothedEtaMinutesRef.current = null;
    lastEtaDisplayUpdateAtRef.current = 0;
    lastRouteProgressSampleRef.current = null;
    setStableEtaMinutes(null);
    setRouteProgressSpeedKmh(null);
  }, [selectedLocationName, busNumber]);

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
        const receivedAt = Date.now();
        const payload = snapshot.val();
        const normalizedData = normalizeBusPayload(payload);

        if (!normalizedData) {
          setUiError("No valid live coordinates available for this bus yet.");
          return;
        }

        const previousSample = lastBusSampleRef.current;
        let derivedSpeedKmh = null;

        if (previousSample && normalizedData.timestamp > previousSample.timestamp) {
          const elapsedHours = (normalizedData.timestamp - previousSample.timestamp) / (60 * 60 * 1000);
          if (elapsedHours > 0) {
            const movedDistanceKm = haversineDistanceKm(previousSample, normalizedData);
            if (movedDistanceKm >= MIN_MOVEMENT_FOR_DERIVED_SPEED_KM) {
              const computedSpeedKmh = movedDistanceKm / elapsedHours;
              if (
                Number.isFinite(computedSpeedKmh) &&
                computedSpeedKmh > 0 &&
                computedSpeedKmh <= MAX_REASONABLE_SPEED_KMH
              ) {
                derivedSpeedKmh = computedSpeedKmh;
              }
            }
          }
        }

        lastBusSampleRef.current = {
          lat: normalizedData.lat,
          lng: normalizedData.lng,
          timestamp: normalizedData.timestamp,
        };

        setUiError("");
        setBusLiveData({
          ...normalizedData,
          derivedSpeedKmh,
          receivedAt,
        });
      },
      () => {
        setUiError("Unable to read live bus data from Firebase.");
      }
    );

    return () => unsubscribe();
  }, [busNumber]);

  const freshestBusTimestamp = busLiveData
    ? Math.max(busLiveData.timestamp ?? 0, busLiveData.receivedAt ?? 0)
    : 0;
  const isDataDelayed = busLiveData ? nowTime - freshestBusTimestamp > FRESHNESS_THRESHOLD_MS : false;

  const busRouteProgress = useMemo(
    () =>
      busLiveData && routeMetrics
        ? getRouteProgress({ lat: busLiveData.lat, lng: busLiveData.lng }, currentRouteStops, routeMetrics)
        : null,
    [busLiveData, currentRouteStops, routeMetrics]
  );

  useEffect(() => {
    if (!busRouteProgress || !busLiveData?.timestamp) {
      return;
    }

    const previousRouteProgressSample = lastRouteProgressSampleRef.current;
    const currentRouteProgressSample = {
      progressKm: busRouteProgress.progressKm,
      timestamp: busLiveData.timestamp,
    };

    if (previousRouteProgressSample && currentRouteProgressSample.timestamp > previousRouteProgressSample.timestamp) {
      const elapsedHours =
        (currentRouteProgressSample.timestamp - previousRouteProgressSample.timestamp) / (60 * 60 * 1000);
      const progressDeltaKm = currentRouteProgressSample.progressKm - previousRouteProgressSample.progressKm;

      if (elapsedHours > 0 && progressDeltaKm >= MIN_MOVEMENT_FOR_DERIVED_SPEED_KM) {
        const computedRouteProgressSpeedKmh = progressDeltaKm / elapsedHours;
        if (
          Number.isFinite(computedRouteProgressSpeedKmh) &&
          computedRouteProgressSpeedKmh > 0 &&
          computedRouteProgressSpeedKmh <= MAX_REASONABLE_SPEED_KMH
        ) {
          setRouteProgressSpeedKmh(computedRouteProgressSpeedKmh);
        }
      }
    }

    lastRouteProgressSampleRef.current = currentRouteProgressSample;
  }, [busRouteProgress, busLiveData?.timestamp]);

  const remainingRouteDistanceKm =
    busRouteProgress && selectedStopProgressKm !== null
      ? selectedStopProgressKm - busRouteProgress.progressKm
      : null;

  const directDistanceToStopKm =
    busLiveData && selectedLocation
      ? haversineDistanceKm(
          { lat: busLiveData.lat, lng: busLiveData.lng },
          { lat: selectedLocation.lat, lng: selectedLocation.lng }
        )
      : null;

  const isOffRoute = busRouteProgress
    ? busRouteProgress.distanceFromRouteKm > OFF_ROUTE_THRESHOLD_KM
    : false;

  const canUseRouteDistance = remainingRouteDistanceKm !== null && !isOffRoute;
  const etaDistanceKm = canUseRouteDistance ? remainingRouteDistanceKm : directDistanceToStopKm;

  const isArrivingNow =
    canUseRouteDistance
      ? Math.abs(remainingRouteDistanceKm) <= ARRIVED_DISTANCE_THRESHOLD_KM
      : directDistanceToStopKm !== null && directDistanceToStopKm <= ARRIVED_DISTANCE_THRESHOLD_KM;

  const hasPassedStop =
    canUseRouteDistance && remainingRouteDistanceKm < -ARRIVED_DISTANCE_THRESHOLD_KM;

  const payloadSpeedKmh = busLiveData?.speed ?? 0;
  const fallbackSpeedKmh = busLiveData?.derivedSpeedKmh ?? 0;
  const speedCandidatesKmh = [payloadSpeedKmh, fallbackSpeedKmh, routeProgressSpeedKmh].filter(
    (speedKmh) => Number.isFinite(speedKmh) && speedKmh >= MIN_MOVING_SPEED_KMH
  );

  const blendedSpeedKmh = speedCandidatesKmh.length
    ? Math.min(
        ETA_MAX_REALISTIC_SPEED_KMH,
        Math.max(ETA_MIN_REALISTIC_SPEED_KMH, getMedianValue(speedCandidatesKmh))
      )
    : 0;

  const isBusMoving = blendedSpeedKmh >= MIN_MOVING_SPEED_KMH;

  const busProgressStopIndex =
    canUseRouteDistance && busRouteProgress && routeMetrics
      ? getNextStopIndexByProgress(busRouteProgress.progressKm, routeMetrics)
      : -1;

  const stopsAheadCount =
    canUseRouteDistance && selectedStopIndex >= 0 && busProgressStopIndex >= 0
      ? Math.max(0, selectedStopIndex - busProgressStopIndex)
      : 0;

  const travelEtaMinutes =
    etaDistanceKm !== null &&
    etaDistanceKm > ARRIVED_DISTANCE_THRESHOLD_KM &&
    blendedSpeedKmh >= MIN_MOVING_SPEED_KMH &&
    !isDataDelayed
      ? (etaDistanceKm / blendedSpeedKmh) * 60
      : null;

  const stopDelayBufferMinutes =
    travelEtaMinutes !== null && canUseRouteDistance
      ? Math.min(ETA_MAX_STOP_BUFFER_MINUTES, stopsAheadCount * ETA_PER_STOP_BUFFER_MINUTES)
      : 0;

  const rawEtaMinutes =
    travelEtaMinutes !== null
      ? travelEtaMinutes * (canUseRouteDistance ? ETA_CONGESTION_MULTIPLIER : ETA_DIRECT_DISTANCE_MULTIPLIER) +
        ETA_BASE_BUFFER_MINUTES +
        stopDelayBufferMinutes
      : null;

  useEffect(() => {
    if (rawEtaMinutes === null || !Number.isFinite(rawEtaMinutes)) {
      smoothedEtaMinutesRef.current = null;
      lastEtaDisplayUpdateAtRef.current = 0;
      setStableEtaMinutes(null);
      return;
    }

    const previousSmoothed = smoothedEtaMinutesRef.current;
    const nextSmoothedMinutes =
      previousSmoothed === null
        ? rawEtaMinutes
        : previousSmoothed + (rawEtaMinutes - previousSmoothed) * ETA_SMOOTHING_ALPHA;

    smoothedEtaMinutesRef.current = nextSmoothedMinutes;

    setStableEtaMinutes((previousDisplayMinutes) => {
      const roundedTargetMinutes = Math.max(1, Math.round(nextSmoothedMinutes));

      if (previousDisplayMinutes === null) {
        lastEtaDisplayUpdateAtRef.current = Date.now();
        return roundedTargetMinutes;
      }

      if (roundedTargetMinutes === previousDisplayMinutes) {
        return previousDisplayMinutes;
      }

      const now = Date.now();
      if (now - lastEtaDisplayUpdateAtRef.current < ETA_MIN_UPDATE_INTERVAL_MS) {
        return previousDisplayMinutes;
      }

      const deltaMinutes = roundedTargetMinutes - previousDisplayMinutes;
      const cappedDeltaMinutes = Math.max(
        -ETA_MAX_STEP_CHANGE_MINUTES,
        Math.min(ETA_MAX_STEP_CHANGE_MINUTES, deltaMinutes)
      );

      lastEtaDisplayUpdateAtRef.current = now;
      return previousDisplayMinutes + cappedDeltaMinutes;
    });
  }, [rawEtaMinutes]);

  const arrivalTime = stableEtaMinutes !== null 
    ? new Date(nowTime + stableEtaMinutes * 60 * 1000).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : null;

  const etaStatus = () => {
    if (isDataDelayed) return "No recent data";
    if (hasPassedStop) return "Bus already passed this stop";
    if (isArrivingNow) return "Bus arriving now";
    if (busLiveData && !isBusMoving) return "Bus stopped";
    if (isOffRoute && stableEtaMinutes === null) return "Bus is off route";
    return null;
  };

  return (
    <main className="busmap-main">
      <section className="busmap-shell container">
        <div className="busmap-header-row">
          <div>
            <h2 className="busmap-title">Bus {busNumber} Live Map</h2>
            <p className="busmap-subtitle">
              Realtime OpenStreetMap tracking with Firebase updates • Route: {ROUTE_LABEL[selectedRouteKey]} ({isReverseDirection ? "College to Places" : "Places to College"})
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
                <p className="busmap-eta-value">
                  {stableEtaMinutes !== null 
                    ? `The bus will arrive in about ${stableEtaMinutes} mins${arrivalTime ? ` (around ${arrivalTime})` : ""}${!canUseRouteDistance && isOffRoute ? " - direct estimate" : ""}`
                    : etaStatus() || "--"}
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

export default function BusMapPage() {
  return (
    <Suspense fallback={<div className="busmap-loading">Loading...</div>}>
      <BusMapContent />
    </Suspense>
  );
}
