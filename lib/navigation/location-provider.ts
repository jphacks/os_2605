import type { LocationSample } from "@/types/adventure";

export type LocationUpdate = (location: LocationSample) => void;

export interface LocationProvider {
  start(onUpdate: LocationUpdate, onError?: (error: Error) => void): void;
  stop(): void;
}

const APPLE_REFERENCE_DATE_OFFSET_MS = Date.UTC(2001, 0, 1);
const TIMESTAMP_EPOCH_DETECTION_TOLERANCE_MS = 5 * 60_000;

/**
 * Some Apple-backed browser environments return Geolocation timestamps using
 * the 2001 reference date instead of the Unix epoch required by the web API.
 * Only normalize when the observed gap closely matches that exact offset.
 */
export function normalizeGeolocationTimestamp(timestamp: number, receivedAt = Date.now()) {
  if (!Number.isFinite(timestamp) || !Number.isFinite(receivedAt)) return timestamp;
  const observedGap = receivedAt - timestamp;
  return Math.abs(observedGap - APPLE_REFERENCE_DATE_OFFSET_MS) <= TIMESTAMP_EPOCH_DETECTION_TOLERANCE_MS
    ? timestamp + APPLE_REFERENCE_DATE_OFFSET_MS
    : timestamp;
}

export class GPSLocationProvider implements LocationProvider {
  private watchId: number | null = null;

  start(onUpdate: LocationUpdate, onError?: (error: Error) => void) {
    this.stop();
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      onError?.(new Error("このブラウザは位置情報に対応していません。"));
      return;
    }
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const receivedAt = Date.now();
        onUpdate({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: normalizeGeolocationTimestamp(position.timestamp, receivedAt),
        });
      },
      (error) => onError?.(new Error(error.code === error.PERMISSION_DENIED ? "位置情報の利用が許可されていません。" : "現在地を取得できませんでした。")),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
    );
  }

  stop() {
    if (this.watchId !== null && typeof navigator !== "undefined" && navigator.geolocation) navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
  }
}

/** 単体テスト用。ユーザー向け画面からは利用しない。 */
export class TestLocationProvider implements LocationProvider {
  private onUpdate: LocationUpdate | null = null;
  start(onUpdate: LocationUpdate) { this.onUpdate = onUpdate; }
  emit(location: LocationSample) { this.onUpdate?.(location); }
  stop() { this.onUpdate = null; }
}
