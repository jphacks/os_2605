export const NAVIGATION_CONFIG = {
  // Desktop browsers often estimate location from Wi-Fi instead of a GPS chip.
  // Keep guidance available for those fixes, while arrival remains stricter.
  maxLocationAgeMs: 60_000,
  maxAccuracyMeters: 200,
  offRouteMeters: 75,
  stepPassToleranceMeters: 25,
  allowedProgressRegressionMeters: 60,
  regressionConfirmationCount: 2,
  voiceEarlyMeters: 300,
  voiceNearMeters: 80,
} as const;

export const ARRIVAL_CONFIG = {
  radiusMeters: 50,
  maxLocationAgeMs: 15_000,
  maxAccuracyMeters: 50,
  confirmationCount: 2,
  minSampleIntervalMs: 1_000,
  maxSampleGapMs: 15_000,
} as const;
