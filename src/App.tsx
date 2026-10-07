import { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import type { Device, Measurement, TimeRangePreset } from './types/telemetry';
import { fetchDevices, fetchLatestTelemetry, fetchTelemetryHistory } from './services/api';
import { Header } from './components/Header';
import { MetricCard } from './components/MetricCard';
import { ActuatorsPanel } from './components/ActuatorsPanel';
import { FiltersBar } from './components/FiltersBar';
import { TelemetryChart } from './components/TelemetryChart';
import { RecentTable } from './components/RecentTable';
import { SimulateModal } from './components/SimulateModal';
import { Thermometer, Droplets, Mountain, Sun, Activity } from 'lucide-react';

export function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('vivero-nodo-01');

  const [latest, setLatest] = useState<Measurement | null>(null);
  const [history, setHistory] = useState<Measurement[]>([]);

  const [timeRange, setTimeRange] = useState<TimeRangePreset>('24h');
  const [limit, setLimit] = useState<number>(100);

  const [activeMetrics, setActiveMetrics] = useState({
    temperature: true,
    humidity: true,
    soilMoisture: true,
    light: false,
    co2: false,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(10000); // 10s predeterminado
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);

  // Cargar lista de dispositivos registrados
  const loadDevices = useCallback(async () => {
    try {
      const devList = await fetchDevices();
      setDevices(devList);
      if (devList.length > 0 && !devList.some((d) => d.id === selectedDevice)) {
        setSelectedDevice(devList[0].id);
      }
    } catch (err) {
      console.error('Error al cargar dispositivos:', err);
    }
  }, [selectedDevice]);

  // Cargar mediciones (Último snapshot e histórico con filtros)
  const loadData = useCallback(async () => {
    if (!selectedDevice) return;
    setIsLoading(true);
    try {
      const [latestRes, historyRes] = await Promise.all([
        fetchLatestTelemetry(selectedDevice),
        fetchTelemetryHistory(selectedDevice, timeRange, limit),
      ]);

      setLatest(latestRes);
      setHistory(historyRes);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error al actualizar telemetría:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDevice, timeRange, limit]);

  // Carga inicial
  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling / Refresco automático
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      loadData();
    }, autoRefreshInterval);
    return () => clearInterval(timer);
  }, [autoRefreshInterval, loadData]);

  // Cálculos estadísticos (Mínimos y Máximos) del histórico
  const stats = useMemo(() => {
    const calc = (key: keyof Measurement) => {
      const values = history
        .map((h) => h[key])
        .filter((v): v is number => typeof v === 'number' && !isNaN(v));
      if (values.length === 0) return { min: null, max: null };
      return {
        min: Math.min(...values),
        max: Math.max(...values),
      };
    };

    return {
      temp: calc('temperature'),
      hum: calc('humidity'),
      soil: calc('soilMoisture'),
      light: calc('light'),
      co2: calc('co2'),
    };
  }, [history]);

  // Alternar métrica visible en el gráfico
  const handleToggleMetric = (metric: 'temperature' | 'humidity' | 'soilMoisture' | 'light' | 'co2') => {
    setActiveMetrics((prev) => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  };

  // Exportar histórico a CSV
  const handleExportCSV = () => {
    if (history.length === 0) return;

    const headers = [
      'ID',
      'Dispositivo',
      'Fecha_Hora',
      'Temperatura_C',
      'Humedad_Relativa_%',
      'Humedad_Suelo_%',
      'Luminosidad_Lux',
      'CO2_ppm',
      'Bomba_Riego',
      'Extractor',
      'Luz_Cultivo',
    ];

    const rows = history.map((m) => [
      m.id,
      m.deviceId,
      `"${new Date(m.recordedAt).toISOString()}"`,
      m.temperature ?? '',
      m.humidity ?? '',
      m.soilMoisture ?? '',
      m.light ?? '',
      m.co2 ?? '',
      m.waterPump ? 'SI' : 'NO',
      m.exhaustFan ? 'SI' : 'NO',
      m.growLight ? 'SI' : 'NO',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `telemetria_${selectedDevice}_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-container">
      {/* Barra Superior de Control */}
      <Header
        devices={devices}
        selectedDevice={selectedDevice}
        onSelectDevice={setSelectedDevice}
        onRefresh={loadData}
        isLoading={isLoading}
        lastUpdated={lastUpdated}
        autoRefreshInterval={autoRefreshInterval}
        onSetAutoRefreshInterval={setAutoRefreshInterval}
        onOpenSimulateModal={() => setIsSimulateModalOpen(true)}
      />

      {/* Tarjetas KPI de Estado Actual */}
      <section className="metrics-grid">
        <MetricCard
          title="Temperatura Ambiente"
          value={latest?.temperature}
          unit="°C"
          icon={Thermometer}
          theme="temp"
          idealRange="Rango óptimo: 18 - 26 °C"
          statusText={
            latest?.temperature
              ? latest.temperature > 28
                ? 'Elevada'
                : latest.temperature < 16
                ? 'Baja'
                : 'Óptima'
              : undefined
          }
          statusType={
            latest?.temperature
              ? latest.temperature > 30 || latest.temperature < 14
                ? 'alert'
                : latest.temperature > 26 || latest.temperature < 18
                ? 'warning'
                : 'optimal'
              : undefined
          }
          min={stats.temp.min}
          max={stats.temp.max}
        />

        <MetricCard
          title="Humedad Relativa"
          value={latest?.humidity}
          unit="%"
          icon={Droplets}
          theme="humidity"
          idealRange="Rango óptimo: 60 - 80 %"
          statusText={
            latest?.humidity
              ? latest.humidity < 40
                ? 'Aire Seco'
                : latest.humidity > 85
                ? 'Saturado'
                : 'Ideal'
              : undefined
          }
          statusType={
            latest?.humidity
              ? latest.humidity < 40 || latest.humidity > 90
                ? 'warning'
                : 'optimal'
              : undefined
          }
          min={stats.hum.min}
          max={stats.hum.max}
        />

        <MetricCard
          title="Humedad del Suelo"
          value={latest?.soilMoisture}
          unit="%"
          icon={Mountain}
          theme="soil"
          idealRange="Rango óptimo: 45 - 70 %"
          statusText={
            latest?.soilMoisture
              ? latest.soilMoisture < 35
                ? 'Requiere Riego'
                : 'Sustrato Húmedo'
              : undefined
          }
          statusType={
            latest?.soilMoisture
              ? latest.soilMoisture < 35
                ? 'alert'
                : 'optimal'
              : undefined
          }
          min={stats.soil.min}
          max={stats.soil.max}
        />

        <MetricCard
          title="Luminosidad"
          value={latest?.light}
          unit="Lux"
          icon={Sun}
          theme="light"
          idealRange="Rango óptimo: 800 - 2500 Lux"
          statusText={
            latest?.light
              ? latest.light < 400
                ? 'Luz Escasa'
                : 'Iluminación Adecuada'
              : undefined
          }
          statusType="optimal"
          min={stats.light.min}
          max={stats.light.max}
        />

        <MetricCard
          title="Dióxido de Carbono"
          value={latest?.co2}
          unit="ppm"
          icon={Activity}
          theme="co2"
          idealRange="Rango normal: 380 - 600 ppm"
          statusText={
            latest?.co2
              ? latest.co2 > 1000
                ? 'Ventilar Vivero'
                : 'Nivel Normal'
              : undefined
          }
          statusType={latest?.co2 && latest.co2 > 1000 ? 'warning' : 'optimal'}
          min={stats.co2.min}
          max={stats.co2.max}
        />
      </section>

      {/* Panel de Actuadores y Relés en Tiempo Real */}
      <ActuatorsPanel
        waterPump={latest?.waterPump}
        exhaustFan={latest?.exhaustFan}
        growLight={latest?.growLight}
      />

      {/* Barra de Filtros para Gráficos e Histórico */}
      <FiltersBar
        timeRange={timeRange}
        onChangeTimeRange={setTimeRange}
        limit={limit}
        onChangeLimit={setLimit}
        activeMetrics={activeMetrics}
        onToggleMetric={handleToggleMetric}
        onExportCSV={handleExportCSV}
        totalRecords={history.length}
      />

      {/* Gráfico Temporal Interactivo */}
      <TelemetryChart data={history} activeMetrics={activeMetrics} />

      {/* Tabla Detallada con Paginación */}
      <RecentTable data={history} />

      {/* Modal para simular envío de datos desde el navegador */}
      <SimulateModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        deviceId={selectedDevice}
        onSuccess={() => {
          loadDevices();
          loadData();
        }}
      />
    </div>
  );
}

export default App;
