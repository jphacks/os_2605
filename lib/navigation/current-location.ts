import type { Coordinates } from "@/types/adventure";

/** ブラウザの位置情報から出発地を1回だけ取得する。 */
export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise<Coordinates>((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    );
  });
}
