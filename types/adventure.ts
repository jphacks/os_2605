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

export type Maneuver =
  | "STRAIGHT"
  | "TURN_LEFT"
  | "TURN_RIGHT"
  | "SLIGHT_LEFT"
  | "SLIGHT_RIGHT"
  | "UTURN"
  | "ARRIVE";

export type RouteStep = {
  id: string;
  location: Coordinates;
  maneuver: Maneuver;
  instruction: string;
  distanceMeters: number;
};

export type NavigationViewMode = "adventure" | "map";

export type LocationSample = Coordinates & {
  accuracy: number; // メートル
  timestamp: number; // Unix時間、ミリ秒
};

export type Route = {
  durationSeconds: number;
  distanceMeters: number;
  geometry: Coordinates[]; // 経路順の座標列。案内地点同士を直線で結ぶ代用はしない
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

/** 条件入力段階。出発地点は目的地選択のIssueで設定する。 */
export type AdventureSetupDraft = Pick<
  AdventureSettings,
  "vehicleType" | "durationMinutes" | "category"
>;
