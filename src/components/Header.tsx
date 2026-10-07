import React from 'react';
import type { Device } from '../types/telemetry';
import { Sprout, RefreshCw, PlusCircle, CheckCircle2, Clock, ChevronDown, Cpu } from 'lucide-react';

interface HeaderProps {
  devices: Device[];
  selectedDevice: string;
  onSelectDevice: (deviceId: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  lastUpdated: Date | null;
  autoRefreshInterval: number;
  onSetAutoRefreshInterval: (ms: number) => void;
  onOpenSimulateModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  devices,
  selectedDevice,
  onSelectDevice,
  onRefresh,
  isLoading,
  lastUpdated,
  autoRefreshInterval,
  onSetAutoRefreshInterval,
  onOpenSimulateModal,
}) => {
  return (
    <header className="header-card">
      <div className="brand-section">
        <div className="brand-icon-box">
          <Sprout size={26} strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="brand-title">Vivero Smart</h1>
          <p className="brand-subtitle">Panel de Monitoreo Ambiental e IoT</p>
        </div>
      </div>

      <div className="header-controls">
        {/* Selector de Dispositivo */}
        <div className="select-wrapper">
          <Cpu size={16} className="select-icon-left" />
          <select
            className="custom-select"
            value={selectedDevice}
            onChange={(e) => onSelectDevice(e.target.value)}
          >
            {devices.length === 0 ? (
              <option value="vivero-nodo-01">Dispositivo vivero-nodo-01</option>
            ) : (
              devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.id})
                </option>
              ))
            )}
          </select>
          <ChevronDown size={14} className="select-icon-right" />
        </div>

        {/* Selector de Intervalo de Refresco */}
        <div className="select-wrapper">
          <Clock size={16} className="select-icon-left" />
          <select
            className="custom-select interval-select"
            value={autoRefreshInterval}
            onChange={(e) => onSetAutoRefreshInterval(Number(e.target.value))}
          >
            <option value={5000}>Cada 5s</option>
            <option value={10000}>Cada 10s</option>
            <option value={30000}>Cada 30s</option>
            <option value={60000}>Cada 1m</option>
            <option value={0}>Pausado</option>
          </select>
          <ChevronDown size={14} className="select-icon-right" />
        </div>

        {/* Botón Refrescar */}
        <button
          className="btn btn-secondary"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refrescar datos ahora"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          <span>Refrescar</span>
        </button>

        {/* Botón Simular Envío */}
        <button
          className="btn btn-primary"
          onClick={onOpenSimulateModal}
          title="Simular envío de telemetría HTTP desde el navegador"
        >
          <PlusCircle size={16} />
          <span>Simular Envío</span>
        </button>

        {/* Estado y Sincronización */}
        <div className="sync-status-group">
          <div className="status-badge status-online">
            <span className="status-dot"></span>
            <CheckCircle2 size={14} />
            <span>En Línea</span>
          </div>

          {lastUpdated && (
            <div className="last-sync-badge" title="Hora de la última sincronización">
              <Clock size={13} />
              <span>{lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
