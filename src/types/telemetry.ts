export interface Measurement {
  id: string;
  deviceId: string;
  recordedAt: string;
  temperature: number | null;
  humidity: number | null;
  soilMoisture: number | null;
  light: number | null;
  co2: number | null;
  waterPump: boolean | null;
  exhaustFan: boolean | null;
  growLight: boolean | null;
}

export interface Device {
  id: string;
  name: string;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TimeRangePreset = '1h' | '6h' | '24h' | '7d' | 'all';

export interface TelemetryFilters {
  deviceId: string;
  timeRange: TimeRangePreset;
  limit: number;
}
