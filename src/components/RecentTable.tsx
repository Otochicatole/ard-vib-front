import React, { useState } from 'react';
import type { Measurement } from '../types/telemetry';
import { Table, ChevronLeft, ChevronRight } from 'lucide-react';

interface RecentTableProps {
  data: Measurement[];
}

export const RecentTable: React.FC<RecentTableProps> = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="table-card">
      <div className="table-header-clean">
        <div className="table-title-wrap">
          <Table size={18} className="table-icon" />
          <h2 className="card-title">Registros Recientes de Telemetría</h2>
        </div>
        <div className="table-pagination-nav">
          <span className="pagination-info">
            Página {currentPage} de {totalPages} ({data.length} totales)
          </span>
          <div className="pagination-buttons">
            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              title="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              title="Página siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Temperatura</th>
              <th>Humedad Amb.</th>
              <th>Humedad Suelo</th>
              <th>Luminosidad</th>
              <th>CO₂</th>
              <th>Bomba</th>
              <th>Extractor</th>
              <th>Luz Cultivo</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  No hay mediciones para mostrar
                </td>
              </tr>
            ) : (
              paginatedData.map((m) => {
                const date = new Date(m.recordedAt);
                return (
                  <tr key={m.id}>
                    <td className="cell-date">{date.toLocaleString()}</td>
                    <td>{m.temperature !== null ? `${m.temperature.toFixed(1)} °C` : '--'}</td>
                    <td>{m.humidity !== null ? `${m.humidity.toFixed(1)} %` : '--'}</td>
                    <td>{m.soilMoisture !== null ? `${m.soilMoisture.toFixed(1)} %` : '--'}</td>
                    <td>{m.light !== null ? `${Math.round(m.light)} Lux` : '--'}</td>
                    <td>{m.co2 !== null ? `${Math.round(m.co2)} ppm` : '--'}</td>
                    <td>
                      <span className={m.waterPump ? 'badge-cell-active' : 'badge-cell-inactive'}>
                        {m.waterPump ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <span className={m.exhaustFan ? 'badge-cell-active' : 'badge-cell-inactive'}>
                        {m.exhaustFan ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <span className={m.growLight ? 'badge-cell-active' : 'badge-cell-inactive'}>
                        {m.growLight ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
