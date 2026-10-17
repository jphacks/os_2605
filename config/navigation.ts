export const NAVIGATION_CONFIG = {
  // Desktop browsers often estimate location from Wi-Fi instead of a GPS chip.
  // Keep guidance available for those fixes, while arrival remains stricter.
  maxLocationAgeMs: 60_000,
  maxAccuracyMeters: 200,
  offRouteMeters: 75,
  stepPassToleranceMeters: 25,
  allowedProgressRegressionMeters: 60,
  regressionConfirmationCount: 2,
  // 速度が分からないときの読み上げ距離。通常は経路の速度から求める（voiceLead*）。
  voiceEarlyMeters: 300,
  voiceNearMeters: 80,
  // 曲がり角の何秒前に読み上げるか。距離=速度×秒数を、下の範囲に収める。
  voiceEarlyLeadSeconds: 20,
  voiceNearLeadSeconds: 6,
  voiceEarlyRangeMeters: [150, 800],
  voiceNearRangeMeters: [40, 250],
} as const;

export const ARRIVAL_CONFIG = {
  radiusMeters: 50,
  maxLocationAgeMs: 15_000,
  maxAccuracyMeters: 50,
  confirmationCount: 2,
  minSampleIntervalMs: 1_000,
  maxSampleGapMs: 15_000,
} as const;

/** 到着確認をサーバーへ問い合わせる最短間隔。到着判定の最短測位間隔(1秒)より長く、最大間隔(15秒)より十分短い。 */
export const ARRIVAL_REQUEST_INTERVAL_MS = 2_000;
