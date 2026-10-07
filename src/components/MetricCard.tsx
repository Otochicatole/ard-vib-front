import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | null | undefined;
  unit: string;
  icon: LucideIcon;
  theme: 'temp' | 'humidity' | 'soil' | 'light' | 'co2';
  idealRange: string;
  statusText?: string;
  statusType?: 'optimal' | 'warning' | 'alert';
  min?: number | null;
  max?: number | null;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  theme,
  idealRange,
  statusText = 'Óptimo',
  statusType = 'optimal',
  min,
  max,
}) => {
  const formattedValue =
    value !== null && value !== undefined
      ? theme === 'light' || theme === 'co2'
        ? Math.round(value).toString()
        : value.toFixed(1)
      : '--';

  return (
    <div className={`metric-card theme-${theme}`}>
      <div className="metric-header">
        <div className="metric-info">
          <span className="metric-title">{title}</span>
          <span className="metric-ideal">{idealRange}</span>
        </div>
        <div className={`metric-icon-box theme-${theme}`}>
          <Icon size={20} />
        </div>
      </div>

      <div className="metric-body">
        <div className="metric-value-wrapper">
          <span className="metric-value">{formattedValue}</span>
          <span className="metric-unit">{unit}</span>
        </div>

        {value !== null && value !== undefined && statusText && (
          <span className={`metric-badge badge-${statusType}`}>
            {statusText}
          </span>
        )}
      </div>

      {min !== undefined && max !== undefined && min !== null && max !== null && (
        <div className="metric-footer">
          <div className="metric-stat">
            <span className="stat-label">Mínimo:</span>
            <span className="stat-val">
              {theme === 'light' || theme === 'co2' ? Math.round(min) : min.toFixed(1)} {unit}
            </span>
          </div>
          <div className="metric-stat-divider"></div>
          <div className="metric-stat">
            <span className="stat-label">Máximo:</span>
            <span className="stat-val">
              {theme === 'light' || theme === 'co2' ? Math.round(max) : max.toFixed(1)} {unit}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
