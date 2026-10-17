export type DurationMinutes = 30 | 60 | 90 | 120;

export type VehicleType = "motorcycle" | "car";

export type Category =
  | "scenery"
  | "nature"
  | "history"
  | "hot_spring"
  | "roadside_station"
  | "random";

export type Coordinates = {
  lat: number;
  lng: number;
};

export type AdventureSettings = {
  vehicleType: VehicleType;
  durationMinutes: DurationMinutes;
  category: Category;
  origin: Coordinates;
};

export type Spot = {
  id: string;
  name: string;
  category: Exclude<Category, "random">;
  location: Coordinates;
  description: string;
  imageUrl: string;
  verified: boolean;
};

/** demo: 固定出発地点とデモ用推定時間を使う。live: 将来のGPS連携用（未実装）。 */
export type AdventureMode = "demo" | "live";

export type Origin = {
  id: string;
  label: string;
  location: Coordinates;
};

export type OpeningInfo = {
  /** unknown は営業時間・立ち入り条件を確認できない状態。実走行向け候補にしない。 */
  type: "always_open" | "hours" | "unknown";
  note?: string;
};

/** 目的地の登録データ。名称・座標は通常UIへ渡さない。 */
export type DestinationCandidate = {
  source?: "openstreetmap" | "curated";
  sourceUrl?: string;
  id: string;
  name: string;
  category: Exclude<Category, "random">;
  location: Coordinates;
  description: string;
  imageUrl: string;
  /** データ上の対応想定。実道路の通行安全性を保証しない。 */
  supportedVehicles: VehicleType[];
  isActive: boolean;
  openingInfo: OpeningInfo;
  accessVerified: boolean;
  /** 出発地点ID別の片道推定所要時間（分）。デモ用の仮定値で、実走行の経路情報ではない。 */
  demoDurations: Record<string, number>;
  /** 実在の座標・アクセス・通行条件を確認した場合のみtrue。 */
  liveRoutingVerified?: boolean;
};

export type DestinationSelectionErrorCode =
  | "INVALID_SETTINGS"
  | "DATA_EMPTY"
  | "DATA_INVALID"
  | "NO_ACTIVE_SPOTS"
  | "NO_CATEGORY_MATCH"
  | "NO_VEHICLE_MATCH"
  | "NO_DURATION_MATCH"
  | "NO_VERIFIED_ACCESS";

export type DestinationSelectionResult =
  | {
      ok: true;
      destination: DestinationCandidate;
      estimatedDurationMinutes: number;
      candidateCount: number;
    }
  | { ok: false; errorCode: DestinationSelectionErrorCode };

/** destinationId は内部状態。画面表示用データに目的地の名称・座標・画像を含めない。 */
export type AdventurePlan = {
  adventureId: string;
  route?: Route;
  settings: AdventureSettings;
  origin: Origin;
  destinationId: string;
  destination?: DestinationCandidate;
  estimatedDurationMinutes: number;
  status: AdventureStatus;
  mode: AdventureMode;
};

export type Maneuver =
  | "STRAIGHT"
  | "TURN_LEFT"
  | "TURN_RIGHT"
  | "SLIGHT_LEFT"
  | "SLIGHT_RIGHT"
  | "UTURN"
  | "ARRIVE"
  | "OTHER";

export type RouteStep = {
  id: string;
  location: Coordinates;
  maneuver: Maneuver;
  instruction: string;
  /** この区間の距離。案内地点までの距離はdistanceFromOriginMeters。 */
  distanceMeters: number;
  durationSeconds: number;
  endLocation: Coordinates;
  distanceFromOriginMeters: number;
};

export type NavigationViewMode = "adventure" | "map";

export type LocationSample = Coordinates & {
  accuracy: number; // メートル
  timestamp: number; // Unix時間、ミリ秒
};

export type Route = {
  id: string;
  origin: Coordinates;
  destination: Coordinates;
  provider: "demo-schematic" | "google-routes" | "osrm";
  mode: AdventureMode;
  geometryKind: "schematic" | "road";
  mapCompatibility: "schematic-only" | "google-maps" | "openstreetmap";
  durationSeconds: number;
  distanceMeters: number;
  /** geometryKind が schematic の場合、実道路ではない検証用模式図。 */
  geometry: Coordinates[]; // 経路順の座標列。実道路では道路形状そのものを保持
  steps: RouteStep[];
};

export type AdventureStatus =
  | "idle"
  | "generating"
  | "ready"
  | "navigating"
  | "arrived"
  | "revealed"
  | "cancelled"
  | "error";
