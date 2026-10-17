import type {
  AdventureMode,
  AdventureStatus,
  Category,
  DestinationSelectionErrorCode,
  DurationMinutes,
  VehicleType,
} from "@/types/adventure";

export type AdventureRequest = {
  vehicleType: VehicleType;
  durationMinutes: DurationMinutes;
  category: Category;
  originId: string;
  mode: AdventureMode;
};

export type AdventureApiErrorCode =
  | DestinationSelectionErrorCode
  | "INVALID_REQUEST"
  | "UNKNOWN_ORIGIN"
  | "UNSUPPORTED_MODE"
  | "INTERNAL_ERROR";

/**
 * 画面用レスポンス。目的地の名称・座標・画像・説明は含めない。
 * destinationId は内部状態として保持する不透明なIDで、画面には表示しない。
 */
export type AdventureApiResponse = {
  success: boolean;
  status: AdventureStatus;
  adventureId?: string;
  destinationId?: string;
  estimatedDurationMinutes?: number;
  errorCode?: AdventureApiErrorCode;
};
