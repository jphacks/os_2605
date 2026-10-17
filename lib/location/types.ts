import type { LocationSample } from "@/types/adventure";
/** GPSとデモ再生の共通境界。取得・再生処理は後続Issueで実装する。 */
export interface LocationProvider {
  start(onLocationUpdate: (location: LocationSample) => void): void;
  stop(): void;
}
