import React, { useState } from 'react';
import type { Measurement } from '../types/telemetry';
import { LineChart as LineChartIcon, Info } from 'lucide-react';

interface TelemetryChartProps {
  data: Measurement[];
  activeMetrics: {
    temperature: boolean;
    humidity: boolean;
    soilMoisture: boolean;
    light: boolean;
    co2: boolean;
  };
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ data, activeMetrics }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Orden cronológico ascendente (antiguos a recientes)
  const sortedData = [...data].reverse();

  if (sortedData.length === 0) {
    return (
      <div className="chart-card empty-chart-card">
        <Info size={28} className="empty-icon" />
        <h3 className="empty-title">Sin datos históricos para el rango seleccionado</h3>
        <p className="empty-desc">
          No se encontraron mediciones registradas para este nodo. Envía una medición desde el Arduino o usa el botón &quot;Simular Envío&quot;.
        </p>
      </div>
    );
  }

  // Dimensiones del canvas SVG full-width y nítido
  const width = 1200;
  const height = 360;
  const padding = { top: 30, right: 30, bottom: 45, left: 55 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Escala X
  const getX = (index: number) => {
    if (sortedData.length <= 1) return padding.left + chartW / 2;
    return padding.left + (index / (sortedData.length - 1)) * chartW;
  };

  // Series con sus respectivos rangos de escala
  const seriesConfig = [
    {
      key: 'temperature' as const,
      name: 'Temperatura',
      unit: '°C',
      color: '#ea580c',
      active: activeMetrics.temperature,
      minVal: 0,
      maxVal: 50,
    },
    {
      key: 'humidity' as const,
      name: 'Humedad Relativa',
      unit: '%',
      color: '#0284c7',
      active: activeMetrics.humidity,
      minVal: 0,
      maxVal: 100,
    },
    {
      key: 'soilMoisture' as const,
      name: 'Humedad Suelo',
      unit: '%',
      color: '#0d9488',
      active: activeMetrics.soilMoisture,
      minVal: 0,
      maxVal: 100,
    },
    {
      key: 'light' as const,
      name: 'Luminosidad',
      unit: 'Lux',
      color: '#d97706',
      active: activeMetrics.light,
      minVal: 0,
      maxVal: 2000,
    },
    {
      key: 'co2' as const,
      name: 'CO₂',
      unit: 'ppm',
      color: '#7c3aed',
      active: activeMetrics.co2,
      minVal: 300,
      maxVal: 1500,
    },
  ];

  // Generar path SVG para una serie
  const generatePath = (
    key: 'temperature' | 'humidity' | 'soilMoisture' | 'light' | 'co2',
    minVal: number,
    maxVal: number
  ) => {
    const points: [number, number][] = [];

    sortedData.forEach((d, i) => {
      const val = d[key];
      if (val !== null && val !== undefined) {
        const x = getX(i);
        const clamped = Math.max(minVal, Math.min(maxVal, val));
        const y = padding.top + chartH - ((clamped - minVal) / (maxVal - minVal)) * chartH;
        points.push([x, y]);
      }
    });

    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M ${points[0][0] - 2} ${points[0][1]} L ${points[0][0] + 2} ${points[0][1]}`;
    }

    return points.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr[0]} ${curr[1]}` : `${acc} L ${curr[0]} ${curr[1]}`;
    }, '');
  };

  // Generar área sombreada bajo la curva
  const generateAreaPath = (
    key: 'temperature' | 'humidity' | 'soilMoisture' | 'light' | 'co2',
    minVal: number,
    maxVal: number
  ) => {
    const points: [number, number][] = [];
    sortedData.forEach((d, i) => {
      const val = d[key];
      if (val !== null && val !== undefined) {
        const x = getX(i);
        const clamped = Math.max(minVal, Math.min(maxVal, val));
        const y = padding.top + chartH - ((clamped - minVal) / (maxVal - minVal)) * chartH;
        points.push([x, y]);
      }
    });

    if (points.length < 2) return '';
    const firstX = points[0][0];
    const lastX = points[points.length - 1][0];
    const bottomY = padding.top + chartH;

    const linePath = points.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr[0]} ${curr[1]}` : `${acc} L ${curr[0]} ${curr[1]}`;
    }, '');

    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const activeHoverItem =
    hoverIndex !== null && hoverIndex >= 0 && hoverIndex < sortedData.length
      ? sortedData[hoverIndex]
      : null;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title-wrap">
          <LineChartIcon size={22} className="chart-icon" />
          <div>
            <h2 className="card-title">Comportamiento Temporal de Sensores</h2>
            <p className="card-subtitle">Evolución de mediciones en la ventana seleccionada</p>
          </div>
        </div>
        <div className="chart-legend">
          {seriesConfig
            .filter((s) => s.active)
            .map((s) => (
              <div key={s.key} className="legend-item">
                <span className="legend-indicator" style={{ backgroundColor: s.color }}></span>
                <span>
                  {s.name} ({s.unit})
                </span>
              </div>
            ))}
        </div>
      </div>

      <div className="svg-container">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="telemetry-svg"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clientX = e.clientX - rect.left;
            const svgX = (clientX / rect.width) * width;
            const relativeX = svgX - padding.left;
            const ratio = Math.max(0, Math.min(1, relativeX / chartW));
            const idx = Math.round(ratio * (sortedData.length - 1));
            setHoverIndex(idx);
          }}
        >
          <defs>
            {seriesConfig.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Líneas de Grilla Horizontal */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartH * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1.5"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight="600"
                  fill="#94a3b8"
                >
                  {Math.round(100 - ratio * 100)}%
                </text>
              </g>
            );
          })}

          {/* Relleno con gradientes suaves */}
          {seriesConfig.map((s) => {
            if (!s.active) return null;
            const areaPath = generateAreaPath(s.key, s.minVal, s.maxVal);
            if (!areaPath) return null;

            return (
              <path
                key={`area-${s.key}`}
                d={areaPath}
                fill={`url(#grad-${s.key})`}
                opacity="0.8"
              />
            );
          })}

          {/* Líneas de la serie */}
          {seriesConfig.map((s) => {
            if (!s.active) return null;
            const pathData = generatePath(s.key, s.minVal, s.maxVal);
            if (!pathData) return null;

            return (
              <g key={s.key}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Marcador de Hover */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={padding.top + chartH}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {seriesConfig.map((s) => {
                if (!s.active) return null;
                const d = sortedData[hoverIndex];
                const val = d ? d[s.key] : null;
                if (val === null || val === undefined) return null;
                const clamped = Math.max(s.minVal, Math.min(s.maxVal, val));
                const y = padding.top + chartH - ((clamped - s.minVal) / (s.maxVal - s.minVal)) * chartH;

                return (
                  <circle
                    key={s.key}
                    cx={getX(hoverIndex)}
                    cy={y}
                    r="5.5"
                    fill="#ffffff"
                    stroke={s.color}
                    strokeWidth="3"
                  />
                );
              })}
            </g>
          )}

          {/* Etiquetas del Eje X */}
          {sortedData.map((d, i) => {
            const step = Math.max(1, Math.floor(sortedData.length / 7));
            if (i % step !== 0 && i !== sortedData.length - 1) return null;

            const date = new Date(d.recordedAt);
            const timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <text
                key={d.id}
                x={getX(i)}
                y={height - 12}
                textAnchor="middle"
                fontSize="11"
                fontWeight="500"
                fill="#64748b"
              >
                {timeLabel}
              </text>
            );
          })}
        </svg>

        {/* Tooltip Flotante */}
        {activeHoverItem && hoverIndex !== null && (
          <div
            className="chart-tooltip"
            style={{
              left: `${(getX(hoverIndex) / width) * 100}%`,
              transform: getX(hoverIndex) > width / 2 ? 'translateX(-105%)' : 'translateX(10%)',
            }}
          >
            <div className="tooltip-time">
              {new Date(activeHoverItem.recordedAt).toLocaleString()}
            </div>
            <div className="tooltip-values">
              {activeMetrics.temperature && (
                <div className="tooltip-row">
                  <span className="dot temp-dot"></span>
                  <span>Temp:</span>
                  <strong>{activeHoverItem.temperature?.toFixed(1) ?? '--'} °C</strong>
                </div>
              )}
              {activeMetrics.humidity && (
                <div className="tooltip-row">
                  <span className="dot hum-dot"></span>
                  <span>Humedad:</span>
                  <strong>{activeHoverItem.humidity?.toFixed(1) ?? '--'} %</strong>
                </div>
              )}
              {activeMetrics.soilMoisture && (
                <div className="tooltip-row">
                  <span className="dot soil-dot"></span>
                  <span>Suelo:</span>
                  <strong>{activeHoverItem.soilMoisture?.toFixed(1) ?? '--'} %</strong>
                </div>
              )}
              {activeMetrics.light && (
                <div className="tooltip-row">
                  <span className="dot light-dot"></span>
                  <span>Luz:</span>
                  <strong>{activeHoverItem.light?.toFixed(0) ?? '--'} Lux</strong>
                </div>
              )}
              {activeMetrics.co2 && (
                <div className="tooltip-row">
                  <span className="dot co2-dot"></span>
                  <span>CO₂:</span>
                  <strong>{activeHoverItem.co2?.toFixed(0) ?? '--'} ppm</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
