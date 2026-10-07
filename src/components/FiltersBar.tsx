import React from 'react';
import type { TimeRangePreset } from '../types/telemetry';
import { Calendar, Download, Eye, Layers } from 'lucide-react';

interface FiltersBarProps {
  timeRange: TimeRangePreset;
  onChangeTimeRange: (range: TimeRangePreset) => void;
  limit: number;
  onChangeLimit: (limit: number) => void;
  activeMetrics: {
    temperature: boolean;
    humidity: boolean;
    soilMoisture: boolean;
    light: boolean;
    co2: boolean;
  };
  onToggleMetric: (metric: 'temperature' | 'humidity' | 'soilMoisture' | 'light' | 'co2') => void;
  onExportCSV: () => void;
  totalRecords: number;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  timeRange,
  onChangeTimeRange,
  limit,
  onChangeLimit,
  activeMetrics,
  onToggleMetric,
  onExportCSV,
  totalRecords,
}) => {
  const timePresets: { id: TimeRangePreset; label: string }[] = [
    { id: '1h', label: '1 Hora' },
    { id: '6h', label: '6 Horas' },
    { id: '24h', label: '24 Horas' },
    { id: '7d', label: '7 Días' },
    { id: 'all', label: 'Todo' },
  ];

  return (
    <div className="filters-card">
      <div className="filters-top-row">
        {/* Filtro de Rango Temporal */}
        <div className="filter-group">
          <span className="filter-label">
            <Calendar size={16} />
            <span>Ventana Temporal:</span>
          </span>
          <div className="pill-selector">
            {timePresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`pill-btn ${timeRange === preset.id ? 'active' : ''}`}
                onClick={() => onChangeTimeRange(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Límite y Exportación */}
        <div className="filter-actions-right">
          <div className="filter-group">
            <span className="filter-label">
              <Layers size={16} />
              <span>Registros:</span>
            </span>
            <select
              className="limit-select"
              value={limit}
              onChange={(e) => onChangeLimit(Number(e.target.value))}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={onExportCSV}
            title="Descargar histórico en CSV"
          >
            <Download size={16} />
            <span>Exportar CSV</span>
          </button>

          <span className="records-counter-badge">
            {totalRecords} mediciones
          </span>
        </div>
      </div>

      {/* Selector de Métricas Visibles en Gráficos */}
      <div className="metric-toggles-row">
        <span className="filter-label">
          <Eye size={16} />
          <span>Variables en Gráfico:</span>
        </span>
        <div className="metric-checkboxes">
          <label className={`metric-check-label check-temp ${activeMetrics.temperature ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={activeMetrics.temperature}
              onChange={() => onToggleMetric('temperature')}
            />
            <span className="dot temp-dot"></span>
            <span>Temperatura (°C)</span>
          </label>

          <label className={`metric-check-label check-hum ${activeMetrics.humidity ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={activeMetrics.humidity}
              onChange={() => onToggleMetric('humidity')}
            />
            <span className="dot hum-dot"></span>
            <span>Humedad Ambiente (%)</span>
          </label>

          <label className={`metric-check-label check-soil ${activeMetrics.soilMoisture ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={activeMetrics.soilMoisture}
              onChange={() => onToggleMetric('soilMoisture')}
            />
            <span className="dot soil-dot"></span>
            <span>Humedad Suelo (%)</span>
          </label>

          <label className={`metric-check-label check-light ${activeMetrics.light ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={activeMetrics.light}
              onChange={() => onToggleMetric('light')}
            />
            <span className="dot light-dot"></span>
            <span>Luminosidad (Lux)</span>
          </label>

          <label className={`metric-check-label check-co2 ${activeMetrics.co2 ? 'selected' : ''}`}>
            <input
              type="checkbox"
              checked={activeMetrics.co2}
              onChange={() => onToggleMetric('co2')}
            />
            <span className="dot co2-dot"></span>
            <span>CO₂ (ppm)</span>
          </label>
        </div>
      </div>
    </div>
  );
};
