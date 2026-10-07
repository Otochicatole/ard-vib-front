import type { Device, Measurement, TimeRangePreset } from '../types/telemetry';

const API_BASE = '/api';

export async function fetchDevices(): Promise<Device[]> {
  const res = await fetch(`${API_BASE}/devices`);
  if (!res.ok) {
    throw new Error('Error al consultar dispositivos');
  }
  const data = await res.json();
  return data.data ?? [];
}

export async function fetchLatestTelemetry(deviceId: string): Promise<Measurement | null> {
  const res = await fetch(`${API_BASE}/telemetry/${encodeURIComponent(deviceId)}/latest`);
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error('Error al consultar última medición');
  }
  const data = await res.json();
  return data.data ?? null;
}

export async function fetchTelemetryHistory(
  deviceId: string,
  timeRange: TimeRangePreset,
  limit: number = 100
): Promise<Measurement[]> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));

  const now = new Date();
  if (timeRange === '1h') {
    params.set('from', new Date(now.getTime() - 60 * 60 * 1000).toISOString());
  } else if (timeRange === '6h') {
    params.set('from', new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString());
  } else if (timeRange === '24h') {
    params.set('from', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());
  } else if (timeRange === '7d') {
    params.set('from', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());
  }

  const res = await fetch(`${API_BASE}/telemetry/${encodeURIComponent(deviceId)}/history?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Error al consultar histórico de telemetría');
  }
  const data = await res.json();
  return data.data ?? [];
}

export async function sendTelemetry(payload: {
  deviceId: string;
  temperature?: number | null;
  humidity?: number | null;
  soilMoisture?: number | null;
  light?: number | null;
  co2?: number | null;
  waterPump?: boolean | null;
  exhaustFan?: boolean | null;
  growLight?: boolean | null;
}): Promise<Measurement> {
  const res = await fetch(`${API_BASE}/telemetry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? 'Error al enviar medición');
  }
  return data.data;
}
